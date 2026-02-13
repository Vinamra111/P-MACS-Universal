"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  AuthManager: () => AuthManager,
  CONTROLLED_SUBSTANCES: () => CONTROLLED_SUBSTANCES,
  CSVDatabaseAdapter: () => CSVDatabaseAdapter,
  CachedDatabaseAdapter: () => CachedDatabaseAdapter,
  DAY_OF_WEEK_FACTORS: () => DAY_OF_WEEK_FACTORS,
  PasswordHasher: () => PasswordHasher,
  ROLE_PERMISSIONS: () => ROLE_PERMISSIONS,
  VERSION: () => VERSION,
  addDays: () => addDays,
  calculateDetailedTrend: () => calculateDetailedTrend,
  calculateEWMA: () => calculateEWMA,
  calculateForecastAccuracy: () => calculateForecastAccuracy,
  calculateLinearRegression: () => calculateLinearRegression,
  calculateLinearTrend: () => calculateDetailedTrend,
  calculateSafetyStock: () => calculateSafetyStock,
  calculateSafetyStockWilson: () => calculateSafetyStock,
  calculateStdDev: () => calculateStdDev,
  classifyABCXYZ: () => classifyABCXYZ,
  classifyQuery: () => classifyQuery,
  createAllTools: () => createAllTools,
  createCalculateSafetyStockTool: () => createCalculateSafetyStockTool,
  createCheckExpiringDrugsTool: () => createCheckExpiringDrugsTool,
  createGetForecastMlTool: () => createGetForecastMlTool,
  createGetFullInventoryTool: () => createGetFullInventoryTool,
  createGetLocationListTool: () => createGetLocationListTool,
  createListWardStockTool: () => createListWardStockTool,
  createLookupInventoryTool: () => createLookupInventoryTool,
  createManageUserAccessTool: () => createManageUserAccessTool,
  createUpdateInventoryTool: () => createUpdateInventoryTool,
  daysBetween: () => daysBetween,
  daysUntil: () => daysUntil,
  detectSeasonalPatterns: () => detectSeasonalPatterns,
  detectSeasonality: () => detectSeasonalPatterns,
  determineDetailLevel: () => determineDetailLevel,
  estimateTokens: () => estimateTokens,
  formatAccessDenied: () => formatAccessDenied,
  formatDate: () => formatDate,
  formatDateReadable: () => formatDateReadable,
  formatDateTime: () => formatDateTime,
  formatError: () => formatError,
  formatExpiryReport: () => formatExpiryReport,
  formatForecast: () => formatForecast,
  formatInventoryLookup: () => formatInventoryLookup,
  formatPurchaseOrder: () => formatPurchaseOrder,
  formatStockoutRisk: () => formatStockoutRisk,
  formatTopMovers: () => formatTopMovers,
  generateDateRange: () => generateDateRange,
  generateForecast: () => generateForecast,
  getCurrentTimestamp: () => getCurrentTimestamp,
  getDayFactor: () => getDayFactor,
  getDayName: () => getDayName,
  getMonthName: () => getMonthName,
  getToolByName: () => getToolByName,
  getToolsByCategory: () => getToolsByCategory,
  getToolsByPermission: () => getToolsByPermission,
  isPast: () => isPast,
  mustUseLLM: () => mustUseLLM,
  predictStockoutDate: () => predictStockoutDate,
  removeOutliers: () => removeOutliers,
  smartDrugMatch: () => smartDrugMatch
});
module.exports = __toCommonJS(index_exports);

// src/types/index.ts
var ROLE_PERMISSIONS = {
  Nurse: ["read"],
  Pharmacist: ["read", "update", "forecast"],
  Master: ["read", "update", "forecast", "admin"]
};
var CONTROLLED_SUBSTANCES = [
  "Morphine",
  "Fentanyl",
  "Oxycodone",
  "Hydrocodone",
  "Diazepam",
  "Alprazolam",
  "Ketamine",
  "Codeine",
  "Methadone",
  "Hydromorphone"
];

// src/database/CSVAdapter.ts
var import_sync = require("csv-parse/sync");
var import_sync2 = require("csv-stringify/sync");
var import_util = require("util");
var import_fs_sync = require("fs");
var import_promises = {
  readFile: import_util.promisify(import_fs_sync.readFile),
  writeFile: import_util.promisify(import_fs_sync.writeFile),
  appendFile: import_util.promisify(import_fs_sync.appendFile),
  mkdir: import_util.promisify(import_fs_sync.mkdir),
  readdir: import_util.promisify(import_fs_sync.readdir),
  stat: import_util.promisify(import_fs_sync.stat),
  unlink: import_util.promisify(import_fs_sync.unlink),
  rename: import_util.promisify(import_fs_sync.rename),
};
var import_fs = require("fs");
var import_path = require("path");

// src/database/models.ts
var import_zod = require("zod");
var InventoryItemSchema = import_zod.z.object({
  drug_id: import_zod.z.string(),
  drug_name: import_zod.z.string(),
  location: import_zod.z.string(),
  qty_on_hand: import_zod.z.coerce.number(),
  expiry_date: import_zod.z.string(),
  // YYYY-MM-DD format
  batch_lot: import_zod.z.string(),
  safety_stock: import_zod.z.coerce.number(),
  avg_daily_use: import_zod.z.coerce.number()
});
var INVENTORY_HEADERS = [
  "drug_id",
  "drug_name",
  "location",
  "qty_on_hand",
  "expiry_date",
  "batch_lot",
  "safety_stock",
  "avg_daily_use"
];
var UserAccessSchema = import_zod.z.object({
  emp_id: import_zod.z.string(),
  role: import_zod.z.enum(["Nurse", "Pharmacist", "Master"]),
  status: import_zod.z.enum(["Active", "Blacklisted"]),
  name: import_zod.z.string(),
  password_hash: import_zod.z.string(),
  unified_group: import_zod.z.string(),
  created_at: import_zod.z.string(),
  last_login: import_zod.z.string()
});
var USER_ACCESS_HEADERS = [
  "emp_id",
  "role",
  "status",
  "name",
  "password_hash",
  "unified_group",
  "created_at",
  "last_login"
];
var TransactionLogSchema = import_zod.z.object({
  txn_id: import_zod.z.string(),
  timestamp: import_zod.z.string(),
  user_id: import_zod.z.string(),
  drug_id: import_zod.z.string(),
  action: import_zod.z.string(),
  qty_change: import_zod.z.coerce.number()
});
var TRANSACTION_LOG_HEADERS = [
  "txn_id",
  "timestamp",
  "user_id",
  "drug_id",
  "action",
  "qty_change"
];
var AccessLogSchema = import_zod.z.object({
  log_id: import_zod.z.string(),
  timestamp: import_zod.z.string(),
  emp_id: import_zod.z.string(),
  action: import_zod.z.string(),
  ip_address: import_zod.z.string().optional(),
  details: import_zod.z.string().optional()
});
function rowToInventoryItem(row) {
  return {
    drugId: row.drug_id,
    drugName: row.drug_name,
    location: row.location,
    qtyOnHand: row.qty_on_hand,
    expiryDate: row.expiry_date,
    batchLot: row.batch_lot,
    safetyStock: row.safety_stock,
    avgDailyUse: row.avg_daily_use
  };
}
function inventoryItemToRow(item) {
  return {
    drug_id: item.drugId,
    drug_name: item.drugName,
    location: item.location,
    qty_on_hand: item.qtyOnHand,
    expiry_date: item.expiryDate,
    batch_lot: item.batchLot,
    safety_stock: item.safetyStock,
    avg_daily_use: item.avgDailyUse
  };
}
function rowToUser(row) {
  return {
    empId: row.emp_id,
    role: row.role,
    status: row.status,
    name: row.name,
    passwordHash: row.password_hash,
    unifiedGroup: row.unified_group,
    createdAt: row.created_at,
    lastLogin: row.last_login
  };
}
function userToRow(user) {
  return {
    emp_id: user.empId,
    role: user.role,
    status: user.status,
    name: user.name,
    password_hash: user.passwordHash,
    unified_group: user.unifiedGroup,
    created_at: user.createdAt,
    last_login: user.lastLogin
  };
}
function rowToTransaction(row) {
  return {
    txnId: row.txn_id,
    timestamp: row.timestamp,
    userId: row.user_id,
    drugId: row.drug_id,
    action: row.action,
    qtyChange: row.qty_change
  };
}
function transactionToRow(txn) {
  return {
    txn_id: txn.txnId,
    timestamp: txn.timestamp,
    user_id: txn.userId,
    drug_id: txn.drugId,
    action: txn.action,
    qty_change: txn.qtyChange
  };
}
function determineStockStatus(qty, safetyStock, expiryDate) {
  const now = /* @__PURE__ */ new Date();
  const expiry = new Date(expiryDate);
  if (expiry < now) return "expired";
  if (qty === 0) return "stockout";
  if (qty < safetyStock * 0.5) return "critical";
  if (qty < safetyStock) return "low";
  return "adequate";
}
function calculateDaysRemaining(expiryDate) {
  const now = /* @__PURE__ */ new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - now.getTime();
  return Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
}
function determineDrugCategory(drugName) {
  const upperName = drugName.toUpperCase();
  if (CONTROLLED_SUBSTANCES.some((cs) => upperName.includes(cs.toUpperCase()))) {
    return "controlled";
  }
  const refrigeratedDrugs = ["INSULIN", "VACCINE", "EPINEPHRINE", "BIOLOGICS"];
  if (refrigeratedDrugs.some((rd) => upperName.includes(rd))) {
    return "refrigerated";
  }
  const hazardousDrugs = ["CHEMO", "CYTOTOXIC", "METHOTREXATE"];
  if (hazardousDrugs.some((hd) => upperName.includes(hd))) {
    return "hazardous";
  }
  return "standard";
}
function enrichInventoryItem(item) {
  return {
    ...item,
    status: determineStockStatus(item.qtyOnHand, item.safetyStock, item.expiryDate),
    daysRemaining: calculateDaysRemaining(item.expiryDate),
    category: determineDrugCategory(item.drugName)
  };
}

// src/utils/fuzzyMatch.ts
var import_fuse = __toESM(require("fuse.js"));
function similarityRatio(str1, str2) {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;
  if (s1.includes(s2) || s2.includes(s1)) {
    const shorter = s1.length < s2.length ? s1 : s2;
    const longer = s1.length < s2.length ? s2 : s1;
    return shorter.length / longer.length;
  }
  const matrix = [];
  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          // substitution
          matrix[i][j - 1] + 1,
          // insertion
          matrix[i - 1][j] + 1
          // deletion
        );
      }
    }
  }
  const distance = matrix[s1.length][s2.length];
  const maxLength = Math.max(s1.length, s2.length);
  return 1 - distance / maxLength;
}
function fuzzyMatch(str1, str2, threshold = 0.6) {
  return similarityRatio(str1, str2) >= threshold;
}
function normalizeDrugName(name) {
  return name.toLowerCase().trim().replace(/\s+/g, " ").replace(/[^a-z0-9\s]/g, "").replace(/\b(mg|ml|mcg|iu|units?)\b/gi, "").trim();
}
function smartDrugMatch(query, drugName, threshold = 0.6) {
  const normalizedQuery = normalizeDrugName(query);
  const normalizedDrug = normalizeDrugName(drugName);
  if (normalizedQuery === normalizedDrug) return true;
  if (normalizedDrug.includes(normalizedQuery) && normalizedQuery.length >= 3) {
    return true;
  }
  return fuzzyMatch(normalizedQuery, normalizedDrug, threshold);
}

// src/database/CSVAdapter.ts
var CSVDatabaseAdapter = class {
  dataPath;
  inventoryFile;
  usersFile;
  transactionsFile;
  accessLogsFile;
  // Simple mutex for file operations
  locks = /* @__PURE__ */ new Map();
  constructor(dataPath = "./data") {
    this.dataPath = dataPath;
    this.inventoryFile = (0, import_path.join)(dataPath, "inventory_master.csv");
    this.usersFile = (0, import_path.join)(dataPath, "user_access.csv");
    this.transactionsFile = (0, import_path.join)(dataPath, "transaction_logs.csv");
    this.accessLogsFile = (0, import_path.join)(dataPath, "access_logs.csv");
  }
  /**
   * Acquire lock for a file operation
   */
  async acquireLock(file) {
    while (this.locks.has(file)) {
      await this.locks.get(file);
    }
    let releaseLock;
    const lockPromise = new Promise((resolve) => {
      releaseLock = resolve;
    });
    this.locks.set(file, lockPromise);
    return;
  }
  /**
   * Release lock for a file operation
   */
  releaseLock(file) {
    this.locks.delete(file);
  }
  /**
   * Ensure data directory exists
   */
  async ensureDataDir() {
    if (!(0, import_fs.existsSync)(this.dataPath)) {
      await (0, import_promises.mkdir)(this.dataPath, { recursive: true });
    }
  }
  /**
   * Read and parse CSV file with validation
   */
  async readCSV(filePath, schema) {
    await this.acquireLock(filePath);
    try {
      if (!(0, import_fs.existsSync)(filePath)) {
        return [];
      }
      const content = await (0, import_promises.readFile)(filePath, "utf-8");
      const records = (0, import_sync.parse)(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
      return records.map((record) => schema.parse(record));
    } finally {
      this.releaseLock(filePath);
    }
  }
  /**
   * Write CSV file atomically (write to temp, then rename)
   */
  async writeCSV(filePath, data, headers) {
    await this.ensureDataDir();
    await this.acquireLock(filePath);
    try {
      const content = (0, import_sync2.stringify)(data, {
        header: true,
        columns: headers
      });
      const tempPath = `${filePath}.tmp`;
      await (0, import_promises.writeFile)(tempPath, content, "utf-8");
      const { rename } = await import("fs/promises");
      await rename(tempPath, filePath);
    } finally {
      this.releaseLock(filePath);
    }
  }
  /**
   * Append to CSV file
   */
  async appendCSV(filePath, data, headers) {
    await this.ensureDataDir();
    await this.acquireLock(filePath);
    try {
      const fileExists = (0, import_fs.existsSync)(filePath);
      const content = (0, import_sync2.stringify)([data], {
        header: !fileExists,
        columns: headers
      });
      const { appendFile } = await import("fs/promises");
      await appendFile(filePath, content, "utf-8");
    } finally {
      this.releaseLock(filePath);
    }
  }
  // ============================================================
  // INVENTORY OPERATIONS
  // ============================================================
  async loadInventory() {
    const rows = await this.readCSV(this.inventoryFile, InventoryItemSchema);
    return rows.map(rowToInventoryItem);
  }
  async saveInventory(items) {
    const rows = items.map(inventoryItemToRow);
    await this.writeCSV(this.inventoryFile, rows, INVENTORY_HEADERS);
  }
  async searchInventory(drugName) {
    const inventory = await this.loadInventory();
    const matches = inventory.filter((item) => fuzzyMatch(item.drugName, drugName, 0.6));
    return matches.map(enrichInventoryItem);
  }
  async getInventoryByLocation(location) {
    const inventory = await this.loadInventory();
    const lowerLocation = location.toLowerCase();
    const matches = inventory.filter(
      (item) => item.location.toLowerCase().includes(lowerLocation)
    );
    return matches.map(enrichInventoryItem);
  }
  async updateInventoryItem(drugId, updates) {
    const inventory = await this.loadInventory();
    const index = inventory.findIndex((item) => item.drugId === drugId);
    if (index === -1) return null;
    inventory[index] = { ...inventory[index], ...updates };
    await this.saveInventory(inventory);
    return inventory[index];
  }
  async getAllLocations() {
    const inventory = await this.loadInventory();
    const locationMap = /* @__PURE__ */ new Map();
    for (const item of inventory) {
      const existing = locationMap.get(item.location) || {
        location: item.location,
        itemCount: 0,
        totalQty: 0,
        stockoutCount: 0,
        lowStockCount: 0
      };
      existing.itemCount++;
      existing.totalQty += item.qtyOnHand;
      if (item.qtyOnHand === 0) existing.stockoutCount++;
      if (item.qtyOnHand < item.safetyStock) existing.lowStockCount++;
      locationMap.set(item.location, existing);
    }
    return Array.from(locationMap.values()).sort(
      (a, b) => a.location.localeCompare(b.location)
    );
  }
  // ============================================================
  // USER OPERATIONS
  // ============================================================
  async loadUsers() {
    const rows = await this.readCSV(this.usersFile, UserAccessSchema);
    return rows.map(rowToUser);
  }
  async saveUsers(users) {
    const rows = users.map(userToRow);
    await this.writeCSV(this.usersFile, rows, USER_ACCESS_HEADERS);
  }
  async getUserById(empId) {
    const users = await this.loadUsers();
    return users.find((u) => u.empId === empId) || null;
  }
  async updateUser(empId, updates) {
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
  async loadTransactions(days) {
    const rows = await this.readCSV(
      this.transactionsFile,
      TransactionLogSchema
    );
    let transactions = rows.map(rowToTransaction);
    if (days) {
      const cutoff = /* @__PURE__ */ new Date();
      cutoff.setDate(cutoff.getDate() - days);
      transactions = transactions.filter((t) => new Date(t.timestamp) >= cutoff);
    }
    return transactions;
  }
  async addTransaction(txn) {
    const row = transactionToRow(txn);
    await this.appendCSV(this.transactionsFile, row, TRANSACTION_LOG_HEADERS);
  }
  async getTransactionsForDrug(drugId, days = 90) {
    const transactions = await this.loadTransactions(days);
    return transactions.filter(
      (t) => t.drugId === drugId || t.drugId.toLowerCase().includes(drugId.toLowerCase())
    );
  }
  // ============================================================
  // ACCESS LOG OPERATIONS
  // ============================================================
  async addAccessLog(log) {
    const row = {
      log_id: log.logId,
      timestamp: log.timestamp,
      emp_id: log.empId,
      action: log.action,
      ip_address: log.ipAddress || "",
      details: log.details || ""
    };
    await this.appendCSV(this.accessLogsFile, row, [
      "log_id",
      "timestamp",
      "emp_id",
      "action",
      "ip_address",
      "details"
    ]);
  }
  async getAccessLogs(limit = 50) {
    return [];
  }
  // ============================================================
  // ADVANCED QUERIES (Improvements over original P-MACS)
  // ============================================================
  /**
   * Get all items below safety stock
   */
  async getLowStockItems() {
    const inventory = await this.loadInventory();
    return inventory.filter((item) => item.qtyOnHand < item.safetyStock).map(enrichInventoryItem).sort((a, b) => {
      if (a.status === "stockout" && b.status !== "stockout") return -1;
      if (b.status === "stockout" && a.status !== "stockout") return 1;
      const aRatio = a.qtyOnHand / a.safetyStock;
      const bRatio = b.qtyOnHand / b.safetyStock;
      return aRatio - bRatio;
    });
  }
  /**
   * Get items expiring within N days
   */
  async getExpiringItems(days) {
    const inventory = await this.loadInventory();
    const enriched = inventory.map(enrichInventoryItem);
    return enriched.filter((item) => item.daysRemaining <= days && item.daysRemaining > 0).sort((a, b) => a.daysRemaining - b.daysRemaining);
  }
  /**
   * Get expired items
   */
  async getExpiredItems() {
    const inventory = await this.loadInventory();
    const enriched = inventory.map(enrichInventoryItem);
    return enriched.filter((item) => item.status === "expired");
  }
  /**
   * Get usage statistics for a drug over a period
   */
  async getDrugUsageStats(drugName, days = 30) {
    const transactions = await this.loadTransactions(days);
    const drugTransactions = transactions.filter(
      (t) => t.drugId.toLowerCase().includes(drugName.toLowerCase())
    );
    let totalUsed = 0;
    let totalReceived = 0;
    for (const txn of drugTransactions) {
      if (txn.action === "USE") {
        totalUsed += Math.abs(txn.qtyChange);
      } else if (txn.action === "RECEIVE") {
        totalReceived += txn.qtyChange;
      }
    }
    return {
      totalUsed,
      totalReceived,
      avgDailyUsage: totalUsed / days,
      transactionCount: drugTransactions.length
    };
  }
};

// src/database/CachedAdapter.ts
var CachedDatabaseAdapter = class {
  baseAdapter;
  cache = /* @__PURE__ */ new Map();
  // Cache TTLs (in milliseconds)
  CACHE_TTL = {
    inventory: 5 * 60 * 1e3,
    // 5 minutes (inventory changes infrequently)
    transactions: 2 * 60 * 1e3,
    // 2 minutes (transactions added periodically)
    users: 10 * 60 * 1e3,
    // 10 minutes (users rarely change)
    locations: 5 * 60 * 1e3,
    // 5 minutes
    expiring: 5 * 60 * 1e3,
    // 5 minutes
    lowStock: 5 * 60 * 1e3
    // 5 minutes
  };
  constructor(baseAdapter) {
    this.baseAdapter = baseAdapter;
    setInterval(() => this.cleanupStaleEntries(), 60 * 1e3);
  }
  /**
   * Get cached value or execute function and cache result
   */
  async getCached(key, ttl, fetchFn) {
    const cached = this.cache.get(key);
    const now = Date.now();
    if (cached && now - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    const data = await fetchFn();
    this.cache.set(key, {
      data,
      timestamp: now,
      ttl
    });
    return data;
  }
  /**
   * Invalidate specific cache key or pattern
   */
  invalidateCache(pattern) {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern)) {
        this.cache.delete(key);
      }
    }
  }
  /**
   * Remove stale cache entries
   */
  cleanupStaleEntries() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
  // ==========================================
  // CACHED READ OPERATIONS (MASSIVE SPEEDUP)
  // ==========================================
  async loadInventory() {
    return this.getCached(
      "inventory:all",
      this.CACHE_TTL.inventory,
      () => this.baseAdapter.loadInventory()
    );
  }
  async loadTransactions(days) {
    const cacheKey = `transactions:${days || "all"}`;
    return this.getCached(
      cacheKey,
      this.CACHE_TTL.transactions,
      () => this.baseAdapter.loadTransactions(days)
    );
  }
  async loadUsers() {
    return this.getCached(
      "users:all",
      this.CACHE_TTL.users,
      () => this.baseAdapter.loadUsers()
    );
  }
  async searchInventory(drugName) {
    return this.baseAdapter.searchInventory(drugName);
  }
  async getInventoryByLocation(location) {
    return this.baseAdapter.getInventoryByLocation(location);
  }
  async getAllLocations() {
    return this.getCached(
      "locations:all",
      this.CACHE_TTL.locations,
      () => this.baseAdapter.getAllLocations()
    );
  }
  async getExpiringItems(days) {
    const cacheKey = `expiring:${days}`;
    return this.getCached(
      cacheKey,
      this.CACHE_TTL.expiring,
      () => this.baseAdapter.getExpiringItems(days)
    );
  }
  async getExpiredItems() {
    return this.getCached(
      "expired:all",
      this.CACHE_TTL.expiring,
      () => this.baseAdapter.getExpiredItems()
    );
  }
  async getLowStockItems() {
    return this.getCached(
      "lowStock:all",
      this.CACHE_TTL.lowStock,
      () => this.baseAdapter.getLowStockItems()
    );
  }
  async getUserById(empId) {
    return this.baseAdapter.getUserById(empId);
  }
  async getTransactionsForDrug(drugId, days) {
    return this.baseAdapter.getTransactionsForDrug(drugId, days);
  }
  async getAccessLogs(limit) {
    return this.baseAdapter.getAccessLogs(limit);
  }
  // ==========================================
  // WRITE OPERATIONS (INVALIDATE CACHE)
  // ==========================================
  async saveInventory(items) {
    await this.baseAdapter.saveInventory(items);
    this.invalidateCache("inventory:");
    this.invalidateCache("locations:");
    this.invalidateCache("expiring:");
    this.invalidateCache("expired:");
    this.invalidateCache("lowStock:");
  }
  async updateInventoryItem(drugId, updates) {
    const result = await this.baseAdapter.updateInventoryItem(drugId, updates);
    this.invalidateCache("inventory:");
    this.invalidateCache("locations:");
    this.invalidateCache("expiring:");
    this.invalidateCache("expired:");
    this.invalidateCache("lowStock:");
    return result;
  }
  async saveUsers(users) {
    await this.baseAdapter.saveUsers(users);
    this.invalidateCache("users:");
  }
  async updateUser(empId, updates) {
    const result = await this.baseAdapter.updateUser(empId, updates);
    this.invalidateCache("users:");
    return result;
  }
  async addTransaction(txn) {
    await this.baseAdapter.addTransaction(txn);
    this.invalidateCache("transactions:");
  }
  async addAccessLog(log) {
    await this.baseAdapter.addAccessLog(log);
  }
  /**
   * Force refresh all caches (useful for testing)
   */
  clearAllCaches() {
    this.cache.clear();
  }
  /**
   * Get cache statistics (for monitoring)
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        age: Date.now() - entry.timestamp,
        ttl: entry.ttl,
        dataSize: JSON.stringify(entry.data).length
      }))
    };
  }
};

// src/auth/AuthManager.ts
var import_crypto = require("crypto");

// src/utils/dateUtils.ts
function formatDate(date) {
  return date.toISOString().split("T")[0];
}
function formatDateTime(date) {
  const d = formatDate(date);
  const h = date.getHours().toString().padStart(2, "0");
  const m = date.getMinutes().toString().padStart(2, "0");
  return `${d} ${h}:${m}`;
}
function formatDateReadable(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}
function getCurrentTimestamp() {
  return formatDateTime(/* @__PURE__ */ new Date());
}
function daysBetween(date1, date2) {
  const d1 = typeof date1 === "string" ? new Date(date1) : date1;
  const d2 = typeof date2 === "string" ? new Date(date2) : date2;
  const diffTime = d2.getTime() - d1.getTime();
  return Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
}
function daysUntil(date) {
  return daysBetween(/* @__PURE__ */ new Date(), date);
}
function isPast(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d < /* @__PURE__ */ new Date();
}
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
function getDayName(date) {
  return date.toLocaleDateString("en-US", { weekday: "long" });
}
function getMonthName(date) {
  return date.toLocaleDateString("en-US", { month: "long" });
}
function generateDateRange(startDate, days) {
  const dates = [];
  for (let i = 0; i < days; i++) {
    dates.push(addDays(startDate, i));
  }
  return dates;
}
var DAY_OF_WEEK_FACTORS = {
  Monday: 1.15,
  Tuesday: 1.1,
  Wednesday: 1.05,
  Thursday: 1,
  Friday: 0.95,
  Saturday: 0.8,
  Sunday: 0.75
};
function getDayFactor(date) {
  const dayName = getDayName(date);
  return DAY_OF_WEEK_FACTORS[dayName] || 1;
}

// src/auth/AuthManager.ts
var PERMISSIONS = {
  Nurse: ["read"],
  Pharmacist: ["read", "update", "forecast"],
  Master: ["read", "update", "forecast", "admin"]
};
var UNIFIED_PASSWORDS = {
  NURSE_GROUP: "nurse123",
  PHARMACIST_GROUP: "pharm123",
  MASTER_GROUP: "admin123"
};
var AuthManager = class {
  db;
  masterKey;
  sessionTTL;
  sessions = /* @__PURE__ */ new Map();
  constructor(config) {
    this.db = config.database;
    this.masterKey = config.masterKey || "admin123";
    this.sessionTTL = config.sessionTTL || 8 * 60 * 60 * 1e3;
  }
  /**
   * Hash password using SHA-256 (matching original P-MACS)
   */
  hashPassword(password) {
    return (0, import_crypto.createHash)("sha256").update(password).digest("hex");
  }
  /**
   * Generate a secure session token
   */
  generateSessionToken() {
    return (0, import_crypto.randomBytes)(32).toString("hex");
  }
  /**
   * Generate a unique ID for logs
   */
  generateLogId() {
    return `LOG${Date.now()}${(0, import_crypto.randomBytes)(4).toString("hex").toUpperCase()}`;
  }
  /**
   * Step 1: Group/Unified Login
   * Validates role selection with group password
   */
  async step1UnifiedLogin(role, groupPassword) {
    if (role === "Master") {
      if (groupPassword === this.masterKey) {
        return { success: true };
      }
      return { success: false, error: "Invalid master key" };
    }
    const groupKey = role === "Nurse" ? "NURSE_GROUP" : "PHARMACIST_GROUP";
    const expectedPassword = UNIFIED_PASSWORDS[groupKey];
    if (groupPassword === expectedPassword) {
      return { success: true };
    }
    return { success: false, error: "Invalid group password" };
  }
  /**
   * Step 2: Personal Login
   * Validates individual employee credentials
   */
  async step2PersonalLogin(empId, password, expectedRole) {
    const user = await this.db.getUserById(empId);
    if (!user) {
      const newUser = {
        empId,
        role: expectedRole,
        status: "Active",
        name: `User ${empId}`,
        passwordHash: this.hashPassword(password),
        unifiedGroup: `${expectedRole.toUpperCase()}_GROUP`,
        createdAt: getCurrentTimestamp(),
        lastLogin: getCurrentTimestamp()
      };
      const users = await this.db.loadUsers();
      users.push(newUser);
      await this.db.saveUsers(users);
      await this.logAccess(empId, "ACCOUNT_CREATED", "New user account created");
      const sessionToken2 = this.generateSessionToken();
      this.sessions.set(sessionToken2, {
        user: newUser,
        expiresAt: Date.now() + this.sessionTTL
      });
      return {
        success: true,
        user: newUser,
        sessionToken: sessionToken2
      };
    }
    if (user.status === "Blacklisted") {
      await this.logAccess(empId, "LOGIN_BLOCKED", "Blacklisted user attempted login");
      return {
        success: false,
        error: "Account is blacklisted. Contact administrator."
      };
    }
    if (user.role !== expectedRole) {
      await this.logAccess(empId, "ROLE_MISMATCH", `Expected ${expectedRole}, user is ${user.role}`);
      return {
        success: false,
        error: `This ID is registered as ${user.role}, not ${expectedRole}`
      };
    }
    const passwordHash = this.hashPassword(password);
    if (user.passwordHash !== passwordHash) {
      await this.logAccess(empId, "LOGIN_FAILED", "Invalid password");
      return {
        success: false,
        error: "Invalid password"
      };
    }
    await this.db.updateUser(empId, { lastLogin: getCurrentTimestamp() });
    const sessionToken = this.generateSessionToken();
    this.sessions.set(sessionToken, {
      user,
      expiresAt: Date.now() + this.sessionTTL
    });
    await this.logAccess(empId, "LOGIN_SUCCESS", "User logged in successfully");
    return {
      success: true,
      user,
      sessionToken
    };
  }
  /**
   * Simple login (combines both steps - for testing/API use)
   */
  async simpleLogin(empId, password) {
    const user = await this.db.getUserById(empId);
    if (!user) {
      return {
        success: false,
        error: "User not found"
      };
    }
    if (user.status === "Blacklisted") {
      return {
        success: false,
        error: "Account is blacklisted"
      };
    }
    const passwordHash = this.hashPassword(password);
    if (user.passwordHash !== passwordHash) {
      return {
        success: false,
        error: "Invalid password"
      };
    }
    await this.db.updateUser(empId, { lastLogin: getCurrentTimestamp() });
    const sessionToken = this.generateSessionToken();
    this.sessions.set(sessionToken, {
      user,
      expiresAt: Date.now() + this.sessionTTL
    });
    return {
      success: true,
      user,
      sessionToken
    };
  }
  /**
   * Validate session token
   */
  validateSession(sessionToken) {
    const session = this.sessions.get(sessionToken);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(sessionToken);
      return null;
    }
    return session.user;
  }
  /**
   * Logout - invalidate session
   */
  async logout(sessionToken) {
    const session = this.sessions.get(sessionToken);
    if (session) {
      await this.logAccess(session.user.empId, "LOGOUT", "User logged out");
      this.sessions.delete(sessionToken);
    }
  }
  /**
   * Check if user has permission for an action
   */
  hasPermission(role, permission) {
    return PERMISSIONS[role] && PERMISSIONS[role].includes(permission) || false;
  }
  /**
   * Get all permissions for a role
   */
  getPermissions(role) {
    return PERMISSIONS[role] || [];
  }
  /**
   * Blacklist a user (Master only)
   */
  async blacklistUser(empId, adminId) {
    const user = await this.db.getUserById(empId);
    if (!user) {
      return { success: false, error: "User not found" };
    }
    if (user.role === "Master") {
      return { success: false, error: "Cannot blacklist Master users" };
    }
    await this.db.updateUser(empId, { status: "Blacklisted" });
    await this.logAccess(adminId, "USER_BLACKLISTED", `Blacklisted user ${empId}`);
    for (const [token, session] of this.sessions.entries()) {
      if (session.user.empId === empId) {
        this.sessions.delete(token);
      }
    }
    return { success: true };
  }
  /**
   * Whitelist (reactivate) a user (Master only)
   */
  async whitelistUser(empId, adminId) {
    const user = await this.db.getUserById(empId);
    if (!user) {
      return { success: false, error: "User not found" };
    }
    await this.db.updateUser(empId, { status: "Active" });
    await this.logAccess(adminId, "USER_WHITELISTED", `Reactivated user ${empId}`);
    return { success: true };
  }
  /**
   * Log access event
   */
  async logAccess(empId, action, details) {
    const log = {
      logId: this.generateLogId(),
      timestamp: getCurrentTimestamp(),
      empId,
      action,
      details
    };
    await this.db.addAccessLog(log);
  }
  /**
   * Get all users (Master only)
   */
  async getAllUsers() {
    return this.db.loadUsers();
  }
  /**
   * Change user password
   */
  async changePassword(empId, oldPassword, newPassword) {
    const user = await this.db.getUserById(empId);
    if (!user) {
      return { success: false, error: "User not found" };
    }
    const oldHash = this.hashPassword(oldPassword);
    if (user.passwordHash !== oldHash) {
      return { success: false, error: "Current password is incorrect" };
    }
    const newHash = this.hashPassword(newPassword);
    await this.db.updateUser(empId, { passwordHash: newHash });
    await this.logAccess(empId, "PASSWORD_CHANGED", "User changed password");
    return { success: true };
  }
};

// src/auth/PasswordHasher.ts
// bcrypt not available in mobile - using crypto only
// var import_bcrypt = __toESM(require("bcrypt"));
var import_crypto2 = __toESM(require("crypto"));
var BCRYPT_ROUNDS = 12;
var PasswordHasher = class {
  /**
   * Hash a password using bcrypt (secure method)
   */
  static async hash(password) {
    const sha256Hash = import_crypto2.default.createHash("sha256").update(password).digest("hex");
    return sha256Hash;
  }
  /**
   * Verify password against hash (supports both bcrypt and SHA-256)
   */
  static async verify(password, hash) {
    return this.verifySHA256(password, hash);
  }
  /**
   * Check if a hash is bcrypt format
   */
  static isBcryptHash(hash) {
    return /^\$2[aby]\$/.test(hash);
  }
  /**
   * Legacy SHA-256 verification (for backward compatibility)
   */
  static verifySHA256(password, hash) {
    const sha256Hash = import_crypto2.default.createHash("sha256").update(password).digest("hex");
    return sha256Hash === hash;
  }
  /**
   * Check if a password needs rehashing (SHA-256 → bcrypt upgrade)
   */
  static needsRehash(hash) {
    return !this.isBcryptHash(hash);
  }
  /**
   * Legacy SHA-256 hash (for compatibility during migration)
   * DO NOT USE for new passwords - use hash() instead
   */
  static sha256(password) {
    return import_crypto2.default.createHash("sha256").update(password).digest("hex");
  }
};

// src/tools/inventory/lookupInventory.ts
var import_tools = require("@langchain/core/tools");
var import_zod2 = require("zod");
function createLookupInventoryTool(db) {
  return new import_tools.DynamicStructuredTool({
    name: "lookup_inventory",
    description: `
Look up drug inventory information by drug name.
Uses fuzzy matching to find drugs even with minor spelling variations.
Returns all locations where the drug is stored with quantities, status, and expiry.

Use this for queries like:
- "Where is Propofol?"
- "Find Morphine"
- "Show me Insulin stock"
- "How much Paracetamol do we have?"
    `.trim(),
    schema: import_zod2.z.object({
      drugName: import_zod2.z.string().describe("Name of the drug to look up (fuzzy matching supported)")
    }),
    func: async ({ drugName }) => {
      try {
        const inventory = await db.loadInventory();
        const matches = inventory.filter(
          (item) => smartDrugMatch(drugName, item.drugName)
        );
        if (matches.length === 0) {
          const substringMatches = inventory.filter(
            (item) => item.drugName.toLowerCase().includes(drugName.toLowerCase()) || drugName.toLowerCase().includes(item.drugName.toLowerCase())
          );
          if (substringMatches.length === 0) {
            return JSON.stringify({
              found: false,
              query: drugName,
              message: `No drug found matching "${drugName}". Please check spelling or try a different name.`,
              suggestions: inventory.map((i) => i.drugName).filter((name, idx, arr) => arr.indexOf(name) === idx).slice(0, 5)
            });
          }
          return formatInventoryResults(substringMatches, drugName, true);
        }
        return formatInventoryResults(matches, drugName, false);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error looking up inventory: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
  });
}
function formatInventoryResults(items, searchQuery, isPartialMatch) {
  const drugGroups = /* @__PURE__ */ new Map();
  items.forEach((item) => {
    const existing = drugGroups.get(item.drugName) || [];
    existing.push(item);
    drugGroups.set(item.drugName, existing);
  });
  const results = Array.from(drugGroups.entries()).map(([drugName, locations]) => {
    const totalQty = locations.reduce((sum, loc) => sum + loc.qtyOnHand, 0);
    const hasStockout = locations.some((loc) => loc.status === "stockout");
    const hasLowStock = locations.some((loc) => loc.status === "low");
    const hasExpired = locations.some((loc) => loc.status === "expired");
    const hasCritical = locations.some((loc) => loc.status === "critical");
    return {
      drugName,
      category: locations[0] && locations[0].category || "standard",
      totalQuantity: totalQty,
      totalLocations: locations.length,
      alertLevel: hasExpired || hasStockout ? "critical" : hasCritical || hasLowStock ? "warning" : "info",
      alertMessage: hasExpired ? "Some batches expired" : hasStockout ? `${locations.filter((l) => l.status === "stockout").length} location(s) out of stock` : hasLowStock || hasCritical ? `${locations.filter((l) => l.status === "low" || l.status === "critical").length} location(s) below safety stock` : void 0,
      locations: locations.map((loc) => ({
        location: loc.location,
        quantity: loc.qtyOnHand,
        status: loc.status,
        expiryDate: loc.expiryDate,
        daysUntilExpiry: loc.daysRemaining,
        batchLot: loc.batchLot,
        safetyStock: loc.safetyStock,
        avgDailyUse: loc.avgDailyUse,
        daysOfStock: loc.avgDailyUse > 0 ? Math.round(loc.qtyOnHand / loc.avgDailyUse * 10) / 10 : null
      }))
    };
  });
  return JSON.stringify({
    found: true,
    query: searchQuery,
    isPartialMatch,
    resultCount: results.length,
    results
  }, null, 2);
}

// src/tools/inventory/updateInventory.ts
var import_tools2 = require("@langchain/core/tools");
var import_zod3 = require("zod");
function createUpdateInventoryTool(db, userRole, userId) {
  return new import_tools2.DynamicStructuredTool({
    name: "update_inventory",
    description: `
Update stock quantity for a drug at a specific location.
Requires Pharmacist or Master role authorization.
Creates transaction log entry for audit trail.

Use this for queries like:
- "Add 50 units of Propofol to ICU"
- "Update Morphine stock to 100"
- "Received 200 Paracetamol in Pharmacy"
- "Dispense 10 Insulin from Fridge"
    `.trim(),
    schema: import_zod3.z.object({
      drugName: import_zod3.z.string().describe("Name of the drug to update"),
      location: import_zod3.z.string().describe("Storage location (e.g., ICU-Shelf-A, ER-Cabinet-B)"),
      newQuantity: import_zod3.z.number().int().min(0).describe("New quantity (absolute value, not delta)"),
      reason: import_zod3.z.string().optional().describe('Reason for update (e.g., "received", "dispensed", "adjustment")')
    }),
    func: async ({ drugName, location, newQuantity, reason }) => {
      try {
        if (userRole === "Nurse") {
          return JSON.stringify({
            error: true,
            permissionDenied: true,
            message: "Access denied. Stock updates require Pharmacist or Master authorization.",
            requiredRole: "Pharmacist"
          });
        }
        const inventory = await db.loadInventory();
        const itemIndex = inventory.findIndex(
          (item2) => item2.drugName.toLowerCase() === drugName.toLowerCase() && item2.location.toLowerCase() === location.toLowerCase()
        );
        if (itemIndex === -1) {
          return JSON.stringify({
            error: true,
            notFound: true,
            message: `Drug "${drugName}" not found at location "${location}".`,
            suggestion: "Check drug name and location. Use lookup_inventory to verify."
          });
        }
        const item = inventory[itemIndex];
        const oldQuantity = item.qtyOnHand;
        const quantityChange = newQuantity - oldQuantity;
        inventory[itemIndex] = {
          ...item,
          qtyOnHand: newQuantity
        };
        await db.saveInventory(inventory);
        const txnType = quantityChange > 0 ? "RECEIVED" : quantityChange < 0 ? "DISPENSED" : "ADJUSTED";
        await db.addTransaction({
          txnId: `TXN${Date.now()}`,
          timestamp: getCurrentTimestamp(),
          userId,
          drugId: item.drugId,
          action: txnType,
          qtyChange: quantityChange,
          details: JSON.stringify({
            drugName: item.drugName,
            location: item.location,
            qtyBefore: oldQuantity,
            qtyAfter: newQuantity,
            batchLot: item.batchLot,
            reason: reason || `Stock ${txnType.toLowerCase()} by ${userId}`,
            approvedBy: userId
          })
        });
        const newStatus = newQuantity === 0 ? "stockout" : newQuantity < item.safetyStock ? "low" : "available";
        return JSON.stringify({
          success: true,
          updated: true,
          drug: item.drugName,
          location: item.location,
          oldQuantity,
          newQuantity,
          change: quantityChange,
          changeType: txnType,
          newStatus,
          updatedBy: userId,
          timestamp: getCurrentTimestamp(),
          alert: newQuantity === 0 ? { level: "critical", message: "Stock depleted - immediate reorder required" } : newQuantity < item.safetyStock ? { level: "warning", message: "Below safety stock - consider reordering" } : void 0,
          recommendation: newQuantity < item.safetyStock ? `Reorder ${item.safetyStock - newQuantity} units to reach safety stock level` : void 0
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error updating inventory: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
  });
}

// src/tools/inventory/listWardStock.ts
var import_tools3 = require("@langchain/core/tools");
var import_zod4 = require("zod");
function createListWardStockTool(db) {
  return new import_tools3.DynamicStructuredTool({
    name: "list_ward_stock",
    description: `
List all inventory items for a specific location or ward.
Shows complete stock status for that location.

Use this for queries like:
- "Show ICU stock"
- "What's in ER-Cabinet-B?"
- "List all drugs in Pharmacy-Main"
- "Ward-A inventory"
    `.trim(),
    schema: import_zod4.z.object({
      location: import_zod4.z.string().describe("Storage location name (e.g., ICU-Shelf-A, ER-Cabinet-B, Pharmacy-Main)"),
      includeAdequate: import_zod4.z.boolean().optional().default(true).describe("Include items with adequate stock (default: true)")
    }),
    func: async ({ location, includeAdequate }) => {
      try {
        const items = await db.getInventoryByLocation(location);
        if (items.length === 0) {
          const allLocationSummaries = await db.getAllLocations();
          const allLocationNames = allLocationSummaries.map((l) => l.location);
          const similarLocations = allLocationNames.filter(
            (loc) => loc.toLowerCase().includes(location.toLowerCase()) || location.toLowerCase().includes(loc.toLowerCase())
          );
          return JSON.stringify({
            found: false,
            location,
            message: `No inventory found for location "${location}".`,
            suggestions: similarLocations.length > 0 ? similarLocations : ["Use get_location_list to see all available locations"]
          });
        }
        const filteredItems = includeAdequate ? items : items.filter((item) => item.status !== "adequate");
        const totalItems = filteredItems.length;
        const stockouts = filteredItems.filter((i) => i.status === "stockout").length;
        const lowStock = filteredItems.filter((i) => i.status === "low" || i.status === "critical").length;
        const expired = filteredItems.filter((i) => i.status === "expired").length;
        const adequate = filteredItems.filter((i) => i.status === "adequate").length;
        const controlledCount = filteredItems.filter((i) => i.category === "controlled").length;
        return JSON.stringify({
          found: true,
          location,
          summary: {
            totalItems,
            stockouts,
            lowStock,
            expired,
            adequate,
            controlledSubstances: controlledCount
          },
          alertLevel: stockouts > 0 || expired > 0 ? "critical" : lowStock > 0 ? "warning" : "info",
          alertMessage: stockouts > 0 ? `${stockouts} item(s) out of stock` : expired > 0 ? `${expired} item(s) expired` : lowStock > 0 ? `${lowStock} item(s) below safety stock` : "All items adequately stocked",
          items: filteredItems.map((item) => ({
            drugName: item.drugName,
            location: item.location,
            // CRITICAL: Include actual location from database
            category: item.category,
            quantity: item.qtyOnHand,
            status: item.status,
            safetyStock: item.safetyStock,
            expiryDate: item.expiryDate,
            daysUntilExpiry: item.daysRemaining,
            batchLot: item.batchLot,
            avgDailyUse: item.avgDailyUse,
            daysOfStock: item.avgDailyUse > 0 ? Math.round(item.qtyOnHand / item.avgDailyUse * 10) / 10 : null
          })).sort((a, b) => {
            const statusPriority = { expired: 0, stockout: 1, critical: 2, low: 3, available: 4 };
            return statusPriority[a.status] - statusPriority[b.status];
          }),
          recommendations: [
            stockouts > 0 && `Urgently restock ${stockouts} stockout item(s)`,
            expired > 0 && `Remove ${expired} expired item(s) immediately`,
            lowStock > 0 && `Review ${lowStock} low-stock item(s) for reordering`
          ].filter(Boolean)
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error listing ward stock: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
  });
}

// src/tools/inventory/getFullInventory.ts
var import_tools4 = require("@langchain/core/tools");
var import_zod5 = require("zod");
function createGetFullInventoryTool(db) {
  return new import_tools4.DynamicStructuredTool({
    name: "get_full_inventory",
    description: `
Get a complete overview of all inventory items with optional filters.
Useful for generating reports, audits, or getting a high-level view.

Use this for queries like:
- "Show full inventory"
- "List all drugs"
- "Complete inventory report"
- "All controlled substances"
- "Show only low stock items"
    `.trim(),
    schema: import_zod5.z.object({
      statusFilter: import_zod5.z.enum(["all", "adequate", "low", "stockout", "expired", "critical"]).optional().default("all").describe("Filter by stock status"),
      categoryFilter: import_zod5.z.enum(["all", "controlled", "standard", "refrigerated"]).optional().default("all").describe("Filter by drug category"),
      limitResults: import_zod5.z.number().int().min(1).max(500).optional().default(100).describe("Maximum number of results to return")
    }),
    func: async ({ statusFilter, categoryFilter, limitResults }) => {
      try {
        const rawInventory = await db.loadInventory();
        let inventory = rawInventory.map((item) => enrichInventoryItem(item));
        const fullInventory = [...inventory];
        if (statusFilter !== "all") {
          inventory = inventory.filter((item) => item.status === statusFilter);
        } else {
          inventory = inventory.filter((item) => item.status !== "expired");
        }
        if (categoryFilter !== "all") {
          inventory = inventory.filter((item) => item.category === categoryFilter);
        }
        const totalCount = inventory.length;
        const limitedInventory = inventory.slice(0, limitResults);
        const stats = {
          totalItems: inventory.length,
          totalLocations: new Set(inventory.map((i) => i.location)).size,
          uniqueDrugs: new Set(inventory.map((i) => i.drugName)).size,
          byStatus: {
            adequate: fullInventory.filter((i) => i.status === "adequate").length,
            low: fullInventory.filter((i) => i.status === "low").length,
            critical: fullInventory.filter((i) => i.status === "critical").length,
            stockout: fullInventory.filter((i) => i.status === "stockout").length,
            expired: fullInventory.filter((i) => i.status === "expired").length
          },
          byCategory: {
            controlled: inventory.filter((i) => i.category === "controlled").length,
            standard: inventory.filter((i) => i.category === "standard").length,
            refrigerated: inventory.filter((i) => i.category === "refrigerated").length
          },
          totalQuantity: inventory.reduce((sum, item) => sum + item.qtyOnHand, 0)
        };
        const alertLevel = stats.byStatus.stockout > 0 || stats.byStatus.expired > 0 ? "critical" : stats.byStatus.low > 0 || stats.byStatus.critical > 0 ? "warning" : "info";
        return JSON.stringify({
          summary: {
            filtersApplied: {
              status: statusFilter,
              category: categoryFilter
            },
            ...stats,
            resultsShown: limitedInventory.length,
            resultsTotal: totalCount,
            resultsTruncated: totalCount > limitResults
          },
          alertLevel,
          alertMessage: stats.byStatus.stockout > 0 ? `${stats.byStatus.stockout} stockout(s) - immediate attention required` : stats.byStatus.expired > 0 ? `${stats.byStatus.expired} expired item(s) - remove from stock` : stats.byStatus.low + stats.byStatus.critical > 0 ? `${stats.byStatus.low + stats.byStatus.critical} item(s) below safety stock` : "Inventory levels adequate",
          items: limitedInventory.map((item) => ({
            drugName: item.drugName,
            location: item.location,
            category: item.category,
            quantity: item.qtyOnHand,
            status: item.status,
            safetyStock: item.safetyStock,
            expiryDate: item.expiryDate,
            daysUntilExpiry: item.daysRemaining,
            batchLot: item.batchLot,
            avgDailyUse: item.avgDailyUse
          })).sort((a, b) => {
            const statusPriority = { expired: 0, stockout: 1, critical: 2, low: 3, adequate: 4 };
            const statusDiff = statusPriority[a.status] - statusPriority[b.status];
            return statusDiff !== 0 ? statusDiff : a.drugName.localeCompare(b.drugName);
          }),
          recommendations: [
            stats.byStatus.stockout > 0 && `Urgently restock ${stats.byStatus.stockout} stockout item(s)`,
            stats.byStatus.expired > 0 && `Remove ${stats.byStatus.expired} expired item(s) immediately`,
            stats.byStatus.low + stats.byStatus.critical > 0 && `Review ${stats.byStatus.low + stats.byStatus.critical} low-stock item(s)`,
            stats.byCategory.controlled > 0 && `${stats.byCategory.controlled} controlled substances require audit trail`
          ].filter(Boolean),
          actions: ["download_csv", "generate_report", "filter_results", "create_po"]
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error getting full inventory: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
  });
}

// src/tools/inventory/getLocationList.ts
var import_tools5 = require("@langchain/core/tools");
var import_zod6 = require("zod");
function createGetLocationListTool(db) {
  return new import_tools5.DynamicStructuredTool({
    name: "get_location_list",
    description: `
Get a list of all storage locations with summary statistics.
Shows how many items, stockouts, and controlled substances at each location.

Use this for queries like:
- "List all locations"
- "Show storage areas"
- "Where are drugs stored?"
- "All wards and cabinets"
    `.trim(),
    schema: import_zod6.z.object({
      includeEmpty: import_zod6.z.boolean().optional().default(false).describe("Include locations with no inventory")
    }),
    func: async ({ includeEmpty }) => {
      try {
        const inventory = await db.loadInventory();
        const allLocationSummaries = await db.getAllLocations();
        const allLocations = allLocationSummaries.map((l) => l.location);
        const locationMap = /* @__PURE__ */ new Map();
        inventory.forEach((item) => {
          const existing = locationMap.get(item.location) || [];
          existing.push(item);
          locationMap.set(item.location, existing);
        });
        const locationSummaries = allLocations.map((location) => {
          const items = locationMap.get(location) || [];
          if (!includeEmpty && items.length === 0) {
            return null;
          }
          const totalItems = items.length;
          const totalQuantity = items.reduce((sum, i) => sum + i.qtyOnHand, 0);
          const stockouts = items.filter((i) => i.status === "stockout").length;
          const lowStock = items.filter((i) => i.status === "low" || i.status === "critical").length;
          const expired = items.filter((i) => i.status === "expired").length;
          const controlledCount = items.filter((i) => i.category === "controlled").length;
          const locationType = location.toLowerCase().includes("icu") ? "ICU" : location.toLowerCase().includes("er") || location.toLowerCase().includes("emergency") ? "Emergency" : location.toLowerCase().includes("or") || location.toLowerCase().includes("operating") ? "Operating Room" : location.toLowerCase().includes("ward") ? "Ward" : location.toLowerCase().includes("pharmacy") ? "Pharmacy" : location.toLowerCase().includes("vault") || location.toLowerCase().includes("secure") ? "Secure Storage" : location.toLowerCase().includes("fridge") || location.toLowerCase().includes("refriger") ? "Refrigerated" : location.toLowerCase().includes("crash") ? "Emergency Cart" : "General Storage";
          const alertLevel = stockouts > 0 || expired > 0 ? "critical" : lowStock > 0 ? "warning" : "info";
          return {
            location,
            locationType,
            summary: {
              totalItems,
              totalQuantity,
              stockouts,
              lowStock,
              expired,
              controlledSubstances: controlledCount
            },
            alertLevel,
            needsAttention: stockouts > 0 || expired > 0 || lowStock > 0
          };
        }).filter(Boolean);
        locationSummaries.sort((a, b) => {
          const priorityMap = { critical: 0, warning: 1, info: 2 };
          const priorityDiff = priorityMap[a.alertLevel] - priorityMap[b.alertLevel];
          return priorityDiff !== 0 ? priorityDiff : a.location.localeCompare(b.location);
        });
        const criticalLocations = locationSummaries.filter((l) => l.alertLevel === "critical").length;
        const warningLocations = locationSummaries.filter((l) => l.alertLevel === "warning").length;
        return JSON.stringify({
          totalLocations: locationSummaries.length,
          summary: {
            byType: locationSummaries.reduce((acc, loc) => {
              const type = loc.locationType;
              acc[type] = (acc[type] || 0) + 1;
              return acc;
            }, {}),
            alertSummary: {
              critical: criticalLocations,
              warning: warningLocations,
              ok: locationSummaries.length - criticalLocations - warningLocations
            },
            needsAttention: locationSummaries.filter((l) => l.needsAttention).length
          },
          alertLevel: criticalLocations > 0 ? "critical" : warningLocations > 0 ? "warning" : "info",
          alertMessage: criticalLocations > 0 ? `${criticalLocations} location(s) have critical issues (stockouts/expired items)` : warningLocations > 0 ? `${warningLocations} location(s) have low stock warnings` : "All locations adequately stocked",
          locations: locationSummaries,
          recommendations: [
            criticalLocations > 0 && `Review ${criticalLocations} critical location(s) immediately`,
            warningLocations > 0 && `Monitor ${warningLocations} location(s) with low stock`
          ].filter(Boolean)
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error getting location list: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
  });
}

// src/tools/inventory/manageUserAccess.ts
var import_tools6 = require("@langchain/core/tools");
var import_zod7 = require("zod");
function createManageUserAccessTool(db, userRole, userId) {
  return new import_tools6.DynamicStructuredTool({
    name: "manage_user_access",
    description: `
Manage user access and permissions (Master only).
View user list, blacklist/whitelist users, check access logs.

Use this for queries like:
- "Show all users"
- "List nurses"
- "Blacklist user N005"
- "Whitelist user P006"
- "Who has access?"
    `.trim(),
    schema: import_zod7.z.object({
      action: import_zod7.z.enum(["list", "blacklist", "whitelist", "view_logs"]).describe("Action to perform"),
      targetUserId: import_zod7.z.string().optional().describe("User ID for blacklist/whitelist actions"),
      roleFilter: import_zod7.z.enum(["all", "Master", "Pharmacist", "Nurse"]).optional().default("all").describe("Filter users by role"),
      statusFilter: import_zod7.z.enum(["all", "Active", "Blacklisted"]).optional().default("all").describe("Filter users by status")
    }),
    func: async ({ action, targetUserId, roleFilter, statusFilter }) => {
      try {
        if (userRole !== "Master") {
          return JSON.stringify({
            error: true,
            permissionDenied: true,
            message: "Access denied. User management requires Master authorization.",
            requiredRole: "Master",
            yourRole: userRole
          });
        }
        if (action === "list") {
          let users = await db.loadUsers();
          if (roleFilter !== "all") {
            users = users.filter((u) => u.role === roleFilter);
          }
          if (statusFilter !== "all") {
            users = users.filter((u) => u.status === statusFilter);
          }
          const stats = {
            total: users.length,
            byRole: {
              Master: users.filter((u) => u.role === "Master").length,
              Pharmacist: users.filter((u) => u.role === "Pharmacist").length,
              Nurse: users.filter((u) => u.role === "Nurse").length
            },
            byStatus: {
              Active: users.filter((u) => u.status === "Active").length,
              Blacklisted: users.filter((u) => u.status === "Blacklisted").length
            }
          };
          return JSON.stringify({
            action: "list",
            filtersApplied: { role: roleFilter, status: statusFilter },
            stats,
            users: users.map((u) => ({
              empId: u.empId,
              name: u.name,
              role: u.role,
              status: u.status,
              unifiedGroup: u.unifiedGroup,
              createdAt: u.createdAt,
              lastLogin: u.lastLogin
            })),
            alertMessage: stats.byStatus.Blacklisted > 0 ? `${stats.byStatus.Blacklisted} user(s) currently blacklisted` : void 0
          }, null, 2);
        }
        if (action === "blacklist") {
          if (!targetUserId) {
            return JSON.stringify({
              error: true,
              message: "targetUserId is required for blacklist action"
            });
          }
          const user = await db.getUserById(targetUserId);
          if (!user) {
            return JSON.stringify({
              error: true,
              notFound: true,
              message: `User ${targetUserId} not found`
            });
          }
          if (user.role === "Master") {
            return JSON.stringify({
              error: true,
              message: "Cannot blacklist Master users"
            });
          }
          if (user.status === "Blacklisted") {
            return JSON.stringify({
              error: true,
              message: `User ${targetUserId} is already blacklisted`
            });
          }
          await db.updateUser(targetUserId, { status: "Blacklisted" });
          await db.addAccessLog({
            logId: `LOG${Date.now()}`,
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            empId: userId,
            action: "USER_BLACKLISTED",
            details: `Blacklisted user ${targetUserId} (${user.name})`
          });
          return JSON.stringify({
            success: true,
            action: "blacklist",
            targetUser: {
              empId: targetUserId,
              name: user.name,
              role: user.role,
              previousStatus: "Active",
              newStatus: "Blacklisted"
            },
            performedBy: userId,
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            message: `User ${targetUserId} has been blacklisted and can no longer access the system`
          }, null, 2);
        }
        if (action === "whitelist") {
          if (!targetUserId) {
            return JSON.stringify({
              error: true,
              message: "targetUserId is required for whitelist action"
            });
          }
          const user = await db.getUserById(targetUserId);
          if (!user) {
            return JSON.stringify({
              error: true,
              notFound: true,
              message: `User ${targetUserId} not found`
            });
          }
          if (user.status === "Active") {
            return JSON.stringify({
              error: true,
              message: `User ${targetUserId} is already active`
            });
          }
          await db.updateUser(targetUserId, { status: "Active" });
          await db.addAccessLog({
            logId: `LOG${Date.now()}`,
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            empId: userId,
            action: "USER_WHITELISTED",
            details: `Reactivated user ${targetUserId} (${user.name})`
          });
          return JSON.stringify({
            success: true,
            action: "whitelist",
            targetUser: {
              empId: targetUserId,
              name: user.name,
              role: user.role,
              previousStatus: "Blacklisted",
              newStatus: "Active"
            },
            performedBy: userId,
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            message: `User ${targetUserId} has been reactivated and can now access the system`
          }, null, 2);
        }
        if (action === "view_logs") {
          const logs = await db.getAccessLogs(50);
          const logsByAction = logs.reduce((acc, log) => {
            acc[log.action] = (acc[log.action] || 0) + 1;
            return acc;
          }, {});
          return JSON.stringify({
            action: "view_logs",
            totalLogs: logs.length,
            logsByAction,
            recentLogs: logs.slice(0, 20).map((log) => ({
              timestamp: log.timestamp,
              empId: log.empId,
              action: log.action,
              details: log.details
            })),
            message: "Showing last 20 of 50 most recent access logs"
          }, null, 2);
        }
        return JSON.stringify({
          error: true,
          message: `Unknown action: ${action}`
        });
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error managing user access: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
  });
}

// src/tools/inventory/getTransactionHistory.ts
var import_tools7 = require("@langchain/core/tools");
var import_zod8 = require("zod");
function createGetTransactionHistoryTool(db) {
  return new import_tools7.DynamicStructuredTool({
    name: "get_transaction_history",
    description: `
View transaction history for inventory operations.
Shows USE, RECEIVE, TRANSFER, ADJUST, and WASTE transactions.

Use this for queries like:
- "Show transaction history for Insulin"
- "What transactions happened in the last 7 days?"
- "Show me recent drug movements"
- "Transaction history for morphine"
    `.trim(),
    schema: import_zod8.z.object({
      drugName: import_zod8.z.string().optional().describe("Filter by drug name (optional)"),
      days: import_zod8.z.number().int().min(1).max(365).optional().default(30).describe("Number of days to look back (default: 30)"),
      action: import_zod8.z.enum(["USE", "RECEIVE", "TRANSFER", "ADJUST", "WASTE", "ALL"]).optional().default("ALL").describe("Filter by transaction type"),
      limit: import_zod8.z.number().int().min(1).max(100).optional().default(50).describe("Maximum number of transactions to return")
    }),
    func: async ({ drugName, days, action, limit }) => {
      try {
        let transactions = await db.loadTransactions(days);
        if (drugName) {
          const inventory2 = await db.loadInventory();
          const enrichedInventory2 = inventory2.map((item) => enrichInventoryItem(item));
          const matchingDrugs = enrichedInventory2.filter(
            (item) => item.drugName.toLowerCase().includes(drugName.toLowerCase())
          );
          if (matchingDrugs.length === 0) {
            return JSON.stringify({
              found: false,
              message: `No drug found matching "${drugName}"`,
              suggestion: "Try a different search term or check spelling"
            });
          }
          const drugIds = matchingDrugs.map((d) => d.drugId);
          transactions = transactions.filter((txn) => drugIds.includes(txn.drugId));
        }
        if (action !== "ALL") {
          transactions = transactions.filter((txn) => txn.action === action);
        }
        if (transactions.length === 0) {
          return JSON.stringify({
            found: false,
            days,
            drugName,
            action,
            message: `No transactions found for the specified criteria`
          });
        }
        transactions.sort((a, b) => {
          const dateA = new Date(a.timestamp);
          const dateB = new Date(b.timestamp);
          return dateB.getTime() - dateA.getTime();
        });
        const limitedTransactions = transactions.slice(0, limit);
        const inventory = await db.loadInventory();
        const enrichedInventory = inventory.map((item) => enrichInventoryItem(item));
        const drugMap = new Map(enrichedInventory.map((item) => [item.drugId, item.drugName]));
        const actionCounts = {
          USE: transactions.filter((t) => t.action === "USE").length,
          RECEIVE: transactions.filter((t) => t.action === "RECEIVE").length,
          TRANSFER: transactions.filter((t) => t.action === "TRANSFER").length,
          ADJUST: transactions.filter((t) => t.action === "ADJUST").length,
          WASTE: transactions.filter((t) => t.action === "WASTE").length
        };
        const totalUsed = transactions.filter((t) => t.action === "USE").reduce((sum, t) => sum + Math.abs(t.qtyChange), 0);
        const totalReceived = transactions.filter((t) => t.action === "RECEIVE").reduce((sum, t) => sum + t.qtyChange, 0);
        return JSON.stringify({
          found: true,
          days,
          drugName,
          action,
          totalTransactions: transactions.length,
          showing: limitedTransactions.length,
          summary: {
            period: `Last ${days} days`,
            totalTransactions: transactions.length,
            byAction: actionCounts,
            totalUsed,
            totalReceived,
            netChange: totalReceived - totalUsed
          },
          transactions: limitedTransactions.map((txn) => ({
            timestamp: txn.timestamp,
            drugName: drugMap.get(txn.drugId) || "Unknown",
            action: txn.action,
            quantityChange: txn.qtyChange,
            quantityAfter: txn.qtyAfter,
            location: txn.location,
            performedBy: txn.userId,
            batchLot: txn.batchLot,
            reason: txn.reason || void 0
          })),
          note: transactions.length > limit ? `Showing ${limit} of ${transactions.length} transactions. Specify a higher limit to see more.` : `Showing all ${transactions.length} transactions.`,
          reportDate: (/* @__PURE__ */ new Date()).toISOString()
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error retrieving transaction history: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
  });
}

// src/tools/forecasting/getForecastMl.ts
var import_tools8 = require("@langchain/core/tools");
var import_zod9 = require("zod");

// src/utils/forecasting.ts
function calculateEWMA(data, alpha = 0.3) {
  if (data.length === 0) return [];
  const ewma = [data[0]];
  for (let i = 1; i < data.length; i++) {
    ewma.push(alpha * data[i] + (1 - alpha) * ewma[i - 1]);
  }
  return ewma;
}
function calculateLinearRegression(yValues) {
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
function calculateStdDev(values) {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  return Math.sqrt(variance);
}
function removeOutliers(data) {
  if (data.length < 4) return { cleaned: data, outliers: [] };
  const sorted = [...data].sort((a, b) => a - b);
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  const cleaned = [];
  const outliers = [];
  data.forEach((val) => {
    if (val >= lowerBound && val <= upperBound) {
      cleaned.push(val);
    } else {
      outliers.push(val);
    }
  });
  return { cleaned, outliers };
}
function calculateForecastAccuracy(actual, predicted) {
  if (actual.length === 0 || actual.length !== predicted.length) {
    return { mae: 0, rmse: 0, mape: 0, accuracy: 0 };
  }
  let sumAbsError = 0;
  let sumSquaredError = 0;
  let sumPercentError = 0;
  let validCount = 0;
  for (let i = 0; i < actual.length; i++) {
    const error = actual[i] - predicted[i];
    sumAbsError += Math.abs(error);
    sumSquaredError += error * error;
    if (actual[i] !== 0) {
      sumPercentError += Math.abs(error / actual[i]);
      validCount++;
    }
  }
  const mae = sumAbsError / actual.length;
  const rmse = Math.sqrt(sumSquaredError / actual.length);
  const mape = validCount > 0 ? sumPercentError / validCount * 100 : 0;
  const accuracy = Math.max(0, 100 - mape);
  return { mae, rmse, mape, accuracy };
}
function classifyABCXYZ(totalValue, demandVariability, allValues, allVariabilities) {
  const sortedValues = [...allValues].sort((a, b) => b - a);
  const cumSum = [];
  let total = 0;
  sortedValues.forEach((val) => {
    total += val;
    cumSum.push(total);
  });
  const valuePercentile = sortedValues.indexOf(totalValue) / sortedValues.length;
  const abcClass = valuePercentile <= 0.2 ? "A" : valuePercentile <= 0.5 ? "B" : "C";
  const sortedVariabilities = [...allVariabilities].sort((a, b) => a - b);
  const varPercentile = sortedVariabilities.findIndex((v) => v >= demandVariability) / sortedVariabilities.length;
  const xyzClass = varPercentile <= 0.5 ? "X" : varPercentile <= 0.8 ? "Y" : "Z";
  return {
    abcClass,
    xyzClass,
    category: `${abcClass}${xyzClass}`
  };
}
function generateForecast(drugName, currentStock, avgDailyUse, recentTransactions, forecastDays = 7) {
  const rawDailyUsage = extractDailyUsage(recentTransactions, 30);
  const { cleaned: dailyUsage, outliers } = removeOutliers(rawDailyUsage);
  const outliersDetected = outliers.length;
  const trend = calculateLinearRegression(dailyUsage);
  const { rSquared } = calculateDetailedTrend(dailyUsage.map((value, i) => ({
    date: addDays(/* @__PURE__ */ new Date(), -(dailyUsage.length - i)),
    value
  })));
  const useTrend = rSquared > 0.3;
  const trendFactor = useTrend ? Math.max(0.7, Math.min(1.3, 1 + trend.slope * 0.1)) : 1;
  const ewma = calculateEWMA(dailyUsage);
  const baseDemand = ewma[ewma.length - 1] || avgDailyUse;
  const stdDev = calculateStdDev(dailyUsage);
  const coefficientOfVariation = baseDemand > 0 ? stdDev / baseDemand : 0;
  const zScore = 1.645;
  const forecasts = [];
  let remainingStock = currentStock;
  for (let i = 0; i < forecastDays; i++) {
    const forecastDate = addDays(/* @__PURE__ */ new Date(), i + 1);
    const dayFactor = getDayFactor(forecastDate);
    const dayName = getDayName(forecastDate);
    const predicted = baseDemand * dayFactor * trendFactor;
    const horizonFactor = Math.sqrt(i + 1);
    const minSpread = predicted * 0.15;
    const calculatedSpread = zScore * stdDev * horizonFactor;
    const ciRange = Math.max(minSpread, calculatedSpread);
    const lower = Math.max(0, predicted - ciRange);
    const upper = predicted + ciRange;
    remainingStock -= predicted;
    forecasts.push({
      date: forecastDate.toISOString().split("T")[0],
      day: dayName,
      predicted,
      lower,
      upper,
      remainingStock: Math.max(0, remainingStock)
    });
  }
  const totalForecast = forecasts.reduce((sum, f) => sum + f.predicted, 0);
  const projectedGap = currentStock - totalForecast;
  const safetyBuffer = baseDemand * (2 + coefficientOfVariation * 2);
  const status = projectedGap < 0 ? "critical" : projectedGap < safetyBuffer ? "warning" : "adequate";
  const daysOfCoverage = baseDemand > 0 ? Math.floor(currentStock / baseDemand) : 999;
  const recommendation = status === "critical" ? `Urgent: Order ${Math.ceil(Math.abs(projectedGap))} units immediately to avoid stockout` : status === "warning" ? `Order ${Math.ceil(safetyBuffer - projectedGap)} units to maintain safety buffer` : `Stock adequate for ${daysOfCoverage} days`;
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
    // TIER 1: Add forecast quality metrics
    forecastQuality: {
      outliersRemoved: outliersDetected,
      trendSignificance: rSquared,
      usedTrend: useTrend,
      demandVariability: coefficientOfVariation,
      confidenceLevel: 90
    }
  };
}
function extractDailyUsage(transactions, days) {
  const now = /* @__PURE__ */ new Date();
  const dailyMap = /* @__PURE__ */ new Map();
  for (let i = 0; i < days; i++) {
    const date = addDays(now, -i);
    const dateKey = date.toISOString().split("T")[0];
    dailyMap.set(dateKey, 0);
  }
  transactions.forEach((txn) => {
    const dateKey = txn.timestamp.split(" ")[0];
    if (dailyMap.has(dateKey) && txn.action === "USE") {
      const current = dailyMap.get(dateKey) || 0;
      dailyMap.set(dateKey, current + Math.abs(txn.qtyChange));
    }
  });
  return Array.from(dailyMap.values()).reverse();
}
function calculateSafetyStock(avgDailyUse, leadTimeDays, serviceLevel = 0.95, demandVariability, actualStdDev) {
  const zScores = {
    0.9: 1.28,
    0.95: 1.65,
    0.98: 2.05,
    0.99: 2.33
  };
  const zScore = zScores[serviceLevel] || 1.65;
  const stdDevDemand = actualStdDev !== void 0 ? actualStdDev : demandVariability !== void 0 ? demandVariability : avgDailyUse * 0.15;
  const safetyStock = zScore * stdDevDemand * Math.sqrt(leadTimeDays);
  return Math.ceil(safetyStock);
}
function detectSeasonalPatterns(transactions, periodDays = 90) {
  const dailyUsage = extractDailyUsage(transactions, periodDays);
  const weeklyPattern = checkWeeklyPattern(dailyUsage);
  const monthlyPattern = checkMonthlyPattern(dailyUsage);
  if (weeklyPattern.score > 0.6) {
    return {
      hasSeasonality: true,
      pattern: "weekly",
      peakDays: weeklyPattern.peakDays,
      lowDays: weeklyPattern.lowDays,
      seasonalityScore: weeklyPattern.score
    };
  }
  if (monthlyPattern.score > 0.5) {
    return {
      hasSeasonality: true,
      pattern: "monthly",
      peakDays: monthlyPattern.peakPeriods,
      lowDays: monthlyPattern.lowPeriods,
      seasonalityScore: monthlyPattern.score
    };
  }
  return {
    hasSeasonality: false,
    pattern: "none",
    peakDays: [],
    lowDays: [],
    seasonalityScore: 0
  };
}
function checkWeeklyPattern(data) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
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
  const score = variance / (overallAvg || 1);
  const peakDays = avgByDay.map((avg, i) => ({ day: days[i], avg })).filter((d) => d.avg > overallAvg * 1.1).map((d) => d.day);
  const lowDays = avgByDay.map((avg, i) => ({ day: days[i], avg })).filter((d) => d.avg < overallAvg * 0.9).map((d) => d.day);
  return { score, peakDays, lowDays };
}
function checkMonthlyPattern(data) {
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
    { name: "Early month", avg: avgFirst },
    { name: "Mid month", avg: avgMid },
    { name: "Late month", avg: avgLast }
  ];
  const peakPeriods = periods.filter((p) => p.avg > overallAvg * 1.15).map((p) => p.name);
  const lowPeriods = periods.filter((p) => p.avg < overallAvg * 0.85).map((p) => p.name);
  return { score, peakPeriods, lowPeriods };
}
function predictStockoutDate(currentStock, avgDailyUse, recentTransactions) {
  if (currentStock === 0) {
    return {
      stockoutDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      daysUntilStockout: 0,
      confidence: "high"
    };
  }
  if (avgDailyUse === 0) {
    return {
      stockoutDate: null,
      daysUntilStockout: null,
      confidence: "low"
    };
  }
  const dailyUsage = extractDailyUsage(recentTransactions, 14);
  const trend = calculateLinearRegression(dailyUsage);
  const trendFactor = 1 + trend.slope * 0.1;
  const adjustedDailyUse = avgDailyUse * trendFactor;
  const daysUntilStockout = Math.floor(currentStock / adjustedDailyUse);
  const confidence = recentTransactions.length > 10 ? "high" : recentTransactions.length > 5 ? "medium" : "low";
  const stockoutDate = addDays(/* @__PURE__ */ new Date(), daysUntilStockout);
  return {
    stockoutDate: stockoutDate.toISOString().split("T")[0],
    daysUntilStockout,
    confidence
  };
}
function calculateDetailedTrend(dataPoints) {
  const yValues = dataPoints.map((d) => d.value);
  const n = yValues.length;
  if (n < 2) {
    return {
      slope: 0,
      intercept: 0,
      hasSignificantTrend: false,
      trend: 0,
      rSquared: 0
    };
  }
  const xValues = Array.from({ length: n }, (_, i) => i);
  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = yValues.reduce((a, b) => a + b, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
  const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  const meanY = sumY / n;
  const ssTotal = yValues.reduce((sum, y) => sum + Math.pow(y - meanY, 2), 0);
  const ssResidual = yValues.reduce((sum, y, i) => {
    const predicted = intercept + slope * i;
    return sum + Math.pow(y - predicted, 2);
  }, 0);
  const rSquared = ssTotal > 0 ? 1 - ssResidual / ssTotal : 0;
  const avgValue = meanY;
  const trendPercentage = avgValue > 0 ? slope / avgValue * 100 : 0;
  const hasSignificantTrend = rSquared > 0.5 && Math.abs(trendPercentage) > 5;
  return {
    slope,
    intercept,
    hasSignificantTrend,
    trend: trendPercentage,
    rSquared
  };
}

// src/tools/forecasting/getForecastMl.ts
function createGetForecastMlTool(db) {
  return new import_tools8.DynamicStructuredTool({
    name: "get_forecast_ml",
    description: `
Generate a 7-day demand forecast for a drug using ML algorithms.
Uses EWMA, trend detection, and day-of-week factors for accurate predictions.

Use this for queries like:
- "Forecast Propofol for next week"
- "Predict Morphine demand"
- "How much Insulin will we need?"
- "Generate forecast for Paracetamol"
    `.trim(),
    schema: import_zod9.z.object({
      drugName: import_zod9.z.string().describe("Name of the drug to forecast"),
      forecastDays: import_zod9.z.number().int().min(1).max(30).optional().default(7).describe("Number of days to forecast (default: 7)")
    }),
    func: async ({ drugName, forecastDays }) => {
      try {
        const matches = await db.searchInventory(drugName);
        if (matches.length === 0) {
          return JSON.stringify({
            error: true,
            notFound: true,
            message: `Drug "${drugName}" not found in inventory`,
            suggestion: "Use lookup_inventory to verify drug name"
          });
        }
        const transactions = await db.getTransactionsForDrug(matches[0].drugName, 30);
        const totalCurrentStock = matches.reduce((sum, item) => sum + item.qtyOnHand, 0);
        const avgDailyUse = matches.reduce((sum, item) => sum + item.avgDailyUse, 0) / matches.length;
        const forecast = generateForecast(
          matches[0].drugName,
          totalCurrentStock,
          avgDailyUse,
          transactions,
          forecastDays
        );
        const isControlled = matches[0].category === "controlled";
        const detailLevel = isControlled ? "audit" : "full";
        return JSON.stringify({
          type: "forecast",
          detailLevel,
          drugName: forecast.drugName,
          category: matches[0].category,
          currentState: {
            totalStock: totalCurrentStock,
            locations: matches.length,
            avgDailyUse: forecast.avgDailyUse,
            trendFactor: forecast.trendFactor,
            trendDirection: forecast.trendFactor > 1 ? "increasing" : forecast.trendFactor < 1 ? "decreasing" : "stable"
          },
          forecast: {
            periodDays: forecast.forecastPeriodDays,
            totalForecast: forecast.totalForecast,
            projectedGap: forecast.projectedGap,
            status: forecast.status,
            dailyForecasts: forecast.forecasts.map((f) => ({
              date: f.date,
              day: f.day,
              predicted: Math.round(f.predicted * 10) / 10,
              confidenceRange: `${Math.round(f.lower)}-${Math.round(f.upper)}`,
              remainingStock: Math.round(f.remainingStock)
            }))
          },
          alertLevel: forecast.status === "critical" ? "critical" : forecast.status === "warning" ? "warning" : "info",
          alertMessage: forecast.status === "critical" ? `Projected shortage of ${Math.abs(forecast.projectedGap).toFixed(0)} units` : forecast.status === "warning" ? "Stock may run low during forecast period" : "Stock adequate for forecast period",
          recommendation: forecast.recommendation,
          actions: ["create_po", "download_report", "view_trends"],
          followUp: forecast.status !== "adequate" ? "Would you like to generate a purchase order?" : void 0
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error generating forecast: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
  });
}

// src/tools/forecasting/calculateSafetyStock.ts
var import_tools9 = require("@langchain/core/tools");
var import_zod10 = require("zod");
function createCalculateSafetyStockTool(db) {
  return new import_tools9.DynamicStructuredTool({
    name: "calculate_safety_stock",
    description: `
Calculate optimal safety stock level for a drug using statistical methods.
Uses Wilson formula with service level and lead time considerations.

Use this for queries like:
- "Calculate safety stock for Propofol"
- "What should be the safety level for Morphine?"
- "Recalculate safety stock for ICU drugs"
    `.trim(),
    schema: import_zod10.z.object({
      drugName: import_zod10.z.string().describe("Name of the drug"),
      location: import_zod10.z.string().optional().describe("Specific location (optional - calculates for all if not provided)"),
      serviceLevel: import_zod10.z.number().min(0.8).max(0.99).optional().default(0.95).describe("Service level (0.90, 0.95, 0.98, 0.99) - default 0.95"),
      leadTimeDays: import_zod10.z.number().int().min(1).max(30).optional().default(7).describe("Lead time in days (default: 7)")
    }),
    func: async ({ drugName, location, serviceLevel, leadTimeDays }) => {
      try {
        const inventory = await db.loadInventory();
        let matches = inventory.filter(
          (item) => smartDrugMatch(drugName, item.drugName)
        );
        if (matches.length === 0) {
          return JSON.stringify({
            error: true,
            notFound: true,
            message: `Drug "${drugName}" not found in inventory`
          });
        }
        if (location) {
          matches = matches.filter(
            (item) => item.location.toLowerCase().includes(location.toLowerCase())
          );
          if (matches.length === 0) {
            return JSON.stringify({
              error: true,
              notFound: true,
              message: `Drug "${drugName}" not found at location "${location}"`
            });
          }
        }
        const results = matches.map((item) => {
          const safetyStock = calculateSafetyStock(
            item.avgDailyUse,
            leadTimeDays,
            serviceLevel
          );
          const currentSafetyStock = item.safetyStock;
          const difference = safetyStock - currentSafetyStock;
          const percentChange = currentSafetyStock > 0 ? difference / currentSafetyStock * 100 : 0;
          return {
            location: item.location,
            currentSafetyStock,
            recommendedSafetyStock: safetyStock,
            difference,
            percentChange: Math.round(percentChange),
            currentStock: item.qtyOnHand,
            avgDailyUse: item.avgDailyUse,
            needsAdjustment: Math.abs(percentChange) > 10
            // >10% change
          };
        });
        const totalAdjustmentsNeeded = results.filter((r) => r.needsAdjustment).length;
        return JSON.stringify({
          drugName: matches[0].drugName,
          parameters: {
            serviceLevel: `${serviceLevel * 100}%`,
            leadTimeDays
          },
          summary: {
            locationsAnalyzed: results.length,
            adjustmentsNeeded: totalAdjustmentsNeeded,
            totalCurrentSafetyStock: results.reduce((s, r) => s + r.currentSafetyStock, 0),
            totalRecommendedSafetyStock: results.reduce((s, r) => s + r.recommendedSafetyStock, 0)
          },
          locations: results,
          alertLevel: totalAdjustmentsNeeded > 0 ? "warning" : "info",
          alertMessage: totalAdjustmentsNeeded > 0 ? `${totalAdjustmentsNeeded} location(s) need safety stock adjustment` : "Current safety stock levels are adequate",
          recommendations: results.filter((r) => r.needsAdjustment).map((r) => `${r.location}: Adjust from ${r.currentSafetyStock} to ${r.recommendedSafetyStock} units (${r.difference > 0 ? "+" : ""}${r.difference})`),
          actions: ["update_safety_stock", "download_report"]
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error calculating safety stock: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
  });
}

// src/tools/forecasting/recalculateAllSafetyStocks.ts
var import_tools10 = require("@langchain/core/tools");
var import_zod11 = require("zod");
function createRecalculateAllSafetyStocksTool(db) {
  return new import_tools10.DynamicStructuredTool({
    name: "recalculate_all_safety_stocks",
    description: `
Recalculate optimal safety stock levels for all drugs based on actual usage.
Uses Wilson formula with service level adjustment.

Use this for queries like:
- "Recalculate safety stocks"
- "Update all safety stock levels"
- "Optimize safety stocks"
- "Recalculate par levels"
    `.trim(),
    schema: import_zod11.z.object({
      serviceLevel: import_zod11.z.number().min(0.5).max(0.99).optional().default(0.95).describe("Target service level (0.50-0.99, default: 0.95)"),
      leadTimeDays: import_zod11.z.number().int().min(1).max(30).optional().default(7).describe("Supplier lead time in days (default: 7)"),
      updateDatabase: import_zod11.z.boolean().optional().default(false).describe("Actually update database with new values (default: false - preview only)"),
      category: import_zod11.z.string().optional().describe("Only recalculate specific category: controlled, refrigerated, standard (optional)")
    }),
    func: async ({ serviceLevel, leadTimeDays, updateDatabase, category }) => {
      try {
        const rawInventory = await db.loadInventory();
        const inventory = rawInventory.map((item) => enrichInventoryItem(item));
        const transactions = await db.loadTransactions(60);
        let relevantInventory = inventory;
        if (category) {
          relevantInventory = inventory.filter(
            (item) => item.category.toLowerCase() === category.toLowerCase()
          );
        }
        const drugUsage = /* @__PURE__ */ new Map();
        for (const txn of transactions) {
          if (txn.action !== "USE") continue;
          const existing = drugUsage.get(txn.drugId) || [];
          existing.push(Math.abs(txn.qtyChange));
          drugUsage.set(txn.drugId, existing);
        }
        const recalculations = [];
        let updatedCount = 0;
        let skippedCount = 0;
        for (const item of relevantInventory) {
          const usage = drugUsage.get(item.drugId);
          if (!usage || usage.length < 5) {
            skippedCount++;
            continue;
          }
          const avgDailyUsage = usage.reduce((sum, u) => sum + u, 0) / 60;
          const variance = usage.reduce((sum, u) => sum + Math.pow(u - avgDailyUsage, 2), 0) / usage.length;
          const stdDev = Math.sqrt(variance);
          const newSafetyStock = calculateSafetyStock(
            avgDailyUsage,
            stdDev,
            leadTimeDays,
            serviceLevel
          );
          const currentSafetyStock = item.safetyStock;
          const difference = newSafetyStock - currentSafetyStock;
          const percentChange = currentSafetyStock > 0 ? difference / currentSafetyStock * 100 : 0;
          const isSignificantChange = Math.abs(percentChange) >= 10;
          let finalSafetyStock = newSafetyStock;
          if (item.category === "controlled") {
            finalSafetyStock = Math.ceil(newSafetyStock * 1.1);
          } else if (item.category === "refrigerated") {
            finalSafetyStock = Math.ceil(newSafetyStock * 1.05);
          } else {
            finalSafetyStock = Math.ceil(newSafetyStock);
          }
          recalculations.push({
            drugId: item.drugId,
            drugName: item.drugName,
            category: item.category,
            location: item.location,
            current: {
              safetyStock: currentSafetyStock,
              avgDailyUsage: item.avgDailyUse || 0
            },
            calculated: {
              avgDailyUsage: avgDailyUsage.toFixed(2),
              stdDev: stdDev.toFixed(2),
              variability: stdDev > 0 ? (stdDev / avgDailyUsage * 100).toFixed(1) + "%" : "N/A",
              newSafetyStock: finalSafetyStock,
              difference,
              percentChange: percentChange.toFixed(1) + "%"
            },
            recommendation: {
              action: Math.abs(percentChange) < 5 ? "KEEP_CURRENT" : percentChange > 20 ? "INCREASE_SIGNIFICANTLY" : percentChange > 10 ? "INCREASE" : percentChange < -20 ? "DECREASE_SIGNIFICANTLY" : percentChange < -10 ? "DECREASE" : "MINOR_ADJUSTMENT",
              isSignificantChange,
              note: Math.abs(percentChange) < 5 ? "Current safety stock is optimal" : percentChange > 20 ? `Increase safety stock by ${Math.abs(percentChange).toFixed(0)}% due to higher usage/variability` : percentChange > 10 ? `Moderate increase recommended` : percentChange < -20 ? `Significant decrease possible - usage has declined` : percentChange < -10 ? `Moderate decrease recommended` : "Minor adjustment suggested"
            },
            usagePattern: {
              transactionCount: usage.length,
              minUsage: Math.min(...usage),
              maxUsage: Math.max(...usage),
              usageSpread: (Math.max(...usage) - Math.min(...usage)).toFixed(0)
            }
          });
          if (updateDatabase && isSignificantChange) {
            await db.updateInventoryItem(item.drugId, {
              safetyStock: finalSafetyStock,
              avgDailyUse: parseFloat(avgDailyUsage.toFixed(2))
            });
            updatedCount++;
          }
        }
        recalculations.sort(
          (a, b) => Math.abs(parseFloat(b.calculated.percentChange)) - Math.abs(parseFloat(a.calculated.percentChange))
        );
        const significantIncreases = recalculations.filter(
          (r) => parseFloat(r.calculated.percentChange) >= 10
        );
        const significantDecreases = recalculations.filter(
          (r) => parseFloat(r.calculated.percentChange) <= -10
        );
        const minorAdjustments = recalculations.filter(
          (r) => Math.abs(parseFloat(r.calculated.percentChange)) < 10 && Math.abs(parseFloat(r.calculated.percentChange)) >= 5
        );
        const noChange = recalculations.filter(
          (r) => Math.abs(parseFloat(r.calculated.percentChange)) < 5
        );
        const highVariability = recalculations.filter(
          (r) => parseFloat(r.calculated.variability.replace("%", "")) > 50
        );
        return JSON.stringify({
          found: true,
          serviceLevel,
          leadTimeDays,
          category,
          updateDatabase,
          summary: {
            totalAnalyzed: recalculations.length,
            skippedDueToInsufficientData: skippedCount,
            updated: updatedCount,
            byRecommendation: {
              significantIncreases: significantIncreases.length,
              significantDecreases: significantDecreases.length,
              minorAdjustments: minorAdjustments.length,
              keepCurrent: noChange.length
            },
            highVariabilityDrugs: highVariability.length,
            status: updateDatabase ? `Updated ${updatedCount} drug(s) with significant changes` : "PREVIEW MODE - No changes made to database"
          },
          alertLevel: significantIncreases.length + significantDecreases.length > 10 ? "warning" : "info",
          alertMessage: updateDatabase ? `Safety stocks recalculated: ${significantIncreases.length} increases, ${significantDecreases.length} decreases` : `Preview: ${significantIncreases.length + significantDecreases.length} drug(s) need safety stock adjustment`,
          significantChanges: significantIncreases.length + significantDecreases.length > 0 ? {
            increases: significantIncreases.slice(0, 20).map((r) => ({
              drugName: r.drugName,
              category: r.category,
              currentSafetyStock: r.current.safetyStock,
              recommendedSafetyStock: r.calculated.newSafetyStock,
              change: r.calculated.percentChange,
              reason: r.recommendation.note
            })),
            decreases: significantDecreases.slice(0, 20).map((r) => ({
              drugName: r.drugName,
              category: r.category,
              currentSafetyStock: r.current.safetyStock,
              recommendedSafetyStock: r.calculated.newSafetyStock,
              change: r.calculated.percentChange,
              reason: r.recommendation.note
            }))
          } : void 0,
          recalculations: recalculations.slice(0, 50).map((r, index) => ({
            rank: index + 1,
            drugName: r.drugName,
            category: r.category,
            location: r.location,
            currentSafetyStock: r.current.safetyStock,
            recommendedSafetyStock: r.calculated.newSafetyStock,
            change: r.calculated.percentChange,
            action: r.recommendation.action,
            variability: r.calculated.variability
          })),
          methodology: {
            formula: "Wilson Safety Stock Formula",
            serviceLevel: `${(serviceLevel * 100).toFixed(0)}% service level`,
            leadTime: `${leadTimeDays} days`,
            dataPoints: "60-day usage history minimum",
            adjustments: [
              "Controlled substances: +10% buffer",
              "Refrigerated items: +5% buffer",
              "High variability items: Increased safety stock"
            ],
            note: "Safety stock = Z-score \xD7 StdDev \xD7 \u221A(Lead Time)"
          },
          recommendations: [
            significantIncreases.length > 0 && `${significantIncreases.length} drug(s) need increased safety stock - usage/variability has risen`,
            significantDecreases.length > 0 && `${significantDecreases.length} drug(s) can reduce safety stock - usage has declined`,
            highVariability.length > 5 && `${highVariability.length} drugs have high variability (>50%) - increased safety stock recommended`,
            !updateDatabase && "Run with updateDatabase=true to apply changes",
            updateDatabase && updatedCount > 0 && `Successfully updated ${updatedCount} items`,
            "Recalculate safety stocks quarterly to optimize inventory levels",
            "Monitor drugs with high variability more closely"
          ].filter(Boolean),
          financialImpact: {
            note: "Estimated inventory value changes",
            increases: significantIncreases.length > 0 ? `${significantIncreases.length} drugs will hold more inventory` : "No increases",
            decreases: significantDecreases.length > 0 ? `${significantDecreases.length} drugs can reduce inventory (capital freed)` : "No decreases",
            netEffect: significantIncreases.length > significantDecreases.length ? "Increased inventory investment recommended for better service" : significantDecreases.length > significantIncreases.length ? "Opportunity to reduce inventory holding costs" : "Balanced adjustments"
          },
          actions: updateDatabase ? ["verify_changes", "update_reorder_points", "notify_procurement"] : ["review_recommendations", "approve_changes", "rerun_with_update"],
          note: recalculations.length > 50 ? `Showing top 50 of ${recalculations.length} recalculations. Export for full report.` : "Complete safety stock recalculation displayed.",
          reportDate: (/* @__PURE__ */ new Date()).toISOString()
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error recalculating safety stocks: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
  });
}

// src/tools/forecasting/detectSeasonalPatterns.ts
var import_tools11 = require("@langchain/core/tools");
var import_zod12 = require("zod");
function createDetectSeasonalPatternsTool(db) {
  return new import_tools11.DynamicStructuredTool({
    name: "detect_seasonal_patterns",
    description: `
Detect seasonal patterns and trends in drug usage.
Compares recent usage to historical patterns to identify changes.

Use this for queries like:
- "Analyze seasonal patterns for Propofol"
- "Detect usage trends"
- "Is usage increasing or decreasing?"
- "Seasonal analysis for drug X"
    `.trim(),
    schema: import_zod12.z.object({
      drugName: import_zod12.z.string().optional().describe("Specific drug name (optional - if not provided, analyzes all drugs)"),
      recentPeriodDays: import_zod12.z.number().int().min(7).max(90).optional().default(30).describe("Recent period to analyze (default: 30 days)"),
      historicalPeriodDays: import_zod12.z.number().int().min(30).max(180).optional().default(60).describe("Total historical period to load (default: 60 days = last 30 + previous 30 for comparison)")
    }),
    func: async ({ drugName, recentPeriodDays, historicalPeriodDays }) => {
      try {
        const transactions = await db.loadTransactions(historicalPeriodDays);
        const rawInventory = await db.loadInventory();
        const inventory = rawInventory.map((item) => enrichInventoryItem(item));
        let relevantTransactions = transactions;
        if (drugName) {
          const matchingItems = inventory.filter(
            (item) => item.drugName.toLowerCase().includes(drugName.toLowerCase())
          );
          if (matchingItems.length === 0) {
            return JSON.stringify({
              found: false,
              drugName,
              message: `Drug "${drugName}" not found`
            });
          }
          const drugIds = matchingItems.map((i) => i.drugId);
          relevantTransactions = transactions.filter((t) => drugIds.includes(t.drugId));
        }
        const drugTransactions = /* @__PURE__ */ new Map();
        for (const txn of relevantTransactions) {
          if (txn.action !== "USE") continue;
          const invItem = inventory.find((i) => i.drugId === txn.drugId);
          if (!invItem) continue;
          const drugName2 = invItem.drugName;
          const existing = drugTransactions.get(drugName2) || [];
          existing.push(txn);
          drugTransactions.set(drugName2, existing);
        }
        if (drugTransactions.size === 0) {
          return JSON.stringify({
            found: false,
            drugName,
            message: "No usage transactions found in the specified period",
            alertLevel: "info"
          });
        }
        const analyses = [];
        for (const [drugName2, txns] of drugTransactions.entries()) {
          const invItems = inventory.filter((i) => i.drugName === drugName2);
          if (invItems.length === 0) continue;
          const invItem = invItems[0];
          const cutoffDate = /* @__PURE__ */ new Date();
          cutoffDate.setDate(cutoffDate.getDate() - recentPeriodDays);
          const recentTxns = txns.filter((t) => new Date(t.timestamp) >= cutoffDate);
          const historicalTxns = txns.filter((t) => new Date(t.timestamp) < cutoffDate);
          const recentUsage = recentTxns.reduce((sum, t) => sum + Math.abs(t.qtyChange), 0);
          const historicalUsage = historicalTxns.reduce((sum, t) => sum + Math.abs(t.qtyChange), 0);
          const recentDailyAvg = recentUsage / recentPeriodDays;
          const historicalDailyAvg = historicalUsage / (historicalPeriodDays - recentPeriodDays);
          const percentChange = historicalDailyAvg > 0 ? (recentDailyAvg - historicalDailyAvg) / historicalDailyAvg * 100 : 0;
          let trend = "STABLE";
          let severity = "LOW";
          if (Math.abs(percentChange) >= 50) {
            severity = "CRITICAL";
            trend = percentChange > 0 ? "INCREASING" : "DECREASING";
          } else if (Math.abs(percentChange) >= 30) {
            severity = "HIGH";
            trend = percentChange > 0 ? "INCREASING" : "DECREASING";
          } else if (Math.abs(percentChange) >= 15) {
            severity = "MODERATE";
            trend = percentChange > 0 ? "INCREASING" : "DECREASING";
          }
          const dayOfWeekUsage = /* @__PURE__ */ new Map();
          for (const txn of txns) {
            const day = new Date(txn.timestamp).getDay();
            const existing = dayOfWeekUsage.get(day) || 0;
            dayOfWeekUsage.set(day, existing + Math.abs(txn.qtyChange));
          }
          const avgByDay = Array.from(dayOfWeekUsage.entries()).map(([day, usage]) => ({ day, usage, avg: usage / (txns.length / 7) }));
          const peakDay = avgByDay.length > 0 ? avgByDay.reduce((max, curr) => curr.usage > max.usage ? curr : max) : null;
          const lowDay = avgByDay.length > 0 ? avgByDay.reduce((min, curr) => curr.usage < min.usage ? curr : min) : null;
          const seasonalityResult = detectSeasonalPatterns(txns, historicalPeriodDays);
          const totalCurrentStock = invItems.reduce((sum, item) => sum + item.qtyOnHand, 0);
          const totalSafetyStock = invItems.reduce((sum, item) => sum + item.safetyStock, 0);
          analyses.push({
            drugName: drugName2,
            category: invItem.category,
            trendAnalysis: {
              trend,
              severity,
              percentChange: percentChange.toFixed(1),
              recentDailyAvg: recentDailyAvg.toFixed(2),
              historicalDailyAvg: historicalDailyAvg.toFixed(2),
              absoluteChange: (recentDailyAvg - historicalDailyAvg).toFixed(2)
            },
            periodComparison: {
              recentPeriod: {
                days: recentPeriodDays,
                totalUsage: recentUsage,
                avgDaily: recentDailyAvg.toFixed(2),
                transactions: recentTxns.length
              },
              historicalPeriod: {
                days: historicalPeriodDays - recentPeriodDays,
                totalUsage: historicalUsage,
                avgDaily: historicalDailyAvg.toFixed(2),
                transactions: historicalTxns.length
              }
            },
            dayOfWeekPattern: peakDay && lowDay ? {
              detected: true,
              peakDay: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][peakDay.day],
              peakUsage: peakDay.usage.toFixed(0),
              lowDay: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][lowDay.day],
              lowUsage: lowDay.usage.toFixed(0),
              variability: peakDay.usage > 0 ? ((peakDay.usage - lowDay.usage) / peakDay.usage * 100).toFixed(0) + "%" : "N/A"
            } : { detected: false },
            seasonality: seasonalityResult,
            currentStock: totalCurrentStock,
            safetyStock: totalSafetyStock,
            locations: invItems.length,
            recommendation: severity === "CRITICAL" ? trend === "INCREASING" ? `URGENT: Usage increased by ${Math.abs(parseFloat(percentChange.toFixed(1)))}% - significantly increase safety stock and reorder points` : `URGENT: Usage decreased by ${Math.abs(parseFloat(percentChange.toFixed(1)))}% - review if item still needed, reduce par levels` : severity === "HIGH" ? trend === "INCREASING" ? `High increase detected (${Math.abs(parseFloat(percentChange.toFixed(1)))}%) - increase safety stock by 20-30%` : `High decrease detected (${Math.abs(parseFloat(percentChange.toFixed(1)))}%) - reduce safety stock by 15-20%` : severity === "MODERATE" ? `Moderate ${trend.toLowerCase()} trend - monitor and adjust par levels if trend continues` : "Usage stable - maintain current stock levels",
            actionRequired: severity === "CRITICAL" || severity === "HIGH"
          });
        }
        const severityOrder = { CRITICAL: 0, HIGH: 1, MODERATE: 2, LOW: 3 };
        analyses.sort((a, b) => {
          const sevDiff = severityOrder[a.trendAnalysis.severity] - severityOrder[b.trendAnalysis.severity];
          if (sevDiff !== 0) return sevDiff;
          return Math.abs(parseFloat(b.trendAnalysis.percentChange)) - Math.abs(parseFloat(a.trendAnalysis.percentChange));
        });
        const critical = analyses.filter((a) => a.trendAnalysis.severity === "CRITICAL");
        const high = analyses.filter((a) => a.trendAnalysis.severity === "HIGH");
        const increasing = analyses.filter((a) => a.trendAnalysis.trend === "INCREASING");
        const decreasing = analyses.filter((a) => a.trendAnalysis.trend === "DECREASING");
        const stable = analyses.filter((a) => a.trendAnalysis.trend === "STABLE");
        const alertLevel = critical.length > 0 ? "warning" : high.length > 0 ? "info" : "info";
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
              moderate: analyses.filter((a) => a.trendAnalysis.severity === "MODERATE").length,
              low: analyses.filter((a) => a.trendAnalysis.severity === "LOW").length
            },
            byTrend: {
              increasing: increasing.length,
              decreasing: decreasing.length,
              stable: stable.length
            },
            actionRequired: analyses.filter((a) => a.actionRequired).length
          },
          alertLevel,
          alertMessage: critical.length > 0 ? `${critical.length} drug(s) with critical trend changes (50%+ change)` : high.length > 0 ? `${high.length} drug(s) with significant trend changes (30%+ change)` : analyses.length > 0 ? `Seasonal pattern analysis for ${analyses.length} drug(s)` : "No significant patterns detected",
          criticalPatterns: critical.length > 0 ? critical.map((a) => ({
            drugName: a.drugName,
            trend: a.trendAnalysis.trend,
            percentChange: a.trendAnalysis.percentChange + "%",
            recommendation: a.recommendation
          })) : void 0,
          analyses: analyses.slice(0, 20).map((a, index) => ({
            rank: index + 1,
            drugName: a.drugName,
            trend: a.trendAnalysis.trend,
            severity: a.trendAnalysis.severity,
            percentChange: a.trendAnalysis.percentChange + "%",
            recentAvgDaily: a.trendAnalysis.recentDailyAvg,
            historicalAvgDaily: a.trendAnalysis.historicalDailyAvg,
            peakDay: a.dayOfWeekPattern.detected ? a.dayOfWeekPattern.peakDay : "N/A",
            seasonality: a.seasonality.hasSeasonality ? a.seasonality.pattern : "Stable"
          })),
          insights: [
            {
              title: "Strongest Trend",
              data: analyses.length > 0 ? `${analyses[0].drugName} - ${analyses[0].trendAnalysis.trend} by ${Math.abs(parseFloat(analyses[0].trendAnalysis.percentChange))}%` : "No strong trends",
              recommendation: analyses[0] && analyses[0].recommendation || "N/A"
            },
            {
              title: "Day-of-Week Patterns",
              data: analyses.filter((a) => a.dayOfWeekPattern.detected).length > 0 ? `${analyses.filter((a) => a.dayOfWeekPattern.detected).length} drug(s) show weekday variation` : "No significant day-of-week patterns",
              recommendation: "Adjust staffing and stock availability based on peak days"
            },
            {
              title: "Overall Usage Trend",
              data: increasing.length > decreasing.length ? `Increasing usage trend - ${increasing.length} drugs up, ${decreasing.length} down` : decreasing.length > increasing.length ? `Decreasing usage trend - ${decreasing.length} drugs down, ${increasing.length} up` : "Balanced usage - stable patterns",
              recommendation: increasing.length > decreasing.length ? "Consider increasing overall inventory budget" : decreasing.length > increasing.length ? "Opportunity to reduce inventory carrying costs" : "Maintain current inventory strategy"
            }
          ],
          recommendations: [
            critical.length > 0 && `URGENT: ${critical.length} drug(s) with critical trend changes - immediate par level review required`,
            increasing.length > 5 && `${increasing.length} drugs showing increased usage - budget for higher procurement costs`,
            decreasing.length > 5 && `${decreasing.length} drugs with decreased usage - opportunity to reduce stock levels and free up capital`,
            analyses.filter((a) => a.dayOfWeekPattern.detected).length > 3 && "Multiple drugs show day-of-week patterns - optimize restocking schedules",
            "Review trends monthly to adjust safety stock and par levels proactively",
            "Use seasonal patterns to plan procurement timing for best pricing"
          ].filter(Boolean),
          actions: ["update_par_levels", "adjust_safety_stocks", "schedule_procurement_review", "export_analysis"],
          note: analyses.length > 20 ? `Showing top 20 of ${analyses.length} drugs analyzed. Export full report for complete data.` : "Complete seasonal pattern analysis displayed.",
          reportDate: (/* @__PURE__ */ new Date()).toISOString()
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error detecting seasonal patterns: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
  });
}

// src/tools/forecasting/predictStockoutDate.ts
var import_tools12 = require("@langchain/core/tools");
var import_zod13 = require("zod");
function createPredictStockoutDateTool(db) {
  return new import_tools12.DynamicStructuredTool({
    name: "predict_stockout_date",
    description: `
Predict the exact date when a drug will run out of stock.
Uses linear regression with trend analysis for accurate predictions.

Use this for queries like:
- "When will Propofol run out?"
- "Predict stockout date for Midazolam"
- "How long until drug X is depleted?"
- "Stockout prediction"
    `.trim(),
    schema: import_zod13.z.object({
      drugName: import_zod13.z.string().describe("Drug name to analyze"),
      includeReceiving: import_zod13.z.boolean().optional().default(false).describe("Consider incoming stock in prediction (default: false)")
    }),
    func: async ({ drugName, includeReceiving }) => {
      try {
        const rawInventory = await db.loadInventory();
        const inventory = rawInventory.map((item) => enrichInventoryItem(item));
        const transactions = await db.loadTransactions(90);
        const matchingItems = inventory.filter(
          (item) => item.drugName.toLowerCase().includes(drugName.toLowerCase())
        );
        if (matchingItems.length === 0) {
          return JSON.stringify({
            found: false,
            drugName,
            message: `Drug "${drugName}" not found in inventory`
          });
        }
        const drugId = matchingItems[0].drugId;
        const exactDrugName = matchingItems[0].drugName;
        const drugTransactions = transactions.filter((t) => t.drugId === drugId);
        if (drugTransactions.length < 3) {
          return JSON.stringify({
            found: true,
            drugName: exactDrugName,
            insufficientData: true,
            message: `Insufficient transaction history (${drugTransactions.length} transactions). Need at least 3 for accurate prediction.`,
            currentStock: matchingItems.reduce((sum, i) => sum + i.qtyOnHand, 0),
            recommendation: "Monitor manually until more usage data is available"
          });
        }
        const totalCurrentStock = matchingItems.reduce((sum, item) => sum + item.qtyOnHand, 0);
        if (totalCurrentStock === 0) {
          return JSON.stringify({
            found: true,
            drugName: exactDrugName,
            status: "ALREADY_STOCKEDOUT",
            message: `${exactDrugName} is already OUT OF STOCK`,
            alertLevel: "critical",
            stockoutDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
            daysUntilStockout: 0,
            action: "EMERGENCY ORDER REQUIRED"
          });
        }
        const usageData = [];
        for (const txn of drugTransactions) {
          if (txn.action === "USE") {
            usageData.push({
              date: new Date(txn.timestamp),
              value: Math.abs(txn.qtyChange)
            });
          }
        }
        const trendResult = calculateDetailedTrend(usageData);
        const totalUsed = usageData.reduce((sum, d) => sum + d.value, 0);
        const daysSpan = usageData.length > 0 ? (usageData[usageData.length - 1].date.getTime() - usageData[0].date.getTime()) / (1e3 * 60 * 60 * 24) : 30;
        const avgDailyUsage = totalUsed / Math.max(daysSpan, 1);
        let daysUntilStockout = 0;
        let stockoutDate = null;
        let predictionMethod = "";
        let confidence = "LOW";
        if (trendResult.hasSignificantTrend && trendResult.trend > 0) {
          predictionMethod = "Linear regression with trend";
          const dailyTrend = trendResult.trend / 30;
          const currentUsage = avgDailyUsage;
          let remainingStock = totalCurrentStock;
          let day = 0;
          while (remainingStock > 0 && day < 365) {
            day++;
            const predictedUsage = currentUsage + dailyTrend * day;
            remainingStock -= predictedUsage;
          }
          daysUntilStockout = day;
          stockoutDate = /* @__PURE__ */ new Date();
          stockoutDate.setDate(stockoutDate.getDate() + day);
          confidence = trendResult.rSquared > 0.7 ? "HIGH" : trendResult.rSquared > 0.5 ? "MEDIUM" : "LOW";
        } else {
          predictionMethod = "Average daily usage";
          daysUntilStockout = Math.floor(totalCurrentStock / avgDailyUsage);
          stockoutDate = /* @__PURE__ */ new Date();
          stockoutDate.setDate(stockoutDate.getDate() + daysUntilStockout);
          confidence = usageData.length > 30 ? "MEDIUM" : "LOW";
        }
        if (includeReceiving) {
          const receivingTransactions = drugTransactions.filter(
            (t) => t.action === "RECEIVE"
          );
          if (receivingTransactions.length > 0) {
            predictionMethod += " (adjusted for receiving patterns)";
          }
        }
        const alertLevel = daysUntilStockout <= 7 ? "critical" : daysUntilStockout <= 14 ? "warning" : "info";
        return JSON.stringify({
          found: true,
          drugName: exactDrugName,
          category: matchingItems[0].category,
          prediction: {
            daysUntilStockout,
            estimatedStockoutDate: stockoutDate && stockoutDate.toISOString().split("T")[0],
            confidence,
            method: predictionMethod
          },
          currentSituation: {
            totalStock: totalCurrentStock,
            locations: matchingItems.length,
            safetyStock: Math.max(...matchingItems.map((i) => i.safetyStock)),
            belowSafetyStock: totalCurrentStock < Math.max(...matchingItems.map((i) => i.safetyStock))
          },
          usageAnalysis: {
            avgDailyUsage: avgDailyUsage.toFixed(2),
            last30DaysUsage: totalUsed,
            transactions: usageData.length,
            dataSpanDays: Math.floor(daysSpan),
            trend: trendResult.hasSignificantTrend ? trendResult.trend > 0 ? "INCREASING" : "DECREASING" : "STABLE",
            trendPercentage: trendResult.hasSignificantTrend ? (trendResult.trend > 0 ? "+" : "") + trendResult.trend.toFixed(1) + "%" : "N/A"
          },
          riskAssessment: {
            level: alertLevel,
            severity: daysUntilStockout <= 3 ? "EMERGENCY" : daysUntilStockout <= 7 ? "CRITICAL" : daysUntilStockout <= 14 ? "HIGH" : daysUntilStockout <= 30 ? "MEDIUM" : "LOW",
            willLastLeadTime: daysUntilStockout > 7,
            // Assuming 7-day lead time
            message: daysUntilStockout <= 3 ? "EMERGENCY: Less than 3 days of stock remaining" : daysUntilStockout <= 7 ? "CRITICAL: Will run out within typical supplier lead time" : daysUntilStockout <= 14 ? "HIGH RISK: Limited buffer before stockout" : daysUntilStockout <= 30 ? "MODERATE RISK: Order soon" : "LOW RISK: Adequate stock"
          },
          alertLevel,
          alertMessage: daysUntilStockout <= 7 ? `CRITICAL: ${exactDrugName} will run out in ${daysUntilStockout} days (${stockoutDate && stockoutDate.toISOString().split("T")[0]})` : daysUntilStockout <= 14 ? `WARNING: ${exactDrugName} estimated to run out in ${daysUntilStockout} days` : `${exactDrugName} estimated stockout: ${daysUntilStockout} days (${stockoutDate && stockoutDate.toISOString().split("T")[0]})`,
          recommendations: [
            daysUntilStockout <= 7 && "ORDER IMMEDIATELY - Will run out before typical supplier lead time",
            daysUntilStockout <= 14 && "Order within 1-2 days to maintain adequate buffer",
            daysUntilStockout <= 30 && "Plan reorder within this week",
            trendResult.hasSignificantTrend && trendResult.trend > 0 && "Usage is increasing - consider raising safety stock levels",
            confidence === "LOW" && "Low prediction confidence - monitor stock closely and gather more usage data",
            matchingItems[0].category === "controlled" && "Controlled substance - ensure proper authorization for emergency orders",
            "Set up automated reorder alerts to prevent future stockouts"
          ].filter(Boolean),
          modelDetails: {
            predictionMethod,
            confidence,
            confidenceNote: confidence === "HIGH" ? "High confidence - strong trend with good data" : confidence === "MEDIUM" ? "Medium confidence - adequate data or stable pattern" : "Low confidence - limited data or high variability",
            rSquared: trendResult.rSquared && trendResult.rSquared.toFixed(3) || "N/A",
            dataQuality: usageData.length >= 30 ? "Good" : usageData.length >= 10 ? "Fair" : "Limited"
          },
          actions: daysUntilStockout <= 14 ? ["generate_emergency_po", "contact_supplier", "check_other_locations", "expedite_delivery"] : ["plan_reorder", "monitor_usage", "update_par_levels"],
          locationBreakdown: matchingItems.map((item) => ({
            location: item.location,
            stock: item.qtyOnHand,
            daysOfStock: avgDailyUsage > 0 ? Math.floor(item.qtyOnHand / avgDailyUsage) : 999
          })),
          reportDate: (/* @__PURE__ */ new Date()).toISOString()
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error predicting stockout date: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
  });
}

// src/tools/forecasting/analyzeUsageTrends.ts
var import_tools13 = require("@langchain/core/tools");
var import_zod14 = require("zod");
function createAnalyzeUsageTrendsTool(db) {
  return new import_tools13.DynamicStructuredTool({
    name: "analyze_usage_trends",
    description: `
Analyze usage trends across multiple drugs and time periods.
Provides insights into changing consumption patterns and forecasts.

Use this for queries like:
- "Analyze usage trends"
- "Show me trend analysis"
- "What are the usage patterns?"
- "Trend report for all drugs"
    `.trim(),
    schema: import_zod14.z.object({
      days: import_zod14.z.number().int().min(14).max(180).optional().default(90).describe("Period to analyze (default: 90)"),
      category: import_zod14.z.string().optional().describe("Filter by category: controlled, refrigerated, standard (optional)"),
      minTransactions: import_zod14.z.number().int().min(1).max(50).optional().default(5).describe("Minimum transactions required for analysis (default: 5)")
    }),
    func: async ({ days, category, minTransactions }) => {
      try {
        const rawInventory = await db.loadInventory();
        const inventory = rawInventory.map((item) => enrichInventoryItem(item));
        const transactions = await db.loadTransactions(days);
        let relevantInventory = inventory;
        if (category) {
          relevantInventory = inventory.filter(
            (item) => item.category.toLowerCase() === category.toLowerCase()
          );
        }
        const drugTransactions = /* @__PURE__ */ new Map();
        for (const txn of transactions) {
          if (txn.action !== "USE") continue;
          const existing = drugTransactions.get(txn.drugId) || [];
          existing.push(txn);
          drugTransactions.set(txn.drugId, existing);
        }
        const analyses = [];
        for (const item of relevantInventory) {
          const txns = drugTransactions.get(item.drugId);
          if (!txns || txns.length < minTransactions) continue;
          const usageData = txns.map((t) => ({
            date: new Date(t.timestamp),
            value: Math.abs(t.qtyChange)
          })).sort((a, b) => a.date.getTime() - b.date.getTime());
          const trendResult = calculateDetailedTrend(usageData);
          const totalUsage = usageData.reduce((sum, d) => sum + d.value, 0);
          const avgDailyUsage = totalUsage / days;
          const maxDailyUsage = Math.max(...usageData.map((d) => d.value));
          const minDailyUsage = Math.min(...usageData.map((d) => d.value));
          const mean = avgDailyUsage;
          const variance = usageData.reduce((sum, d) => sum + Math.pow(d.value - mean, 2), 0) / usageData.length;
          const stdDev = Math.sqrt(variance);
          const coefficientOfVariation = mean > 0 ? stdDev / mean * 100 : 0;
          const midPoint = Math.floor(usageData.length / 2);
          const firstHalf = usageData.slice(0, midPoint);
          const secondHalf = usageData.slice(midPoint);
          const firstHalfAvg = firstHalf.reduce((sum, d) => sum + d.value, 0) / firstHalf.length;
          const secondHalfAvg = secondHalf.reduce((sum, d) => sum + d.value, 0) / secondHalf.length;
          const periodChange = firstHalfAvg > 0 ? (secondHalfAvg - firstHalfAvg) / firstHalfAvg * 100 : 0;
          let trendCategory = "STABLE";
          if (Math.abs(periodChange) >= 30) {
            trendCategory = periodChange > 0 ? "STRONGLY_INCREASING" : "STRONGLY_DECREASING";
          } else if (Math.abs(periodChange) >= 15) {
            trendCategory = periodChange > 0 ? "INCREASING" : "DECREASING";
          } else if (Math.abs(periodChange) >= 5) {
            trendCategory = periodChange > 0 ? "SLIGHTLY_INCREASING" : "SLIGHTLY_DECREASING";
          }
          const variabilityCategory = coefficientOfVariation > 50 ? "HIGH" : coefficientOfVariation > 30 ? "MODERATE" : "LOW";
          const forecastDays = 30;
          const projectedUsage = avgDailyUsage * forecastDays * (1 + periodChange / 100);
          analyses.push({
            drugId: item.drugId,
            drugName: item.drugName,
            category: item.category,
            currentStock: item.qtyOnHand,
            safetyStock: item.safetyStock,
            usage: {
              totalInPeriod: totalUsage,
              avgDaily: avgDailyUsage.toFixed(2),
              maxDaily: maxDailyUsage,
              minDaily: minDailyUsage,
              transactions: txns.length
            },
            trend: {
              category: trendCategory,
              periodChange: periodChange.toFixed(1) + "%",
              direction: trendResult.hasSignificantTrend ? trendResult.trend > 0 ? "UP" : "DOWN" : "STABLE",
              confidence: trendResult.rSquared > 0.7 ? "HIGH" : trendResult.rSquared > 0.5 ? "MEDIUM" : "LOW",
              rSquared: trendResult.rSquared.toFixed(3),
              slope: trendResult.slope.toFixed(3)
            },
            variability: {
              category: variabilityCategory,
              coefficientOfVariation: coefficientOfVariation.toFixed(1) + "%",
              stdDev: stdDev.toFixed(2),
              note: variabilityCategory === "HIGH" ? "Highly unpredictable usage - increase safety stock" : variabilityCategory === "MODERATE" ? "Moderate variation - standard safety stock adequate" : "Consistent usage - lower safety stock possible"
            },
            forecast: {
              next30DaysProjected: projectedUsage.toFixed(0),
              willMeetDemand: item.qtyOnHand >= projectedUsage,
              shortfall: item.qtyOnHand < projectedUsage ? (projectedUsage - item.qtyOnHand).toFixed(0) : "0"
            },
            recommendation: trendCategory === "STRONGLY_INCREASING" ? `URGENT: Strong upward trend (${Math.abs(parseFloat(periodChange.toFixed(1)))}%) - increase safety stock by 30-50%` : trendCategory === "STRONGLY_DECREASING" ? `Significant downward trend (${Math.abs(parseFloat(periodChange.toFixed(1)))}%) - reduce par levels by 20-30%` : trendCategory === "INCREASING" ? `Upward trend detected - increase safety stock by 15-20%` : trendCategory === "DECREASING" ? `Downward trend - consider reducing par levels by 10-15%` : variabilityCategory === "HIGH" ? "High variability - increase safety stock buffer" : "Stable usage - maintain current levels"
          });
        }
        if (analyses.length === 0) {
          return JSON.stringify({
            found: false,
            days,
            category,
            minTransactions,
            message: `No drugs with sufficient transaction history (minimum ${minTransactions} transactions)`,
            suggestion: "Lower minTransactions threshold or analyze a longer period"
          });
        }
        analyses.sort(
          (a, b) => Math.abs(parseFloat(b.trend.periodChange)) - Math.abs(parseFloat(a.trend.periodChange))
        );
        const stronglyIncreasing = analyses.filter((a) => a.trend.category === "STRONGLY_INCREASING");
        const stronglyDecreasing = analyses.filter((a) => a.trend.category === "STRONGLY_DECREASING");
        const increasing = analyses.filter((a) => a.trend.category.includes("INCREASING"));
        const decreasing = analyses.filter((a) => a.trend.category.includes("DECREASING"));
        const stable = analyses.filter((a) => a.trend.category === "STABLE");
        const highVariability = analyses.filter((a) => a.variability.category === "HIGH");
        const willShortfall = analyses.filter((a) => !a.forecast.willMeetDemand);
        const alertLevel = stronglyIncreasing.length > 0 || willShortfall.length > 5 ? "warning" : "info";
        return JSON.stringify({
          found: true,
          days,
          category,
          minTransactions,
          summary: {
            totalDrugsAnalyzed: analyses.length,
            periodAnalyzed: `${days} days`,
            byTrend: {
              stronglyIncreasing: stronglyIncreasing.length,
              increasing: increasing.length - stronglyIncreasing.length,
              stable: stable.length,
              decreasing: decreasing.length - stronglyDecreasing.length,
              stronglyDecreasing: stronglyDecreasing.length
            },
            byVariability: {
              high: analyses.filter((a) => a.variability.category === "HIGH").length,
              moderate: analyses.filter((a) => a.variability.category === "MODERATE").length,
              low: analyses.filter((a) => a.variability.category === "LOW").length
            },
            forecast: {
              projectedShortfalls: willShortfall.length,
              adequateStock: analyses.length - willShortfall.length
            },
            actionRequired: stronglyIncreasing.length + willShortfall.length
          },
          alertLevel,
          alertMessage: stronglyIncreasing.length > 0 ? `${stronglyIncreasing.length} drug(s) with strong upward trends - safety stock adjustment needed` : willShortfall.length > 5 ? `${willShortfall.length} drug(s) projected to have shortfalls in next 30 days` : `Usage trend analysis complete for ${analyses.length} drug(s)`,
          keyFindings: [
            stronglyIncreasing.length > 0 && {
              finding: "Strong Growth Trends",
              count: stronglyIncreasing.length,
              drugs: stronglyIncreasing.slice(0, 5).map((a) => a.drugName),
              impact: "Requires immediate safety stock and par level increases"
            },
            stronglyDecreasing.length > 0 && {
              finding: "Significant Usage Decline",
              count: stronglyDecreasing.length,
              drugs: stronglyDecreasing.slice(0, 5).map((a) => a.drugName),
              impact: "Opportunity to reduce inventory and free up capital"
            },
            highVariability.length > 5 && {
              finding: "High Variability Drugs",
              count: highVariability.length,
              drugs: highVariability.slice(0, 5).map((a) => a.drugName),
              impact: "Need increased safety stock buffers"
            },
            willShortfall.length > 0 && {
              finding: "Projected Shortfalls",
              count: willShortfall.length,
              drugs: willShortfall.slice(0, 5).map((a) => a.drugName),
              impact: "Reorder needed within 30 days"
            }
          ].filter(Boolean),
          analyses: analyses.slice(0, 50).map((a, index) => ({
            rank: index + 1,
            drugName: a.drugName,
            category: a.category,
            trendCategory: a.trend.category,
            periodChange: a.trend.periodChange,
            avgDailyUsage: a.usage.avgDaily,
            variability: a.variability.category,
            projectedShortfall: !a.forecast.willMeetDemand,
            recommendation: a.recommendation
          })),
          recommendations: [
            stronglyIncreasing.length > 0 && `URGENT: Increase safety stock for ${stronglyIncreasing.length} fast-growing drug(s)`,
            willShortfall.length > 5 && `${willShortfall.length} drugs need reordering within 30 days`,
            highVariability.length > 5 && `${highVariability.length} drugs have unpredictable usage - increase buffer stock`,
            increasing.length > decreasing.length && "Overall upward trend - plan for increased procurement budget",
            decreasing.length > increasing.length && "Overall downward trend - opportunity to optimize inventory costs",
            "Review trends quarterly to keep par levels optimized",
            "Set up automated alerts for drugs with strong trend changes"
          ].filter(Boolean),
          actions: ["update_safety_stocks", "adjust_par_levels", "generate_reorder_list", "schedule_review", "export_analysis"],
          note: analyses.length > 50 ? `Showing top 50 of ${analyses.length} drugs analyzed. Export for full report.` : "Complete usage trend analysis displayed.",
          reportDate: (/* @__PURE__ */ new Date()).toISOString()
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error analyzing usage trends: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
  });
}

// src/tools/expiry/checkExpiringDrugs.ts
var import_tools14 = require("@langchain/core/tools");
var import_zod15 = require("zod");
function createCheckExpiringDrugsTool(db) {
  return new import_tools14.DynamicStructuredTool({
    name: "check_expiring_drugs",
    description: `
Find all drugs expiring within a specified number of days.
Categorizes by urgency: critical (<7 days), warning (<30 days), notice (<90 days).

Use this for queries like:
- "What's expiring soon?"
- "Show expiring drugs"
- "Check expiry for next 30 days"
- "Expiring items report"
    `.trim(),
    schema: import_zod15.z.object({
      withinDays: import_zod15.z.number().int().min(1).max(365).optional().default(30).describe("Check expiry within this many days (default: 30)"),
      locationFilter: import_zod15.z.string().optional().describe("Filter by location (optional)")
    }),
    func: async ({ withinDays, locationFilter }) => {
      try {
        const expiringItems = await db.getExpiringItems(withinDays);
        let filtered = locationFilter ? expiringItems.filter(
          (item) => item.location.toLowerCase().includes(locationFilter.toLowerCase())
        ) : expiringItems;
        if (filtered.length === 0) {
          return JSON.stringify({
            found: false,
            withinDays,
            locationFilter,
            message: `No items expiring within ${withinDays} days${locationFilter ? ` at location "${locationFilter}"` : ""}`,
            alertLevel: "info"
          });
        }
        const enrichedItems = filtered.map((item) => ({
          ...item,
          daysUntilExpiry: item.daysRemaining,
          urgency: item.daysRemaining <= 7 ? "critical" : item.daysRemaining <= 30 ? "warning" : "notice",
          estimatedValue: 0
          // Pricing data not available in InventoryItem
        }));
        const critical = enrichedItems.filter((item) => item.urgency === "critical");
        const warning = enrichedItems.filter((item) => item.urgency === "warning");
        const notice = enrichedItems.filter((item) => item.urgency === "notice");
        const totalValue = enrichedItems.reduce((sum, item) => sum + item.estimatedValue, 0);
        const controlledItems = enrichedItems.filter(
          (item) => item.category === "controlled"
        );
        const alertLevel = critical.length > 0 ? "critical" : warning.length > 0 ? "warning" : "info";
        return JSON.stringify({
          found: true,
          withinDays,
          locationFilter,
          summary: {
            totalItems: enrichedItems.length,
            byUrgency: {
              critical: critical.length,
              warning: warning.length,
              notice: notice.length
            },
            controlledSubstances: controlledItems.length,
            totalValueAtRisk: totalValue.toFixed(2),
            uniqueDrugs: new Set(enrichedItems.map((i) => i.drugName)).size,
            affectedLocations: new Set(enrichedItems.map((i) => i.location)).size
          },
          alertLevel,
          alertMessage: critical.length > 0 ? `${critical.length} item(s) expire within 7 days - immediate action required` : warning.length > 0 ? `${warning.length} item(s) expire within 30 days` : `${notice.length} item(s) expiring within ${withinDays} days`,
          items: enrichedItems.slice(0, 50).map((item) => ({
            drugName: item.drugName,
            location: item.location,
            category: item.category,
            quantity: item.qtyOnHand,
            batchLot: item.batchLot,
            expiryDate: item.expiryDate,
            daysUntilExpiry: item.daysUntilExpiry,
            urgency: item.urgency,
            estimatedValue: item.estimatedValue.toFixed(2),
            recommendation: item.urgency === "critical" ? "Use immediately or return to supplier" : item.urgency === "warning" ? "Prioritize usage (FEFO protocol)" : "Monitor and plan usage"
          })).sort((a, b) => {
            const urgencyOrder = { critical: 0, warning: 1, notice: 2 };
            const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
            return urgencyDiff !== 0 ? urgencyDiff : a.daysUntilExpiry - b.daysUntilExpiry;
          }),
          controlledSubstances: controlledItems.length > 0 ? {
            count: controlledItems.length,
            items: controlledItems.map((item) => ({
              drugName: item.drugName,
              location: item.location,
              quantity: item.qtyOnHand,
              expiryDate: item.expiryDate,
              batchLot: item.batchLot
            })),
            warning: "Controlled substances require special disposal procedures"
          } : void 0,
          recommendations: [
            critical.length > 0 && `Immediately use or remove ${critical.length} critical item(s)`,
            warning.length > 0 && `Implement FEFO (First Expired, First Out) for ${warning.length} item(s)`,
            totalValue > 1e3 && `Total value at risk: $${totalValue.toFixed(2)} - consider supplier returns`,
            controlledItems.length > 0 && `${controlledItems.length} controlled substance(s) require audit trail for disposal`
          ].filter(Boolean),
          actions: ["view_fefo", "download_report", "contact_supplier", "schedule_disposal"],
          followUp: critical.length > 0 ? "Would you like FEFO recommendations for critical items?" : void 0,
          note: enrichedItems.length > 50 ? `Showing first 50 of ${enrichedItems.length} items. Download full report for complete list.` : void 0
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error checking expiring drugs: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
  });
}

// src/tools/expiry/getFefoRecommendations.ts
var import_tools15 = require("@langchain/core/tools");
var import_zod16 = require("zod");
function createGetFefoRecommendationsTool(db) {
  return new import_tools15.DynamicStructuredTool({
    name: "get_fefo_recommendations",
    description: `
Get FEFO (First Expiry First Out) recommendations for a specific drug or all drugs.
Returns prioritized usage order by expiry date across all locations.

Use this for ANY query about:
- FEFO order, recommendations, or prioritization
- Which batches to use first
- Usage order by expiry date
- Batch prioritization

Example queries:
- "FEFO recommendations for Propofol"
- "Give me FEFO order for Morphine"
- "Which batches of Midazolam should we use first?"
- "What's the usage order for expiring drugs?"
- "Show me batch priority for Fentanyl"
- "Batch prioritization for ICU drugs"
- "FEFO for all drugs"
    `.trim(),
    schema: import_zod16.z.object({
      drugName: import_zod16.z.string().optional().describe("Specific drug name (optional - if not provided, returns all drugs)"),
      locationFilter: import_zod16.z.string().optional().describe("Filter by location (optional)"),
      daysThreshold: import_zod16.z.number().int().min(1).max(180).optional().default(30).describe("Only include batches expiring within this many days (default: 30)")
    }),
    func: async ({ drugName, locationFilter, daysThreshold }) => {
      try {
        const inventory = await db.loadInventory();
        const expiringItems = await db.getExpiringItems(daysThreshold);
        const enrichedItems = expiringItems.map((item) => ({
          ...item,
          daysUntilExpiry: item.daysRemaining,
          urgency: item.daysRemaining <= 7 ? "critical" : item.daysRemaining <= 30 ? "warning" : "notice",
          estimatedValue: 0
          // Pricing data not available
        }));
        let items = enrichedItems;
        if (drugName) {
          items = items.filter(
            (item) => item.drugName.toLowerCase().includes(drugName.toLowerCase())
          );
        }
        if (locationFilter) {
          items = items.filter(
            (item) => item.location.toLowerCase().includes(locationFilter.toLowerCase())
          );
        }
        if (items.length === 0) {
          return JSON.stringify({
            found: false,
            drugName,
            locationFilter,
            daysThreshold,
            message: drugName ? `No batches of "${drugName}" expiring within ${daysThreshold} days` : `No items expiring within ${daysThreshold} days`,
            alertLevel: "info"
          });
        }
        const drugGroups = /* @__PURE__ */ new Map();
        for (const item of items) {
          const existing = drugGroups.get(item.drugName) || [];
          existing.push(item);
          drugGroups.set(item.drugName, existing);
        }
        const fefoRecommendations = Array.from(drugGroups.entries()).map(([drug, batches]) => {
          const sortedBatches = batches.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
          const totalQty = sortedBatches.reduce((sum, b) => sum + b.qtyOnHand, 0);
          const earliestExpiry = sortedBatches[0];
          const locations = new Set(sortedBatches.map((b) => b.location));
          return {
            drugName: drug,
            category: earliestExpiry.category,
            totalBatches: sortedBatches.length,
            totalQuantity: totalQty,
            locations: Array.from(locations),
            earliestExpiry: earliestExpiry.expiryDate,
            daysUntilEarliestExpiry: earliestExpiry.daysUntilExpiry,
            urgency: earliestExpiry.urgency,
            usageOrder: sortedBatches.map((batch, index) => ({
              priority: index + 1,
              location: batch.location,
              batchLot: batch.batchLot,
              quantity: batch.qtyOnHand,
              expiryDate: batch.expiryDate,
              daysRemaining: batch.daysUntilExpiry,
              urgency: batch.urgency,
              action: batch.urgency === "critical" ? "USE IMMEDIATELY - Expires in <7 days" : batch.urgency === "warning" ? "USE NEXT - Expires in <30 days" : "MONITOR - Use after higher priority batches",
              estimatedValue: batch.estimatedValue.toFixed(2)
            })),
            recommendation: earliestExpiry.urgency === "critical" ? `URGENT: Use ${earliestExpiry.location} batch first - expires in ${earliestExpiry.daysUntilExpiry} days` : earliestExpiry.urgency === "warning" ? `Prioritize ${earliestExpiry.location} batch - expires in ${earliestExpiry.daysUntilExpiry} days` : `Standard rotation - ${sortedBatches.length} batch(es) available`
          };
        });
        const urgencyOrder = { critical: 0, warning: 1, notice: 2 };
        fefoRecommendations.sort((a, b) => {
          const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
          return urgencyDiff !== 0 ? urgencyDiff : a.daysUntilEarliestExpiry - b.daysUntilEarliestExpiry;
        });
        const criticalDrugs = fefoRecommendations.filter((r) => r.urgency === "critical");
        const warningDrugs = fefoRecommendations.filter((r) => r.urgency === "warning");
        const totalValue = items.reduce((sum, item) => sum + item.estimatedValue, 0);
        const controlledDrugs = fefoRecommendations.filter((r) => r.category === "controlled");
        const alertLevel = criticalDrugs.length > 0 ? "critical" : warningDrugs.length > 0 ? "warning" : "info";
        return JSON.stringify({
          found: true,
          drugName,
          locationFilter,
          daysThreshold,
          summary: {
            totalDrugs: fefoRecommendations.length,
            totalBatches: items.length,
            byUrgency: {
              critical: criticalDrugs.length,
              warning: warningDrugs.length,
              notice: fefoRecommendations.length - criticalDrugs.length - warningDrugs.length
            },
            controlledSubstances: controlledDrugs.length,
            totalValueAtRisk: totalValue.toFixed(2),
            locationsAffected: new Set(items.map((i) => i.location)).size
          },
          alertLevel,
          alertMessage: criticalDrugs.length > 0 ? `${criticalDrugs.length} drug(s) have batches expiring within 7 days - immediate FEFO action required` : warningDrugs.length > 0 ? `${warningDrugs.length} drug(s) need FEFO prioritization (expiring <30 days)` : `FEFO recommendations for ${fefoRecommendations.length} drug(s)`,
          recommendations: fefoRecommendations.slice(0, 20),
          guidelines: [
            "Always dispense from the earliest expiring batch first (FEFO protocol)",
            "Check batch numbers on physical containers before dispensing",
            "Document batch usage for traceability",
            "Transfer high-priority batches to high-use locations if needed",
            criticalDrugs.length > 0 && "Critical items require immediate action to prevent waste",
            controlledDrugs.length > 0 && `${controlledDrugs.length} controlled substance(s) require audit trail`
          ].filter(Boolean),
          actions: ["print_labels", "transfer_batches", "contact_supplier", "schedule_audit"],
          followUp: criticalDrugs.length > 0 ? `${criticalDrugs.length} drug(s) need immediate attention. Would you like to see detailed expiry report?` : void 0,
          note: fefoRecommendations.length > 20 ? `Showing top 20 of ${fefoRecommendations.length} drugs. Contact for full report.` : "All FEFO recommendations displayed."
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error generating FEFO recommendations: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
  });
}

// src/tools/expiry/getBatchReport.ts
var import_tools16 = require("@langchain/core/tools");
var import_zod17 = require("zod");
function createGetBatchReportTool(db) {
  return new import_tools16.DynamicStructuredTool({
    name: "get_batch_report",
    description: `
Generate comprehensive batch traceability report.
Useful for audit compliance, quality control, and batch recall scenarios.

Use this for queries like:
- "Show me all batches of Propofol"
- "Batch report for LOT-12345"
- "Which drugs are in batch ABC123?"
- "Batch traceability report"
    `.trim(),
    schema: import_zod17.z.object({
      batchLot: import_zod17.z.string().optional().describe("Specific batch/lot number to search (optional)"),
      drugName: import_zod17.z.string().optional().describe("Specific drug name to filter (optional)"),
      locationFilter: import_zod17.z.string().optional().describe("Filter by location (optional)"),
      includeExpired: import_zod17.z.boolean().optional().default(false).describe("Include expired batches in report (default: false)")
    }),
    func: async ({ batchLot, drugName, locationFilter, includeExpired }) => {
      try {
        const rawInventory = await db.loadInventory();
        let items = rawInventory.map((item) => enrichInventoryItem(item));
        if (batchLot) {
          items = items.filter(
            (item) => item.batchLot.toLowerCase().includes(batchLot.toLowerCase())
          );
        }
        if (drugName) {
          items = items.filter(
            (item) => item.drugName.toLowerCase().includes(drugName.toLowerCase())
          );
        }
        if (locationFilter) {
          items = items.filter(
            (item) => item.location.toLowerCase().includes(locationFilter.toLowerCase())
          );
        }
        const enrichedItems = items.map((item) => {
          const expiryDate = new Date(item.expiryDate);
          const today = /* @__PURE__ */ new Date();
          const daysRemaining = Math.ceil((expiryDate.getTime() - today.getTime()) / (1e3 * 60 * 60 * 24));
          const isExpired = daysRemaining < 0;
          const urgency = isExpired ? "expired" : daysRemaining <= 7 ? "critical" : daysRemaining <= 30 ? "warning" : "notice";
          return {
            ...item,
            daysRemaining,
            isExpired,
            urgency,
            estimatedValue: item.qtyOnHand * 10
            // Simplified value estimation
          };
        });
        const filteredItems = includeExpired ? enrichedItems : enrichedItems.filter((item) => !item.isExpired);
        if (filteredItems.length === 0) {
          return JSON.stringify({
            found: false,
            batchLot,
            drugName,
            locationFilter,
            includeExpired,
            message: "No batches found matching the criteria",
            alertLevel: "info"
          });
        }
        const batchGroups = /* @__PURE__ */ new Map();
        for (const item of filteredItems) {
          const existing = batchGroups.get(item.batchLot) || [];
          existing.push(item);
          batchGroups.set(item.batchLot, existing);
        }
        const batchSummaries = Array.from(batchGroups.entries()).map(([lot, items2]) => {
          const totalQty = items2.reduce((sum, item) => sum + item.qtyOnHand, 0);
          const totalValue2 = items2.reduce((sum, item) => sum + item.estimatedValue, 0);
          const locations = new Set(items2.map((item) => item.location));
          const drugs = new Set(items2.map((item) => item.drugName));
          const earliestExpiry = items2.reduce(
            (min, item) => item.daysRemaining < min.daysRemaining ? item : min
          );
          return {
            batchLot: lot,
            drugs: Array.from(drugs),
            drugCount: drugs.size,
            locations: Array.from(locations),
            locationCount: locations.size,
            totalQuantity: totalQty,
            totalValue: totalValue2.toFixed(2),
            expiryDate: earliestExpiry.expiryDate,
            daysUntilExpiry: earliestExpiry.daysRemaining,
            urgency: earliestExpiry.urgency,
            isExpired: earliestExpiry.isExpired,
            distribution: items2.map((item) => ({
              drugName: item.drugName,
              location: item.location,
              quantity: item.qtyOnHand,
              category: item.category,
              expiryDate: item.expiryDate,
              daysRemaining: item.daysRemaining
            })),
            status: earliestExpiry.isExpired ? "EXPIRED - Immediate disposal required" : earliestExpiry.urgency === "critical" ? "CRITICAL - Expires within 7 days" : earliestExpiry.urgency === "warning" ? "WARNING - Expires within 30 days" : "ACTIVE - Standard rotation",
            recommendation: earliestExpiry.isExpired ? "Remove from inventory and follow disposal protocol" : earliestExpiry.urgency === "critical" ? "Prioritize usage immediately or contact supplier for return" : earliestExpiry.urgency === "warning" ? "Implement FEFO protocol for this batch" : "Continue standard inventory rotation"
          };
        });
        const urgencyOrder = { expired: 0, critical: 1, warning: 2, notice: 3 };
        batchSummaries.sort((a, b) => {
          const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
          return urgencyDiff !== 0 ? urgencyDiff : a.daysUntilExpiry - b.daysUntilExpiry;
        });
        const expiredBatches = batchSummaries.filter((b) => b.isExpired);
        const criticalBatches = batchSummaries.filter((b) => b.urgency === "critical" && !b.isExpired);
        const warningBatches = batchSummaries.filter((b) => b.urgency === "warning");
        const totalValue = batchSummaries.reduce((sum, b) => sum + parseFloat(b.totalValue), 0);
        const controlledBatches = batchSummaries.filter(
          (b) => b.distribution.some((d) => d.category === "controlled")
        );
        const alertLevel = expiredBatches.length > 0 || criticalBatches.length > 0 ? "critical" : warningBatches.length > 0 ? "warning" : "info";
        return JSON.stringify({
          found: true,
          batchLot,
          drugName,
          locationFilter,
          includeExpired,
          summary: {
            totalBatches: batchSummaries.length,
            uniqueDrugs: new Set(filteredItems.map((i) => i.drugName)).size,
            locationsAffected: new Set(filteredItems.map((i) => i.location)).size,
            totalItems: filteredItems.length,
            totalQuantity: filteredItems.reduce((sum, item) => sum + item.qtyOnHand, 0),
            totalValue: totalValue.toFixed(2),
            byStatus: {
              expired: expiredBatches.length,
              critical: criticalBatches.length,
              warning: warningBatches.length,
              normal: batchSummaries.length - expiredBatches.length - criticalBatches.length - warningBatches.length
            },
            controlledSubstances: controlledBatches.length
          },
          alertLevel,
          alertMessage: expiredBatches.length > 0 ? `${expiredBatches.length} batch(es) expired - disposal required` : criticalBatches.length > 0 ? `${criticalBatches.length} batch(es) expire within 7 days` : warningBatches.length > 0 ? `${warningBatches.length} batch(es) expire within 30 days` : "All batches within normal rotation",
          batches: batchSummaries.slice(0, 50),
          traceability: {
            reportGenerated: (/* @__PURE__ */ new Date()).toISOString(),
            searchCriteria: { batchLot, drugName, locationFilter, includeExpired },
            auditNote: "Batch traceability maintained for regulatory compliance"
          },
          recommendations: [
            expiredBatches.length > 0 && `Remove ${expiredBatches.length} expired batch(es) from inventory`,
            criticalBatches.length > 0 && `Urgent: ${criticalBatches.length} batch(es) expire within 7 days`,
            controlledBatches.length > 0 && `${controlledBatches.length} controlled substance batch(es) require special handling`,
            totalValue > 5e3 && `High value at risk ($${totalValue.toFixed(2)}) - consider supplier returns`
          ].filter(Boolean),
          actions: ["print_report", "export_csv", "contact_supplier", "schedule_disposal"],
          note: batchSummaries.length > 50 ? `Showing first 50 of ${batchSummaries.length} batches. Export full report for complete data.` : "Complete batch report displayed."
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error generating batch report: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
  });
}

// src/tools/expiry/getExpiredItemsReport.ts
var import_tools17 = require("@langchain/core/tools");
var import_zod18 = require("zod");
function createGetExpiredItemsReportTool(db) {
  return new import_tools17.DynamicStructuredTool({
    name: "get_expired_items_report",
    description: `
Generate report of all currently expired items requiring disposal.
Includes disposal recommendations and value calculations.

Use this for queries like:
- "Show expired items"
- "What needs disposal?"
- "Expired drugs report"
- "Items past expiry date"
    `.trim(),
    schema: import_zod18.z.object({
      locationFilter: import_zod18.z.string().optional().describe("Filter by location (optional)"),
      categoryFilter: import_zod18.z.string().optional().describe("Filter by category: controlled, refrigerated, standard (optional)")
    }),
    func: async ({ locationFilter, categoryFilter }) => {
      try {
        const rawExpiredItems = await db.getExpiredItems();
        const expiredItems = rawExpiredItems.map((item) => ({
          ...item,
          estimatedValue: 0
          // Pricing data not available
        }));
        let filteredItems = expiredItems;
        if (locationFilter) {
          filteredItems = expiredItems.filter(
            (item) => item.location.toLowerCase().includes(locationFilter.toLowerCase())
          );
        }
        if (categoryFilter) {
          filteredItems = filteredItems.filter(
            (item) => item.category.toLowerCase() === categoryFilter.toLowerCase()
          );
        }
        if (filteredItems.length === 0) {
          return JSON.stringify({
            found: false,
            locationFilter,
            categoryFilter,
            message: "No expired items found",
            alertLevel: "info",
            note: "All inventory within expiry date - excellent management!"
          });
        }
        const drugGroups = /* @__PURE__ */ new Map();
        for (const item of filteredItems) {
          const existing = drugGroups.get(item.drugName) || [];
          existing.push(item);
          drugGroups.set(item.drugName, existing);
        }
        const drugSummaries = Array.from(drugGroups.entries()).map(([drug, items]) => {
          const totalQty2 = items.reduce((sum, item) => sum + item.qtyOnHand, 0);
          const totalValue2 = items.reduce((sum, item) => sum + item.estimatedValue, 0);
          const locations2 = new Set(items.map((item) => item.location));
          const batches = new Set(items.map((item) => item.batchLot));
          const category = items[0].category;
          const maxDaysExpired = Math.max(...items.map((item) => Math.abs(item.daysRemaining)));
          return {
            drugName: drug,
            category,
            totalQuantity: totalQty2,
            totalBatches: batches.size,
            locations: Array.from(locations2),
            totalValue: totalValue2.toFixed(2),
            maxDaysExpired,
            batches: items.map((item) => ({
              location: item.location,
              batchLot: item.batchLot,
              quantity: item.qtyOnHand,
              expiryDate: item.expiryDate,
              daysExpired: Math.abs(item.daysRemaining),
              estimatedValue: item.estimatedValue.toFixed(2)
            })).sort((a, b) => b.daysExpired - a.daysExpired),
            disposalPriority: category === "controlled" ? "HIGH" : maxDaysExpired > 90 ? "HIGH" : maxDaysExpired > 30 ? "MEDIUM" : "STANDARD",
            disposalMethod: category === "controlled" ? "Controlled substance disposal protocol with audit trail" : category === "refrigerated" ? "Biohazard disposal following cold chain protocols" : "Standard pharmaceutical waste disposal",
            recommendation: category === "controlled" ? `URGENT: Controlled substance requires witnessed disposal and documentation` : maxDaysExpired > 90 ? `Long expired (${maxDaysExpired} days) - immediate removal required` : `Standard disposal protocol - remove from active inventory`
          };
        });
        const priorityOrder = { HIGH: 0, MEDIUM: 1, STANDARD: 2 };
        drugSummaries.sort((a, b) => {
          const priorityDiff = priorityOrder[a.disposalPriority] - priorityOrder[b.disposalPriority];
          return priorityDiff !== 0 ? priorityDiff : b.maxDaysExpired - a.maxDaysExpired;
        });
        const totalValue = drugSummaries.reduce((sum, d) => sum + parseFloat(d.totalValue), 0);
        const totalQty = drugSummaries.reduce((sum, d) => sum + d.totalQuantity, 0);
        const controlledItems = drugSummaries.filter((d) => d.category === "controlled");
        const highPriority = drugSummaries.filter((d) => d.disposalPriority === "HIGH");
        const locations = new Set(filteredItems.map((i) => i.location));
        return JSON.stringify({
          found: true,
          locationFilter,
          categoryFilter,
          summary: {
            totalDrugs: drugSummaries.length,
            totalBatches: filteredItems.length,
            totalQuantity: totalQty,
            totalValueLoss: totalValue.toFixed(2),
            locationsAffected: locations.size,
            byPriority: {
              high: drugSummaries.filter((d) => d.disposalPriority === "HIGH").length,
              medium: drugSummaries.filter((d) => d.disposalPriority === "MEDIUM").length,
              standard: drugSummaries.filter((d) => d.disposalPriority === "STANDARD").length
            },
            byCategory: {
              controlled: controlledItems.length,
              refrigerated: drugSummaries.filter((d) => d.category === "refrigerated").length,
              standard: drugSummaries.filter((d) => d.category === "standard").length
            }
          },
          alertLevel: "critical",
          alertMessage: `${drugSummaries.length} drug(s) with ${filteredItems.length} expired batch(es) requiring disposal`,
          expiredDrugs: drugSummaries.slice(0, 50),
          disposalChecklist: [
            {
              step: 1,
              action: "Segregate expired items from active inventory",
              note: "Physical separation prevents accidental dispensing"
            },
            {
              step: 2,
              action: "Document all items in disposal log",
              note: "Required for regulatory compliance and audit trail"
            },
            {
              step: 3,
              action: controlledItems.length > 0 ? `Special handling: ${controlledItems.length} controlled substance(s) require witnessed disposal` : "Standard pharmaceutical waste protocol",
              note: controlledItems.length > 0 ? "DEA/regulatory compliance required" : "Follow institutional waste management procedures"
            },
            {
              step: 4,
              action: "Update inventory system to remove disposed items",
              note: "Maintain accurate stock levels"
            },
            {
              step: 5,
              action: "Review procurement to prevent future waste",
              note: `Financial loss: $${totalValue.toFixed(2)} - analyze ordering patterns`
            }
          ],
          controlledSubstances: controlledItems.length > 0 ? {
            count: controlledItems.length,
            totalQuantity: controlledItems.reduce((sum, d) => sum + d.totalQuantity, 0),
            drugs: controlledItems.map((d) => ({
              drugName: d.drugName,
              quantity: d.totalQuantity,
              batches: d.totalBatches,
              locations: d.locations,
              value: d.totalValue
            })),
            warning: "CONTROLLED SUBSTANCES: Require witnessed disposal, documentation, and regulatory reporting",
            action: "Contact pharmacy supervisor and compliance officer before disposal"
          } : void 0,
          financialImpact: {
            totalLoss: totalValue.toFixed(2),
            breakdown: drugSummaries.map((d) => ({
              drugName: d.drugName,
              value: d.totalValue,
              quantity: d.totalQuantity
            })),
            recommendation: totalValue > 1e3 ? "Significant financial loss detected - review safety stock levels and reorder points" : "Standard waste levels - continue current practices"
          },
          recommendations: [
            highPriority.length > 0 && `URGENT: ${highPriority.length} item(s) require immediate disposal`,
            controlledItems.length > 0 && `Contact compliance officer for ${controlledItems.length} controlled substance(s)`,
            totalValue > 1e3 && `High value loss ($${totalValue.toFixed(2)}) - review procurement practices`,
            "Implement FEFO (First Expiry First Out) protocol to prevent future waste",
            "Review safety stock levels for frequently expiring items",
            "Consider supplier agreements for near-expiry returns"
          ].filter(Boolean),
          actions: ["print_disposal_log", "schedule_disposal", "contact_compliance", "update_inventory", "analyze_causes"],
          note: drugSummaries.length > 50 ? `Showing first 50 of ${drugSummaries.length} drugs. Export full report for complete disposal documentation.` : "Complete expired items report displayed.",
          reportDate: (/* @__PURE__ */ new Date()).toISOString()
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error generating expired items report: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
  });
}

// src/tools/analytics/getTopMoversReport.ts
var import_tools18 = require("@langchain/core/tools");
var import_zod19 = require("zod");
function createGetTopMoversReportTool(db) {
  return new import_tools18.DynamicStructuredTool({
    name: "get_top_movers_report",
    description: `
Generate report of most frequently used drugs (top movers).
Useful for procurement planning, forecasting, and inventory optimization.

Use this for queries like:
- "What are our top drugs?"
- "Most used medications"
- "High volume drugs report"
- "Top 10 movers"
    `.trim(),
    schema: import_zod19.z.object({
      days: import_zod19.z.number().int().min(1).max(365).optional().default(30).describe("Period to analyze in days (default: 30)"),
      month: import_zod19.z.string().optional().describe('Specific month to analyze (e.g., "December 2025", "last month", "current month") - overrides days parameter'),
      topN: import_zod19.z.number().int().min(1).max(50).optional().default(10).describe("Number of top drugs to return (default: 10)"),
      locationFilter: import_zod19.z.string().optional().describe("Filter by location (optional)")
    }),
    func: async ({ days, month, topN, locationFilter }) => {
      try {
        let startDate;
        let endDate;
        let periodLabel;
        if (month) {
          const now = /* @__PURE__ */ new Date();
          const monthLower = month.toLowerCase();
          if (monthLower === "current month" || monthLower === "this month") {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            periodLabel = `${startDate.toLocaleString("default", { month: "long" })} ${startDate.getFullYear()}`;
          } else if (monthLower === "last month" || monthLower === "previous month") {
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), 0);
            periodLabel = `${startDate.toLocaleString("default", { month: "long" })} ${startDate.getFullYear()}`;
          } else {
            const monthNames = [
              "january",
              "february",
              "march",
              "april",
              "may",
              "june",
              "july",
              "august",
              "september",
              "october",
              "november",
              "december"
            ];
            const parts = month.split(" ");
            const monthName = parts[0].toLowerCase();
            const yearStr = parts[1];
            const monthIndex = monthNames.findIndex((m) => m.startsWith(monthName.substring(0, 3)));
            const year = yearStr ? parseInt(yearStr) : now.getFullYear();
            if (monthIndex !== -1) {
              startDate = new Date(year, monthIndex, 1);
              endDate = new Date(year, monthIndex + 1, 0);
              periodLabel = `${startDate.toLocaleString("default", { month: "long" })} ${year}`;
            } else {
              startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1e3);
              endDate = now;
              periodLabel = `Last ${days} days`;
            }
          }
        } else {
          const now = /* @__PURE__ */ new Date();
          startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1e3);
          endDate = now;
          periodLabel = `Last ${days} days`;
        }
        const allTransactions = await db.loadTransactions(365);
        const transactions = allTransactions.filter((txn) => {
          const txnDate = new Date(txn.timestamp);
          return txnDate >= startDate && txnDate <= endDate;
        });
        const actualDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1e3 * 60 * 60 * 24));
        const rawInventory = await db.loadInventory();
        const inventory = rawInventory.map((item) => enrichInventoryItem(item));
        let relevantTransactions = transactions;
        if (locationFilter) {
          const locationDrugIds = inventory.filter((item) => item.location.toLowerCase().includes(locationFilter.toLowerCase())).map((item) => item.drugId);
          relevantTransactions = transactions.filter((t) => locationDrugIds.includes(t.drugId));
        }
        const drugUsage = /* @__PURE__ */ new Map();
        for (const txn of relevantTransactions) {
          const invItem = inventory.find((item) => item.drugId === txn.drugId);
          if (!invItem) continue;
          const existing = drugUsage.get(txn.drugId) || {
            drugId: txn.drugId,
            drugName: invItem.drugName,
            totalUsed: 0,
            totalReceived: 0,
            transactionCount: 0,
            useTransactions: 0,
            locations: /* @__PURE__ */ new Set()
          };
          existing.transactionCount++;
          existing.locations.add(invItem.location);
          if (txn.action === "USE") {
            existing.totalUsed += Math.abs(txn.qtyChange);
            existing.useTransactions++;
          } else if (txn.action === "RECEIVE") {
            existing.totalReceived += txn.qtyChange;
          }
          drugUsage.set(txn.drugId, existing);
        }
        if (drugUsage.size === 0) {
          return JSON.stringify({
            found: false,
            days,
            topN,
            locationFilter,
            message: `No usage transactions found in the last ${days} days`,
            alertLevel: "info"
          });
        }
        const drugMetrics = Array.from(drugUsage.values()).map((drug) => {
          const currentStock = inventory.filter((item) => item.drugId === drug.drugId).reduce((sum, item) => sum + item.qtyOnHand, 0);
          const avgDailyUsage = drug.totalUsed / actualDays;
          const daysOfStock = avgDailyUsage > 0 ? currentStock / avgDailyUsage : null;
          const turnoverRate = currentStock > 0 ? (drug.totalUsed / currentStock).toFixed(2) : "N/A";
          const invItems = inventory.filter((item) => item.drugId === drug.drugId);
          const safetyStock = Math.max(...invItems.map((item) => item.safetyStock));
          const stockStatus = currentStock === 0 ? "stockout" : currentStock < safetyStock ? "low" : "adequate";
          return {
            drugName: drug.drugName,
            category: invItems[0] && invItems[0].category || "unknown",
            totalUsed: drug.totalUsed,
            totalReceived: drug.totalReceived,
            netChange: drug.totalUsed - drug.totalReceived,
            transactionCount: drug.transactionCount,
            useTransactions: drug.useTransactions,
            avgDailyUsage: avgDailyUsage.toFixed(2),
            currentStock,
            daysOfStockRemaining: daysOfStock !== null ? Math.round(daysOfStock) : null,
            turnoverRate,
            stockStatus,
            locationsUsed: Array.from(drug.locations),
            locationCount: drug.locations.size,
            usageIntensity: drug.totalUsed / actualDays
            // For sorting
          };
        });
        drugMetrics.sort((a, b) => b.totalUsed - a.totalUsed);
        const topMovers = drugMetrics.slice(0, topN);
        const controlledInTop = topMovers.filter((d) => d.category === "controlled");
        const stockoutInTop = topMovers.filter((d) => d.stockStatus === "stockout");
        const lowStockInTop = topMovers.filter((d) => d.stockStatus === "low");
        const totalUsage = topMovers.reduce((sum, d) => sum + d.totalUsed, 0);
        const totalTransactions = topMovers.reduce((sum, d) => sum + d.transactionCount, 0);
        const avgTurnover = topMovers.filter((d) => d.turnoverRate !== "N/A").reduce((sum, d, _, arr) => sum + parseFloat(d.turnoverRate) / arr.length, 0);
        const highValueDrugs = topMovers.filter((_, i) => i < Math.ceil(topMovers.length * 0.2));
        const highValueTotal = highValueDrugs.reduce((sum, d) => sum + d.totalUsed, 0);
        const highValuePercentage = totalUsage > 0 ? (highValueTotal / totalUsage * 100).toFixed(1) : "0";
        const alertLevel = stockoutInTop.length > 0 ? "critical" : lowStockInTop.length > 0 ? "warning" : "info";
        return JSON.stringify({
          found: true,
          days,
          topN,
          locationFilter,
          summary: {
            reportPeriod: periodLabel,
            topDrugsAnalyzed: topMovers.length,
            totalDrugsWithActivity: drugMetrics.length,
            totalUsageVolume: totalUsage,
            totalTransactions,
            avgDailyTransactions: (totalTransactions / actualDays).toFixed(1),
            avgTurnoverRate: avgTurnover.toFixed(2),
            abcAnalysis: `TIER 1: Top 20% of drugs (${highValueDrugs.length} items) represent ${highValuePercentage}% of total usage`,
            byStockStatus: {
              stockout: stockoutInTop.length,
              low: lowStockInTop.length,
              adequate: topMovers.length - stockoutInTop.length - lowStockInTop.length
            },
            controlledSubstances: controlledInTop.length
          },
          alertLevel,
          alertMessage: stockoutInTop.length > 0 ? `${stockoutInTop.length} top mover(s) currently out of stock - urgent reorder needed` : lowStockInTop.length > 0 ? `${lowStockInTop.length} top mover(s) below safety stock` : `Top ${topMovers.length} drugs by usage volume`,
          topMovers: topMovers.map((drug, index) => ({
            rank: index + 1,
            drugName: drug.drugName,
            totalUsed: drug.totalUsed,
            avgDailyUsage: drug.avgDailyUsage,
            transactionCount: drug.transactionCount,
            currentStock: drug.currentStock,
            daysOfStockRemaining: drug.daysOfStockRemaining !== null ? Math.round(drug.daysOfStockRemaining) : "N/A",
            stockStatus: drug.stockStatus,
            trend: drug.netChange > 0 ? "INCREASING" : drug.netChange < 0 ? "DECREASING" : "STABLE",
            urgency: drug.stockStatus === "stockout" ? "CRITICAL" : drug.stockStatus === "low" && drug.daysOfStockRemaining !== null && drug.daysOfStockRemaining < 7 ? "HIGH" : drug.stockStatus === "low" ? "MEDIUM" : "NORMAL"
          })),
          insights: [
            {
              title: "Highest Volume Drug",
              data: `${topMovers[0].drugName} - ${topMovers[0].totalUsed} units used (${topMovers[0].avgDailyUsage} units/day)`,
              recommendation: topMovers[0].stockStatus !== "adequate" ? "Increase safety stock levels for this high-demand drug" : "Maintain current stock levels"
            },
            {
              title: "Fastest Turnover",
              data: (() => {
                const fastest = topMovers.filter((d) => d.turnoverRate !== "N/A").sort((a, b) => parseFloat(b.turnoverRate) - parseFloat(a.turnoverRate))[0];
                return fastest ? `${fastest.drugName} - ${fastest.turnoverRate}x turnover` : "N/A";
              })(),
              recommendation: "High turnover drugs need frequent monitoring and reordering"
            },
            {
              title: "Multi-Location Demand",
              data: (() => {
                const multiLoc = topMovers.filter((d) => d.locationCount > 1);
                return multiLoc.length > 0 ? `${multiLoc.length} drug(s) used across multiple locations` : "All drugs used in single locations";
              })(),
              recommendation: "Consider centralized stock with transfer protocols for multi-location drugs"
            }
          ],
          recommendations: [
            stockoutInTop.length > 0 && `URGENT: Reorder ${stockoutInTop.length} out-of-stock top mover(s) immediately`,
            lowStockInTop.length > 0 && `Increase safety stock for ${lowStockInTop.length} high-use drug(s) below threshold`,
            controlledInTop.length > 0 && `${controlledInTop.length} controlled substance(s) in top movers - ensure compliance monitoring`,
            "Optimize reorder points for top movers to prevent stockouts",
            "Consider bulk purchasing agreements for highest volume drugs",
            "Review storage locations to ensure top movers are easily accessible"
          ].filter(Boolean),
          actions: ["export_to_excel", "generate_reorder_list", "update_par_levels", "schedule_review"],
          note: `Report covers ${days}-day period${locationFilter ? ` for location: ${locationFilter}` : " (all locations)"}. Top movers represent highest usage volume.`,
          reportDate: (/* @__PURE__ */ new Date()).toISOString()
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error generating top movers report: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
  });
}

// src/tools/analytics/getSlowMoversReport.ts
var import_tools19 = require("@langchain/core/tools");
var import_zod20 = require("zod");
function createGetSlowMoversReportTool(db) {
  return new import_tools19.DynamicStructuredTool({
    name: "get_slow_movers_report",
    description: `
Generate report of drugs with minimal or no usage (slow movers).
Identifies inventory optimization opportunities and overstock situations.

Use this for queries like:
- "Show slow moving drugs"
- "What's not being used?"
- "Identify overstock items"
- "Low turnover drugs"
    `.trim(),
    schema: import_zod20.z.object({
      days: import_zod20.z.number().int().min(1).max(365).optional().default(90).describe("Period to analyze in days (default: 90)"),
      month: import_zod20.z.string().optional().describe('Specific month to analyze (e.g., "December 2025", "last month", "current month") - overrides days parameter'),
      percentile: import_zod20.z.number().min(1).max(50).optional().default(20).describe("TIER 1: Bottom percentile to classify as slow (default: 20% = bottom 20%)"),
      includeZeroUsage: import_zod20.z.boolean().optional().default(true).describe("Include drugs with zero usage (default: true)"),
      locationFilter: import_zod20.z.string().optional().describe("Filter by location (optional)")
    }),
    func: async ({ days, month, percentile, includeZeroUsage, locationFilter }) => {
      try {
        let startDate;
        let endDate;
        let periodLabel;
        if (month) {
          const now = /* @__PURE__ */ new Date();
          const monthLower = month.toLowerCase();
          if (monthLower === "current month" || monthLower === "this month") {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            periodLabel = `${startDate.toLocaleString("default", { month: "long" })} ${startDate.getFullYear()}`;
          } else if (monthLower === "last month" || monthLower === "previous month") {
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), 0);
            periodLabel = `${startDate.toLocaleString("default", { month: "long" })} ${startDate.getFullYear()}`;
          } else {
            const monthNames = [
              "january",
              "february",
              "march",
              "april",
              "may",
              "june",
              "july",
              "august",
              "september",
              "october",
              "november",
              "december"
            ];
            const parts = month.split(" ");
            const monthName = parts[0].toLowerCase();
            const yearStr = parts[1];
            const monthIndex = monthNames.findIndex((m) => m.startsWith(monthName.substring(0, 3)));
            const year = yearStr ? parseInt(yearStr) : now.getFullYear();
            if (monthIndex !== -1) {
              startDate = new Date(year, monthIndex, 1);
              endDate = new Date(year, monthIndex + 1, 0);
              periodLabel = `${startDate.toLocaleString("default", { month: "long" })} ${year}`;
            } else {
              startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1e3);
              endDate = now;
              periodLabel = `Last ${days} days`;
            }
          }
        } else {
          const now = /* @__PURE__ */ new Date();
          startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1e3);
          endDate = now;
          periodLabel = `Last ${days} days`;
        }
        const allTransactions = await db.loadTransactions(365);
        const transactions = allTransactions.filter((txn) => {
          const txnDate = new Date(txn.timestamp);
          return txnDate >= startDate && txnDate <= endDate;
        });
        const actualDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1e3 * 60 * 60 * 24));
        const rawInventory = await db.loadInventory();
        const inventory = rawInventory.map((item) => enrichInventoryItem(item));
        let relevantInventory = inventory;
        if (locationFilter) {
          relevantInventory = inventory.filter(
            (item) => item.location.toLowerCase().includes(locationFilter.toLowerCase())
          );
        }
        const drugUsage = /* @__PURE__ */ new Map();
        for (const txn of transactions) {
          const existing = drugUsage.get(txn.drugId) || {
            totalUsed: 0,
            transactionCount: 0
          };
          if (txn.action === "USE") {
            existing.totalUsed += Math.abs(txn.qtyChange);
            existing.transactionCount++;
          }
          drugUsage.set(txn.drugId, existing);
        }
        const slowMovers = relevantInventory.filter((item) => item.qtyOnHand > 0).map((item) => {
          const usage = drugUsage.get(item.drugId);
          const totalUsed = usage && usage.totalUsed || 0;
          const transactionCount = usage && usage.transactionCount || 0;
          const avgDailyUsage = totalUsed / actualDays;
          const daysOfStock = avgDailyUsage > 0 ? Math.round(item.qtyOnHand / avgDailyUsage) : null;
          const estimatedUnitPrice = item.category === "controlled" ? 50 : item.category === "refrigerated" ? 30 : 10;
          const estimatedValue = item.qtyOnHand * estimatedUnitPrice;
          const expiryDate = new Date(item.expiryDate);
          const today = /* @__PURE__ */ new Date();
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1e3 * 60 * 60 * 24));
          const isExpiringSoon = daysUntilExpiry < 90;
          const hasHighValue = estimatedValue > 500;
          const isOverstocked = daysOfStock !== null && daysOfStock > 180;
          const riskLevel = isExpiringSoon && totalUsed === 0 ? "HIGH" : (isExpiringSoon || hasHighValue) && totalUsed < 2 ? "MEDIUM" : "LOW";
          return {
            drugId: item.drugId,
            drugName: item.drugName,
            category: item.category,
            location: item.location,
            qtyOnHand: item.qtyOnHand,
            totalUsed,
            transactionCount,
            avgDailyUsage: avgDailyUsage.toFixed(3),
            daysOfStock,
            estimatedValue: estimatedValue.toFixed(2),
            expiryDate: item.expiryDate,
            daysUntilExpiry,
            isExpiringSoon,
            riskLevel,
            turnoverRate: item.qtyOnHand > 0 ? (totalUsed / item.qtyOnHand).toFixed(3) : "0"
          };
        });
        const usageValues = slowMovers.map((drug) => drug.totalUsed).sort((a, b) => a - b);
        const thresholdIndex = Math.floor(usageValues.length * (percentile / 100));
        const maxUsageThreshold = usageValues[thresholdIndex] || 0;
        let filteredSlowMovers = slowMovers.filter(
          (drug) => drug.totalUsed <= maxUsageThreshold
        );
        if (!includeZeroUsage) {
          filteredSlowMovers = filteredSlowMovers.filter((drug) => drug.totalUsed > 0);
        }
        filteredSlowMovers.sort((a, b) => {
          if (a.totalUsed !== b.totalUsed) {
            return a.totalUsed - b.totalUsed;
          }
          return b.qtyOnHand - a.qtyOnHand;
        });
        if (filteredSlowMovers.length === 0) {
          return JSON.stringify({
            found: false,
            days,
            percentile,
            calculatedThreshold: maxUsageThreshold,
            locationFilter,
            message: `No slow moving drugs found in bottom ${percentile}% - excellent inventory turnover!`,
            alertLevel: "info"
          });
        }
        const zeroUsage = filteredSlowMovers.filter((d) => d.totalUsed === 0);
        const highStock = filteredSlowMovers.filter((d) => d.daysOfStock !== null && d.daysOfStock > 180);
        const alertLevel = zeroUsage.length > 5 ? "warning" : "info";
        return JSON.stringify({
          found: true,
          days,
          percentile,
          calculatedThreshold: maxUsageThreshold,
          thresholdNote: `TIER 1: Data-driven threshold - bottom ${percentile}% of drugs (\u2264${maxUsageThreshold} units used)`,
          includeZeroUsage,
          locationFilter,
          summary: {
            totalSlowMovers: filteredSlowMovers.length,
            totalInventoryItems: slowMovers.length,
            zeroUsageDrugs: zeroUsage.length,
            reportPeriod: periodLabel,
            percentileThreshold: `Bottom ${percentile}%`,
            financialImpact: {
              totalValueTiedUp: filteredSlowMovers.reduce((sum, d) => sum + parseFloat(d.estimatedValue), 0).toFixed(2),
              averageValuePerItem: filteredSlowMovers.length > 0 ? (filteredSlowMovers.reduce((sum, d) => sum + parseFloat(d.estimatedValue), 0) / filteredSlowMovers.length).toFixed(2) : "0"
            }
          },
          alertLevel,
          alertMessage: zeroUsage.length > 5 ? `${zeroUsage.length} drugs with zero usage - significant optimization opportunity` : filteredSlowMovers.length > 10 ? `${filteredSlowMovers.length} slow moving items identified` : `${filteredSlowMovers.length} slow moving items`,
          slowMovers: filteredSlowMovers.slice(0, 50).map((drug, index) => ({
            rank: index + 1,
            drugName: drug.drugName,
            location: drug.location,
            totalUsed: drug.totalUsed,
            avgDailyUsage: drug.avgDailyUsage,
            transactionCount: drug.transactionCount,
            currentStock: drug.qtyOnHand,
            daysOfStock: drug.daysOfStock !== null ? drug.daysOfStock : "N/A",
            riskLevel: drug.riskLevel,
            stockStatus: drug.totalUsed === 0 ? "No Usage" : drug.daysOfStock !== null && drug.daysOfStock > 180 ? "Overstocked" : "Low Demand",
            recommendation: drug.riskLevel === "HIGH" ? "Consider immediate disposal or redistribution - expiring with zero usage" : drug.riskLevel === "MEDIUM" ? "Review for potential redistribution or reduced par levels" : "Monitor usage trends"
          })),
          insights: [
            {
              title: "Zero Usage Items",
              data: `${zeroUsage.length} drug(s) with no usage in ${periodLabel}`
            },
            {
              title: "Excessive Stock",
              data: `${highStock.length} item(s) with >180 days of stock remaining`
            },
            {
              title: "Optimization Potential",
              data: `${filteredSlowMovers.length} items in bottom ${percentile}% of usage`
            }
          ],
          note: filteredSlowMovers.length > 50 ? `Showing top 50 of ${filteredSlowMovers.length} slow movers. Export full report for complete analysis.` : "Complete slow movers report displayed.",
          reportDate: (/* @__PURE__ */ new Date()).toISOString()
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error generating slow movers report: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
  });
}

// src/tools/analytics/getStockoutRiskReport.ts
var import_tools20 = require("@langchain/core/tools");
var import_zod21 = require("zod");
function createGetStockoutRiskReportTool(db) {
  return new import_tools20.DynamicStructuredTool({
    name: "get_stockout_risk_report",
    description: `
Generate proactive stockout risk report with priority scoring.
Identifies drugs at risk of running out before next replenishment.

Use this for queries like:
- "Stockout risk report"
- "What might run out soon?"
- "Show at-risk inventory"
- "Predict stockouts"
    `.trim(),
    schema: import_zod21.z.object({
      leadTimeDays: import_zod21.z.number().int().min(1).max(30).optional().default(7).describe("Lead time for replenishment in days (default: 7)"),
      locationFilter: import_zod21.z.string().optional().describe("Filter by location (optional)")
    }),
    func: async ({ leadTimeDays, locationFilter }) => {
      try {
        const rawInventory = await db.loadInventory();
        const inventory = rawInventory.map((item) => enrichInventoryItem(item));
        const transactions = await db.loadTransactions(30);
        let relevantInventory = inventory;
        if (locationFilter) {
          relevantInventory = inventory.filter(
            (item) => item.location.toLowerCase().includes(locationFilter.toLowerCase())
          );
        }
        const drugUsage = /* @__PURE__ */ new Map();
        for (const txn of transactions) {
          if (txn.action === "USE") {
            const current = drugUsage.get(txn.drugId) || 0;
            drugUsage.set(txn.drugId, current + Math.abs(txn.qtyChange));
          }
        }
        const riskAnalysis = relevantInventory.map((item) => {
          const totalUsage = drugUsage.get(item.drugId) || 0;
          const avgDailyUsage = totalUsage / 30;
          const predictedUsage = avgDailyUsage * leadTimeDays;
          const remainingAfterLeadTime = item.qtyOnHand - predictedUsage;
          const daysUntilStockout = avgDailyUsage > 0 ? Math.floor(item.qtyOnHand / avgDailyUsage) : item.qtyOnHand > 0 ? 999 : 0;
          let riskScore = 0;
          if (item.qtyOnHand === 0) {
            riskScore = 100;
          } else if (remainingAfterLeadTime <= 0) {
            riskScore = 90;
          } else if (daysUntilStockout <= leadTimeDays) {
            riskScore = 80 - daysUntilStockout / leadTimeDays * 30;
          } else if (item.qtyOnHand < item.safetyStock) {
            riskScore = 40 + (item.safetyStock - item.qtyOnHand) / item.safetyStock * 20;
          } else if (daysUntilStockout <= leadTimeDays * 2) {
            riskScore = 20 + (1 - daysUntilStockout / (leadTimeDays * 2)) * 20;
          }
          const categoryMultiplier = item.category === "controlled" ? 1.2 : item.category === "refrigerated" ? 1.1 : 1;
          riskScore = Math.min(100, riskScore * categoryMultiplier);
          const riskLevel = riskScore >= 80 ? "CRITICAL" : riskScore >= 60 ? "HIGH" : riskScore >= 40 ? "MEDIUM" : riskScore >= 20 ? "LOW" : "MINIMAL";
          const priority = item.qtyOnHand === 0 ? 1 : remainingAfterLeadTime <= 0 ? 2 : daysUntilStockout <= leadTimeDays ? 3 : item.qtyOnHand < item.safetyStock ? 4 : 5;
          return {
            drugId: item.drugId,
            drugName: item.drugName,
            category: item.category,
            location: item.location,
            currentStock: item.qtyOnHand,
            safetyStock: item.safetyStock,
            avgDailyUsage: avgDailyUsage.toFixed(2),
            predictedUsageInLeadTime: predictedUsage.toFixed(1),
            remainingAfterLeadTime: remainingAfterLeadTime.toFixed(1),
            daysUntilStockout,
            riskScore: Math.round(riskScore),
            riskLevel,
            priority,
            recommendation: item.qtyOnHand === 0 ? "EMERGENCY ORDER - Already out of stock" : remainingAfterLeadTime <= 0 ? `URGENT - Order now (will run out in ${daysUntilStockout} days, lead time is ${leadTimeDays} days)` : daysUntilStockout <= leadTimeDays ? `ORDER IMMEDIATELY - ${daysUntilStockout} days remaining` : item.qtyOnHand < item.safetyStock ? `Order soon - Below safety stock` : `Monitor - ${daysUntilStockout} days remaining`
          };
        });
        const atRiskItems = riskAnalysis.filter((item) => item.riskScore > 0);
        if (atRiskItems.length === 0) {
          return JSON.stringify({
            found: false,
            leadTimeDays,
            locationFilter,
            message: "No stockout risks detected - all items adequately stocked",
            alertLevel: "info",
            note: "Excellent inventory management!"
          });
        }
        atRiskItems.sort((a, b) => {
          if (a.priority !== b.priority) return a.priority - b.priority;
          return b.riskScore - a.riskScore;
        });
        const critical = atRiskItems.filter((i) => i.riskLevel === "CRITICAL");
        const high = atRiskItems.filter((i) => i.riskLevel === "HIGH");
        const medium = atRiskItems.filter((i) => i.riskLevel === "MEDIUM");
        const controlledAtRisk = atRiskItems.filter((i) => i.category === "controlled");
        const alreadyOut = atRiskItems.filter((i) => i.currentStock === 0);
        const willRunOut = atRiskItems.filter(
          (i) => parseFloat(i.remainingAfterLeadTime) <= 0 && i.currentStock > 0
        );
        const alertLevel = critical.length > 0 || alreadyOut.length > 0 ? "critical" : high.length > 0 ? "warning" : "info";
        return JSON.stringify({
          found: true,
          leadTimeDays,
          locationFilter,
          summary: {
            totalAtRisk: atRiskItems.length,
            totalInventoryItems: relevantInventory.length,
            riskPercentage: (atRiskItems.length / relevantInventory.length * 100).toFixed(1),
            byRiskLevel: {
              critical: critical.length,
              high: high.length,
              medium: medium.length,
              low: atRiskItems.length - critical.length - high.length - medium.length
            },
            immediateAction: {
              alreadyStockedOut: alreadyOut.length,
              willStockoutDuringLeadTime: willRunOut.length,
              total: alreadyOut.length + willRunOut.length
            },
            controlledSubstancesAtRisk: controlledAtRisk.length
          },
          alertLevel,
          alertMessage: alreadyOut.length > 0 ? `CRITICAL: ${alreadyOut.length} item(s) already out of stock + ${willRunOut.length} will run out during lead time` : willRunOut.length > 0 ? `URGENT: ${willRunOut.length} item(s) will run out before replenishment (${leadTimeDays}-day lead time)` : critical.length > 0 ? `${critical.length} item(s) at critical stockout risk` : `${atRiskItems.length} item(s) require monitoring`,
          atRiskItems: atRiskItems.slice(0, 50).map((item, index) => ({
            rank: index + 1,
            drugName: item.drugName,
            category: item.category,
            location: item.location,
            riskLevel: item.riskLevel,
            riskScore: item.riskScore,
            currentStock: item.currentStock,
            safetyStock: item.safetyStock,
            avgDailyUsage: item.avgDailyUsage,
            daysUntilStockout: item.daysUntilStockout,
            willLastLeadTime: parseFloat(item.remainingAfterLeadTime) > 0,
            recommendation: item.recommendation
          })),
          actionPlan: [
            {
              priority: "IMMEDIATE (Today)",
              items: alreadyOut.length + willRunOut.length,
              drugs: [...alreadyOut, ...willRunOut].slice(0, 10).map((i) => i.drugName),
              action: "Emergency procurement - expedite delivery"
            },
            {
              priority: "URGENT (1-2 days)",
              items: critical.length - alreadyOut.length - willRunOut.length,
              drugs: critical.filter((i) => i.currentStock > 0 && parseFloat(i.remainingAfterLeadTime) > 0).slice(0, 10).map((i) => i.drugName),
              action: "Standard procurement process - ensure delivery within lead time"
            },
            {
              priority: "SOON (3-7 days)",
              items: high.length,
              drugs: high.slice(0, 10).map((i) => i.drugName),
              action: "Plan reorder - monitor closely"
            },
            {
              priority: "MONITOR (1-2 weeks)",
              items: medium.length,
              drugs: medium.slice(0, 5).map((i) => i.drugName),
              action: "Add to next regular order"
            }
          ].filter((plan) => plan.items > 0),
          controlledSubstances: controlledAtRisk.length > 0 ? {
            count: controlledAtRisk.length,
            warning: "Controlled substances at risk - ensure regulatory compliance during emergency ordering",
            items: controlledAtRisk.map((i) => ({
              drugName: i.drugName,
              location: i.location,
              riskLevel: i.riskLevel,
              daysUntilStockout: i.daysUntilStockout
            }))
          } : void 0,
          recommendations: [
            alreadyOut.length > 0 && `EMERGENCY: ${alreadyOut.length} items out of stock - arrange emergency delivery`,
            willRunOut.length > 0 && `URGENT: Order ${willRunOut.length} items immediately (won't last lead time)`,
            controlledAtRisk.length > 0 && `${controlledAtRisk.length} controlled substance(s) at risk - expedite with proper documentation`,
            critical.length > 5 && "Multiple critical risks detected - review overall procurement process",
            "Increase safety stock levels for frequently at-risk items",
            "Consider reducing lead times with alternative suppliers for critical drugs",
            "Implement automated reorder points to prevent future stockouts"
          ].filter(Boolean),
          preventiveMeasures: [
            "Set up automated alerts for items reaching reorder points",
            "Increase safety stock levels for high-variability drugs",
            "Establish relationships with backup suppliers for critical items",
            "Review and optimize lead times",
            "Implement min-max inventory controls"
          ],
          actions: ["generate_emergency_po", "contact_suppliers", "adjust_safety_stocks", "export_risk_report"],
          note: atRiskItems.length > 50 ? `Showing top 50 of ${atRiskItems.length} at-risk items. Export full report for complete analysis.` : "Complete stockout risk analysis displayed.",
          reportDate: (/* @__PURE__ */ new Date()).toISOString()
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error generating stockout risk report: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
  });
}

// src/tools/analytics/getUsageAnalytics.ts
var import_tools21 = require("@langchain/core/tools");
var import_zod22 = require("zod");
function createGetUsageAnalyticsTool(db) {
  return new import_tools21.DynamicStructuredTool({
    name: "get_usage_analytics",
    description: `
Generate detailed usage analytics for a specific drug.
Provides consumption patterns, trends, peak usage, and actionable insights.

Use this for queries like:
- "Usage analytics for Propofol"
- "Show consumption patterns for Midazolam"
- "Analyze Fentanyl usage"
- "Detailed stats for drug X"
    `.trim(),
    schema: import_zod22.z.object({
      drugName: import_zod22.z.string().describe("Drug name to analyze"),
      days: import_zod22.z.number().int().min(1).max(365).optional().default(30).describe("Period to analyze in days (default: 30)")
    }),
    func: async ({ drugName, days }) => {
      try {
        const transactions = await db.loadTransactions(days);
        const rawInventory = await db.loadInventory();
        const inventory = rawInventory.map((item) => enrichInventoryItem(item));
        const matchingItems = inventory.filter(
          (item) => item.drugName.toLowerCase().includes(drugName.toLowerCase())
        );
        if (matchingItems.length === 0) {
          return JSON.stringify({
            found: false,
            drugName,
            days,
            message: `Drug "${drugName}" not found in inventory`,
            suggestion: "Check spelling or try a partial name"
          });
        }
        const exactDrugName = matchingItems[0].drugName;
        const drugIds = matchingItems.map((item) => item.drugId);
        const drugTransactions = transactions.filter(
          (txn) => drugIds.includes(txn.drugId) || matchingItems.some((item) => item.drugId === txn.drugId)
        );
        if (drugTransactions.length === 0) {
          return JSON.stringify({
            found: true,
            drugName: exactDrugName,
            days,
            noActivity: true,
            message: `No transactions found for ${exactDrugName} in the last ${days} days`,
            alertLevel: "info",
            currentInventory: matchingItems.map((item) => ({
              location: item.location,
              quantity: item.qtyOnHand,
              expiryDate: item.expiryDate
            }))
          });
        }
        let totalUsed = 0;
        let totalReceived = 0;
        let useTransactions = 0;
        let receiveTransactions = 0;
        const locationActivity = /* @__PURE__ */ new Map();
        const dailyUsage = /* @__PURE__ */ new Map();
        for (const txn of drugTransactions) {
          const invItem = matchingItems.find((item) => item.drugId === txn.drugId);
          if (!invItem) continue;
          const location = invItem.location;
          const locationStats = locationActivity.get(location) || { used: 0, received: 0 };
          if (txn.action === "USE") {
            const qty = Math.abs(txn.qtyChange);
            totalUsed += qty;
            useTransactions++;
            locationStats.used += qty;
            const date = new Date(txn.timestamp).toISOString().split("T")[0];
            dailyUsage.set(date, (dailyUsage.get(date) || 0) + qty);
          } else if (txn.action === "RECEIVE") {
            const qty = txn.qtyChange;
            totalReceived += qty;
            receiveTransactions++;
            locationStats.received += qty;
          }
          locationActivity.set(location, locationStats);
        }
        const avgDailyUsage = totalUsed / days;
        const netChange = totalReceived - totalUsed;
        const transactionFrequency = drugTransactions.length / days;
        const peakUsageEntry = Array.from(dailyUsage.entries()).sort((a, b) => b[1] - a[1])[0];
        const peakUsage = peakUsageEntry ? {
          date: peakUsageEntry[0],
          quantity: peakUsageEntry[1]
        } : null;
        const totalCurrentStock = matchingItems.reduce((sum, item) => sum + item.qtyOnHand, 0);
        const totalSafetyStock = Math.max(...matchingItems.map((item) => item.safetyStock));
        const daysOfStockRemaining = avgDailyUsage > 0 ? Math.round(totalCurrentStock / avgDailyUsage) : totalCurrentStock > 0 ? 999 : 0;
        const stockStatus = totalCurrentStock === 0 ? "stockout" : totalCurrentStock < totalSafetyStock ? "low" : "adequate";
        const locationBreakdown = Array.from(locationActivity.entries()).map(([location, stats]) => {
          const invItem = matchingItems.find((item) => item.location === location);
          return {
            location,
            totalUsed: stats.used,
            totalReceived: stats.received,
            netChange: stats.received - stats.used,
            currentStock: invItem && invItem.qtyOnHand || 0,
            avgDailyUsage: (stats.used / days).toFixed(2),
            category: invItem && invItem.category || "unknown"
          };
        }).sort((a, b) => b.totalUsed - a.totalUsed);
        const firstHalfDays = Math.floor(days / 2);
        const firstHalfTransactions = drugTransactions.filter((txn) => {
          const txnDate = new Date(txn.timestamp);
          const cutoffDate = /* @__PURE__ */ new Date();
          cutoffDate.setDate(cutoffDate.getDate() - firstHalfDays);
          return txnDate < cutoffDate;
        });
        const firstHalfUsage = firstHalfTransactions.filter((t) => t.action === "USE").reduce((sum, t) => sum + Math.abs(t.qtyChange), 0);
        const secondHalfUsage = totalUsed - firstHalfUsage;
        const trendDirection = secondHalfUsage > firstHalfUsage * 1.1 ? "increasing" : secondHalfUsage < firstHalfUsage * 0.9 ? "decreasing" : "stable";
        const trendPercent = firstHalfUsage > 0 ? ((secondHalfUsage - firstHalfUsage) / firstHalfUsage * 100).toFixed(1) : "0";
        const alertLevel = stockStatus === "stockout" ? "critical" : stockStatus === "low" && daysOfStockRemaining < 7 ? "warning" : "info";
        return JSON.stringify({
          found: true,
          drugName: exactDrugName,
          category: matchingItems[0].category,
          days,
          summary: {
            totalUsed,
            totalReceived,
            netChange,
            avgDailyUsage: avgDailyUsage.toFixed(2),
            transactionCount: drugTransactions.length,
            useTransactions,
            receiveTransactions,
            transactionFrequency: transactionFrequency.toFixed(2)
          },
          currentInventory: {
            totalStock: totalCurrentStock,
            safetyStock: totalSafetyStock,
            stockStatus,
            daysOfStockRemaining,
            locations: matchingItems.length,
            alertLevel
          },
          trend: {
            direction: trendDirection,
            percentChange: trendPercent,
            description: trendDirection === "increasing" ? `Usage increased by ${trendPercent}% - consider increasing stock levels` : trendDirection === "decreasing" ? `Usage decreased by ${Math.abs(parseFloat(trendPercent))}% - consider reducing par levels` : "Usage stable - maintain current stock levels"
          },
          peakUsage: peakUsage ? {
            date: peakUsage.date,
            quantity: peakUsage.quantity,
            note: `Peak day used ${(peakUsage.quantity / avgDailyUsage).toFixed(1)}x average daily usage`
          } : null,
          locationBreakdown,
          insights: [
            {
              title: "Primary Usage Location",
              data: locationBreakdown.length > 0 ? `${locationBreakdown[0].location} - ${locationBreakdown[0].totalUsed} units (${(locationBreakdown[0].totalUsed / totalUsed * 100).toFixed(0)}% of total)` : "N/A",
              recommendation: "Ensure adequate stock at primary usage location"
            },
            {
              title: "Usage Pattern",
              data: transactionFrequency > 1 ? `High frequency - ${transactionFrequency.toFixed(1)} transactions/day` : transactionFrequency > 0.5 ? `Moderate frequency - ${transactionFrequency.toFixed(1)} transactions/day` : `Low frequency - ${transactionFrequency.toFixed(1)} transactions/day`,
              recommendation: transactionFrequency > 1 ? "High-use drug - monitor closely and maintain buffer stock" : "Standard monitoring adequate"
            },
            {
              title: "Stock Adequacy",
              data: daysOfStockRemaining < 7 ? `LOW - Only ${daysOfStockRemaining} days remaining` : daysOfStockRemaining < 30 ? `MODERATE - ${daysOfStockRemaining} days remaining` : `ADEQUATE - ${daysOfStockRemaining}+ days remaining`,
              recommendation: daysOfStockRemaining < 7 ? "URGENT: Reorder immediately" : daysOfStockRemaining < 30 ? "Plan reorder within 1-2 weeks" : "Normal stock levels"
            }
          ],
          recommendations: [
            stockStatus === "stockout" && "CRITICAL: Drug is out of stock - emergency reorder required",
            stockStatus === "low" && daysOfStockRemaining < 7 && `URGENT: Only ${daysOfStockRemaining} days of stock remaining - reorder immediately`,
            trendDirection === "increasing" && "Usage trending up - consider increasing safety stock levels",
            trendDirection === "decreasing" && "Usage trending down - review par levels for potential reduction",
            totalUsed > 0 && netChange < 0 && "Net consumption exceeded receipts - ensure adequate reordering",
            matchingItems[0].category === "controlled" && "Controlled substance - maintain audit trail for all transactions",
            peakUsage && peakUsage.quantity > avgDailyUsage * 3 && "High usage variability detected - consider increasing buffer stock"
          ].filter(Boolean),
          actions: [
            "generate_forecast",
            "update_par_levels",
            "create_reorder",
            "view_detailed_transactions",
            "export_report"
          ],
          alertMessage: alertLevel === "critical" ? "OUT OF STOCK - Immediate action required" : alertLevel === "warning" ? `Low stock - ${daysOfStockRemaining} days remaining` : `Usage analytics for ${exactDrugName}`,
          reportDate: (/* @__PURE__ */ new Date()).toISOString()
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error generating usage analytics: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
  });
}

// src/tools/analytics/getShortageAlerts.ts
var import_tools22 = require("@langchain/core/tools");
var import_zod23 = require("zod");
function createGetShortageAlertsTool(db) {
  return new import_tools22.DynamicStructuredTool({
    name: "get_shortage_alerts",
    description: `
Generate real-time shortage alerts with immediate action items.
Combines current stock status with usage patterns for proactive warnings.

Use this for queries like:
- "Any shortage alerts?"
- "What's running low?"
- "Show critical alerts"
- "Real-time inventory warnings"
    `.trim(),
    schema: import_zod23.z.object({
      leadTimeDays: import_zod23.z.number().int().min(1).max(14).optional().default(7).describe("Consider lead time for alerts (default: 7)"),
      includeWarnings: import_zod23.z.boolean().optional().default(true).describe("Include warning-level alerts (default: true)")
    }),
    func: async ({ leadTimeDays, includeWarnings }) => {
      try {
        const rawInventory = await db.loadInventory();
        const inventory = rawInventory.map((item) => enrichInventoryItem(item));
        const transactions = await db.loadTransactions(30);
        const lowStockItems = await db.getLowStockItems();
        const drugUsage = /* @__PURE__ */ new Map();
        for (const txn of transactions) {
          if (txn.action === "USE") {
            const current = drugUsage.get(txn.drugId) || 0;
            drugUsage.set(txn.drugId, current + Math.abs(txn.qtyChange));
          }
        }
        const alerts = [];
        for (const item of inventory) {
          const totalUsage = drugUsage.get(item.drugId) || 0;
          const avgDailyUsage = totalUsage / 30;
          const daysRemaining = avgDailyUsage > 0 ? item.qtyOnHand / avgDailyUsage : 999;
          let alertType = null;
          let alertLevel = null;
          let message = "";
          let action = "";
          if (item.qtyOnHand === 0) {
            alertType = "STOCKOUT";
            alertLevel = "CRITICAL";
            message = `${item.drugName} is OUT OF STOCK at ${item.location}`;
            action = "EMERGENCY ORDER - Arrange immediate delivery or transfer from other location";
          } else if (daysRemaining <= leadTimeDays && avgDailyUsage > 0) {
            alertType = "IMMINENT_STOCKOUT";
            alertLevel = "CRITICAL";
            message = `${item.drugName} will run out in ${Math.floor(daysRemaining)} days (lead time: ${leadTimeDays} days)`;
            action = "ORDER IMMEDIATELY - Will run out before replenishment arrives";
          } else if (item.qtyOnHand < item.safetyStock) {
            alertType = "BELOW_SAFETY_STOCK";
            alertLevel = "WARNING";
            message = `${item.drugName} below safety stock at ${item.location} (${item.qtyOnHand}/${item.safetyStock})`;
            action = "Order soon - Below minimum safe level";
          } else if (item.qtyOnHand < item.safetyStock * 1.2 && avgDailyUsage > 0) {
            alertType = "APPROACHING_SAFETY_STOCK";
            alertLevel = "WARNING";
            message = `${item.drugName} approaching safety stock at ${item.location}`;
            action = "Plan reorder within 1-2 days";
          }
          if (!alertType || alertLevel === "WARNING" && !includeWarnings) {
            continue;
          }
          alerts.push({
            alertType,
            alertLevel,
            drugId: item.drugId,
            drugName: item.drugName,
            category: item.category,
            location: item.location,
            currentStock: item.qtyOnHand,
            safetyStock: item.safetyStock,
            avgDailyUsage: avgDailyUsage.toFixed(2),
            daysRemaining: Math.floor(daysRemaining),
            message,
            action,
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            isControlled: item.category === "controlled"
          });
        }
        if (alerts.length === 0) {
          return JSON.stringify({
            hasAlerts: false,
            leadTimeDays,
            includeWarnings,
            message: includeWarnings ? "No shortage alerts - all inventory levels adequate" : "No critical alerts - all items above safety stock",
            alertLevel: "info",
            note: "Excellent inventory management!"
          });
        }
        const levelOrder = { CRITICAL: 0, WARNING: 1, INFO: 2 };
        alerts.sort((a, b) => {
          const aLevel = a.alertLevel || "INFO";
          const bLevel = b.alertLevel || "INFO";
          const levelDiff = (levelOrder[aLevel] || 999) - (levelOrder[bLevel] || 999);
          if (levelDiff !== 0) return levelDiff;
          return a.daysRemaining - b.daysRemaining;
        });
        const critical = alerts.filter((a) => a.alertLevel === "CRITICAL");
        const warnings = alerts.filter((a) => a.alertLevel === "WARNING");
        const stockouts = alerts.filter((a) => a.alertType === "STOCKOUT");
        const imminentStockouts = alerts.filter((a) => a.alertType === "IMMINENT_STOCKOUT");
        const controlledAlerts = alerts.filter((a) => a.isControlled);
        const locationGroups = /* @__PURE__ */ new Map();
        for (const alert of alerts) {
          const existing = locationGroups.get(alert.location) || [];
          existing.push(alert);
          locationGroups.set(alert.location, existing);
        }
        const locationSummary = Array.from(locationGroups.entries()).map(([location, alerts2]) => ({
          location,
          totalAlerts: alerts2.length,
          critical: alerts2.filter((a) => a.alertLevel === "CRITICAL").length,
          warnings: alerts2.filter((a) => a.alertLevel === "WARNING").length
        })).sort((a, b) => b.critical - a.critical || b.totalAlerts - a.totalAlerts);
        return JSON.stringify({
          hasAlerts: true,
          leadTimeDays,
          includeWarnings,
          summary: {
            totalAlerts: alerts.length,
            byLevel: {
              critical: critical.length,
              warning: warnings.length
            },
            byType: {
              stockouts: stockouts.length,
              imminentStockouts: imminentStockouts.length,
              belowSafety: alerts.filter((a) => a.alertType === "BELOW_SAFETY_STOCK").length,
              approachingSafety: alerts.filter((a) => a.alertType === "APPROACHING_SAFETY_STOCK").length
            },
            controlledSubstances: controlledAlerts.length,
            locationsAffected: locationGroups.size,
            generatedAt: (/* @__PURE__ */ new Date()).toISOString()
          },
          alertLevel: critical.length > 0 ? "critical" : "warning",
          alertMessage: stockouts.length > 0 ? `CRITICAL: ${stockouts.length} stockout(s) + ${imminentStockouts.length} imminent stockout(s)` : critical.length > 0 ? `${critical.length} critical alert(s) requiring immediate action` : `${warnings.length} warning(s) - items below safety stock`,
          criticalAlerts: critical.map((alert, index) => ({
            priority: index + 1,
            drugName: alert.drugName,
            location: alert.location,
            alertType: alert.alertType,
            message: alert.message,
            action: alert.action,
            currentStock: alert.currentStock,
            daysRemaining: alert.daysRemaining,
            isControlled: alert.isControlled
          })),
          warningAlerts: includeWarnings ? warnings.slice(0, 20).map((alert, index) => ({
            rank: index + 1,
            drugName: alert.drugName,
            location: alert.location,
            alertType: alert.alertType,
            message: alert.message,
            action: alert.action,
            currentStock: alert.currentStock,
            safetyStock: alert.safetyStock
          })) : void 0,
          locationBreakdown: locationSummary,
          controlledSubstances: controlledAlerts.length > 0 ? {
            count: controlledAlerts.length,
            alerts: controlledAlerts.map((a) => ({
              drugName: a.drugName,
              location: a.location,
              alertLevel: a.alertLevel,
              message: a.message
            })),
            warning: "Controlled substances in shortage - ensure regulatory compliance and documentation"
          } : void 0,
          immediateActions: [
            stockouts.length > 0 && {
              priority: "URGENT",
              action: `Emergency procurement for ${stockouts.length} out-of-stock item(s)`,
              items: stockouts.map((a) => `${a.drugName} (${a.location})`).slice(0, 5),
              timeline: "Immediate - arrange emergency delivery or transfer"
            },
            imminentStockouts.length > 0 && {
              priority: "HIGH",
              action: `Order ${imminentStockouts.length} item(s) immediately`,
              items: imminentStockouts.map((a) => `${a.drugName} (${a.location})`).slice(0, 5),
              timeline: `Will run out before ${leadTimeDays}-day lead time`
            },
            critical.length - stockouts.length - imminentStockouts.length > 0 && {
              priority: "MEDIUM",
              action: `Order items below safety stock`,
              count: critical.length - stockouts.length - imminentStockouts.length,
              timeline: "1-2 days"
            }
          ].filter(Boolean),
          recommendations: [
            stockouts.length > 0 && `EMERGENCY: ${stockouts.length} stockout(s) - check if transfer from other locations possible`,
            imminentStockouts.length > 0 && `${imminentStockouts.length} item(s) will run out before reorder arrives - expedite delivery`,
            controlledAlerts.length > 0 && `${controlledAlerts.length} controlled substance(s) affected - ensure proper documentation`,
            critical.length > 5 && "Multiple critical alerts - review overall procurement process",
            locationSummary[0] && locationSummary[0].critical > 3 && `${locationSummary[0].location} has ${locationSummary[0].critical} critical alerts - priority attention needed`,
            "Set up automated reorder points to prevent future shortages",
            "Review safety stock levels for frequently alerted items"
          ].filter(Boolean),
          actions: ["generate_emergency_po", "contact_suppliers", "transfer_stock", "update_safety_levels"],
          refreshInterval: "Check alerts every 4-6 hours for proactive management",
          note: critical.length > 10 ? `High alert volume (${critical.length} critical) - review procurement practices` : warnings.length > 20 ? `Showing top 20 of ${warnings.length} warnings. Export full report for complete data.` : "All shortage alerts displayed."
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error generating shortage alerts: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
  });
}

// src/tools/analytics/getRestockRecommendation.ts
var import_tools23 = require("@langchain/core/tools");
var import_zod24 = require("zod");
function createGetRestockRecommendationTool(db) {
  return new import_tools23.DynamicStructuredTool({
    name: "get_restock_recommendation",
    description: `
Get smart restock recommendations for a specific drug or location.
Considers current stock, usage patterns, lead time, and safety levels.

Use this for queries like:
- "Restock recommendation for Propofol"
- "Should I reorder Midazolam?"
- "Restocking advice for ICU"
- "When to reorder drug X?"
    `.trim(),
    schema: import_zod24.z.object({
      drugName: import_zod24.z.string().optional().describe("Specific drug name (optional)"),
      location: import_zod24.z.string().optional().describe("Specific location (optional)"),
      leadTimeDays: import_zod24.z.number().int().min(1).max(30).optional().default(7).describe("Supplier lead time in days (default: 7)")
    }),
    func: async ({ drugName, location, leadTimeDays }) => {
      try {
        const rawInventory = await db.loadInventory();
        const inventory = rawInventory.map((item) => enrichInventoryItem(item));
        const transactions = await db.loadTransactions(30);
        let items = inventory;
        if (drugName) {
          items = items.filter(
            (item) => item.drugName.toLowerCase().includes(drugName.toLowerCase())
          );
        }
        if (location) {
          items = items.filter(
            (item) => item.location.toLowerCase().includes(location.toLowerCase())
          );
        }
        if (items.length === 0) {
          return JSON.stringify({
            found: false,
            drugName,
            location,
            message: "No matching items found",
            suggestion: "Check spelling or try different search terms"
          });
        }
        const drugUsage = /* @__PURE__ */ new Map();
        for (const txn of transactions) {
          if (txn.action === "USE") {
            const current = drugUsage.get(txn.drugId) || 0;
            drugUsage.set(txn.drugId, current + Math.abs(txn.qtyChange));
          }
        }
        const recommendations = items.map((item) => {
          const totalUsage = drugUsage.get(item.drugId) || 0;
          const avgDailyUsage = totalUsage / 30;
          const usageDuringLeadTime = avgDailyUsage * leadTimeDays;
          const stockAfterLeadTime = item.qtyOnHand - usageDuringLeadTime;
          const daysOfStock = avgDailyUsage > 0 ? item.qtyOnHand / avgDailyUsage : 999;
          const reorderPoint = item.safetyStock + usageDuringLeadTime;
          let shouldReorder = false;
          let urgency = "NOT_NEEDED";
          let reasoning = "";
          if (item.qtyOnHand === 0) {
            shouldReorder = true;
            urgency = "EMERGENCY";
            reasoning = "Currently out of stock";
          } else if (stockAfterLeadTime <= 0) {
            shouldReorder = true;
            urgency = "CRITICAL";
            reasoning = `Will run out in ${Math.floor(daysOfStock)} days (before lead time of ${leadTimeDays} days)`;
          } else if (item.qtyOnHand < reorderPoint) {
            shouldReorder = true;
            urgency = "URGENT";
            reasoning = `Below reorder point (${item.qtyOnHand} < ${Math.ceil(reorderPoint)})`;
          } else if (item.qtyOnHand < item.safetyStock * 1.5) {
            shouldReorder = true;
            urgency = "SOON";
            reasoning = "Approaching reorder point";
          } else {
            urgency = "NOT_NEEDED";
            reasoning = `Adequate stock (${Math.floor(daysOfStock)} days remaining)`;
          }
          const targetStock = Math.max(
            item.safetyStock * 2,
            avgDailyUsage * 30
            // 30 days supply
          );
          const recommendedQty = shouldReorder ? Math.max(0, Math.ceil(targetStock - item.qtyOnHand)) : 0;
          const packSize = 50;
          const orderPacks = Math.ceil(recommendedQty / packSize);
          const finalOrderQty = orderPacks * packSize;
          return {
            drugId: item.drugId,
            drugName: item.drugName,
            category: item.category,
            location: item.location,
            currentStock: item.qtyOnHand,
            safetyStock: item.safetyStock,
            reorderPoint: Math.ceil(reorderPoint),
            avgDailyUsage: avgDailyUsage.toFixed(2),
            daysOfStock: Math.floor(daysOfStock),
            usageDuringLeadTime: Math.ceil(usageDuringLeadTime),
            stockAfterLeadTime: Math.floor(stockAfterLeadTime),
            recommendation: {
              shouldReorder,
              urgency,
              reasoning,
              recommendedOrderQty: finalOrderQty,
              orderPacks,
              packSize,
              targetStock: Math.ceil(targetStock),
              estimatedCost: (finalOrderQty * (item.category === "controlled" ? 50 : item.category === "refrigerated" ? 30 : 10)).toFixed(2)
            },
            timing: urgency === "EMERGENCY" ? "Order immediately - arrange emergency delivery" : urgency === "CRITICAL" ? "Order today - will run out during lead time" : urgency === "URGENT" ? "Order within 1-2 days" : urgency === "SOON" ? "Plan to order within 1 week" : `No immediate order needed (${Math.floor(daysOfStock)} days remaining)`,
            action: shouldReorder ? `Order ${finalOrderQty} units (${orderPacks} packs of ${packSize})` : "Continue monitoring - no action needed"
          };
        });
        const urgencyOrder = { EMERGENCY: 0, CRITICAL: 1, URGENT: 2, SOON: 3, NOT_NEEDED: 4 };
        recommendations.sort(
          (a, b) => urgencyOrder[a.recommendation.urgency] - urgencyOrder[b.recommendation.urgency]
        );
        const needsReorder = recommendations.filter((r) => r.recommendation.shouldReorder);
        const emergency = recommendations.filter((r) => r.recommendation.urgency === "EMERGENCY");
        const critical = recommendations.filter((r) => r.recommendation.urgency === "CRITICAL");
        const urgent = recommendations.filter((r) => r.recommendation.urgency === "URGENT");
        const soon = recommendations.filter((r) => r.recommendation.urgency === "SOON");
        const totalOrderCost = needsReorder.reduce((sum, r) => sum + parseFloat(r.recommendation.estimatedCost), 0);
        const alertLevel = emergency.length > 0 || critical.length > 0 ? "critical" : urgent.length > 0 ? "warning" : "info";
        return JSON.stringify({
          found: true,
          drugName,
          location,
          leadTimeDays,
          summary: {
            totalItems: recommendations.length,
            needsReorder: needsReorder.length,
            adequateStock: recommendations.length - needsReorder.length,
            byUrgency: {
              emergency: emergency.length,
              critical: critical.length,
              urgent: urgent.length,
              soon: soon.length,
              notNeeded: recommendations.filter((r) => r.recommendation.urgency === "NOT_NEEDED").length
            },
            estimatedTotalCost: totalOrderCost.toFixed(2)
          },
          alertLevel,
          alertMessage: emergency.length > 0 ? `${emergency.length} emergency reorder(s) + ${critical.length} critical` : critical.length > 0 ? `${critical.length} critical reorder(s) needed` : urgent.length > 0 ? `${urgent.length} item(s) need ordering soon` : needsReorder.length > 0 ? `${needsReorder.length} item(s) should be reordered` : "All items adequately stocked",
          recommendations: recommendations.slice(0, 50).map((rec, index) => ({
            rank: rec.recommendation.shouldReorder ? needsReorder.indexOf(rec) + 1 : null,
            drugName: rec.drugName,
            location: rec.location,
            category: rec.category,
            currentStock: rec.currentStock,
            daysOfStock: rec.daysOfStock,
            shouldReorder: rec.recommendation.shouldReorder,
            urgency: rec.recommendation.urgency,
            reasoning: rec.recommendation.reasoning,
            recommendedQty: rec.recommendation.recommendedOrderQty,
            estimatedCost: rec.recommendation.estimatedCost,
            timing: rec.timing,
            action: rec.action
          })),
          detailedAnalysis: drugName && recommendations.length === 1 ? {
            drugName: recommendations[0].drugName,
            currentSituation: {
              stock: recommendations[0].currentStock,
              safetyStock: recommendations[0].safetyStock,
              reorderPoint: recommendations[0].reorderPoint,
              daysRemaining: recommendations[0].daysOfStock
            },
            usagePattern: {
              avgDailyUsage: recommendations[0].avgDailyUsage,
              last30DaysTotal: (parseFloat(recommendations[0].avgDailyUsage) * 30).toFixed(0),
              projectedUsageDuringLeadTime: recommendations[0].usageDuringLeadTime
            },
            projection: {
              stockAfterLeadTime: recommendations[0].stockAfterLeadTime,
              willLastLeadTime: recommendations[0].stockAfterLeadTime > 0,
              riskLevel: recommendations[0].recommendation.urgency
            },
            recommendation: recommendations[0].recommendation
          } : void 0,
          reorderPlan: needsReorder.length > 0 ? {
            immediate: emergency.length + critical.length > 0 ? {
              count: emergency.length + critical.length,
              items: [...emergency, ...critical].map((r) => ({
                drugName: r.drugName,
                location: r.location,
                orderQty: r.recommendation.recommendedOrderQty,
                urgency: r.recommendation.urgency
              })),
              totalCost: [...emergency, ...critical].reduce((sum, r) => sum + parseFloat(r.recommendation.estimatedCost), 0).toFixed(2),
              action: "Place orders immediately - emergency/critical items"
            } : void 0,
            thisWeek: urgent.length > 0 ? {
              count: urgent.length,
              totalCost: urgent.reduce((sum, r) => sum + parseFloat(r.recommendation.estimatedCost), 0).toFixed(2),
              action: "Schedule orders within 1-2 days"
            } : void 0,
            planned: soon.length > 0 ? {
              count: soon.length,
              totalCost: soon.reduce((sum, r) => sum + parseFloat(r.recommendation.estimatedCost), 0).toFixed(2),
              action: "Include in next regular order (within 1 week)"
            } : void 0
          } : void 0,
          insights: [
            {
              title: "Reorder Efficiency",
              data: needsReorder.length > 0 ? `${needsReorder.length} of ${recommendations.length} items need reordering (${(needsReorder.length / recommendations.length * 100).toFixed(0)}%)` : "All items adequately stocked",
              recommendation: needsReorder.length > recommendations.length * 0.3 ? "High reorder rate - consider increasing safety stock levels or reviewing par levels" : "Normal reorder rate - current stock levels appropriate"
            },
            {
              title: "Lead Time Impact",
              data: critical.length > 0 ? `${critical.length} item(s) won't last the ${leadTimeDays}-day lead time` : `Current stock adequate for ${leadTimeDays}-day lead time`,
              recommendation: critical.length > 0 ? "Consider reducing lead times with alternative suppliers or increasing safety stock" : "Lead time management effective"
            },
            {
              title: "Financial Impact",
              data: `Estimated reorder cost: $${totalOrderCost.toFixed(2)}`,
              recommendation: totalOrderCost > 5e3 ? "Significant order value - consider bulk discounts or split delivery" : "Standard order value"
            }
          ],
          recommendations_list: [
            emergency.length > 0 && `EMERGENCY: ${emergency.length} out-of-stock item(s) need immediate attention`,
            critical.length > 0 && `${critical.length} item(s) will run out before reorder arrives - order now`,
            urgent.length > 0 && `${urgent.length} item(s) below reorder point - order within 1-2 days`,
            needsReorder.length > 5 && "Multiple items need reordering - consider consolidated purchase order",
            "Monitor usage patterns for items approaching reorder points",
            "Review safety stock levels quarterly to optimize inventory"
          ].filter(Boolean),
          actions: ["generate_po", "contact_supplier", "update_par_levels", "schedule_review"],
          note: recommendations.length > 50 ? `Showing top 50 of ${recommendations.length} items. Export full report for complete recommendations.` : "Complete restock recommendations displayed.",
          reportDate: (/* @__PURE__ */ new Date()).toISOString()
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error generating restock recommendations: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
  });
}

// src/tools/procurement/generatePurchaseOrder.ts
var import_tools24 = require("@langchain/core/tools");
var import_zod25 = require("zod");
function createGeneratePurchaseOrderTool(db) {
  return new import_tools24.DynamicStructuredTool({
    name: "generate_purchase_order",
    description: `
Automatically generate purchase order for items below safety stock.
Creates detailed PO with quantities, priorities, and estimated costs.

Use this for queries like:
- "Generate purchase order"
- "Create PO for low stock items"
- "Generate reorder for everything below safety stock"
- "Auto-generate purchase order"
    `.trim(),
    schema: import_zod25.z.object({
      targetDaysOfSupply: import_zod25.z.number().int().min(7).max(90).optional().default(30).describe("Target days of supply to order (default: 30)"),
      includeNearSafetyStock: import_zod25.z.boolean().optional().default(false).describe("Include items near (within 20% of) safety stock (default: false)"),
      locationFilter: import_zod25.z.string().optional().describe("Filter by location (optional)"),
      urgentOnly: import_zod25.z.boolean().optional().default(false).describe("Only include urgent/critical items (default: false)")
    }),
    func: async ({ targetDaysOfSupply, includeNearSafetyStock, locationFilter, urgentOnly }) => {
      try {
        const rawInventory = await db.loadInventory();
        const inventory = rawInventory.map((item) => enrichInventoryItem(item));
        const transactions = await db.loadTransactions(30);
        let relevantInventory = inventory;
        if (locationFilter) {
          relevantInventory = inventory.filter(
            (item) => item.location.toLowerCase().includes(locationFilter.toLowerCase())
          );
        }
        const drugUsage = /* @__PURE__ */ new Map();
        for (const txn of transactions) {
          if (txn.action === "USE") {
            const current = drugUsage.get(txn.drugId) || 0;
            drugUsage.set(txn.drugId, current + Math.abs(txn.qtyChange));
          }
        }
        const orderItems = [];
        for (const item of relevantInventory) {
          const totalUsage = drugUsage.get(item.drugId) || 0;
          const avgDailyUsage = totalUsage / 30;
          const belowSafetyStock = item.qtyOnHand < item.safetyStock;
          const nearSafetyStock = item.qtyOnHand < item.safetyStock * 1.2;
          const outOfStock = item.qtyOnHand === 0;
          let shouldOrder = false;
          let urgencyLevel = "STANDARD";
          if (outOfStock) {
            shouldOrder = true;
            urgencyLevel = "EMERGENCY";
          } else if (belowSafetyStock) {
            shouldOrder = true;
            urgencyLevel = avgDailyUsage > item.qtyOnHand / 7 ? "URGENT" : "STANDARD";
          } else if (includeNearSafetyStock && nearSafetyStock) {
            shouldOrder = true;
            urgencyLevel = "STANDARD";
          }
          if (urgentOnly && urgencyLevel === "STANDARD") {
            shouldOrder = false;
          }
          if (!shouldOrder) continue;
          const targetStock = Math.max(
            item.safetyStock * 1.5,
            avgDailyUsage * targetDaysOfSupply
          );
          const neededQty = Math.ceil(targetStock - item.qtyOnHand);
          const packSize = 50;
          const orderQty = Math.ceil(neededQty / packSize) * packSize;
          const estimatedUnitPrice = item.category === "controlled" ? 50 : item.category === "refrigerated" ? 30 : 10;
          const lineTotal = orderQty * estimatedUnitPrice;
          orderItems.push({
            drugId: item.drugId,
            drugName: item.drugName,
            category: item.category,
            location: item.location,
            currentStock: item.qtyOnHand,
            safetyStock: item.safetyStock,
            avgDailyUsage: avgDailyUsage.toFixed(2),
            neededQty,
            orderQty,
            packSize,
            packs: orderQty / packSize,
            urgencyLevel,
            estimatedUnitPrice: estimatedUnitPrice.toFixed(2),
            lineTotal: lineTotal.toFixed(2)
          });
        }
        if (orderItems.length === 0) {
          return JSON.stringify({
            found: false,
            targetDaysOfSupply,
            includeNearSafetyStock,
            locationFilter,
            urgentOnly,
            message: urgentOnly ? "No urgent items require ordering" : "All items adequately stocked - no purchase order needed",
            alertLevel: "info",
            note: "Excellent inventory management!"
          });
        }
        const urgencyOrder = { EMERGENCY: 0, URGENT: 1, STANDARD: 2 };
        orderItems.sort((a, b) => {
          const urgencyDiff = urgencyOrder[a.urgencyLevel] - urgencyOrder[b.urgencyLevel];
          if (urgencyDiff !== 0) return urgencyDiff;
          return parseFloat(b.lineTotal) - parseFloat(a.lineTotal);
        });
        const emergencyItems = orderItems.filter((i) => i.urgencyLevel === "EMERGENCY");
        const urgentItems = orderItems.filter((i) => i.urgencyLevel === "URGENT");
        const standardItems = orderItems.filter((i) => i.urgencyLevel === "STANDARD");
        const totalValue = orderItems.reduce((sum, i) => sum + parseFloat(i.lineTotal), 0);
        const totalQty = orderItems.reduce((sum, i) => sum + i.orderQty, 0);
        const controlledItems = orderItems.filter((i) => i.category === "controlled");
        const poNumber = `PO-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0].replace(/-/g, "")}-${String(Math.floor(Math.random() * 1e4)).padStart(4, "0")}`;
        const alertLevel = emergencyItems.length > 0 ? "critical" : urgentItems.length > 0 ? "warning" : "info";
        return JSON.stringify({
          found: true,
          poGenerated: true,
          purchaseOrder: {
            poNumber,
            generatedDate: (/* @__PURE__ */ new Date()).toISOString(),
            requestedBy: "P-MACS Automated System",
            targetDaysOfSupply,
            locationFilter: locationFilter || "All Locations",
            summary: {
              totalLineItems: orderItems.length,
              totalQuantity: totalQty,
              estimatedTotal: totalValue.toFixed(2),
              byUrgency: {
                emergency: emergencyItems.length,
                urgent: urgentItems.length,
                standard: standardItems.length
              },
              controlledSubstances: controlledItems.length,
              uniqueLocations: new Set(orderItems.map((i) => i.location)).size
            },
            lineItems: orderItems.map((item, index) => ({
              lineNumber: index + 1,
              drugName: item.drugName,
              category: item.category,
              location: item.location,
              currentStock: item.currentStock,
              orderQty: item.orderQty,
              packs: item.packs,
              packSize: item.packSize,
              unitPrice: item.estimatedUnitPrice,
              lineTotal: item.lineTotal,
              urgency: item.urgencyLevel,
              note: item.urgencyLevel === "EMERGENCY" ? "OUT OF STOCK - Expedite delivery" : item.urgencyLevel === "URGENT" ? "Below safety stock - Priority delivery" : "Standard replenishment"
            })),
            urgencyBreakdown: {
              emergency: emergencyItems.length > 0 ? {
                count: emergencyItems.length,
                items: emergencyItems.map((i) => i.drugName),
                totalValue: emergencyItems.reduce((sum, i) => sum + parseFloat(i.lineTotal), 0).toFixed(2),
                deliveryRequired: "IMMEDIATE (24-48 hours)",
                note: "Items are currently OUT OF STOCK"
              } : void 0,
              urgent: urgentItems.length > 0 ? {
                count: urgentItems.length,
                items: urgentItems.slice(0, 10).map((i) => i.drugName),
                totalValue: urgentItems.reduce((sum, i) => sum + parseFloat(i.lineTotal), 0).toFixed(2),
                deliveryRequired: "PRIORITY (3-5 days)",
                note: "Items below safety stock"
              } : void 0,
              standard: standardItems.length > 0 ? {
                count: standardItems.length,
                totalValue: standardItems.reduce((sum, i) => sum + parseFloat(i.lineTotal), 0).toFixed(2),
                deliveryRequired: "STANDARD (7-14 days)"
              } : void 0
            },
            controlledSubstances: controlledItems.length > 0 ? {
              count: controlledItems.length,
              items: controlledItems.map((i) => ({
                drugName: i.drugName,
                location: i.location,
                orderQty: i.orderQty,
                urgency: i.urgencyLevel
              })),
              warning: "CONTROLLED SUBSTANCES - Requires special procurement authorization and documentation",
              action: "Obtain approval from pharmacy supervisor before submitting PO"
            } : void 0,
            deliveryInstructions: [
              emergencyItems.length > 0 && "EXPEDITE: Emergency items require immediate delivery",
              controlledItems.length > 0 && "Controlled substances require chain-of-custody documentation",
              "Verify batch numbers and expiry dates on delivery",
              "Refrigerated items require cold chain verification",
              "Inspect packaging for damage before accepting delivery"
            ].filter(Boolean),
            approvalRequired: totalValue > 5e3 || controlledItems.length > 0
          },
          alertLevel,
          alertMessage: emergencyItems.length > 0 ? `CRITICAL: PO includes ${emergencyItems.length} emergency item(s) - expedite approval and delivery` : urgentItems.length > 0 ? `URGENT: PO includes ${urgentItems.length} priority item(s)` : `Standard PO generated for ${orderItems.length} item(s)`,
          recommendations: [
            emergencyItems.length > 0 && `Emergency procurement needed for ${emergencyItems.length} items - contact suppliers immediately`,
            controlledItems.length > 0 && `${controlledItems.length} controlled substance(s) - ensure DEA compliance`,
            totalValue > 1e4 && `High-value order ($${totalValue.toFixed(2)}) - consider bulk discount negotiation`,
            "Review delivery schedule to ensure availability",
            "Verify supplier stock availability before confirming PO",
            standardItems.length > 20 && "Large order - consider splitting delivery for better cash flow"
          ].filter(Boolean),
          nextSteps: [
            { step: 1, action: "Review and approve PO", responsible: "Pharmacy Manager" },
            { step: 2, action: "Submit to supplier(s)", responsible: "Procurement" },
            { step: 3, action: "Schedule delivery", responsible: "Receiving" },
            { step: 4, action: "Update inventory on receipt", responsible: "Pharmacy Staff" },
            { step: 5, action: "Verify invoice matches PO", responsible: "Accounts Payable" }
          ],
          actions: ["print_po", "email_to_supplier", "save_pdf", "send_for_approval", "track_order"],
          note: `Purchase order generated for ${targetDaysOfSupply} days of supply. Total estimated value: $${totalValue.toFixed(2)}`
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error generating purchase order: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
  });
}

// src/tools/procurement/getReorderRecommendations.ts
var import_tools25 = require("@langchain/core/tools");
var import_zod26 = require("zod");
function createGetReorderRecommendationsTool(db) {
  return new import_tools25.DynamicStructuredTool({
    name: "get_reorder_recommendations",
    description: `
Generate intelligent reorder recommendations using EOQ principles.
Optimizes order quantities based on usage, costs, and lead times.

Use this for queries like:
- "Reorder recommendations"
- "What should I order?"
- "Smart ordering suggestions"
- "EOQ recommendations"
    `.trim(),
    schema: import_zod26.z.object({
      minOrderValue: import_zod26.z.number().optional().default(100).describe("Minimum order value to include (default: 100)"),
      leadTimeDays: import_zod26.z.number().int().min(1).max(30).optional().default(7).describe("Supplier lead time (default: 7)"),
      targetDaysOfSupply: import_zod26.z.number().int().min(14).max(90).optional().default(30).describe("Target days of supply (default: 30)")
    }),
    func: async ({ minOrderValue, leadTimeDays, targetDaysOfSupply }) => {
      try {
        const rawInventory = await db.loadInventory();
        const inventory = rawInventory.map((item) => enrichInventoryItem(item));
        const transactions = await db.loadTransactions(60);
        const drugStats = /* @__PURE__ */ new Map();
        for (const txn of transactions) {
          if (txn.action === "USE") {
            const txnDate = new Date(txn.timestamp);
            const daysAgo = (Date.now() - txnDate.getTime()) / (1e3 * 60 * 60 * 24);
            const qty = Math.abs(txn.qtyChange);
            const existing = drugStats.get(txn.drugId) || { usage30: 0, usage60: 0, trend: "stable" };
            if (daysAgo <= 30) {
              existing.usage30 += qty;
            }
            existing.usage60 += qty;
            drugStats.set(txn.drugId, existing);
          }
        }
        for (const [drugId, stats] of drugStats.entries()) {
          const recent30 = stats.usage30;
          const previous30 = stats.usage60 - stats.usage30;
          if (recent30 > previous30 * 1.2) {
            stats.trend = "increasing";
          } else if (recent30 < previous30 * 0.8) {
            stats.trend = "decreasing";
          } else {
            stats.trend = "stable";
          }
        }
        const recommendations = [];
        for (const item of inventory) {
          const stats = drugStats.get(item.drugId);
          if (!stats) continue;
          const avgDailyUsage = stats.usage30 / 30;
          const usageDuringLeadTime = avgDailyUsage * leadTimeDays;
          const reorderPoint = item.safetyStock + usageDuringLeadTime;
          if (item.qtyOnHand >= reorderPoint * 1.2) continue;
          let targetStock = Math.max(
            item.safetyStock * 2,
            avgDailyUsage * targetDaysOfSupply
          );
          if (stats.trend === "increasing") {
            targetStock *= 1.2;
          } else if (stats.trend === "decreasing") {
            targetStock *= 0.9;
          }
          const orderQty = Math.max(0, Math.ceil(targetStock - item.qtyOnHand));
          if (orderQty === 0) continue;
          const unitPrice = item.category === "controlled" ? 50 : item.category === "refrigerated" ? 30 : 10;
          const orderValue = orderQty * unitPrice;
          if (orderValue < minOrderValue) continue;
          const packSize = 50;
          const packs = Math.ceil(orderQty / packSize);
          const finalOrderQty = packs * packSize;
          const finalOrderValue = finalOrderQty * unitPrice;
          const daysUntilStockout = avgDailyUsage > 0 ? item.qtyOnHand / avgDailyUsage : 999;
          const urgency = item.qtyOnHand === 0 ? "CRITICAL" : daysUntilStockout <= leadTimeDays ? "HIGH" : item.qtyOnHand < reorderPoint ? "MEDIUM" : "LOW";
          recommendations.push({
            drugId: item.drugId,
            drugName: item.drugName,
            category: item.category,
            location: item.location,
            currentStock: item.qtyOnHand,
            safetyStock: item.safetyStock,
            reorderPoint: Math.ceil(reorderPoint),
            avgDailyUsage: avgDailyUsage.toFixed(2),
            daysUntilStockout: Math.floor(daysUntilStockout),
            trend: stats.trend,
            trendAdjustment: stats.trend === "increasing" ? "+20%" : stats.trend === "decreasing" ? "-10%" : "none",
            recommendation: {
              orderQty: finalOrderQty,
              packs,
              packSize,
              unitPrice: unitPrice.toFixed(2),
              orderValue: finalOrderValue.toFixed(2),
              urgency,
              targetStock: Math.ceil(targetStock),
              willProvide: `${Math.floor(finalOrderQty / avgDailyUsage)} days of supply`
            },
            reasoning: urgency === "CRITICAL" ? "OUT OF STOCK - Emergency order required" : urgency === "HIGH" ? `Will run out in ${Math.floor(daysUntilStockout)} days (lead time: ${leadTimeDays} days)` : urgency === "MEDIUM" ? `Below reorder point of ${Math.ceil(reorderPoint)}` : "Approaching reorder point",
            supplierNotes: [
              urgency === "CRITICAL" || urgency === "HIGH" ? "Request expedited delivery" : null,
              item.category === "controlled" ? "Controlled substance - requires authorization" : null,
              item.category === "refrigerated" ? "Refrigerated item - cold chain required" : null,
              stats.trend === "increasing" ? "Usage trending up - consider higher par levels" : null,
              finalOrderValue > 1e3 ? "High-value order - verify bulk discount availability" : null
            ].filter(Boolean)
          });
        }
        if (recommendations.length === 0) {
          return JSON.stringify({
            found: false,
            minOrderValue,
            leadTimeDays,
            targetDaysOfSupply,
            message: "No reorder recommendations at this time",
            note: "All items adequately stocked or below minimum order value threshold",
            alertLevel: "info"
          });
        }
        const urgencyOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        recommendations.sort((a, b) => {
          const urgencyDiff = urgencyOrder[a.recommendation.urgency] - urgencyOrder[b.recommendation.urgency];
          if (urgencyDiff !== 0) return urgencyDiff;
          return parseFloat(b.recommendation.orderValue) - parseFloat(a.recommendation.orderValue);
        });
        const totalValue = recommendations.reduce((sum, r) => sum + parseFloat(r.recommendation.orderValue), 0);
        const critical = recommendations.filter((r) => r.recommendation.urgency === "CRITICAL");
        const high = recommendations.filter((r) => r.recommendation.urgency === "HIGH");
        const medium = recommendations.filter((r) => r.recommendation.urgency === "MEDIUM");
        const controlled = recommendations.filter((r) => r.category === "controlled");
        const increasing = recommendations.filter((r) => r.trend === "increasing");
        const alertLevel = critical.length > 0 ? "critical" : high.length > 0 ? "warning" : "info";
        return JSON.stringify({
          found: true,
          minOrderValue,
          leadTimeDays,
          targetDaysOfSupply,
          summary: {
            totalRecommendations: recommendations.length,
            estimatedTotalValue: totalValue.toFixed(2),
            avgOrderValue: (totalValue / recommendations.length).toFixed(2),
            byUrgency: {
              critical: critical.length,
              high: high.length,
              medium: medium.length,
              low: recommendations.length - critical.length - high.length - medium.length
            },
            byTrend: {
              increasing: increasing.length,
              decreasing: recommendations.filter((r) => r.trend === "decreasing").length,
              stable: recommendations.filter((r) => r.trend === "stable").length
            },
            controlledSubstances: controlled.length,
            uniqueLocations: new Set(recommendations.map((r) => r.location)).size
          },
          alertLevel,
          alertMessage: critical.length > 0 ? `${critical.length} critical reorder(s) + ${high.length} high priority` : high.length > 0 ? `${high.length} high-priority reorder(s) recommended` : `${recommendations.length} reorder recommendation(s)`,
          recommendations: recommendations.slice(0, 50).map((rec, index) => ({
            rank: index + 1,
            drugName: rec.drugName,
            category: rec.category,
            location: rec.location,
            urgency: rec.recommendation.urgency,
            orderQty: rec.recommendation.orderQty,
            packs: rec.recommendation.packs,
            orderValue: rec.recommendation.orderValue,
            daysOfSupply: rec.recommendation.willProvide,
            currentStock: rec.currentStock,
            daysUntilStockout: rec.daysUntilStockout,
            trend: rec.trend,
            reasoning: rec.reasoning
          })),
          orderingStrategy: {
            immediate: critical.length + high.length > 0 ? {
              items: critical.length + high.length,
              value: [...critical, ...high].reduce((sum, r) => sum + parseFloat(r.recommendation.orderValue), 0).toFixed(2),
              action: "Place orders immediately - expedite delivery",
              note: "These items will run out before or during lead time"
            } : void 0,
            thisWeek: medium.length > 0 ? {
              items: medium.length,
              value: medium.reduce((sum, r) => sum + parseFloat(r.recommendation.orderValue), 0).toFixed(2),
              action: "Schedule orders within 3-5 days"
            } : void 0,
            consolidated: {
              totalItems: recommendations.length,
              totalValue: totalValue.toFixed(2),
              suggestion: totalValue > 5e3 ? "High-value consolidated order - negotiate bulk discount" : "Standard consolidated purchase order"
            }
          },
          trendAnalysis: increasing.length > 0 ? {
            increasingUsageDrugs: increasing.length,
            note: `${increasing.length} drug(s) showing increased usage (20%+ growth)`,
            recommendation: "Consider increasing par levels and safety stock for these items",
            items: increasing.slice(0, 10).map((r) => ({
              drugName: r.drugName,
              increase: r.trendAdjustment
            }))
          } : void 0,
          controlledSubstances: controlled.length > 0 ? {
            count: controlled.length,
            totalValue: controlled.reduce((sum, r) => sum + parseFloat(r.recommendation.orderValue), 0).toFixed(2),
            items: controlled.map((r) => ({
              drugName: r.drugName,
              orderQty: r.recommendation.orderQty,
              orderValue: r.recommendation.orderValue,
              urgency: r.recommendation.urgency
            })),
            warning: "Controlled substances require special authorization and documentation"
          } : void 0,
          economicOptimization: [
            {
              strategy: "Pack Size Optimization",
              description: "All quantities rounded to pack sizes for cost efficiency",
              savings: "Eliminates partial pack charges"
            },
            {
              strategy: "Trend-Based Adjustment",
              description: `${increasing.length} increasing-use items get 20% extra supply`,
              benefit: "Prevents future stockouts as demand grows"
            },
            {
              strategy: "Consolidated Ordering",
              description: `${recommendations.length} items in single order`,
              benefit: totalValue > 5e3 ? "Potential bulk discount available" : "Reduced ordering costs"
            }
          ],
          recommendations_list: [
            critical.length > 0 && `URGENT: ${critical.length} critical item(s) out of stock`,
            high.length > 0 && `${high.length} item(s) will run out during lead time - order immediately`,
            increasing.length > 3 && `${increasing.length} items showing increased usage - review par levels`,
            controlled.length > 0 && `${controlled.length} controlled substance(s) - ensure authorization`,
            totalValue > 1e4 && `High-value order ($${totalValue.toFixed(2)}) - negotiate volume discount`,
            "Use consolidated PO to reduce procurement overhead",
            "Monitor usage trends monthly to optimize reorder points"
          ].filter(Boolean),
          actions: ["generate_po", "contact_suppliers", "request_quotes", "schedule_delivery", "export_to_excel"],
          note: recommendations.length > 50 ? `Showing top 50 of ${recommendations.length} recommendations. Export for full list.` : "Complete reorder recommendations displayed.",
          reportDate: (/* @__PURE__ */ new Date()).toISOString()
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error generating reorder recommendations: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
  });
}

// src/tools/procurement/estimateOrderValue.ts
var import_tools26 = require("@langchain/core/tools");
var import_zod27 = require("zod");
function createEstimateOrderValueTool(db) {
  return new import_tools26.DynamicStructuredTool({
    name: "estimate_order_value",
    description: `
Estimate total cost for ordering drugs.
Useful for budget planning and procurement cost analysis.

Use this for queries like:
- "How much to order 500 units of Propofol?"
- "Estimate cost for drug X"
- "Order value for controlled substances"
- "Budget estimate for restocking ICU"
    `.trim(),
    schema: import_zod27.z.object({
      drugName: import_zod27.z.string().optional().describe("Specific drug name (optional)"),
      quantity: import_zod27.z.number().int().min(1).optional().describe("Quantity to order (optional)"),
      category: import_zod27.z.string().optional().describe("Category: controlled, refrigerated, or standard (optional)"),
      location: import_zod27.z.string().optional().describe("Location to restock (optional)")
    }),
    func: async ({ drugName, quantity, category, location }) => {
      try {
        const rawInventory = await db.loadInventory();
        const inventory = rawInventory.map((item) => enrichInventoryItem(item));
        let items = inventory;
        if (drugName) {
          items = items.filter(
            (item) => item.drugName.toLowerCase().includes(drugName.toLowerCase())
          );
        }
        if (category) {
          items = items.filter(
            (item) => item.category.toLowerCase() === category.toLowerCase()
          );
        }
        if (location) {
          items = items.filter(
            (item) => item.location.toLowerCase().includes(location.toLowerCase())
          );
        }
        if (items.length === 0) {
          return JSON.stringify({
            found: false,
            drugName,
            quantity,
            category,
            location,
            message: "No matching items found",
            suggestion: "Check search criteria and try again"
          });
        }
        const basePrices = {
          controlled: 50,
          refrigerated: 30,
          standard: 10
        };
        const getUnitPrice = (qty, basePrice) => {
          if (qty >= 1e3) return basePrice * 0.85;
          if (qty >= 500) return basePrice * 0.9;
          if (qty >= 200) return basePrice * 0.95;
          return basePrice;
        };
        const calculateShipping = (totalValue, itemCount) => {
          if (totalValue > 5e3) return 0;
          if (totalValue > 2e3) return 50;
          return Math.max(25, itemCount * 5);
        };
        if (drugName && quantity && items.length > 0) {
          const item = items[0];
          const basePrice = basePrices[item.category] || basePrices.standard;
          const unitPrice = getUnitPrice(quantity, basePrice);
          const subtotal2 = quantity * unitPrice;
          const shipping2 = calculateShipping(subtotal2, 1);
          const total2 = subtotal2 + shipping2;
          const packSize = 50;
          const packs = Math.ceil(quantity / packSize);
          const roundedQty = packs * packSize;
          const roundedSubtotal = roundedQty * unitPrice;
          const roundedTotal = roundedSubtotal + shipping2;
          return JSON.stringify({
            found: true,
            estimateType: "specific_order",
            drugName: item.drugName,
            category: item.category,
            location: item.location,
            requestedOrder: {
              quantity,
              unitPrice: unitPrice.toFixed(2),
              subtotal: subtotal2.toFixed(2),
              shipping: shipping2.toFixed(2),
              total: total2.toFixed(2)
            },
            optimizedOrder: {
              note: "Rounded to pack size for cost efficiency",
              packs,
              packSize,
              quantity: roundedQty,
              unitPrice: unitPrice.toFixed(2),
              subtotal: roundedSubtotal.toFixed(2),
              shipping: shipping2.toFixed(2),
              total: roundedTotal.toFixed(2),
              savings: roundedQty > quantity ? `Adding ${roundedQty - quantity} units costs only $${((roundedQty - quantity) * unitPrice).toFixed(2)} more` : "Optimal quantity"
            },
            discountApplied: quantity >= 200 ? {
              tier: quantity >= 1e3 ? "1000+ units" : quantity >= 500 ? "500+ units" : "200+ units",
              discount: quantity >= 1e3 ? "15%" : quantity >= 500 ? "10%" : "5%",
              saved: (quantity * basePrice * (quantity >= 1e3 ? 0.15 : quantity >= 500 ? 0.1 : 0.05)).toFixed(2)
            } : void 0,
            breakdown: {
              basePrice: basePrice.toFixed(2),
              discountedPrice: unitPrice.toFixed(2),
              packOptimization: roundedQty > quantity ? `+${roundedQty - quantity} units to complete pack` : "Already optimal",
              shippingMethod: shipping2 === 0 ? "FREE (order > $5000)" : shipping2 === 50 ? "Flat rate (order > $2000)" : "Standard shipping"
            },
            specialNotes: [
              item.category === "controlled" && "Controlled substance - requires DEA authorization",
              item.category === "refrigerated" && "Refrigerated item - cold chain shipping (+$20)",
              quantity >= 500 && "Large order - verify supplier stock availability",
              total2 > 1e4 && "High-value order - consider payment terms negotiation"
            ].filter(Boolean),
            actions: ["request_formal_quote", "check_supplier_availability", "generate_po"]
          }, null, 2);
        }
        const estimates = items.map((item) => {
          const estimatedQty = Math.max(item.safetyStock * 2, 100);
          const basePrice = basePrices[item.category] || basePrices.standard;
          const unitPrice = getUnitPrice(estimatedQty, basePrice);
          const lineTotal = estimatedQty * unitPrice;
          return {
            drugName: item.drugName,
            category: item.category,
            location: item.location,
            estimatedQty,
            unitPrice: unitPrice.toFixed(2),
            lineTotal: lineTotal.toFixed(2)
          };
        });
        const subtotal = estimates.reduce((sum, e) => sum + parseFloat(e.lineTotal), 0);
        const shipping = calculateShipping(subtotal, estimates.length);
        const total = subtotal + shipping;
        const byCategory = /* @__PURE__ */ new Map();
        for (const est of estimates) {
          const existing = byCategory.get(est.category) || [];
          existing.push(est);
          byCategory.set(est.category, existing);
        }
        const categorySummary = Array.from(byCategory.entries()).map(([cat, items2]) => ({
          category: cat,
          itemCount: items2.length,
          totalValue: items2.reduce((sum, i) => sum + parseFloat(i.lineTotal), 0).toFixed(2)
        }));
        return JSON.stringify({
          found: true,
          estimateType: category ? "category_estimate" : location ? "location_estimate" : "bulk_estimate",
          category,
          location,
          summary: {
            totalItems: estimates.length,
            estimatedSubtotal: subtotal.toFixed(2),
            estimatedShipping: shipping.toFixed(2),
            estimatedTotal: total.toFixed(2),
            note: "Estimates based on 2-month supply for each item"
          },
          byCategory: categorySummary,
          itemEstimates: estimates.slice(0, 50).map((est, index) => ({
            rank: index + 1,
            drugName: est.drugName,
            category: est.category,
            location: est.location,
            quantity: est.estimatedQty,
            unitPrice: est.unitPrice,
            lineTotal: est.lineTotal
          })),
          potentialSavings: {
            volumeDiscounts: subtotal > 1e4 ? `Potential 15% bulk discount: Save $${(subtotal * 0.15).toFixed(2)}` : subtotal > 5e3 ? `Potential 10% bulk discount: Save $${(subtotal * 0.1).toFixed(2)}` : "Order more for volume discounts",
            freeShipping: shipping > 0 && subtotal < 5e3 ? `Order $${(5e3 - subtotal).toFixed(2)} more for free shipping (save $${shipping.toFixed(2)})` : shipping === 0 ? "Free shipping applied" : null,
            consolidatedOrdering: estimates.length > 10 ? "Consolidated order reduces per-item overhead costs" : null
          },
          budgetGuidance: {
            immediate: total.toFixed(2),
            quarterly: (total * 1.5).toFixed(2),
            // 50% buffer
            annual: (total * 6).toFixed(2),
            // Assumes 2-month orders
            note: "Annual estimate assumes current usage patterns continue"
          },
          recommendations: [
            subtotal > 1e4 && "Request volume discount quote from suppliers",
            shipping > 50 && subtotal < 5e3 && `Add $${(5e3 - subtotal).toFixed(2)} to order for free shipping`,
            estimates.length > 20 && "Consider supplier consolidation for better pricing",
            categorySummary.find((c) => c.category === "controlled") && "Controlled substances may have different payment terms",
            "Compare prices across multiple suppliers for best value",
            "Negotiate payment terms for orders over $10,000"
          ].filter(Boolean),
          supplierNotes: [
            {
              supplierType: "Primary Pharmaceutical Distributor",
              advantages: "Best for bulk standard drugs, established terms",
              recommendedFor: "Standard category items"
            },
            {
              supplierType: "Specialty Controlled Substance Supplier",
              advantages: "DEA licensed, secure handling",
              recommendedFor: "Controlled substances"
            },
            {
              supplierType: "Cold Chain Specialist",
              advantages: "Temperature-controlled logistics",
              recommendedFor: "Refrigerated items"
            }
          ],
          actions: ["request_quotes", "compare_suppliers", "schedule_procurement_meeting", "export_estimate"],
          note: estimates.length > 50 ? `Showing first 50 of ${estimates.length} items. Export full estimate for complete breakdown.` : "Complete cost estimate provided.",
          disclaimer: "Estimates based on current pricing tiers. Actual costs may vary. Request formal quote for accurate pricing.",
          reportDate: (/* @__PURE__ */ new Date()).toISOString()
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error estimating order value: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
  });
}

// src/tools/index.ts
function createAllTools(config) {
  const { db, userRole, userId } = config;
  const tools = [
    // ============================================================
    // INVENTORY MANAGEMENT (7 tools) - ✅ ALL IMPLEMENTED
    // ============================================================
    createLookupInventoryTool(db),
    createUpdateInventoryTool(db, userRole, userId),
    createListWardStockTool(db),
    createGetFullInventoryTool(db),
    createGetLocationListTool(db),
    createManageUserAccessTool(db, userRole, userId),
    createGetTransactionHistoryTool(db),
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
    createEstimateOrderValueTool(db)
  ];
  return tools;
}
function getToolByName(tools, name) {
  return tools.find((tool) => tool.name === name);
}
function getToolsByCategory(tools, category) {
  const categoryMap = {
    inventory: [
      "lookup_inventory",
      "update_inventory",
      "list_ward_stock",
      "get_full_inventory",
      "get_location_list",
      "manage_user_access",
      "get_transaction_history"
    ],
    forecasting: [
      "get_forecast_ml",
      "calculate_safety_stock",
      "recalculate_all_safety_stocks",
      "detect_seasonal_patterns",
      "predict_stockout_date",
      "analyze_usage_trends"
    ],
    expiry: [
      "check_expiring_drugs",
      "get_fefo_recommendations",
      "get_batch_report",
      "get_expired_items_report"
    ],
    analytics: [
      "get_top_movers_report",
      "get_slow_movers_report",
      "get_stockout_risk_report",
      "get_usage_analytics",
      "get_shortage_alerts",
      "get_restock_recommendation"
    ],
    procurement: [
      "generate_purchase_order",
      "get_reorder_recommendations",
      "estimate_order_value"
    ]
  };
  const toolNames = categoryMap[category] || [];
  return tools.filter((tool) => toolNames.includes(tool.name));
}
function getToolsByPermission(tools, userRole) {
  const nurseTools = [
    "lookup_inventory",
    "list_ward_stock",
    "get_full_inventory",
    "get_location_list",
    "check_expiring_drugs",
    "get_fefo_recommendations",
    "get_batch_report",
    "get_expired_items_report"
  ];
  const pharmacistTools = [
    ...nurseTools,
    "update_inventory",
    "get_transaction_history",
    "get_forecast_ml",
    "calculate_safety_stock",
    "recalculate_all_safety_stocks",
    "detect_seasonal_patterns",
    "predict_stockout_date",
    "analyze_usage_trends",
    "get_batch_report",
    "get_expired_items_report",
    "get_top_movers_report",
    "get_slow_movers_report",
    "get_stockout_risk_report",
    "get_usage_analytics",
    "get_shortage_alerts",
    "get_restock_recommendation",
    "generate_purchase_order",
    "get_reorder_recommendations",
    "estimate_order_value"
  ];
  const masterTools = [
    ...pharmacistTools,
    "manage_user_access"
  ];
  const allowedTools = userRole === "Master" ? masterTools : userRole === "Pharmacist" ? pharmacistTools : nurseTools;
  return tools.filter((tool) => allowedTools.includes(tool.name));
}

// src/utils/formatters.ts
function determineDetailLevel(drugName, userRole, queryType, status) {
  if (drugName && CONTROLLED_SUBSTANCES.some(
    (cs) => drugName.toLowerCase().includes(cs.toLowerCase())
  )) {
    return "audit";
  }
  if (status === "stockout" || status === "expired" || status === "critical") {
    return "full";
  }
  if (["generate_po", "restock", "forecast", "audit", "report"].includes(queryType)) {
    return "full";
  }
  if (userRole === "Master") return "full";
  if (userRole === "Pharmacist") return "standard";
  if (userRole === "Nurse") return "summary";
  return "standard";
}
function formatInventoryLookup(drugName, items, userRole) {
  const totalQty = items.reduce((sum, item) => sum + item.qtyOnHand, 0);
  const hasAlert = items.some((item) => item.status === "low" || item.status === "stockout");
  const isControlled = CONTROLLED_SUBSTANCES.some(
    (cs) => drugName.toLowerCase().includes(cs.toLowerCase())
  );
  const detailLevel = determineDetailLevel(drugName, userRole, "lookup_drug");
  let alertLevel;
  let alertMessage;
  const stockouts = items.filter((i) => i.status === "stockout").length;
  const lowStock = items.filter((i) => i.status === "low").length;
  if (stockouts > 0) {
    alertLevel = "critical";
    alertMessage = `${stockouts} location(s) out of stock`;
  } else if (lowStock > 0) {
    alertLevel = "warning";
    alertMessage = `${lowStock} location(s) below safety stock`;
  }
  return {
    type: "inventory_lookup",
    detailLevel,
    summary: `${drugName}: ${totalQty} units across ${items.length} location(s)`,
    alert: alertLevel ? { level: alertLevel, message: alertMessage } : void 0,
    data: {
      drug: drugName,
      totalQty,
      category: isControlled ? "controlled" : "standard",
      locations: items.map((item) => ({
        name: item.location,
        qty: item.qtyOnHand,
        status: item.status,
        expiry: formatDateReadable(item.expiryDate),
        daysUntilExpiry: item.daysRemaining,
        batch: item.batchLot,
        safetyStock: item.safetyStock,
        avgDailyUse: item.avgDailyUse,
        daysOfStock: item.avgDailyUse > 0 ? Math.round(item.qtyOnHand / item.avgDailyUse * 10) / 10 : null
      }))
    },
    recommendations: hasAlert ? [`Consider restocking locations with low stock`] : void 0,
    actions: ["view_details", "generate_forecast", "create_po"],
    followUp: hasAlert ? `Would you like to restock the low-stock locations?` : `Would you like to see a forecast for ${drugName}?`
  };
}
function formatForecast(forecast) {
  return {
    type: "forecast",
    detailLevel: "full",
    summary: `${forecast.drugName}: ${forecast.totalForecast.toFixed(0)} units needed over 7 days`,
    alert: forecast.status === "critical" ? { level: "critical", message: `Projected shortage of ${Math.abs(forecast.projectedGap).toFixed(0)} units` } : forecast.status === "warning" ? { level: "warning", message: `Stock may run low` } : void 0,
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
        range: `${Math.round(f.lower)}-${Math.round(f.upper)}`
      }))
    },
    forecast,
    recommendations: [forecast.recommendation],
    actions: ["create_po", "view_trends", "export_report"],
    followUp: forecast.status !== "adequate" ? `Would you like to generate a purchase order?` : void 0
  };
}
function formatPurchaseOrder(po) {
  return {
    type: "purchase_order",
    detailLevel: "full",
    summary: `${po.poNumber}: ${po.lineItems.length} items, ${po.totalUnits} units`,
    alert: po.urgentCount > 0 ? { level: "warning", message: `${po.urgentCount} urgent item(s) - order within 48hrs` } : void 0,
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
        cost: item.estimatedCost
      })),
      summary: {
        totalItems: po.lineItems.length,
        totalUnits: po.totalUnits,
        urgentCount: po.urgentCount,
        estimatedValue: po.estimatedValue
      }
    },
    recommendations: [
      po.urgentCount > 0 ? `${po.urgentCount} item(s) marked urgent - prioritize ordering` : "All items are standard priority"
    ],
    actions: ["download_pdf", "download_csv", "email_to_team", "approve_po"],
    documentId: po.poNumber,
    documentFormats: ["pdf", "csv"],
    followUp: "Would you like to download or email this purchase order?"
  };
}
function formatExpiryReport(items, days) {
  const critical = items.filter((i) => i.urgency === "critical");
  const warning = items.filter((i) => i.urgency === "warning");
  const notice = items.filter((i) => i.urgency === "notice");
  const totalValue = items.reduce((sum, i) => sum + i.estimatedValue, 0);
  return {
    type: "expiry_report",
    detailLevel: "full",
    summary: `${items.length} item(s) expiring within ${days} days`,
    alert: critical.length > 0 ? { level: "critical", message: `${critical.length} item(s) expire within 7 days` } : warning.length > 0 ? { level: "warning", message: `${warning.length} item(s) expire within 30 days` } : void 0,
    data: {
      periodDays: days,
      totalItems: items.length,
      totalValueAtRisk: totalValue,
      byUrgency: {
        critical: critical.length,
        warning: warning.length,
        notice: notice.length
      },
      items: items.slice(0, 20).map((item) => ({
        drug: item.drugName,
        location: item.location,
        qty: item.qtyOnHand,
        batch: item.batchLot,
        expiry: formatDateReadable(item.expiryDate),
        daysUntilExpiry: item.daysUntilExpiry,
        urgency: item.urgency,
        value: item.estimatedValue
      }))
    },
    recommendations: [
      critical.length > 0 ? `Prioritize using ${critical.length} critical item(s) immediately` : "",
      `Total value at risk: $${totalValue.toFixed(2)}`
    ].filter(Boolean),
    actions: ["view_fefo", "download_report", "contact_supplier"],
    documentFormats: ["pdf"],
    followUp: critical.length > 0 ? "Would you like FEFO recommendations for the critical items?" : void 0
  };
}
function formatStockoutRisk(risks) {
  const critical = risks.filter((r) => r.riskLevel === "CRITICAL");
  const high = risks.filter((r) => r.riskLevel === "HIGH");
  const medium = risks.filter((r) => r.riskLevel === "MEDIUM");
  return {
    type: "analytics",
    detailLevel: "full",
    summary: `${critical.length} critical, ${high.length} high, ${medium.length} medium risk items`,
    alert: critical.length > 0 ? { level: "critical", message: `${critical.length} item(s) at critical stockout risk` } : high.length > 0 ? { level: "warning", message: `${high.length} item(s) at high stockout risk` } : void 0,
    data: {
      byRiskLevel: {
        critical: critical.length,
        high: high.length,
        medium: medium.length,
        low: risks.filter((r) => r.riskLevel === "LOW").length
      },
      items: risks.slice(0, 15).map((r) => ({
        drug: r.drugName,
        location: r.location,
        currentStock: r.currentStock,
        avgDailyUse: r.avgDailyUse,
        daysRemaining: r.daysRemaining,
        riskLevel: r.riskLevel,
        riskScore: r.riskScore,
        recommendation: r.recommendation
      }))
    },
    recommendations: critical.map((c) => c.recommendation),
    actions: ["generate_po", "view_forecasts", "download_report"],
    followUp: critical.length > 0 ? "Would you like to generate a purchase order for critical items?" : void 0
  };
}
function formatTopMovers(movers, periodDays) {
  return {
    type: "analytics",
    detailLevel: "standard",
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
        status: m.status
      }))
    },
    actions: ["download_report", "view_trends"],
    documentFormats: ["csv", "pdf"]
  };
}
function formatError(message, details) {
  return {
    type: "error",
    detailLevel: "summary",
    summary: message,
    alert: {
      level: "critical",
      message
    },
    data: {
      error: message,
      details
    },
    actions: ["retry", "contact_support"]
  };
}
function formatAccessDenied(action, requiredRole) {
  return {
    type: "error",
    detailLevel: "summary",
    summary: `Access denied. ${action} requires ${requiredRole} authorization.`,
    alert: {
      level: "critical",
      message: `Insufficient permissions`
    },
    data: {
      action,
      requiredRole
    },
    actions: ["request_access"]
  };
}

// src/classifier/queryClassifier.ts
var DIRECT_DB_PATTERNS = [
  // Drug lookups
  { pattern: /^where\s+is\s+(.+?)[\?\s]*$/i, intent: "lookup_drug", extractors: { drugName: 1 } },
  { pattern: /^find\s+(.+?)[\?\s]*$/i, intent: "lookup_drug", extractors: { drugName: 1 } },
  { pattern: /^show\s+(.+?)\s+stock[\?\s]*$/i, intent: "lookup_drug", extractors: { drugName: 1 } },
  { pattern: /^(.+?)\s+stock[\?\s]*$/i, intent: "lookup_drug", extractors: { drugName: 1 } },
  { pattern: /^how\s+much\s+(.+?)[\?\s]*$/i, intent: "lookup_drug", extractors: { drugName: 1 } },
  { pattern: /^check\s+(.+?)[\?\s]*$/i, intent: "lookup_drug", extractors: { drugName: 1 } },
  { pattern: /^(.+?)\s+quantity[\?\s]*$/i, intent: "lookup_drug", extractors: { drugName: 1 } },
  { pattern: /^(.+?)\s+levels?[\?\s]*$/i, intent: "lookup_drug", extractors: { drugName: 1 } },
  // Location lookups
  { pattern: /^(.+?)\s+in\s+(icu|er|pharmacy|ward|emergency|central)/i, intent: "lookup_location", extractors: { drugName: 1, location: 2 } },
  { pattern: /^(icu|er|pharmacy|ward|emergency|central).*\s+stock/i, intent: "lookup_location", extractors: { location: 1 } },
  { pattern: /^what'?s?\s+in\s+(icu|er|pharmacy|ward|emergency|central)/i, intent: "lookup_location", extractors: { location: 1 } },
  { pattern: /^(icu|er|pharmacy|ward|emergency|central).*\s+inventory/i, intent: "lookup_location", extractors: { location: 1 } },
  // List operations
  { pattern: /^show\s+(all\s+)?inventory/i, intent: "list_inventory" },
  { pattern: /^list\s+(all\s+)?drugs?/i, intent: "list_inventory" },
  { pattern: /^full\s+inventory/i, intent: "list_inventory" },
  // Expiry checks
  { pattern: /^what'?s?\s+expiring/i, intent: "expiring_drugs" },
  { pattern: /^expiring\s+(drugs?|items?|soon)/i, intent: "expiring_drugs" },
  { pattern: /^expiry\s+(report|check|list)/i, intent: "expiring_drugs" },
  { pattern: /^check\s+expir/i, intent: "expiring_drugs" },
  // Location list
  { pattern: /^list\s+(all\s+)?locations?/i, intent: "list_locations" },
  { pattern: /^show\s+(all\s+)?locations?/i, intent: "list_locations" },
  { pattern: /^where\s+are\s+drugs?\s+stored/i, intent: "list_locations" },
  // Stockout reports
  { pattern: /^stockouts?/i, intent: "stockout_report" },
  { pattern: /^out\s+of\s+stock/i, intent: "stockout_report" },
  { pattern: /^what'?s?\s+out/i, intent: "stockout_report" },
  { pattern: /^empty\s+stock/i, intent: "stockout_report" },
  // Low stock reports
  { pattern: /^low\s+stock/i, intent: "low_stock_report" },
  { pattern: /^below\s+safety/i, intent: "low_stock_report" },
  { pattern: /^critical\s+(stock|items?)/i, intent: "low_stock_report" },
  // Update operations (simple format)
  { pattern: /^add\s+(\d+)\s+(.+?)$/i, intent: "update_stock", extractors: { quantity: 1, drugName: 2 } },
  { pattern: /^update\s+(.+?)\s+to\s+(\d+)/i, intent: "update_stock", extractors: { drugName: 1, quantity: 2 } },
  { pattern: /^receive\s+(\d+)\s+(.+?)$/i, intent: "update_stock", extractors: { quantity: 1, drugName: 2 } }
];
var LLM_REQUIRED_PATTERNS = [
  // Reasoning queries
  /\bwhy\b/i,
  /\bshould\s+i\b/i,
  /\brecommend/i,
  /\banalyze\b/i,
  /\bcompare\b/i,
  /\bexplain\b/i,
  /\bhelp\s+me\s+understand\b/i,
  // Decision queries
  /\bwhat.*(best|optimal|better)\b/i,
  /\bhow.*(optimize|improve)\b/i,
  // Complex generation
  /\bgenerate.*order\b/i,
  /\bcreate.*(po|order)\b/i,
  /\bforecast\b/i,
  /\bpredict\b/i,
  // Multi-entity queries
  /\band\b.*\band\b/i,
  // Multiple "and"s suggest complex query
  // Contextual queries (require conversation history)
  /\bwhat\s+about\b/i,
  /\bthe\s+other\b/i,
  /\bsame\s+for\b/i
];
var ANALYTICS_KEYWORDS = [
  "forecast",
  "predict",
  "trend",
  "pattern",
  "usage",
  "consumption",
  "analysis",
  "analytics",
  "report",
  "top",
  "most used",
  "slow mover",
  "seasonal",
  "monthly",
  "weekly",
  "daily"
];
function classifyQuery(query) {
  const normalizedQuery = query.trim().toLowerCase();
  for (const { pattern, intent, extractors } of DIRECT_DB_PATTERNS) {
    const match = query.match(pattern);
    if (match) {
      const entities = {};
      if (extractors) {
        if (extractors.drugName && match[extractors.drugName]) {
          entities.drugName = match[extractors.drugName].trim();
        }
        if (extractors.location && match[extractors.location]) {
          entities.location = match[extractors.location].trim();
        }
        if (extractors.quantity && match[extractors.quantity]) {
          entities.quantity = parseInt(match[extractors.quantity], 10);
        }
      }
      return {
        route: "direct_db",
        intent,
        entities,
        confidence: 0.95,
        requiresLLM: false
      };
    }
  }
  for (const pattern of LLM_REQUIRED_PATTERNS) {
    if (pattern.test(normalizedQuery)) {
      return {
        route: "llm_required",
        intent: "complex",
        entities: {},
        confidence: 0.9,
        requiresLLM: true
      };
    }
  }
  if (ANALYTICS_KEYWORDS.some((kw) => normalizedQuery.includes(kw))) {
    return {
      route: "llm_required",
      intent: "analytics",
      entities: {},
      confidence: 0.85,
      requiresLLM: true
    };
  }
  const words = normalizedQuery.split(/\s+/);
  if (words.length <= 3 && !normalizedQuery.includes("?")) {
    return {
      route: "direct_db",
      intent: "fuzzy_lookup",
      entities: { drugName: normalizedQuery },
      confidence: 0.7,
      requiresLLM: false
    };
  }
  return {
    route: "llm_required",
    intent: "complex",
    entities: {},
    confidence: 0.5,
    requiresLLM: true
  };
}
function mustUseLLM(query, userRole) {
  const normalizedQuery = query.toLowerCase();
  if (userRole === "Nurse" && /\b(update|add|change|modify|delete)\b/i.test(query)) {
    return true;
  }
  if (normalizedQuery.includes(" and ") && normalizedQuery.includes(" then ")) {
    return true;
  }
  if (/\b(better|worse|more|less|versus|vs)\b/i.test(query)) {
    return true;
  }
  return false;
}
function estimateTokens(query, responseType) {
  const baseSystemPromptTokens = 400;
  const queryTokens = Math.ceil(query.length / 4);
  const outputEstimates = {
    inventory_lookup: 200,
    forecast: 350,
    purchase_order: 500,
    expiry_report: 300,
    analytics: 400,
    message: 150,
    error: 50
  };
  const inputTokens = baseSystemPromptTokens + queryTokens;
  const outputTokens = outputEstimates[responseType] || 200;
  const inputCost = inputTokens / 1e6 * 0.15;
  const outputCost = outputTokens / 1e6 * 0.6;
  return {
    inputTokens,
    outputTokens,
    estimatedCost: inputCost + outputCost
  };
}

// src/index.ts
var VERSION = "1.0.0";
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AuthManager,
  CONTROLLED_SUBSTANCES,
  CSVDatabaseAdapter,
  CachedDatabaseAdapter,
  DAY_OF_WEEK_FACTORS,
  PasswordHasher,
  ROLE_PERMISSIONS,
  VERSION,
  addDays,
  calculateDetailedTrend,
  calculateEWMA,
  calculateForecastAccuracy,
  calculateLinearRegression,
  calculateLinearTrend,
  calculateSafetyStock,
  calculateSafetyStockWilson,
  calculateStdDev,
  classifyABCXYZ,
  classifyQuery,
  createAllTools,
  createCalculateSafetyStockTool,
  createCheckExpiringDrugsTool,
  createGetForecastMlTool,
  createGetFullInventoryTool,
  createGetLocationListTool,
  createListWardStockTool,
  createLookupInventoryTool,
  createManageUserAccessTool,
  createUpdateInventoryTool,
  daysBetween,
  daysUntil,
  detectSeasonalPatterns,
  detectSeasonality,
  determineDetailLevel,
  estimateTokens,
  formatAccessDenied,
  formatDate,
  formatDateReadable,
  formatDateTime,
  formatError,
  formatExpiryReport,
  formatForecast,
  formatInventoryLookup,
  formatPurchaseOrder,
  formatStockoutRisk,
  formatTopMovers,
  generateDateRange,
  generateForecast,
  getCurrentTimestamp,
  getDayFactor,
  getDayName,
  getMonthName,
  getToolByName,
  getToolsByCategory,
  getToolsByPermission,
  isPast,
  mustUseLLM,
  predictStockoutDate,
  removeOutliers,
  smartDrugMatch
});
