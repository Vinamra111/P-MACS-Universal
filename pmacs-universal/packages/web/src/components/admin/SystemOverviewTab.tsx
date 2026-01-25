'use client';

import { AlertTriangle, CheckCircle, Users as UsersIcon, Clock } from 'lucide-react';

interface User {
  empId: string;
  name: string;
  role: string;
  status: string;
  lastLogin: string;
}

interface AccessLog {
  timestamp: string;
  empId: string;
  action: string;
  role: string;
}

interface SystemOverviewTabProps {
  users: User[];
  accessLogs: AccessLog[];
}

export default function SystemOverviewTab({ users, accessLogs }: SystemOverviewTabProps) {
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'Active').length;
  const blacklistedUsers = users.filter(u => u.status === 'Blacklisted').length;
  const nurses = users.filter(u => u.role === 'Nurse').length;
  const pharmacists = users.filter(u => u.role === 'Pharmacist').length;
  const masters = users.filter(u => u.role === 'Master').length;
  const todayLogins = accessLogs.filter(log =>
    log.timestamp.startsWith(new Date().toISOString().slice(0, 10)) && log.action === 'LOGIN'
  ).length;

  // Calculate active sessions (users who logged in within last 30 minutes)
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  const activeSessions = users
    .filter(user => {
      if (!user.lastLogin) return false;
      const lastLoginDate = new Date(user.lastLogin);
      return lastLoginDate >= thirtyMinutesAgo;
    })
    .map(user => ({
      ...user,
      sessionDuration: getSessionDuration(user.lastLogin)
    }))
    .sort((a, b) => new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime());

  function getSessionDuration(lastLogin: string): string {
    const loginTime = new Date(lastLogin);
    const now = new Date();
    const diffMs = now.getTime() - loginTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    return `${diffHours} hours ago`;
  }

  function getRoleBadgeColor(role: string): string {
    switch (role) {
      case 'Nurse': return 'bg-violet-100 text-violet-800 border-violet-200';
      case 'Pharmacist': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'Master': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">System Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Users - Blue (informational) */}
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
          <div className="text-3xl font-bold text-blue-900">{totalUsers}</div>
          <div className="text-sm text-blue-700 font-medium mt-1">Total Users</div>
        </div>

        {/* Active Users - Green (positive status) */}
        <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
          <div className="text-3xl font-bold text-green-900">{activeUsers}</div>
          <div className="text-sm text-green-700 font-medium mt-1">Active Users</div>
        </div>

        {/* Blacklisted - Red (critical security issue) */}
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
          <div className="text-3xl font-bold text-red-900">{blacklistedUsers}</div>
          <div className="text-sm text-red-700 font-medium mt-1">Blacklisted</div>
        </div>

        {/* Today's Logins - Orange (admin/activity metric) */}
        <div className="bg-orange-50 border border-orange-200 p-6 rounded-lg">
          <div className="text-3xl font-bold text-orange-900">{todayLogins}</div>
          <div className="text-sm text-orange-700 font-medium mt-1">Today's Logins</div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Active Sessions - Real-time monitoring */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <UsersIcon className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Active Sessions (Last 30 Minutes)</h3>
            <span className="ml-auto px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
              {activeSessions.length} online
            </span>
          </div>
          {activeSessions.length > 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session Duration</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activeSessions.map((session) => (
                    <tr key={session.empId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-2 w-2 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{session.name}</div>
                            <div className="text-xs text-gray-500">{session.empId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRoleBadgeColor(session.role)}`}>
                          {session.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(session.lastLogin).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          {session.sessionDuration}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <UsersIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No active sessions in the last 30 minutes</p>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">User Distribution by Role</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Nurses - Violet (role color) */}
            <div className="bg-violet-50 border border-violet-200 p-4 rounded-lg">
              <div className="text-2xl font-bold text-violet-900">{nurses}</div>
              <div className="text-sm text-violet-700 font-medium">Nurses</div>
            </div>

            {/* Pharmacists - Cyan (role color) */}
            <div className="bg-cyan-50 border border-cyan-200 p-4 rounded-lg">
              <div className="text-2xl font-bold text-cyan-900">{pharmacists}</div>
              <div className="text-sm text-cyan-700 font-medium">Pharmacists</div>
            </div>

            {/* Masters - Orange (role color) */}
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-900">{masters}</div>
              <div className="text-sm text-orange-700 font-medium">Masters</div>
            </div>
          </div>
        </div>

        {blacklistedUsers > 0 ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center gap-2 text-red-800 mb-2">
              <AlertTriangle className="h-6 w-6" />
              <span className="text-lg font-semibold">Security Alert</span>
            </div>
            <p className="text-red-700">There are {blacklistedUsers} blacklisted user(s). Review access logs for security issues.</p>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-6 w-6" />
              <span className="text-lg font-semibold">All Systems Operational</span>
            </div>
            <p className="text-green-700 mt-2">No security issues detected. All users are in good standing.</p>
          </div>
        )}
      </div>
    </div>
  );
}
