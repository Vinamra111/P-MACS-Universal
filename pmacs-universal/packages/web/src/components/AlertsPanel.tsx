'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Calendar, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Alert {
  id: string;
  type: 'stockout' | 'expiring' | 'low-stock';
  drug: string;
  location: string;
  severity: 'critical' | 'warning';
  message: string;
  quantity?: number;
  daysUntilExpiry?: number | null;
}

export default function AlertsPanel() {
  const [selectedTab, setSelectedTab] = useState<'all' | 'critical' | 'warning'>('all');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [criticalCount, setCriticalCount] = useState(0);
  const [warningCount, setWarningCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/alerts');
      const data = await response.json();

      if (data.success) {
        setAlerts(data.alerts);
        setCriticalCount(data.criticalCount);
        setWarningCount(data.warningCount);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (selectedTab === 'all') return true;
    return alert.severity === selectedTab;
  });

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'stockout':
        return Package;
      case 'expiring':
        return Calendar;
      case 'low-stock':
        return AlertTriangle;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">Alerts</h3>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {(['all', 'critical', 'warning'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                selectedTab === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab !== 'all' && (
                <span className="ml-1.5 text-gray-500">
                  {tab === 'critical' ? criticalCount : warningCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900"></div>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
            <AlertTriangle className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">No alerts in this category</p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
          {filteredAlerts.map((alert) => {
            const Icon = getAlertIcon(alert.type);
            return (
              <div
                key={alert.id}
                className="px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={cn(
                    'flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center',
                    alert.severity === 'critical'
                      ? 'bg-red-100'
                      : 'bg-amber-100'
                  )}>
                    <Icon className={cn(
                      'h-4 w-4',
                      alert.severity === 'critical'
                        ? 'text-red-600'
                        : 'text-amber-600'
                    )} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-sm font-medium text-gray-900">{alert.drug}</p>
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                        alert.severity === 'critical'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      )}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{alert.location}</p>
                    <p className="text-sm text-gray-700 mt-1">{alert.message}</p>
                    {alert.quantity !== undefined && (
                      <p className="text-xs text-gray-500 mt-1">
                        Quantity: {alert.quantity} units
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
