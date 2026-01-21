/**
 * Top Movers Report Tool
 * Identifies most frequently used drugs for strategic planning
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import type { DatabaseAdapter } from '../../database/CSVAdapter.js';
import { enrichInventoryItem } from '../../database/models.js';

export function createGetTopMoversReportTool(db: DatabaseAdapter) {
  return new DynamicStructuredTool({
    name: 'get_top_movers_report',
    description: `
Generate report of most frequently used drugs (top movers).
Useful for procurement planning, forecasting, and inventory optimization.

Use this for queries like:
- "What are our top drugs?"
- "Most used medications"
- "High volume drugs report"
- "Top 10 movers"
    `.trim(),

    schema: z.object({
      days: z.number().int().min(1).max(365).optional().default(30).describe('Period to analyze in days (default: 30)'),
      topN: z.number().int().min(1).max(50).optional().default(10).describe('Number of top drugs to return (default: 10)'),
      locationFilter: z.string().optional().describe('Filter by location (optional)'),
    }),

    func: async ({ days, topN, locationFilter }) => {
      try {
        const transactions = await db.loadTransactions(days);
        const rawInventory = await db.loadInventory();
        const inventory = rawInventory.map(item => enrichInventoryItem(item));

        // Filter by location if specified
        let relevantTransactions = transactions;
        if (locationFilter) {
          const locationDrugIds = inventory
            .filter(item => item.location.toLowerCase().includes(locationFilter.toLowerCase()))
            .map(item => item.drugId);
          relevantTransactions = transactions.filter(t => locationDrugIds.includes(t.drugId));
        }

        // Group transactions by drug
        const drugUsage = new Map<string, {
          drugId: string;
          drugName: string;
          totalUsed: number;
          totalReceived: number;
          transactionCount: number;
          useTransactions: number;
          locations: Set<string>;
        }>();

        for (const txn of relevantTransactions) {
          // Find drug name from inventory
          const invItem = inventory.find(item => item.drugId === txn.drugId);
          if (!invItem) continue;

          const existing = drugUsage.get(txn.drugId) || {
            drugId: txn.drugId,
            drugName: invItem.drugName,
            totalUsed: 0,
            totalReceived: 0,
            transactionCount: 0,
            useTransactions: 0,
            locations: new Set(),
          };

          existing.transactionCount++;
          existing.locations.add(invItem.location);

          if (txn.action === 'USE') {
            existing.totalUsed += Math.abs(txn.qtyChange);
            existing.useTransactions++;
          } else if (txn.action === 'RECEIVE') {
            existing.totalReceived += txn.qtyChange;
          }

          drugUsage.set(txn.drugId, existing);
        }

        if (drugUsage.size === 0) {
          return JSON.stringify({
            found: false,
            days,
            topN,
            locationFilter,
            message: `No usage transactions found in the last ${days} days`,
            alertLevel: 'info',
          });
        }

        // Convert to array and calculate metrics
        const drugMetrics = Array.from(drugUsage.values()).map(drug => {
          const currentStock = inventory
            .filter(item => item.drugId === drug.drugId)
            .reduce((sum, item) => sum + item.qtyOnHand, 0);

          const avgDailyUsage = drug.totalUsed / days;
          const daysOfStock = avgDailyUsage > 0 ? currentStock / avgDailyUsage : 999;
          const turnoverRate = currentStock > 0 ? (drug.totalUsed / currentStock).toFixed(2) : 'N/A';

          // Get current stock status
          const invItems = inventory.filter(item => item.drugId === drug.drugId);
          const safetyStock = Math.max(...invItems.map(item => item.safetyStock));
          const stockStatus = currentStock === 0 ? 'stockout' :
            currentStock < safetyStock ? 'low' : 'adequate';

          return {
            drugName: drug.drugName,
            category: invItems[0]?.category || 'unknown',
            totalUsed: drug.totalUsed,
            totalReceived: drug.totalReceived,
            netChange: drug.totalUsed - drug.totalReceived,
            transactionCount: drug.transactionCount,
            useTransactions: drug.useTransactions,
            avgDailyUsage: avgDailyUsage.toFixed(2),
            currentStock,
            daysOfStockRemaining: Math.round(daysOfStock),
            turnoverRate,
            stockStatus,
            locationsUsed: Array.from(drug.locations),
            locationCount: drug.locations.size,
            usageIntensity: drug.totalUsed / days, // For sorting
          };
        });

        // Sort by total usage (top movers)
        drugMetrics.sort((a, b) => b.totalUsed - a.totalUsed);

        // Get top N
        const topMovers = drugMetrics.slice(0, topN);
        const controlledInTop = topMovers.filter(d => d.category === 'controlled');
        const stockoutInTop = topMovers.filter(d => d.stockStatus === 'stockout');
        const lowStockInTop = topMovers.filter(d => d.stockStatus === 'low');

        // Calculate summary statistics
        const totalUsage = topMovers.reduce((sum, d) => sum + d.totalUsed, 0);
        const totalTransactions = topMovers.reduce((sum, d) => sum + d.transactionCount, 0);
        const avgTurnover = topMovers.filter(d => d.turnoverRate !== 'N/A')
          .reduce((sum, d, _, arr) => sum + parseFloat(d.turnoverRate) / arr.length, 0);

        const alertLevel = stockoutInTop.length > 0 ? 'critical' :
          lowStockInTop.length > 0 ? 'warning' : 'info';

        return JSON.stringify({
          found: true,
          days,
          topN,
          locationFilter,

          summary: {
            reportPeriod: `Last ${days} days`,
            topDrugsAnalyzed: topMovers.length,
            totalDrugsWithActivity: drugMetrics.length,
            totalUsageVolume: totalUsage,
            totalTransactions: totalTransactions,
            avgDailyTransactions: (totalTransactions / days).toFixed(1),
            avgTurnoverRate: avgTurnover.toFixed(2),
            byStockStatus: {
              stockout: stockoutInTop.length,
              low: lowStockInTop.length,
              adequate: topMovers.length - stockoutInTop.length - lowStockInTop.length,
            },
            controlledSubstances: controlledInTop.length,
          },

          alertLevel,

          alertMessage: stockoutInTop.length > 0
            ? `${stockoutInTop.length} top mover(s) currently out of stock - urgent reorder needed`
            : lowStockInTop.length > 0
              ? `${lowStockInTop.length} top mover(s) below safety stock`
              : `Top ${topMovers.length} drugs by usage volume`,

          topMovers: topMovers.map((drug, index) => ({
            rank: index + 1,
            drugName: drug.drugName,
            category: drug.category,
            totalUsed: drug.totalUsed,
            avgDailyUsage: drug.avgDailyUsage,
            transactionCount: drug.transactionCount,
            currentStock: drug.currentStock,
            daysOfStockRemaining: drug.daysOfStockRemaining,
            stockStatus: drug.stockStatus,
            turnoverRate: drug.turnoverRate,
            locationsUsed: drug.locationsUsed,
            trend: drug.netChange > 0 ? 'increasing usage' : 'stable',
            urgency: drug.stockStatus === 'stockout' ? 'CRITICAL' :
              drug.stockStatus === 'low' && drug.daysOfStockRemaining < 7 ? 'HIGH' :
                drug.stockStatus === 'low' ? 'MEDIUM' : 'NORMAL',
          })),

          insights: [
            {
              title: 'Highest Volume Drug',
              data: `${topMovers[0].drugName} - ${topMovers[0].totalUsed} units used (${topMovers[0].avgDailyUsage} units/day)`,
              recommendation: topMovers[0].stockStatus !== 'adequate'
                ? 'Increase safety stock levels for this high-demand drug'
                : 'Maintain current stock levels',
            },
            {
              title: 'Fastest Turnover',
              data: (() => {
                const fastest = topMovers
                  .filter(d => d.turnoverRate !== 'N/A')
                  .sort((a, b) => parseFloat(b.turnoverRate) - parseFloat(a.turnoverRate))[0];
                return fastest
                  ? `${fastest.drugName} - ${fastest.turnoverRate}x turnover`
                  : 'N/A';
              })(),
              recommendation: 'High turnover drugs need frequent monitoring and reordering',
            },
            {
              title: 'Multi-Location Demand',
              data: (() => {
                const multiLoc = topMovers.filter(d => d.locationCount > 1);
                return multiLoc.length > 0
                  ? `${multiLoc.length} drug(s) used across multiple locations`
                  : 'All drugs used in single locations';
              })(),
              recommendation: 'Consider centralized stock with transfer protocols for multi-location drugs',
            },
          ],

          recommendations: [
            stockoutInTop.length > 0 && `URGENT: Reorder ${stockoutInTop.length} out-of-stock top mover(s) immediately`,
            lowStockInTop.length > 0 && `Increase safety stock for ${lowStockInTop.length} high-use drug(s) below threshold`,
            controlledInTop.length > 0 && `${controlledInTop.length} controlled substance(s) in top movers - ensure compliance monitoring`,
            'Optimize reorder points for top movers to prevent stockouts',
            'Consider bulk purchasing agreements for highest volume drugs',
            'Review storage locations to ensure top movers are easily accessible',
          ].filter(Boolean),

          actions: ['export_to_excel', 'generate_reorder_list', 'update_par_levels', 'schedule_review'],

          note: `Report covers ${days}-day period${locationFilter ? ` for location: ${locationFilter}` : ' (all locations)'}. Top movers represent highest usage volume.`,

          reportDate: new Date().toISOString(),
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error generating top movers report: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    },
  });
}

export default createGetTopMoversReportTool;
