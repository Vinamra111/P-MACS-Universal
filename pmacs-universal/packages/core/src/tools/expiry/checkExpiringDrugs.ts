/**
 * Check Expiring Drugs Tool
 * Find drugs expiring within a specified time period
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import type { DatabaseAdapter } from '../../database/CSVAdapter.js';
import { daysUntil } from '../../utils/dateUtils.js';

export function createCheckExpiringDrugsTool(db: DatabaseAdapter) {
  return new DynamicStructuredTool({
    name: 'check_expiring_drugs',
    description: `
Find all drugs expiring within a specified number of days.
Categorizes by urgency: critical (<7 days), warning (<30 days), notice (<90 days).

Use this for queries like:
- "What's expiring soon?"
- "Show expiring drugs"
- "Check expiry for next 30 days"
- "Expiring items report"
    `.trim(),

    schema: z.object({
      withinDays: z.number().int().min(1).max(365).optional().default(90).describe('Check expiry within this many days (default: 90)'),
      locationFilter: z.string().optional().describe('Filter by location (optional)'),
    }),

    func: async ({ withinDays, locationFilter }) => {
      try {
        const expiringItems = await db.getExpiringItems(withinDays);

        // Apply location filter if specified
        let filtered = locationFilter
          ? expiringItems.filter(item =>
              item.location.toLowerCase().includes(locationFilter.toLowerCase())
            )
          : expiringItems;

        if (filtered.length === 0) {
          return JSON.stringify({
            found: false,
            withinDays,
            locationFilter,
            message: `No items expiring within ${withinDays} days${locationFilter ? ` at location "${locationFilter}"` : ''}`,
            alertLevel: 'info',
          });
        }

        // Enrich items with computed properties
        const enrichedItems = filtered.map(item => ({
          ...item,
          daysUntilExpiry: item.daysRemaining,
          urgency: item.daysRemaining <= 7 ? 'critical' as const : item.daysRemaining <= 30 ? 'warning' as const : 'notice' as const,
          estimatedValue: 0, // Pricing data not available in InventoryItem
        }));

        // Categorize by urgency
        const critical = enrichedItems.filter(item => item.urgency === 'critical'); // <7 days
        const warning = enrichedItems.filter(item => item.urgency === 'warning');   // 7-30 days
        const notice = enrichedItems.filter(item => item.urgency === 'notice');     // 30-90 days

        // Calculate total value at risk
        const totalValue = enrichedItems.reduce((sum, item) => sum + item.estimatedValue, 0);

        // Group controlled substances separately
        const controlledItems = enrichedItems.filter(item =>
          item.category === 'controlled'
        );

        const alertLevel = critical.length > 0
          ? 'critical'
          : warning.length > 0
            ? 'warning'
            : 'info';

        return JSON.stringify({
          found: true,
          withinDays,
          locationFilter,

          summary: {
            totalItems: enrichedItems.length,
            byUrgency: {
              critical: critical.length,
              warning: warning.length,
              notice: notice.length,
            },
            controlledSubstances: controlledItems.length,
            totalValueAtRisk: totalValue.toFixed(2),
            uniqueDrugs: new Set(enrichedItems.map(i => i.drugName)).size,
            affectedLocations: new Set(enrichedItems.map(i => i.location)).size,
          },

          alertLevel,

          alertMessage: critical.length > 0
            ? `${critical.length} item(s) expire within 7 days - immediate action required`
            : warning.length > 0
              ? `${warning.length} item(s) expire within 30 days`
              : `${notice.length} item(s) expiring within ${withinDays} days`,

          items: enrichedItems.slice(0, 50).map(item => ({
            drugName: item.drugName,
            location: item.location,
            category: item.category,
            quantity: item.qtyOnHand,
            batchLot: item.batchLot,
            expiryDate: item.expiryDate,
            daysUntilExpiry: item.daysUntilExpiry,
            urgency: item.urgency,
            estimatedValue: item.estimatedValue.toFixed(2),
            recommendation: item.urgency === 'critical'
              ? 'Use immediately or return to supplier'
              : item.urgency === 'warning'
                ? 'Prioritize usage (FEFO protocol)'
                : 'Monitor and plan usage',
          })).sort((a, b) => {
            // Sort by urgency then by days
            const urgencyOrder: any = { critical: 0, warning: 1, notice: 2 };
            const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
            return urgencyDiff !== 0 ? urgencyDiff : a.daysUntilExpiry - b.daysUntilExpiry;
          }),

          controlledSubstances: controlledItems.length > 0
            ? {
                count: controlledItems.length,
                items: controlledItems.map(item => ({
                  drugName: item.drugName,
                  location: item.location,
                  quantity: item.qtyOnHand,
                  expiryDate: item.expiryDate,
                  batchLot: item.batchLot,
                })),
                warning: 'Controlled substances require special disposal procedures',
              }
            : undefined,

          recommendations: [
            critical.length > 0 && `Immediately use or remove ${critical.length} critical item(s)`,
            warning.length > 0 && `Implement FEFO (First Expired, First Out) for ${warning.length} item(s)`,
            totalValue > 1000 && `Total value at risk: $${totalValue.toFixed(2)} - consider supplier returns`,
            controlledItems.length > 0 && `${controlledItems.length} controlled substance(s) require audit trail for disposal`,
          ].filter(Boolean),

          actions: ['view_fefo', 'download_report', 'contact_supplier', 'schedule_disposal'],

          followUp: critical.length > 0
            ? 'Would you like FEFO recommendations for critical items?'
            : undefined,

          note: enrichedItems.length > 50
            ? `Showing first 50 of ${enrichedItems.length} items. Download full report for complete list.`
            : undefined,
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error checking expiring drugs: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    },
  });
}

export default createCheckExpiringDrugsTool;
