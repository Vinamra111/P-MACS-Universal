/**
 * Restock Recommendation Tool
 * Intelligent recommendations for optimal restocking
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import type { DatabaseAdapter } from '../../database/CSVAdapter.js';
import { enrichInventoryItem } from '../../database/models.js';

export function createGetRestockRecommendationTool(db: DatabaseAdapter) {
  return new DynamicStructuredTool({
    name: 'get_restock_recommendation',
    description: `
Get smart restock recommendations for a specific drug or location.
Considers current stock, usage patterns, lead time, and safety levels.

Use this for queries like:
- "Restock recommendation for Propofol"
- "Should I reorder Midazolam?"
- "Restocking advice for ICU"
- "When to reorder drug X?"
    `.trim(),

    schema: z.object({
      drugName: z.string().optional().describe('Specific drug name (optional)'),
      location: z.string().optional().describe('Specific location (optional)'),
      leadTimeDays: z.number().int().min(1).max(30).optional().default(7).describe('Supplier lead time in days (default: 7)'),
    }),

    func: async ({ drugName, location, leadTimeDays }) => {
      try {
        const rawInventory = await db.loadInventory();
        const inventory = rawInventory.map(item => enrichInventoryItem(item));
        const transactions = await db.loadTransactions(30);

        // Filter inventory
        let items = inventory;
        if (drugName) {
          items = items.filter(item =>
            item.drugName.toLowerCase().includes(drugName.toLowerCase())
          );
        }
        if (location) {
          items = items.filter(item =>
            item.location.toLowerCase().includes(location.toLowerCase())
          );
        }

        if (items.length === 0) {
          return JSON.stringify({
            found: false,
            drugName,
            location,
            message: 'No matching items found',
            suggestion: 'Check spelling or try different search terms',
          });
        }

        // Calculate usage for each drug
        const drugUsage = new Map<string, number>();
        for (const txn of transactions) {
          if (txn.action === 'USE') {
            const current = drugUsage.get(txn.drugId) || 0;
            drugUsage.set(txn.drugId, current + Math.abs(txn.qtyChange));
          }
        }

        // Generate recommendations
        const recommendations = items.map(item => {
          const totalUsage = drugUsage.get(item.drugId) || 0;
          const avgDailyUsage = totalUsage / 30;
          const usageDuringLeadTime = avgDailyUsage * leadTimeDays;
          const stockAfterLeadTime = item.qtyOnHand - usageDuringLeadTime;
          const daysOfStock = avgDailyUsage > 0 ? item.qtyOnHand / avgDailyUsage : 999;

          // Determine reorder point (when to order)
          const reorderPoint = item.safetyStock + usageDuringLeadTime;

          // Determine if reorder is needed
          let shouldReorder = false;
          let urgency = 'NOT_NEEDED';
          let reasoning = '';

          if (item.qtyOnHand === 0) {
            shouldReorder = true;
            urgency = 'EMERGENCY';
            reasoning = 'Currently out of stock';
          } else if (stockAfterLeadTime <= 0) {
            shouldReorder = true;
            urgency = 'CRITICAL';
            reasoning = `Will run out in ${Math.floor(daysOfStock)} days (before lead time of ${leadTimeDays} days)`;
          } else if (item.qtyOnHand < reorderPoint) {
            shouldReorder = true;
            urgency = 'URGENT';
            reasoning = `Below reorder point (${item.qtyOnHand} < ${Math.ceil(reorderPoint)})`;
          } else if (item.qtyOnHand < item.safetyStock * 1.5) {
            shouldReorder = true;
            urgency = 'SOON';
            reasoning = 'Approaching reorder point';
          } else {
            urgency = 'NOT_NEEDED';
            reasoning = `Adequate stock (${Math.floor(daysOfStock)} days remaining)`;
          }

          // Calculate recommended order quantity (Economic Order Quantity concept)
          const targetStock = Math.max(
            item.safetyStock * 2,
            avgDailyUsage * 30 // 30 days supply
          );
          const recommendedQty = shouldReorder
            ? Math.max(0, Math.ceil(targetStock - item.qtyOnHand))
            : 0;

          // Round to pack size
          const packSize = 50;
          const orderPacks = Math.ceil(recommendedQty / packSize);
          const finalOrderQty = orderPacks * packSize;

          return {
            drugId: item.drugId,
            drugName: item.drugName,
            category: item.category,
            location: item.location,
            currentStock: item.qtyOnHand,
            safetyStock: item.safetyStock,
            reorderPoint: Math.ceil(reorderPoint),
            avgDailyUsage: avgDailyUsage.toFixed(2),
            daysOfStock: Math.floor(daysOfStock),
            usageDuringLeadTime: Math.ceil(usageDuringLeadTime),
            stockAfterLeadTime: Math.floor(stockAfterLeadTime),

            recommendation: {
              shouldReorder,
              urgency,
              reasoning,
              recommendedOrderQty: finalOrderQty,
              orderPacks,
              packSize,
              targetStock: Math.ceil(targetStock),
              estimatedCost: (finalOrderQty * (item.category === 'controlled' ? 50 : item.category === 'refrigerated' ? 30 : 10)).toFixed(2),
            },

            timing: urgency === 'EMERGENCY'
              ? 'Order immediately - arrange emergency delivery'
              : urgency === 'CRITICAL'
                ? 'Order today - will run out during lead time'
                : urgency === 'URGENT'
                  ? 'Order within 1-2 days'
                  : urgency === 'SOON'
                    ? 'Plan to order within 1 week'
                    : `No immediate order needed (${Math.floor(daysOfStock)} days remaining)`,

            action: shouldReorder
              ? `Order ${finalOrderQty} units (${orderPacks} packs of ${packSize})`
              : 'Continue monitoring - no action needed',
          };
        });

        // Sort by urgency
        const urgencyOrder: any = { EMERGENCY: 0, CRITICAL: 1, URGENT: 2, SOON: 3, NOT_NEEDED: 4 };
        recommendations.sort((a, b) =>
          urgencyOrder[a.recommendation.urgency] - urgencyOrder[b.recommendation.urgency]
        );

        // Calculate statistics
        const needsReorder = recommendations.filter(r => r.recommendation.shouldReorder);
        const emergency = recommendations.filter(r => r.recommendation.urgency === 'EMERGENCY');
        const critical = recommendations.filter(r => r.recommendation.urgency === 'CRITICAL');
        const urgent = recommendations.filter(r => r.recommendation.urgency === 'URGENT');
        const soon = recommendations.filter(r => r.recommendation.urgency === 'SOON');
        const totalOrderCost = needsReorder.reduce((sum, r) => sum + parseFloat(r.recommendation.estimatedCost), 0);

        const alertLevel = emergency.length > 0 || critical.length > 0 ? 'critical' :
          urgent.length > 0 ? 'warning' : 'info';

        return JSON.stringify({
          found: true,
          drugName,
          location,
          leadTimeDays,

          summary: {
            totalItems: recommendations.length,
            needsReorder: needsReorder.length,
            adequateStock: recommendations.length - needsReorder.length,
            byUrgency: {
              emergency: emergency.length,
              critical: critical.length,
              urgent: urgent.length,
              soon: soon.length,
              notNeeded: recommendations.filter(r => r.recommendation.urgency === 'NOT_NEEDED').length,
            },
            estimatedTotalCost: totalOrderCost.toFixed(2),
          },

          alertLevel,

          alertMessage: emergency.length > 0
            ? `${emergency.length} emergency reorder(s) + ${critical.length} critical`
            : critical.length > 0
              ? `${critical.length} critical reorder(s) needed`
              : urgent.length > 0
                ? `${urgent.length} item(s) need ordering soon`
                : needsReorder.length > 0
                  ? `${needsReorder.length} item(s) should be reordered`
                  : 'All items adequately stocked',

          recommendations: recommendations.slice(0, 50).map((rec, index) => ({
            rank: rec.recommendation.shouldReorder ? needsReorder.indexOf(rec) + 1 : null,
            drugName: rec.drugName,
            location: rec.location,
            category: rec.category,
            currentStock: rec.currentStock,
            daysOfStock: rec.daysOfStock,
            shouldReorder: rec.recommendation.shouldReorder,
            urgency: rec.recommendation.urgency,
            reasoning: rec.recommendation.reasoning,
            recommendedQty: rec.recommendation.recommendedOrderQty,
            estimatedCost: rec.recommendation.estimatedCost,
            timing: rec.timing,
            action: rec.action,
          })),

          detailedAnalysis: drugName && recommendations.length === 1 ? {
            drugName: recommendations[0].drugName,
            currentSituation: {
              stock: recommendations[0].currentStock,
              safetyStock: recommendations[0].safetyStock,
              reorderPoint: recommendations[0].reorderPoint,
              daysRemaining: recommendations[0].daysOfStock,
            },
            usagePattern: {
              avgDailyUsage: recommendations[0].avgDailyUsage,
              last30DaysTotal: (parseFloat(recommendations[0].avgDailyUsage) * 30).toFixed(0),
              projectedUsageDuringLeadTime: recommendations[0].usageDuringLeadTime,
            },
            projection: {
              stockAfterLeadTime: recommendations[0].stockAfterLeadTime,
              willLastLeadTime: recommendations[0].stockAfterLeadTime > 0,
              riskLevel: recommendations[0].recommendation.urgency,
            },
            recommendation: recommendations[0].recommendation,
          } : undefined,

          reorderPlan: needsReorder.length > 0 ? {
            immediate: emergency.length + critical.length > 0 ? {
              count: emergency.length + critical.length,
              items: [...emergency, ...critical].map(r => ({
                drugName: r.drugName,
                location: r.location,
                orderQty: r.recommendation.recommendedOrderQty,
                urgency: r.recommendation.urgency,
              })),
              totalCost: [...emergency, ...critical].reduce((sum, r) => sum + parseFloat(r.recommendation.estimatedCost), 0).toFixed(2),
              action: 'Place orders immediately - emergency/critical items',
            } : undefined,

            thisWeek: urgent.length > 0 ? {
              count: urgent.length,
              totalCost: urgent.reduce((sum, r) => sum + parseFloat(r.recommendation.estimatedCost), 0).toFixed(2),
              action: 'Schedule orders within 1-2 days',
            } : undefined,

            planned: soon.length > 0 ? {
              count: soon.length,
              totalCost: soon.reduce((sum, r) => sum + parseFloat(r.recommendation.estimatedCost), 0).toFixed(2),
              action: 'Include in next regular order (within 1 week)',
            } : undefined,
          } : undefined,

          insights: [
            {
              title: 'Reorder Efficiency',
              data: needsReorder.length > 0
                ? `${needsReorder.length} of ${recommendations.length} items need reordering (${((needsReorder.length / recommendations.length) * 100).toFixed(0)}%)`
                : 'All items adequately stocked',
              recommendation: needsReorder.length > recommendations.length * 0.3
                ? 'High reorder rate - consider increasing safety stock levels or reviewing par levels'
                : 'Normal reorder rate - current stock levels appropriate',
            },
            {
              title: 'Lead Time Impact',
              data: critical.length > 0
                ? `${critical.length} item(s) won't last the ${leadTimeDays}-day lead time`
                : `Current stock adequate for ${leadTimeDays}-day lead time`,
              recommendation: critical.length > 0
                ? 'Consider reducing lead times with alternative suppliers or increasing safety stock'
                : 'Lead time management effective',
            },
            {
              title: 'Financial Impact',
              data: `Estimated reorder cost: $${totalOrderCost.toFixed(2)}`,
              recommendation: totalOrderCost > 5000
                ? 'Significant order value - consider bulk discounts or split delivery'
                : 'Standard order value',
            },
          ],

          recommendations_list: [
            emergency.length > 0 && `EMERGENCY: ${emergency.length} out-of-stock item(s) need immediate attention`,
            critical.length > 0 && `${critical.length} item(s) will run out before reorder arrives - order now`,
            urgent.length > 0 && `${urgent.length} item(s) below reorder point - order within 1-2 days`,
            needsReorder.length > 5 && 'Multiple items need reordering - consider consolidated purchase order',
            'Monitor usage patterns for items approaching reorder points',
            'Review safety stock levels quarterly to optimize inventory',
          ].filter(Boolean),

          actions: ['generate_po', 'contact_supplier', 'update_par_levels', 'schedule_review'],

          note: recommendations.length > 50
            ? `Showing top 50 of ${recommendations.length} items. Export full report for complete recommendations.`
            : 'Complete restock recommendations displayed.',

          reportDate: new Date().toISOString(),
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error generating restock recommendations: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    },
  });
}

export default createGetRestockRecommendationTool;
