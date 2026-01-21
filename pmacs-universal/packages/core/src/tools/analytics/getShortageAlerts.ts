/**
 * Shortage Alerts Tool
 * Real-time proactive alerts for shortage situations
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import type { DatabaseAdapter } from '../../database/CSVAdapter.js';
import { enrichInventoryItem } from '../../database/models.js';

export function createGetShortageAlertsTool(db: DatabaseAdapter) {
  return new DynamicStructuredTool({
    name: 'get_shortage_alerts',
    description: `
Generate real-time shortage alerts with immediate action items.
Combines current stock status with usage patterns for proactive warnings.

Use this for queries like:
- "Any shortage alerts?"
- "What's running low?"
- "Show critical alerts"
- "Real-time inventory warnings"
    `.trim(),

    schema: z.object({
      leadTimeDays: z.number().int().min(1).max(14).optional().default(7).describe('Consider lead time for alerts (default: 7)'),
      includeWarnings: z.boolean().optional().default(true).describe('Include warning-level alerts (default: true)'),
    }),

    func: async ({ leadTimeDays, includeWarnings }) => {
      try {
        const rawInventory = await db.loadInventory();
        const inventory = rawInventory.map(item => enrichInventoryItem(item));
        const transactions = await db.loadTransactions(30);
        const lowStockItems = await db.getLowStockItems();

        // Calculate usage for prediction
        const drugUsage = new Map<string, number>();
        for (const txn of transactions) {
          if (txn.action === 'USE') {
            const current = drugUsage.get(txn.drugId) || 0;
            drugUsage.set(txn.drugId, current + Math.abs(txn.qtyChange));
          }
        }

        const alerts = [];

        // Analyze each inventory item
        for (const item of inventory) {
          const totalUsage = drugUsage.get(item.drugId) || 0;
          const avgDailyUsage = totalUsage / 30;
          const daysRemaining = avgDailyUsage > 0 ? item.qtyOnHand / avgDailyUsage : 999;

          let alertType = null;
          let alertLevel = null;
          let message = '';
          let action = '';

          // Critical: Out of stock
          if (item.qtyOnHand === 0) {
            alertType = 'STOCKOUT';
            alertLevel = 'CRITICAL';
            message = `${item.drugName} is OUT OF STOCK at ${item.location}`;
            action = 'EMERGENCY ORDER - Arrange immediate delivery or transfer from other location';
          }
          // Critical: Will run out during lead time
          else if (daysRemaining <= leadTimeDays && avgDailyUsage > 0) {
            alertType = 'IMMINENT_STOCKOUT';
            alertLevel = 'CRITICAL';
            message = `${item.drugName} will run out in ${Math.floor(daysRemaining)} days (lead time: ${leadTimeDays} days)`;
            action = 'ORDER IMMEDIATELY - Will run out before replenishment arrives';
          }
          // Warning: Below safety stock
          else if (item.qtyOnHand < item.safetyStock) {
            alertType = 'BELOW_SAFETY_STOCK';
            alertLevel = 'WARNING';
            message = `${item.drugName} below safety stock at ${item.location} (${item.qtyOnHand}/${item.safetyStock})`;
            action = 'Order soon - Below minimum safe level';
          }
          // Warning: Near safety stock (within 20%)
          else if (item.qtyOnHand < item.safetyStock * 1.2 && avgDailyUsage > 0) {
            alertType = 'APPROACHING_SAFETY_STOCK';
            alertLevel = 'WARNING';
            message = `${item.drugName} approaching safety stock at ${item.location}`;
            action = 'Plan reorder within 1-2 days';
          }

          // Skip if no alert or if warnings excluded
          if (!alertType || (alertLevel === 'WARNING' && !includeWarnings)) {
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
            timestamp: new Date().toISOString(),
            isControlled: item.category === 'controlled',
          });
        }

        if (alerts.length === 0) {
          return JSON.stringify({
            hasAlerts: false,
            leadTimeDays,
            includeWarnings,
            message: includeWarnings
              ? 'No shortage alerts - all inventory levels adequate'
              : 'No critical alerts - all items above safety stock',
            alertLevel: 'info',
            note: 'Excellent inventory management!',
          });
        }

        // Sort by severity and days remaining
        const levelOrder: Record<string, number> = { CRITICAL: 0, WARNING: 1, INFO: 2 };
        alerts.sort((a, b) => {
          const aLevel = a.alertLevel ?? 'INFO';
          const bLevel = b.alertLevel ?? 'INFO';
          const levelDiff = (levelOrder[aLevel] ?? 999) - (levelOrder[bLevel] ?? 999);
          if (levelDiff !== 0) return levelDiff;
          return a.daysRemaining - b.daysRemaining;
        });

        // Calculate statistics
        const critical = alerts.filter(a => a.alertLevel === 'CRITICAL');
        const warnings = alerts.filter(a => a.alertLevel === 'WARNING');
        const stockouts = alerts.filter(a => a.alertType === 'STOCKOUT');
        const imminentStockouts = alerts.filter(a => a.alertType === 'IMMINENT_STOCKOUT');
        const controlledAlerts = alerts.filter(a => a.isControlled);

        // Group by location
        const locationGroups = new Map<string, typeof alerts>();
        for (const alert of alerts) {
          const existing = locationGroups.get(alert.location) || [];
          existing.push(alert);
          locationGroups.set(alert.location, existing);
        }

        const locationSummary = Array.from(locationGroups.entries()).map(([location, alerts]) => ({
          location,
          totalAlerts: alerts.length,
          critical: alerts.filter(a => a.alertLevel === 'CRITICAL').length,
          warnings: alerts.filter(a => a.alertLevel === 'WARNING').length,
        })).sort((a, b) => b.critical - a.critical || b.totalAlerts - a.totalAlerts);

        return JSON.stringify({
          hasAlerts: true,
          leadTimeDays,
          includeWarnings,

          summary: {
            totalAlerts: alerts.length,
            byLevel: {
              critical: critical.length,
              warning: warnings.length,
            },
            byType: {
              stockouts: stockouts.length,
              imminentStockouts: imminentStockouts.length,
              belowSafety: alerts.filter(a => a.alertType === 'BELOW_SAFETY_STOCK').length,
              approachingSafety: alerts.filter(a => a.alertType === 'APPROACHING_SAFETY_STOCK').length,
            },
            controlledSubstances: controlledAlerts.length,
            locationsAffected: locationGroups.size,
            generatedAt: new Date().toISOString(),
          },

          alertLevel: critical.length > 0 ? 'critical' : 'warning',

          alertMessage: stockouts.length > 0
            ? `CRITICAL: ${stockouts.length} stockout(s) + ${imminentStockouts.length} imminent stockout(s)`
            : critical.length > 0
              ? `${critical.length} critical alert(s) requiring immediate action`
              : `${warnings.length} warning(s) - items below safety stock`,

          criticalAlerts: critical.map((alert, index) => ({
            priority: index + 1,
            drugName: alert.drugName,
            location: alert.location,
            alertType: alert.alertType,
            message: alert.message,
            action: alert.action,
            currentStock: alert.currentStock,
            daysRemaining: alert.daysRemaining,
            isControlled: alert.isControlled,
          })),

          warningAlerts: includeWarnings ? warnings.slice(0, 20).map((alert, index) => ({
            rank: index + 1,
            drugName: alert.drugName,
            location: alert.location,
            alertType: alert.alertType,
            message: alert.message,
            action: alert.action,
            currentStock: alert.currentStock,
            safetyStock: alert.safetyStock,
          })) : undefined,

          locationBreakdown: locationSummary,

          controlledSubstances: controlledAlerts.length > 0 ? {
            count: controlledAlerts.length,
            alerts: controlledAlerts.map(a => ({
              drugName: a.drugName,
              location: a.location,
              alertLevel: a.alertLevel,
              message: a.message,
            })),
            warning: 'Controlled substances in shortage - ensure regulatory compliance and documentation',
          } : undefined,

          immediateActions: [
            stockouts.length > 0 && {
              priority: 'URGENT',
              action: `Emergency procurement for ${stockouts.length} out-of-stock item(s)`,
              items: stockouts.map(a => `${a.drugName} (${a.location})`).slice(0, 5),
              timeline: 'Immediate - arrange emergency delivery or transfer',
            },
            imminentStockouts.length > 0 && {
              priority: 'HIGH',
              action: `Order ${imminentStockouts.length} item(s) immediately`,
              items: imminentStockouts.map(a => `${a.drugName} (${a.location})`).slice(0, 5),
              timeline: `Will run out before ${leadTimeDays}-day lead time`,
            },
            critical.length - stockouts.length - imminentStockouts.length > 0 && {
              priority: 'MEDIUM',
              action: `Order items below safety stock`,
              count: critical.length - stockouts.length - imminentStockouts.length,
              timeline: '1-2 days',
            },
          ].filter(Boolean),

          recommendations: [
            stockouts.length > 0 && `EMERGENCY: ${stockouts.length} stockout(s) - check if transfer from other locations possible`,
            imminentStockouts.length > 0 && `${imminentStockouts.length} item(s) will run out before reorder arrives - expedite delivery`,
            controlledAlerts.length > 0 && `${controlledAlerts.length} controlled substance(s) affected - ensure proper documentation`,
            critical.length > 5 && 'Multiple critical alerts - review overall procurement process',
            locationSummary[0] && locationSummary[0].critical > 3 && `${locationSummary[0].location} has ${locationSummary[0].critical} critical alerts - priority attention needed`,
            'Set up automated reorder points to prevent future shortages',
            'Review safety stock levels for frequently alerted items',
          ].filter(Boolean),

          actions: ['generate_emergency_po', 'contact_suppliers', 'transfer_stock', 'update_safety_levels'],

          refreshInterval: 'Check alerts every 4-6 hours for proactive management',

          note: critical.length > 10
            ? `High alert volume (${critical.length} critical) - review procurement practices`
            : warnings.length > 20
              ? `Showing top 20 of ${warnings.length} warnings. Export full report for complete data.`
              : 'All shortage alerts displayed.',
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error generating shortage alerts: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    },
  });
}

export default createGetShortageAlertsTool;
