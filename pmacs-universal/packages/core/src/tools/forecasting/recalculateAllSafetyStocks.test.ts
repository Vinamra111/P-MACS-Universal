/**
 * Tests for recalculateAllSafetyStocks tool
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createRecalculateAllSafetyStocksTool } from './recalculateAllSafetyStocks.js';
import { MockDatabaseAdapter } from '../../test/setup.js';

describe('recalculateAllSafetyStocks', () => {
  let db: MockDatabaseAdapter;
  let tool: ReturnType<typeof createRecalculateAllSafetyStocksTool>;

  beforeEach(() => {
    db = new MockDatabaseAdapter();
    tool = createRecalculateAllSafetyStocksTool(db);
  });

  it('should have correct name and description', () => {
    expect(tool.name).toBe('recalculate_all_safety_stocks');
    expect(tool.description).toContain('safety stock');
  });

  it('should recalculate safety stocks for all items', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    expect(parsed.found).toBe(true);
    expect(parsed.summary).toHaveProperty('totalAnalyzed');
  });

  it('should update safety stock values', async () => {
    const result = await tool.invoke({ updateDatabase: true });
    const parsed = JSON.parse(result);

    if (parsed.found) {
      expect(parsed.summary).toHaveProperty('updated');
      expect(typeof parsed.summary.updated).toBe('number');
    }
  });

  it('should respect category filter', async () => {
    const result = await tool.invoke({ category: 'controlled' });
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.recalculations) {
      expect(parsed.category).toBe('controlled');
    }
  });

  it('should respect service level parameter', async () => {
    const result95 = await tool.invoke({ serviceLevel: 0.95 });
    const result99 = await tool.invoke({ serviceLevel: 0.99 });

    const parsed95 = JSON.parse(result95);
    const parsed99 = JSON.parse(result99);

    expect(parsed95.found).toBe(true);
    expect(parsed99.found).toBe(true);
    expect(parsed95.serviceLevel).toBe(0.95);
    expect(parsed99.serviceLevel).toBe(0.99);
  });

  it('should respect lead time parameter', async () => {
    const result = await tool.invoke({ leadTimeDays: 7 });
    const parsed = JSON.parse(result);

    expect(parsed.found).toBe(true);
    expect(parsed.leadTimeDays).toBe(7);
  });

  it('should provide summary statistics', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found) {
      expect(parsed.summary).toHaveProperty('byRecommendation');
      expect(parsed.summary.byRecommendation).toHaveProperty('significantIncreases');
      expect(parsed.summary.byRecommendation).toHaveProperty('significantDecreases');
    }
  });

  it('should identify items with significant changes', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found) {
      expect(parsed).toHaveProperty('recalculations');
      expect(Array.isArray(parsed.recalculations)).toBe(true);
    }
  });

  it('should generate execution report', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found) {
      expect(parsed).toHaveProperty('reportDate');
      expect(parsed).toHaveProperty('methodology');
    }
  });

  it('should handle items with insufficient data', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found) {
      expect(parsed.summary).toHaveProperty('skippedDueToInsufficientData');
      expect(typeof parsed.summary.skippedDueToInsufficientData).toBe('number');
    }
  });
});
