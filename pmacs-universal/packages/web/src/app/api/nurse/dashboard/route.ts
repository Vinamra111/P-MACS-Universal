import { NextRequest, NextResponse } from 'next/server';
import { CSVDatabaseAdapter } from '@pmacs/core';
import path from 'path';

// Initialize database adapter
const dataPath = path.join(process.cwd(), '../api/data');
const db = new CSVDatabaseAdapter(dataPath);

export async function GET(request: NextRequest) {
  try {
    // TODO: Get current user from session/auth and filter by assigned ward
    // For now, showing all inventory (will add ward filtering when user model updated)

    // Get full inventory
    const inventory = await db.loadInventory();

    // Calculate ward-specific statistics
    // Field names MUST match NurseDashboard.tsx expectations:
    // - wardStock (NOT totalItems)
    // - expiringSoon
    // - lowStock
    // - locations

    const wardStock = inventory.length;

    // Count low stock items (below safety stock but not zero)
    const lowStock = inventory.filter(item =>
      item.qtyOnHand < item.safetyStock && item.qtyOnHand > 0
    ).length;

    // Count expiring soon (within 30 days)
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const expiringSoon = inventory.filter(item => {
      const expiryDate = new Date(item.expiryDate);
      return expiryDate >= today && expiryDate <= thirtyDaysFromNow && item.qtyOnHand > 0;
    }).length;

    // Get unique locations count
    const uniqueLocations = new Set(inventory.map(item => item.location));
    const locations = uniqueLocations.size;

    return NextResponse.json({
      stats: {
        wardStock,      // Total items in inventory
        expiringSoon,   // Items expiring within 30 days
        lowStock,       // Items below safety stock
        locations,      // Unique location count
      },
      success: true,
    });
  } catch (error) {
    console.error('Nurse Dashboard API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch dashboard data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
