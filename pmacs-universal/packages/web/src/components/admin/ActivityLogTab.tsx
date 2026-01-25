'use client';

import { useState } from 'react';
import { Activity, Filter, Search, Download, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AccessLog {
  timestamp: string;
  empId: string;
  action: string;
  role: string;
  details: string;
}

interface ActivityLogTabProps {
  accessLogs: AccessLog[];
}

export default function ActivityLogTab({ accessLogs }: ActivityLogTabProps) {
  const { user: currentUser } = useAuth();
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const logsPerPage = 50;

  // Apply filters
  const filteredLogs = accessLogs.filter(log => {
    // Role filter
    if (roleFilter !== 'all' && log.role !== roleFilter) return false;

    // Action filter
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;

    // Time filter
    if (timeFilter !== 'all') {
      const logDate = new Date(log.timestamp);
      const now = new Date();

      if (timeFilter === 'today') {
        if (!log.timestamp.startsWith(now.toISOString().slice(0, 10))) return false;
      } else if (timeFilter === 'last-hour') {
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        if (logDate < oneHourAgo) return false;
      } else if (timeFilter === 'last-24h') {
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        if (logDate < twentyFourHoursAgo) return false;
      }
    }

    // Search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const searchableText = `${log.empId} ${log.action} ${log.role} ${log.details}`.toLowerCase();
      if (!searchableText.includes(query)) return false;
    }

    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
  const startIndex = (currentPage - 1) * logsPerPage;
  const endIndex = startIndex + logsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  // Handlers
  const handleClearLogs = async () => {
    if (!currentUser) return;

    const confirmed = confirm(
      `Are you sure you want to clear all ${accessLogs.length} log entries?\n\n` +
      'This will:\n' +
      '• Archive current logs to a backup file\n' +
      '• Clear the activity log display\n' +
      '• This action cannot be undone'
    );

    if (!confirmed) return;

    setIsClearing(true);
    try {
      const response = await fetch('/api/admin/clear-logs', {
        method: 'POST',
        headers: {
          'x-user-id': currentUser.empId,
        },
      });

      const data = await response.json();

      if (data.success) {
        alert(`Success! ${data.message}\nArchived to: ${data.archiveFile}`);
        window.location.reload(); // Refresh to show cleared logs
      } else {
        alert(`Failed to clear logs: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to clear logs:', error);
      alert('Failed to clear logs. Please try again.');
    } finally {
      setIsClearing(false);
    }
  };

  const handleExportLogs = async () => {
    if (!currentUser) return;

    try {
      const response = await fetch('/api/admin/export-logs', {
        headers: {
          'x-user-id': currentUser.empId,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `access_logs_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to export logs');
      }
    } catch (error) {
      console.error('Failed to export logs:', error);
      alert('Failed to export logs. Please try again.');
    }
  };

  const totalActivities = filteredLogs.length;
  const todayActivities = filteredLogs.filter(log =>
    log.timestamp.startsWith(new Date().toISOString().slice(0, 10))
  ).length;
  const uniqueUsers = new Set(filteredLogs.map(log => log.empId)).size;

  // Group activities by action type
  const logins = filteredLogs.filter(log => log.action === 'LOGIN').length;
  const failedAttempts = filteredLogs.filter(log => log.action === 'FAILED_LOGIN').length;
  const blockedAttempts = filteredLogs.filter(log => log.action === 'BLOCKED_LOGIN').length;

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Activity Log</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {/* Total Activities - Blue (informational) */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <div className="text-3xl font-bold text-blue-900">{totalActivities}</div>
          <div className="text-sm text-blue-700 font-medium">Total Activities</div>
        </div>

        {/* Today's Activities - Orange (admin activity) */}
        <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
          <div className="text-3xl font-bold text-orange-900">{todayActivities}</div>
          <div className="text-sm text-orange-700 font-medium">Today's Activities</div>
        </div>

        {/* Active Users - Green (positive metric) */}
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <div className="text-3xl font-bold text-green-900">{uniqueUsers}</div>
          <div className="text-sm text-green-700 font-medium">Active Users</div>
        </div>

        {/* Successful Logins - Green (positive outcome) */}
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <div className="text-3xl font-bold text-green-900">{logins}</div>
          <div className="text-sm text-green-700 font-medium">Successful Logins</div>
        </div>
      </div>

      {failedAttempts > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-amber-800">
            <Activity className="h-5 w-5" />
            <span className="font-medium">
              {failedAttempts} failed login attempt(s) detected
              {blockedAttempts > 0 && ` (${blockedAttempts} from blacklisted accounts)`}
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[300px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by user ID, action, role, or query..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <button
          onClick={handleExportLogs}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
        <button
          onClick={handleClearLogs}
          disabled={isClearing || accessLogs.length === 0}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="h-4 w-4" />
          {isClearing ? 'Clearing...' : 'Clear Logs'}
        </button>
      </div>

      {/* Filters Section */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold">Filters</h3>
          {(roleFilter !== 'all' || actionFilter !== 'all' || timeFilter !== 'all') && (
            <button
              onClick={() => {
                setRoleFilter('all');
                setActionFilter('all');
                setTimeFilter('all');
              }}
              className="ml-auto text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear all
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Role Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="Master">Master</option>
              <option value="Pharmacist">Pharmacist</option>
              <option value="Nurse">Nurse</option>
            </select>
          </div>

          {/* Action Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Actions</option>
              <option value="LOGIN">Successful Login</option>
              <option value="FAILED_LOGIN">Failed Login</option>
              <option value="BLOCKED_LOGIN">Blocked Login</option>
              <option value="QUERY">User Query</option>
            </select>
          </div>

          {/* Time Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="last-hour">Last Hour</option>
              <option value="last-24h">Last 24 Hours</option>
              <option value="today">Today</option>
            </select>
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          Showing {totalActivities} of {accessLogs.length} activities
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-4">Complete Activity History</h3>
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y">
            {paginatedLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p>No activities match the selected filters</p>
                </td>
              </tr>
            ) : (
              paginatedLogs.map((log, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.timestamp}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.empId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      log.role === 'Master' ? 'bg-orange-100 text-orange-800' :
                      log.role === 'Pharmacist' ? 'bg-cyan-100 text-cyan-800' :
                      log.role === 'Nurse' ? 'bg-violet-100 text-violet-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {log.role || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      log.action === 'LOGIN' ? 'bg-green-100 text-green-800' :
                      log.action === 'FAILED_LOGIN' ? 'bg-amber-100 text-amber-800' :
                      log.action === 'BLOCKED_LOGIN' ? 'bg-red-100 text-red-800' :
                      log.action === 'QUERY' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {log.details && log.details.length > 100
                      ? `${log.details.substring(0, 100)}...`
                      : log.details || '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredLogs.length)} of {filteredLogs.length} activities
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-4 py-2 rounded-lg ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
