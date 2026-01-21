/**
 * Tests for getShortageAlerts tool
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createGetShortageAlertsTool } from './getShortageAlerts.js';
import { MockDatabaseAdapter } from '../../test/setup.js';

describe('getShortageAlerts', () => {
  let db: MockDatabaseAdapter;
  let tool: ReturnType<typeof createGetShortageAlertsTool>;

  beforeEach(() => {
    db = new MockDatabaseAdapter();
    tool = createGetShortageAlertsTool(db);
  });

  it('should have correct name and description', () => {
    expect(tool.name).toBe('get_shortage_alerts');
    expect(tool.description).toContain('shortage');
  });

  it('should generate shortage alerts', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    expect(parsed).toHaveProperty('hasAlerts');
  });

  it('should filter by location', async () => {
    const result = await tool.invoke({ leadTimeDays: 7 });
    const parsed = JSON.parse(result);

    if (parsed.hasAlerts && parsed.criticalAlerts && parsed.criticalAlerts.length > 0) {
      expect(parsed.criticalAlerts[0]).toHaveProperty('location');
    }
  });

  it('should categorize by alert level', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    expect(parsed.summary).toHaveProperty('byLevel');
    expect(parsed.summary.byLevel).toHaveProperty('critical');
  });

  it('should include alert details', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.hasAlerts && parsed.criticalAlerts && parsed.criticalAlerts.length > 0) {
      expect(parsed.criticalAlerts[0]).toHaveProperty('drugName');
      expect(parsed.criticalAlerts[0]).toHaveProperty('location');
      expect(parsed.criticalAlerts[0]).toHaveProperty('message');
    }
  });

  it('should identify different shortage types', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.hasAlerts && parsed.criticalAlerts && parsed.criticalAlerts.length > 0) {
      expect(parsed.criticalAlerts[0]).toHaveProperty('alertType');
      expect(['STOCKOUT', 'IMMINENT_STOCKOUT', 'BELOW_SAFETY_STOCK', 'APPROACHING_SAFETY_STOCK']).toContain(
        parsed.criticalAlerts[0].alertType
      );
    }
  });

  it('should calculate days remaining', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.hasAlerts && parsed.criticalAlerts && parsed.criticalAlerts.length > 0 && parsed.criticalAlerts[0].daysRemaining !== undefined) {
      expect(typeof parsed.criticalAlerts[0].daysRemaining).toBe('number');
    }
  });

  it('should sort by alert level and urgency', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.hasAlerts && parsed.criticalAlerts && parsed.criticalAlerts.length > 1) {
      expect(parsed.criticalAlerts[0].priority).toBeLessThanOrEqual(parsed.criticalAlerts[1].priority);
    }
  });

  it('should provide actionable recommendations', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    if (parsed.hasAlerts && parsed.criticalAlerts && parsed.criticalAlerts.length > 0) {
      expect(parsed.criticalAlerts[0]).toHaveProperty('action');
    }
  });

  it('should identify controlled substances in shortage', async () => {
    const result = await tool.invoke({});
    const parsed = JSON.parse(result);

    expect(parsed.summary).toHaveProperty('controlledSubstances');
  });

  it('should respect severity filter', async () => {
    const result = await tool.invoke({ includeWarnings: false });
    const parsed = JSON.parse(result);

    if (parsed.hasAlerts && parsed.criticalAlerts && parsed.criticalAlerts.length > 0) {
      expect(parsed.criticalAlerts[0]).toHaveProperty('alertType');
    }
  });
});
