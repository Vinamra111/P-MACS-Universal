/**
 * P-MACS Authentication Manager
 * Two-step authentication with RBAC (Role-Based Access Control)
 * Preserves the original P-MACS security model
 */

import { createHash, randomBytes } from 'crypto';
import type {
  User,
  UserRole,
  UserStatus,
  Permission,
  AuthResult,
  AccessLog,
  ROLE_PERMISSIONS,
} from '../types/index.js';
import type { DatabaseAdapter } from '../database/CSVAdapter.js';
import { getCurrentTimestamp } from '../utils/dateUtils.js';

// ============================================================
// PERMISSION DEFINITIONS
// ============================================================

const PERMISSIONS: Record<UserRole, Permission[]> = {
  Nurse: ['read'],
  Pharmacist: ['read', 'update', 'forecast'],
  Master: ['read', 'update', 'forecast', 'admin'],
};

// Unified group passwords (for step 1)
const UNIFIED_PASSWORDS: Record<string, string> = {
  NURSE_GROUP: 'nurse123',
  PHARMACIST_GROUP: 'pharm123',
  MASTER_GROUP: 'admin123',
};

// ============================================================
// AUTH MANAGER IMPLEMENTATION
// ============================================================

export interface AuthManagerConfig {
  database: DatabaseAdapter;
  masterKey?: string;
  sessionTTL?: number; // Session timeout in milliseconds
}

export class AuthManager {
  private db: DatabaseAdapter;
  private masterKey: string;
  private sessionTTL: number;
  private sessions: Map<string, { user: User; expiresAt: number }> = new Map();

  constructor(config: AuthManagerConfig) {
    this.db = config.database;
    this.masterKey = config.masterKey || 'admin123';
    this.sessionTTL = config.sessionTTL || 8 * 60 * 60 * 1000; // 8 hours default
  }

  /**
   * Hash password using SHA-256 (matching original P-MACS)
   */
  hashPassword(password: string): string {
    return createHash('sha256').update(password).digest('hex');
  }

  /**
   * Generate a secure session token
   */
  generateSessionToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Generate a unique ID for logs
   */
  private generateLogId(): string {
    return `LOG${Date.now()}${randomBytes(4).toString('hex').toUpperCase()}`;
  }

  /**
   * Step 1: Group/Unified Login
   * Validates role selection with group password
   */
  async step1UnifiedLogin(role: UserRole, groupPassword: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    // Master role requires master key
    if (role === 'Master') {
      if (groupPassword === this.masterKey) {
        return { success: true };
      }
      return { success: false, error: 'Invalid master key' };
    }

    // Other roles use unified group passwords
    const groupKey = role === 'Nurse' ? 'NURSE_GROUP' : 'PHARMACIST_GROUP';
    const expectedPassword = UNIFIED_PASSWORDS[groupKey];

    if (groupPassword === expectedPassword) {
      return { success: true };
    }

    return { success: false, error: 'Invalid group password' };
  }

  /**
   * Step 2: Personal Login
   * Validates individual employee credentials
   */
  async step2PersonalLogin(
    empId: string,
    password: string,
    expectedRole: UserRole
  ): Promise<AuthResult> {
    const user = await this.db.getUserById(empId);

    // If user doesn't exist, create new account (first login)
    if (!user) {
      const newUser: User = {
        empId,
        role: expectedRole,
        status: 'Active',
        name: `User ${empId}`,
        passwordHash: this.hashPassword(password),
        unifiedGroup: `${expectedRole.toUpperCase()}_GROUP`,
        createdAt: getCurrentTimestamp(),
        lastLogin: getCurrentTimestamp(),
      };

      const users = await this.db.loadUsers();
      users.push(newUser);
      await this.db.saveUsers(users);

      // Log account creation
      await this.logAccess(empId, 'ACCOUNT_CREATED', 'New user account created');

      const sessionToken = this.generateSessionToken();
      this.sessions.set(sessionToken, {
        user: newUser,
        expiresAt: Date.now() + this.sessionTTL,
      });

      return {
        success: true,
        user: newUser,
        sessionToken,
      };
    }

    // Check if user is blacklisted
    if (user.status === 'Blacklisted') {
      await this.logAccess(empId, 'LOGIN_BLOCKED', 'Blacklisted user attempted login');
      return {
        success: false,
        error: 'Account is blacklisted. Contact administrator.',
      };
    }

    // Verify role matches
    if (user.role !== expectedRole) {
      await this.logAccess(empId, 'ROLE_MISMATCH', `Expected ${expectedRole}, user is ${user.role}`);
      return {
        success: false,
        error: `This ID is registered as ${user.role}, not ${expectedRole}`,
      };
    }

    // Verify password
    const passwordHash = this.hashPassword(password);
    if (user.passwordHash !== passwordHash) {
      await this.logAccess(empId, 'LOGIN_FAILED', 'Invalid password');
      return {
        success: false,
        error: 'Invalid password',
      };
    }

    // Update last login
    await this.db.updateUser(empId, { lastLogin: getCurrentTimestamp() });

    // Create session
    const sessionToken = this.generateSessionToken();
    this.sessions.set(sessionToken, {
      user,
      expiresAt: Date.now() + this.sessionTTL,
    });

    await this.logAccess(empId, 'LOGIN_SUCCESS', 'User logged in successfully');

    return {
      success: true,
      user,
      sessionToken,
    };
  }

  /**
   * Simple login (combines both steps - for testing/API use)
   */
  async simpleLogin(empId: string, password: string): Promise<AuthResult> {
    const user = await this.db.getUserById(empId);

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    if (user.status === 'Blacklisted') {
      return {
        success: false,
        error: 'Account is blacklisted',
      };
    }

    const passwordHash = this.hashPassword(password);
    if (user.passwordHash !== passwordHash) {
      return {
        success: false,
        error: 'Invalid password',
      };
    }

    // Update last login
    await this.db.updateUser(empId, { lastLogin: getCurrentTimestamp() });

    // Create session
    const sessionToken = this.generateSessionToken();
    this.sessions.set(sessionToken, {
      user,
      expiresAt: Date.now() + this.sessionTTL,
    });

    return {
      success: true,
      user,
      sessionToken,
    };
  }

  /**
   * Validate session token
   */
  validateSession(sessionToken: string): User | null {
    const session = this.sessions.get(sessionToken);

    if (!session) return null;

    if (Date.now() > session.expiresAt) {
      this.sessions.delete(sessionToken);
      return null;
    }

    return session.user;
  }

  /**
   * Logout - invalidate session
   */
  async logout(sessionToken: string): Promise<void> {
    const session = this.sessions.get(sessionToken);
    if (session) {
      await this.logAccess(session.user.empId, 'LOGOUT', 'User logged out');
      this.sessions.delete(sessionToken);
    }
  }

  /**
   * Check if user has permission for an action
   */
  hasPermission(role: UserRole, permission: Permission): boolean {
    return PERMISSIONS[role]?.includes(permission) || false;
  }

  /**
   * Get all permissions for a role
   */
  getPermissions(role: UserRole): Permission[] {
    return PERMISSIONS[role] || [];
  }

  /**
   * Blacklist a user (Master only)
   */
  async blacklistUser(empId: string, adminId: string): Promise<{ success: boolean; error?: string }> {
    const user = await this.db.getUserById(empId);

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (user.role === 'Master') {
      return { success: false, error: 'Cannot blacklist Master users' };
    }

    await this.db.updateUser(empId, { status: 'Blacklisted' });
    await this.logAccess(adminId, 'USER_BLACKLISTED', `Blacklisted user ${empId}`);

    // Invalidate any active sessions for this user
    for (const [token, session] of this.sessions.entries()) {
      if (session.user.empId === empId) {
        this.sessions.delete(token);
      }
    }

    return { success: true };
  }

  /**
   * Whitelist (reactivate) a user (Master only)
   */
  async whitelistUser(empId: string, adminId: string): Promise<{ success: boolean; error?: string }> {
    const user = await this.db.getUserById(empId);

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    await this.db.updateUser(empId, { status: 'Active' });
    await this.logAccess(adminId, 'USER_WHITELISTED', `Reactivated user ${empId}`);

    return { success: true };
  }

  /**
   * Log access event
   */
  async logAccess(empId: string, action: string, details?: string): Promise<void> {
    const log: AccessLog = {
      logId: this.generateLogId(),
      timestamp: getCurrentTimestamp(),
      empId,
      action,
      details,
    };

    await this.db.addAccessLog(log);
  }

  /**
   * Get all users (Master only)
   */
  async getAllUsers(): Promise<User[]> {
    return this.db.loadUsers();
  }

  /**
   * Change user password
   */
  async changePassword(
    empId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    const user = await this.db.getUserById(empId);

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const oldHash = this.hashPassword(oldPassword);
    if (user.passwordHash !== oldHash) {
      return { success: false, error: 'Current password is incorrect' };
    }

    const newHash = this.hashPassword(newPassword);
    await this.db.updateUser(empId, { passwordHash: newHash });
    await this.logAccess(empId, 'PASSWORD_CHANGED', 'User changed password');

    return { success: true };
  }
}

export default AuthManager;
