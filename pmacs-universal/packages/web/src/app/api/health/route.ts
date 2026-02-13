/**
 * Health Check Endpoint
 * Returns system health status for monitoring and load balancers
 */

import { NextRequest, NextResponse } from 'next/server';
import { existsSync } from 'fs';
import { readdir } from 'fs/promises';
import path from 'path';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: {
      status: 'ok' | 'error';
      message?: string;
      filesFound?: number;
    };
    openai: {
      status: 'ok' | 'error';
      message?: string;
    };
    memory: {
      status: 'ok' | 'warning' | 'error';
      used: number;
      total: number;
      percentUsed: number;
    };
    environment: {
      status: 'ok' | 'error';
      nodeEnv: string;
      requiredVariables: Record<string, boolean>;
    };
  };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    checks: {
      database: { status: 'ok' },
      openai: { status: 'ok' },
      memory: {
        status: 'ok',
        used: 0,
        total: 0,
        percentUsed: 0,
      },
      environment: {
        status: 'ok',
        nodeEnv: process.env.NODE_ENV || 'development',
        requiredVariables: {},
      },
    },
  };

  // Check database files
  try {
    const dataPath = path.join(process.cwd(), '../api/data');
    const requiredFiles = [
      'inventory_master.csv',
      'transaction_logs.csv',
      'user_access.csv',
    ];

    let filesFound = 0;
    for (const file of requiredFiles) {
      const filePath = path.join(dataPath, file);
      if (existsSync(filePath)) {
        filesFound++;
      }
    }

    if (filesFound === requiredFiles.length) {
      health.checks.database = {
        status: 'ok',
        filesFound,
      };
    } else {
      health.checks.database = {
        status: 'error',
        message: `Missing database files. Found ${filesFound}/${requiredFiles.length}`,
        filesFound,
      };
      health.status = 'degraded';
    }
  } catch (error) {
    health.checks.database = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Database check failed',
    };
    health.status = 'degraded';
  }

  // Check OpenAI API key
  if (!process.env.OPENAI_API_KEY) {
    health.checks.openai = {
      status: 'error',
      message: 'OpenAI API key not configured',
    };
    health.status = 'unhealthy';
  } else if (process.env.OPENAI_API_KEY.startsWith('sk-')) {
    health.checks.openai = { status: 'ok' };
  } else {
    health.checks.openai = {
      status: 'error',
      message: 'Invalid OpenAI API key format',
    };
    health.status = 'degraded';
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  const totalMemMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  const usedMemMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const percentUsed = Math.round((usedMemMB / totalMemMB) * 100);

  health.checks.memory = {
    status: percentUsed > 90 ? 'error' : percentUsed > 75 ? 'warning' : 'ok',
    used: usedMemMB,
    total: totalMemMB,
    percentUsed,
  };

  if (health.checks.memory.status === 'error') {
    health.status = 'degraded';
  }

  // Check environment variables
  const requiredEnvVars = [
    'OPENAI_API_KEY',
    'NODE_ENV',
  ];

  for (const envVar of requiredEnvVars) {
    health.checks.environment.requiredVariables[envVar] = !!process.env[envVar];
  }

  const missingVars = requiredEnvVars.filter(v => !process.env[v]);
  if (missingVars.length > 0) {
    health.checks.environment.status = 'error';
    health.status = 'unhealthy';
  }

  // Return appropriate status code
  const statusCode = health.status === 'healthy' ? 200 :
                     health.status === 'degraded' ? 200 :
                     503;

  return NextResponse.json(health, { status: statusCode });
}

// Simple liveness check
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, { status: 200 });
}
