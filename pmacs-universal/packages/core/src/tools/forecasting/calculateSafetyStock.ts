/**
 * Calculate Safety Stock Tool
 * Calculate optimal safety stock level using Wilson formula
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import type { DatabaseAdapter } from '../../database/CSVAdapter.js';
import { calculateSafetyStock } from '../../utils/forecasting.js';
import { smartDrugMatch } from '../../utils/fuzzyMatch.js';

export function createCalculateSafetyStockTool(db: DatabaseAdapter) {
  return new DynamicStructuredTool({
    name: 'calculate_safety_stock',
    description: `
Calculate optimal safety stock level for a drug using statistical methods.
Uses Wilson formula with service level and lead time considerations.

Use this for queries like:
- "Calculate safety stock for Propofol"
- "What should be the safety level for Morphine?"
- "Recalculate safety stock for ICU drugs"
    `.trim(),

    schema: z.object({
      drugName: z.string().describe('Name of the drug'),
      location: z.string().optional().describe('Specific location (optional - calculates for all if not provided)'),
      serviceLevel: z.number().min(0.8).max(0.99).optional().default(0.95).describe('Service level (0.90, 0.95, 0.98, 0.99) - default 0.95'),
      leadTimeDays: z.number().int().min(1).max(30).optional().default(7).describe('Lead time in days (default: 7)'),
    }),

    func: async ({ drugName, location, serviceLevel, leadTimeDays }) => {
      try {
        const inventory = await db.loadInventory();

        // Find drug (fuzzy match)
        let matches = inventory.filter(item =>
          smartDrugMatch(drugName, item.drugName)
        );

        if (matches.length === 0) {
          return JSON.stringify({
            error: true,
            notFound: true,
            message: `Drug "${drugName}" not found in inventory`,
          });
        }

        // Filter by location if specified
        if (location) {
          matches = matches.filter(item =>
            item.location.toLowerCase().includes(location.toLowerCase())
          );

          if (matches.length === 0) {
            return JSON.stringify({
              error: true,
              notFound: true,
              message: `Drug "${drugName}" not found at location "${location}"`,
            });
          }
        }

        // Calculate safety stock for each location
        const results = matches.map(item => {
          const safetyStock = calculateSafetyStock(
            item.avgDailyUse,
            leadTimeDays,
            serviceLevel
          );

          const currentSafetyStock = item.safetyStock;
          const difference = safetyStock - currentSafetyStock;
          const percentChange = currentSafetyStock > 0
            ? (difference / currentSafetyStock) * 100
            : 0;

          return {
            location: item.location,
            currentSafetyStock,
            recommendedSafetyStock: safetyStock,
            difference,
            percentChange: Math.round(percentChange),
            currentStock: item.qtyOnHand,
            avgDailyUse: item.avgDailyUse,
            needsAdjustment: Math.abs(percentChange) > 10, // >10% change
          };
        });

        const totalAdjustmentsNeeded = results.filter(r => r.needsAdjustment).length;

        return JSON.stringify({
          drugName: matches[0].drugName,
          parameters: {
            serviceLevel: `${serviceLevel * 100}%`,
            leadTimeDays,
          },

          summary: {
            locationsAnalyzed: results.length,
            adjustmentsNeeded: totalAdjustmentsNeeded,
            totalCurrentSafetyStock: results.reduce((s, r) => s + r.currentSafetyStock, 0),
            totalRecommendedSafetyStock: results.reduce((s, r) => s + r.recommendedSafetyStock, 0),
          },

          locations: results,

          alertLevel: totalAdjustmentsNeeded > 0 ? 'warning' : 'info',

          alertMessage: totalAdjustmentsNeeded > 0
            ? `${totalAdjustmentsNeeded} location(s) need safety stock adjustment`
            : 'Current safety stock levels are adequate',

          recommendations: results
            .filter(r => r.needsAdjustment)
            .map(r => `${r.location}: Adjust from ${r.currentSafetyStock} to ${r.recommendedSafetyStock} units (${r.difference > 0 ? '+' : ''}${r.difference})`),

          actions: ['update_safety_stock', 'download_report'],
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error calculating safety stock: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    },
  });
}

export default createCalculateSafetyStockTool;
