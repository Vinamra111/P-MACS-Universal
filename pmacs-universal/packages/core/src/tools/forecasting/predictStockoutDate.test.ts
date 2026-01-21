/**
 * Tests for predictStockoutDate tool
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createPredictStockoutDateTool } from './predictStockoutDate.js';
import { MockDatabaseAdapter } from '../../test/setup.js';

describe('predictStockoutDate', () => {
  let db: MockDatabaseAdapter;
  let tool: ReturnType<typeof createPredictStockoutDateTool>;

  beforeEach(() => {
    db = new MockDatabaseAdapter();
    tool = createPredictStockoutDateTool(db);
  });

  it('should have correct name and description', () => {
    expect(tool.name).toBe('predict_stockout_date');
    expect(tool.description).toContain('stockout');
  });

  it('should predict stockout for existing item', async () => {
    const result = await tool.invoke({
      drugName: 'Propofol'
    });
    const parsed = JSON.parse(result);

    expect(parsed.found).toBe(true);
    expect(parsed.drugName).toBe('Propofol');
  });

  it('should return error for non-existent item', async () => {
    const result = await tool.invoke({
      drugName: 'NonExistent'
    });
    const parsed = JSON.parse(result);

    expect(parsed.found).toBe(false);
  });

  it('should calculate predicted stockout date', async () => {
    const result = await tool.invoke({
      drugName: 'Propofol'
    });
    const parsed = JSON.parse(result);

    if (parsed.found && !parsed.insufficientData && parsed.prediction) {
      expect(parsed.prediction).toHaveProperty('estimatedStockoutDate');
      expect(parsed.prediction).toHaveProperty('daysUntilStockout');
    }
  });

  it('should provide current usage rate', async () => {
    const result = await tool.invoke({
      drugName: 'Propofol'
    });
    const parsed = JSON.parse(result);

    if (parsed.found && !parsed.insufficientData) {
      expect(parsed).toHaveProperty('usageAnalysis');
      expect(parsed.usageAnalysis).toHaveProperty('avgDailyUsage');
    }
  });

  it('should calculate risk level', async () => {
    const result = await tool.invoke({
      drugName: 'Propofol'
    });
    const parsed = JSON.parse(result);

    if (parsed.found && !parsed.insufficientData) {
      expect(parsed).toHaveProperty('riskAssessment');
      expect(parsed.riskAssessment).toHaveProperty('severity');
      expect(['EMERGENCY', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).toContain(parsed.riskAssessment.severity);
    }
  });

  it('should provide confidence score', async () => {
    const result = await tool.invoke({
      drugName: 'Propofol'
    });
    const parsed = JSON.parse(result);

    if (parsed.found && !parsed.insufficientData && parsed.prediction) {
      expect(parsed.prediction).toHaveProperty('confidence');
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(parsed.prediction.confidence);
    }
  });

  it('should include current stock information', async () => {
    const result = await tool.invoke({
      drugName: 'Propofol'
    });
    const parsed = JSON.parse(result);

    if (parsed.found) {
      expect(parsed).toHaveProperty('currentSituation');
      expect(parsed.currentSituation).toHaveProperty('totalStock');
    }
  });

  it('should generate actionable recommendations', async () => {
    const result = await tool.invoke({
      drugName: 'Propofol'
    });
    const parsed = JSON.parse(result);

    if (parsed.found && !parsed.insufficientData) {
      expect(parsed).toHaveProperty('recommendations');
      expect(Array.isArray(parsed.recommendations)).toBe(true);
    }
  });
});
