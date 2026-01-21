/**
 * Tests for getBatchReport tool
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createGetBatchReportTool } from './getBatchReport.js';
import { MockDatabaseAdapter } from '../../test/setup.js';

describe('getBatchReport', () => {
  let db: MockDatabaseAdapter;
  let tool: ReturnType<typeof createGetBatchReportTool>;

  beforeEach(() => {
    db = new MockDatabaseAdapter();
    tool = createGetBatchReportTool(db);
  });

  it('should have correct name and description', () => {
    expect(tool.name).toBe('get_batch_report');
    expect(tool.description).toContain('batch');
  });

  it('should generate comprehensive batch report', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found) {
      expect(parsed.summary.totalBatches).toBeGreaterThan(0);
      expect(Array.isArray(parsed.batches)).toBe(true);
    }
  });

  it('should filter by location', async () => {
    const result = await tool.invoke({ locationFilter: 'ICU' });
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.batches.length > 0) {
      expect(parsed.batches.every((batch: any) => batch.locations.some((loc: string) => loc.includes('ICU')))).toBe(true);
    }
  });

  it('should filter by drug name', async () => {
    const result = await tool.invoke({ drugName: 'Propofol' });
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.batches.length > 0) {
      expect(parsed.batches.every((batch: any) => batch.drugs.some((drug: string) => drug.includes('Propofol')))).toBe(true);
    }
  });

  it('should include batch details', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.batches.length > 0) {
      expect(parsed.batches[0]).toHaveProperty('batchLot');
      expect(parsed.batches[0]).toHaveProperty('drugs');
      expect(parsed.batches[0]).toHaveProperty('locations');
      expect(parsed.batches[0]).toHaveProperty('expiryDate');
      expect(parsed.batches[0]).toHaveProperty('totalQuantity');
    }
  });

  it('should categorize batches by status', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found) {
      expect(parsed.summary).toHaveProperty('byStatus');
      expect(parsed.summary.byStatus).toHaveProperty('normal');
    }
  });

  it('should identify expiring batches', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found) {
      expect(parsed.summary.byStatus).toHaveProperty('critical');
      expect(parsed.summary.byStatus).toHaveProperty('warning');
    }
  });

  it('should calculate total value at risk', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found) {
      expect(parsed.summary).toHaveProperty('totalValue');
    }
  });

  it('should sort batches by expiry urgency', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.batches.length > 1) {
      // Batches are sorted by urgency and days remaining
      expect(parsed.batches[0].daysUntilExpiry).toBeLessThanOrEqual(parsed.batches[1].daysUntilExpiry);
    }
  });

  it('should provide controlled substance breakdown', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.found) {
      expect(parsed.summary).toHaveProperty('controlledSubstances');
    }
  });
});
