import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const userId = request.headers.get('x-user-id');

    if (!userId || userId !== 'M001') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const dataPath = path.join(process.cwd(), '../api/data');
    const accessLogsPath = path.join(dataPath, 'access_logs.csv');

    if (!fs.existsSync(accessLogsPath)) {
      return NextResponse.json(
        { success: false, error: 'No logs found' },
        { status: 404 }
      );
    }

    const logsContent = fs.readFileSync(accessLogsPath, 'utf-8');
    const timestamp = new Date().toISOString().slice(0, 10);

    // Return CSV file
    return new NextResponse(logsContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="access_logs_${timestamp}.csv"`,
      },
    });
  } catch (error) {
    console.error('Failed to export logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export logs' },
      { status: 500 }
    );
  }
}
