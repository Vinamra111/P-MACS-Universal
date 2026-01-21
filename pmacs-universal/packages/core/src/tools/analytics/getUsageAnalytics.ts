/**
 * Usage Analytics Tool
 * Detailed consumption patterns and statistics for specific drugs
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import type { DatabaseAdapter } from '../../database/CSVAdapter.js';
import { enrichInventoryItem } from '../../database/models.js';

export function createGetUsageAnalyticsTool(db: DatabaseAdapter) {
  return new DynamicStructuredTool({
    name: 'get_usage_analytics',
    description: `
Generate detailed usage analytics for a specific drug.
Provides consumption patterns, trends, peak usage, and actionable insights.

Use this for queries like:
- "Usage analytics for Propofol"
- "Show consumption patterns for Midazolam"
- "Analyze Fentanyl usage"
- "Detailed stats for drug X"
    `.trim(),

    schema: z.object({
      drugName: z.string().describe('Drug name to analyze'),
      days: z.number().int().min(1).max(365).optional().default(30).describe('Period to analyze in days (default: 30)'),
    }),

    func: async ({ drugName, days }) => {
      try {
        const transactions = await db.loadTransactions(days);
        const rawInventory = await db.loadInventory();
        const inventory = rawInventory.map(item => enrichInventoryItem(item));

        // Find matching drugs (fuzzy match)
        const matchingItems = inventory.filter(item =>
          item.drugName.toLowerCase().includes(drugName.toLowerCase())
        );

        if (matchingItems.length === 0) {
          return JSON.stringify({
            found: false,
            drugName,
            days,
            message: `Drug "${drugName}" not found in inventory`,
            suggestion: 'Check spelling or try a partial name',
          });
        }

        const exactDrugName = matchingItems[0].drugName;
        const drugIds = matchingItems.map(item => item.drugId);

        // Get all transactions for this drug
        const drugTransactions = transactions.filter(txn =>
          drugIds.includes(txn.drugId) ||
          matchingItems.some(item => item.drugId === txn.drugId)
        );

        if (drugTransactions.length === 0) {
          return JSON.stringify({
            found: true,
            drugName: exactDrugName,
            days,
            noActivity: true,
            message: `No transactions found for ${exactDrugName} in the last ${days} days`,
            alertLevel: 'info',
            currentInventory: matchingItems.map(item => ({
              location: item.location,
              quantity: item.qtyOnHand,
              expiryDate: item.expiryDate,
            })),
          });
        }

        // Analyze transactions
        let totalUsed = 0;
        let totalReceived = 0;
        let useTransactions = 0;
        let receiveTransactions = 0;
        const locationActivity = new Map<string, { used: number; received: number }>();
        const dailyUsage = new Map<string, number>();

        for (const txn of drugTransactions) {
          const invItem = matchingItems.find(item => item.drugId === txn.drugId);
          if (!invItem) continue;

          const location = invItem.location;
          const locationStats = locationActivity.get(location) || { used: 0, received: 0 };

          if (txn.action === 'USE') {
            const qty = Math.abs(txn.qtyChange);
            totalUsed += qty;
            useTransactions++;
            locationStats.used += qty;

            // Track daily usage
            const date = new Date(txn.timestamp).toISOString().split('T')[0];
            dailyUsage.set(date, (dailyUsage.get(date) || 0) + qty);
          } else if (txn.action === 'RECEIVE') {
            const qty = txn.qtyChange;
            totalReceived += qty;
            receiveTransactions++;
            locationStats.received += qty;
          }

          locationActivity.set(location, locationStats);
        }

        // Calculate statistics
        const avgDailyUsage = totalUsed / days;
        const netChange = totalReceived - totalUsed;
        const transactionFrequency = drugTransactions.length / days;

        // Find peak usage day
        const peakUsageEntry = Array.from(dailyUsage.entries())
          .sort((a, b) => b[1] - a[1])[0];
        const peakUsage = peakUsageEntry ? {
          date: peakUsageEntry[0],
          quantity: peakUsageEntry[1],
        } : null;

        // Current inventory analysis
        const totalCurrentStock = matchingItems.reduce((sum, item) => sum + item.qtyOnHand, 0);
        const totalSafetyStock = Math.max(...matchingItems.map(item => item.safetyStock));
        const daysOfStockRemaining = avgDailyUsage > 0
          ? Math.round(totalCurrentStock / avgDailyUsage)
          : totalCurrentStock > 0 ? 999 : 0;

        // Stock status
        const stockStatus = totalCurrentStock === 0 ? 'stockout' :
          totalCurrentStock < totalSafetyStock ? 'low' : 'adequate';

        // Location breakdown
        const locationBreakdown = Array.from(locationActivity.entries()).map(([location, stats]) => {
          const invItem = matchingItems.find(item => item.location === location);
          return {
            location,
            totalUsed: stats.used,
            totalReceived: stats.received,
            netChange: stats.received - stats.used,
            currentStock: invItem?.qtyOnHand || 0,
            avgDailyUsage: (stats.used / days).toFixed(2),
            category: invItem?.category || 'unknown',
          };
        }).sort((a, b) => b.totalUsed - a.totalUsed);

        // Trend analysis (simple)
        const firstHalfDays = Math.floor(days / 2);
        const firstHalfTransactions = drugTransactions.filter(txn => {
          const txnDate = new Date(txn.timestamp);
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - firstHalfDays);
          return txnDate < cutoffDate;
        });

        const firstHalfUsage = firstHalfTransactions
          .filter(t => t.action === 'USE')
          .reduce((sum, t) => sum + Math.abs(t.qtyChange), 0);

        const secondHalfUsage = totalUsed - firstHalfUsage;
        const trendDirection = secondHalfUsage > firstHalfUsage * 1.1 ? 'increasing' :
          secondHalfUsage < firstHalfUsage * 0.9 ? 'decreasing' : 'stable';
        const trendPercent = firstHalfUsage > 0
          ? ((secondHalfUsage - firstHalfUsage) / firstHalfUsage * 100).toFixed(1)
          : '0';

        // Determine alert level
        const alertLevel = stockStatus === 'stockout' ? 'critical' :
          stockStatus === 'low' && daysOfStockRemaining < 7 ? 'warning' : 'info';

        return JSON.stringify({
          found: true,
          drugName: exactDrugName,
          category: matchingItems[0].category,
          days,

          summary: {
            totalUsed,
            totalReceived,
            netChange,
            avgDailyUsage: avgDailyUsage.toFixed(2),
            transactionCount: drugTransactions.length,
            useTransactions,
            receiveTransactions,
            transactionFrequency: transactionFrequency.toFixed(2),
          },

          currentInventory: {
            totalStock: totalCurrentStock,
            safetyStock: totalSafetyStock,
            stockStatus,
            daysOfStockRemaining,
            locations: matchingItems.length,
            alertLevel,
          },

          trend: {
            direction: trendDirection,
            percentChange: trendPercent,
            description: trendDirection === 'increasing'
              ? `Usage increased by ${trendPercent}% - consider increasing stock levels`
              : trendDirection === 'decreasing'
                ? `Usage decreased by ${Math.abs(parseFloat(trendPercent))}% - consider reducing par levels`
                : 'Usage stable - maintain current stock levels',
          },

          peakUsage: peakUsage ? {
            date: peakUsage.date,
            quantity: peakUsage.quantity,
            note: `Peak day used ${(peakUsage.quantity / avgDailyUsage).toFixed(1)}x average daily usage`,
          } : null,

          locationBreakdown,

          insights: [
            {
              title: 'Primary Usage Location',
              data: locationBreakdown.length > 0
                ? `${locationBreakdown[0].location} - ${locationBreakdown[0].totalUsed} units (${((locationBreakdown[0].totalUsed / totalUsed) * 100).toFixed(0)}% of total)`
                : 'N/A',
              recommendation: 'Ensure adequate stock at primary usage location',
            },
            {
              title: 'Usage Pattern',
              data: transactionFrequency > 1
                ? `High frequency - ${transactionFrequency.toFixed(1)} transactions/day`
                : transactionFrequency > 0.5
                  ? `Moderate frequency - ${transactionFrequency.toFixed(1)} transactions/day`
                  : `Low frequency - ${transactionFrequency.toFixed(1)} transactions/day`,
              recommendation: transactionFrequency > 1
                ? 'High-use drug - monitor closely and maintain buffer stock'
                : 'Standard monitoring adequate',
            },
            {
              title: 'Stock Adequacy',
              data: daysOfStockRemaining < 7
                ? `LOW - Only ${daysOfStockRemaining} days remaining`
                : daysOfStockRemaining < 30
                  ? `MODERATE - ${daysOfStockRemaining} days remaining`
                  : `ADEQUATE - ${daysOfStockRemaining}+ days remaining`,
              recommendation: daysOfStockRemaining < 7
                ? 'URGENT: Reorder immediately'
                : daysOfStockRemaining < 30
                  ? 'Plan reorder within 1-2 weeks'
                  : 'Normal stock levels',
            },
          ],

          recommendations: [
            stockStatus === 'stockout' && 'CRITICAL: Drug is out of stock - emergency reorder required',
            stockStatus === 'low' && daysOfStockRemaining < 7 && `URGENT: Only ${daysOfStockRemaining} days of stock remaining - reorder immediately`,
            trendDirection === 'increasing' && 'Usage trending up - consider increasing safety stock levels',
            trendDirection === 'decreasing' && 'Usage trending down - review par levels for potential reduction',
            totalUsed > 0 && netChange < 0 && 'Net consumption exceeded receipts - ensure adequate reordering',
            matchingItems[0].category === 'controlled' && 'Controlled substance - maintain audit trail for all transactions',
            peakUsage && peakUsage.quantity > avgDailyUsage * 3 && 'High usage variability detected - consider increasing buffer stock',
          ].filter(Boolean),

          actions: [
            'generate_forecast',
            'update_par_levels',
            'create_reorder',
            'view_detailed_transactions',
            'export_report',
          ],

          alertMessage: alertLevel === 'critical'
            ? 'OUT OF STOCK - Immediate action required'
            : alertLevel === 'warning'
              ? `Low stock - ${daysOfStockRemaining} days remaining`
              : `Usage analytics for ${exactDrugName}`,

          reportDate: new Date().toISOString(),
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error generating usage analytics: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    },
  });
}

export default createGetUsageAnalyticsTool;
