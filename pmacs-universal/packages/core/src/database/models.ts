/**
 * P-MACS Database Models
 * Schema definitions matching the original P-MACS CSV structure
 */

import { z } from 'zod';

// ============================================================
// INVENTORY SCHEMA (inventory_master.csv)
// ============================================================

export const InventoryItemSchema = z.object({
  drug_id: z.string(),
  drug_name: z.string(),
  location: z.string(),
  qty_on_hand: z.coerce.number(),
  expiry_date: z.string(), // YYYY-MM-DD format
  batch_lot: z.string(),
  safety_stock: z.coerce.number(),
  avg_daily_use: z.coerce.number(),
});

export type InventoryItemRow = z.infer<typeof InventoryItemSchema>;

export const INVENTORY_HEADERS = [
  'drug_id',
  'drug_name',
  'location',
  'qty_on_hand',
  'expiry_date',
  'batch_lot',
  'safety_stock',
  'avg_daily_use',
] as const;

// ============================================================
// USER ACCESS SCHEMA (user_access.csv)
// ============================================================

export const UserAccessSchema = z.object({
  emp_id: z.string(),
  role: z.enum(['Nurse', 'Pharmacist', 'Master']),
  status: z.enum(['Active', 'Blacklisted']),
  name: z.string(),
  password_hash: z.string(),
  unified_group: z.string(),
  created_at: z.string(),
  last_login: z.string(),
});

export type UserAccessRow = z.infer<typeof UserAccessSchema>;

export const USER_ACCESS_HEADERS = [
  'emp_id',
  'role',
  'status',
  'name',
  'password_hash',
  'unified_group',
  'created_at',
  'last_login',
] as const;

// ============================================================
// TRANSACTION LOG SCHEMA (transaction_logs.csv)
// ============================================================

export const TransactionLogSchema = z.object({
  txn_id: z.string(),
  timestamp: z.string(),
  user_id: z.string(),
  drug_id: z.string(),
  action: z.string(),
  qty_change: z.coerce.number(),
});

export type TransactionLogRow = z.infer<typeof TransactionLogSchema>;

export const TRANSACTION_LOG_HEADERS = [
  'txn_id',
  'timestamp',
  'user_id',
  'drug_id',
  'action',
  'qty_change',
] as const;

// ============================================================
// ACCESS LOG SCHEMA (access_logs.csv)
// ============================================================

export const AccessLogSchema = z.object({
  log_id: z.string(),
  timestamp: z.string(),
  emp_id: z.string(),
  action: z.string(),
  ip_address: z.string().optional(),
  details: z.string().optional(),
});

export type AccessLogRow = z.infer<typeof AccessLogSchema>;

export const ACCESS_LOG_HEADERS = [
  'log_id',
  'timestamp',
  'emp_id',
  'action',
  'ip_address',
  'details',
] as const;

// ============================================================
// CONVERSION UTILITIES
// ============================================================

import type {
  InventoryItem,
  User,
  Transaction,
  AccessLog,
  StockStatus,
  DrugCategory,
  DrugInfo,
} from '../types/index.js';
import { CONTROLLED_SUBSTANCES } from '../types/index.js';

/**
 * Convert CSV row to InventoryItem
 */
export function rowToInventoryItem(row: InventoryItemRow): InventoryItem {
  return {
    drugId: row.drug_id,
    drugName: row.drug_name,
    location: row.location,
    qtyOnHand: row.qty_on_hand,
    expiryDate: row.expiry_date,
    batchLot: row.batch_lot,
    safetyStock: row.safety_stock,
    avgDailyUse: row.avg_daily_use,
  };
}

/**
 * Convert InventoryItem to CSV row
 */
export function inventoryItemToRow(item: InventoryItem): InventoryItemRow {
  return {
    drug_id: item.drugId,
    drug_name: item.drugName,
    location: item.location,
    qty_on_hand: item.qtyOnHand,
    expiry_date: item.expiryDate,
    batch_lot: item.batchLot,
    safety_stock: item.safetyStock,
    avg_daily_use: item.avgDailyUse,
  };
}

/**
 * Convert CSV row to User
 */
export function rowToUser(row: UserAccessRow): User {
  return {
    empId: row.emp_id,
    role: row.role,
    status: row.status,
    name: row.name,
    passwordHash: row.password_hash,
    unifiedGroup: row.unified_group,
    createdAt: row.created_at,
    lastLogin: row.last_login,
  };
}

/**
 * Convert User to CSV row
 */
export function userToRow(user: User): UserAccessRow {
  return {
    emp_id: user.empId,
    role: user.role,
    status: user.status,
    name: user.name,
    password_hash: user.passwordHash,
    unified_group: user.unifiedGroup,
    created_at: user.createdAt,
    last_login: user.lastLogin,
  };
}

/**
 * Convert CSV row to Transaction
 */
export function rowToTransaction(row: TransactionLogRow): Transaction {
  return {
    txnId: row.txn_id,
    timestamp: row.timestamp,
    userId: row.user_id,
    drugId: row.drug_id,
    action: row.action as Transaction['action'],
    qtyChange: row.qty_change,
  };
}

/**
 * Convert Transaction to CSV row
 */
export function transactionToRow(txn: Transaction): TransactionLogRow {
  return {
    txn_id: txn.txnId,
    timestamp: txn.timestamp,
    user_id: txn.userId,
    drug_id: txn.drugId,
    action: txn.action,
    qty_change: txn.qtyChange,
  };
}

/**
 * Determine stock status based on quantity and safety stock
 */
export function determineStockStatus(
  qty: number,
  safetyStock: number,
  expiryDate: string
): StockStatus {
  const now = new Date();
  const expiry = new Date(expiryDate);

  if (expiry < now) return 'expired';
  if (qty === 0) return 'stockout';
  if (qty < safetyStock * 0.5) return 'critical';
  if (qty < safetyStock) return 'low';
  return 'adequate';
}

/**
 * Calculate days remaining until expiry
 */
export function calculateDaysRemaining(expiryDate: string): number {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Determine drug category
 */
export function determineDrugCategory(drugName: string): DrugCategory {
  const upperName = drugName.toUpperCase();

  // Check if controlled substance
  if (CONTROLLED_SUBSTANCES.some((cs) => upperName.includes(cs.toUpperCase()))) {
    return 'controlled';
  }

  // Check for refrigerated drugs (common examples)
  const refrigeratedDrugs = ['INSULIN', 'VACCINE', 'EPINEPHRINE', 'BIOLOGICS'];
  if (refrigeratedDrugs.some((rd) => upperName.includes(rd))) {
    return 'refrigerated';
  }

  // Check for hazardous drugs (chemotherapy, etc.)
  const hazardousDrugs = ['CHEMO', 'CYTOTOXIC', 'METHOTREXATE'];
  if (hazardousDrugs.some((hd) => upperName.includes(hd))) {
    return 'hazardous';
  }

  return 'standard';
}

/**
 * Enrich InventoryItem with calculated fields
 */
export function enrichInventoryItem(item: InventoryItem): DrugInfo {
  return {
    ...item,
    status: determineStockStatus(item.qtyOnHand, item.safetyStock, item.expiryDate),
    daysRemaining: calculateDaysRemaining(item.expiryDate),
    category: determineDrugCategory(item.drugName),
  };
}
