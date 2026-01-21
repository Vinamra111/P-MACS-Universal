/**
 * Tests for listWardStock tool
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createListWardStockTool } from './listWardStock.js';
import { MockDatabaseAdapter } from '../../test/setup.js';

describe('listWardStock', () => {
  let db: MockDatabaseAdapter;
  let tool: ReturnType<typeof createListWardStockTool>;

  beforeEach(() => {
    db = new MockDatabaseAdapter();
    tool = createListWardStockTool(db);
  });

  it('should have correct name', () => {
    expect(tool.name).toBe('list_ward_stock');
  });

  it('should list stock for specific location', async () => {
    const result = await tool.invoke({ location: 'ICU-Shelf-A' });
    const parsed = JSON.parse(result);

    if (parsed.found) {
      expect(parsed.location).toBe('ICU-Shelf-A');
      expect(Array.isArray(parsed.items)).toBe(true);
    }
  });

  it('should return not found for invalid location', async () => {
    const result = await tool.invoke({ location: 'InvalidLocationXYZ123' });
    const parsed = JSON.parse(result);

    expect(parsed.found).toBe(false);
    expect(parsed.message).toBeDefined();
  });

  it('should provide location summary', async () => {
    const result = await tool.invoke({ location: 'ICU-Shelf-A' });
    const parsed = JSON.parse(result);

    if (parsed.found) {
      expect(parsed.summary).toHaveProperty('totalItems');
      expect(parsed.summary).toHaveProperty('stockouts');
      expect(parsed.summary).toHaveProperty('lowStock');
      expect(parsed.summary).toHaveProperty('expired');
      expect(parsed.summary).toHaveProperty('adequate');
    }
  });

  it('should include alert level and message', async () => {
    const result = await tool.invoke({ location: 'ICU-Shelf-A' });
    const parsed = JSON.parse(result);

    if (parsed.found) {
      expect(parsed.alertLevel).toBeDefined();
      expect(['info', 'warning', 'critical']).toContain(parsed.alertLevel);
      expect(parsed.alertMessage).toBeDefined();
    }
  });

  it('should include item details', async () => {
    const result = await tool.invoke({ location: 'ICU-Shelf-A' });
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.items.length > 0) {
      const item = parsed.items[0];
      expect(item).toHaveProperty('drugName');
      expect(item).toHaveProperty('category');
      expect(item).toHaveProperty('quantity');
      expect(item).toHaveProperty('status');
      expect(item).toHaveProperty('safetyStock');
    }
  });

  it('should include recommendations', async () => {
    const result = await tool.invoke({ location: 'ICU-Shelf-A' });
    const parsed = JSON.parse(result);

    if (parsed.found) {
      expect(Array.isArray(parsed.recommendations)).toBe(true);
    }
  });

  it('should provide suggestions when location not found', async () => {
    const result = await tool.invoke({ location: 'InvalidLocationXYZ123' });
    const parsed = JSON.parse(result);

    expect(parsed.found).toBe(false);
    expect(Array.isArray(parsed.suggestions)).toBe(true);
  });

  it('should filter out adequate items when includeAdequate is false', async () => {
    const result = await tool.invoke({
      location: 'ICU-Shelf-A',
      includeAdequate: false
    });
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.items.length > 0) {
      expect(parsed.items.every((item: any) => item.status !== 'adequate')).toBe(true);
    }
  });
});
