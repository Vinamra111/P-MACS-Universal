/**
 * Tests for estimateOrderValue tool
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createEstimateOrderValueTool } from './estimateOrderValue.js';
import { MockDatabaseAdapter } from '../../test/setup.js';

describe('estimateOrderValue', () => {
  let db: MockDatabaseAdapter;
  let tool: ReturnType<typeof createEstimateOrderValueTool>;

  beforeEach(() => {
    db = new MockDatabaseAdapter();
    tool = createEstimateOrderValueTool(db);
  });

  it('should have correct name and description', () => {
    expect(tool.name).toBe('estimate_order_value');
    expect(tool.description).toContain('estimate');
  });

  it('should estimate value for single item', async () => {
    const result = await tool.invoke({
      drugName: 'Propofol',
      quantity: 50
    });
    const parsed = JSON.parse(result);

    expect(parsed.found).toBe(true);
    if (parsed.found) {
      expect(parsed.estimateType).toBe('specific_order');
      expect(parsed.requestedOrder).toBeDefined();
      expect(parsed.requestedOrder.total).toBeDefined();
    }
  });

  it('should estimate value for category', async () => {
    const result = await tool.invoke({
      category: 'controlled'
    });
    const parsed = JSON.parse(result);

    if (parsed.found) {
      expect(parsed.estimateType).toContain('estimate');
      expect(parsed.summary).toBeDefined();
      expect(parsed.itemEstimates).toBeDefined();
      expect(Array.isArray(parsed.itemEstimates)).toBe(true);
    }
  });

  it('should provide per-item breakdown', async () => {
    const result = await tool.invoke({
      drugName: 'Propofol',
      quantity: 50
    });
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.requestedOrder) {
      expect(parsed.requestedOrder).toHaveProperty('quantity');
      expect(parsed.requestedOrder).toHaveProperty('unitPrice');
      expect(parsed.requestedOrder).toHaveProperty('subtotal');
      expect(parsed.requestedOrder).toHaveProperty('total');
    }
  });

  it('should calculate unit prices', async () => {
    const result = await tool.invoke({
      drugName: 'Propofol',
      quantity: 50
    });
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.requestedOrder) {
      const unitPrice = parseFloat(parsed.requestedOrder.unitPrice);
      expect(typeof unitPrice).toBe('number');
      expect(unitPrice).toBeGreaterThan(0);
    }
  });

  it('should calculate subtotals correctly', async () => {
    const result = await tool.invoke({
      drugName: 'Propofol',
      quantity: 10
    });
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.requestedOrder) {
      const unitPrice = parseFloat(parsed.requestedOrder.unitPrice);
      const quantity = parsed.requestedOrder.quantity;
      const subtotal = parseFloat(parsed.requestedOrder.subtotal);
      expect(subtotal).toBeCloseTo(unitPrice * quantity, 1);
    }
  });

  it('should handle bulk discounts when applicable', async () => {
    const result = await tool.invoke({
      drugName: 'Propofol',
      quantity: 1000
    });
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.discountApplied) {
      expect(parsed.discountApplied).toHaveProperty('discount');
      expect(parsed.discountApplied).toHaveProperty('saved');
      expect(parseFloat(parsed.discountApplied.saved)).toBeGreaterThanOrEqual(0);
    }
  });

  it('should include breakdown information', async () => {
    const result = await tool.invoke({
      drugName: 'Propofol',
      quantity: 50
    });
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.breakdown) {
      expect(parsed.breakdown).toHaveProperty('basePrice');
      expect(parsed.breakdown).toHaveProperty('discountedPrice');
      expect(parsed.breakdown).toHaveProperty('shippingMethod');
    }
  });

  it('should handle shipping costs', async () => {
    const result = await tool.invoke({
      drugName: 'Propofol',
      quantity: 50
    });
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.requestedOrder) {
      expect(parsed.requestedOrder).toHaveProperty('shipping');
      const shipping = parseFloat(parsed.requestedOrder.shipping);
      expect(typeof shipping).toBe('number');
      expect(shipping).toBeGreaterThanOrEqual(0);
    }
  });

  it('should return not found for invalid items', async () => {
    const result = await tool.invoke({
      drugName: 'NonExistentDrug123456789',
      quantity: 50
    });
    const parsed = JSON.parse(result);

    expect(parsed.found).toBe(false);
    expect(parsed).toHaveProperty('message');
  });

  it('should flag controlled substances', async () => {
    const result = await tool.invoke({
      drugName: 'Fentanyl',
      quantity: 20
    });
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.category === 'controlled') {
      expect(parsed.specialNotes).toBeDefined();
      const hasControlledNote = parsed.specialNotes.some((note: string) =>
        note.includes('Controlled substance') || note.includes('DEA')
      );
      expect(hasControlledNote).toBe(true);
    }
  });

  it('should provide optimized order suggestions', async () => {
    const result = await tool.invoke({
      drugName: 'Propofol',
      quantity: 50
    });
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.optimizedOrder) {
      expect(parsed.optimizedOrder).toHaveProperty('packs');
      expect(parsed.optimizedOrder).toHaveProperty('packSize');
      expect(parsed.optimizedOrder).toHaveProperty('quantity');
      expect(parsed.optimizedOrder.quantity).toBeGreaterThanOrEqual(50);
    }
  });
});
