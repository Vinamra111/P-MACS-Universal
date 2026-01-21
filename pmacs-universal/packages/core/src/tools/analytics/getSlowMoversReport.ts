/**
 * Slow Movers Report Tool
 * Identifies drugs with minimal usage to optimize inventory
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import type { DatabaseAdapter } from '../../database/CSVAdapter.js';
import { enrichInventoryItem } from '../../database/models.js';

export function createGetSlowMoversReportTool(db: DatabaseAdapter) {
  return new DynamicStructuredTool({
    name: 'get_slow_movers_report',
    description: `
Generate report of drugs with minimal or no usage (slow movers).
Identifies inventory optimization opportunities and overstock situations.

Use this for queries like:
- "Show slow moving drugs"
- "What's not being used?"
- "Identify overstock items"
- "Low turnover drugs"
    `.trim(),

    schema: z.object({
      days: z.number().int().min(1).max(365).optional().default(90).describe('Period to analyze in days (default: 90)'),
      maxUsageThreshold: z.number().optional().default(5).describe('Max total usage to be considered slow (default: 5)'),
      includeZeroUsage: z.boolean().optional().default(true).describe('Include drugs with zero usage (default: true)'),
      locationFilter: z.string().optional().describe('Filter by location (optional)'),
    }),

    func: async ({ days, maxUsageThreshold, includeZeroUsage, locationFilter }) => {
      try {
        const transactions = await db.loadTransactions(days);
        const rawInventory = await db.loadInventory();
        const inventory = rawInventory.map(item => enrichInventoryItem(item));

        // Filter inventory by location if specified
        let relevantInventory = inventory;
        if (locationFilter) {
          relevantInventory = inventory.filter(item =>
            item.location.toLowerCase().includes(locationFilter.toLowerCase())
          );
        }

        // Calculate usage for each drug
        const drugUsage = new Map<string, {
          totalUsed: number;
          transactionCount: number;
        }>();

        for (const txn of transactions) {
          const existing = drugUsage.get(txn.drugId) || {
            totalUsed: 0,
            transactionCount: 0,
          };

          if (txn.action === 'USE') {
            existing.totalUsed += Math.abs(txn.qtyChange);
            existing.transactionCount++;
          }

          drugUsage.set(txn.drugId, existing);
        }

        // Analyze each drug in inventory
        const slowMovers = relevantInventory.map(item => {
          const usage = drugUsage.get(item.drugId);
          const totalUsed = usage?.totalUsed || 0;
          const transactionCount = usage?.transactionCount || 0;
          const avgDailyUsage = totalUsed / days;

          // Calculate days of stock on hand
          const daysOfStock = avgDailyUsage > 0
            ? Math.round(item.qtyOnHand / avgDailyUsage)
            : item.qtyOnHand > 0 ? 999 : 0;

          // Estimate value (simplified - real system would have unit prices)
          const estimatedUnitPrice = item.category === 'controlled' ? 50 :
            item.category === 'refrigerated' ? 30 : 10;
          const estimatedValue = item.qtyOnHand * estimatedUnitPrice;

          // Calculate expiry info
          const expiryDate = new Date(item.expiryDate);
          const today = new Date();
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          // Risk scoring
          const isExpiringSoon = daysUntilExpiry < 90;
          const hasHighValue = estimatedValue > 500;
          const isOverstocked = daysOfStock > 180;

          const riskLevel = (isExpiringSoon && totalUsed === 0) ? 'HIGH' :
            (isExpiringSoon || hasHighValue) && totalUsed < 2 ? 'MEDIUM' :
              'LOW';

          return {
            drugId: item.drugId,
            drugName: item.drugName,
            category: item.category,
            location: item.location,
            qtyOnHand: item.qtyOnHand,
            totalUsed,
            transactionCount,
            avgDailyUsage: avgDailyUsage.toFixed(3),
            daysOfStock,
            estimatedValue: estimatedValue.toFixed(2),
            expiryDate: item.expiryDate,
            daysUntilExpiry,
            isExpiringSoon,
            riskLevel,
            turnoverRate: item.qtyOnHand > 0 ? (totalUsed / item.qtyOnHand).toFixed(3) : '0',
          };
        });

        // Filter slow movers
        let filteredSlowMovers = slowMovers.filter(drug =>
          drug.totalUsed <= maxUsageThreshold
        );

        if (!includeZeroUsage) {
          filteredSlowMovers = filteredSlowMovers.filter(drug => drug.totalUsed > 0);
        }

        // Sort by risk level, then by value
        const riskOrder: any = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        filteredSlowMovers.sort((a, b) => {
          const riskDiff = riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
          if (riskDiff !== 0) return riskDiff;
          return parseFloat(b.estimatedValue) - parseFloat(a.estimatedValue);
        });

        if (filteredSlowMovers.length === 0) {
          return JSON.stringify({
            found: false,
            days,
            maxUsageThreshold,
            locationFilter,
            message: 'No slow moving drugs found - excellent inventory turnover!',
            alertLevel: 'info',
          });
        }

        // Calculate statistics
        const zeroUsage = filteredSlowMovers.filter(d => d.totalUsed === 0);
        const highRisk = filteredSlowMovers.filter(d => d.riskLevel === 'HIGH');
        const mediumRisk = filteredSlowMovers.filter(d => d.riskLevel === 'MEDIUM');
        const totalValue = filteredSlowMovers.reduce((sum, d) => sum + parseFloat(d.estimatedValue), 0);
        const expiringValue = filteredSlowMovers
          .filter(d => d.isExpiringSoon)
          .reduce((sum, d) => sum + parseFloat(d.estimatedValue), 0);
        const controlled = filteredSlowMovers.filter(d => d.category === 'controlled');

        const alertLevel = highRisk.length > 0 ? 'warning' :
          mediumRisk.length > 0 ? 'info' : 'info';

        return JSON.stringify({
          found: true,
          days,
          maxUsageThreshold,
          includeZeroUsage,
          locationFilter,

          summary: {
            totalSlowMovers: filteredSlowMovers.length,
            zeroUsageDrugs: zeroUsage.length,
            byRiskLevel: {
              high: highRisk.length,
              medium: mediumRisk.length,
              low: filteredSlowMovers.length - highRisk.length - mediumRisk.length,
            },
            financialImpact: {
              totalValueTiedUp: totalValue.toFixed(2),
              valueAtRiskExpiry: expiringValue.toFixed(2),
              potentialSavings: (totalValue * 0.7).toFixed(2), // Assume 70% recoverable via redistribution/return
            },
            controlledSubstances: controlled.length,
          },

          alertLevel,

          alertMessage: highRisk.length > 0
            ? `${highRisk.length} slow mover(s) at high risk of expiry/waste`
            : filteredSlowMovers.length > 10
              ? `${filteredSlowMovers.length} slow moving items identified - optimization opportunity`
              : `${filteredSlowMovers.length} slow moving items`,

          slowMovers: filteredSlowMovers.slice(0, 50).map((drug, index) => ({
            rank: index + 1,
            drugName: drug.drugName,
            category: drug.category,
            location: drug.location,
            qtyOnHand: drug.qtyOnHand,
            totalUsed: drug.totalUsed,
            avgDailyUsage: drug.avgDailyUsage,
            daysOfStock: drug.daysOfStock,
            estimatedValue: drug.estimatedValue,
            expiryDate: drug.expiryDate,
            daysUntilExpiry: drug.daysUntilExpiry,
            riskLevel: drug.riskLevel,
            turnoverRate: drug.turnoverRate,

            recommendation: drug.totalUsed === 0 && drug.isExpiringSoon
              ? 'URGENT: No usage + expiring soon - return to supplier or transfer'
              : drug.totalUsed === 0
                ? 'Consider redistribution to higher-use locations or return to supplier'
                : drug.isExpiringSoon
                  ? 'Low usage + expiring soon - prioritize usage or transfer'
                  : drug.daysOfStock > 365
                    ? 'Excessive stock - reduce par levels for future orders'
                    : 'Monitor usage patterns, consider reducing stock levels',

            action: drug.riskLevel === 'HIGH'
              ? 'Immediate review required'
              : drug.riskLevel === 'MEDIUM'
                ? 'Review within 30 days'
                : 'Include in quarterly inventory optimization review',
          })),

          insights: [
            {
              title: 'Highest Value Slow Mover',
              data: (() => {
                const highest = filteredSlowMovers.sort((a, b) =>
                  parseFloat(b.estimatedValue) - parseFloat(a.estimatedValue)
                )[0];
                return `${highest.drugName} - $${highest.estimatedValue} tied up (${highest.daysOfStock} days of stock)`;
              })(),
              recommendation: 'Prioritize redistribution or supplier return for high-value slow movers',
            },
            {
              title: 'Zero Usage Items',
              data: `${zeroUsage.length} drug(s) with no usage in ${days} days`,
              recommendation: zeroUsage.length > 5
                ? 'Significant inventory optimization opportunity - review formulary and par levels'
                : 'Normal levels - continue monitoring',
            },
            {
              title: 'Financial Opportunity',
              data: `$${totalValue.toFixed(2)} tied up in slow inventory, potential recovery: $${(totalValue * 0.7).toFixed(2)}`,
              recommendation: 'Implement redistribution program and supplier return agreements',
            },
          ],

          recommendations: [
            highRisk.length > 0 && `URGENT: ${highRisk.length} high-risk slow mover(s) - immediate action required`,
            zeroUsage.length > 10 && `${zeroUsage.length} drugs with zero usage - review formulary and consider delisting`,
            expiringValue > 1000 && `$${expiringValue.toFixed(2)} at risk of expiry - prioritize usage or return`,
            controlled.length > 0 && `${controlled.length} controlled substance(s) are slow movers - special handling required`,
            'Reduce par levels for slow movers in future procurement',
            'Implement inter-facility transfer program for slow movers',
            'Negotiate supplier return agreements for near-expiry slow movers',
            totalValue > 5000 && 'Significant value tied up - consider inventory optimization initiative',
          ].filter(Boolean),

          optimizationActions: [
            {
              action: 'Redistribute',
              description: 'Transfer slow movers from low-use to high-use locations',
              potentialImpact: 'Improve utilization before expiry',
            },
            {
              action: 'Return to Supplier',
              description: 'Negotiate returns for unexpired, slow-moving items',
              potentialImpact: `Recover up to $${(totalValue * 0.7).toFixed(2)}`,
            },
            {
              action: 'Reduce Par Levels',
              description: 'Lower safety stock and reorder points for confirmed slow movers',
              potentialImpact: 'Prevent future overstock',
            },
            {
              action: 'Formulary Review',
              description: 'Evaluate if zero-usage drugs should remain in formulary',
              potentialImpact: 'Streamline inventory, reduce carrying costs',
            },
          ],

          actions: ['export_to_excel', 'generate_transfer_orders', 'contact_suppliers', 'update_par_levels'],

          note: filteredSlowMovers.length > 50
            ? `Showing top 50 of ${filteredSlowMovers.length} slow movers. Export full report for complete analysis.`
            : 'Complete slow movers report displayed.',

          reportDate: new Date().toISOString(),
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error generating slow movers report: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    },
  });
}

export default createGetSlowMoversReportTool;
