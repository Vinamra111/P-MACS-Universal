/**
 * Test setup and utilities
 */

import type { DatabaseAdapter } from '../database/CSVAdapter.js';
import type { InventoryItem, Transaction, User, AccessLog, DrugInfo, LocationSummary } from '../types/index.js';
import { enrichInventoryItem } from '../database/models.js';

export const mockInventoryData: InventoryItem[] = [
  {
    drugId: 'PROP001',
    drugName: 'Propofol',
    location: 'ICU-Shelf-A',
    qtyOnHand: 50,
    expiryDate: '2026-12-31',
    batchLot: 'LOT-2024-001',
    safetyStock: 20,
    avgDailyUse: 5,
  },
  {
    drugId: 'MORPH001',
    drugName: 'Morphine',
    location: 'Pharmacy-Cabinet-B',
    qtyOnHand: 5,
    expiryDate: '2026-06-30',
    batchLot: 'LOT-2024-002',
    safetyStock: 15,
    avgDailyUse: 3,
  },
  {
    drugId: 'PARA001',
    drugName: 'Paracetamol',
    location: 'Ward-Storage-1',
    qtyOnHand: 200,
    expiryDate: '2027-12-31',
    batchLot: 'LOT-2024-003',
    safetyStock: 50,
    avgDailyUse: 10,
  },
  {
    drugId: 'PROP002',
    drugName: 'Propofol',
    location: 'ER-Cabinet-A',
    qtyOnHand: 0,
    expiryDate: '2026-12-31',
    batchLot: 'LOT-2024-004',
    safetyStock: 10,
    avgDailyUse: 4,
  },
  {
    drugId: 'INSUL001',
    drugName: 'Insulin',
    location: 'Pharmacy-Fridge-1',
    qtyOnHand: 30,
    expiryDate: '2026-03-15',
    batchLot: 'LOT-2024-005',
    safetyStock: 25,
    avgDailyUse: 2,
  },
];

export const mockTransactionData: Transaction[] = [
  {
    txnId: 'TXN001',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    userId: 'USR001',
    drugId: 'PROP001',
    action: 'USE',
    qtyChange: -10,
  },
  {
    txnId: 'TXN002',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    userId: 'USR001',
    drugId: 'PROP001',
    action: 'USE',
    qtyChange: -5,
  },
  {
    txnId: 'TXN003',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    userId: 'USR002',
    drugId: 'MORPH001',
    action: 'USE',
    qtyChange: -3,
  },
  {
    txnId: 'TXN004',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    userId: 'USR001',
    drugId: 'PROP001',
    action: 'RECEIVE',
    qtyChange: 50,
  },
  {
    txnId: 'TXN005',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    userId: 'USR001',
    drugId: 'PARA001',
    action: 'USE',
    qtyChange: -20,
  },
  // Additional USE transactions for analyzeUsageTrends (needs minimum 5 USE per drug)
  {
    txnId: 'TXN006',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    userId: 'USR001',
    drugId: 'PROP001',
    action: 'USE',
    qtyChange: -8,
  },
  {
    txnId: 'TXN007',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    userId: 'USR002',
    drugId: 'PROP001',
    action: 'USE',
    qtyChange: -6,
  },
  {
    txnId: 'TXN008',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
    userId: 'USR001',
    drugId: 'PROP001',
    action: 'USE',
    qtyChange: -7,
  },
  {
    txnId: 'TXN009',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    userId: 'USR002',
    drugId: 'MORPH001',
    action: 'USE',
    qtyChange: -2,
  },
  {
    txnId: 'TXN010',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    userId: 'USR001',
    drugId: 'MORPH001',
    action: 'USE',
    qtyChange: -4,
  },
  {
    txnId: 'TXN011',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString(),
    userId: 'USR002',
    drugId: 'MORPH001',
    action: 'USE',
    qtyChange: -3,
  },
  {
    txnId: 'TXN012',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    userId: 'USR001',
    drugId: 'MORPH001',
    action: 'USE',
    qtyChange: -2,
  },
];

export const mockUserData: User[] = [
  {
    empId: 'USR001',
    role: 'Pharmacist',
    status: 'Active',
    name: 'Dr. Smith',
    passwordHash: 'hash123',
    unifiedGroup: 'Pharmacy',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: '2024-01-15T08:00:00Z',
  },
  {
    empId: 'USR002',
    role: 'Nurse',
    status: 'Active',
    name: 'Nurse Johnson',
    passwordHash: 'hash456',
    unifiedGroup: 'ICU',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: '2024-01-14T10:00:00Z',
  },
  {
    empId: 'USR003',
    role: 'Master',
    status: 'Active',
    name: 'Admin Davis',
    passwordHash: 'hash789',
    unifiedGroup: 'Administration',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: '2024-01-15T09:00:00Z',
  },
];

export class MockDatabaseAdapter implements DatabaseAdapter {
  private inventory: InventoryItem[] = [...mockInventoryData];
  private transactions: Transaction[] = [...mockTransactionData];
  private users: User[] = [...mockUserData];
  private accessLogs: AccessLog[] = [];

  async loadInventory(): Promise<InventoryItem[]> {
    // Return enriched items so tools can access status, category, daysRemaining
    return this.inventory.map(item => enrichInventoryItem(item));
  }

  async saveInventory(items: InventoryItem[]): Promise<void> {
    this.inventory = [...items];
  }

  async searchInventory(drugName: string): Promise<DrugInfo[]> {
    const items = this.inventory.filter(item =>
      item.drugName.toLowerCase().includes(drugName.toLowerCase())
    );
    return items.map(item => enrichInventoryItem(item));
  }

  async getInventoryByLocation(location: string): Promise<DrugInfo[]> {
    const items = this.inventory.filter(item =>
      item.location.toLowerCase().includes(location.toLowerCase())
    );
    return items.map(item => enrichInventoryItem(item));
  }

  async updateInventoryItem(drugId: string, updates: Partial<InventoryItem>): Promise<InventoryItem | null> {
    const index = this.inventory.findIndex(item => item.drugId === drugId);
    if (index === -1) return null;

    this.inventory[index] = { ...this.inventory[index], ...updates };
    return this.inventory[index];
  }

  async getAllLocations(): Promise<LocationSummary[]> {
    const locationMap = new Map<string, LocationSummary>();

    for (const item of this.inventory) {
      const enriched = enrichInventoryItem(item);
      const existing = locationMap.get(item.location);

      if (existing) {
        existing.itemCount++;
        existing.totalQty += item.qtyOnHand;
        if (enriched.status === 'stockout') existing.stockoutCount++;
        if (enriched.status === 'low') existing.lowStockCount++;
      } else {
        locationMap.set(item.location, {
          location: item.location,
          itemCount: 1,
          totalQty: item.qtyOnHand,
          stockoutCount: enriched.status === 'stockout' ? 1 : 0,
          lowStockCount: enriched.status === 'low' ? 1 : 0,
        });
      }
    }

    return Array.from(locationMap.values());
  }

  async getExpiringItems(days: number): Promise<DrugInfo[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);

    return this.inventory
      .map(item => enrichInventoryItem(item))
      .filter(item => {
        const expiryDate = new Date(item.expiryDate);
        return expiryDate <= cutoffDate && expiryDate > new Date();
      })
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
  }

  async getExpiredItems(): Promise<DrugInfo[]> {
    return this.inventory
      .map(item => enrichInventoryItem(item))
      .filter(item => item.status === 'expired');
  }

  async getLowStockItems(): Promise<DrugInfo[]> {
    return this.inventory
      .map(item => enrichInventoryItem(item))
      .filter(item => item.qtyOnHand < item.safetyStock)
      .sort((a, b) => {
        if (a.status === 'stockout' && b.status !== 'stockout') return -1;
        if (b.status === 'stockout' && a.status !== 'stockout') return 1;
        const aRatio = a.qtyOnHand / a.safetyStock;
        const bRatio = b.qtyOnHand / b.safetyStock;
        return aRatio - bRatio;
      });
  }

  async loadUsers(): Promise<User[]> {
    return [...this.users];
  }

  async saveUsers(users: User[]): Promise<void> {
    this.users = [...users];
  }

  async getUserById(empId: string): Promise<User | null> {
    return this.users.find(user => user.empId === empId) || null;
  }

  async updateUser(empId: string, updates: Partial<User>): Promise<User | null> {
    const index = this.users.findIndex(user => user.empId === empId);
    if (index === -1) return null;

    this.users[index] = { ...this.users[index], ...updates };
    return this.users[index];
  }

  async loadTransactions(days?: number): Promise<Transaction[]> {
    if (!days) return [...this.transactions];

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.transactions.filter(txn => new Date(txn.timestamp) >= cutoffDate);
  }

  async addTransaction(txn: Transaction): Promise<void> {
    this.transactions.push(txn);
  }

  async getTransactionsForDrug(drugId: string, days: number = 90): Promise<Transaction[]> {
    const transactions = await this.loadTransactions(days);
    return transactions.filter(t => t.drugId === drugId);
  }

  async addAccessLog(log: AccessLog): Promise<void> {
    this.accessLogs.push(log);
  }

  async getAccessLogs(limit?: number): Promise<AccessLog[]> {
    if (limit) {
      return this.accessLogs.slice(-limit);
    }
    return [...this.accessLogs];
  }

  // Helper methods for testing
  reset() {
    this.inventory = [...mockInventoryData];
    this.transactions = [...mockTransactionData];
    this.users = [...mockUserData];
    this.accessLogs = [];
  }
}
