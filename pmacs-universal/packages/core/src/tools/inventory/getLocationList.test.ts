/**
 * Tests for getLocationList tool
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createGetLocationListTool } from './getLocationList.js';
import { MockDatabaseAdapter } from '../../test/setup.js';

describe('getLocationList', () => {
  let db: MockDatabaseAdapter;
  let tool: ReturnType<typeof createGetLocationListTool>;

  beforeEach(() => {
    db = new MockDatabaseAdapter();
    tool = createGetLocationListTool(db);
  });

  it('should have correct name', () => {
    expect(tool.name).toBe('get_location_list');
  });

  it('should return list of all locations', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    expect(parsed.totalLocations).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(parsed.locations)).toBe(true);
  });

  it('should include location statistics', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.locations.length > 0) {
      expect(parsed.locations[0]).toHaveProperty('location');
      expect(parsed.locations[0]).toHaveProperty('locationType');
      expect(parsed.locations[0]).toHaveProperty('summary');
      expect(parsed.locations[0].summary).toHaveProperty('totalItems');
      expect(parsed.locations[0].summary).toHaveProperty('totalQuantity');
    }
  });

  it('should calculate low stock counts per location', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.locations.length > 0) {
      expect(parsed.locations[0].summary).toHaveProperty('lowStock');
      expect(parsed.locations[0].summary).toHaveProperty('stockouts');
    }
  });

  it('should include alert level for locations', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.locations.length > 0) {
      expect(parsed.locations[0]).toHaveProperty('alertLevel');
      expect(['info', 'warning', 'critical']).toContain(parsed.locations[0].alertLevel);
    }
  });

  it('should provide overall summary', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    expect(parsed.summary).toBeDefined();
    expect(parsed.summary).toHaveProperty('byType');
    expect(parsed.summary).toHaveProperty('alertSummary');
    expect(parsed.summary).toHaveProperty('needsAttention');
  });

  it('should include alert level and message', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    expect(parsed.alertLevel).toBeDefined();
    expect(['info', 'warning', 'critical']).toContain(parsed.alertLevel);
    expect(parsed.alertMessage).toBeDefined();
  });

  it('should include recommendations', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    expect(Array.isArray(parsed.recommendations)).toBe(true);
  });

  it('should exclude empty locations by default', async () => {
    const result = await tool.invoke({ includeEmpty: false });
    const parsed = JSON.parse(result);

    if (parsed.locations.length > 0) {
      expect(parsed.locations.every((loc: any) => loc.summary.totalItems > 0)).toBe(true);
    }
  });
});
