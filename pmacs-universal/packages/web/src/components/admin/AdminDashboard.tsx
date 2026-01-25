'use client';

import { useState, useEffect } from 'react';
import { Users, BarChart3, Activity } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import UserManagementTab from './UserManagementTab';
import SystemOverviewTab from './SystemOverviewTab';
import ActivityLogTab from './ActivityLogTab';

type TabType = 'users' | 'system-overview' | 'activity-log';

interface User {
  empId: string;
  name: string;
  role: string;
  status: string;
  unifiedGroup: string;
  createdAt: string;
  lastLogin: string;
}

interface AccessLog {
  timestamp: string;
  empId: string;
  action: string;
  role: string;
  details: string;
}

export default function AdminDashboard() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('system-overview');
  const [users, setUsers] = useState<User[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!currentUser) return;

    try {
      const headers = {
        'x-user-id': currentUser.empId,
      };

      const [usersRes, logsRes] = await Promise.all([
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/access-logs', { headers }),
      ]);

      if (!usersRes.ok || !logsRes.ok) {
        console.error('API request failed:', usersRes.status, logsRes.status);
        return;
      }

      const [usersData, logsData] = await Promise.all([
        usersRes.json(),
        logsRes.json(),
      ]);

      if (usersData.success && Array.isArray(usersData.users)) {
        // Filter out the current admin user - admin shouldn't monitor themselves
        const filteredUsers = usersData.users.filter(
          (user: User) => user.empId !== currentUser.empId
        );
        setUsers(filteredUsers);
      } else {
        console.error('Invalid users data:', usersData);
      }

      if (logsData.success && Array.isArray(logsData.logs)) {
        // Filter out the current admin's activities - admin shouldn't see their own logs
        const filteredLogs = logsData.logs.filter(
          (log: AccessLog) => log.empId !== currentUser.empId
        );
        setAccessLogs(filteredLogs);
      } else {
        console.error('Invalid logs data:', logsData);
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Real-time refresh every 5 seconds
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { id: 'system-overview' as TabType, label: 'System Overview', icon: BarChart3 },
    { id: 'users' as TabType, label: 'User Management', icon: Users },
    { id: 'activity-log' as TabType, label: 'Activity Log', icon: Activity },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-sm text-gray-500">System administration and user management</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {activeTab === 'system-overview' && (
          <SystemOverviewTab users={users} accessLogs={accessLogs} />
        )}
        {activeTab === 'users' && (
          <UserManagementTab users={users} onRefresh={fetchData} />
        )}
        {activeTab === 'activity-log' && (
          <ActivityLogTab accessLogs={accessLogs} />
        )}
      </div>

      {/* Auto-refresh indicator */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-400">
          <Activity className="h-3 w-3 inline mr-1" />
          Auto-refreshing every 5 seconds
        </p>
      </div>
    </div>
  );
}
