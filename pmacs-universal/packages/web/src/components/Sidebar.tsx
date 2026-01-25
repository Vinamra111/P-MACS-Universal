import { Package, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRoleColors, UserRole } from '@/hooks/useRoleColors';
import SidebarNavigation from './sidebar/SidebarNavigation';
import NurseQuickActions from './sidebar/NurseQuickActions';
import PharmacistQuickActions from './sidebar/PharmacistQuickActions';
import MasterQuickActions from './sidebar/MasterQuickActions';
import UserInfo from './sidebar/UserInfo';

interface SidebarProps {
  activeView: 'dashboard' | 'chat';
  setActiveView: (view: 'dashboard' | 'chat') => void;
  isOpen: boolean;
  onToggle: () => void;
  onQuickAction?: (query: string) => void;
  userRole?: UserRole;
  userName?: string;
  userId?: string;
}

export default function Sidebar({
  activeView,
  setActiveView,
  isOpen,
  onToggle,
  onQuickAction,
  userRole = 'Pharmacist',
  userName = 'Emily Chen',
  userId = 'P001'
}: SidebarProps) {
  const colors = useRoleColors(userRole);

  const handleQuickAction = (query: string) => {
    setActiveView('chat');
    if (onQuickAction) {
      onQuickAction(query);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-900/20 z-20 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center shadow-lg",
                userRole === 'Nurse' && 'bg-violet-600',
                userRole === 'Pharmacist' && 'bg-cyan-600',
                userRole === 'Master' && 'bg-orange-600'
              )}>
                <Package className="h-6 w-6 text-white" strokeWidth={3} />
              </div>
              <span className="text-base font-semibold text-gray-900">P-MACS</span>
            </div>
            <button onClick={onToggle} className="lg:hidden p-1 rounded-md hover:bg-gray-100">
              <X className="h-4 w-4 text-gray-600" />
            </button>
          </div>

          {/* Navigation & Quick Actions */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <SidebarNavigation
              activeView={activeView}
              setActiveView={setActiveView}
              userRole={userRole}
            />

            <p className="px-2 text-xs font-medium text-gray-500 mt-6 mb-2">Quick Actions</p>

            {userRole === 'Nurse' && <NurseQuickActions onQuickAction={handleQuickAction} />}
            {userRole === 'Pharmacist' && <PharmacistQuickActions onQuickAction={handleQuickAction} />}
            {userRole === 'Master' && <MasterQuickActions onQuickAction={handleQuickAction} />}
          </nav>

          {/* User Info */}
          <UserInfo userName={userName} userRole={userRole} />
        </div>
      </aside>
    </>
  );
}
