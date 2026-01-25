import { NextRequest, NextResponse } from 'next/server';
import { CSVDatabaseAdapter } from '@pmacs/core';
import path from 'path';
import crypto from 'crypto';
import { logAccess } from '@/lib/access-logger';

// Initialize database adapter
const dataPath = path.join(process.cwd(), '../api/data');
const db = new CSVDatabaseAdapter(dataPath);

// Get local timestamp in YYYY-MM-DD HH:mm:ss format
function getLocalTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Simple password mapping for demo
// In production, these would be properly hashed and stored
const PASSWORD_HASHES: Record<string, string> = {
  // Master password: "admin"
  'admin': '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
  // Pharmacist password: "pharma"
  'pharma': 'd74ff0ee8da3b9806b18c877dbf29bbde50b5bd8e4dad7a3a725000feb82e8f1',
  // Nurse password: "nurse"
  'nurse': '478c67e2c5836d1f0856c455f3d946eb3c7a6d1c04f16f0b0e5c0b5b4a6f6c1d',
};

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const { empId, password } = await request.json();

    // Validate input
    if (!empId || !password) {
      return NextResponse.json(
        { error: 'Employee ID and password are required' },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await db.getUserById(empId);

    if (!user) {
      // Log failed login attempt
      logAccess(empId, 'FAILED_LOGIN', '', 'User not found');
      return NextResponse.json(
        { error: 'Invalid employee ID or password' },
        { status: 401 }
      );
    }

    // Check if user is blacklisted
    if (user.status === 'Blacklisted') {
      // Log blacklisted access attempt
      logAccess(empId, 'BLOCKED_LOGIN', user.role, 'Account blacklisted');
      return NextResponse.json(
        { error: 'Account has been deactivated. Please contact administration.' },
        { status: 403 }
      );
    }

    // Hash provided password
    const passwordHash = hashPassword(password);

    // Validate password
    if (user.passwordHash !== passwordHash) {
      // Log failed login attempt
      logAccess(empId, 'FAILED_LOGIN', user.role, 'Invalid password');
      return NextResponse.json(
        { error: 'Invalid employee ID or password' },
        { status: 401 }
      );
    }

    // Log successful login
    logAccess(empId, 'LOGIN', user.role, 'Successful login');

    // Update last login time using thread-safe database method
    try {
      const lastLogin = getLocalTimestamp();
      await db.updateUser(empId, { lastLogin });
    } catch (error) {
      console.error('Failed to update last login:', error);
      // Don't fail the login if we can't update last login time
    }

    // Successful login - return user data (without password hash)
    return NextResponse.json({
      success: true,
      user: {
        empId: user.empId,
        name: user.name,
        role: user.role,
        status: user.status,
        unifiedGroup: user.unifiedGroup,
      },
    });

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      {
        error: 'Login failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
