/**
 * Tests for getUsageAnalytics tool
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createGetUsageAnalyticsTool } from './getUsageAnalytics.js';
import { MockDatabaseAdapter } from '../../test/setup.js';

describe('getUsageAnalytics', () => {
  let db: MockDatabaseAdapter;
  let tool: ReturnType<typeof createGetUsageAnalyticsTool>;

  beforeEach(() => {
    db = new MockDatabaseAdapter();
    tool = createGetUsageAnalyticsTool(db);
  });

  it('should have correct name and description', () => {
    expect(tool.name).toBe('get_usage_analytics');
    expect(tool.description).toContain('usage analytics');
  });

  it('should analyze usage for existing drug', async () => {
    const result = await tool.invoke({ drugName: 'Propofol' });
    const parsed = JSON.parse(result);

    expect(parsed.found).toBe(true);
    expect(parsed.drugName).toBe('Propofol');
  });

  it('should return error for non-existent drug', async () => {
    const result = await tool.invoke({ drugName: 'NonExistentDrug' });
    const parsed = JSON.parse(result);

    expect(parsed.found).toBe(false);
  });

  it('should provide usage statistics', async () => {
    const result = await tool.invoke({ drugName: 'Propofol' });
    const parsed = JSON.parse(result);

    if (parsed.found && !parsed.noActivity) {
      expect(parsed).toHaveProperty('summary');
      expect(parsed.summary).toHaveProperty('totalUsed');
      expect(parsed.summary).toHaveProperty('avgDailyUsage');
    }
  });

  it('should calculate trends', async () => {
    const result = await tool.invoke({ drugName: 'Propofol' });
    const parsed = JSON.parse(result);

    if (parsed.found && !parsed.noActivity) {
      expect(parsed).toHaveProperty('trend');
      expect(parsed.trend).toHaveProperty('direction');
    }
  });

  it('should respect days parameter', async () => {
    const result30 = await tool.invoke({ drugName: 'Propofol', days: 30 });
    const result60 = await tool.invoke({ drugName: 'Propofol', days: 60 });

    const parsed30 = JSON.parse(result30);
    const parsed60 = JSON.parse(result60);

    expect(parsed30.days).toBe(30);
    expect(parsed60.days).toBe(60);
  });

  it('should provide location breakdown', async () => {
    const result = await tool.invoke({ drugName: 'Propofol' });
    const parsed = JSON.parse(result);

    if (parsed.found && !parsed.noActivity) {
      expect(parsed).toHaveProperty('locationBreakdown');
      expect(Array.isArray(parsed.locationBreakdown)).toBe(true);
    }
  });

  it('should include recommendations', async () => {
    const result = await tool.invoke({ drugName: 'Propofol' });
    const parsed = JSON.parse(result);

    if (parsed.found && !parsed.noActivity) {
      expect(parsed).toHaveProperty('recommendations');
      expect(Array.isArray(parsed.recommendations)).toBe(true);
    }
  });
});
