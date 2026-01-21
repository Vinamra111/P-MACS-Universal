/**
 * Tests for manageUserAccess tool
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createManageUserAccessTool } from './manageUserAccess.js';
import { MockDatabaseAdapter } from '../../test/setup.js';

describe('manageUserAccess', () => {
  let db: MockDatabaseAdapter;
  let tool: ReturnType<typeof createManageUserAccessTool>;

  beforeEach(() => {
    db = new MockDatabaseAdapter();
    tool = createManageUserAccessTool(db, 'Master', 'M001');
  });

  it('should have correct name', () => {
    expect(tool.name).toBe('manage_user_access');
  });

  it('should list all users when action is list', async () => {
    const result = await tool.invoke({ action: 'list' });
    const parsed = JSON.parse(result);

    expect(parsed.action).toBe('list');
    expect(Array.isArray(parsed.users)).toBe(true);
    expect(parsed.stats).toBeDefined();
  });

  it('should include user details in listing', async () => {
    const result = await tool.invoke({ action: 'list' });
    const parsed = JSON.parse(result);

    if (parsed.users && parsed.users.length > 0) {
      expect(parsed.users[0]).toHaveProperty('empId');
      expect(parsed.users[0]).toHaveProperty('name');
      expect(parsed.users[0]).toHaveProperty('role');
      expect(parsed.users[0]).toHaveProperty('status');
    }
  });

  it('should return error for blacklist without targetUserId', async () => {
    const result = await tool.invoke({
      action: 'blacklist'
    });
    const parsed = JSON.parse(result);

    expect(parsed.error).toBe(true);
    expect(parsed.message).toContain('targetUserId is required');
  });

  it('should return error when blacklisting non-existent user', async () => {
    const result = await tool.invoke({
      action: 'blacklist',
      targetUserId: 'NONEXISTENT'
    });
    const parsed = JSON.parse(result);

    expect(parsed.error).toBe(true);
    expect(parsed.notFound).toBe(true);
  });

  it('should deny access for non-Master users', async () => {
    const nurseTool = createManageUserAccessTool(db, 'Nurse', 'N001');
    const result = await nurseTool.invoke({
      action: 'list'
    });
    const parsed = JSON.parse(result);

    expect(parsed.error).toBe(true);
    expect(parsed.permissionDenied).toBe(true);
    expect(parsed.requiredRole).toBe('Master');
  });

  it('should view access logs', async () => {
    const result = await tool.invoke({
      action: 'view_logs'
    });
    const parsed = JSON.parse(result);

    expect(parsed.action).toBe('view_logs');
    expect(parsed).toHaveProperty('totalLogs');
    expect(Array.isArray(parsed.recentLogs)).toBe(true);
  });

  it('should include filter information in list response', async () => {
    const result = await tool.invoke({
      action: 'list',
      roleFilter: 'Nurse',
      statusFilter: 'Active'
    });
    const parsed = JSON.parse(result);

    expect(parsed.filtersApplied).toBeDefined();
    expect(parsed.filtersApplied.role).toBe('Nurse');
    expect(parsed.filtersApplied.status).toBe('Active');
  });

  it('should include statistics in list response', async () => {
    const result = await tool.invoke({
      action: 'list'
    });
    const parsed = JSON.parse(result);

    expect(parsed.stats).toBeDefined();
    expect(parsed.stats).toHaveProperty('total');
    expect(parsed.stats).toHaveProperty('byRole');
    expect(parsed.stats).toHaveProperty('byStatus');
  });
});
