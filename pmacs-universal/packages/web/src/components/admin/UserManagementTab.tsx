'use client';

import { AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserManagement } from '@/hooks/useUserManagement';
import UserStatsCards from './UserStatsCards';
import CreateUserForm from './CreateUserForm';
import UserActionPanel from './UserActionPanel';
import UsersTable from './UsersTable';

interface User {
  empId: string;
  name: string;
  role: string;
  status: string;
  unifiedGroup: string;
  createdAt: string;
  lastLogin: string;
}

interface UserManagementTabProps {
  users: User[];
  onRefresh: () => void;
}

export default function UserManagementTab({ users, onRefresh }: UserManagementTabProps) {
  const { user: currentUser } = useAuth();
  const { loading, message, setMessage, whitelistUser, blacklistUser, deleteUser, createUser } =
    useUserManagement(onRefresh, currentUser?.empId);

  // Calculate stats
  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.status === 'Active').length,
    blacklistedUsers: users.filter((u) => u.status === 'Blacklisted').length,
    nurses: users.filter((u) => u.role === 'Nurse').length,
    pharmacists: users.filter((u) => u.role === 'Pharmacist').length,
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">User Access Management</h2>

      {/* Message Banner */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertTriangle className="h-5 w-5" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <UserStatsCards {...stats} />

      {/* Create User Form */}
      <CreateUserForm onCreateUser={createUser} loading={loading} />

      {/* User Actions Panel */}
      <UserActionPanel
        users={users}
        onWhitelist={whitelistUser}
        onBlacklist={blacklistUser}
        onDelete={deleteUser}
        loading={loading}
      />

      {/* Users Table */}
      <UsersTable users={users} />
    </div>
  );
}
