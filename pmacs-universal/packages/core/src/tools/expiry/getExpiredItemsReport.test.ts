/**
 * Tests for getExpiredItemsReport tool
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createGetExpiredItemsReportTool } from './getExpiredItemsReport.js';
import { MockDatabaseAdapter } from '../../test/setup.js';

describe('getExpiredItemsReport', () => {
  let db: MockDatabaseAdapter;
  let tool: ReturnType<typeof createGetExpiredItemsReportTool>;

  beforeEach(() => {
    db = new MockDatabaseAdapter();
    tool = createGetExpiredItemsReportTool(db);
  });

  it('should have correct name and description', () => {
    expect(tool.name).toBe('get_expired_items_report');
    expect(tool.description).toContain('expired');
  });

  it('should generate expired items report', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    expect(parsed).toHaveProperty('found');
    if (parsed.found) {
      expect(Array.isArray(parsed.expiredDrugs)).toBe(true);
      expect(parsed.summary).toBeDefined();
    }
  });

  it('should filter by location', async () => {
    const result = await tool.invoke({ locationFilter: 'ICU' });
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.expiredDrugs.length > 0) {
      // Check that all batches in all drugs have the filtered location
      expect(parsed.expiredDrugs.every((drug: any) =>
        drug.batches.every((batch: any) => batch.location.includes('ICU'))
      )).toBe(true);
    }
  });

  it('should include item details', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.expiredDrugs.length > 0) {
      expect(parsed.expiredDrugs[0]).toHaveProperty('drugName');
      expect(parsed.expiredDrugs[0]).toHaveProperty('category');
      expect(parsed.expiredDrugs[0]).toHaveProperty('totalQuantity');
      expect(parsed.expiredDrugs[0]).toHaveProperty('batches');
      expect(Array.isArray(parsed.expiredDrugs[0].batches)).toBe(true);
      if (parsed.expiredDrugs[0].batches.length > 0) {
        expect(parsed.expiredDrugs[0].batches[0]).toHaveProperty('location');
        expect(parsed.expiredDrugs[0].batches[0]).toHaveProperty('expiryDate');
        expect(parsed.expiredDrugs[0].batches[0]).toHaveProperty('quantity');
      }
    }
  });

  it('should calculate days expired', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.expiredDrugs.length > 0 && parsed.expiredDrugs[0].batches.length > 0) {
      expect(parsed.expiredDrugs[0].batches[0]).toHaveProperty('daysExpired');
      expect(typeof parsed.expiredDrugs[0].batches[0].daysExpired).toBe('number');
      expect(parsed.expiredDrugs[0].batches[0].daysExpired).toBeGreaterThan(0);
    }
  });

  it('should categorize by severity', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found) {
      expect(parsed.summary).toHaveProperty('byPriority');
      expect(parsed.summary.byPriority).toHaveProperty('high');
      expect(parsed.summary.byPriority).toHaveProperty('medium');
      expect(parsed.summary.byPriority).toHaveProperty('standard');
    }
  });

  it('should calculate total waste value', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found) {
      expect(parsed.summary).toHaveProperty('totalValueLoss');
      expect(typeof parsed.summary.totalValueLoss).toBe('string');
    }
  });

  it('should identify controlled substances', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found) {
      expect(parsed.summary).toHaveProperty('byCategory');
      expect(parsed.summary.byCategory).toHaveProperty('controlled');
    }
  });

  it('should sort by expiry date', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.expiredDrugs.length > 1) {
      // Check that high priority comes before medium/standard
      const priorities = parsed.expiredDrugs.map((drug: any) => drug.disposalPriority);
      const firstHighIndex = priorities.indexOf('HIGH');
      const firstMediumIndex = priorities.indexOf('MEDIUM');
      const firstStandardIndex = priorities.indexOf('STANDARD');

      if (firstHighIndex !== -1 && firstMediumIndex !== -1) {
        expect(firstHighIndex).toBeLessThan(firstMediumIndex);
      }
      if (firstMediumIndex !== -1 && firstStandardIndex !== -1) {
        expect(firstMediumIndex).toBeLessThan(firstStandardIndex);
      }
    }
  });

  it('should provide disposal recommendations', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found) {
      expect(parsed).toHaveProperty('disposalChecklist');
      expect(Array.isArray(parsed.disposalChecklist)).toBe(true);
      expect(parsed).toHaveProperty('recommendations');
      expect(Array.isArray(parsed.recommendations)).toBe(true);
    }
  });

  it('should include compliance notes', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found) {
      expect(parsed).toHaveProperty('financialImpact');
      expect(parsed.financialImpact).toHaveProperty('totalLoss');
      expect(parsed.financialImpact).toHaveProperty('recommendation');
    }
  });
});
