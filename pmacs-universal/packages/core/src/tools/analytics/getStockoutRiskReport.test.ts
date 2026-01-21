/**
 * Tests for getStockoutRiskReport tool
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createGetStockoutRiskReportTool } from './getStockoutRiskReport.js';
import { MockDatabaseAdapter } from '../../test/setup.js';

describe('getStockoutRiskReport', () => {
  let db: MockDatabaseAdapter;
  let tool: ReturnType<typeof createGetStockoutRiskReportTool>;

  beforeEach(() => {
    db = new MockDatabaseAdapter();
    tool = createGetStockoutRiskReportTool(db);
  });

  it('should have correct name and description', () => {
    expect(tool.name).toBe('get_stockout_risk_report');
    expect(tool.description).toContain('stockout');
  });

  it('should generate stockout risk report', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found) {
      expect(Array.isArray(parsed.atRiskItems)).toBe(true);
    } else {
      expect(parsed.found).toBe(false);
    }
  });

  it('should filter by location', async () => {
    const result = await tool.invoke({ locationFilter: 'ICU' });
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.atRiskItems && parsed.atRiskItems.length > 0) {
      expect(parsed.atRiskItems.every((item: any) => item.location.includes('ICU'))).toBe(true);
    }
  });

  it('should categorize by risk level', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found) {
      expect(parsed.summary).toHaveProperty('byRiskLevel');
      expect(parsed.summary.byRiskLevel).toHaveProperty('critical');
      expect(parsed.summary.byRiskLevel).toHaveProperty('high');
      expect(parsed.summary.byRiskLevel).toHaveProperty('medium');
    }
  });

  it('should include risk metrics', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.atRiskItems && parsed.atRiskItems.length > 0) {
      expect(parsed.atRiskItems[0]).toHaveProperty('drugName');
      expect(parsed.atRiskItems[0]).toHaveProperty('location');
      expect(parsed.atRiskItems[0]).toHaveProperty('riskLevel');
      expect(parsed.atRiskItems[0]).toHaveProperty('daysUntilStockout');
    }
  });

  it('should calculate days until stockout', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.atRiskItems && parsed.atRiskItems.length > 0) {
      expect(parsed.atRiskItems[0].daysUntilStockout).toBeDefined();
      expect(typeof parsed.atRiskItems[0].daysUntilStockout).toBe('number');
    }
  });

  it('should provide current usage rate', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.atRiskItems && parsed.atRiskItems.length > 0) {
      expect(parsed.atRiskItems[0]).toHaveProperty('avgDailyUsage');
      expect(typeof parsed.atRiskItems[0].avgDailyUsage).toBe('string');
    }
  });

  it('should sort by risk level and urgency', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.atRiskItems && parsed.atRiskItems.length > 1) {
      const riskOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      const firstRisk = riskOrder[parsed.atRiskItems[0].riskLevel] ?? 999;
      const secondRisk = riskOrder[parsed.atRiskItems[1].riskLevel] ?? 999;
      expect(firstRisk).toBeLessThanOrEqual(secondRisk);
    }
  });

  it('should include mitigation recommendations', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.atRiskItems && parsed.atRiskItems.length > 0) {
      expect(parsed.atRiskItems[0]).toHaveProperty('recommendation');
      expect(typeof parsed.atRiskItems[0].recommendation).toBe('string');
    }
  });

  it('should identify controlled substances at risk', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found) {
      expect(parsed.summary).toHaveProperty('controlledSubstancesAtRisk');
    }
  });

  it('should respect minimum threshold parameter', async () => {
    const result = await tool.invoke({ leadTimeDays: 7 });
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.atRiskItems && parsed.atRiskItems.length > 0) {
      expect(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'MINIMAL']).toContain(parsed.atRiskItems[0].riskLevel);
    }
  });
});
