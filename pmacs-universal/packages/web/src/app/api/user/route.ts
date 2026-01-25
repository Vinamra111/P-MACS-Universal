import { NextRequest, NextResponse } from 'next/server';
import { CSVDatabaseAdapter } from '@pmacs/core';
import path from 'path';

// Initialize database adapter
const dataPath = path.join(process.cwd(), '../api/data');
const db = new CSVDatabaseAdapter(dataPath);

export async function GET(request: NextRequest) {
  try {
    // Get user ID from query params (default to P001)
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'P001';

    const user = await db.getUserById(userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        empId: user.empId,
        name: user.name,
        role: user.role,
        status: user.status,
        lastLogin: user.lastLogin,
      },
      success: true,
    });
  } catch (error) {
    console.error('User API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch user data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
