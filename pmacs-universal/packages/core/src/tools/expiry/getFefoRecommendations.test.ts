/**
 * Tests for getFefoRecommendations tool
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createGetFefoRecommendationsTool } from './getFefoRecommendations.js';
import { MockDatabaseAdapter } from '../../test/setup.js';

describe('getFefoRecommendations', () => {
  let db: MockDatabaseAdapter;
  let tool: ReturnType<typeof createGetFefoRecommendationsTool>;

  beforeEach(() => {
    db = new MockDatabaseAdapter();
    tool = createGetFefoRecommendationsTool(db);
  });

  it('should have correct name and description', () => {
    expect(tool.name).toBe('get_fefo_recommendations');
    expect(tool.description).toContain('FEFO');
  });

  it('should provide FEFO recommendations for all locations', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    expect(parsed).toHaveProperty('found');
    if (parsed.found) {
      expect(parsed.recommendations).toBeDefined();
      expect(Array.isArray(parsed.recommendations)).toBe(true);
      expect(parsed.summary).toBeDefined();
    }
  });

  it('should filter by location', async () => {
    const result = await tool.invoke({ locationFilter: 'ICU' });
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.recommendations.length > 0) {
      // Check that all usage orders within all drugs have the filtered location
      expect(parsed.recommendations.every((rec: any) =>
        rec.usageOrder.every((order: any) => order.location.includes('ICU'))
      )).toBe(true);
    }
  });

  it('should filter by drug name', async () => {
    const result = await tool.invoke({ drugName: 'Propofol' });
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.recommendations.length > 0) {
      expect(parsed.recommendations.every((rec: any) => rec.drugName.includes('Propofol'))).toBe(true);
    }
  });

  it('should sort items by expiry date', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.recommendations.length > 0 && parsed.recommendations[0].usageOrder.length > 1) {
      // Check that within a drug, batches are sorted by expiry (earliest first)
      const usageOrder = parsed.recommendations[0].usageOrder;
      for (let i = 0; i < usageOrder.length - 1; i++) {
        expect(usageOrder[i].daysRemaining).toBeLessThanOrEqual(usageOrder[i + 1].daysRemaining);
      }
    }
  });

  it('should include urgency level', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.recommendations.length > 0) {
      expect(parsed.recommendations[0]).toHaveProperty('urgency');
      expect(['critical', 'warning', 'notice']).toContain(parsed.recommendations[0].urgency);
    }
  });

  it('should calculate days until expiry', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.recommendations.length > 0) {
      expect(parsed.recommendations[0]).toHaveProperty('daysUntilEarliestExpiry');
      expect(typeof parsed.recommendations[0].daysUntilEarliestExpiry).toBe('number');
      if (parsed.recommendations[0].usageOrder.length > 0) {
        expect(parsed.recommendations[0].usageOrder[0]).toHaveProperty('daysRemaining');
        expect(typeof parsed.recommendations[0].usageOrder[0].daysRemaining).toBe('number');
      }
    }
  });

  it('should provide action recommendations', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.recommendations.length > 0) {
      expect(parsed.recommendations[0]).toHaveProperty('recommendation');
      if (parsed.recommendations[0].usageOrder.length > 0) {
        expect(parsed.recommendations[0].usageOrder[0]).toHaveProperty('action');
      }
    }
  });

  it('should include summary statistics', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found) {
      expect(parsed.summary).toHaveProperty('totalDrugs');
      expect(parsed.summary).toHaveProperty('totalBatches');
      expect(parsed.summary).toHaveProperty('byUrgency');
      expect(parsed.summary.byUrgency).toHaveProperty('critical');
      expect(parsed.summary.byUrgency).toHaveProperty('warning');
      expect(parsed.summary.byUrgency).toHaveProperty('notice');
    }
  });
});
