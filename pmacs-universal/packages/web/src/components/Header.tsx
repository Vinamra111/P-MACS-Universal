'use client';

import { Menu, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();

  // Role-based colors
  const getRoleBadgeColors = () => {
    if (!user) return 'bg-gray-50 border-gray-200';
    switch (user.role) {
      case 'Nurse':
        return 'bg-violet-50 border-violet-200';
      case 'Pharmacist':
        return 'bg-cyan-50 border-cyan-200';
      case 'Master':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getRoleTextColor = () => {
    if (!user) return 'text-gray-600';
    switch (user.role) {
      case 'Nurse':
        return 'text-violet-700';
      case 'Pharmacist':
        return 'text-cyan-700';
      case 'Master':
        return 'text-orange-700';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">P-MACS</h1>
            <p className="text-xs text-gray-500">Pharmacy - Management and Control System</p>
          </div>
        </div>

        {/* User Info & Logout */}
        {user && (
          <div className="flex items-center gap-4">
            <div className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg border ${getRoleBadgeColors()}`}>
              <UserIcon className={`h-4 w-4 ${getRoleTextColor()}`} />
              <div className="text-sm">
                <p className="font-medium text-gray-900">{user.name}</p>
                <p className={`text-xs font-medium ${getRoleTextColor()}`}>{user.role} • {user.empId}</p>
              </div>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200 hover:border-red-300"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
