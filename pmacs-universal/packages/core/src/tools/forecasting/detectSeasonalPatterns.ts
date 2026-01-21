/**
 * Seasonal Pattern Detection Tool
 * Identifies usage patterns and trends over time
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import type { DatabaseAdapter } from '../../database/CSVAdapter.js';
import { detectSeasonality } from '../../utils/forecasting.js';
import { enrichInventoryItem } from '../../database/models.js';

export function createDetectSeasonalPatternsTool(db: DatabaseAdapter) {
  return new DynamicStructuredTool({
    name: 'detect_seasonal_patterns',
    description: `
Detect seasonal patterns and trends in drug usage.
Compares recent usage to historical patterns to identify changes.

Use this for queries like:
- "Analyze seasonal patterns for Propofol"
- "Detect usage trends"
- "Is usage increasing or decreasing?"
- "Seasonal analysis for drug X"
    `.trim(),

    schema: z.object({
      drugName: z.string().optional().describe('Specific drug name (optional - if not provided, analyzes all drugs)'),
      recentPeriodDays: z.number().int().min(7).max(90).optional().default(30).describe('Recent period to analyze (default: 30)'),
      historicalPeriodDays: z.number().int().min(30).max(180).optional().default(90).describe('Historical period for comparison (default: 90)'),
    }),

    func: async ({ drugName, recentPeriodDays, historicalPeriodDays }) => {
      try {
        const transactions = await db.loadTransactions(historicalPeriodDays);
        const rawInventory = await db.loadInventory();
        const inventory = rawInventory.map(item => enrichInventoryItem(item));

        // Filter transactions if drug name specified
        let relevantTransactions = transactions;
        if (drugName) {
          const matchingItems = inventory.filter(item =>
            item.drugName.toLowerCase().includes(drugName.toLowerCase())
          );
          if (matchingItems.length === 0) {
            return JSON.stringify({
              found: false,
              drugName,
              message: `Drug "${drugName}" not found`,
            });
          }
          const drugIds = matchingItems.map(i => i.drugId);
          relevantTransactions = transactions.filter(t => drugIds.includes(t.drugId));
        }

        // Group transactions by drug
        const drugTransactions = new Map<string, typeof transactions>();
        for (const txn of relevantTransactions) {
          if (txn.action !== 'USE') continue;

          const drugId = txn.drugId;
          const existing = drugTransactions.get(drugId) || [];
          existing.push(txn);
          drugTransactions.set(drugId, existing);
        }

        if (drugTransactions.size === 0) {
          return JSON.stringify({
            found: false,
            drugName,
            message: 'No usage transactions found in the specified period',
            alertLevel: 'info',
          });
        }

        // Analyze each drug
        const analyses = [];

        for (const [drugId, txns] of drugTransactions.entries()) {
          const invItem = inventory.find(i => i.drugId === drugId);
          if (!invItem) continue;

          // Calculate recent vs historical usage
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - recentPeriodDays);

          const recentTxns = txns.filter(t => new Date(t.timestamp) >= cutoffDate);
          const historicalTxns = txns.filter(t => new Date(t.timestamp) < cutoffDate);

          const recentUsage = recentTxns.reduce((sum, t) => sum + Math.abs(t.qtyChange), 0);
          const historicalUsage = historicalTxns.reduce((sum, t) => sum + Math.abs(t.qtyChange), 0);

          // Normalize to daily rates
          const recentDailyAvg = recentUsage / recentPeriodDays;
          const historicalDailyAvg = historicalUsage / (historicalPeriodDays - recentPeriodDays);

          // Calculate percent change
          const percentChange = historicalDailyAvg > 0
            ? ((recentDailyAvg - historicalDailyAvg) / historicalDailyAvg) * 100
            : 0;

          // Determine trend
          let trend = 'STABLE';
          let severity = 'LOW';

          if (Math.abs(percentChange) >= 50) {
            severity = 'CRITICAL';
            trend = percentChange > 0 ? 'INCREASING' : 'DECREASING';
          } else if (Math.abs(percentChange) >= 30) {
            severity = 'HIGH';
            trend = percentChange > 0 ? 'INCREASING' : 'DECREASING';
          } else if (Math.abs(percentChange) >= 15) {
            severity = 'MODERATE';
            trend = percentChange > 0 ? 'INCREASING' : 'DECREASING';
          }

          // Detect day-of-week patterns (simplified)
          const dayOfWeekUsage = new Map<number, number>();
          for (const txn of txns) {
            const day = new Date(txn.timestamp).getDay(); // 0 = Sunday
            const existing = dayOfWeekUsage.get(day) || 0;
            dayOfWeekUsage.set(day, existing + Math.abs(txn.qtyChange));
          }

          const avgByDay = Array.from(dayOfWeekUsage.entries())
            .map(([day, usage]) => ({ day, usage, avg: usage / (txns.length / 7) }));

          const peakDay = avgByDay.length > 0
            ? avgByDay.reduce((max, curr) => curr.usage > max.usage ? curr : max)
            : null;

          const lowDay = avgByDay.length > 0
            ? avgByDay.reduce((min, curr) => curr.usage < min.usage ? curr : min)
            : null;

          // Use the forecasting utility for seasonality detection
          const seasonalityResult = detectSeasonality(txns, historicalPeriodDays);

          analyses.push({
            drugId,
            drugName: invItem.drugName,
            category: invItem.category,

            trendAnalysis: {
              trend,
              severity,
              percentChange: percentChange.toFixed(1),
              recentDailyAvg: recentDailyAvg.toFixed(2),
              historicalDailyAvg: historicalDailyAvg.toFixed(2),
              absoluteChange: (recentDailyAvg - historicalDailyAvg).toFixed(2),
            },

            periodComparison: {
              recentPeriod: {
                days: recentPeriodDays,
                totalUsage: recentUsage,
                avgDaily: recentDailyAvg.toFixed(2),
                transactions: recentTxns.length,
              },
              historicalPeriod: {
                days: historicalPeriodDays - recentPeriodDays,
                totalUsage: historicalUsage,
                avgDaily: historicalDailyAvg.toFixed(2),
                transactions: historicalTxns.length,
              },
            },

            dayOfWeekPattern: peakDay && lowDay ? {
              detected: true,
              peakDay: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][peakDay.day],
              peakUsage: peakDay.usage.toFixed(0),
              lowDay: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][lowDay.day],
              lowUsage: lowDay.usage.toFixed(0),
              variability: peakDay.usage > 0 ? ((peakDay.usage - lowDay.usage) / peakDay.usage * 100).toFixed(0) + '%' : 'N/A',
            } : { detected: false },

            seasonality: seasonalityResult,

            currentStock: invItem.qtyOnHand,
            safetyStock: invItem.safetyStock,

            recommendation: severity === 'CRITICAL'
              ? trend === 'INCREASING'
                ? `URGENT: Usage increased by ${Math.abs(parseFloat(percentChange.toFixed(1)))}% - significantly increase safety stock and reorder points`
                : `URGENT: Usage decreased by ${Math.abs(parseFloat(percentChange.toFixed(1)))}% - review if item still needed, reduce par levels`
              : severity === 'HIGH'
                ? trend === 'INCREASING'
                  ? `High increase detected (${Math.abs(parseFloat(percentChange.toFixed(1)))}%) - increase safety stock by 20-30%`
                  : `High decrease detected (${Math.abs(parseFloat(percentChange.toFixed(1)))}%) - reduce safety stock by 15-20%`
                : severity === 'MODERATE'
                  ? `Moderate ${trend.toLowerCase()} trend - monitor and adjust par levels if trend continues`
                  : 'Usage stable - maintain current stock levels',

            actionRequired: severity === 'CRITICAL' || severity === 'HIGH',
          });
        }

        // Sort by severity and absolute change
        const severityOrder: any = { CRITICAL: 0, HIGH: 1, MODERATE: 2, LOW: 3 };
        analyses.sort((a, b) => {
          const sevDiff = severityOrder[a.trendAnalysis.severity] - severityOrder[b.trendAnalysis.severity];
          if (sevDiff !== 0) return sevDiff;
          return Math.abs(parseFloat(b.trendAnalysis.percentChange)) - Math.abs(parseFloat(a.trendAnalysis.percentChange));
        });

        // Calculate summary
        const critical = analyses.filter(a => a.trendAnalysis.severity === 'CRITICAL');
        const high = analyses.filter(a => a.trendAnalysis.severity === 'HIGH');
        const increasing = analyses.filter(a => a.trendAnalysis.trend === 'INCREASING');
        const decreasing = analyses.filter(a => a.trendAnalysis.trend === 'DECREASING');
        const stable = analyses.filter(a => a.trendAnalysis.trend === 'STABLE');

        const alertLevel = critical.length > 0 ? 'warning' :
          high.length > 0 ? 'info' : 'info';

        return JSON.stringify({
          found: true,
          drugName,
          recentPeriodDays,
          historicalPeriodDays,

          summary: {
            totalDrugsAnalyzed: analyses.length,
            bySeverity: {
              critical: critical.length,
              high: high.length,
              moderate: analyses.filter(a => a.trendAnalysis.severity === 'MODERATE').length,
              low: analyses.filter(a => a.trendAnalysis.severity === 'LOW').length,
            },
            byTrend: {
              increasing: increasing.length,
              decreasing: decreasing.length,
              stable: stable.length,
            },
            actionRequired: analyses.filter(a => a.actionRequired).length,
          },

          alertLevel,

          alertMessage: critical.length > 0
            ? `${critical.length} drug(s) with critical trend changes (50%+ change)`
            : high.length > 0
              ? `${high.length} drug(s) with significant trend changes (30%+ change)`
              : analyses.length > 0
                ? `Seasonal pattern analysis for ${analyses.length} drug(s)`
                : 'No significant patterns detected',

          criticalPatterns: critical.length > 0 ? critical.map(a => ({
            drugName: a.drugName,
            trend: a.trendAnalysis.trend,
            percentChange: a.trendAnalysis.percentChange + '%',
            recommendation: a.recommendation,
          })) : undefined,

          analyses: analyses.slice(0, 20).map((a, index) => ({
            rank: index + 1,
            drugName: a.drugName,
            category: a.category,
            trend: a.trendAnalysis.trend,
            severity: a.trendAnalysis.severity,
            percentChange: a.trendAnalysis.percentChange + '%',
            recentAvgDaily: a.trendAnalysis.recentDailyAvg,
            historicalAvgDaily: a.trendAnalysis.historicalDailyAvg,
            dayOfWeekPattern: a.dayOfWeekPattern.detected ? {
              peak: a.dayOfWeekPattern.peakDay,
              low: a.dayOfWeekPattern.lowDay,
              variability: a.dayOfWeekPattern.variability,
            } : null,
            seasonality: a.seasonality.hasSeasonality ? a.seasonality.pattern : 'None detected',
            recommendation: a.recommendation,
          })),

          insights: [
            {
              title: 'Strongest Trend',
              data: analyses.length > 0
                ? `${analyses[0].drugName} - ${analyses[0].trendAnalysis.trend} by ${Math.abs(parseFloat(analyses[0].trendAnalysis.percentChange))}%`
                : 'No strong trends',
              recommendation: analyses[0]?.recommendation || 'N/A',
            },
            {
              title: 'Day-of-Week Patterns',
              data: analyses.filter(a => a.dayOfWeekPattern.detected).length > 0
                ? `${analyses.filter(a => a.dayOfWeekPattern.detected).length} drug(s) show weekday variation`
                : 'No significant day-of-week patterns',
              recommendation: 'Adjust staffing and stock availability based on peak days',
            },
            {
              title: 'Overall Usage Trend',
              data: increasing.length > decreasing.length
                ? `Increasing usage trend - ${increasing.length} drugs up, ${decreasing.length} down`
                : decreasing.length > increasing.length
                  ? `Decreasing usage trend - ${decreasing.length} drugs down, ${increasing.length} up`
                  : 'Balanced usage - stable patterns',
              recommendation: increasing.length > decreasing.length
                ? 'Consider increasing overall inventory budget'
                : decreasing.length > increasing.length
                  ? 'Opportunity to reduce inventory carrying costs'
                  : 'Maintain current inventory strategy',
            },
          ],

          recommendations: [
            critical.length > 0 && `URGENT: ${critical.length} drug(s) with critical trend changes - immediate par level review required`,
            increasing.length > 5 && `${increasing.length} drugs showing increased usage - budget for higher procurement costs`,
            decreasing.length > 5 && `${decreasing.length} drugs with decreased usage - opportunity to reduce stock levels and free up capital`,
            analyses.filter(a => a.dayOfWeekPattern.detected).length > 3 && 'Multiple drugs show day-of-week patterns - optimize restocking schedules',
            'Review trends monthly to adjust safety stock and par levels proactively',
            'Use seasonal patterns to plan procurement timing for best pricing',
          ].filter(Boolean),

          actions: ['update_par_levels', 'adjust_safety_stocks', 'schedule_procurement_review', 'export_analysis'],

          note: analyses.length > 20
            ? `Showing top 20 of ${analyses.length} drugs analyzed. Export full report for complete data.`
            : 'Complete seasonal pattern analysis displayed.',

          reportDate: new Date().toISOString(),
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error detecting seasonal patterns: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    },
  });
}

export default createDetectSeasonalPatternsTool;
