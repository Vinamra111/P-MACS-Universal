import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
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
    const archivePath = path.join(dataPath, 'archived_logs');

    // Create archive directory if it doesn't exist
    if (!fs.existsSync(archivePath)) {
      fs.mkdirSync(archivePath, { recursive: true });
    }

    // Read current logs
    if (fs.existsSync(accessLogsPath)) {
      const currentLogs = fs.readFileSync(accessLogsPath, 'utf-8');

      // Create archive filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const archiveFile = path.join(archivePath, `access_logs_${timestamp}.csv`);

      // Save to archive
      fs.writeFileSync(archiveFile, currentLogs);

      // Count archived logs
      const lines = currentLogs.split('\n').filter(line => line.trim() !== '');
      const archivedCount = Math.max(0, lines.length - 1); // Exclude header

      // Clear current logs (keep header)
      fs.writeFileSync(accessLogsPath, 'timestamp,emp_id,action,role,details\n');

      return NextResponse.json({
        success: true,
        message: `Archived ${archivedCount} log entries`,
        archiveFile: path.basename(archiveFile),
      });
    }

    return NextResponse.json({
      success: false,
      error: 'No logs found to clear',
    });
  } catch (error) {
    console.error('Failed to clear logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear logs' },
      { status: 500 }
    );
  }
}
