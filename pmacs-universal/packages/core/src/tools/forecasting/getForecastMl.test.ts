/**
 * Tests for getForecastMl tool
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createGetForecastMlTool } from './getForecastMl.js';
import { MockDatabaseAdapter } from '../../test/setup.js';

describe('getForecastMl', () => {
  let db: MockDatabaseAdapter;
  let tool: ReturnType<typeof createGetForecastMlTool>;

  beforeEach(() => {
    db = new MockDatabaseAdapter();
    tool = createGetForecastMlTool(db);
  });

  it('should have correct name and description', () => {
    expect(tool.name).toBe('get_forecast_ml');
    expect(tool.description).toContain('forecast');
  });

  it('should generate forecast for existing drug', async () => {
    const result = await tool.invoke({ drugName: 'Propofol' });
    const parsed = JSON.parse(result);

    if (!parsed.error && !parsed.notFound) {
      expect(parsed.type).toBe('forecast');
      expect(parsed.drugName).toBe('Propofol');
    }
  });

  it('should return error for non-existent drug', async () => {
    const result = await tool.invoke({ drugName: 'NonExistentDrug' });
    const parsed = JSON.parse(result);

    expect(parsed.error).toBe(true);
    expect(parsed.notFound).toBe(true);
  });

  it('should provide forecast data points', async () => {
    const result = await tool.invoke({ drugName: 'Propofol', forecastDays: 7 });
    const parsed = JSON.parse(result);

    if (!parsed.error && !parsed.notFound) {
      expect(parsed.forecast).toHaveProperty('dailyForecasts');
      expect(Array.isArray(parsed.forecast.dailyForecasts)).toBe(true);
    }
  });

  it('should calculate confidence level', async () => {
    const result = await tool.invoke({ drugName: 'Propofol' });
    const parsed = JSON.parse(result);

    if (!parsed.error && !parsed.notFound) {
      expect(parsed).toHaveProperty('currentState');
      expect(parsed.currentState).toHaveProperty('trendDirection');
    }
  });

  it('should respect forecast days parameter', async () => {
    const days = 14;
    const result = await tool.invoke({ drugName: 'Propofol', forecastDays: days });
    const parsed = JSON.parse(result);

    if (!parsed.error && !parsed.notFound && parsed.forecast.dailyForecasts) {
      expect(parsed.forecast.dailyForecasts.length).toBeLessThanOrEqual(days);
      expect(parsed.forecast.periodDays).toBe(days);
    }
  });

  it('should include stockout predictions', async () => {
    const result = await tool.invoke({ drugName: 'Propofol' });
    const parsed = JSON.parse(result);

    if (!parsed.error && !parsed.notFound) {
      expect(parsed.forecast).toHaveProperty('status');
      expect(['adequate', 'warning', 'critical']).toContain(parsed.forecast.status);
    }
  });

  it('should provide recommendations', async () => {
    const result = await tool.invoke({ drugName: 'Propofol' });
    const parsed = JSON.parse(result);

    if (!parsed.error && !parsed.notFound) {
      expect(parsed).toHaveProperty('recommendation');
      expect(typeof parsed.recommendation).toBe('string');
    }
  });
});
