/**
 * FEFO (First Expiry First Out) Recommendations Tool
 * Provides prioritized usage order for drug batches to prevent waste
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import type { DatabaseAdapter } from '../../database/CSVAdapter.js';

export function createGetFefoRecommendationsTool(db: DatabaseAdapter) {
  return new DynamicStructuredTool({
    name: 'get_fefo_recommendations',
    description: `
Get FEFO (First Expiry First Out) recommendations for a specific drug or all drugs.
Returns prioritized usage order by expiry date across all locations.

Use this for queries like:
- "Which batches of Propofol should we use first?"
- "FEFO recommendations for Midazolam"
- "What's the usage order for expiring drugs?"
- "Batch prioritization for ICU drugs"
    `.trim(),

    schema: z.object({
      drugName: z.string().optional().describe('Specific drug name (optional - if not provided, returns all drugs)'),
      locationFilter: z.string().optional().describe('Filter by location (optional)'),
      daysThreshold: z.number().int().min(1).max(180).optional().default(90).describe('Only include batches expiring within this many days (default: 90)'),
    }),

    func: async ({ drugName, locationFilter, daysThreshold }) => {
      try {
        const inventory = await db.loadInventory();
        const expiringItems = await db.getExpiringItems(daysThreshold);

        // Enrich with computed properties
        const enrichedItems = expiringItems.map(item => ({
          ...item,
          daysUntilExpiry: item.daysRemaining,
          urgency: item.daysRemaining <= 7 ? 'critical' as const : item.daysRemaining <= 30 ? 'warning' as const : 'notice' as const,
          estimatedValue: 0, // Pricing data not available
        }));

        let items = enrichedItems;

        // Filter by drug name if specified (fuzzy match)
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

        if (items.length === 0) {
          return JSON.stringify({
            found: false,
            drugName,
            locationFilter,
            daysThreshold,
            message: drugName
              ? `No batches of "${drugName}" expiring within ${daysThreshold} days`
              : `No items expiring within ${daysThreshold} days`,
            alertLevel: 'info',
          });
        }

        // Group by drug name
        const drugGroups = new Map<string, typeof items>();
        for (const item of items) {
          const existing = drugGroups.get(item.drugName) || [];
          existing.push(item);
          drugGroups.set(item.drugName, existing);
        }

        // Sort each group by expiry date (earliest first)
        const fefoRecommendations = Array.from(drugGroups.entries()).map(([drug, batches]) => {
          const sortedBatches = batches.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

          const totalQty = sortedBatches.reduce((sum, b) => sum + b.qtyOnHand, 0);
          const earliestExpiry = sortedBatches[0];
          const locations = new Set(sortedBatches.map(b => b.location));

          return {
            drugName: drug,
            category: earliestExpiry.category,
            totalBatches: sortedBatches.length,
            totalQuantity: totalQty,
            locations: Array.from(locations),
            earliestExpiry: earliestExpiry.expiryDate,
            daysUntilEarliestExpiry: earliestExpiry.daysUntilExpiry,
            urgency: earliestExpiry.urgency,

            usageOrder: sortedBatches.map((batch, index) => ({
              priority: index + 1,
              location: batch.location,
              batchLot: batch.batchLot,
              quantity: batch.qtyOnHand,
              expiryDate: batch.expiryDate,
              daysRemaining: batch.daysUntilExpiry,
              urgency: batch.urgency,
              action: batch.urgency === 'critical'
                ? 'USE IMMEDIATELY - Expires in <7 days'
                : batch.urgency === 'warning'
                  ? 'USE NEXT - Expires in <30 days'
                  : 'MONITOR - Use after higher priority batches',
              estimatedValue: batch.estimatedValue.toFixed(2),
            })),

            recommendation: earliestExpiry.urgency === 'critical'
              ? `URGENT: Use ${earliestExpiry.location} batch first - expires in ${earliestExpiry.daysUntilExpiry} days`
              : earliestExpiry.urgency === 'warning'
                ? `Prioritize ${earliestExpiry.location} batch - expires in ${earliestExpiry.daysUntilExpiry} days`
                : `Standard rotation - ${sortedBatches.length} batch(es) available`,
          };
        });

        // Sort drugs by urgency of earliest batch
        const urgencyOrder: any = { critical: 0, warning: 1, notice: 2 };
        fefoRecommendations.sort((a, b) => {
          const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
          return urgencyDiff !== 0 ? urgencyDiff : a.daysUntilEarliestExpiry - b.daysUntilEarliestExpiry;
        });

        // Calculate summary statistics
        const criticalDrugs = fefoRecommendations.filter(r => r.urgency === 'critical');
        const warningDrugs = fefoRecommendations.filter(r => r.urgency === 'warning');
        const totalValue = items.reduce((sum, item) => sum + item.estimatedValue, 0);
        const controlledDrugs = fefoRecommendations.filter(r => r.category === 'controlled');

        const alertLevel = criticalDrugs.length > 0
          ? 'critical'
          : warningDrugs.length > 0
            ? 'warning'
            : 'info';

        return JSON.stringify({
          found: true,
          drugName,
          locationFilter,
          daysThreshold,

          summary: {
            totalDrugs: fefoRecommendations.length,
            totalBatches: items.length,
            byUrgency: {
              critical: criticalDrugs.length,
              warning: warningDrugs.length,
              notice: fefoRecommendations.length - criticalDrugs.length - warningDrugs.length,
            },
            controlledSubstances: controlledDrugs.length,
            totalValueAtRisk: totalValue.toFixed(2),
            locationsAffected: new Set(items.map(i => i.location)).size,
          },

          alertLevel,

          alertMessage: criticalDrugs.length > 0
            ? `${criticalDrugs.length} drug(s) have batches expiring within 7 days - immediate FEFO action required`
            : warningDrugs.length > 0
              ? `${warningDrugs.length} drug(s) need FEFO prioritization (expiring <30 days)`
              : `FEFO recommendations for ${fefoRecommendations.length} drug(s)`,

          recommendations: fefoRecommendations.slice(0, 20),

          guidelines: [
            'Always dispense from the earliest expiring batch first (FEFO protocol)',
            'Check batch numbers on physical containers before dispensing',
            'Document batch usage for traceability',
            'Transfer high-priority batches to high-use locations if needed',
            criticalDrugs.length > 0 && 'Critical items require immediate action to prevent waste',
            controlledDrugs.length > 0 && `${controlledDrugs.length} controlled substance(s) require audit trail`,
          ].filter(Boolean),

          actions: ['print_labels', 'transfer_batches', 'contact_supplier', 'schedule_audit'],

          followUp: criticalDrugs.length > 0
            ? `${criticalDrugs.length} drug(s) need immediate attention. Would you like to see detailed expiry report?`
            : undefined,

          note: fefoRecommendations.length > 20
            ? `Showing top 20 of ${fefoRecommendations.length} drugs. Contact for full report.`
            : 'All FEFO recommendations displayed.',
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error generating FEFO recommendations: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    },
  });
}

export default createGetFefoRecommendationsTool;
