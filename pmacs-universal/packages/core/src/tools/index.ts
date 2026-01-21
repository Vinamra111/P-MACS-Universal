/**
 * P-MACS Tools - Complete Tool Suite
 * 26 specialized tools for pharmacy management - ALL IMPLEMENTED ✅
 */

import type { Tool } from '@langchain/core/tools';
import type { DatabaseAdapter } from '../database/CSVAdapter.js';
import type { UserRole } from '../types/index.js';

// Inventory Management Tools (6 - ALL IMPLEMENTED)
import { createLookupInventoryTool } from './inventory/lookupInventory.js';
import { createUpdateInventoryTool } from './inventory/updateInventory.js';
import { createListWardStockTool } from './inventory/listWardStock.js';
import { createGetFullInventoryTool } from './inventory/getFullInventory.js';
import { createGetLocationListTool } from './inventory/getLocationList.js';
import { createManageUserAccessTool } from './inventory/manageUserAccess.js';

// Forecasting & ML Tools (7 - ALL IMPLEMENTED)
import { createGetForecastMlTool } from './forecasting/getForecastMl.js';
import { createCalculateSafetyStockTool } from './forecasting/calculateSafetyStock.js';
import { createRecalculateAllSafetyStocksTool } from './forecasting/recalculateAllSafetyStocks.js';
import { createDetectSeasonalPatternsTool } from './forecasting/detectSeasonalPatterns.js';
import { createPredictStockoutDateTool } from './forecasting/predictStockoutDate.js';
import { createAnalyzeUsageTrendsTool } from './forecasting/analyzeUsageTrends.js';

// Expiry Tools (4 - ALL IMPLEMENTED)
import { createCheckExpiringDrugsTool } from './expiry/checkExpiringDrugs.js';
import { createGetFefoRecommendationsTool } from './expiry/getFefoRecommendations.js';
import { createGetBatchReportTool } from './expiry/getBatchReport.js';
import { createGetExpiredItemsReportTool } from './expiry/getExpiredItemsReport.js';

// Analytics Tools (6 - ALL IMPLEMENTED)
import { createGetTopMoversReportTool } from './analytics/getTopMoversReport.js';
import { createGetSlowMoversReportTool } from './analytics/getSlowMoversReport.js';
import { createGetStockoutRiskReportTool } from './analytics/getStockoutRiskReport.js';
import { createGetUsageAnalyticsTool } from './analytics/getUsageAnalytics.js';
import { createGetShortageAlertsTool } from './analytics/getShortageAlerts.js';
import { createGetRestockRecommendationTool } from './analytics/getRestockRecommendation.js';

// Procurement Tools (3 - ALL IMPLEMENTED)
import { createGeneratePurchaseOrderTool } from './procurement/generatePurchaseOrder.js';
import { createGetReorderRecommendationsTool } from './procurement/getReorderRecommendations.js';
import { createEstimateOrderValueTool } from './procurement/estimateOrderValue.js';

export interface ToolFactoryConfig {
  db: DatabaseAdapter;
  userRole: UserRole;
  userId: string;
}

/**
 * Create all 26 P-MACS tools
 * Returns array of LangChain tools ready for agent use
 */
export function createAllTools(config: ToolFactoryConfig): Tool[] {
  const { db, userRole, userId } = config;

  const tools = [
    // ============================================================
    // INVENTORY MANAGEMENT (6 tools) - ✅ ALL IMPLEMENTED
    // ============================================================
    createLookupInventoryTool(db),
    createUpdateInventoryTool(db, userRole, userId),
    createListWardStockTool(db),
    createGetFullInventoryTool(db),
    createGetLocationListTool(db),
    createManageUserAccessTool(db, userRole, userId),

    // ============================================================
    // FORECASTING & ML (7 tools) - ✅ ALL IMPLEMENTED
    // ============================================================
    createGetForecastMlTool(db),
    createCalculateSafetyStockTool(db),
    createRecalculateAllSafetyStocksTool(db),
    createDetectSeasonalPatternsTool(db),
    createPredictStockoutDateTool(db),
    createAnalyzeUsageTrendsTool(db),

    // ============================================================
    // EXPIRY & FEFO (4 tools) - ✅ ALL IMPLEMENTED
    // ============================================================
    createCheckExpiringDrugsTool(db),
    createGetFefoRecommendationsTool(db),
    createGetBatchReportTool(db),
    createGetExpiredItemsReportTool(db),

    // ============================================================
    // ANALYTICS & REPORTS (6 tools) - ✅ ALL IMPLEMENTED
    // ============================================================
    createGetTopMoversReportTool(db),
    createGetSlowMoversReportTool(db),
    createGetStockoutRiskReportTool(db),
    createGetUsageAnalyticsTool(db),
    createGetShortageAlertsTool(db),
    createGetRestockRecommendationTool(db),

    // ============================================================
    // PROCUREMENT (3 tools) - ✅ ALL IMPLEMENTED
    // ============================================================
    createGeneratePurchaseOrderTool(db),
    createGetReorderRecommendationsTool(db),
    createEstimateOrderValueTool(db),
  ];

  return tools as unknown as Tool[];
}

/**
 * Get tool by name
 * Useful for direct tool invocation
 */
export function getToolByName(tools: Tool[], name: string): Tool | undefined {
  return tools.find(tool => tool.name === name);
}

/**
 * Get tools by category
 * Useful for feature-specific tool loading
 */
export function getToolsByCategory(tools: Tool[], category: string): Tool[] {
  const categoryMap: Record<string, string[]> = {
    inventory: [
      'lookup_inventory',
      'update_inventory',
      'list_ward_stock',
      'get_full_inventory',
      'get_location_list',
      'manage_user_access',
    ],
    forecasting: [
      'get_forecast_ml',
      'calculate_safety_stock',
      'recalculate_all_safety_stocks',
      'detect_seasonal_patterns',
      'predict_stockout_date',
      'analyze_usage_trends',
    ],
    expiry: [
      'check_expiring_drugs',
      'get_fefo_recommendations',
      'get_batch_report',
      'get_expired_items_report',
    ],
    analytics: [
      'get_top_movers_report',
      'get_slow_movers_report',
      'get_stockout_risk_report',
      'get_usage_analytics',
      'get_shortage_alerts',
      'get_restock_recommendation',
    ],
    procurement: [
      'generate_purchase_order',
      'get_reorder_recommendations',
      'estimate_order_value',
    ],
  };

  const toolNames = categoryMap[category] || [];
  return tools.filter(tool => toolNames.includes(tool.name));
}

/**
 * Get tools by permission level
 * Useful for role-based tool access
 */
export function getToolsByPermission(tools: Tool[], userRole: UserRole): Tool[] {
  const nurseTools = [
    'lookup_inventory',
    'list_ward_stock',
    'get_full_inventory',
    'get_location_list',
    'check_expiring_drugs',
    'get_fefo_recommendations',
  ];

  const pharmacistTools = [
    ...nurseTools,
    'update_inventory',
    'get_forecast_ml',
    'calculate_safety_stock',
    'recalculate_all_safety_stocks',
    'detect_seasonal_patterns',
    'predict_stockout_date',
    'analyze_usage_trends',
    'get_batch_report',
    'get_expired_items_report',
    'get_top_movers_report',
    'get_slow_movers_report',
    'get_stockout_risk_report',
    'get_usage_analytics',
    'get_shortage_alerts',
    'get_restock_recommendation',
    'generate_purchase_order',
    'get_reorder_recommendations',
    'estimate_order_value',
  ];

  const masterTools = [
    ...pharmacistTools,
    'manage_user_access',
  ];

  const allowedTools = userRole === 'Master'
    ? masterTools
    : userRole === 'Pharmacist'
      ? pharmacistTools
      : nurseTools;

  return tools.filter(tool => allowedTools.includes(tool.name));
}

// Re-export tool creators for custom usage
export {
  // Inventory
  createLookupInventoryTool,
  createUpdateInventoryTool,
  createListWardStockTool,
  createGetFullInventoryTool,
  createGetLocationListTool,
  createManageUserAccessTool,
  // Forecasting
  createGetForecastMlTool,
  createCalculateSafetyStockTool,
  createRecalculateAllSafetyStocksTool,
  createDetectSeasonalPatternsTool,
  createPredictStockoutDateTool,
  createAnalyzeUsageTrendsTool,
  // Expiry
  createCheckExpiringDrugsTool,
  createGetFefoRecommendationsTool,
  createGetBatchReportTool,
  createGetExpiredItemsReportTool,
  // Analytics
  createGetTopMoversReportTool,
  createGetSlowMoversReportTool,
  createGetStockoutRiskReportTool,
  createGetUsageAnalyticsTool,
  createGetShortageAlertsTool,
  createGetRestockRecommendationTool,
  // Procurement
  createGeneratePurchaseOrderTool,
  createGetReorderRecommendationsTool,
  createEstimateOrderValueTool,
};

export default createAllTools;
