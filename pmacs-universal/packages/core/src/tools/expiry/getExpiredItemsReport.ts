/**
 * Expired Items Report Tool
 * Lists all currently expired items requiring disposal
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import type { DatabaseAdapter } from '../../database/CSVAdapter.js';

export function createGetExpiredItemsReportTool(db: DatabaseAdapter) {
  return new DynamicStructuredTool({
    name: 'get_expired_items_report',
    description: `
Generate report of all currently expired items requiring disposal.
Includes disposal recommendations and value calculations.

Use this for queries like:
- "Show expired items"
- "What needs disposal?"
- "Expired drugs report"
- "Items past expiry date"
    `.trim(),

    schema: z.object({
      locationFilter: z.string().optional().describe('Filter by location (optional)'),
      categoryFilter: z.string().optional().describe('Filter by category: controlled, refrigerated, standard (optional)'),
    }),

    func: async ({ locationFilter, categoryFilter }) => {
      try {
        const rawExpiredItems = await db.getExpiredItems();

        // Enrich with computed properties
        const expiredItems = rawExpiredItems.map(item => ({
          ...item,
          estimatedValue: 0, // Pricing data not available
        }));

        let filteredItems = expiredItems;

        // Apply location filter
        if (locationFilter) {
          filteredItems = expiredItems.filter(item =>
            item.location.toLowerCase().includes(locationFilter.toLowerCase())
          );
        }

        // Apply category filter
        if (categoryFilter) {
          filteredItems = filteredItems.filter(item =>
            item.category.toLowerCase() === categoryFilter.toLowerCase()
          );
        }

        if (filteredItems.length === 0) {
          return JSON.stringify({
            found: false,
            locationFilter,
            categoryFilter,
            message: 'No expired items found',
            alertLevel: 'info',
            note: 'All inventory within expiry date - excellent management!',
          });
        }

        // Group by drug
        const drugGroups = new Map<string, typeof filteredItems>();
        for (const item of filteredItems) {
          const existing = drugGroups.get(item.drugName) || [];
          existing.push(item);
          drugGroups.set(item.drugName, existing);
        }

        // Create drug summaries
        const drugSummaries = Array.from(drugGroups.entries()).map(([drug, items]) => {
          const totalQty = items.reduce((sum, item) => sum + item.qtyOnHand, 0);
          const totalValue = items.reduce((sum, item) => sum + item.estimatedValue, 0);
          const locations = new Set(items.map(item => item.location));
          const batches = new Set(items.map(item => item.batchLot));
          const category = items[0].category;

          // Find how long it's been expired
          const maxDaysExpired = Math.max(...items.map(item => Math.abs(item.daysRemaining)));

          return {
            drugName: drug,
            category,
            totalQuantity: totalQty,
            totalBatches: batches.size,
            locations: Array.from(locations),
            totalValue: totalValue.toFixed(2),
            maxDaysExpired,

            batches: items.map(item => ({
              location: item.location,
              batchLot: item.batchLot,
              quantity: item.qtyOnHand,
              expiryDate: item.expiryDate,
              daysExpired: Math.abs(item.daysRemaining),
              estimatedValue: item.estimatedValue.toFixed(2),
            })).sort((a, b) => b.daysExpired - a.daysExpired),

            disposalPriority: category === 'controlled' ? 'HIGH' :
              maxDaysExpired > 90 ? 'HIGH' :
                maxDaysExpired > 30 ? 'MEDIUM' : 'STANDARD',

            disposalMethod: category === 'controlled'
              ? 'Controlled substance disposal protocol with audit trail'
              : category === 'refrigerated'
                ? 'Biohazard disposal following cold chain protocols'
                : 'Standard pharmaceutical waste disposal',

            recommendation: category === 'controlled'
              ? `URGENT: Controlled substance requires witnessed disposal and documentation`
              : maxDaysExpired > 90
                ? `Long expired (${maxDaysExpired} days) - immediate removal required`
                : `Standard disposal protocol - remove from active inventory`,
          };
        });

        // Sort by disposal priority and days expired
        const priorityOrder: any = { HIGH: 0, MEDIUM: 1, STANDARD: 2 };
        drugSummaries.sort((a, b) => {
          const priorityDiff = priorityOrder[a.disposalPriority] - priorityOrder[b.disposalPriority];
          return priorityDiff !== 0 ? priorityDiff : b.maxDaysExpired - a.maxDaysExpired;
        });

        // Calculate summary statistics
        const totalValue = drugSummaries.reduce((sum, d) => sum + parseFloat(d.totalValue), 0);
        const totalQty = drugSummaries.reduce((sum, d) => sum + d.totalQuantity, 0);
        const controlledItems = drugSummaries.filter(d => d.category === 'controlled');
        const highPriority = drugSummaries.filter(d => d.disposalPriority === 'HIGH');
        const locations = new Set(filteredItems.map(i => i.location));

        return JSON.stringify({
          found: true,
          locationFilter,
          categoryFilter,

          summary: {
            totalDrugs: drugSummaries.length,
            totalBatches: filteredItems.length,
            totalQuantity: totalQty,
            totalValueLoss: totalValue.toFixed(2),
            locationsAffected: locations.size,
            byPriority: {
              high: drugSummaries.filter(d => d.disposalPriority === 'HIGH').length,
              medium: drugSummaries.filter(d => d.disposalPriority === 'MEDIUM').length,
              standard: drugSummaries.filter(d => d.disposalPriority === 'STANDARD').length,
            },
            byCategory: {
              controlled: controlledItems.length,
              refrigerated: drugSummaries.filter(d => d.category === 'refrigerated').length,
              standard: drugSummaries.filter(d => d.category === 'standard').length,
            },
          },

          alertLevel: 'critical',

          alertMessage: `${drugSummaries.length} drug(s) with ${filteredItems.length} expired batch(es) requiring disposal`,

          expiredDrugs: drugSummaries.slice(0, 50),

          disposalChecklist: [
            {
              step: 1,
              action: 'Segregate expired items from active inventory',
              note: 'Physical separation prevents accidental dispensing',
            },
            {
              step: 2,
              action: 'Document all items in disposal log',
              note: 'Required for regulatory compliance and audit trail',
            },
            {
              step: 3,
              action: controlledItems.length > 0
                ? `Special handling: ${controlledItems.length} controlled substance(s) require witnessed disposal`
                : 'Standard pharmaceutical waste protocol',
              note: controlledItems.length > 0
                ? 'DEA/regulatory compliance required'
                : 'Follow institutional waste management procedures',
            },
            {
              step: 4,
              action: 'Update inventory system to remove disposed items',
              note: 'Maintain accurate stock levels',
            },
            {
              step: 5,
              action: 'Review procurement to prevent future waste',
              note: `Financial loss: $${totalValue.toFixed(2)} - analyze ordering patterns`,
            },
          ],

          controlledSubstances: controlledItems.length > 0
            ? {
                count: controlledItems.length,
                totalQuantity: controlledItems.reduce((sum, d) => sum + d.totalQuantity, 0),
                drugs: controlledItems.map(d => ({
                  drugName: d.drugName,
                  quantity: d.totalQuantity,
                  batches: d.totalBatches,
                  locations: d.locations,
                  value: d.totalValue,
                })),
                warning: 'CONTROLLED SUBSTANCES: Require witnessed disposal, documentation, and regulatory reporting',
                action: 'Contact pharmacy supervisor and compliance officer before disposal',
              }
            : undefined,

          financialImpact: {
            totalLoss: totalValue.toFixed(2),
            breakdown: drugSummaries.map(d => ({
              drugName: d.drugName,
              value: d.totalValue,
              quantity: d.totalQuantity,
            })),
            recommendation: totalValue > 1000
              ? 'Significant financial loss detected - review safety stock levels and reorder points'
              : 'Standard waste levels - continue current practices',
          },

          recommendations: [
            highPriority.length > 0 && `URGENT: ${highPriority.length} item(s) require immediate disposal`,
            controlledItems.length > 0 && `Contact compliance officer for ${controlledItems.length} controlled substance(s)`,
            totalValue > 1000 && `High value loss ($${totalValue.toFixed(2)}) - review procurement practices`,
            'Implement FEFO (First Expiry First Out) protocol to prevent future waste',
            'Review safety stock levels for frequently expiring items',
            'Consider supplier agreements for near-expiry returns',
          ].filter(Boolean),

          actions: ['print_disposal_log', 'schedule_disposal', 'contact_compliance', 'update_inventory', 'analyze_causes'],

          note: drugSummaries.length > 50
            ? `Showing first 50 of ${drugSummaries.length} drugs. Export full report for complete disposal documentation.`
            : 'Complete expired items report displayed.',

          reportDate: new Date().toISOString(),
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error generating expired items report: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    },
  });
}

export default createGetExpiredItemsReportTool;
