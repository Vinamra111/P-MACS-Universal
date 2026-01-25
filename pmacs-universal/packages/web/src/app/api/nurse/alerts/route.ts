import { NextRequest, NextResponse } from 'next/server';
import { CSVDatabaseAdapter } from '@pmacs/core';
import path from 'path';

// Initialize database adapter
const dataPath = path.join(process.cwd(), '../api/data');
const db = new CSVDatabaseAdapter(dataPath);

export async function GET(request: NextRequest) {
  try {
    // TODO: Get current user from session/auth and filter by assigned ward
    // For now, showing all inventory alerts

    const inventory = await db.loadInventory();
    const today = new Date();

    const alerts = [];

    for (const item of inventory) {
      const expiryDate = new Date(item.expiryDate);
      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Stockout alert (CRITICAL)
      if (item.qtyOnHand === 0) {
        alerts.push({
          id: `stockout-${item.drugId}`,
          type: 'stockout',
          drug: item.drugName,
          location: item.location,
          severity: 'critical',
          message: 'OUT OF STOCK',
          quantity: 0,
        });
      }
      // Critical expiry (< 7 days) - only if stock exists
      else if (daysUntilExpiry > 0 && daysUntilExpiry <= 7) {
        alerts.push({
          id: `expiry-critical-${item.drugId}`,
          type: 'expiring',
          drug: item.drugName,
          location: item.location,
          severity: 'critical',
          message: `Expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}`,
          quantity: item.qtyOnHand,
        });
      }
      // Warning expiry (8-30 days) - only if stock exists
      else if (daysUntilExpiry > 7 && daysUntilExpiry <= 30) {
        alerts.push({
          id: `expiry-warning-${item.drugId}`,
          type: 'expiring',
          drug: item.drugName,
          location: item.location,
          severity: 'warning',
          message: `Expires in ${daysUntilExpiry} days`,
          quantity: item.qtyOnHand,
        });
      }
      // Low stock (below safety stock but not zero)
      else if (item.qtyOnHand > 0 && item.qtyOnHand < item.safetyStock) {
        const percentOfSafety = Math.round((item.qtyOnHand / item.safetyStock) * 100);
        alerts.push({
          id: `low-stock-${item.drugId}`,
          type: 'low-stock',
          drug: item.drugName,
          location: item.location,
          severity: percentOfSafety < 50 ? 'critical' : 'warning',
          message: `${item.qtyOnHand} units on hand (safety stock: ${item.safetyStock} units)`,
          quantity: item.qtyOnHand,
        });
      }
    }

    // Sort by severity (critical first), then by type priority
    alerts.sort((a, b) => {
      // Critical alerts first
      if (a.severity === 'critical' && b.severity !== 'critical') return -1;
      if (a.severity !== 'critical' && b.severity === 'critical') return 1;

      // Within same severity, sort by type priority
      const typePriority: Record<string, number> = { stockout: 0, expiring: 1, 'low-stock': 2 };
      return (typePriority[a.type] ?? 999) - (typePriority[b.type] ?? 999);
    });

    return NextResponse.json({
      alerts: alerts.slice(0, 20), // Return top 20 alerts
      success: true,
    });
  } catch (error) {
    console.error('Nurse Alerts API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch alerts',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
