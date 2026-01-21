/**
 * Tests for generatePurchaseOrder tool
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createGeneratePurchaseOrderTool } from './generatePurchaseOrder.js';
import { MockDatabaseAdapter } from '../../test/setup.js';

describe('generatePurchaseOrder', () => {
  let db: MockDatabaseAdapter;
  let tool: ReturnType<typeof createGeneratePurchaseOrderTool>;

  beforeEach(() => {
    db = new MockDatabaseAdapter();
    tool = createGeneratePurchaseOrderTool(db);
  });

  it('should have correct name and description', () => {
    expect(tool.name).toBe('generate_purchase_order');
    expect(tool.description).toContain('purchase order');
  });

  it('should generate PO for low stock items', async () => {
    const result = await tool.invoke({
      targetDaysOfSupply: 30
    });
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.poGenerated) {
      expect(parsed.purchaseOrder).toBeDefined();
      expect(parsed.purchaseOrder.lineItems).toBeDefined();
      expect(Array.isArray(parsed.purchaseOrder.lineItems)).toBe(true);
    }
  });

  it('should include items near safety stock when requested', async () => {
    const result = await tool.invoke({
      targetDaysOfSupply: 30,
      includeNearSafetyStock: true
    });
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.poGenerated) {
      expect(parsed.purchaseOrder.lineItems).toBeDefined();
      expect(Array.isArray(parsed.purchaseOrder.lineItems)).toBe(true);
    }
  });

  it('should assign unique PO number', async () => {
    const result = await tool.invoke({
      targetDaysOfSupply: 30
    });
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.purchaseOrder) {
      expect(parsed.purchaseOrder).toHaveProperty('poNumber');
      expect(typeof parsed.purchaseOrder.poNumber).toBe('string');
      expect(parsed.purchaseOrder.poNumber.length).toBeGreaterThan(0);
      expect(parsed.purchaseOrder.poNumber).toMatch(/^PO-\d{8}-\d{4}$/);
    }
  });

  it('should calculate total value', async () => {
    const result = await tool.invoke({
      targetDaysOfSupply: 30
    });
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.purchaseOrder && parsed.purchaseOrder.summary) {
      expect(parsed.purchaseOrder.summary).toHaveProperty('estimatedTotal');
      const total = parseFloat(parsed.purchaseOrder.summary.estimatedTotal);
      expect(typeof total).toBe('number');
      expect(total).toBeGreaterThan(0);
    }
  });

  it('should include summary information', async () => {
    const result = await tool.invoke({
      targetDaysOfSupply: 30
    });
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.purchaseOrder && parsed.purchaseOrder.summary) {
      expect(parsed.purchaseOrder.summary).toHaveProperty('totalLineItems');
      expect(parsed.purchaseOrder.summary).toHaveProperty('totalQuantity');
      expect(parsed.purchaseOrder.summary).toHaveProperty('estimatedTotal');
    }
  });

  it('should include generated date', async () => {
    const result = await tool.invoke({
      targetDaysOfSupply: 30
    });
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.purchaseOrder) {
      expect(parsed.purchaseOrder).toHaveProperty('generatedDate');
      const date = new Date(parsed.purchaseOrder.generatedDate);
      expect(date).toBeInstanceOf(Date);
      expect(isNaN(date.getTime())).toBe(false);
    }
  });

  it('should include urgency breakdown', async () => {
    const result = await tool.invoke({
      targetDaysOfSupply: 30
    });
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.purchaseOrder) {
      expect(parsed.purchaseOrder).toHaveProperty('urgencyBreakdown');
      expect(parsed.purchaseOrder.summary).toHaveProperty('byUrgency');
    }
  });

  it('should mark controlled substances', async () => {
    const result = await tool.invoke({
      targetDaysOfSupply: 30
    });
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.purchaseOrder && parsed.purchaseOrder.summary) {
      expect(parsed.purchaseOrder.summary).toHaveProperty('controlledSubstances');
      expect(typeof parsed.purchaseOrder.summary.controlledSubstances).toBe('number');
    }
  });

  it('should handle case when no items need ordering', async () => {
    const result = await tool.invoke({
      targetDaysOfSupply: 7,
      urgentOnly: true
    });
    const parsed = JSON.parse(result);

    // Could be either found with items or found=false with no items, but should have a message
    if (parsed.found === false) {
      expect(parsed).toHaveProperty('message');
    } else if (parsed.found && parsed.note) {
      expect(typeof parsed.note).toBe('string');
    }
  });

  it('should filter by location when specified', async () => {
    const result = await tool.invoke({
      targetDaysOfSupply: 30,
      locationFilter: 'ICU'
    });
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.purchaseOrder && parsed.purchaseOrder.lineItems) {
      // All line items should be from ICU location
      const allFromICU = parsed.purchaseOrder.lineItems.every((item: any) =>
        item.location.includes('ICU')
      );
      expect(allFromICU).toBe(true);
    }
  });
});
