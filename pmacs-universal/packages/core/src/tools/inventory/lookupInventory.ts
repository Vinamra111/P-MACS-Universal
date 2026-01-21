/**
 * Lookup Inventory Tool
 * Finds drug information by name (fuzzy matching)
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import type { DatabaseAdapter } from '../../database/CSVAdapter.js';
import { smartDrugMatch } from '../../utils/fuzzyMatch.js';

export function createLookupInventoryTool(db: DatabaseAdapter) {
  return new DynamicStructuredTool({
    name: 'lookup_inventory',
    description: `
Look up drug inventory information by drug name.
Uses fuzzy matching to find drugs even with minor spelling variations.
Returns all locations where the drug is stored with quantities, status, and expiry.

Use this for queries like:
- "Where is Propofol?"
- "Find Morphine"
- "Show me Insulin stock"
- "How much Paracetamol do we have?"
    `.trim(),

    schema: z.object({
      drugName: z.string().describe('Name of the drug to look up (fuzzy matching supported)'),
    }),

    func: async ({ drugName }) => {
      try {
        const inventory = await db.loadInventory();

        // Fuzzy match drug name
        const matches = inventory.filter(item =>
          smartDrugMatch(drugName, item.drugName)
        );

        if (matches.length === 0) {
          // Try substring match as fallback
          const substringMatches = inventory.filter(item =>
            item.drugName.toLowerCase().includes(drugName.toLowerCase()) ||
            drugName.toLowerCase().includes(item.drugName.toLowerCase())
          );

          if (substringMatches.length === 0) {
            return JSON.stringify({
              found: false,
              query: drugName,
              message: `No drug found matching "${drugName}". Please check spelling or try a different name.`,
              suggestions: inventory
                .map(i => i.drugName)
                .filter((name, idx, arr) => arr.indexOf(name) === idx)
                .slice(0, 5),
            });
          }

          // Use substring matches
          return formatInventoryResults(substringMatches, drugName, true);
        }

        return formatInventoryResults(matches, drugName, false);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error looking up inventory: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    },
  });
}

function formatInventoryResults(
  items: any[],
  searchQuery: string,
  isPartialMatch: boolean
) {
  // Group by drug name (in case of variations)
  const drugGroups = new Map<string, any[]>();
  items.forEach(item => {
    const existing = drugGroups.get(item.drugName) || [];
    existing.push(item);
    drugGroups.set(item.drugName, existing);
  });

  const results = Array.from(drugGroups.entries()).map(([drugName, locations]) => {
    const totalQty = locations.reduce((sum, loc) => sum + loc.qtyOnHand, 0);
    const hasStockout = locations.some(loc => loc.status === 'stockout');
    const hasLowStock = locations.some(loc => loc.status === 'low');
    const hasExpired = locations.some(loc => loc.status === 'expired');
    const hasCritical = locations.some(loc => loc.status === 'critical');

    return {
      drugName,
      category: locations[0]?.category || 'standard',
      totalQuantity: totalQty,
      totalLocations: locations.length,

      alertLevel: hasExpired || hasStockout
        ? 'critical'
        : hasCritical || hasLowStock
          ? 'warning'
          : 'info',

      alertMessage: hasExpired
        ? 'Some batches expired'
        : hasStockout
          ? `${locations.filter(l => l.status === 'stockout').length} location(s) out of stock`
          : hasLowStock || hasCritical
            ? `${locations.filter(l => l.status === 'low' || l.status === 'critical').length} location(s) below safety stock`
            : undefined,

      locations: locations.map(loc => ({
        location: loc.location,
        quantity: loc.qtyOnHand,
        status: loc.status,
        expiryDate: loc.expiryDate,
        daysUntilExpiry: loc.daysRemaining,
        batchLot: loc.batchLot,
        safetyStock: loc.safetyStock,
        avgDailyUse: loc.avgDailyUse,
        daysOfStock: loc.avgDailyUse > 0
          ? Math.round((loc.qtyOnHand / loc.avgDailyUse) * 10) / 10
          : null,
      })),
    };
  });

  return JSON.stringify({
    found: true,
    query: searchQuery,
    isPartialMatch,
    resultCount: results.length,
    results,
  }, null, 2);
}

export default createLookupInventoryTool;
