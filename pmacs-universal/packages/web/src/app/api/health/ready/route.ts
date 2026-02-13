/**
 * Readiness Check Endpoint
 * Returns 200 only when the application is fully ready to serve traffic
 */

import { NextRequest, NextResponse } from 'next/server';
import { existsSync } from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  // Check if critical dependencies are available
  const checks = {
    database: false,
    openai: false,
  };

  // Check database
  try {
    const dataPath = path.join(process.cwd(), '../api/data');
    const inventoryPath = path.join(dataPath, 'inventory_master.csv');
    const usersPath = path.join(dataPath, 'user_access.csv');

    checks.database = existsSync(inventoryPath) && existsSync(usersPath);
  } catch (error) {
    checks.database = false;
  }

  // Check OpenAI key
  checks.openai = !!process.env.OPENAI_API_KEY;

  // Ready only if all checks pass
  const isReady = checks.database && checks.openai;

  return NextResponse.json(
    {
      ready: isReady,
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: isReady ? 200 : 503 }
  );
}
