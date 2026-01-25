import { NextRequest, NextResponse } from 'next/server';
import { CSVDatabaseAdapter, PasswordHasher, UserRole } from '@pmacs/core';
import path from 'path';
import { requireAdminAuth, isAuthError } from '@/lib/admin-auth';
import {
  CreateUserSchema,
  UpdateUserStatusSchema,
  DeleteUserSchema,
  validateRequest,
} from '@/lib/validation/admin-schemas';
import { checkRateLimit, getRequestIdentifier, RATE_LIMITS } from '@/lib/rate-limit';

const dataPath = path.join(process.cwd(), '../api/data');
const db = new CSVDatabaseAdapter(dataPath);

// GET - List all users
export async function GET(request: NextRequest) {
  // Verify admin authentication
  const authResult = await requireAdminAuth(request);
  if (isAuthError(authResult)) {
    return authResult; // Return 401/403 error
  }
  const { user: currentUser } = authResult;

  // Rate limiting - prevent abuse (less strict for GET)
  const identifier = getRequestIdentifier(request, currentUser.empId);
  const { limited, remaining } = checkRateLimit(identifier, RATE_LIMITS.ADMIN_ACCESS_LOGS);
  if (limited) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.', remaining: 0 },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  try {
    const users = await db.loadUsers();

    // Exclude UNIFIED accounts and password hashes from response
    const safeUsers = users
      .filter(u => !u.empId.includes('UNIFIED'))
      .map(u => ({
        empId: u.empId,
        name: u.name,
        role: u.role,
        status: u.status,
        unifiedGroup: u.unifiedGroup,
        createdAt: u.createdAt,
        lastLogin: u.lastLogin,
      }));

    return NextResponse.json({ users: safeUsers, success: true });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  // Verify admin authentication
  const authResult = await requireAdminAuth(request);
  if (isAuthError(authResult)) {
    return authResult; // Return 401/403 error
  }
  const { user: currentUser } = authResult;

  // Rate limiting - prevent abuse
  const identifier = getRequestIdentifier(request, currentUser.empId);
  const { limited, remaining } = checkRateLimit(identifier, RATE_LIMITS.ADMIN_CREATE_USER);
  if (limited) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.', remaining: 0 },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  try {
    const body = await request.json();

    // Validate input with Zod
    const validation = validateRequest(CreateUserSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, validationErrors: validation.details.errors },
        { status: 400 }
      );
    }

    const { empId, name, role, password } = validation.data as { empId: string; name: string; role: string; password: string };

    // Check if user already exists
    const existingUsers = await db.loadUsers();
    if (existingUsers.some(u => u.empId === empId)) {
      return NextResponse.json(
        { error: 'User with this employee ID already exists' },
        { status: 409 }
      );
    }

    // Hash password using bcrypt (secure)
    const passwordHash = await PasswordHasher.hash(password);

    // Determine unified group based on role
    const unifiedGroup = role === 'Master' ? 'MASTER_GROUP' :
                        role === 'Pharmacist' ? 'PHARMACIST_GROUP' :
                        'NURSE_GROUP';

    // Create user
    const newUser = {
      empId,
      role: role as UserRole,
      status: 'Active' as const,
      name,
      passwordHash,
      unifiedGroup,
      createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      lastLogin: '',
    };

    // Add user to database using thread-safe method
    const users = await db.loadUsers();
    users.push(newUser);
    await db.saveUsers(users);

    return NextResponse.json({
      success: true,
      message: `User ${empId} created successfully`,
      user: {
        empId,
        name,
        role,
        status: 'Active',
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Failed to create user', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT - Update user status (whitelist/blacklist)
export async function PUT(request: NextRequest) {
  // Verify admin authentication
  const authResult = await requireAdminAuth(request);
  if (isAuthError(authResult)) {
    return authResult; // Return 401/403 error
  }
  const { user: currentUser } = authResult;

  // Rate limiting - prevent abuse
  const identifier = getRequestIdentifier(request, currentUser.empId);
  const { limited, remaining } = checkRateLimit(identifier, RATE_LIMITS.ADMIN_UPDATE_USER);
  if (limited) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.', remaining: 0 },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  try {
    const body = await request.json();

    // Validate input with Zod
    const validation = validateRequest(UpdateUserStatusSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, validationErrors: validation.details.errors },
        { status: 400 }
      );
    }

    const { empId, action } = validation.data as { empId: string; action: string };

    // Prevent admin from modifying their own account status
    if (empId === currentUser.empId) {
      return NextResponse.json(
        { error: 'Cannot modify your own account status' },
        { status: 403 }
      );
    }

    const users = await db.loadUsers();
    const userIndex = users.findIndex(u => u.empId === empId);

    if (userIndex === -1) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update status using thread-safe database method
    const newStatus = action === 'WHITELIST' ? 'Active' : 'Blacklisted';
    const updatedUser = await db.updateUser(empId, { status: newStatus });

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to update user status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `User ${empId} ${action === 'WHITELIST' ? 'activated' : 'blacklisted'} successfully`,
      user: {
        empId: updatedUser.empId,
        name: updatedUser.name,
        status: updatedUser.status,
      },
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove user
export async function DELETE(request: NextRequest) {
  // Verify admin authentication
  const authResult = await requireAdminAuth(request);
  if (isAuthError(authResult)) {
    return authResult; // Return 401/403 error
  }
  const { user: currentUser } = authResult;

  // Rate limiting - prevent abuse
  const identifier = getRequestIdentifier(request, currentUser.empId);
  const { limited, remaining } = checkRateLimit(identifier, RATE_LIMITS.ADMIN_DELETE_USER);
  if (limited) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.', remaining: 0 },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  try {
    const { searchParams } = new URL(request.url);

    // Validate query params with Zod
    const validation = validateRequest(DeleteUserSchema, {
      empId: searchParams.get('empId'),
    });
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, validationErrors: validation.details.errors },
        { status: 400 }
      );
    }

    const { empId } = validation.data as { empId: string };

    // Prevent admin from deleting their own account
    if (empId === currentUser.empId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 403 }
      );
    }

    const users = await db.loadUsers();
    const userIndex = users.findIndex(u => u.empId === empId);

    if (userIndex === -1) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const deletedUser = users[userIndex];

    // Remove user from array and save using thread-safe method
    users.splice(userIndex, 1);
    await db.saveUsers(users);

    return NextResponse.json({
      success: true,
      message: `User ${empId} (${deletedUser.name}) deleted successfully`,
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
