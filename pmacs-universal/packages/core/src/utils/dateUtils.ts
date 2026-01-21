/**
 * Date utilities for P-MACS
 */

/**
 * Format date as YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Format date and time as YYYY-MM-DD HH:MM
 */
export function formatDateTime(date: Date): string {
  const d = formatDate(date);
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${d} ${h}:${m}`;
}

/**
 * Format date as human readable (e.g., "Jun 15, 2025")
 */
export function formatDateReadable(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Get current timestamp in P-MACS format
 */
export function getCurrentTimestamp(): string {
  return formatDateTime(new Date());
}

/**
 * Calculate days between two dates
 */
export function daysBetween(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  const diffTime = d2.getTime() - d1.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate days until a date from today
 */
export function daysUntil(date: Date | string): number {
  return daysBetween(new Date(), date);
}

/**
 * Check if date is in the past
 */
export function isPast(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d < new Date();
}

/**
 * Get date N days from now
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Get day of week name
 */
export function getDayName(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

/**
 * Get month name
 */
export function getMonthName(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long' });
}

/**
 * Generate date range for forecasting
 */
export function generateDateRange(startDate: Date, days: number): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < days; i++) {
    dates.push(addDays(startDate, i));
  }
  return dates;
}

/**
 * Day of week factors for forecasting (matching original P-MACS)
 */
export const DAY_OF_WEEK_FACTORS: Record<string, number> = {
  Monday: 1.15,
  Tuesday: 1.1,
  Wednesday: 1.05,
  Thursday: 1.0,
  Friday: 0.95,
  Saturday: 0.8,
  Sunday: 0.75,
};

/**
 * Get day of week factor for a date
 */
export function getDayFactor(date: Date): number {
  const dayName = getDayName(date);
  return DAY_OF_WEEK_FACTORS[dayName] || 1.0;
}

export default {
  formatDate,
  formatDateTime,
  formatDateReadable,
  getCurrentTimestamp,
  daysBetween,
  daysUntil,
  isPast,
  addDays,
  getDayName,
  getMonthName,
  generateDateRange,
  DAY_OF_WEEK_FACTORS,
  getDayFactor,
};
