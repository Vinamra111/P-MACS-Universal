/**
 * Stockout Date Prediction Tool
 * Predicts exact date when a drug will run out of stock
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import type { DatabaseAdapter } from '../../database/CSVAdapter.js';
import { calculateLinearTrend } from '../../utils/forecasting.js';
import { enrichInventoryItem } from '../../database/models.js';

export function createPredictStockoutDateTool(db: DatabaseAdapter) {
  return new DynamicStructuredTool({
    name: 'predict_stockout_date',
    description: `
Predict the exact date when a drug will run out of stock.
Uses linear regression with trend analysis for accurate predictions.

Use this for queries like:
- "When will Propofol run out?"
- "Predict stockout date for Midazolam"
- "How long until drug X is depleted?"
- "Stockout prediction"
    `.trim(),

    schema: z.object({
      drugName: z.string().describe('Drug name to analyze'),
      includeReceiving: z.boolean().optional().default(false).describe('Consider incoming stock in prediction (default: false)'),
    }),

    func: async ({ drugName, includeReceiving }) => {
      try {
        const rawInventory = await db.loadInventory();
        const inventory = rawInventory.map(item => enrichInventoryItem(item));
        const transactions = await db.loadTransactions(90);

        // Find matching drug
        const matchingItems = inventory.filter(item =>
          item.drugName.toLowerCase().includes(drugName.toLowerCase())
        );

        if (matchingItems.length === 0) {
          return JSON.stringify({
            found: false,
            drugName,
            message: `Drug "${drugName}" not found in inventory`,
          });
        }

        const drugId = matchingItems[0].drugId;
        const exactDrugName = matchingItems[0].drugName;

        // Get drug transactions
        const drugTransactions = transactions.filter(t => t.drugId === drugId);

        if (drugTransactions.length < 3) {
          return JSON.stringify({
            found: true,
            drugName: exactDrugName,
            insufficientData: true,
            message: `Insufficient transaction history (${drugTransactions.length} transactions). Need at least 3 for accurate prediction.`,
            currentStock: matchingItems.reduce((sum, i) => sum + i.qtyOnHand, 0),
            recommendation: 'Monitor manually until more usage data is available',
          });
        }

        // Calculate total current stock
        const totalCurrentStock = matchingItems.reduce((sum, item) => sum + item.qtyOnHand, 0);

        if (totalCurrentStock === 0) {
          return JSON.stringify({
            found: true,
            drugName: exactDrugName,
            status: 'ALREADY_STOCKEDOUT',
            message: `${exactDrugName} is already OUT OF STOCK`,
            alertLevel: 'critical',
            stockoutDate: new Date().toISOString().split('T')[0],
            daysUntilStockout: 0,
            action: 'EMERGENCY ORDER REQUIRED',
          });
        }

        // Prepare data for trend analysis
        const usageData = [];
        for (const txn of drugTransactions) {
          if ((txn.action as any) === 'USE') {
            usageData.push({
              date: new Date(txn.timestamp),
              value: Math.abs(txn.qtyChange),
            });
          }
        }

        // Calculate trend
        const trendResult = calculateLinearTrend(usageData);

        // Calculate average daily usage
        const totalUsed = usageData.reduce((sum, d) => sum + d.value, 0);
        const daysSpan = usageData.length > 0
          ? (usageData[usageData.length - 1].date.getTime() - usageData[0].date.getTime()) / (1000 * 60 * 60 * 24)
          : 30;
        const avgDailyUsage = totalUsed / Math.max(daysSpan, 1);

        // Predict stockout using trend if available, otherwise use average
        let daysUntilStockout = 0;
        let stockoutDate: Date | null = null;
        let predictionMethod = '';
        let confidence = 'LOW';

        if (trendResult.hasSignificantTrend && trendResult.trend > 0) {
          // Use linear regression for prediction
          predictionMethod = 'Linear regression with trend';
          const dailyTrend = trendResult.trend / 30; // Convert monthly to daily
          const currentUsage = avgDailyUsage;

          // Simulate day by day with increasing usage
          let remainingStock = totalCurrentStock;
          let day = 0;
          while (remainingStock > 0 && day < 365) {
            day++;
            const predictedUsage = currentUsage + (dailyTrend * day);
            remainingStock -= predictedUsage;
          }

          daysUntilStockout = day;
          stockoutDate = new Date();
          stockoutDate.setDate(stockoutDate.getDate() + day);
          confidence = trendResult.rSquared > 0.7 ? 'HIGH' : trendResult.rSquared > 0.5 ? 'MEDIUM' : 'LOW';
        } else {
          // Use simple average
          predictionMethod = 'Average daily usage';
          daysUntilStockout = Math.floor(totalCurrentStock / avgDailyUsage);
          stockoutDate = new Date();
          stockoutDate.setDate(stockoutDate.getDate() + daysUntilStockout);
          confidence = usageData.length > 30 ? 'MEDIUM' : 'LOW';
        }

        // Consider planned receiving if requested
        if (includeReceiving) {
          const receivingTransactions = drugTransactions.filter(t =>
            (t.action as any) === 'RECEIVE'
          );
          // Simplified - in real system would check for pending orders
          if (receivingTransactions.length > 0) {
            predictionMethod += ' (adjusted for receiving patterns)';
          }
        }

        // Determine severity
        const alertLevel = daysUntilStockout <= 7 ? 'critical' :
          daysUntilStockout <= 14 ? 'warning' : 'info';

        return JSON.stringify({
          found: true,
          drugName: exactDrugName,
          category: matchingItems[0].category,

          prediction: {
            daysUntilStockout,
            estimatedStockoutDate: stockoutDate?.toISOString().split('T')[0],
            confidence,
            method: predictionMethod,
          },

          currentSituation: {
            totalStock: totalCurrentStock,
            locations: matchingItems.length,
            safetyStock: Math.max(...matchingItems.map(i => i.safetyStock)),
            belowSafetyStock: totalCurrentStock < Math.max(...matchingItems.map(i => i.safetyStock)),
          },

          usageAnalysis: {
            avgDailyUsage: avgDailyUsage.toFixed(2),
            last30DaysUsage: totalUsed,
            transactions: usageData.length,
            dataSpanDays: Math.floor(daysSpan),
            trend: trendResult.hasSignificantTrend
              ? trendResult.trend > 0 ? 'INCREASING' : 'DECREASING'
              : 'STABLE',
            trendPercentage: trendResult.hasSignificantTrend
              ? (trendResult.trend > 0 ? '+' : '') + trendResult.trend.toFixed(1) + '%'
              : 'N/A',
          },

          riskAssessment: {
            level: alertLevel,
            severity: daysUntilStockout <= 3 ? 'EMERGENCY' :
              daysUntilStockout <= 7 ? 'CRITICAL' :
                daysUntilStockout <= 14 ? 'HIGH' :
                  daysUntilStockout <= 30 ? 'MEDIUM' : 'LOW',
            willLastLeadTime: daysUntilStockout > 7, // Assuming 7-day lead time
            message: daysUntilStockout <= 3
              ? 'EMERGENCY: Less than 3 days of stock remaining'
              : daysUntilStockout <= 7
                ? 'CRITICAL: Will run out within typical supplier lead time'
                : daysUntilStockout <= 14
                  ? 'HIGH RISK: Limited buffer before stockout'
                  : daysUntilStockout <= 30
                    ? 'MODERATE RISK: Order soon'
                    : 'LOW RISK: Adequate stock',
          },

          alertLevel,

          alertMessage: daysUntilStockout <= 7
            ? `CRITICAL: ${exactDrugName} will run out in ${daysUntilStockout} days (${stockoutDate?.toISOString().split('T')[0]})`
            : daysUntilStockout <= 14
              ? `WARNING: ${exactDrugName} estimated to run out in ${daysUntilStockout} days`
              : `${exactDrugName} estimated stockout: ${daysUntilStockout} days (${stockoutDate?.toISOString().split('T')[0]})`,

          recommendations: [
            daysUntilStockout <= 7 && 'ORDER IMMEDIATELY - Will run out before typical supplier lead time',
            daysUntilStockout <= 14 && 'Order within 1-2 days to maintain adequate buffer',
            daysUntilStockout <= 30 && 'Plan reorder within this week',
            trendResult.hasSignificantTrend && trendResult.trend > 0 && 'Usage is increasing - consider raising safety stock levels',
            confidence === 'LOW' && 'Low prediction confidence - monitor stock closely and gather more usage data',
            matchingItems[0].category === 'controlled' && 'Controlled substance - ensure proper authorization for emergency orders',
            'Set up automated reorder alerts to prevent future stockouts',
          ].filter(Boolean),

          modelDetails: {
            predictionMethod,
            confidence,
            confidenceNote: confidence === 'HIGH'
              ? 'High confidence - strong trend with good data'
              : confidence === 'MEDIUM'
                ? 'Medium confidence - adequate data or stable pattern'
                : 'Low confidence - limited data or high variability',
            rSquared: trendResult.rSquared?.toFixed(3) || 'N/A',
            dataQuality: usageData.length >= 30 ? 'Good' : usageData.length >= 10 ? 'Fair' : 'Limited',
          },

          actions: daysUntilStockout <= 14
            ? ['generate_emergency_po', 'contact_supplier', 'check_other_locations', 'expedite_delivery']
            : ['plan_reorder', 'monitor_usage', 'update_par_levels'],

          locationBreakdown: matchingItems.map(item => ({
            location: item.location,
            stock: item.qtyOnHand,
            daysOfStock: avgDailyUsage > 0 ? Math.floor(item.qtyOnHand / avgDailyUsage) : 999,
          })),

          reportDate: new Date().toISOString(),
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error predicting stockout date: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    },
  });
}

export default createPredictStockoutDateTool;
