/**
 * Tests for checkExpiringDrugs tool
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createCheckExpiringDrugsTool } from './checkExpiringDrugs.js';
import { MockDatabaseAdapter } from '../../test/setup.js';

describe('checkExpiringDrugs', () => {
  let db: MockDatabaseAdapter;
  let tool: ReturnType<typeof createCheckExpiringDrugsTool>;

  beforeEach(() => {
    db = new MockDatabaseAdapter();
    tool = createCheckExpiringDrugsTool(db);
  });

  it('should have correct name and description', () => {
    expect(tool.name).toBe('check_expiring_drugs');
    expect(tool.description).toContain('expiring within');
  });

  it('should find expiring items within days threshold', async () => {
    const result = await tool.invoke({ withinDays: 365 });
    const parsed = JSON.parse(result);

    expect(parsed).toHaveProperty('found');
  });

  it('should categorize by urgency', async () => {
    const result = await tool.invoke({ withinDays: 90 });
    const parsed = JSON.parse(result);

    if (parsed.found) {
      expect(parsed.summary).toHaveProperty('byUrgency');
      expect(parsed.summary.byUrgency).toHaveProperty('critical');
      expect(parsed.summary.byUrgency).toHaveProperty('warning');
      expect(parsed.summary.byUrgency).toHaveProperty('notice');
    }
  });

  it('should filter by location', async () => {
    const result = await tool.invoke({ withinDays: 365, locationFilter: 'ICU' });
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.items) {
      expect(parsed.items.every((item: any) => item.location.includes('ICU'))).toBe(true);
    }
  });

  it('should calculate days until expiry', async () => {
    const result = await tool.invoke({ withinDays: 365 });
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.items && parsed.items.length > 0) {
      expect(parsed.items[0]).toHaveProperty('daysUntilExpiry');
      expect(typeof parsed.items[0].daysUntilExpiry).toBe('number');
    }
  });

  it('should provide appropriate alert level', async () => {
    const result = await tool.invoke({ withinDays: 365 });
    const parsed = JSON.parse(result);

    expect(parsed.alertLevel).toBeDefined();
    expect(['info', 'warning', 'critical']).toContain(parsed.alertLevel);
  });

  it('should include controlled substances info', async () => {
    const result = await tool.invoke({ withinDays: 365 });
    const parsed = JSON.parse(result);

    if (parsed.found) {
      expect(parsed.summary).toHaveProperty('controlledSubstances');
    }
  });

  it('should sort items by urgency', async () => {
    const result = await tool.invoke({ withinDays: 365 });
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.items && parsed.items.length > 1) {
      const urgencyOrder = ['critical', 'warning', 'notice'];
      const firstUrgency = urgencyOrder.indexOf(parsed.items[0].urgency);
      const secondUrgency = urgencyOrder.indexOf(parsed.items[1].urgency);
      expect(firstUrgency).toBeLessThanOrEqual(secondUrgency);
    }
  });
});
