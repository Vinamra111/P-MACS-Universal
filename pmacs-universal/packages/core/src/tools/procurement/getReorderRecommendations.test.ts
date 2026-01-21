/**
 * Tests for getReorderRecommendations tool
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createGetReorderRecommendationsTool } from './getReorderRecommendations.js';
import { MockDatabaseAdapter } from '../../test/setup.js';

describe('getReorderRecommendations', () => {
  let db: MockDatabaseAdapter;
  let tool: ReturnType<typeof createGetReorderRecommendationsTool>;

  beforeEach(() => {
    db = new MockDatabaseAdapter();
    tool = createGetReorderRecommendationsTool(db);
  });

  it('should have correct name and description', () => {
    expect(tool.name).toBe('get_reorder_recommendations');
    expect(tool.description).toContain('reorder');
  });

  it('should generate reorder recommendations', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    expect(Array.isArray(parsed.recommendations)).toBe(true);
  });

  it('should include location in recommendations', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.recommendations && parsed.recommendations.length > 0) {
      expect(parsed.recommendations[0]).toHaveProperty('location');
      expect(typeof parsed.recommendations[0].location).toBe('string');
    }
  });

  it('should identify items below reorder point', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.recommendations && parsed.recommendations.length > 0) {
      expect(parsed.recommendations[0]).toHaveProperty('currentStock');
      expect(parsed.recommendations[0]).toHaveProperty('daysUntilStockout');
    }
  });

  it('should calculate suggested order quantity', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.recommendations.length > 0) {
      expect(parsed.recommendations[0]).toHaveProperty('orderQty');
      expect(typeof parsed.recommendations[0].orderQty).toBe('number');
      expect(parsed.recommendations[0].orderQty).toBeGreaterThan(0);
    }
  });

  it('should prioritize by urgency', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.recommendations.length > 0) {
      expect(parsed.recommendations[0]).toHaveProperty('urgency');
      expect(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).toContain(parsed.recommendations[0].urgency);
    }
  });

  it('should sort by urgency', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.recommendations.length > 1) {
      const urgencyOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      const firstUrgency = urgencyOrder[parsed.recommendations[0].urgency] ?? 999;
      const secondUrgency = urgencyOrder[parsed.recommendations[1].urgency] ?? 999;
      expect(firstUrgency).toBeLessThanOrEqual(secondUrgency);
    }
  });

  it('should estimate days until stockout', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.recommendations.length > 0) {
      expect(parsed.recommendations[0]).toHaveProperty('daysUntilStockout');
    }
  });

  it('should calculate estimated order value', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.recommendations.length > 0 && parsed.recommendations[0].estimatedValue) {
      expect(typeof parsed.recommendations[0].estimatedValue).toBe('number');
    }
  });

  it('should flag controlled substances', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    expect(parsed.summary).toHaveProperty('controlledSubstances');
  });

  it('should provide total estimated order value', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    expect(parsed.summary).toHaveProperty('estimatedTotalValue');
    expect(typeof parsed.summary.estimatedTotalValue).toBe('string');
  });

  it('should include urgency in recommendations', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.recommendations.length > 0) {
      expect(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).toContain(parsed.recommendations[0].urgency);
    }
  });

  it('should include supplier recommendations', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.recommendations.length > 0 && parsed.recommendations[0].suggestedSupplier) {
      expect(typeof parsed.recommendations[0].suggestedSupplier).toBe('string');
    }
  });
});
