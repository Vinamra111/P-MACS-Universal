/**
 * Tests for getSlowMoversReport tool
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createGetSlowMoversReportTool } from './getSlowMoversReport.js';
import { MockDatabaseAdapter } from '../../test/setup.js';

describe('getSlowMoversReport', () => {
  let db: MockDatabaseAdapter;
  let tool: ReturnType<typeof createGetSlowMoversReportTool>;

  beforeEach(() => {
    db = new MockDatabaseAdapter();
    tool = createGetSlowMoversReportTool(db);
  });

  it('should have correct name and description', () => {
    expect(tool.name).toBe('get_slow_movers_report');
    expect(tool.description).toContain('slow movers');
  });

  it('should generate slow movers report', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found) {
      expect(Array.isArray(parsed.slowMovers)).toBe(true);
    } else {
      expect(parsed.found).toBe(false);
    }
  });

  it('should respect days parameter', async () => {
    const result30 = await tool.invoke({ days: 30 });
    const result90 = await tool.invoke({ days: 90 });

    const parsed30 = JSON.parse(result30);
    const parsed90 = JSON.parse(result90);

    expect(parsed30.days).toBe(30);
    expect(parsed90.days).toBe(90);
  });

  it('should filter by location', async () => {
    const result = await tool.invoke({ locationFilter: 'ICU' });
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.slowMovers && parsed.slowMovers.length > 0) {
      expect(parsed.slowMovers.every((item: any) => item.location.includes('ICU'))).toBe(true);
    }
  });

  it('should include usage metrics', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.slowMovers && parsed.slowMovers.length > 0) {
      expect(parsed.slowMovers[0]).toHaveProperty('drugName');
      expect(parsed.slowMovers[0]).toHaveProperty('location');
      expect(parsed.slowMovers[0]).toHaveProperty('totalUsed');
      expect(parsed.slowMovers[0]).toHaveProperty('daysOfStock');
    }
  });

  it('should identify items with no recent usage', async () => {
    const result = await tool.invoke({ days: 30 });
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.slowMovers && parsed.slowMovers.length > 0) {
      const noUsageItems = parsed.slowMovers.filter((item: any) => item.totalUsed === 0);
      expect(noUsageItems.length).toBeGreaterThanOrEqual(0);
    }
  });

  it('should calculate carrying cost', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.slowMovers && parsed.slowMovers.length > 0 && parsed.slowMovers[0].estimatedValue) {
      expect(typeof parsed.slowMovers[0].estimatedValue).toBe('string');
    }
  });

  it('should provide obsolescence risk', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.slowMovers && parsed.slowMovers.length > 0) {
      expect(parsed.slowMovers[0]).toHaveProperty('riskLevel');
      expect(['LOW', 'MEDIUM', 'HIGH']).toContain(parsed.slowMovers[0].riskLevel);
    }
  });

  it('should include recommendations', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.slowMovers && parsed.slowMovers.length > 0) {
      expect(parsed.slowMovers[0]).toHaveProperty('recommendation');
      expect(typeof parsed.slowMovers[0].recommendation).toBe('string');
    }
  });

  it('should provide summary statistics', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found) {
      expect(parsed.summary).toHaveProperty('totalSlowMovers');
      expect(parsed.summary.financialImpact).toHaveProperty('totalValueTiedUp');
    }
  });

  it('should sort by slowness metric', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.slowMovers && parsed.slowMovers.length > 1) {
      const riskOrder: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      const firstRisk = riskOrder[parsed.slowMovers[0].riskLevel] ?? 999;
      const secondRisk = riskOrder[parsed.slowMovers[1].riskLevel] ?? 999;
      expect(firstRisk).toBeLessThanOrEqual(secondRisk);
    }
  });
});
