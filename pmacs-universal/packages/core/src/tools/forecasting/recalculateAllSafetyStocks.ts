/**
 * Recalculate All Safety Stocks Tool
 * Batch recalculation of safety stock levels based on usage patterns
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import type { DatabaseAdapter } from '../../database/CSVAdapter.js';
import { calculateSafetyStockWilson } from '../../utils/forecasting.js';
import { enrichInventoryItem } from '../../database/models.js';

export function createRecalculateAllSafetyStocksTool(db: DatabaseAdapter) {
  return new DynamicStructuredTool({
    name: 'recalculate_all_safety_stocks',
    description: `
Recalculate optimal safety stock levels for all drugs based on actual usage.
Uses Wilson formula with service level adjustment.

Use this for queries like:
- "Recalculate safety stocks"
- "Update all safety stock levels"
- "Optimize safety stocks"
- "Recalculate par levels"
    `.trim(),

    schema: z.object({
      serviceLevel: z.number().min(0.5).max(0.99).optional().default(0.95).describe('Target service level (0.50-0.99, default: 0.95)'),
      leadTimeDays: z.number().int().min(1).max(30).optional().default(7).describe('Supplier lead time in days (default: 7)'),
      updateDatabase: z.boolean().optional().default(false).describe('Actually update database with new values (default: false - preview only)'),
      category: z.string().optional().describe('Only recalculate specific category: controlled, refrigerated, standard (optional)'),
    }),

    func: async ({ serviceLevel, leadTimeDays, updateDatabase, category }) => {
      try {
        const rawInventory = await db.loadInventory();
        const inventory = rawInventory.map(item => enrichInventoryItem(item));
        const transactions = await db.loadTransactions(60); // 60 days for good statistical base

        // Filter by category if specified
        let relevantInventory = inventory;
        if (category) {
          relevantInventory = inventory.filter(item =>
            item.category.toLowerCase() === category.toLowerCase()
          );
        }

        // Calculate usage for each drug
        const drugUsage = new Map<string, number[]>();
        for (const txn of transactions) {
          if (txn.action !== 'USE') continue;

          const existing = drugUsage.get(txn.drugId) || [];
          existing.push(Math.abs(txn.qtyChange));
          drugUsage.set(txn.drugId, existing);
        }

        // Recalculate safety stocks
        const recalculations = [];
        let updatedCount = 0;
        let skippedCount = 0;

        for (const item of relevantInventory) {
          const usage = drugUsage.get(item.drugId);

          // Skip if insufficient data
          if (!usage || usage.length < 5) {
            skippedCount++;
            continue;
          }

          // Calculate statistics
          const avgDailyUsage = usage.reduce((sum, u) => sum + u, 0) / 60;
          const variance = usage.reduce((sum, u) => sum + Math.pow(u - avgDailyUsage, 2), 0) / usage.length;
          const stdDev = Math.sqrt(variance);

          // Calculate new safety stock using Wilson formula
          const newSafetyStock = calculateSafetyStockWilson(
            avgDailyUsage,
            stdDev,
            leadTimeDays,
            serviceLevel
          );

          const currentSafetyStock = item.safetyStock;
          const difference = newSafetyStock - currentSafetyStock;
          const percentChange = currentSafetyStock > 0
            ? (difference / currentSafetyStock) * 100
            : 0;

          // Determine if significant change
          const isSignificantChange = Math.abs(percentChange) >= 10;

          // Category multipliers for controlled/refrigerated
          let finalSafetyStock = newSafetyStock;
          if (item.category === 'controlled') {
            finalSafetyStock = Math.ceil(newSafetyStock * 1.1); // 10% extra buffer
          } else if (item.category === 'refrigerated') {
            finalSafetyStock = Math.ceil(newSafetyStock * 1.05); // 5% extra buffer
          } else {
            finalSafetyStock = Math.ceil(newSafetyStock);
          }

          recalculations.push({
            drugId: item.drugId,
            drugName: item.drugName,
            category: item.category,
            location: item.location,

            current: {
              safetyStock: currentSafetyStock,
              avgDailyUsage: item.avgDailyUse || 0,
            },

            calculated: {
              avgDailyUsage: avgDailyUsage.toFixed(2),
              stdDev: stdDev.toFixed(2),
              variability: stdDev > 0 ? ((stdDev / avgDailyUsage) * 100).toFixed(1) + '%' : 'N/A',
              newSafetyStock: finalSafetyStock,
              difference,
              percentChange: percentChange.toFixed(1) + '%',
            },

            recommendation: {
              action: Math.abs(percentChange) < 5 ? 'KEEP_CURRENT' :
                percentChange > 20 ? 'INCREASE_SIGNIFICANTLY' :
                  percentChange > 10 ? 'INCREASE' :
                    percentChange < -20 ? 'DECREASE_SIGNIFICANTLY' :
                      percentChange < -10 ? 'DECREASE' : 'MINOR_ADJUSTMENT',

              isSignificantChange,

              note: Math.abs(percentChange) < 5
                ? 'Current safety stock is optimal'
                : percentChange > 20
                  ? `Increase safety stock by ${Math.abs(percentChange).toFixed(0)}% due to higher usage/variability`
                  : percentChange > 10
                    ? `Moderate increase recommended`
                    : percentChange < -20
                      ? `Significant decrease possible - usage has declined`
                      : percentChange < -10
                        ? `Moderate decrease recommended`
                        : 'Minor adjustment suggested',
            },

            usagePattern: {
              transactionCount: usage.length,
              minUsage: Math.min(...usage),
              maxUsage: Math.max(...usage),
              usageSpread: (Math.max(...usage) - Math.min(...usage)).toFixed(0),
            },
          });

          // Update database if requested and change is significant
          if (updateDatabase && isSignificantChange) {
            await db.updateInventoryItem(item.drugId, {
              safetyStock: finalSafetyStock,
              avgDailyUse: parseFloat(avgDailyUsage.toFixed(2)),
            });
            updatedCount++;
          }
        }

        // Sort by significance of change
        recalculations.sort((a, b) =>
          Math.abs(parseFloat(b.calculated.percentChange)) - Math.abs(parseFloat(a.calculated.percentChange))
        );

        // Calculate summary statistics
        const significantIncreases = recalculations.filter(r =>
          parseFloat(r.calculated.percentChange) >= 10
        );
        const significantDecreases = recalculations.filter(r =>
          parseFloat(r.calculated.percentChange) <= -10
        );
        const minorAdjustments = recalculations.filter(r =>
          Math.abs(parseFloat(r.calculated.percentChange)) < 10 &&
          Math.abs(parseFloat(r.calculated.percentChange)) >= 5
        );
        const noChange = recalculations.filter(r =>
          Math.abs(parseFloat(r.calculated.percentChange)) < 5
        );

        const highVariability = recalculations.filter(r =>
          parseFloat(r.calculated.variability.replace('%', '')) > 50
        );

        return JSON.stringify({
          found: true,
          serviceLevel,
          leadTimeDays,
          category,
          updateDatabase,

          summary: {
            totalAnalyzed: recalculations.length,
            skippedDueToInsufficientData: skippedCount,
            updated: updatedCount,
            byRecommendation: {
              significantIncreases: significantIncreases.length,
              significantDecreases: significantDecreases.length,
              minorAdjustments: minorAdjustments.length,
              keepCurrent: noChange.length,
            },
            highVariabilityDrugs: highVariability.length,
            status: updateDatabase
              ? `Updated ${updatedCount} drug(s) with significant changes`
              : 'PREVIEW MODE - No changes made to database',
          },

          alertLevel: significantIncreases.length + significantDecreases.length > 10 ? 'warning' : 'info',

          alertMessage: updateDatabase
            ? `Safety stocks recalculated: ${significantIncreases.length} increases, ${significantDecreases.length} decreases`
            : `Preview: ${significantIncreases.length + significantDecreases.length} drug(s) need safety stock adjustment`,

          significantChanges: significantIncreases.length + significantDecreases.length > 0 ? {
            increases: significantIncreases.slice(0, 20).map(r => ({
              drugName: r.drugName,
              category: r.category,
              currentSafetyStock: r.current.safetyStock,
              recommendedSafetyStock: r.calculated.newSafetyStock,
              change: r.calculated.percentChange,
              reason: r.recommendation.note,
            })),
            decreases: significantDecreases.slice(0, 20).map(r => ({
              drugName: r.drugName,
              category: r.category,
              currentSafetyStock: r.current.safetyStock,
              recommendedSafetyStock: r.calculated.newSafetyStock,
              change: r.calculated.percentChange,
              reason: r.recommendation.note,
            })),
          } : undefined,

          recalculations: recalculations.slice(0, 50).map((r, index) => ({
            rank: index + 1,
            drugName: r.drugName,
            category: r.category,
            location: r.location,
            currentSafetyStock: r.current.safetyStock,
            recommendedSafetyStock: r.calculated.newSafetyStock,
            change: r.calculated.percentChange,
            action: r.recommendation.action,
            variability: r.calculated.variability,
          })),

          methodology: {
            formula: 'Wilson Safety Stock Formula',
            serviceLevel: `${(serviceLevel * 100).toFixed(0)}% service level`,
            leadTime: `${leadTimeDays} days`,
            dataPoints: '60-day usage history minimum',
            adjustments: [
              'Controlled substances: +10% buffer',
              'Refrigerated items: +5% buffer',
              'High variability items: Increased safety stock',
            ],
            note: 'Safety stock = Z-score × StdDev × √(Lead Time)',
          },

          recommendations: [
            significantIncreases.length > 0 && `${significantIncreases.length} drug(s) need increased safety stock - usage/variability has risen`,
            significantDecreases.length > 0 && `${significantDecreases.length} drug(s) can reduce safety stock - usage has declined`,
            highVariability.length > 5 && `${highVariability.length} drugs have high variability (>50%) - increased safety stock recommended`,
            !updateDatabase && 'Run with updateDatabase=true to apply changes',
            updateDatabase && updatedCount > 0 && `Successfully updated ${updatedCount} items`,
            'Recalculate safety stocks quarterly to optimize inventory levels',
            'Monitor drugs with high variability more closely',
          ].filter(Boolean),

          financialImpact: {
            note: 'Estimated inventory value changes',
            increases: significantIncreases.length > 0
              ? `${significantIncreases.length} drugs will hold more inventory`
              : 'No increases',
            decreases: significantDecreases.length > 0
              ? `${significantDecreases.length} drugs can reduce inventory (capital freed)`
              : 'No decreases',
            netEffect: significantIncreases.length > significantDecreases.length
              ? 'Increased inventory investment recommended for better service'
              : significantDecreases.length > significantIncreases.length
                ? 'Opportunity to reduce inventory holding costs'
                : 'Balanced adjustments',
          },

          actions: updateDatabase
            ? ['verify_changes', 'update_reorder_points', 'notify_procurement']
            : ['review_recommendations', 'approve_changes', 'rerun_with_update'],

          note: recalculations.length > 50
            ? `Showing top 50 of ${recalculations.length} recalculations. Export for full report.`
            : 'Complete safety stock recalculation displayed.',

          reportDate: new Date().toISOString(),
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error recalculating safety stocks: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    },
  });
}

export default createRecalculateAllSafetyStocksTool;
