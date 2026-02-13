'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Calendar, Package, TrendingDown, Activity } from 'lucide-react';

interface DashboardStats {
  totalItems: number;
  lowStock: number;
  expiringSoon: number;
  stockouts: number;
  criticalAlerts: number;
}

interface Alert {
  id: string;
  type: 'stockout' | 'expiring' | 'low-stock';
  drug: string;
  location: string;
  severity: 'critical' | 'warning';
  message: string;
  quantity?: number;
}

export default function NurseDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalItems: 0,
    lowStock: 0,
    expiringSoon: 0,
    stockouts: 0,
    criticalAlerts: 0,
  });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const [statsRes, alertsRes] = await Promise.all([
        fetch(`${apiUrl}/api/nurse/dashboard`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }),
        fetch(`${apiUrl}/api/nurse/alerts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }),
      ]);

      const [statsData, alertsData] = await Promise.all([
        statsRes.json(),
        alertsRes.json(),
      ]);

      if (statsData.success) {
        setStats(statsData.stats);
      }

      if (alertsData.success) {
        setAlerts(alertsData.alerts.slice(0, 10)); // Top 10 alerts
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard Overview</h1>
            <p className="text-sm text-gray-500 mt-1">Real-time inventory status</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-violet-600 bg-violet-50 px-3 py-1.5 rounded-full border border-violet-200">
            <Activity className="h-3 w-3 animate-pulse" />
            <span className="font-medium">Auto-refresh: 30s</span>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {/* Total Items - Violet (role color) */}
        <div className="p-4 border border-violet-200 rounded-lg bg-violet-50">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-violet-100 rounded">
              <Package className="h-4 w-4 text-violet-600" />
            </div>
            <span className="text-xs text-violet-700 font-medium uppercase tracking-wide">Total Items</span>
          </div>
          <p className="text-3xl font-bold text-violet-900">{loading ? '–' : stats.totalItems}</p>
        </div>

        {/* Low Stock - Red (critical) */}
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-red-100 rounded">
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
            <span className="text-xs text-red-700 font-medium uppercase tracking-wide">Low Stock</span>
          </div>
          <p className="text-3xl font-bold text-red-900">{loading ? '–' : stats.lowStock}</p>
        </div>

        {/* Expiring Soon - Amber (warning) */}
        <div className="p-4 border border-amber-200 rounded-lg bg-amber-50">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-amber-100 rounded">
              <Calendar className="h-4 w-4 text-amber-600" />
            </div>
            <span className="text-xs text-amber-700 font-medium uppercase tracking-wide">Expiring Soon</span>
          </div>
          <p className="text-3xl font-bold text-amber-900">{loading ? '–' : stats.expiringSoon}</p>
        </div>

        {/* Stockouts - Red (critical) */}
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-red-100 rounded">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <span className="text-xs text-red-700 font-medium uppercase tracking-wide">Stockouts</span>
          </div>
          <p className="text-3xl font-bold text-red-900">{loading ? '–' : stats.stockouts}</p>
        </div>
      </div>

      {/* Critical Alert Banner */}
      {stats.criticalAlerts > 0 && !loading && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-900">
                {stats.criticalAlerts} critical alert{stats.criticalAlerts !== 1 ? 's' : ''} require immediate attention
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Alerts Table */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h2>
        {loading ? (
          <div className="flex items-center justify-center py-12 border border-gray-200 rounded-lg">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900"></div>
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-12 border border-gray-200 rounded-lg">
            <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No active alerts</p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Drug
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {alerts.map((alert) => (
                  <tr key={alert.id} className={`transition-colors ${
                    alert.severity === 'critical'
                      ? 'bg-red-50/30 hover:bg-red-50'
                      : 'hover:bg-violet-50/30'
                  }`}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {alert.drug}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {alert.location}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {alert.message}
                      {alert.quantity !== undefined && (
                        <span className="text-xs text-gray-500 ml-2">
                          ({alert.quantity} units)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          alert.severity === 'critical'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
