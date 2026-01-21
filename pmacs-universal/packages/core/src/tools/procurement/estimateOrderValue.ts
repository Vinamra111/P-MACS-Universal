/**
 * Order Value Estimation Tool
 * Estimates total cost for ordering specific drugs or categories
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import type { DatabaseAdapter } from '../../database/CSVAdapter.js';
import { enrichInventoryItem } from '../../database/models.js';

export function createEstimateOrderValueTool(db: DatabaseAdapter) {
  return new DynamicStructuredTool({
    name: 'estimate_order_value',
    description: `
Estimate total cost for ordering drugs.
Useful for budget planning and procurement cost analysis.

Use this for queries like:
- "How much to order 500 units of Propofol?"
- "Estimate cost for drug X"
- "Order value for controlled substances"
- "Budget estimate for restocking ICU"
    `.trim(),

    schema: z.object({
      drugName: z.string().optional().describe('Specific drug name (optional)'),
      quantity: z.number().int().min(1).optional().describe('Quantity to order (optional)'),
      category: z.string().optional().describe('Category: controlled, refrigerated, or standard (optional)'),
      location: z.string().optional().describe('Location to restock (optional)'),
    }),

    func: async ({ drugName, quantity, category, location }) => {
      try {
        const rawInventory = await db.loadInventory();
        const inventory = rawInventory.map(item => enrichInventoryItem(item));

        // Filter inventory based on criteria
        let items = inventory;

        if (drugName) {
          items = items.filter(item =>
            item.drugName.toLowerCase().includes(drugName.toLowerCase())
          );
        }

        if (category) {
          items = items.filter(item =>
            item.category.toLowerCase() === category.toLowerCase()
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
            quantity,
            category,
            location,
            message: 'No matching items found',
            suggestion: 'Check search criteria and try again',
          });
        }

        // Price tiers (simplified - real system would use supplier catalog)
        const basePrices = {
          controlled: 50,
          refrigerated: 30,
          standard: 10,
        };

        // Volume discount tiers
        const getUnitPrice = (qty: number, basePrice: number) => {
          if (qty >= 1000) return basePrice * 0.85; // 15% discount
          if (qty >= 500) return basePrice * 0.90; // 10% discount
          if (qty >= 200) return basePrice * 0.95; // 5% discount
          return basePrice;
        };

        // Shipping costs
        const calculateShipping = (totalValue: number, itemCount: number) => {
          if (totalValue > 5000) return 0; // Free shipping
          if (totalValue > 2000) return 50; // Flat rate
          return Math.max(25, itemCount * 5); // Per-item or minimum
        };

        // If specific drug and quantity provided
        if (drugName && quantity && items.length > 0) {
          const item = items[0];
          const basePrice = basePrices[item.category as keyof typeof basePrices] || basePrices.standard;
          const unitPrice = getUnitPrice(quantity, basePrice);
          const subtotal = quantity * unitPrice;
          const shipping = calculateShipping(subtotal, 1);
          const total = subtotal + shipping;

          const packSize = 50;
          const packs = Math.ceil(quantity / packSize);
          const roundedQty = packs * packSize;
          const roundedSubtotal = roundedQty * unitPrice;
          const roundedTotal = roundedSubtotal + shipping;

          return JSON.stringify({
            found: true,
            estimateType: 'specific_order',
            drugName: item.drugName,
            category: item.category,
            location: item.location,

            requestedOrder: {
              quantity,
              unitPrice: unitPrice.toFixed(2),
              subtotal: subtotal.toFixed(2),
              shipping: shipping.toFixed(2),
              total: total.toFixed(2),
            },

            optimizedOrder: {
              note: 'Rounded to pack size for cost efficiency',
              packs,
              packSize,
              quantity: roundedQty,
              unitPrice: unitPrice.toFixed(2),
              subtotal: roundedSubtotal.toFixed(2),
              shipping: shipping.toFixed(2),
              total: roundedTotal.toFixed(2),
              savings: roundedQty > quantity
                ? `Adding ${roundedQty - quantity} units costs only $${((roundedQty - quantity) * unitPrice).toFixed(2)} more`
                : 'Optimal quantity',
            },

            discountApplied: quantity >= 200 ? {
              tier: quantity >= 1000 ? '1000+ units' : quantity >= 500 ? '500+ units' : '200+ units',
              discount: quantity >= 1000 ? '15%' : quantity >= 500 ? '10%' : '5%',
              saved: (quantity * basePrice * (quantity >= 1000 ? 0.15 : quantity >= 500 ? 0.10 : 0.05)).toFixed(2),
            } : undefined,

            breakdown: {
              basePrice: basePrice.toFixed(2),
              discountedPrice: unitPrice.toFixed(2),
              packOptimization: roundedQty > quantity ? `+${roundedQty - quantity} units to complete pack` : 'Already optimal',
              shippingMethod: shipping === 0 ? 'FREE (order > $5000)' :
                shipping === 50 ? 'Flat rate (order > $2000)' : 'Standard shipping',
            },

            specialNotes: [
              item.category === 'controlled' && 'Controlled substance - requires DEA authorization',
              item.category === 'refrigerated' && 'Refrigerated item - cold chain shipping (+$20)',
              quantity >= 500 && 'Large order - verify supplier stock availability',
              total > 10000 && 'High-value order - consider payment terms negotiation',
            ].filter(Boolean),

            actions: ['request_formal_quote', 'check_supplier_availability', 'generate_po'],
          }, null, 2);
        }

        // Estimate for category or location
        const estimates = items.map(item => {
          // Estimate order quantity (2 months supply based on avg usage or safety stock * 2)
          const estimatedQty = Math.max(item.safetyStock * 2, 100);
          const basePrice = basePrices[item.category as keyof typeof basePrices] || basePrices.standard;
          const unitPrice = getUnitPrice(estimatedQty, basePrice);
          const lineTotal = estimatedQty * unitPrice;

          return {
            drugName: item.drugName,
            category: item.category,
            location: item.location,
            estimatedQty,
            unitPrice: unitPrice.toFixed(2),
            lineTotal: lineTotal.toFixed(2),
          };
        });

        const subtotal = estimates.reduce((sum, e) => sum + parseFloat(e.lineTotal), 0);
        const shipping = calculateShipping(subtotal, estimates.length);
        const total = subtotal + shipping;

        // Group by category
        const byCategory = new Map<string, typeof estimates>();
        for (const est of estimates) {
          const existing = byCategory.get(est.category) || [];
          existing.push(est);
          byCategory.set(est.category, existing);
        }

        const categorySummary = Array.from(byCategory.entries()).map(([cat, items]) => ({
          category: cat,
          itemCount: items.length,
          totalValue: items.reduce((sum, i) => sum + parseFloat(i.lineTotal), 0).toFixed(2),
        }));

        return JSON.stringify({
          found: true,
          estimateType: category ? 'category_estimate' : location ? 'location_estimate' : 'bulk_estimate',
          category,
          location,

          summary: {
            totalItems: estimates.length,
            estimatedSubtotal: subtotal.toFixed(2),
            estimatedShipping: shipping.toFixed(2),
            estimatedTotal: total.toFixed(2),
            note: 'Estimates based on 2-month supply for each item',
          },

          byCategory: categorySummary,

          itemEstimates: estimates.slice(0, 50).map((est, index) => ({
            rank: index + 1,
            drugName: est.drugName,
            category: est.category,
            location: est.location,
            quantity: est.estimatedQty,
            unitPrice: est.unitPrice,
            lineTotal: est.lineTotal,
          })),

          potentialSavings: {
            volumeDiscounts: subtotal > 10000
              ? `Potential 15% bulk discount: Save $${(subtotal * 0.15).toFixed(2)}`
              : subtotal > 5000
                ? `Potential 10% bulk discount: Save $${(subtotal * 0.10).toFixed(2)}`
                : 'Order more for volume discounts',

            freeShipping: shipping > 0 && subtotal < 5000
              ? `Order $${(5000 - subtotal).toFixed(2)} more for free shipping (save $${shipping.toFixed(2)})`
              : shipping === 0
                ? 'Free shipping applied'
                : null,

            consolidatedOrdering: estimates.length > 10
              ? 'Consolidated order reduces per-item overhead costs'
              : null,
          },

          budgetGuidance: {
            immediate: total.toFixed(2),
            quarterly: (total * 1.5).toFixed(2), // 50% buffer
            annual: (total * 6).toFixed(2), // Assumes 2-month orders
            note: 'Annual estimate assumes current usage patterns continue',
          },

          recommendations: [
            subtotal > 10000 && 'Request volume discount quote from suppliers',
            shipping > 50 && subtotal < 5000 && `Add $${(5000 - subtotal).toFixed(2)} to order for free shipping`,
            estimates.length > 20 && 'Consider supplier consolidation for better pricing',
            categorySummary.find(c => c.category === 'controlled') && 'Controlled substances may have different payment terms',
            'Compare prices across multiple suppliers for best value',
            'Negotiate payment terms for orders over $10,000',
          ].filter(Boolean),

          supplierNotes: [
            {
              supplierType: 'Primary Pharmaceutical Distributor',
              advantages: 'Best for bulk standard drugs, established terms',
              recommendedFor: 'Standard category items',
            },
            {
              supplierType: 'Specialty Controlled Substance Supplier',
              advantages: 'DEA licensed, secure handling',
              recommendedFor: 'Controlled substances',
            },
            {
              supplierType: 'Cold Chain Specialist',
              advantages: 'Temperature-controlled logistics',
              recommendedFor: 'Refrigerated items',
            },
          ],

          actions: ['request_quotes', 'compare_suppliers', 'schedule_procurement_meeting', 'export_estimate'],

          note: estimates.length > 50
            ? `Showing first 50 of ${estimates.length} items. Export full estimate for complete breakdown.`
            : 'Complete cost estimate provided.',

          disclaimer: 'Estimates based on current pricing tiers. Actual costs may vary. Request formal quote for accurate pricing.',

          reportDate: new Date().toISOString(),
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error estimating order value: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    },
  });
}

export default createEstimateOrderValueTool;
