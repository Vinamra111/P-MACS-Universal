/**
 * Forecasting Utilities
 * ML algorithms for demand prediction and safety stock calculations
 */

import type { ForecastResult, Transaction, InventoryItem } from '../types/index.js';
import { addDays, getDayFactor, getDayName } from './dateUtils.js';

/**
 * Calculate exponentially weighted moving average (EWMA)
 * Used for trend detection
 */
export function calculateEWMA(data: number[], alpha = 0.3): number[] {
  if (data.length === 0) return [];

  const ewma: number[] = [data[0]];

  for (let i = 1; i < data.length; i++) {
    ewma.push(alpha * data[i] + (1 - alpha) * ewma[i - 1]);
  }

  return ewma;
}

/**
 * Calculate linear regression for trend analysis
 */
export function calculateLinearRegression(yValues: number[]): { slope: number; intercept: number } {
  const n = yValues.length;
  const xValues = Array.from({ length: n }, (_, i) => i);

  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = yValues.reduce((a, b) => a + b, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
  const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

/**
 * Calculate standard deviation
 */
export function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;

  return Math.sqrt(variance);
}

/**
 * Generate 7-day forecast for a drug
 * Uses EWMA + day-of-week factors + trend detection
 */
export function generateForecast(
  drugName: string,
  currentStock: number,
  avgDailyUse: number,
  recentTransactions: Transaction[],
  forecastDays = 7
): ForecastResult {
  // Extract daily usage from transactions
  const dailyUsage = extractDailyUsage(recentTransactions, 30); // Last 30 days

  // Calculate trend
  const trend = calculateLinearRegression(dailyUsage);
  const trendFactor = Math.max(0.5, Math.min(1.5, 1 + trend.slope * 0.1)); // Clamp between 0.5-1.5

  // Calculate base demand (EWMA-adjusted average)
  const ewma = calculateEWMA(dailyUsage);
  const baseDemand = ewma[ewma.length - 1] || avgDailyUse;

  // Generate daily forecasts
  const forecasts: ForecastResult['forecasts'] = [];
  let remainingStock = currentStock;

  for (let i = 0; i < forecastDays; i++) {
    const forecastDate = addDays(new Date(), i + 1);
    const dayFactor = getDayFactor(forecastDate);
    const dayName = getDayName(forecastDate);

    // Predicted usage = base demand * day factor * trend
    const predicted = baseDemand * dayFactor * trendFactor;

    // Confidence interval (±20%)
    const lower = predicted * 0.8;
    const upper = predicted * 1.2;

    remainingStock -= predicted;

    forecasts.push({
      date: forecastDate.toISOString().split('T')[0],
      day: dayName,
      predicted,
      lower,
      upper,
      remainingStock: Math.max(0, remainingStock),
    });
  }

  // Calculate total forecast and gap
  const totalForecast = forecasts.reduce((sum, f) => sum + f.predicted, 0);
  const projectedGap = currentStock - totalForecast;

  // Determine status
  const status = projectedGap < 0
    ? 'critical'
    : projectedGap < avgDailyUse * 2
      ? 'warning'
      : 'adequate';

  // Generate recommendation
  const recommendation = status === 'critical'
    ? `Urgent: Order ${Math.ceil(Math.abs(projectedGap))} units immediately to avoid stockout`
    : status === 'warning'
      ? `Order ${Math.ceil(avgDailyUse * 7 - projectedGap)} units to maintain 7-day coverage`
      : `Stock adequate for ${Math.floor(currentStock / avgDailyUse)} days`;

  return {
    drugName,
    currentStock,
    avgDailyUse: baseDemand,
    trendFactor,
    forecastPeriodDays: forecastDays,
    forecasts,
    totalForecast,
    projectedGap,
    status,
    recommendation,
  };
}

/**
 * Extract daily usage from transactions
 */
function extractDailyUsage(transactions: Transaction[], days: number): number[] {
  const now = new Date();
  const dailyMap = new Map<string, number>();

  // Initialize all days with 0
  for (let i = 0; i < days; i++) {
    const date = addDays(now, -i);
    const dateKey = date.toISOString().split('T')[0];
    dailyMap.set(dateKey, 0);
  }

  // Sum transactions per day
  transactions.forEach(txn => {
    const dateKey = txn.timestamp.split(' ')[0]; // Extract date part
    if (dailyMap.has(dateKey) && txn.action === 'USE') {
      const current = dailyMap.get(dateKey) || 0;
      dailyMap.set(dateKey, current + Math.abs(txn.qtyChange));
    }
  });

  // Convert to array (oldest first)
  return Array.from(dailyMap.values()).reverse();
}

/**
 * Calculate safety stock using Wilson formula
 * Safety Stock = Z-score * StdDev(Demand) * sqrt(Lead Time)
 */
export function calculateSafetyStock(
  avgDailyUse: number,
  leadTimeDays: number,
  serviceLevel = 0.95, // 95% service level
  demandVariability?: number
): number {
  // Z-scores for common service levels
  const zScores: Record<number, number> = {
    0.90: 1.28,
    0.95: 1.65,
    0.98: 2.05,
    0.99: 2.33,
  };

  const zScore = zScores[serviceLevel] || 1.65;

  // Estimate demand variability if not provided (assume 20% CV)
  const stdDevDemand = demandVariability || (avgDailyUse * 0.2);

  // Safety stock = Z * σ * sqrt(LT)
  const safetyStock = zScore * stdDevDemand * Math.sqrt(leadTimeDays);

  return Math.ceil(safetyStock);
}

/**
 * Detect seasonal patterns in usage data
 */
export function detectSeasonalPatterns(
  transactions: Transaction[],
  periodDays = 90
): {
  hasSeasonality: boolean;
  pattern: 'weekly' | 'monthly' | 'none';
  peakDays: string[];
  lowDays: string[];
  seasonalityScore: number;
} {
  const dailyUsage = extractDailyUsage(transactions, periodDays);

  // Check for weekly pattern (7-day cycle)
  const weeklyPattern = checkWeeklyPattern(dailyUsage);

  // Check for monthly pattern (30-day cycle)
  const monthlyPattern = checkMonthlyPattern(dailyUsage);

  if (weeklyPattern.score > 0.6) {
    return {
      hasSeasonality: true,
      pattern: 'weekly',
      peakDays: weeklyPattern.peakDays,
      lowDays: weeklyPattern.lowDays,
      seasonalityScore: weeklyPattern.score,
    };
  }

  if (monthlyPattern.score > 0.5) {
    return {
      hasSeasonality: true,
      pattern: 'monthly',
      peakDays: monthlyPattern.peakPeriods,
      lowDays: monthlyPattern.lowPeriods,
      seasonalityScore: monthlyPattern.score,
    };
  }

  return {
    hasSeasonality: false,
    pattern: 'none',
    peakDays: [],
    lowDays: [],
    seasonalityScore: 0,
  };
}

function checkWeeklyPattern(data: number[]): {
  score: number;
  peakDays: string[];
  lowDays: string[];
} {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayAverages = new Array(7).fill(0);
  const dayCounts = new Array(7).fill(0);

  data.forEach((value, index) => {
    const dayOfWeek = index % 7;
    dayAverages[dayOfWeek] += value;
    dayCounts[dayOfWeek]++;
  });

  const avgByDay = dayAverages.map((sum, i) => dayCounts[i] > 0 ? sum / dayCounts[i] : 0);
  const overallAvg = avgByDay.reduce((sum, val) => sum + val, 0) / avgByDay.length;
  const variance = calculateStdDev(avgByDay);

  // Seasonality score based on coefficient of variation
  const score = variance / (overallAvg || 1);

  const peakDays = avgByDay
    .map((avg, i) => ({ day: days[i], avg }))
    .filter(d => d.avg > overallAvg * 1.1)
    .map(d => d.day);

  const lowDays = avgByDay
    .map((avg, i) => ({ day: days[i], avg }))
    .filter(d => d.avg < overallAvg * 0.9)
    .map(d => d.day);

  return { score, peakDays, lowDays };
}

function checkMonthlyPattern(data: number[]): {
  score: number;
  peakPeriods: string[];
  lowPeriods: string[];
} {
  // Simplified monthly pattern check (first/mid/last 10 days)
  const periodSize = Math.floor(data.length / 3);
  const firstPeriod = data.slice(0, periodSize);
  const midPeriod = data.slice(periodSize, periodSize * 2);
  const lastPeriod = data.slice(periodSize * 2);

  const avgFirst = firstPeriod.reduce((s, v) => s + v, 0) / firstPeriod.length;
  const avgMid = midPeriod.reduce((s, v) => s + v, 0) / midPeriod.length;
  const avgLast = lastPeriod.reduce((s, v) => s + v, 0) / lastPeriod.length;

  const overallAvg = (avgFirst + avgMid + avgLast) / 3;
  const variance = calculateStdDev([avgFirst, avgMid, avgLast]);

  const score = variance / (overallAvg || 1);

  const periods = [
    { name: 'Early month', avg: avgFirst },
    { name: 'Mid month', avg: avgMid },
    { name: 'Late month', avg: avgLast },
  ];

  const peakPeriods = periods.filter(p => p.avg > overallAvg * 1.15).map(p => p.name);
  const lowPeriods = periods.filter(p => p.avg < overallAvg * 0.85).map(p => p.name);

  return { score, peakPeriods, lowPeriods };
}

/**
 * Predict stockout date based on current stock and usage trend
 */
export function predictStockoutDate(
  currentStock: number,
  avgDailyUse: number,
  recentTransactions: Transaction[]
): {
  stockoutDate: string | null;
  daysUntilStockout: number | null;
  confidence: 'high' | 'medium' | 'low';
} {
  if (currentStock === 0) {
    return {
      stockoutDate: new Date().toISOString().split('T')[0],
      daysUntilStockout: 0,
      confidence: 'high',
    };
  }

  if (avgDailyUse === 0) {
    return {
      stockoutDate: null,
      daysUntilStockout: null,
      confidence: 'low',
    };
  }

  // Get trend from recent usage
  const dailyUsage = extractDailyUsage(recentTransactions, 14);
  const trend = calculateLinearRegression(dailyUsage);

  // Adjust average with trend
  const trendFactor = 1 + trend.slope * 0.1;
  const adjustedDailyUse = avgDailyUse * trendFactor;

  // Calculate days until stockout
  const daysUntilStockout = Math.floor(currentStock / adjustedDailyUse);

  // Confidence based on data quality
  const confidence = recentTransactions.length > 10
    ? 'high'
    : recentTransactions.length > 5
      ? 'medium'
      : 'low';

  const stockoutDate = addDays(new Date(), daysUntilStockout);

  return {
    stockoutDate: stockoutDate.toISOString().split('T')[0],
    daysUntilStockout,
    confidence,
  };
}

/**
 * Comprehensive trend analysis for usage data
 * Returns trend percentage, significance, and R-squared
 */
export function calculateDetailedTrend(dataPoints: Array<{ date: Date; value: number }>): {
  slope: number;
  intercept: number;
  hasSignificantTrend: boolean;
  trend: number;
  rSquared: number;
} {
  const yValues = dataPoints.map(d => d.value);
  const n = yValues.length;

  if (n < 2) {
    return {
      slope: 0,
      intercept: 0,
      hasSignificantTrend: false,
      trend: 0,
      rSquared: 0,
    };
  }

  const xValues = Array.from({ length: n }, (_, i) => i);

  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = yValues.reduce((a, b) => a + b, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
  const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R-squared
  const meanY = sumY / n;
  const ssTotal = yValues.reduce((sum, y) => sum + Math.pow(y - meanY, 2), 0);
  const ssResidual = yValues.reduce((sum, y, i) => {
    const predicted = intercept + slope * i;
    return sum + Math.pow(y - predicted, 2);
  }, 0);
  const rSquared = ssTotal > 0 ? 1 - (ssResidual / ssTotal) : 0;

  // Calculate trend as percentage change
  const avgValue = meanY;
  const trendPercentage = avgValue > 0 ? (slope / avgValue) * 100 : 0;

  // Trend is significant if R-squared > 0.5 and absolute trend > 5%
  const hasSignificantTrend = rSquared > 0.5 && Math.abs(trendPercentage) > 5;

  return {
    slope,
    intercept,
    hasSignificantTrend,
    trend: trendPercentage,
    rSquared,
  };
}

// Export aliases for backward compatibility with tools
export { calculateSafetyStock as calculateSafetyStockWilson };
export { detectSeasonalPatterns as detectSeasonality };
export { calculateDetailedTrend as calculateLinearTrend };

export default {
  calculateEWMA,
  calculateLinearRegression,
  calculateStdDev,
  generateForecast,
  calculateSafetyStock,
  detectSeasonalPatterns,
  predictStockoutDate,
};
