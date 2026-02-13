/**
 * List Ward Stock Tool
 * Lists all inventory items for a specific location/ward
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import type { DatabaseAdapter } from '../../database/CSVAdapter.js';

export function createListWardStockTool(db: DatabaseAdapter) {
  return new DynamicStructuredTool({
    name: 'list_ward_stock',
    description: `
List all inventory items for a specific location or ward.
Shows complete stock status for that location.

Use this for queries like:
- "Show ICU stock"
- "What's in ER-Cabinet-B?"
- "List all drugs in Pharmacy-Main"
- "Ward-A inventory"
    `.trim(),

    schema: z.object({
      location: z.string().describe('Storage location name (e.g., ICU-Shelf-A, ER-Cabinet-B, Pharmacy-Main)'),
      includeAdequate: z.boolean().optional().default(true).describe('Include items with adequate stock (default: true)'),
    }),

    func: async ({ location, includeAdequate }) => {
      try {
        const items = await db.getInventoryByLocation(location);

        if (items.length === 0) {
          // Try to suggest similar locations
          const allLocationSummaries = await db.getAllLocations();
          const allLocationNames = allLocationSummaries.map(l => l.location);
          const similarLocations = allLocationNames.filter(loc =>
            loc.toLowerCase().includes(location.toLowerCase()) ||
            location.toLowerCase().includes(loc.toLowerCase())
          );

          return JSON.stringify({
            found: false,
            location,
            message: `No inventory found for location "${location}".`,
            suggestions: similarLocations.length > 0
              ? similarLocations
              : ['Use get_location_list to see all available locations'],
          });
        }

        // Filter based on includeAdequate and exclude expired items from default view
        let filteredItems = includeAdequate
          ? items
          : items.filter(item => item.status !== 'adequate');

        // Calculate expired count BEFORE filtering them out
        const expiredCount = items.filter(i => i.status === 'expired').length;

        // Always exclude expired items from location inventory view
        filteredItems = filteredItems.filter(item => item.status !== 'expired');

        // Calculate summary stats
        const totalItems = filteredItems.length;
        const stockouts = filteredItems.filter(i => i.status === 'stockout').length;
        const lowStock = filteredItems.filter(i => i.status === 'low' || i.status === 'critical').length;
        const adequate = filteredItems.filter(i => i.status === 'adequate').length;

        const controlledCount = filteredItems.filter(i => i.category === 'controlled').length;

        return JSON.stringify({
          found: true,
          location,
          summary: {
            totalItems,
            stockouts,
            lowStock,
            adequate,
            expired: expiredCount,
            controlledSubstances: controlledCount,
          },

          alertLevel: stockouts > 0
            ? 'critical'
            : lowStock > 0
              ? 'warning'
              : 'info',

          alertMessage: stockouts > 0
            ? `${stockouts} item(s) out of stock`
            : lowStock > 0
              ? `${lowStock} item(s) below safety stock`
              : 'All items adequately stocked',

          items: filteredItems.map(item => ({
            drugName: item.drugName,
            location: item.location, // CRITICAL: Include actual location from database
            category: item.category,
            quantity: item.qtyOnHand,
            status: item.status,
            safetyStock: item.safetyStock,
            expiryDate: item.expiryDate,
            daysUntilExpiry: item.daysRemaining,
            batchLot: item.batchLot,
            avgDailyUse: item.avgDailyUse,
            daysOfStock: item.avgDailyUse > 0
              ? Math.round((item.qtyOnHand / item.avgDailyUse) * 10) / 10
              : null,
          })).sort((a, b) => {
            // Sort by status priority
            const statusPriority: any = { expired: 0, stockout: 1, critical: 2, low: 3, available: 4 };
            return statusPriority[a.status] - statusPriority[b.status];
          }),

          recommendations: [
            stockouts > 0 && `Urgently restock ${stockouts} stockout item(s)`,
            lowStock > 0 && `Review ${lowStock} low-stock item(s) for reordering`,
          ].filter(Boolean),
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error listing ward stock: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    },
  });
}

export default createListWardStockTool;
