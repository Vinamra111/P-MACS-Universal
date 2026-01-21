/**
 * Usage Trends Analysis Tool
 * Comprehensive trend analysis across drugs and time periods
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import type { DatabaseAdapter } from '../../database/CSVAdapter.js';
import { calculateLinearTrend } from '../../utils/forecasting.js';
import { enrichInventoryItem } from '../../database/models.js';

export function createAnalyzeUsageTrendsTool(db: DatabaseAdapter) {
  return new DynamicStructuredTool({
    name: 'analyze_usage_trends',
    description: `
Analyze usage trends across multiple drugs and time periods.
Provides insights into changing consumption patterns and forecasts.

Use this for queries like:
- "Analyze usage trends"
- "Show me trend analysis"
- "What are the usage patterns?"
- "Trend report for all drugs"
    `.trim(),

    schema: z.object({
      days: z.number().int().min(14).max(180).optional().default(90).describe('Period to analyze (default: 90)'),
      category: z.string().optional().describe('Filter by category: controlled, refrigerated, standard (optional)'),
      minTransactions: z.number().int().min(1).max(50).optional().default(5).describe('Minimum transactions required for analysis (default: 5)'),
    }),

    func: async ({ days, category, minTransactions }) => {
      try {
        const rawInventory = await db.loadInventory();
        const inventory = rawInventory.map(item => enrichInventoryItem(item));
        const transactions = await db.loadTransactions(days);

        // Filter inventory by category if specified
        let relevantInventory = inventory;
        if (category) {
          relevantInventory = inventory.filter(item =>
            item.category.toLowerCase() === category.toLowerCase()
          );
        }

        // Group transactions by drug
        const drugTransactions = new Map<string, typeof transactions>();
        for (const txn of transactions) {
          if (txn.action !== 'USE') continue;

          const existing = drugTransactions.get(txn.drugId) || [];
          existing.push(txn);
          drugTransactions.set(txn.drugId, existing);
        }

        // Analyze each drug
        const analyses = [];

        for (const item of relevantInventory) {
          const txns = drugTransactions.get(item.drugId);
          if (!txns || txns.length < minTransactions) continue;

          // Prepare usage data
          const usageData = txns.map(t => ({
            date: new Date(t.timestamp),
            value: Math.abs(t.qtyChange),
          })).sort((a, b) => a.date.getTime() - b.date.getTime());

          // Calculate trend
          const trendResult = calculateLinearTrend(usageData);

          // Calculate statistics
          const totalUsage = usageData.reduce((sum, d) => sum + d.value, 0);
          const avgDailyUsage = totalUsage / days;
          const maxDailyUsage = Math.max(...usageData.map(d => d.value));
          const minDailyUsage = Math.min(...usageData.map(d => d.value));

          // Calculate variability (coefficient of variation)
          const mean = avgDailyUsage;
          const variance = usageData.reduce((sum, d) => sum + Math.pow(d.value - mean, 2), 0) / usageData.length;
          const stdDev = Math.sqrt(variance);
          const coefficientOfVariation = mean > 0 ? (stdDev / mean) * 100 : 0;

          // Split period for trend direction
          const midPoint = Math.floor(usageData.length / 2);
          const firstHalf = usageData.slice(0, midPoint);
          const secondHalf = usageData.slice(midPoint);

          const firstHalfAvg = firstHalf.reduce((sum, d) => sum + d.value, 0) / firstHalf.length;
          const secondHalfAvg = secondHalf.reduce((sum, d) => sum + d.value, 0) / secondHalf.length;
          const periodChange = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;

          // Determine trend category
          let trendCategory = 'STABLE';
          if (Math.abs(periodChange) >= 30) {
            trendCategory = periodChange > 0 ? 'STRONGLY_INCREASING' : 'STRONGLY_DECREASING';
          } else if (Math.abs(periodChange) >= 15) {
            trendCategory = periodChange > 0 ? 'INCREASING' : 'DECREASING';
          } else if (Math.abs(periodChange) >= 5) {
            trendCategory = periodChange > 0 ? 'SLIGHTLY_INCREASING' : 'SLIGHTLY_DECREASING';
          }

          // Variability category
          const variabilityCategory = coefficientOfVariation > 50 ? 'HIGH' :
            coefficientOfVariation > 30 ? 'MODERATE' : 'LOW';

          // Forecast next 30 days
          const forecastDays = 30;
          const projectedUsage = avgDailyUsage * forecastDays * (1 + (periodChange / 100));

          analyses.push({
            drugId: item.drugId,
            drugName: item.drugName,
            category: item.category,

            currentStock: item.qtyOnHand,
            safetyStock: item.safetyStock,

            usage: {
              totalInPeriod: totalUsage,
              avgDaily: avgDailyUsage.toFixed(2),
              maxDaily: maxDailyUsage,
              minDaily: minDailyUsage,
              transactions: txns.length,
            },

            trend: {
              category: trendCategory,
              periodChange: periodChange.toFixed(1) + '%',
              direction: trendResult.hasSignificantTrend
                ? trendResult.trend > 0 ? 'UP' : 'DOWN'
                : 'STABLE',
              confidence: trendResult.rSquared > 0.7 ? 'HIGH' :
                trendResult.rSquared > 0.5 ? 'MEDIUM' : 'LOW',
              rSquared: trendResult.rSquared.toFixed(3),
              slope: trendResult.slope.toFixed(3),
            },

            variability: {
              category: variabilityCategory,
              coefficientOfVariation: coefficientOfVariation.toFixed(1) + '%',
              stdDev: stdDev.toFixed(2),
              note: variabilityCategory === 'HIGH'
                ? 'Highly unpredictable usage - increase safety stock'
                : variabilityCategory === 'MODERATE'
                  ? 'Moderate variation - standard safety stock adequate'
                  : 'Consistent usage - lower safety stock possible',
            },

            forecast: {
              next30DaysProjected: projectedUsage.toFixed(0),
              willMeetDemand: item.qtyOnHand >= projectedUsage,
              shortfall: item.qtyOnHand < projectedUsage
                ? (projectedUsage - item.qtyOnHand).toFixed(0)
                : '0',
            },

            recommendation: trendCategory === 'STRONGLY_INCREASING'
              ? `URGENT: Strong upward trend (${Math.abs(parseFloat(periodChange.toFixed(1)))}%) - increase safety stock by 30-50%`
              : trendCategory === 'STRONGLY_DECREASING'
                ? `Significant downward trend (${Math.abs(parseFloat(periodChange.toFixed(1)))}%) - reduce par levels by 20-30%`
                : trendCategory === 'INCREASING'
                  ? `Upward trend detected - increase safety stock by 15-20%`
                  : trendCategory === 'DECREASING'
                    ? `Downward trend - consider reducing par levels by 10-15%`
                    : variabilityCategory === 'HIGH'
                      ? 'High variability - increase safety stock buffer'
                      : 'Stable usage - maintain current levels',
          });
        }

        if (analyses.length === 0) {
          return JSON.stringify({
            found: false,
            days,
            category,
            minTransactions,
            message: `No drugs with sufficient transaction history (minimum ${minTransactions} transactions)`,
            suggestion: 'Lower minTransactions threshold or analyze a longer period',
          });
        }

        // Sort by trend strength (absolute period change)
        analyses.sort((a, b) =>
          Math.abs(parseFloat(b.trend.periodChange)) - Math.abs(parseFloat(a.trend.periodChange))
        );

        // Calculate summary statistics
        const stronglyIncreasing = analyses.filter(a => a.trend.category === 'STRONGLY_INCREASING');
        const stronglyDecreasing = analyses.filter(a => a.trend.category === 'STRONGLY_DECREASING');
        const increasing = analyses.filter(a => a.trend.category.includes('INCREASING'));
        const decreasing = analyses.filter(a => a.trend.category.includes('DECREASING'));
        const stable = analyses.filter(a => a.trend.category === 'STABLE');
        const highVariability = analyses.filter(a => a.variability.category === 'HIGH');
        const willShortfall = analyses.filter(a => !a.forecast.willMeetDemand);

        const alertLevel = stronglyIncreasing.length > 0 || willShortfall.length > 5 ? 'warning' : 'info';

        return JSON.stringify({
          found: true,
          days,
          category,
          minTransactions,

          summary: {
            totalDrugsAnalyzed: analyses.length,
            periodAnalyzed: `${days} days`,
            byTrend: {
              stronglyIncreasing: stronglyIncreasing.length,
              increasing: increasing.length - stronglyIncreasing.length,
              stable: stable.length,
              decreasing: decreasing.length - stronglyDecreasing.length,
              stronglyDecreasing: stronglyDecreasing.length,
            },
            byVariability: {
              high: analyses.filter(a => a.variability.category === 'HIGH').length,
              moderate: analyses.filter(a => a.variability.category === 'MODERATE').length,
              low: analyses.filter(a => a.variability.category === 'LOW').length,
            },
            forecast: {
              projectedShortfalls: willShortfall.length,
              adequateStock: analyses.length - willShortfall.length,
            },
            actionRequired: stronglyIncreasing.length + willShortfall.length,
          },

          alertLevel,

          alertMessage: stronglyIncreasing.length > 0
            ? `${stronglyIncreasing.length} drug(s) with strong upward trends - safety stock adjustment needed`
            : willShortfall.length > 5
              ? `${willShortfall.length} drug(s) projected to have shortfalls in next 30 days`
              : `Usage trend analysis complete for ${analyses.length} drug(s)`,

          keyFindings: [
            stronglyIncreasing.length > 0 && {
              finding: 'Strong Growth Trends',
              count: stronglyIncreasing.length,
              drugs: stronglyIncreasing.slice(0, 5).map(a => a.drugName),
              impact: 'Requires immediate safety stock and par level increases',
            },
            stronglyDecreasing.length > 0 && {
              finding: 'Significant Usage Decline',
              count: stronglyDecreasing.length,
              drugs: stronglyDecreasing.slice(0, 5).map(a => a.drugName),
              impact: 'Opportunity to reduce inventory and free up capital',
            },
            highVariability.length > 5 && {
              finding: 'High Variability Drugs',
              count: highVariability.length,
              drugs: highVariability.slice(0, 5).map(a => a.drugName),
              impact: 'Need increased safety stock buffers',
            },
            willShortfall.length > 0 && {
              finding: 'Projected Shortfalls',
              count: willShortfall.length,
              drugs: willShortfall.slice(0, 5).map(a => a.drugName),
              impact: 'Reorder needed within 30 days',
            },
          ].filter(Boolean),

          analyses: analyses.slice(0, 50).map((a, index) => ({
            rank: index + 1,
            drugName: a.drugName,
            category: a.category,
            trendCategory: a.trend.category,
            periodChange: a.trend.periodChange,
            avgDailyUsage: a.usage.avgDaily,
            variability: a.variability.category,
            projectedShortfall: !a.forecast.willMeetDemand,
            recommendation: a.recommendation,
          })),

          recommendations: [
            stronglyIncreasing.length > 0 && `URGENT: Increase safety stock for ${stronglyIncreasing.length} fast-growing drug(s)`,
            willShortfall.length > 5 && `${willShortfall.length} drugs need reordering within 30 days`,
            highVariability.length > 5 && `${highVariability.length} drugs have unpredictable usage - increase buffer stock`,
            increasing.length > decreasing.length && 'Overall upward trend - plan for increased procurement budget',
            decreasing.length > increasing.length && 'Overall downward trend - opportunity to optimize inventory costs',
            'Review trends quarterly to keep par levels optimized',
            'Set up automated alerts for drugs with strong trend changes',
          ].filter(Boolean),

          actions: ['update_safety_stocks', 'adjust_par_levels', 'generate_reorder_list', 'schedule_review', 'export_analysis'],

          note: analyses.length > 50
            ? `Showing top 50 of ${analyses.length} drugs analyzed. Export for full report.`
            : 'Complete usage trend analysis displayed.',

          reportDate: new Date().toISOString(),
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error analyzing usage trends: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    },
  });
}

export default createAnalyzeUsageTrendsTool;
