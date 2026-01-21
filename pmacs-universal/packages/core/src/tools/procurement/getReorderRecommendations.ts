/**
 * Reorder Recommendations Tool
 * Smart reorder suggestions with Economic Order Quantity (EOQ) calculations
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import type { DatabaseAdapter } from '../../database/CSVAdapter.js';
import { enrichInventoryItem } from '../../database/models.js';

export function createGetReorderRecommendationsTool(db: DatabaseAdapter) {
  return new DynamicStructuredTool({
    name: 'get_reorder_recommendations',
    description: `
Generate intelligent reorder recommendations using EOQ principles.
Optimizes order quantities based on usage, costs, and lead times.

Use this for queries like:
- "Reorder recommendations"
- "What should I order?"
- "Smart ordering suggestions"
- "EOQ recommendations"
    `.trim(),

    schema: z.object({
      minOrderValue: z.number().optional().default(100).describe('Minimum order value to include (default: 100)'),
      leadTimeDays: z.number().int().min(1).max(30).optional().default(7).describe('Supplier lead time (default: 7)'),
      targetDaysOfSupply: z.number().int().min(14).max(90).optional().default(30).describe('Target days of supply (default: 30)'),
    }),

    func: async ({ minOrderValue, leadTimeDays, targetDaysOfSupply }) => {
      try {
        const rawInventory = await db.loadInventory();
        const inventory = rawInventory.map(item => enrichInventoryItem(item));
        const transactions = await db.loadTransactions(60); // 60 days for better trend analysis

        // Calculate usage and trends
        const drugStats = new Map<string, {
          usage30: number;
          usage60: number;
          trend: string;
        }>();

        for (const txn of transactions) {
          if (txn.action === 'USE') {
            const txnDate = new Date(txn.timestamp);
            const daysAgo = (Date.now() - txnDate.getTime()) / (1000 * 60 * 60 * 24);
            const qty = Math.abs(txn.qtyChange);

            const existing = drugStats.get(txn.drugId) || { usage30: 0, usage60: 0, trend: 'stable' };

            if (daysAgo <= 30) {
              existing.usage30 += qty;
            }
            existing.usage60 += qty;

            drugStats.set(txn.drugId, existing);
          }
        }

        // Calculate trends
        for (const [drugId, stats] of drugStats.entries()) {
          const recent30 = stats.usage30;
          const previous30 = stats.usage60 - stats.usage30;

          if (recent30 > previous30 * 1.2) {
            stats.trend = 'increasing';
          } else if (recent30 < previous30 * 0.8) {
            stats.trend = 'decreasing';
          } else {
            stats.trend = 'stable';
          }
        }

        // Generate recommendations
        const recommendations = [];

        for (const item of inventory) {
          const stats = drugStats.get(item.drugId);
          if (!stats) continue; // Skip items with no usage

          const avgDailyUsage = stats.usage30 / 30;
          const usageDuringLeadTime = avgDailyUsage * leadTimeDays;
          const reorderPoint = item.safetyStock + usageDuringLeadTime;

          // Only recommend if below or approaching reorder point
          if (item.qtyOnHand >= reorderPoint * 1.2) continue;

          // Calculate optimal order quantity
          let targetStock = Math.max(
            item.safetyStock * 2,
            avgDailyUsage * targetDaysOfSupply
          );

          // Adjust for trend
          if (stats.trend === 'increasing') {
            targetStock *= 1.2; // 20% more for increasing usage
          } else if (stats.trend === 'decreasing') {
            targetStock *= 0.9; // 10% less for decreasing usage
          }

          const orderQty = Math.max(0, Math.ceil(targetStock - item.qtyOnHand));
          if (orderQty === 0) continue;

          // Economic considerations
          const unitPrice = item.category === 'controlled' ? 50 :
            item.category === 'refrigerated' ? 30 : 10;
          const orderValue = orderQty * unitPrice;

          // Skip if below minimum order value
          if (orderValue < minOrderValue) continue;

          // Pack size optimization
          const packSize = 50;
          const packs = Math.ceil(orderQty / packSize);
          const finalOrderQty = packs * packSize;
          const finalOrderValue = finalOrderQty * unitPrice;

          // Urgency based on stock situation
          const daysUntilStockout = avgDailyUsage > 0 ? item.qtyOnHand / avgDailyUsage : 999;
          const urgency = item.qtyOnHand === 0 ? 'CRITICAL' :
            daysUntilStockout <= leadTimeDays ? 'HIGH' :
              item.qtyOnHand < reorderPoint ? 'MEDIUM' : 'LOW';

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
            trendAdjustment: stats.trend === 'increasing' ? '+20%' :
              stats.trend === 'decreasing' ? '-10%' : 'none',

            recommendation: {
              orderQty: finalOrderQty,
              packs,
              packSize,
              unitPrice: unitPrice.toFixed(2),
              orderValue: finalOrderValue.toFixed(2),
              urgency,
              targetStock: Math.ceil(targetStock),
              willProvide: `${Math.floor(finalOrderQty / avgDailyUsage)} days of supply`,
            },

            reasoning: urgency === 'CRITICAL'
              ? 'OUT OF STOCK - Emergency order required'
              : urgency === 'HIGH'
                ? `Will run out in ${Math.floor(daysUntilStockout)} days (lead time: ${leadTimeDays} days)`
                : urgency === 'MEDIUM'
                  ? `Below reorder point of ${Math.ceil(reorderPoint)}`
                  : 'Approaching reorder point',

            supplierNotes: [
              urgency === 'CRITICAL' || urgency === 'HIGH' ? 'Request expedited delivery' : null,
              item.category === 'controlled' ? 'Controlled substance - requires authorization' : null,
              item.category === 'refrigerated' ? 'Refrigerated item - cold chain required' : null,
              stats.trend === 'increasing' ? 'Usage trending up - consider higher par levels' : null,
              finalOrderValue > 1000 ? 'High-value order - verify bulk discount availability' : null,
            ].filter(Boolean),
          });
        }

        if (recommendations.length === 0) {
          return JSON.stringify({
            found: false,
            minOrderValue,
            leadTimeDays,
            targetDaysOfSupply,
            message: 'No reorder recommendations at this time',
            note: 'All items adequately stocked or below minimum order value threshold',
            alertLevel: 'info',
          });
        }

        // Sort by urgency and value
        const urgencyOrder: any = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        recommendations.sort((a, b) => {
          const urgencyDiff = urgencyOrder[a.recommendation.urgency] - urgencyOrder[b.recommendation.urgency];
          if (urgencyDiff !== 0) return urgencyDiff;
          return parseFloat(b.recommendation.orderValue) - parseFloat(a.recommendation.orderValue);
        });

        // Calculate statistics
        const totalValue = recommendations.reduce((sum, r) => sum + parseFloat(r.recommendation.orderValue), 0);
        const critical = recommendations.filter(r => r.recommendation.urgency === 'CRITICAL');
        const high = recommendations.filter(r => r.recommendation.urgency === 'HIGH');
        const medium = recommendations.filter(r => r.recommendation.urgency === 'MEDIUM');
        const controlled = recommendations.filter(r => r.category === 'controlled');
        const increasing = recommendations.filter(r => r.trend === 'increasing');

        const alertLevel = critical.length > 0 ? 'critical' :
          high.length > 0 ? 'warning' : 'info';

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
              low: recommendations.length - critical.length - high.length - medium.length,
            },
            byTrend: {
              increasing: increasing.length,
              decreasing: recommendations.filter(r => r.trend === 'decreasing').length,
              stable: recommendations.filter(r => r.trend === 'stable').length,
            },
            controlledSubstances: controlled.length,
            uniqueLocations: new Set(recommendations.map(r => r.location)).size,
          },

          alertLevel,

          alertMessage: critical.length > 0
            ? `${critical.length} critical reorder(s) + ${high.length} high priority`
            : high.length > 0
              ? `${high.length} high-priority reorder(s) recommended`
              : `${recommendations.length} reorder recommendation(s)`,

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
            reasoning: rec.reasoning,
          })),

          orderingStrategy: {
            immediate: critical.length + high.length > 0 ? {
              items: critical.length + high.length,
              value: [...critical, ...high].reduce((sum, r) => sum + parseFloat(r.recommendation.orderValue), 0).toFixed(2),
              action: 'Place orders immediately - expedite delivery',
              note: 'These items will run out before or during lead time',
            } : undefined,

            thisWeek: medium.length > 0 ? {
              items: medium.length,
              value: medium.reduce((sum, r) => sum + parseFloat(r.recommendation.orderValue), 0).toFixed(2),
              action: 'Schedule orders within 3-5 days',
            } : undefined,

            consolidated: {
              totalItems: recommendations.length,
              totalValue: totalValue.toFixed(2),
              suggestion: totalValue > 5000
                ? 'High-value consolidated order - negotiate bulk discount'
                : 'Standard consolidated purchase order',
            },
          },

          trendAnalysis: increasing.length > 0 ? {
            increasingUsageDrugs: increasing.length,
            note: `${increasing.length} drug(s) showing increased usage (20%+ growth)`,
            recommendation: 'Consider increasing par levels and safety stock for these items',
            items: increasing.slice(0, 10).map(r => ({
              drugName: r.drugName,
              increase: r.trendAdjustment,
            })),
          } : undefined,

          controlledSubstances: controlled.length > 0 ? {
            count: controlled.length,
            totalValue: controlled.reduce((sum, r) => sum + parseFloat(r.recommendation.orderValue), 0).toFixed(2),
            items: controlled.map(r => ({
              drugName: r.drugName,
              orderQty: r.recommendation.orderQty,
              orderValue: r.recommendation.orderValue,
              urgency: r.recommendation.urgency,
            })),
            warning: 'Controlled substances require special authorization and documentation',
          } : undefined,

          economicOptimization: [
            {
              strategy: 'Pack Size Optimization',
              description: 'All quantities rounded to pack sizes for cost efficiency',
              savings: 'Eliminates partial pack charges',
            },
            {
              strategy: 'Trend-Based Adjustment',
              description: `${increasing.length} increasing-use items get 20% extra supply`,
              benefit: 'Prevents future stockouts as demand grows',
            },
            {
              strategy: 'Consolidated Ordering',
              description: `${recommendations.length} items in single order`,
              benefit: totalValue > 5000 ? 'Potential bulk discount available' : 'Reduced ordering costs',
            },
          ],

          recommendations_list: [
            critical.length > 0 && `URGENT: ${critical.length} critical item(s) out of stock`,
            high.length > 0 && `${high.length} item(s) will run out during lead time - order immediately`,
            increasing.length > 3 && `${increasing.length} items showing increased usage - review par levels`,
            controlled.length > 0 && `${controlled.length} controlled substance(s) - ensure authorization`,
            totalValue > 10000 && `High-value order ($${totalValue.toFixed(2)}) - negotiate volume discount`,
            'Use consolidated PO to reduce procurement overhead',
            'Monitor usage trends monthly to optimize reorder points',
          ].filter(Boolean),

          actions: ['generate_po', 'contact_suppliers', 'request_quotes', 'schedule_delivery', 'export_to_excel'],

          note: recommendations.length > 50
            ? `Showing top 50 of ${recommendations.length} recommendations. Export for full list.`
            : 'Complete reorder recommendations displayed.',

          reportDate: new Date().toISOString(),
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error generating reorder recommendations: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    },
  });
}

export default createGetReorderRecommendationsTool;
