import { LayoutDashboard, MessageSquare, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRoleColors, UserRole } from '@/hooks/useRoleColors';

interface NavigationItem {
  name: string;
  icon: LucideIcon;
  view: 'dashboard' | 'chat';
}

interface SidebarNavigationProps {
  activeView: 'dashboard' | 'chat';
  setActiveView: (view: 'dashboard' | 'chat') => void;
  userRole: UserRole;
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', icon: LayoutDashboard, view: 'dashboard' },
  { name: 'Chat', icon: MessageSquare, view: 'chat' },
];

export default function SidebarNavigation({ activeView, setActiveView, userRole }: SidebarNavigationProps) {
  const colors = useRoleColors(userRole);

  return (
    <>
      <p className="px-2 text-xs font-medium text-gray-500 mb-2">Navigation</p>
      {navigation.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.view;
        return (
          <button
            key={item.name}
            onClick={() => setActiveView(item.view)}
            className={cn(
              'w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded-md transition-colors',
              isActive
                ? `${colors.bgActive} ${colors.textActive}`
                : 'text-gray-600 hover:bg-gray-50'
            )}
          >
            <Icon className="h-4 w-4" />
            {item.name}
          </button>
        );
      })}
    </>
  );
}
