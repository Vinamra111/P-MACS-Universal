/**
 * Batch Report Tool
 * Provides comprehensive batch traceability across drugs and locations
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import type { DatabaseAdapter } from '../../database/CSVAdapter.js';
import { enrichInventoryItem } from '../../database/models.js';

export function createGetBatchReportTool(db: DatabaseAdapter) {
  return new DynamicStructuredTool({
    name: 'get_batch_report',
    description: `
Generate comprehensive batch traceability report.
Useful for audit compliance, quality control, and batch recall scenarios.

Use this for queries like:
- "Show me all batches of Propofol"
- "Batch report for LOT-12345"
- "Which drugs are in batch ABC123?"
- "Batch traceability report"
    `.trim(),

    schema: z.object({
      batchLot: z.string().optional().describe('Specific batch/lot number to search (optional)'),
      drugName: z.string().optional().describe('Specific drug name to filter (optional)'),
      locationFilter: z.string().optional().describe('Filter by location (optional)'),
      includeExpired: z.boolean().optional().default(false).describe('Include expired batches in report (default: false)'),
    }),

    func: async ({ batchLot, drugName, locationFilter, includeExpired }) => {
      try {
        const rawInventory = await db.loadInventory();
        let items = rawInventory.map(item => enrichInventoryItem(item));

        // Filter by batch/lot if specified
        if (batchLot) {
          items = items.filter(item =>
            item.batchLot.toLowerCase().includes(batchLot.toLowerCase())
          );
        }

        // Filter by drug name if specified
        if (drugName) {
          items = items.filter(item =>
            item.drugName.toLowerCase().includes(drugName.toLowerCase())
          );
        }

        // Filter by location if specified
        if (locationFilter) {
          items = items.filter(item =>
            item.location.toLowerCase().includes(locationFilter.toLowerCase())
          );
        }

        // Enrich with expiry calculations
        const enrichedItems = items.map(item => {
          const expiryDate = new Date(item.expiryDate);
          const today = new Date();
          const daysRemaining = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          const isExpired = daysRemaining < 0;

          const urgency = isExpired
            ? 'expired'
            : daysRemaining <= 7
              ? 'critical'
              : daysRemaining <= 30
                ? 'warning'
                : 'notice';

          return {
            ...item,
            daysRemaining,
            isExpired,
            urgency,
            estimatedValue: item.qtyOnHand * 10, // Simplified value estimation
          };
        });

        // Filter expired if requested
        const filteredItems = includeExpired
          ? enrichedItems
          : enrichedItems.filter(item => !item.isExpired);

        if (filteredItems.length === 0) {
          return JSON.stringify({
            found: false,
            batchLot,
            drugName,
            locationFilter,
            includeExpired,
            message: 'No batches found matching the criteria',
            alertLevel: 'info',
          });
        }

        // Group by batch lot
        const batchGroups = new Map<string, typeof filteredItems>();
        for (const item of filteredItems) {
          const existing = batchGroups.get(item.batchLot) || [];
          existing.push(item);
          batchGroups.set(item.batchLot, existing);
        }

        // Create batch summaries
        const batchSummaries = Array.from(batchGroups.entries()).map(([lot, items]) => {
          const totalQty = items.reduce((sum, item) => sum + item.qtyOnHand, 0);
          const totalValue = items.reduce((sum, item) => sum + item.estimatedValue, 0);
          const locations = new Set(items.map(item => item.location));
          const drugs = new Set(items.map(item => item.drugName));
          const earliestExpiry = items.reduce((min, item) =>
            item.daysRemaining < min.daysRemaining ? item : min
          );

          return {
            batchLot: lot,
            drugs: Array.from(drugs),
            drugCount: drugs.size,
            locations: Array.from(locations),
            locationCount: locations.size,
            totalQuantity: totalQty,
            totalValue: totalValue.toFixed(2),
            expiryDate: earliestExpiry.expiryDate,
            daysUntilExpiry: earliestExpiry.daysRemaining,
            urgency: earliestExpiry.urgency,
            isExpired: earliestExpiry.isExpired,

            distribution: items.map(item => ({
              drugName: item.drugName,
              location: item.location,
              quantity: item.qtyOnHand,
              category: item.category,
              expiryDate: item.expiryDate,
              daysRemaining: item.daysRemaining,
            })),

            status: earliestExpiry.isExpired
              ? 'EXPIRED - Immediate disposal required'
              : earliestExpiry.urgency === 'critical'
                ? 'CRITICAL - Expires within 7 days'
                : earliestExpiry.urgency === 'warning'
                  ? 'WARNING - Expires within 30 days'
                  : 'ACTIVE - Standard rotation',

            recommendation: earliestExpiry.isExpired
              ? 'Remove from inventory and follow disposal protocol'
              : earliestExpiry.urgency === 'critical'
                ? 'Prioritize usage immediately or contact supplier for return'
                : earliestExpiry.urgency === 'warning'
                  ? 'Implement FEFO protocol for this batch'
                  : 'Continue standard inventory rotation',
          };
        });

        // Sort by urgency and days remaining
        const urgencyOrder: any = { expired: 0, critical: 1, warning: 2, notice: 3 };
        batchSummaries.sort((a, b) => {
          const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
          return urgencyDiff !== 0 ? urgencyDiff : a.daysUntilExpiry - b.daysUntilExpiry;
        });

        // Calculate summary
        const expiredBatches = batchSummaries.filter(b => b.isExpired);
        const criticalBatches = batchSummaries.filter(b => b.urgency === 'critical' && !b.isExpired);
        const warningBatches = batchSummaries.filter(b => b.urgency === 'warning');
        const totalValue = batchSummaries.reduce((sum, b) => sum + parseFloat(b.totalValue), 0);
        const controlledBatches = batchSummaries.filter(b =>
          b.distribution.some(d => d.category === 'controlled')
        );

        const alertLevel = expiredBatches.length > 0 || criticalBatches.length > 0
          ? 'critical'
          : warningBatches.length > 0
            ? 'warning'
            : 'info';

        return JSON.stringify({
          found: true,
          batchLot,
          drugName,
          locationFilter,
          includeExpired,

          summary: {
            totalBatches: batchSummaries.length,
            uniqueDrugs: new Set(filteredItems.map(i => i.drugName)).size,
            locationsAffected: new Set(filteredItems.map(i => i.location)).size,
            totalItems: filteredItems.length,
            totalQuantity: filteredItems.reduce((sum, item) => sum + item.qtyOnHand, 0),
            totalValue: totalValue.toFixed(2),
            byStatus: {
              expired: expiredBatches.length,
              critical: criticalBatches.length,
              warning: warningBatches.length,
              normal: batchSummaries.length - expiredBatches.length - criticalBatches.length - warningBatches.length,
            },
            controlledSubstances: controlledBatches.length,
          },

          alertLevel,

          alertMessage: expiredBatches.length > 0
            ? `${expiredBatches.length} batch(es) expired - disposal required`
            : criticalBatches.length > 0
              ? `${criticalBatches.length} batch(es) expire within 7 days`
              : warningBatches.length > 0
                ? `${warningBatches.length} batch(es) expire within 30 days`
                : 'All batches within normal rotation',

          batches: batchSummaries.slice(0, 50),

          traceability: {
            reportGenerated: new Date().toISOString(),
            searchCriteria: { batchLot, drugName, locationFilter, includeExpired },
            auditNote: 'Batch traceability maintained for regulatory compliance',
          },

          recommendations: [
            expiredBatches.length > 0 && `Remove ${expiredBatches.length} expired batch(es) from inventory`,
            criticalBatches.length > 0 && `Urgent: ${criticalBatches.length} batch(es) expire within 7 days`,
            controlledBatches.length > 0 && `${controlledBatches.length} controlled substance batch(es) require special handling`,
            totalValue > 5000 && `High value at risk ($${totalValue.toFixed(2)}) - consider supplier returns`,
          ].filter(Boolean),

          actions: ['print_report', 'export_csv', 'contact_supplier', 'schedule_disposal'],

          note: batchSummaries.length > 50
            ? `Showing first 50 of ${batchSummaries.length} batches. Export full report for complete data.`
            : 'Complete batch report displayed.',
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error generating batch report: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    },
  });
}

export default createGetBatchReportTool;
