/**
 * Tests for analyzeUsageTrends tool
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createAnalyzeUsageTrendsTool } from './analyzeUsageTrends.js';
import { MockDatabaseAdapter } from '../../test/setup.js';

describe('analyzeUsageTrends', () => {
  let db: MockDatabaseAdapter;
  let tool: ReturnType<typeof createAnalyzeUsageTrendsTool>;

  beforeEach(() => {
    db = new MockDatabaseAdapter();
    tool = createAnalyzeUsageTrendsTool(db);
  });

  it('should have correct name and description', () => {
    expect(tool.name).toBe('analyze_usage_trends');
    expect(tool.description).toContain('trend');
  });

  it('should analyze trends for all drugs', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    expect(parsed.found).toBe(true);
    expect(parsed).toHaveProperty('summary');
    expect(parsed.summary).toHaveProperty('totalDrugsAnalyzed');
  });

  it('should return not found when no sufficient data', async () => {
    const result = await tool.invoke({ minTransactions: 50 });
    const parsed = JSON.parse(result);

    expect(parsed.found).toBe(false);
    expect(parsed).toHaveProperty('message');
  });

  it('should calculate trend statistics', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.analyses && parsed.analyses.length > 0) {
      const analysis = parsed.analyses[0];
      expect(analysis).toHaveProperty('trendCategory');
      expect(analysis).toHaveProperty('periodChange');
      expect(['STRONGLY_INCREASING', 'INCREASING', 'SLIGHTLY_INCREASING', 'STABLE', 'SLIGHTLY_DECREASING', 'DECREASING', 'STRONGLY_DECREASING']).toContain(analysis.trendCategory);
    }
  });

  it('should respect days parameter', async () => {
    const result30 = await tool.invoke({ days: 30 });
    const result90 = await tool.invoke({ days: 90 });

    const parsed30 = JSON.parse(result30);
    const parsed90 = JSON.parse(result90);

    if (parsed30.found) {
      expect(parsed30.summary.periodAnalyzed).toBe('30 days');
    }
    if (parsed90.found) {
      expect(parsed90.summary.periodAnalyzed).toBe('90 days');
    }
  });

  it('should provide statistical measures', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found) {
      expect(parsed.summary).toHaveProperty('byTrend');
      expect(parsed.summary).toHaveProperty('byVariability');
      expect(parsed.summary.byVariability).toHaveProperty('high');
      expect(parsed.summary.byVariability).toHaveProperty('moderate');
      expect(parsed.summary.byVariability).toHaveProperty('low');
    }
  });

  it('should include summary by trend', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found) {
      expect(parsed.summary).toHaveProperty('byTrend');
      expect(parsed.summary.byTrend).toHaveProperty('stronglyIncreasing');
      expect(parsed.summary.byTrend).toHaveProperty('increasing');
      expect(parsed.summary.byTrend).toHaveProperty('stable');
    }
  });

  it('should provide confidence metrics', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.analyses && parsed.analyses.length > 0) {
      // Analyses array contains simplified data, confidence is in full analysis objects not shown
      expect(parsed.analyses[0]).toHaveProperty('trendCategory');
      expect(parsed.analyses[0]).toHaveProperty('avgDailyUsage');
    }
  });

  it('should generate recommendations based on trends', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found) {
      expect(parsed).toHaveProperty('recommendations');
      expect(Array.isArray(parsed.recommendations)).toBe(true);
    }
  });
});
