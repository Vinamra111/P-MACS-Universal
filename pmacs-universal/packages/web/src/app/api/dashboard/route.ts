import { NextRequest, NextResponse } from 'next/server';
import { CSVDatabaseAdapter } from '@pmacs/core';
import path from 'path';

// Initialize database adapter
const dataPath = path.join(process.cwd(), '../api/data');
const db = new CSVDatabaseAdapter(dataPath);

export async function GET(request: NextRequest) {
  try {
    // Get full inventory
    const inventory = await db.loadInventory();

    // Calculate statistics
    const totalItems = inventory.length;

    // Count low stock items (below safety stock)
    const lowStock = inventory.filter(item =>
      item.qtyOnHand < item.safetyStock && item.qtyOnHand > 0
    ).length;

    // Count stockouts
    const stockouts = inventory.filter(item => item.qtyOnHand === 0).length;

    // Count expiring soon (within 30 days)
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const expiringSoon = inventory.filter(item => {
      const expiryDate = new Date(item.expiryDate);
      return expiryDate >= today && expiryDate <= thirtyDaysFromNow;
    }).length;

    // Calculate total value (rough estimate)
    const estimatedValue = inventory.reduce((sum, item) => {
      let unitCost = 10; // default
      const drugName = item.drugName.toLowerCase();

      if (drugName.includes('morphine') || drugName.includes('fentanyl') ||
          drugName.includes('oxycodone')) {
        unitCost = 50; // controlled substances
      } else if (drugName.includes('propofol') || drugName.includes('insulin')) {
        unitCost = 30; // refrigerated
      }

      return sum + (item.qtyOnHand * unitCost);
    }, 0);

    // Get critical alerts count
    const criticalAlerts = inventory.filter(item => {
      const isStockout = item.qtyOnHand === 0;
      const isCriticallyLow = item.qtyOnHand > 0 && item.qtyOnHand < (item.safetyStock * 0.5);

      const expiryDate = new Date(item.expiryDate);
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(today.getDate() + 7);
      const isExpiringCritical = expiryDate >= today && expiryDate <= sevenDaysFromNow;

      return isStockout || isCriticallyLow || isExpiringCritical;
    }).length;

    return NextResponse.json({
      stats: {
        totalItems,
        lowStock,
        expiringSoon,
        stockouts,
        estimatedValue,
        criticalAlerts,
      },
      success: true,
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch dashboard data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
