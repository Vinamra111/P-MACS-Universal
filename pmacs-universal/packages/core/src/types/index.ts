/**
 * P-MACS Core Types
 * Preserving the essence of the original P-MACS system
 */

// ============================================================
// USER & AUTHENTICATION TYPES
// ============================================================

export type UserRole = 'Nurse' | 'Pharmacist' | 'Master';

export type UserStatus = 'Active' | 'Blacklisted';

export interface User {
  empId: string;
  role: UserRole;
  status: UserStatus;
  name: string;
  passwordHash: string;
  unifiedGroup: string;
  createdAt: string;
  lastLogin: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  sessionToken?: string;
  error?: string;
}

export type Permission = 'read' | 'update' | 'forecast' | 'admin';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  Nurse: ['read'],
  Pharmacist: ['read', 'update', 'forecast'],
  Master: ['read', 'update', 'forecast', 'admin'],
};

// ============================================================
// INVENTORY TYPES
// ============================================================

export type StockStatus = 'adequate' | 'low' | 'critical' | 'stockout' | 'expired';

export type DrugCategory = 'standard' | 'controlled' | 'refrigerated' | 'hazardous';

export interface InventoryItem {
  drugId: string;
  drugName: string;
  location: string;
  qtyOnHand: number;
  expiryDate: string;
  batchLot: string;
  safetyStock: number;
  avgDailyUse: number;
}

export interface DrugInfo extends InventoryItem {
  status: StockStatus;
  daysRemaining: number;
  category: DrugCategory;
}

export interface LocationSummary {
  location: string;
  itemCount: number;
  totalQty: number;
  stockoutCount: number;
  lowStockCount: number;
}

// Controlled substances that require audit level detail
export const CONTROLLED_SUBSTANCES = [
  'Morphine',
  'Fentanyl',
  'Oxycodone',
  'Hydrocodone',
  'Diazepam',
  'Alprazolam',
  'Ketamine',
  'Codeine',
  'Methadone',
  'Hydromorphone',
];

// ============================================================
// TRANSACTION & AUDIT TYPES
// ============================================================

export type TransactionAction =
  | 'USE'
  | 'RECEIVE'
  | 'SEARCH_DRUG'
  | 'VIEW_WARD'
  | 'GENERATE_FORECAST'
  | 'GENERATE_PO'
  | 'UPDATE_SAFETY_STOCK'
  | 'LOGIN'
  | 'LOGOUT';

export interface Transaction {
  txnId: string;
  timestamp: string;
  userId: string;
  drugId: string;
  action: TransactionAction;
  qtyChange: number;
  details?: string;
}

export interface AccessLog {
  logId: string;
  timestamp: string;
  empId: string;
  action: string;
  ipAddress?: string;
  details?: string;
}

// ============================================================
// FORECAST & ML TYPES
// ============================================================

export interface ForecastPoint {
  date: string;
  day: string;
  predicted: number;
  lower: number;
  upper: number;
  remainingStock: number;
}

export interface ForecastResult {
  drugName: string;
  currentStock: number;
  avgDailyUse: number;
  trendFactor: number;
  forecastPeriodDays: number;
  forecasts: ForecastPoint[];
  totalForecast: number;
  projectedGap: number;
  status: 'adequate' | 'warning' | 'critical';
  recommendation: string;
}

export interface SafetyStockResult {
  drugName: string;
  currentSafetyStock: number;
  recommendedSafetyStock: number;
  zScore: number;
  demandVariability: number;
  leadTimeDays: number;
  serviceLevelTarget: number;
  rationale: string;
  change: number;
}

export interface SeasonalPattern {
  drugName: string;
  seasonalityLevel: 'HIGH' | 'MODERATE' | 'LOW';
  variation: number;
  peakMonth: string;
  lowestMonth: string;
  highDemandMonths: string[];
  lowDemandMonths: string[];
  monthlyUsage: Record<string, number>;
  recommendation: string;
}

// ============================================================
// EXPIRY & FEFO TYPES
// ============================================================

export type ExpiryUrgency = 'critical' | 'warning' | 'notice';

export interface ExpiryItem extends InventoryItem {
  daysUntilExpiry: number;
  urgency: ExpiryUrgency;
  estimatedValue: number;
}

export interface FefoRecommendation {
  drugName: string;
  totalStock: number;
  locationCount: number;
  batches: Array<{
    batchLot: string;
    location: string;
    qty: number;
    expiryDate: string;
    daysUntilExpiry: number;
    priority: number;
  }>;
}

// ============================================================
// PROCUREMENT TYPES
// ============================================================

export type OrderPriority = 'URGENT' | 'STANDARD';

export interface POLineItem {
  drugName: string;
  location: string;
  currentStock: number;
  safetyStock: number;
  orderQty: number;
  packSize: number;
  packsToOrder: number;
  daysRemaining: number;
  priority: OrderPriority;
  estimatedCost: number;
}

export interface PurchaseOrder {
  poNumber: string;
  date: string;
  generatedBy: string;
  targetCoverageDays: number;
  lineItems: POLineItem[];
  totalUnits: number;
  urgentCount: number;
  estimatedValue: number;
}

export interface ReorderRecommendation {
  drugName: string;
  location: string;
  currentStock: number;
  safetyStock: number;
  reorderPoint: number;
  eoqQuantity: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  urgency: 'immediate' | 'soon' | 'planned';
}

// ============================================================
// ANALYTICS TYPES
// ============================================================

export interface TopMover {
  rank: number;
  drugName: string;
  totalUsed: number;
  dailyAvg: number;
  transactionCount: number;
  currentStock: number;
  status: StockStatus;
}

export interface SlowMover {
  drugName: string;
  location: string;
  qty: number;
  lastUsed: string;
  daysSinceUse: number;
  estimatedValue: number;
}

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface StockoutRisk {
  drugName: string;
  location: string;
  currentStock: number;
  avgDailyUse: number;
  daysRemaining: number;
  riskLevel: RiskLevel;
  riskScore: number;
  recommendation: string;
}

export interface UsageAnalytics {
  drugName: string;
  periodDays: number;
  totalDispensed: number;
  totalRestocked: number;
  netChange: number;
  avgDailyUsage: number;
  dispensingTxnCount: number;
  restockingTxnCount: number;
  peakUsageDay: string;
  peakUsageQty: number;
  avgPerTransaction: number;
  currentStock: number;
  safetyStock: number;
  daysOfStockRemaining: number;
  status: StockStatus;
  recommendations: string[];
}

// ============================================================
// RESPONSE TYPES (Clean Output Format)
// ============================================================

export type ResponseType =
  | 'inventory_lookup'
  | 'inventory_update'
  | 'location_list'
  | 'forecast'
  | 'safety_stock'
  | 'expiry_report'
  | 'fefo_recommendation'
  | 'purchase_order'
  | 'analytics'
  | 'alert'
  | 'document'
  | 'message'
  | 'error';

export type DetailLevel = 'summary' | 'standard' | 'full' | 'audit';

export interface PMacsResponse {
  type: ResponseType;
  detailLevel: DetailLevel;
  summary: string;

  alert?: {
    level: 'info' | 'warning' | 'critical';
    message: string;
  };

  data: Record<string, unknown>;

  // Standard+ level
  recommendations?: string[];

  // Full+ level
  forecast?: ForecastResult;
  trends?: Record<string, unknown>;

  // Audit level
  auditTrail?: Transaction[];

  // Actions available
  actions: string[];

  // Follow-up suggestion
  followUp?: string;

  // For document generation
  documentId?: string;
  documentFormats?: string[];
}

// ============================================================
// QUERY CLASSIFICATION TYPES (Cost Optimization)
// ============================================================

export type QueryRoute = 'direct_db' | 'cached' | 'llm_required';

export type QueryIntent =
  | 'lookup_drug'
  | 'lookup_location'
  | 'list_inventory'
  | 'expiring_drugs'
  | 'list_locations'
  | 'stockout_report'
  | 'low_stock_report'
  | 'update_stock'
  | 'generate_forecast'
  | 'generate_po'
  | 'analytics'
  | 'complex'
  | 'fuzzy_lookup';

export interface ClassifiedQuery {
  route: QueryRoute;
  intent: QueryIntent;
  entities: {
    drugName?: string;
    location?: string;
    quantity?: number;
    days?: number;
  };
  confidence: number;
  requiresLLM: boolean;
}

// ============================================================
// AGENT CONTEXT TYPES
// ============================================================

export interface ConversationContext {
  userRole: UserRole;
  userId: string;
  lastDrug?: string;
  lastLocation?: string;
  lastTopic?: string;
  messageHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface AgentConfig {
  openaiApiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  enableCostOptimization?: boolean;
  dailyBudget?: number;
}
