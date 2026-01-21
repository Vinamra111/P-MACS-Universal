/**
 * Get Full Inventory Tool
 * Returns complete inventory overview with filters
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import type { DatabaseAdapter } from '../../database/CSVAdapter.js';
import { enrichInventoryItem } from '../../database/models.js';

export function createGetFullInventoryTool(db: DatabaseAdapter) {
  return new DynamicStructuredTool({
    name: 'get_full_inventory',
    description: `
Get a complete overview of all inventory items with optional filters.
Useful for generating reports, audits, or getting a high-level view.

Use this for queries like:
- "Show full inventory"
- "List all drugs"
- "Complete inventory report"
- "All controlled substances"
- "Show only low stock items"
    `.trim(),

    schema: z.object({
      statusFilter: z.enum(['all', 'adequate', 'low', 'stockout', 'expired', 'critical']).optional().default('all').describe('Filter by stock status'),
      categoryFilter: z.enum(['all', 'controlled', 'standard', 'refrigerated']).optional().default('all').describe('Filter by drug category'),
      limitResults: z.number().int().min(1).max(500).optional().default(100).describe('Maximum number of results to return'),
    }),

    func: async ({ statusFilter, categoryFilter, limitResults }) => {
      try {
        const rawInventory = await db.loadInventory();

        // Enrich inventory items with status, category, etc.
        let inventory = rawInventory.map(item => enrichInventoryItem(item));

        // Apply filters
        if (statusFilter !== 'all') {
          inventory = inventory.filter(item => item.status === statusFilter);
        }

        if (categoryFilter !== 'all') {
          inventory = inventory.filter(item => item.category === categoryFilter);
        }

        const totalCount = inventory.length;

        // Limit results
        const limitedInventory = inventory.slice(0, limitResults);

        // Calculate summary statistics
        const stats = {
          totalItems: inventory.length,
          totalLocations: new Set(inventory.map(i => i.location)).size,
          uniqueDrugs: new Set(inventory.map(i => i.drugName)).size,

          byStatus: {
            adequate: inventory.filter(i => i.status === 'adequate').length,
            low: inventory.filter(i => i.status === 'low').length,
            critical: inventory.filter(i => i.status === 'critical').length,
            stockout: inventory.filter(i => i.status === 'stockout').length,
            expired: inventory.filter(i => i.status === 'expired').length,
          },

          byCategory: {
            controlled: inventory.filter(i => i.category === 'controlled').length,
            standard: inventory.filter(i => i.category === 'standard').length,
            refrigerated: inventory.filter(i => i.category === 'refrigerated').length,
          },

          totalQuantity: inventory.reduce((sum, item) => sum + item.qtyOnHand, 0),
        };

        const alertLevel =
          stats.byStatus.stockout > 0 || stats.byStatus.expired > 0
            ? 'critical'
            : stats.byStatus.low > 0 || stats.byStatus.critical > 0
              ? 'warning'
              : 'info';

        return JSON.stringify({
          summary: {
            filtersApplied: {
              status: statusFilter,
              category: categoryFilter,
            },
            ...stats,
            resultsShown: limitedInventory.length,
            resultsTotal: totalCount,
            resultsTruncated: totalCount > limitResults,
          },

          alertLevel,
          alertMessage:
            stats.byStatus.stockout > 0
              ? `${stats.byStatus.stockout} stockout(s) - immediate attention required`
              : stats.byStatus.expired > 0
                ? `${stats.byStatus.expired} expired item(s) - remove from stock`
                : stats.byStatus.low + stats.byStatus.critical > 0
                  ? `${stats.byStatus.low + stats.byStatus.critical} item(s) below safety stock`
                  : 'Inventory levels adequate',

          items: limitedInventory.map(item => ({
            drugName: item.drugName,
            location: item.location,
            category: item.category,
            quantity: item.qtyOnHand,
            status: item.status,
            safetyStock: item.safetyStock,
            expiryDate: item.expiryDate,
            daysUntilExpiry: item.daysRemaining,
            batchLot: item.batchLot,
            avgDailyUse: item.avgDailyUse,
          })).sort((a, b) => {
            // Sort by status priority, then by drug name
            const statusPriority: any = { expired: 0, stockout: 1, critical: 2, low: 3, adequate: 4 };
            const statusDiff = statusPriority[a.status] - statusPriority[b.status];
            return statusDiff !== 0 ? statusDiff : a.drugName.localeCompare(b.drugName);
          }),

          recommendations: [
            stats.byStatus.stockout > 0 && `Urgently restock ${stats.byStatus.stockout} stockout item(s)`,
            stats.byStatus.expired > 0 && `Remove ${stats.byStatus.expired} expired item(s) immediately`,
            stats.byStatus.low + stats.byStatus.critical > 0 && `Review ${stats.byStatus.low + stats.byStatus.critical} low-stock item(s)`,
            stats.byCategory.controlled > 0 && `${stats.byCategory.controlled} controlled substances require audit trail`,
          ].filter(Boolean),

          actions: ['download_csv', 'generate_report', 'filter_results', 'create_po'],
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error getting full inventory: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    },
  });
}

export default createGetFullInventoryTool;
