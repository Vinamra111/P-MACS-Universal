import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { requireAdminAuth, isAuthError } from '@/lib/admin-auth';
import { checkRateLimit, getRequestIdentifier, RATE_LIMITS } from '@/lib/rate-limit';

const dataPath = path.join(process.cwd(), '../api/data');

export async function GET(request: NextRequest) {
  // Verify admin authentication
  const authResult = await requireAdminAuth(request);
  if (isAuthError(authResult)) {
    return authResult; // Return 401/403 error
  }
  const { user: currentUser } = authResult;

  // Rate limiting - prevent abuse
  const identifier = getRequestIdentifier(request, currentUser.empId);
  const { limited, remaining } = checkRateLimit(identifier, RATE_LIMITS.ADMIN_ACCESS_LOGS);
  if (limited) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.', remaining: 0 },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  try {
    const accessLogsPath = path.join(dataPath, 'access_logs.csv');

    // Check if access logs file exists, create if not
    if (!fs.existsSync(accessLogsPath)) {
      const header = 'timestamp,emp_id,action,role,details\n';
      fs.writeFileSync(accessLogsPath, header);
      return NextResponse.json({ logs: [], success: true });
    }

    // Read access logs
    const csvContent = fs.readFileSync(accessLogsPath, 'utf-8');

    // Parse CSV properly (handles commas in quoted fields)
    const records = parse(csvContent, {
      columns: true, // Use first row as headers
      skip_empty_lines: true,
      relax_quotes: true,
      trim: true,
    });

    // Transform to expected format
    const logs = records.map((record: any) => ({
      timestamp: record.timestamp || '',
      empId: record.emp_id || '',
      action: record.action || '',
      role: record.role || '',
      details: record.details || '',
    }))
    .reverse() // Most recent first
    .filter(log => log.empId !== currentUser.empId); // Filter out admin's own logs

    return NextResponse.json({ logs, success: true });
  } catch (error) {
    console.error('Get access logs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch access logs', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
