/**
 * P-MACS CSV Database Adapter
 * Thread-safe CSV operations with improved error handling
 */

import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, join } from 'path';

import type {
  InventoryItem,
  User,
  Transaction,
  AccessLog,
  LocationSummary,
  DrugInfo,
} from '../types/index.js';

import {
  InventoryItemSchema,
  UserAccessSchema,
  TransactionLogSchema,
  INVENTORY_HEADERS,
  USER_ACCESS_HEADERS,
  TRANSACTION_LOG_HEADERS,
  rowToInventoryItem,
  inventoryItemToRow,
  rowToUser,
  userToRow,
  rowToTransaction,
  transactionToRow,
  enrichInventoryItem,
  type InventoryItemRow,
  type UserAccessRow,
  type TransactionLogRow,
} from './models.js';

import { fuzzyMatch } from '../utils/fuzzyMatch.js';

export interface DatabaseAdapter {
  // Inventory operations
  loadInventory(): Promise<InventoryItem[]>;
  saveInventory(items: InventoryItem[]): Promise<void>;
  searchInventory(drugName: string): Promise<DrugInfo[]>;
  getInventoryByLocation(location: string): Promise<DrugInfo[]>;
  updateInventoryItem(drugId: string, updates: Partial<InventoryItem>): Promise<InventoryItem | null>;
  getAllLocations(): Promise<LocationSummary[]>;
  getExpiringItems(days: number): Promise<DrugInfo[]>;
  getExpiredItems(): Promise<DrugInfo[]>;
  getLowStockItems(): Promise<DrugInfo[]>;

  // User operations
  loadUsers(): Promise<User[]>;
  saveUsers(users: User[]): Promise<void>;
  getUserById(empId: string): Promise<User | null>;
  updateUser(empId: string, updates: Partial<User>): Promise<User | null>;

  // Transaction operations
  loadTransactions(days?: number): Promise<Transaction[]>;
  addTransaction(txn: Transaction): Promise<void>;
  getTransactionsForDrug(drugId: string, days?: number): Promise<Transaction[]>;

  // Access log operations
  addAccessLog(log: AccessLog): Promise<void>;
  getAccessLogs(limit?: number): Promise<AccessLog[]>;
}

/**
 * CSV-based database adapter matching the original P-MACS structure
 */
export class CSVDatabaseAdapter implements DatabaseAdapter {
  private dataPath: string;
  private inventoryFile: string;
  private usersFile: string;
  private transactionsFile: string;
  private accessLogsFile: string;

  // Simple mutex for file operations
  private locks: Map<string, Promise<void>> = new Map();

  constructor(dataPath: string = './data') {
    this.dataPath = dataPath;
    this.inventoryFile = join(dataPath, 'inventory_master.csv');
    this.usersFile = join(dataPath, 'user_access.csv');
    this.transactionsFile = join(dataPath, 'transaction_logs.csv');
    this.accessLogsFile = join(dataPath, 'access_logs.csv');
  }

  /**
   * Acquire lock for a file operation
   */
  private async acquireLock(file: string): Promise<void> {
    while (this.locks.has(file)) {
      await this.locks.get(file);
    }
    let releaseLock: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    this.locks.set(file, lockPromise);
    return;
  }

  /**
   * Release lock for a file operation
   */
  private releaseLock(file: string): void {
    this.locks.delete(file);
  }

  /**
   * Ensure data directory exists
   */
  private async ensureDataDir(): Promise<void> {
    if (!existsSync(this.dataPath)) {
      await mkdir(this.dataPath, { recursive: true });
    }
  }

  /**
   * Read and parse CSV file with validation
   */
  private async readCSV<T>(
    filePath: string,
    schema: { parse: (data: unknown) => T }
  ): Promise<T[]> {
    await this.acquireLock(filePath);
    try {
      if (!existsSync(filePath)) {
        return [];
      }

      const content = await readFile(filePath, 'utf-8');
      const records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      // Validate and parse each record
      return records.map((record: unknown) => schema.parse(record));
    } finally {
      this.releaseLock(filePath);
    }
  }

  /**
   * Write CSV file atomically (write to temp, then rename)
   */
  private async writeCSV<T extends Record<string, unknown>>(
    filePath: string,
    data: T[],
    headers: readonly string[]
  ): Promise<void> {
    await this.ensureDataDir();
    await this.acquireLock(filePath);
    try {
      const content = stringify(data, {
        header: true,
        columns: headers as string[],
      });

      // Write to temp file first, then rename (atomic operation)
      const tempPath = `${filePath}.tmp`;
      await writeFile(tempPath, content, 'utf-8');

      // Rename temp to actual file
      const { rename } = await import('fs/promises');
      await rename(tempPath, filePath);
    } finally {
      this.releaseLock(filePath);
    }
  }

  /**
   * Append to CSV file
   */
  private async appendCSV<T extends Record<string, unknown>>(
    filePath: string,
    data: T,
    headers: readonly string[]
  ): Promise<void> {
    await this.ensureDataDir();
    await this.acquireLock(filePath);
    try {
      const fileExists = existsSync(filePath);
      const content = stringify([data], {
        header: !fileExists,
        columns: headers as string[],
      });

      const { appendFile } = await import('fs/promises');
      await appendFile(filePath, content, 'utf-8');
    } finally {
      this.releaseLock(filePath);
    }
  }

  // ============================================================
  // INVENTORY OPERATIONS
  // ============================================================

  async loadInventory(): Promise<InventoryItem[]> {
    const rows = await this.readCSV<InventoryItemRow>(this.inventoryFile, InventoryItemSchema);
    return rows.map(rowToInventoryItem);
  }

  async saveInventory(items: InventoryItem[]): Promise<void> {
    const rows = items.map(inventoryItemToRow);
    await this.writeCSV(this.inventoryFile, rows, INVENTORY_HEADERS);
  }

  async searchInventory(drugName: string): Promise<DrugInfo[]> {
    const inventory = await this.loadInventory();

    // Use fuzzy matching (60% threshold like original P-MACS)
    const matches = inventory.filter((item) => fuzzyMatch(item.drugName, drugName, 0.6));

    return matches.map(enrichInventoryItem);
  }

  async getInventoryByLocation(location: string): Promise<DrugInfo[]> {
    const inventory = await this.loadInventory();

    // Case-insensitive location matching
    const lowerLocation = location.toLowerCase();
    const matches = inventory.filter(
      (item) => item.location.toLowerCase().includes(lowerLocation)
    );

    return matches.map(enrichInventoryItem);
  }

  async updateInventoryItem(
    drugId: string,
    updates: Partial<InventoryItem>
  ): Promise<InventoryItem | null> {
    const inventory = await this.loadInventory();
    const index = inventory.findIndex((item) => item.drugId === drugId);

    if (index === -1) return null;

    inventory[index] = { ...inventory[index], ...updates };
    await this.saveInventory(inventory);

    return inventory[index];
  }

  async getAllLocations(): Promise<LocationSummary[]> {
    const inventory = await this.loadInventory();
    const locationMap = new Map<string, LocationSummary>();

    for (const item of inventory) {
      const existing = locationMap.get(item.location) || {
        location: item.location,
        itemCount: 0,
        totalQty: 0,
        stockoutCount: 0,
        lowStockCount: 0,
      };

      existing.itemCount++;
      existing.totalQty += item.qtyOnHand;
      if (item.qtyOnHand === 0) existing.stockoutCount++;
      if (item.qtyOnHand < item.safetyStock) existing.lowStockCount++;

      locationMap.set(item.location, existing);
    }

    return Array.from(locationMap.values()).sort((a, b) =>
      a.location.localeCompare(b.location)
    );
  }

  // ============================================================
  // USER OPERATIONS
  // ============================================================

  async loadUsers(): Promise<User[]> {
    const rows = await this.readCSV<UserAccessRow>(this.usersFile, UserAccessSchema);
    return rows.map(rowToUser);
  }

  async saveUsers(users: User[]): Promise<void> {
    const rows = users.map(userToRow);
    await this.writeCSV(this.usersFile, rows, USER_ACCESS_HEADERS);
  }

  async getUserById(empId: string): Promise<User | null> {
    const users = await this.loadUsers();
    return users.find((u) => u.empId === empId) || null;
  }

  async updateUser(empId: string, updates: Partial<User>): Promise<User | null> {
    const users = await this.loadUsers();
    const index = users.findIndex((u) => u.empId === empId);

    if (index === -1) return null;

    users[index] = { ...users[index], ...updates };
    await this.saveUsers(users);

    return users[index];
  }

  // ============================================================
  // TRANSACTION OPERATIONS
  // ============================================================

  async loadTransactions(days?: number): Promise<Transaction[]> {
    const rows = await this.readCSV<TransactionLogRow>(
      this.transactionsFile,
      TransactionLogSchema
    );
    let transactions = rows.map(rowToTransaction);

    if (days) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      transactions = transactions.filter((t) => new Date(t.timestamp) >= cutoff);
    }

    return transactions;
  }

  async addTransaction(txn: Transaction): Promise<void> {
    const row = transactionToRow(txn);
    await this.appendCSV(this.transactionsFile, row, TRANSACTION_LOG_HEADERS);
  }

  async getTransactionsForDrug(drugId: string, days: number = 90): Promise<Transaction[]> {
    const transactions = await this.loadTransactions(days);
    return transactions.filter(
      (t) =>
        t.drugId === drugId ||
        t.drugId.toLowerCase().includes(drugId.toLowerCase())
    );
  }

  // ============================================================
  // ACCESS LOG OPERATIONS
  // ============================================================

  async addAccessLog(log: AccessLog): Promise<void> {
    const row = {
      log_id: log.logId,
      timestamp: log.timestamp,
      emp_id: log.empId,
      action: log.action,
      ip_address: log.ipAddress || '',
      details: log.details || '',
    };
    await this.appendCSV(this.accessLogsFile, row, [
      'log_id',
      'timestamp',
      'emp_id',
      'action',
      'ip_address',
      'details',
    ]);
  }

  async getAccessLogs(limit: number = 50): Promise<AccessLog[]> {
    // For now, return empty array since we don't have access_logs.csv yet
    // In production, this would read from access_logs.csv
    return [];
  }

  // ============================================================
  // ADVANCED QUERIES (Improvements over original P-MACS)
  // ============================================================

  /**
   * Get all items below safety stock
   */
  async getLowStockItems(): Promise<DrugInfo[]> {
    const inventory = await this.loadInventory();
    return inventory
      .filter((item) => item.qtyOnHand < item.safetyStock)
      .map(enrichInventoryItem)
      .sort((a, b) => {
        // Sort by criticality: stockout first, then by how far below safety stock
        if (a.status === 'stockout' && b.status !== 'stockout') return -1;
        if (b.status === 'stockout' && a.status !== 'stockout') return 1;
        const aRatio = a.qtyOnHand / a.safetyStock;
        const bRatio = b.qtyOnHand / b.safetyStock;
        return aRatio - bRatio;
      });
  }

  /**
   * Get items expiring within N days
   */
  async getExpiringItems(days: number): Promise<DrugInfo[]> {
    const inventory = await this.loadInventory();
    const enriched = inventory.map(enrichInventoryItem);
    return enriched
      .filter((item) => item.daysRemaining <= days && item.daysRemaining > 0)
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
  }

  /**
   * Get expired items
   */
  async getExpiredItems(): Promise<DrugInfo[]> {
    const inventory = await this.loadInventory();
    const enriched = inventory.map(enrichInventoryItem);
    return enriched.filter((item) => item.status === 'expired');
  }

  /**
   * Get usage statistics for a drug over a period
   */
  async getDrugUsageStats(
    drugName: string,
    days: number = 30
  ): Promise<{
    totalUsed: number;
    totalReceived: number;
    avgDailyUsage: number;
    transactionCount: number;
  }> {
    const transactions = await this.loadTransactions(days);
    const drugTransactions = transactions.filter((t) =>
      t.drugId.toLowerCase().includes(drugName.toLowerCase())
    );

    let totalUsed = 0;
    let totalReceived = 0;

    for (const txn of drugTransactions) {
      if (txn.action === 'USE') {
        totalUsed += Math.abs(txn.qtyChange);
      } else if (txn.action === 'RECEIVE') {
        totalReceived += txn.qtyChange;
      }
    }

    return {
      totalUsed,
      totalReceived,
      avgDailyUsage: totalUsed / days,
      transactionCount: drugTransactions.length,
    };
  }
}

export default CSVDatabaseAdapter;
