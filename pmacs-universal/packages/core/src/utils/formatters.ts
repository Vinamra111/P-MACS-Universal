/**
 * Response formatters for clean P-MACS output
 * Generates structured JSON responses for frontend rendering
 */

import type {
  PMacsResponse,
  ResponseType,
  DetailLevel,
  DrugInfo,
  StockStatus,
  ForecastResult,
  PurchaseOrder,
  ExpiryItem,
  TopMover,
  StockoutRisk,
} from '../types/index.js';
import { CONTROLLED_SUBSTANCES } from '../types/index.js';
import { formatDateReadable, daysUntil } from './dateUtils.js';

/**
 * Determine detail level based on context
 */
export function determineDetailLevel(
  drugName: string | undefined,
  userRole: string,
  queryType: string,
  status?: StockStatus
): DetailLevel {
  // Controlled substances always get audit level
  if (drugName && CONTROLLED_SUBSTANCES.some((cs) =>
    drugName.toLowerCase().includes(cs.toLowerCase())
  )) {
    return 'audit';
  }

  // Critical status items get full details
  if (status === 'stockout' || status === 'expired' || status === 'critical') {
    return 'full';
  }

  // Decision-making queries get full details
  if (['generate_po', 'restock', 'forecast', 'audit', 'report'].includes(queryType)) {
    return 'full';
  }

  // Role-based defaults
  if (userRole === 'Master') return 'full';
  if (userRole === 'Pharmacist') return 'standard';
  if (userRole === 'Nurse') return 'summary';

  return 'standard';
}

/**
 * Format inventory lookup response
 */
export function formatInventoryLookup(
  drugName: string,
  items: DrugInfo[],
  userRole: string
): PMacsResponse {
  const totalQty = items.reduce((sum, item) => sum + item.qtyOnHand, 0);
  const hasAlert = items.some((item) => item.status === 'low' || item.status === 'stockout');
  const isControlled = CONTROLLED_SUBSTANCES.some((cs) =>
    drugName.toLowerCase().includes(cs.toLowerCase())
  );

  const detailLevel = determineDetailLevel(drugName, userRole, 'lookup_drug');

  // Determine alert level
  let alertLevel: 'info' | 'warning' | 'critical' | undefined;
  let alertMessage: string | undefined;

  const stockouts = items.filter((i) => i.status === 'stockout').length;
  const lowStock = items.filter((i) => i.status === 'low').length;

  if (stockouts > 0) {
    alertLevel = 'critical';
    alertMessage = `${stockouts} location(s) out of stock`;
  } else if (lowStock > 0) {
    alertLevel = 'warning';
    alertMessage = `${lowStock} location(s) below safety stock`;
  }

  return {
    type: 'inventory_lookup',
    detailLevel,
    summary: `${drugName}: ${totalQty} units across ${items.length} location(s)`,

    alert: alertLevel ? { level: alertLevel, message: alertMessage! } : undefined,

    data: {
      drug: drugName,
      totalQty,
      category: isControlled ? 'controlled' : 'standard',
      locations: items.map((item) => ({
        name: item.location,
        qty: item.qtyOnHand,
        status: item.status,
        expiry: formatDateReadable(item.expiryDate),
        daysUntilExpiry: item.daysRemaining,
        batch: item.batchLot,
        safetyStock: item.safetyStock,
        avgDailyUse: item.avgDailyUse,
        daysOfStock: item.avgDailyUse > 0
          ? Math.round((item.qtyOnHand / item.avgDailyUse) * 10) / 10
          : null,
      })),
    },

    recommendations: hasAlert
      ? [`Consider restocking locations with low stock`]
      : undefined,

    actions: ['view_details', 'generate_forecast', 'create_po'],
    followUp: hasAlert
      ? `Would you like to restock the low-stock locations?`
      : `Would you like to see a forecast for ${drugName}?`,
  };
}

/**
 * Format forecast response
 */
export function formatForecast(forecast: ForecastResult): PMacsResponse {
  return {
    type: 'forecast',
    detailLevel: 'full',
    summary: `${forecast.drugName}: ${forecast.totalForecast.toFixed(0)} units needed over 7 days`,

    alert: forecast.status === 'critical'
      ? { level: 'critical', message: `Projected shortage of ${Math.abs(forecast.projectedGap).toFixed(0)} units` }
      : forecast.status === 'warning'
        ? { level: 'warning', message: `Stock may run low` }
        : undefined,

    data: {
      drug: forecast.drugName,
      currentStock: forecast.currentStock,
      avgDailyUse: forecast.avgDailyUse,
      trendFactor: forecast.trendFactor,
      totalForecast: forecast.totalForecast,
      projectedGap: forecast.projectedGap,
      status: forecast.status,
      dailyForecasts: forecast.forecasts.map((f) => ({
        date: f.date,
        day: f.day,
        predicted: Math.round(f.predicted * 10) / 10,
        range: `${Math.round(f.lower)}-${Math.round(f.upper)}`,
      })),
    },

    forecast,
    recommendations: [forecast.recommendation],
    actions: ['create_po', 'view_trends', 'export_report'],
    followUp: forecast.status !== 'adequate'
      ? `Would you like to generate a purchase order?`
      : undefined,
  };
}

/**
 * Format purchase order response
 */
export function formatPurchaseOrder(po: PurchaseOrder): PMacsResponse {
  return {
    type: 'purchase_order',
    detailLevel: 'full',
    summary: `${po.poNumber}: ${po.lineItems.length} items, ${po.totalUnits} units`,

    alert: po.urgentCount > 0
      ? { level: 'warning', message: `${po.urgentCount} urgent item(s) - order within 48hrs` }
      : undefined,

    data: {
      poNumber: po.poNumber,
      date: po.date,
      generatedBy: po.generatedBy,
      targetCoverageDays: po.targetCoverageDays,
      lineItems: po.lineItems.map((item) => ({
        drug: item.drugName,
        location: item.location,
        currentStock: item.currentStock,
        orderQty: item.orderQty,
        packs: item.packsToOrder,
        priority: item.priority,
        daysRemaining: item.daysRemaining,
        cost: item.estimatedCost,
      })),
      summary: {
        totalItems: po.lineItems.length,
        totalUnits: po.totalUnits,
        urgentCount: po.urgentCount,
        estimatedValue: po.estimatedValue,
      },
    },

    recommendations: [
      po.urgentCount > 0
        ? `${po.urgentCount} item(s) marked urgent - prioritize ordering`
        : 'All items are standard priority',
    ],

    actions: ['download_pdf', 'download_csv', 'email_to_team', 'approve_po'],
    documentId: po.poNumber,
    documentFormats: ['pdf', 'csv'],
    followUp: 'Would you like to download or email this purchase order?',
  };
}

/**
 * Format expiry report response
 */
export function formatExpiryReport(items: ExpiryItem[], days: number): PMacsResponse {
  const critical = items.filter((i) => i.urgency === 'critical');
  const warning = items.filter((i) => i.urgency === 'warning');
  const notice = items.filter((i) => i.urgency === 'notice');

  const totalValue = items.reduce((sum, i) => sum + i.estimatedValue, 0);

  return {
    type: 'expiry_report',
    detailLevel: 'full',
    summary: `${items.length} item(s) expiring within ${days} days`,

    alert: critical.length > 0
      ? { level: 'critical', message: `${critical.length} item(s) expire within 7 days` }
      : warning.length > 0
        ? { level: 'warning', message: `${warning.length} item(s) expire within 30 days` }
        : undefined,

    data: {
      periodDays: days,
      totalItems: items.length,
      totalValueAtRisk: totalValue,
      byUrgency: {
        critical: critical.length,
        warning: warning.length,
        notice: notice.length,
      },
      items: items.slice(0, 20).map((item) => ({
        drug: item.drugName,
        location: item.location,
        qty: item.qtyOnHand,
        batch: item.batchLot,
        expiry: formatDateReadable(item.expiryDate),
        daysUntilExpiry: item.daysUntilExpiry,
        urgency: item.urgency,
        value: item.estimatedValue,
      })),
    },

    recommendations: [
      critical.length > 0 ? `Prioritize using ${critical.length} critical item(s) immediately` : '',
      `Total value at risk: $${totalValue.toFixed(2)}`,
    ].filter(Boolean),

    actions: ['view_fefo', 'download_report', 'contact_supplier'],
    documentFormats: ['pdf'],
    followUp: critical.length > 0
      ? 'Would you like FEFO recommendations for the critical items?'
      : undefined,
  };
}

/**
 * Format stockout risk report
 */
export function formatStockoutRisk(risks: StockoutRisk[]): PMacsResponse {
  const critical = risks.filter((r) => r.riskLevel === 'CRITICAL');
  const high = risks.filter((r) => r.riskLevel === 'HIGH');
  const medium = risks.filter((r) => r.riskLevel === 'MEDIUM');

  return {
    type: 'analytics',
    detailLevel: 'full',
    summary: `${critical.length} critical, ${high.length} high, ${medium.length} medium risk items`,

    alert: critical.length > 0
      ? { level: 'critical', message: `${critical.length} item(s) at critical stockout risk` }
      : high.length > 0
        ? { level: 'warning', message: `${high.length} item(s) at high stockout risk` }
        : undefined,

    data: {
      byRiskLevel: {
        critical: critical.length,
        high: high.length,
        medium: medium.length,
        low: risks.filter((r) => r.riskLevel === 'LOW').length,
      },
      items: risks.slice(0, 15).map((r) => ({
        drug: r.drugName,
        location: r.location,
        currentStock: r.currentStock,
        avgDailyUse: r.avgDailyUse,
        daysRemaining: r.daysRemaining,
        riskLevel: r.riskLevel,
        riskScore: r.riskScore,
        recommendation: r.recommendation,
      })),
    },

    recommendations: critical.map((c) => c.recommendation),
    actions: ['generate_po', 'view_forecasts', 'download_report'],
    followUp: critical.length > 0
      ? 'Would you like to generate a purchase order for critical items?'
      : undefined,
  };
}

/**
 * Format top movers report
 */
export function formatTopMovers(movers: TopMover[], periodDays: number): PMacsResponse {
  return {
    type: 'analytics',
    detailLevel: 'standard',
    summary: `Top ${movers.length} most used drugs over ${periodDays} days`,

    data: {
      periodDays,
      items: movers.map((m) => ({
        rank: m.rank,
        drug: m.drugName,
        totalUsed: m.totalUsed,
        dailyAvg: Math.round(m.dailyAvg * 10) / 10,
        transactions: m.transactionCount,
        currentStock: m.currentStock,
        status: m.status,
      })),
    },

    actions: ['download_report', 'view_trends'],
    documentFormats: ['csv', 'pdf'],
  };
}

/**
 * Format error response
 */
export function formatError(message: string, details?: string): PMacsResponse {
  return {
    type: 'error',
    detailLevel: 'summary',
    summary: message,

    alert: {
      level: 'critical',
      message,
    },

    data: {
      error: message,
      details,
    },

    actions: ['retry', 'contact_support'],
  };
}

/**
 * Format access denied response
 */
export function formatAccessDenied(action: string, requiredRole: string): PMacsResponse {
  return {
    type: 'error',
    detailLevel: 'summary',
    summary: `Access denied. ${action} requires ${requiredRole} authorization.`,

    alert: {
      level: 'critical',
      message: `Insufficient permissions`,
    },

    data: {
      action,
      requiredRole,
    },

    actions: ['request_access'],
  };
}

export default {
  determineDetailLevel,
  formatInventoryLookup,
  formatForecast,
  formatPurchaseOrder,
  formatExpiryReport,
  formatStockoutRisk,
  formatTopMovers,
  formatError,
  formatAccessDenied,
};
