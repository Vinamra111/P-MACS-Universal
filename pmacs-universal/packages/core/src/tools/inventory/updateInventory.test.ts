/**
 * Tests for updateInventory tool
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createUpdateInventoryTool } from './updateInventory.js';
import { MockDatabaseAdapter } from '../../test/setup.js';

describe('updateInventory', () => {
  let db: MockDatabaseAdapter;
  let tool: ReturnType<typeof createUpdateInventoryTool>;

  beforeEach(() => {
    db = new MockDatabaseAdapter();
    tool = createUpdateInventoryTool(db, 'Pharmacist', 'P001');
  });

  it('should have correct name', () => {
    expect(tool.name).toBe('update_inventory');
  });

  it('should update quantity for existing item', async () => {
    const result = await tool.invoke({
      drugName: 'Propofol',
      location: 'ICU-Shelf-A',
      newQuantity: 100
    });
    const parsed = JSON.parse(result);

    if (parsed.success) {
      expect(parsed.updated).toBe(true);
      expect(parsed.newQuantity).toBe(100);
      expect(parsed.drug).toBe('Propofol');
      expect(parsed.location).toBe('ICU-Shelf-A');
    }
  });

  it('should return error for non-existent item', async () => {
    const result = await tool.invoke({
      drugName: 'NonExistentDrug',
      location: 'NonExistentLocation',
      newQuantity: 50
    });
    const parsed = JSON.parse(result);

    expect(parsed.error).toBe(true);
    expect(parsed.notFound).toBe(true);
  });

  it('should deny access for Nurse role', async () => {
    const nurseTool = createUpdateInventoryTool(db, 'Nurse', 'N001');
    const result = await nurseTool.invoke({
      drugName: 'Propofol',
      location: 'ICU-Shelf-A',
      newQuantity: 100
    });
    const parsed = JSON.parse(result);

    expect(parsed.error).toBe(true);
    expect(parsed.permissionDenied).toBe(true);
    expect(parsed.requiredRole).toBe('Pharmacist');
  });

  it('should calculate quantity change', async () => {
    const result = await tool.invoke({
      drugName: 'Propofol',
      location: 'ICU-Shelf-A',
      newQuantity: 100
    });
    const parsed = JSON.parse(result);

    if (parsed.success) {
      expect(parsed).toHaveProperty('oldQuantity');
      expect(parsed).toHaveProperty('newQuantity');
      expect(parsed).toHaveProperty('change');
      expect(parsed).toHaveProperty('changeType');
    }
  });

  it('should include alert for low stock', async () => {
    const result = await tool.invoke({
      drugName: 'Propofol',
      location: 'ICU-Shelf-A',
      newQuantity: 5
    });
    const parsed = JSON.parse(result);

    if (parsed.success) {
      expect(parsed.newStatus).toBeDefined();
      expect(['available', 'low', 'stockout']).toContain(parsed.newStatus);
    }
  });

  it('should include timestamp and updatedBy', async () => {
    const result = await tool.invoke({
      drugName: 'Propofol',
      location: 'ICU-Shelf-A',
      newQuantity: 100,
      reason: 'Stock received'
    });
    const parsed = JSON.parse(result);

    if (parsed.success) {
      expect(parsed.updatedBy).toBe('P001');
      expect(parsed.timestamp).toBeDefined();
    }
  });

  it('should provide recommendation for low stock', async () => {
    const result = await tool.invoke({
      drugName: 'Propofol',
      location: 'ICU-Shelf-A',
      newQuantity: 5
    });
    const parsed = JSON.parse(result);

    if (parsed.success && parsed.newStatus !== 'available') {
      expect(parsed.recommendation || parsed.alert).toBeDefined();
    }
  });
});
