const path = require('path');
const { CSVDatabaseAdapter } = require('../core');

// Initialize database with CSV files
const dataPath = path.join(__dirname, '../../data');
const db = new CSVDatabaseAdapter(dataPath);

module.exports = async (req, res) => {
  try {
    // Get inventory data
    const inventory = await db.getFullInventory();

    // Calculate basic stats
    const totalItems = inventory.length;
    const lowStock = inventory.filter(item => {
      const qty = parseInt(item.quantity_available) || 0;
      const min = parseInt(item.minimum_stock_level) || 0;
      return qty < min;
    }).length;

    const expiringItems = inventory.filter(item => {
      if (!item.expiry_date) return false;
      const expiryDate = new Date(item.expiry_date);
      const today = new Date();
      const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 30; // Expiring within 30 days
    }).length;

    const outOfStock = inventory.filter(item => {
      const qty = parseInt(item.quantity_available) || 0;
      return qty === 0;
    }).length;

    // Return stats
    res.json({
      success: true,
      stats: {
        totalItems,
        lowStock,
        expiringItems,
        outOfStock
      }
    });
  } catch (error) {
    console.error('[NURSE-DASHBOARD] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data'
    });
  }
};
