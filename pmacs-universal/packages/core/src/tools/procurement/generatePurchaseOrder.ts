/**
 * Purchase Order Generation Tool
 * Automatically generates purchase orders for low stock items
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import type { DatabaseAdapter } from '../../database/CSVAdapter.js';
import { enrichInventoryItem } from '../../database/models.js';

export function createGeneratePurchaseOrderTool(db: DatabaseAdapter) {
  return new DynamicStructuredTool({
    name: 'generate_purchase_order',
    description: `
Automatically generate purchase order for items below safety stock.
Creates detailed PO with quantities, priorities, and estimated costs.

Use this for queries like:
- "Generate purchase order"
- "Create PO for low stock items"
- "Generate reorder for everything below safety stock"
- "Auto-generate purchase order"
    `.trim(),

    schema: z.object({
      targetDaysOfSupply: z.number().int().min(7).max(90).optional().default(30).describe('Target days of supply to order (default: 30)'),
      includeNearSafetyStock: z.boolean().optional().default(false).describe('Include items near (within 20% of) safety stock (default: false)'),
      locationFilter: z.string().optional().describe('Filter by location (optional)'),
      urgentOnly: z.boolean().optional().default(false).describe('Only include urgent/critical items (default: false)'),
    }),

    func: async ({ targetDaysOfSupply, includeNearSafetyStock, locationFilter, urgentOnly }) => {
      try {
        const rawInventory = await db.loadInventory();
        const inventory = rawInventory.map(item => enrichInventoryItem(item));
        const transactions = await db.loadTransactions(30);

        // Filter by location if specified
        let relevantInventory = inventory;
        if (locationFilter) {
          relevantInventory = inventory.filter(item =>
            item.location.toLowerCase().includes(locationFilter.toLowerCase())
          );
        }

        // Calculate usage rates
        const drugUsage = new Map<string, number>();
        for (const txn of transactions) {
          if (txn.action === 'USE') {
            const current = drugUsage.get(txn.drugId) || 0;
            drugUsage.set(txn.drugId, current + Math.abs(txn.qtyChange));
          }
        }

        // Identify items needing reorder
        const orderItems = [];
        for (const item of relevantInventory) {
          const totalUsage = drugUsage.get(item.drugId) || 0;
          const avgDailyUsage = totalUsage / 30;

          // Determine if item needs reorder
          const belowSafetyStock = item.qtyOnHand < item.safetyStock;
          const nearSafetyStock = item.qtyOnHand < item.safetyStock * 1.2;
          const outOfStock = item.qtyOnHand === 0;

          let shouldOrder = false;
          let urgencyLevel = 'STANDARD';

          if (outOfStock) {
            shouldOrder = true;
            urgencyLevel = 'EMERGENCY';
          } else if (belowSafetyStock) {
            shouldOrder = true;
            urgencyLevel = avgDailyUsage > item.qtyOnHand / 7 ? 'URGENT' : 'STANDARD';
          } else if (includeNearSafetyStock && nearSafetyStock) {
            shouldOrder = true;
            urgencyLevel = 'STANDARD';
          }

          // Filter by urgency if requested
          if (urgentOnly && urgencyLevel === 'STANDARD') {
            shouldOrder = false;
          }

          if (!shouldOrder) continue;

          // Calculate order quantity
          const targetStock = Math.max(
            item.safetyStock * 1.5,
            avgDailyUsage * targetDaysOfSupply
          );
          const neededQty = Math.ceil(targetStock - item.qtyOnHand);

          // Pack size optimization (round to pack size of 50)
          const packSize = 50;
          const orderQty = Math.ceil(neededQty / packSize) * packSize;

          // Estimate unit price (simplified - real system would use supplier catalog)
          const estimatedUnitPrice = item.category === 'controlled' ? 50 :
            item.category === 'refrigerated' ? 30 : 10;
          const lineTotal = orderQty * estimatedUnitPrice;

          orderItems.push({
            drugId: item.drugId,
            drugName: item.drugName,
            category: item.category,
            location: item.location,
            currentStock: item.qtyOnHand,
            safetyStock: item.safetyStock,
            avgDailyUsage: avgDailyUsage.toFixed(2),
            neededQty,
            orderQty,
            packSize,
            packs: orderQty / packSize,
            urgencyLevel,
            estimatedUnitPrice: estimatedUnitPrice.toFixed(2),
            lineTotal: lineTotal.toFixed(2),
          });
        }

        if (orderItems.length === 0) {
          return JSON.stringify({
            found: false,
            targetDaysOfSupply,
            includeNearSafetyStock,
            locationFilter,
            urgentOnly,
            message: urgentOnly
              ? 'No urgent items require ordering'
              : 'All items adequately stocked - no purchase order needed',
            alertLevel: 'info',
            note: 'Excellent inventory management!',
          });
        }

        // Sort by urgency, then by value
        const urgencyOrder: any = { EMERGENCY: 0, URGENT: 1, STANDARD: 2 };
        orderItems.sort((a, b) => {
          const urgencyDiff = urgencyOrder[a.urgencyLevel] - urgencyOrder[b.urgencyLevel];
          if (urgencyDiff !== 0) return urgencyDiff;
          return parseFloat(b.lineTotal) - parseFloat(a.lineTotal);
        });

        // Calculate totals
        const emergencyItems = orderItems.filter(i => i.urgencyLevel === 'EMERGENCY');
        const urgentItems = orderItems.filter(i => i.urgencyLevel === 'URGENT');
        const standardItems = orderItems.filter(i => i.urgencyLevel === 'STANDARD');
        const totalValue = orderItems.reduce((sum, i) => sum + parseFloat(i.lineTotal), 0);
        const totalQty = orderItems.reduce((sum, i) => sum + i.orderQty, 0);
        const controlledItems = orderItems.filter(i => i.category === 'controlled');

        // Generate PO number
        const poNumber = `PO-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

        const alertLevel = emergencyItems.length > 0 ? 'critical' :
          urgentItems.length > 0 ? 'warning' : 'info';

        return JSON.stringify({
          found: true,
          poGenerated: true,

          purchaseOrder: {
            poNumber,
            generatedDate: new Date().toISOString(),
            requestedBy: 'P-MACS Automated System',
            targetDaysOfSupply,
            locationFilter: locationFilter || 'All Locations',

            summary: {
              totalLineItems: orderItems.length,
              totalQuantity: totalQty,
              estimatedTotal: totalValue.toFixed(2),
              byUrgency: {
                emergency: emergencyItems.length,
                urgent: urgentItems.length,
                standard: standardItems.length,
              },
              controlledSubstances: controlledItems.length,
              uniqueLocations: new Set(orderItems.map(i => i.location)).size,
            },

            lineItems: orderItems.map((item, index) => ({
              lineNumber: index + 1,
              drugName: item.drugName,
              category: item.category,
              location: item.location,
              currentStock: item.currentStock,
              orderQty: item.orderQty,
              packs: item.packs,
              packSize: item.packSize,
              unitPrice: item.estimatedUnitPrice,
              lineTotal: item.lineTotal,
              urgency: item.urgencyLevel,
              note: item.urgencyLevel === 'EMERGENCY'
                ? 'OUT OF STOCK - Expedite delivery'
                : item.urgencyLevel === 'URGENT'
                  ? 'Below safety stock - Priority delivery'
                  : 'Standard replenishment',
            })),

            urgencyBreakdown: {
              emergency: emergencyItems.length > 0 ? {
                count: emergencyItems.length,
                items: emergencyItems.map(i => i.drugName),
                totalValue: emergencyItems.reduce((sum, i) => sum + parseFloat(i.lineTotal), 0).toFixed(2),
                deliveryRequired: 'IMMEDIATE (24-48 hours)',
                note: 'Items are currently OUT OF STOCK',
              } : undefined,

              urgent: urgentItems.length > 0 ? {
                count: urgentItems.length,
                items: urgentItems.slice(0, 10).map(i => i.drugName),
                totalValue: urgentItems.reduce((sum, i) => sum + parseFloat(i.lineTotal), 0).toFixed(2),
                deliveryRequired: 'PRIORITY (3-5 days)',
                note: 'Items below safety stock',
              } : undefined,

              standard: standardItems.length > 0 ? {
                count: standardItems.length,
                totalValue: standardItems.reduce((sum, i) => sum + parseFloat(i.lineTotal), 0).toFixed(2),
                deliveryRequired: 'STANDARD (7-14 days)',
              } : undefined,
            },

            controlledSubstances: controlledItems.length > 0 ? {
              count: controlledItems.length,
              items: controlledItems.map(i => ({
                drugName: i.drugName,
                location: i.location,
                orderQty: i.orderQty,
                urgency: i.urgencyLevel,
              })),
              warning: 'CONTROLLED SUBSTANCES - Requires special procurement authorization and documentation',
              action: 'Obtain approval from pharmacy supervisor before submitting PO',
            } : undefined,

            deliveryInstructions: [
              emergencyItems.length > 0 && 'EXPEDITE: Emergency items require immediate delivery',
              controlledItems.length > 0 && 'Controlled substances require chain-of-custody documentation',
              'Verify batch numbers and expiry dates on delivery',
              'Refrigerated items require cold chain verification',
              'Inspect packaging for damage before accepting delivery',
            ].filter(Boolean),

            approvalRequired: totalValue > 5000 || controlledItems.length > 0,
          },

          alertLevel,

          alertMessage: emergencyItems.length > 0
            ? `CRITICAL: PO includes ${emergencyItems.length} emergency item(s) - expedite approval and delivery`
            : urgentItems.length > 0
              ? `URGENT: PO includes ${urgentItems.length} priority item(s)`
              : `Standard PO generated for ${orderItems.length} item(s)`,

          recommendations: [
            emergencyItems.length > 0 && `Emergency procurement needed for ${emergencyItems.length} items - contact suppliers immediately`,
            controlledItems.length > 0 && `${controlledItems.length} controlled substance(s) - ensure DEA compliance`,
            totalValue > 10000 && `High-value order ($${totalValue.toFixed(2)}) - consider bulk discount negotiation`,
            'Review delivery schedule to ensure availability',
            'Verify supplier stock availability before confirming PO',
            standardItems.length > 20 && 'Large order - consider splitting delivery for better cash flow',
          ].filter(Boolean),

          nextSteps: [
            { step: 1, action: 'Review and approve PO', responsible: 'Pharmacy Manager' },
            { step: 2, action: 'Submit to supplier(s)', responsible: 'Procurement' },
            { step: 3, action: 'Schedule delivery', responsible: 'Receiving' },
            { step: 4, action: 'Update inventory on receipt', responsible: 'Pharmacy Staff' },
            { step: 5, action: 'Verify invoice matches PO', responsible: 'Accounts Payable' },
          ],

          actions: ['print_po', 'email_to_supplier', 'save_pdf', 'send_for_approval', 'track_order'],

          note: `Purchase order generated for ${targetDaysOfSupply} days of supply. Total estimated value: $${totalValue.toFixed(2)}`,
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error generating purchase order: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    },
  });
}

export default createGeneratePurchaseOrderTool;
