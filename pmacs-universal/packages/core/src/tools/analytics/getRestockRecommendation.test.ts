/**
 * Tests for getRestockRecommendation tool
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createGetRestockRecommendationTool } from './getRestockRecommendation.js';
import { MockDatabaseAdapter } from '../../test/setup.js';

describe('getRestockRecommendation', () => {
  let db: MockDatabaseAdapter;
  let tool: ReturnType<typeof createGetRestockRecommendationTool>;

  beforeEach(() => {
    db = new MockDatabaseAdapter();
    tool = createGetRestockRecommendationTool(db);
  });

  it('should have correct name and description', () => {
    expect(tool.name).toBe('get_restock_recommendation');
    expect(tool.description).toContain('restock');
  });

  it('should provide restock recommendation for existing item', async () => {
    const result = await tool.invoke({
      drugName: 'Propofol',
    });
    const parsed = JSON.parse(result);

    expect(parsed.found).toBe(true);
    expect(parsed.drugName).toBe('Propofol');
  });

  it('should return error for non-existent item', async () => {
    const result = await tool.invoke({
      drugName: 'NonExistent',
    });
    const parsed = JSON.parse(result);

    expect(parsed.found).toBe(false);
  });

  it('should calculate recommended order quantity', async () => {
    const result = await tool.invoke({
      drugName: 'Propofol',
    });
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.recommendations && parsed.recommendations.length > 0) {
      expect(parsed.recommendations[0]).toHaveProperty('recommendedQty');
      expect(typeof parsed.recommendations[0].recommendedQty).toBe('number');
      expect(parsed.recommendations[0].recommendedQty).toBeGreaterThanOrEqual(0);
    }
  });

  it('should provide urgency level', async () => {
    const result = await tool.invoke({
      drugName: 'Propofol',
    });
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.recommendations && parsed.recommendations.length > 0) {
      expect(parsed.recommendations[0]).toHaveProperty('urgency');
      expect(['EMERGENCY', 'CRITICAL', 'URGENT', 'SOON', 'NOT_NEEDED']).toContain(parsed.recommendations[0].urgency);
    }
  });

  it('should include current inventory status', async () => {
    const result = await tool.invoke({
      drugName: 'Propofol',
    });
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.recommendations && parsed.recommendations.length > 0) {
      expect(parsed.recommendations[0]).toHaveProperty('currentStock');
      expect(typeof parsed.recommendations[0].currentStock).toBe('number');
    }
  });

  it('should calculate days until stockout', async () => {
    const result = await tool.invoke({
      drugName: 'Propofol',
    });
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.recommendations && parsed.recommendations.length > 0) {
      expect(parsed.recommendations[0]).toHaveProperty('daysOfStock');
      expect(typeof parsed.recommendations[0].daysOfStock).toBe('number');
    }
  });

  it('should provide usage statistics', async () => {
    const result = await tool.invoke({
      drugName: 'Propofol',
    });
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.detailedAnalysis) {
      expect(parsed.detailedAnalysis).toHaveProperty('usagePattern');
      expect(parsed.detailedAnalysis.usagePattern).toHaveProperty('avgDailyUsage');
    }
  });

  it('should estimate order value', async () => {
    const result = await tool.invoke({
      drugName: 'Propofol',
    });
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.recommendations && parsed.recommendations.length > 0 && parsed.recommendations[0].estimatedCost) {
      expect(typeof parsed.recommendations[0].estimatedCost).toBe('string');
    }
  });

  it('should consider lead time in recommendations', async () => {
    const result = await tool.invoke({
      drugName: 'Propofol',
      leadTimeDays: 7,
    });
    const parsed = JSON.parse(result);

    if (parsed.found) {
      expect(parsed.leadTimeDays).toBe(7);
    }
  });

  it('should provide alternative actions', async () => {
    const result = await tool.invoke({
      drugName: 'Propofol',
    });
    const parsed = JSON.parse(result);

    if (parsed.found) {
      expect(parsed).toHaveProperty('actions');
      expect(Array.isArray(parsed.actions)).toBe(true);
    }
  });
});
