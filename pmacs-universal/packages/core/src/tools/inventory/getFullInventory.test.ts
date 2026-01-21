/**
 * Tests for getFullInventory tool
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createGetFullInventoryTool } from './getFullInventory.js';
import { MockDatabaseAdapter } from '../../test/setup.js';

describe('getFullInventory', () => {
  let db: MockDatabaseAdapter;
  let tool: ReturnType<typeof createGetFullInventoryTool>;

  beforeEach(() => {
    db = new MockDatabaseAdapter();
    tool = createGetFullInventoryTool(db);
  });

  it('should have correct name', () => {
    expect(tool.name).toBe('get_full_inventory');
  });

  it('should return all inventory items', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    expect(parsed.summary).toBeDefined();
    expect(parsed.summary.totalItems).toBeGreaterThanOrEqual(0);
    expect(parsed.items).toBeDefined();
    expect(Array.isArray(parsed.items)).toBe(true);
  });

  it('should filter by status', async () => {
    const result = await tool.invoke({ statusFilter: 'low' });
    const parsed = JSON.parse(result);

    expect(parsed.summary.filtersApplied.status).toBe('low');
    if (parsed.items.length > 0) {
      expect(parsed.items.every((item: any) => item.status === 'low')).toBe(true);
    }
  });

  it('should filter by category', async () => {
    const result = await tool.invoke({ categoryFilter: 'controlled' });
    const parsed = JSON.parse(result);

    expect(parsed.summary.filtersApplied.category).toBe('controlled');
    if (parsed.items.length > 0) {
      expect(parsed.items.every((item: any) => item.category === 'controlled')).toBe(true);
    }
  });

  it('should provide summary statistics', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    expect(parsed.summary).toHaveProperty('byStatus');
    expect(parsed.summary).toHaveProperty('byCategory');
    expect(parsed.summary).toHaveProperty('totalItems');
    expect(parsed.summary).toHaveProperty('totalLocations');
    expect(parsed.summary).toHaveProperty('uniqueDrugs');
  });

  it('should calculate total quantity', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    expect(parsed.summary).toHaveProperty('totalQuantity');
    expect(typeof parsed.summary.totalQuantity).toBe('number');
  });

  it('should include alert level and message', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    expect(parsed.alertLevel).toBeDefined();
    expect(['info', 'warning', 'critical']).toContain(parsed.alertLevel);
    expect(parsed.alertMessage).toBeDefined();
  });

  it('should include recommendations', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    expect(Array.isArray(parsed.recommendations)).toBe(true);
  });

  it('should limit results when requested', async () => {
    const result = await tool.invoke({ limitResults: 10 });
    const parsed = JSON.parse(result);

    expect(parsed.items.length).toBeLessThanOrEqual(10);
    expect(parsed.summary.resultsShown).toBeLessThanOrEqual(10);
  });

  it('should include item details', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.items.length > 0) {
      const item = parsed.items[0];
      expect(item).toHaveProperty('drugName');
      expect(item).toHaveProperty('location');
      expect(item).toHaveProperty('category');
      expect(item).toHaveProperty('quantity');
      expect(item).toHaveProperty('status');
    }
  });
});
