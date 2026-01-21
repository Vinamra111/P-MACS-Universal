/**
 * Stockout Risk Report Tool
 * Predicts and prioritizes drugs at risk of running out
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import type { DatabaseAdapter } from '../../database/CSVAdapter.js';
import { enrichInventoryItem } from '../../database/models.js';

export function createGetStockoutRiskReportTool(db: DatabaseAdapter) {
  return new DynamicStructuredTool({
    name: 'get_stockout_risk_report',
    description: `
Generate proactive stockout risk report with priority scoring.
Identifies drugs at risk of running out before next replenishment.

Use this for queries like:
- "Stockout risk report"
- "What might run out soon?"
- "Show at-risk inventory"
- "Predict stockouts"
    `.trim(),

    schema: z.object({
      leadTimeDays: z.number().int().min(1).max(30).optional().default(7).describe('Lead time for replenishment in days (default: 7)'),
      locationFilter: z.string().optional().describe('Filter by location (optional)'),
    }),

    func: async ({ leadTimeDays, locationFilter }) => {
      try {
        const rawInventory = await db.loadInventory();
        const inventory = rawInventory.map(item => enrichInventoryItem(item));
        const transactions = await db.loadTransactions(30); // Last 30 days for usage calculation

        // Filter by location if specified
        let relevantInventory = inventory;
        if (locationFilter) {
          relevantInventory = inventory.filter(item =>
            item.location.toLowerCase().includes(locationFilter.toLowerCase())
          );
        }

        // Calculate usage rates for each drug
        const drugUsage = new Map<string, number>();
        for (const txn of transactions) {
          if (txn.action === 'USE') {
            const current = drugUsage.get(txn.drugId) || 0;
            drugUsage.set(txn.drugId, current + Math.abs(txn.qtyChange));
          }
        }

        // Analyze each item for stockout risk
        const riskAnalysis = relevantInventory.map(item => {
          const totalUsage = drugUsage.get(item.drugId) || 0;
          const avgDailyUsage = totalUsage / 30;
          const predictedUsage = avgDailyUsage * leadTimeDays;
          const remainingAfterLeadTime = item.qtyOnHand - predictedUsage;

          // Calculate days until stockout
          const daysUntilStockout = avgDailyUsage > 0
            ? Math.floor(item.qtyOnHand / avgDailyUsage)
            : item.qtyOnHand > 0 ? 999 : 0;

          // Risk scoring (0-100)
          let riskScore = 0;
          if (item.qtyOnHand === 0) {
            riskScore = 100; // Already out
          } else if (remainingAfterLeadTime <= 0) {
            riskScore = 90; // Will run out before replenishment
          } else if (daysUntilStockout <= leadTimeDays) {
            riskScore = 80 - (daysUntilStockout / leadTimeDays) * 30;
          } else if (item.qtyOnHand < item.safetyStock) {
            riskScore = 40 + ((item.safetyStock - item.qtyOnHand) / item.safetyStock) * 20;
          } else if (daysUntilStockout <= leadTimeDays * 2) {
            riskScore = 20 + (1 - daysUntilStockout / (leadTimeDays * 2)) * 20;
          }

          // Adjust for category
          const categoryMultiplier = item.category === 'controlled' ? 1.2 :
            item.category === 'refrigerated' ? 1.1 : 1.0;
          riskScore = Math.min(100, riskScore * categoryMultiplier);

          // Determine risk level
          const riskLevel = riskScore >= 80 ? 'CRITICAL' :
            riskScore >= 60 ? 'HIGH' :
              riskScore >= 40 ? 'MEDIUM' :
                riskScore >= 20 ? 'LOW' : 'MINIMAL';

          // Priority for action
          const priority = item.qtyOnHand === 0 ? 1 :
            remainingAfterLeadTime <= 0 ? 2 :
              daysUntilStockout <= leadTimeDays ? 3 :
                item.qtyOnHand < item.safetyStock ? 4 : 5;

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

            recommendation: item.qtyOnHand === 0
              ? 'EMERGENCY ORDER - Already out of stock'
              : remainingAfterLeadTime <= 0
                ? `URGENT - Order now (will run out in ${daysUntilStockout} days, lead time is ${leadTimeDays} days)`
                : daysUntilStockout <= leadTimeDays
                  ? `ORDER IMMEDIATELY - ${daysUntilStockout} days remaining`
                  : item.qtyOnHand < item.safetyStock
                    ? `Order soon - Below safety stock`
                    : `Monitor - ${daysUntilStockout} days remaining`,
          };
        });

        // Filter to items with measurable risk (score > 0)
        const atRiskItems = riskAnalysis.filter(item => item.riskScore > 0);

        if (atRiskItems.length === 0) {
          return JSON.stringify({
            found: false,
            leadTimeDays,
            locationFilter,
            message: 'No stockout risks detected - all items adequately stocked',
            alertLevel: 'info',
            note: 'Excellent inventory management!',
          });
        }

        // Sort by priority, then risk score
        atRiskItems.sort((a, b) => {
          if (a.priority !== b.priority) return a.priority - b.priority;
          return b.riskScore - a.riskScore;
        });

        // Calculate statistics
        const critical = atRiskItems.filter(i => i.riskLevel === 'CRITICAL');
        const high = atRiskItems.filter(i => i.riskLevel === 'HIGH');
        const medium = atRiskItems.filter(i => i.riskLevel === 'MEDIUM');
        const controlledAtRisk = atRiskItems.filter(i => i.category === 'controlled');
        const alreadyOut = atRiskItems.filter(i => i.currentStock === 0);
        const willRunOut = atRiskItems.filter(i =>
          parseFloat(i.remainingAfterLeadTime) <= 0 && i.currentStock > 0
        );

        const alertLevel = critical.length > 0 || alreadyOut.length > 0 ? 'critical' :
          high.length > 0 ? 'warning' : 'info';

        return JSON.stringify({
          found: true,
          leadTimeDays,
          locationFilter,

          summary: {
            totalAtRisk: atRiskItems.length,
            totalInventoryItems: relevantInventory.length,
            riskPercentage: ((atRiskItems.length / relevantInventory.length) * 100).toFixed(1),
            byRiskLevel: {
              critical: critical.length,
              high: high.length,
              medium: medium.length,
              low: atRiskItems.length - critical.length - high.length - medium.length,
            },
            immediateAction: {
              alreadyStockedOut: alreadyOut.length,
              willStockoutDuringLeadTime: willRunOut.length,
              total: alreadyOut.length + willRunOut.length,
            },
            controlledSubstancesAtRisk: controlledAtRisk.length,
          },

          alertLevel,

          alertMessage: alreadyOut.length > 0
            ? `CRITICAL: ${alreadyOut.length} item(s) already out of stock + ${willRunOut.length} will run out during lead time`
            : willRunOut.length > 0
              ? `URGENT: ${willRunOut.length} item(s) will run out before replenishment (${leadTimeDays}-day lead time)`
              : critical.length > 0
                ? `${critical.length} item(s) at critical stockout risk`
                : `${atRiskItems.length} item(s) require monitoring`,

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
            recommendation: item.recommendation,
          })),

          actionPlan: [
            {
              priority: 'IMMEDIATE (Today)',
              items: alreadyOut.length + willRunOut.length,
              drugs: [...alreadyOut, ...willRunOut].slice(0, 10).map(i => i.drugName),
              action: 'Emergency procurement - expedite delivery',
            },
            {
              priority: 'URGENT (1-2 days)',
              items: critical.length - alreadyOut.length - willRunOut.length,
              drugs: critical.filter(i => i.currentStock > 0 && parseFloat(i.remainingAfterLeadTime) > 0)
                .slice(0, 10).map(i => i.drugName),
              action: 'Standard procurement process - ensure delivery within lead time',
            },
            {
              priority: 'SOON (3-7 days)',
              items: high.length,
              drugs: high.slice(0, 10).map(i => i.drugName),
              action: 'Plan reorder - monitor closely',
            },
            {
              priority: 'MONITOR (1-2 weeks)',
              items: medium.length,
              drugs: medium.slice(0, 5).map(i => i.drugName),
              action: 'Add to next regular order',
            },
          ].filter(plan => plan.items > 0),

          controlledSubstances: controlledAtRisk.length > 0 ? {
            count: controlledAtRisk.length,
            warning: 'Controlled substances at risk - ensure regulatory compliance during emergency ordering',
            items: controlledAtRisk.map(i => ({
              drugName: i.drugName,
              location: i.location,
              riskLevel: i.riskLevel,
              daysUntilStockout: i.daysUntilStockout,
            })),
          } : undefined,

          recommendations: [
            alreadyOut.length > 0 && `EMERGENCY: ${alreadyOut.length} items out of stock - arrange emergency delivery`,
            willRunOut.length > 0 && `URGENT: Order ${willRunOut.length} items immediately (won't last lead time)`,
            controlledAtRisk.length > 0 && `${controlledAtRisk.length} controlled substance(s) at risk - expedite with proper documentation`,
            critical.length > 5 && 'Multiple critical risks detected - review overall procurement process',
            'Increase safety stock levels for frequently at-risk items',
            'Consider reducing lead times with alternative suppliers for critical drugs',
            'Implement automated reorder points to prevent future stockouts',
          ].filter(Boolean),

          preventiveMeasures: [
            'Set up automated alerts for items reaching reorder points',
            'Increase safety stock levels for high-variability drugs',
            'Establish relationships with backup suppliers for critical items',
            'Review and optimize lead times',
            'Implement min-max inventory controls',
          ],

          actions: ['generate_emergency_po', 'contact_suppliers', 'adjust_safety_stocks', 'export_risk_report'],

          note: atRiskItems.length > 50
            ? `Showing top 50 of ${atRiskItems.length} at-risk items. Export full report for complete analysis.`
            : 'Complete stockout risk analysis displayed.',

          reportDate: new Date().toISOString(),
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error generating stockout risk report: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    },
  });
}

export default createGetStockoutRiskReportTool;
