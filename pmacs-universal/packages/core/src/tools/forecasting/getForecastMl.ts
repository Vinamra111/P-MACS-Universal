/**
 * Get Forecast ML Tool
 * Generate 7-day demand forecast using ML algorithms
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import type { DatabaseAdapter } from '../../database/CSVAdapter.js';
import { generateForecast } from '../../utils/forecasting.js';
import { smartDrugMatch } from '../../utils/fuzzyMatch.js';

export function createGetForecastMlTool(db: DatabaseAdapter) {
  return new DynamicStructuredTool({
    name: 'get_forecast_ml',
    description: `
Generate a 7-day demand forecast for a drug using ML algorithms.
Uses EWMA, trend detection, and day-of-week factors for accurate predictions.

Use this for queries like:
- "Forecast Propofol for next week"
- "Predict Morphine demand"
- "How much Insulin will we need?"
- "Generate forecast for Paracetamol"
    `.trim(),

    schema: z.object({
      drugName: z.string().describe('Name of the drug to forecast'),
      forecastDays: z.number().int().min(1).max(30).optional().default(7).describe('Number of days to forecast (default: 7)'),
    }),

    func: async ({ drugName, forecastDays }) => {
      try {
        // Search for drug with fuzzy matching
        const matches = await db.searchInventory(drugName);

        if (matches.length === 0) {
          return JSON.stringify({
            error: true,
            notFound: true,
            message: `Drug "${drugName}" not found in inventory`,
            suggestion: 'Use lookup_inventory to verify drug name',
          });
        }

        // Get recent transactions for trend analysis
        const transactions = await db.getTransactionsForDrug(matches[0].drugName, 30);

        // Calculate total current stock across all locations
        const totalCurrentStock = matches.reduce((sum, item) => sum + item.qtyOnHand, 0);

        // Calculate average daily use across all locations
        const avgDailyUse = matches.reduce((sum, item) => sum + item.avgDailyUse, 0) / matches.length;

        // Generate forecast
        const forecast = generateForecast(
          matches[0].drugName,
          totalCurrentStock,
          avgDailyUse,
          transactions,
          forecastDays
        );

        // Determine detail level based on drug category
        const isControlled = matches[0].category === 'controlled';
        const detailLevel = isControlled ? 'audit' : 'full';

        return JSON.stringify({
          type: 'forecast',
          detailLevel,
          drugName: forecast.drugName,
          category: matches[0].category,

          currentState: {
            totalStock: totalCurrentStock,
            locations: matches.length,
            avgDailyUse: forecast.avgDailyUse,
            trendFactor: forecast.trendFactor,
            trendDirection: forecast.trendFactor > 1 ? 'increasing' : forecast.trendFactor < 1 ? 'decreasing' : 'stable',
          },

          forecast: {
            periodDays: forecast.forecastPeriodDays,
            totalForecast: forecast.totalForecast,
            projectedGap: forecast.projectedGap,
            status: forecast.status,
            dailyForecasts: forecast.forecasts.map(f => ({
              date: f.date,
              day: f.day,
              predicted: Math.round(f.predicted * 10) / 10,
              confidenceRange: `${Math.round(f.lower)}-${Math.round(f.upper)}`,
              remainingStock: Math.round(f.remainingStock),
            })),
          },

          alertLevel: forecast.status === 'critical'
            ? 'critical'
            : forecast.status === 'warning'
              ? 'warning'
              : 'info',

          alertMessage: forecast.status === 'critical'
            ? `Projected shortage of ${Math.abs(forecast.projectedGap).toFixed(0)} units`
            : forecast.status === 'warning'
              ? 'Stock may run low during forecast period'
              : 'Stock adequate for forecast period',

          recommendation: forecast.recommendation,

          actions: ['create_po', 'download_report', 'view_trends'],

          followUp: forecast.status !== 'adequate'
            ? 'Would you like to generate a purchase order?'
            : undefined,
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error generating forecast: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    },
  });
}

export default createGetForecastMlTool;
