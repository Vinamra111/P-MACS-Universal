/**
 * @pmacs/core - Pharmacy Management and Control System SDK
 * Main entry point for the NPM package
 */

// ============================================================
// TYPES
// ============================================================
export * from './types/index.js';

// ============================================================
// DATABASE
// ============================================================
export { CSVDatabaseAdapter } from './database/CSVAdapter.js';
export type { DatabaseAdapter } from './database/CSVAdapter.js';

// ============================================================
// AUTHENTICATION
// ============================================================
export { AuthManager } from './auth/AuthManager.js';
export type { AuthManagerConfig } from './auth/AuthManager.js';

// ============================================================
// TOOLS
// ============================================================
export {
  createAllTools,
  getToolByName,
  getToolsByCategory,
  getToolsByPermission,
  createLookupInventoryTool,
  createUpdateInventoryTool,
  createListWardStockTool,
  createGetFullInventoryTool,
  createGetLocationListTool,
  createManageUserAccessTool,
  createGetForecastMlTool,
  createCalculateSafetyStockTool,
  createCheckExpiringDrugsTool,
} from './tools/index.js';
export type { ToolFactoryConfig } from './tools/index.js';

// ============================================================
// UTILITIES
// ============================================================
export { smartDrugMatch } from './utils/fuzzyMatch.js';
export * from './utils/dateUtils.js';
export * from './utils/formatters.js';
export * from './utils/forecasting.js';

// ============================================================
// CLASSIFIER
// ============================================================
export { classifyQuery, mustUseLLM, estimateTokens } from './classifier/queryClassifier.js';

// ============================================================
// VERSION
// ============================================================
export const VERSION = '1.0.0';
