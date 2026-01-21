/**
 * Get Location List Tool
 * Returns all storage locations with summary information
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import type { DatabaseAdapter } from '../../database/CSVAdapter.js';

export function createGetLocationListTool(db: DatabaseAdapter) {
  return new DynamicStructuredTool({
    name: 'get_location_list',
    description: `
Get a list of all storage locations with summary statistics.
Shows how many items, stockouts, and controlled substances at each location.

Use this for queries like:
- "List all locations"
- "Show storage areas"
- "Where are drugs stored?"
- "All wards and cabinets"
    `.trim(),

    schema: z.object({
      includeEmpty: z.boolean().optional().default(false).describe('Include locations with no inventory'),
    }),

    func: async ({ includeEmpty }) => {
      try {
        const inventory = await db.loadInventory();
        const allLocationSummaries = await db.getAllLocations();

        // Extract location names
        const allLocations = allLocationSummaries.map(l => l.location);

        // Group inventory by location
        const locationMap = new Map<string, any[]>();
        inventory.forEach(item => {
          const existing = locationMap.get(item.location) || [];
          existing.push(item);
          locationMap.set(item.location, existing);
        });

        // Build location summaries
        const locationSummaries = allLocations.map(location => {
          const items = locationMap.get(location) || [];

          if (!includeEmpty && items.length === 0) {
            return null;
          }

          const totalItems = items.length;
          const totalQuantity = items.reduce((sum, i) => sum + i.qtyOnHand, 0);
          const stockouts = items.filter(i => i.status === 'stockout').length;
          const lowStock = items.filter(i => i.status === 'low' || i.status === 'critical').length;
          const expired = items.filter(i => i.status === 'expired').length;
          const controlledCount = items.filter(i => i.category === 'controlled').length;

          // Determine location type from name
          const locationType = location.toLowerCase().includes('icu')
            ? 'ICU'
            : location.toLowerCase().includes('er') || location.toLowerCase().includes('emergency')
              ? 'Emergency'
              : location.toLowerCase().includes('or') || location.toLowerCase().includes('operating')
                ? 'Operating Room'
                : location.toLowerCase().includes('ward')
                  ? 'Ward'
                  : location.toLowerCase().includes('pharmacy')
                    ? 'Pharmacy'
                    : location.toLowerCase().includes('vault') || location.toLowerCase().includes('secure')
                      ? 'Secure Storage'
                      : location.toLowerCase().includes('fridge') || location.toLowerCase().includes('refriger')
                        ? 'Refrigerated'
                        : location.toLowerCase().includes('crash')
                          ? 'Emergency Cart'
                          : 'General Storage';

          const alertLevel = stockouts > 0 || expired > 0
            ? 'critical'
            : lowStock > 0
              ? 'warning'
              : 'info';

          return {
            location,
            locationType,
            summary: {
              totalItems,
              totalQuantity,
              stockouts,
              lowStock,
              expired,
              controlledSubstances: controlledCount,
            },
            alertLevel,
            needsAttention: stockouts > 0 || expired > 0 || lowStock > 0,
          };
        }).filter(Boolean);

        // Sort by alert level (critical first) then by name
        locationSummaries.sort((a, b) => {
          const priorityMap: any = { critical: 0, warning: 1, info: 2 };
          const priorityDiff = priorityMap[a!.alertLevel] - priorityMap[b!.alertLevel];
          return priorityDiff !== 0 ? priorityDiff : a!.location.localeCompare(b!.location);
        });

        const criticalLocations = locationSummaries.filter(l => l!.alertLevel === 'critical').length;
        const warningLocations = locationSummaries.filter(l => l!.alertLevel === 'warning').length;

        return JSON.stringify({
          totalLocations: locationSummaries.length,

          summary: {
            byType: locationSummaries.reduce((acc, loc) => {
              const type = loc!.locationType;
              acc[type] = (acc[type] || 0) + 1;
              return acc;
            }, {} as Record<string, number>),

            alertSummary: {
              critical: criticalLocations,
              warning: warningLocations,
              ok: locationSummaries.length - criticalLocations - warningLocations,
            },

            needsAttention: locationSummaries.filter(l => l!.needsAttention).length,
          },

          alertLevel: criticalLocations > 0
            ? 'critical'
            : warningLocations > 0
              ? 'warning'
              : 'info',

          alertMessage: criticalLocations > 0
            ? `${criticalLocations} location(s) have critical issues (stockouts/expired items)`
            : warningLocations > 0
              ? `${warningLocations} location(s) have low stock warnings`
              : 'All locations adequately stocked',

          locations: locationSummaries,

          recommendations: [
            criticalLocations > 0 && `Review ${criticalLocations} critical location(s) immediately`,
            warningLocations > 0 && `Monitor ${warningLocations} location(s) with low stock`,
          ].filter(Boolean),
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error getting location list: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    },
  });
}

export default createGetLocationListTool;
