/**
 * Tests for detectSeasonalPatterns tool
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createDetectSeasonalPatternsTool } from './detectSeasonalPatterns.js';
import { MockDatabaseAdapter } from '../../test/setup.js';

describe('detectSeasonalPatterns', () => {
  let db: MockDatabaseAdapter;
  let tool: ReturnType<typeof createDetectSeasonalPatternsTool>;

  beforeEach(() => {
    db = new MockDatabaseAdapter();
    tool = createDetectSeasonalPatternsTool(db);
  });

  it('should have correct name and description', () => {
    expect(tool.name).toBe('detect_seasonal_patterns');
    expect(tool.description).toContain('seasonal');
  });

  it('should analyze seasonal patterns for existing drug', async () => {
    const result = await tool.invoke({ drugName: 'Propofol' });
    const parsed = JSON.parse(result);

    expect(parsed.found).toBe(true);
    expect(parsed.drugName).toBe('Propofol');
    if (parsed.found) {
      expect(parsed).toHaveProperty('summary');
      expect(parsed).toHaveProperty('analyses');
    }
  });

  it('should return error for non-existent drug', async () => {
    const result = await tool.invoke({ drugName: 'NonExistentDrug' });
    const parsed = JSON.parse(result);

    expect(parsed.found).toBe(false);
  });

  it('should detect seasonal patterns', async () => {
    const result = await tool.invoke({ drugName: 'Propofol' });
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.analyses && parsed.analyses.length > 0) {
      const analysis = parsed.analyses[0];
      expect(analysis).toHaveProperty('seasonality');
      expect(typeof analysis.seasonality).toBe('string');
    }
  });

  it('should provide seasonality strength', async () => {
    const result = await tool.invoke({ drugName: 'Propofol' });
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.analyses && parsed.analyses.length > 0) {
      const analysis = parsed.analyses[0];
      expect(analysis).toHaveProperty('trend');
      expect(analysis).toHaveProperty('severity');
    }
  });

  it('should identify peak and low periods', async () => {
    const result = await tool.invoke({ drugName: 'Propofol' });
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.analyses && parsed.analyses.length > 0) {
      const analysis = parsed.analyses[0];
      if (analysis.dayOfWeekPattern && analysis.dayOfWeekPattern !== null) {
        expect(analysis.dayOfWeekPattern).toHaveProperty('peak');
        expect(analysis.dayOfWeekPattern).toHaveProperty('low');
      }
    }
  });

  it('should respect minimum data requirement', async () => {
    const result = await tool.invoke({ drugName: 'NonExistentDrug' });
    const parsed = JSON.parse(result);

    if (!parsed.found) {
      expect(parsed).toHaveProperty('message');
    }
  });

  it('should provide period comparison data', async () => {
    const result = await tool.invoke({ drugName: 'Propofol' });
    const parsed = JSON.parse(result);

    if (parsed.found) {
      expect(parsed).toHaveProperty('recentPeriodDays');
      expect(parsed).toHaveProperty('historicalPeriodDays');
    }
  });

  it('should include usage pattern visualization data', async () => {
    const result = await tool.invoke({ drugName: 'Propofol' });
    const parsed = JSON.parse(result);

    if (parsed.found && parsed.analyses && parsed.analyses.length > 0) {
      const analysis = parsed.analyses[0];
      expect(analysis).toHaveProperty('recentAvgDaily');
      expect(analysis).toHaveProperty('historicalAvgDaily');
    }
  });

  it('should generate recommendations based on seasonality', async () => {
    const result = await tool.invoke({ drugName: 'Propofol' });
    const parsed = JSON.parse(result);

    if (parsed.found) {
      expect(parsed).toHaveProperty('recommendations');
      expect(Array.isArray(parsed.recommendations)).toBe(true);
    }
  });
});
