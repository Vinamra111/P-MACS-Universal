/**
 * Admin authentication middleware
 * Verifies user session and Master role access
 */

import { NextRequest, NextResponse } from 'next/server';
import { CSVDatabaseAdapter } from '@pmacs/core';
import path from 'path';

const dataPath = path.join(process.cwd(), '../api/data');
const db = new CSVDatabaseAdapter(dataPath);

export interface AuthenticatedUser {
  empId: string;
  name: string;
  role: string;
  status: string;
}

/**
 * Verifies admin access (Master role only)
 * Returns user object if authorized, error response if not
 */
export async function requireAdminAuth(
  request: NextRequest
): Promise<{ user: AuthenticatedUser } | NextResponse> {
  try {
    // TODO: Replace with actual JWT validation when implemented
    // For now, check a simple header (will be replaced with JWT)
    const authHeader = request.headers.get('authorization');
    const empId = request.headers.get('x-user-id');

    if (!empId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'User ID required' },
        { status: 401 }
      );
    }

    // Load user from database
    const user = await db.getUserById(empId);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'User not found' },
        { status: 401 }
      );
    }

    // Check if user is blacklisted
    if (user.status === 'Blacklisted') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'User account is blacklisted' },
        { status: 403 }
      );
    }

    // Check if user has Master role
    if (user.role !== 'Master') {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'Admin access required. Only Master role can access this resource.',
        },
        { status: 403 }
      );
    }

    // Return authenticated user
    return {
      user: {
        empId: user.empId,
        name: user.name,
        role: user.role,
        status: user.status,
      },
    };
  } catch (error) {
    console.error('Admin auth error:', error);
    return NextResponse.json(
      {
        error: 'Authentication failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Helper to check if response is an error
 */
export function isAuthError(
  result: { user: AuthenticatedUser } | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}
