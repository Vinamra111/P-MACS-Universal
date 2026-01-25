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

    // Calculate pharmacist-specific statistics
    // Field names MUST match PharmacistDashboard.tsx expectations:
    // - totalItems
    // - lowStock
    // - expiringSoon
    // - stockouts
    // - estimatedValue (optional)
    // - criticalAlerts

    const totalItems = inventory.length;

    // Count low stock items (below safety stock but not zero)
    const lowStock = inventory.filter(item =>
      item.qtyOnHand < item.safetyStock && item.qtyOnHand > 0
    ).length;

    // Count stockouts (zero quantity)
    const stockouts = inventory.filter(item => item.qtyOnHand === 0).length;

    // Count expiring soon (within 30 days)
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const expiringSoon = inventory.filter(item => {
      const expiryDate = new Date(item.expiryDate);
      return expiryDate >= today && expiryDate <= thirtyDaysFromNow;
    }).length;

    // Calculate estimated inventory value
    const estimatedValue = inventory.reduce((sum, item) => {
      let unitCost = 10; // default estimate
      const drugName = item.drugName.toLowerCase();

      // Higher cost for controlled substances
      if (drugName.includes('morphine') || drugName.includes('fentanyl') ||
          drugName.includes('oxycodone') || drugName.includes('hydrocodone')) {
        unitCost = 50;
      }
      // Moderate cost for refrigerated/specialty drugs
      else if (drugName.includes('propofol') || drugName.includes('insulin') ||
               drugName.includes('vaccine')) {
        unitCost = 30;
      }
      // Higher cost for antibiotics and specialty drugs
      else if (drugName.includes('vancomycin') || drugName.includes('meropenem')) {
        unitCost = 40;
      }

      return sum + (item.qtyOnHand * unitCost);
    }, 0);

    // Count critical alerts (stockouts + critically low + expiring within 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    const criticalAlerts = inventory.filter(item => {
      const isStockout = item.qtyOnHand === 0;
      const isCriticallyLow = item.qtyOnHand > 0 && item.qtyOnHand < (item.safetyStock * 0.5);

      const expiryDate = new Date(item.expiryDate);
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
    console.error('Pharmacist Dashboard API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch dashboard data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
