/**
 * Manage User Access Tool
 * View users, blacklist/whitelist operations (Master only)
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import type { DatabaseAdapter } from '../../database/CSVAdapter.js';
import type { UserRole } from '../../types/index.js';

export function createManageUserAccessTool(
  db: DatabaseAdapter,
  userRole: UserRole,
  userId: string
) {
  return new DynamicStructuredTool({
    name: 'manage_user_access',
    description: `
Manage user access and permissions (Master only).
View user list, blacklist/whitelist users, check access logs.

Use this for queries like:
- "Show all users"
- "List nurses"
- "Blacklist user N005"
- "Whitelist user P006"
- "Who has access?"
    `.trim(),

    schema: z.object({
      action: z.enum(['list', 'blacklist', 'whitelist', 'view_logs']).describe('Action to perform'),
      targetUserId: z.string().optional().describe('User ID for blacklist/whitelist actions'),
      roleFilter: z.enum(['all', 'Master', 'Pharmacist', 'Nurse']).optional().default('all').describe('Filter users by role'),
      statusFilter: z.enum(['all', 'Active', 'Blacklisted']).optional().default('all').describe('Filter users by status'),
    }),

    func: async ({ action, targetUserId, roleFilter, statusFilter }) => {
      try {
        // Permission check - Master only
        if (userRole !== 'Master') {
          return JSON.stringify({
            error: true,
            permissionDenied: true,
            message: 'Access denied. User management requires Master authorization.',
            requiredRole: 'Master',
            yourRole: userRole,
          });
        }

        // Handle different actions
        if (action === 'list') {
          let users = await db.loadUsers();

          // Apply filters
          if (roleFilter !== 'all') {
            users = users.filter(u => u.role === roleFilter);
          }

          if (statusFilter !== 'all') {
            users = users.filter(u => u.status === statusFilter);
          }

          const stats = {
            total: users.length,
            byRole: {
              Master: users.filter(u => u.role === 'Master').length,
              Pharmacist: users.filter(u => u.role === 'Pharmacist').length,
              Nurse: users.filter(u => u.role === 'Nurse').length,
            },
            byStatus: {
              Active: users.filter(u => u.status === 'Active').length,
              Blacklisted: users.filter(u => u.status === 'Blacklisted').length,
            },
          };

          return JSON.stringify({
            action: 'list',
            filtersApplied: { role: roleFilter, status: statusFilter },
            stats,

            users: users.map(u => ({
              empId: u.empId,
              name: u.name,
              role: u.role,
              status: u.status,
              unifiedGroup: u.unifiedGroup,
              createdAt: u.createdAt,
              lastLogin: u.lastLogin,
            })),

            alertMessage: stats.byStatus.Blacklisted > 0
              ? `${stats.byStatus.Blacklisted} user(s) currently blacklisted`
              : undefined,
          }, null, 2);
        }

        if (action === 'blacklist') {
          if (!targetUserId) {
            return JSON.stringify({
              error: true,
              message: 'targetUserId is required for blacklist action',
            });
          }

          const user = await db.getUserById(targetUserId);
          if (!user) {
            return JSON.stringify({
              error: true,
              notFound: true,
              message: `User ${targetUserId} not found`,
            });
          }

          if (user.role === 'Master') {
            return JSON.stringify({
              error: true,
              message: 'Cannot blacklist Master users',
            });
          }

          if (user.status === 'Blacklisted') {
            return JSON.stringify({
              error: true,
              message: `User ${targetUserId} is already blacklisted`,
            });
          }

          await db.updateUser(targetUserId, { status: 'Blacklisted' });

          await db.addAccessLog({
            logId: `LOG${Date.now()}`,
            timestamp: new Date().toISOString(),
            empId: userId,
            action: 'USER_BLACKLISTED',
            details: `Blacklisted user ${targetUserId} (${user.name})`,
          });

          return JSON.stringify({
            success: true,
            action: 'blacklist',
            targetUser: {
              empId: targetUserId,
              name: user.name,
              role: user.role,
              previousStatus: 'Active',
              newStatus: 'Blacklisted',
            },
            performedBy: userId,
            timestamp: new Date().toISOString(),
            message: `User ${targetUserId} has been blacklisted and can no longer access the system`,
          }, null, 2);
        }

        if (action === 'whitelist') {
          if (!targetUserId) {
            return JSON.stringify({
              error: true,
              message: 'targetUserId is required for whitelist action',
            });
          }

          const user = await db.getUserById(targetUserId);
          if (!user) {
            return JSON.stringify({
              error: true,
              notFound: true,
              message: `User ${targetUserId} not found`,
            });
          }

          if (user.status === 'Active') {
            return JSON.stringify({
              error: true,
              message: `User ${targetUserId} is already active`,
            });
          }

          await db.updateUser(targetUserId, { status: 'Active' });

          await db.addAccessLog({
            logId: `LOG${Date.now()}`,
            timestamp: new Date().toISOString(),
            empId: userId,
            action: 'USER_WHITELISTED',
            details: `Reactivated user ${targetUserId} (${user.name})`,
          });

          return JSON.stringify({
            success: true,
            action: 'whitelist',
            targetUser: {
              empId: targetUserId,
              name: user.name,
              role: user.role,
              previousStatus: 'Blacklisted',
              newStatus: 'Active',
            },
            performedBy: userId,
            timestamp: new Date().toISOString(),
            message: `User ${targetUserId} has been reactivated and can now access the system`,
          }, null, 2);
        }

        if (action === 'view_logs') {
          const logs = await db.getAccessLogs(50); // Last 50 logs

          const logsByAction = logs.reduce((acc: Record<string, number>, log: any) => {
            acc[log.action] = (acc[log.action] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          return JSON.stringify({
            action: 'view_logs',
            totalLogs: logs.length,
            logsByAction,

            recentLogs: logs.slice(0, 20).map((log: any) => ({
              timestamp: log.timestamp,
              empId: log.empId,
              action: log.action,
              details: log.details,
            })),

            message: 'Showing last 20 of 50 most recent access logs',
          }, null, 2);
        }

        return JSON.stringify({
          error: true,
          message: `Unknown action: ${action}`,
        });
      } catch (error) {
        return JSON.stringify({
          error: true,
          message: `Error managing user access: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    },
  });
}

export default createManageUserAccessTool;
