/**
 * Update Inventory Tool
 * Updates stock quantity for a drug at a specific location
 * Requires Pharmacist or Master role
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import type { DatabaseAdapter } from '../../database/CSVAdapter.js';
import type { UserRole } from '../../types/index.js';
import { getCurrentTimestamp } from '../../utils/dateUtils.js';

export function createUpdateInventoryTool(
  db: DatabaseAdapter,
  userRole: UserRole,
  userId: string
) {
  return new DynamicStructuredTool({
    name: 'update_inventory',
    description: `
Update stock quantity for a drug at a specific location.
Requires Pharmacist or Master role authorization.
Creates transaction log entry for audit trail.

Use this for queries like:
- "Add 50 units of Propofol to ICU"
- "Update Morphine stock to 100"
- "Received 200 Paracetamol in Pharmacy"
- "Dispense 10 Insulin from Fridge"
    `.trim(),

    schema: z.object({
      drugName: z.string().describe('Name of the drug to update'),
      location: z.string().describe('Storage location (e.g., ICU-Shelf-A, ER-Cabinet-B)'),
      newQuantity: z.number().int().min(0).describe('New quantity (absolute value, not delta)'),
      reason: z.string().optional().describe('Reason for update (e.g., "received", "dispensed", "adjustment")'),
    }),

    func: async ({ drugName, location, newQuantity, reason }) => {
      try {
        // Permission check
        if (userRole === 'Nurse') {
          return JSON.stringify({
            error: true,
            permissionDenied: true,
            message: 'Access denied. Stock updates require Pharmacist or Master authorization.',
            requiredRole: 'Pharmacist',
          });
        }

        // Find the item
        const inventory = await db.loadInventory();
        const itemIndex = inventory.findIndex(
          item =>
            item.drugName.toLowerCase() === drugName.toLowerCase() &&
            item.location.toLowerCase() === location.toLowerCase()
        );

        if (itemIndex === -1) {
          return JSON.stringify({
            error: true,
            notFound: true,
            message: `Drug "${drugName}" not found at location "${location}".`,
            suggestion: 'Check drug name and location. Use lookup_inventory to verify.',
          });
        }

        const item = inventory[itemIndex];
        const oldQuantity = item.qtyOnHand;
        const quantityChange = newQuantity - oldQuantity;

        // Update quantity
        inventory[itemIndex] = {
          ...item,
          qtyOnHand: newQuantity,
        };

        await db.saveInventory(inventory);

        // Create transaction log
        const txnType = quantityChange > 0
          ? 'RECEIVED'
          : quantityChange < 0
            ? 'DISPENSED'
            : 'ADJUSTED';

        await db.addTransaction({
          txnId: `TXN${Date.now()}`,
          timestamp: getCurrentTimestamp(),
          userId: userId,
          drugId: item.drugId,
          action: txnType as any,
          qtyChange: quantityChange,
          details: JSON.stringify({
            drugName: item.drugName,
            location: item.location,
            qtyBefore: oldQuantity,
            qtyAfter: newQuantity,
            batchLot: item.batchLot,
            reason: reason || `Stock ${txnType.toLowerCase()} by ${userId}`,
            approvedBy: userId,
          }),
        });

        // Determine new status
        const newStatus = newQuantity === 0
          ? 'stockout'
          : newQuantity < item.safetyStock
            ? 'low'
            : 'available';

        return JSON.stringify({
          success: true,
          updated: true,
          drug: item.drugName,
          location: item.location,
          oldQuantity,
          newQuantity,
          change: quantityChange,
          changeType: txnType,
          newStatus,
          updatedBy: userId,
          timestamp: getCurrentTimestamp(),

          alert: newQuantity === 0
            ? { level: 'critical', message: 'Stock depleted - immediate reorder required' }
            : newQuantity < item.safetyStock
              ? { level: 'warning', message: 'Below safety stock - consider reordering' }
              : undefined,

          recommendation: newQuantity < item.safetyStock
            ? `Reorder ${item.safetyStock - newQuantity} units to reach safety stock level`
            : undefined,
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error updating inventory: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    },
  });
}

export default createUpdateInventoryTool;
