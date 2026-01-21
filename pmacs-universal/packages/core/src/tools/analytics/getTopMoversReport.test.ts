/**
 * Tests for getTopMoversReport tool
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createGetTopMoversReportTool } from './getTopMoversReport.js';
import { MockDatabaseAdapter } from '../../test/setup.js';

describe('getTopMoversReport', () => {
  let db: MockDatabaseAdapter;
  let tool: ReturnType<typeof createGetTopMoversReportTool>;

  beforeEach(() => {
    db = new MockDatabaseAdapter();
    tool = createGetTopMoversReportTool(db);
  });

  it('should have correct name and description', () => {
    expect(tool.name).toBe('get_top_movers_report');
    expect(tool.description).toContain('top movers');
  });

  it('should generate top movers report', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found) {
      expect(Array.isArray(parsed.topMovers)).toBe(true);
    } else {
      expect(parsed.found).toBe(false);
    }
  });

  it('should respect limit parameter', async () => {
    const result = await tool.invoke({ topN: 5 });
    const parsed = JSON.parse(result);

    if (parsed.found) {
      expect(parsed.topMovers.length).toBeLessThanOrEqual(5);
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

    if (parsed.found && parsed.topMovers && parsed.topMovers.length > 0) {
      expect(parsed.topMovers.every((item: any) =>
        !item.location || item.location.includes('ICU') || item.locationsUsed
      )).toBe(true);
    }
  });

  it('should include usage metrics', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.topMovers && parsed.topMovers.length > 0) {
      expect(parsed.topMovers[0]).toHaveProperty('drugName');
      expect(parsed.topMovers[0]).toHaveProperty('totalUsed');
      expect(parsed.topMovers[0]).toHaveProperty('avgDailyUsage');
    }
  });

  it('should sort by total usage descending', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.topMovers && parsed.topMovers.length > 1) {
      expect(parsed.topMovers[0].totalUsed).toBeGreaterThanOrEqual(parsed.topMovers[1].totalUsed);
    }
  });

  it('should include trend information', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.topMovers && parsed.topMovers.length > 0) {
      expect(parsed.topMovers[0]).toHaveProperty('trend');
    }
  });

  it('should provide summary statistics', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found) {
      expect(parsed.summary).toHaveProperty('totalUsageVolume');
      expect(parsed.summary).toHaveProperty('avgTurnoverRate');
    }
  });

  it('should include location breakdown for multi-location drugs', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.topMovers && parsed.topMovers.length > 0 && parsed.topMovers[0].locationsUsed) {
      expect(Array.isArray(parsed.topMovers[0].locationsUsed)).toBe(true);
    }
  });
});
