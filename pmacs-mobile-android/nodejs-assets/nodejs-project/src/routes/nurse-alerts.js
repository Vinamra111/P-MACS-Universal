const path = require('path');
const { CSVDatabaseAdapter } = require('../core');

// Initialize database with CSV files
const dataPath = path.join(__dirname, '../../data');
const db = new CSVDatabaseAdapter(dataPath);

module.exports = async (req, res) => {
  try {
    // Get inventory data
    const inventory = await db.getFullInventory();
    const alerts = [];

    // Check for low stock items
    inventory.forEach(item => {
      const qty = parseInt(item.quantity_available) || 0;
      const min = parseInt(item.minimum_stock_level) || 0;

      if (qty === 0) {
        alerts.push({
          id: `out-${item.drug_id}`,
          type: 'critical',
          message: `${item.drug_name} is out of stock`,
          details: `Location: ${item.location}`,
          timestamp: new Date().toISOString()
        });
      } else if (qty < min) {
        alerts.push({
          id: `low-${item.drug_id}`,
          type: 'warning',
          message: `${item.drug_name} is running low`,
          details: `Current: ${qty}, Minimum: ${min} | Location: ${item.location}`,
          timestamp: new Date().toISOString()
        });
      }

      // Check for expiring items
      if (item.expiry_date) {
        const expiryDate = new Date(item.expiry_date);
        const today = new Date();
        const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays <= 30) {
          alerts.push({
            id: `expiry-${item.drug_id}`,
            type: diffDays <= 7 ? 'critical' : 'warning',
            message: `${item.drug_name} expiring in ${diffDays} days`,
            details: `Expiry: ${item.expiry_date} | Location: ${item.location}`,
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    // Sort alerts by type (critical first) and limit to recent ones
    alerts.sort((a, b) => {
      if (a.type === 'critical' && b.type !== 'critical') return -1;
      if (a.type !== 'critical' && b.type === 'critical') return 1;
      return 0;
    });

    res.json({
      success: true,
      alerts: alerts.slice(0, 20) // Return top 20 alerts
    });
  } catch (error) {
    console.error('[NURSE-ALERTS] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alerts'
    });
  }
};
