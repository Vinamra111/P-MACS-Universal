/**
 * Tests for lookupInventory tool
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createLookupInventoryTool } from './lookupInventory.js';
import { MockDatabaseAdapter } from '../../test/setup.js';

describe('lookupInventory', () => {
  let db: MockDatabaseAdapter;
  let tool: ReturnType<typeof createLookupInventoryTool>;

  beforeEach(() => {
    db = new MockDatabaseAdapter();
    tool = createLookupInventoryTool(db);
  });

  it('should have correct name and description', () => {
    expect(tool.name).toBe('lookup_inventory');
    expect(tool.description).toContain('drug');
  });

  it('should find drug by exact name', async () => {
    const result = await tool.invoke({ drugName: 'Propofol' });
    const parsed = JSON.parse(result);

    expect(parsed.found).toBe(true);
    expect(parsed.resultCount).toBeGreaterThan(0);
    expect(parsed.results[0].drugName).toContain('Propofol');
  });

  it('should find drug by partial name', async () => {
    const result = await tool.invoke({ drugName: 'prop' });
    const parsed = JSON.parse(result);

    expect(parsed.found).toBe(true);
    expect(parsed.results[0].drugName).toContain('Propofol');
  });

  it('should return not found for non-existent drug', async () => {
    const result = await tool.invoke({ drugName: 'NonExistentDrugXYZ' });
    const parsed = JSON.parse(result);

    expect(parsed.found).toBe(false);
    expect(parsed.message).toBeDefined();
  });

  it('should include stock status in results', async () => {
    const result = await tool.invoke({ drugName: 'Propofol' });
    const parsed = JSON.parse(result);

    expect(parsed.results[0].locations[0]).toHaveProperty('status');
    expect(parsed.results[0].locations[0]).toHaveProperty('quantity');
  });

  it('should show multiple locations for same drug', async () => {
    const result = await tool.invoke({ drugName: 'Propofol' });
    const parsed = JSON.parse(result);

    expect(parsed.results[0]).toHaveProperty('totalLocations');
    expect(parsed.results[0].locations.length).toBeGreaterThanOrEqual(1);
  });

  it('should include expiry information', async () => {
    const result = await tool.invoke({ drugName: 'Propofol' });
    const parsed = JSON.parse(result);

    expect(parsed.results[0].locations[0]).toHaveProperty('expiryDate');
    expect(parsed.results[0].locations[0]).toHaveProperty('daysUntilExpiry');
  });

  it('should show alert level for low stock', async () => {
    const result = await tool.invoke({ drugName: 'Propofol' });
    const parsed = JSON.parse(result);

    expect(parsed.results[0]).toHaveProperty('alertLevel');
    expect(['info', 'warning', 'critical']).toContain(parsed.results[0].alertLevel);
  });
});
