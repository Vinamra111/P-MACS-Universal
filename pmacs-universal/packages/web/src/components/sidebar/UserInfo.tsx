import { cn } from '@/lib/utils';
import { useRoleColors, UserRole } from '@/hooks/useRoleColors';

interface UserInfoProps {
  userName: string;
  userRole: UserRole;
}

export default function UserInfo({ userName, userRole }: UserInfoProps) {
  const colors = useRoleColors(userRole);

  // Get user initials
  const initials = userName.split(' ').map(n => n[0]).join('');

  return (
    <div className="px-3 py-3 border-t border-gray-200">
      <div className={cn("flex items-center gap-2 px-2 py-1.5 rounded-md border-l-2", colors.bgActive, colors.border)}>
        <div className={cn("h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-medium", colors.bg)}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-900 truncate">{userName}</p>
          <p className={cn("text-xs font-medium", colors.textActive)}>{userRole}</p>
        </div>
      </div>
    </div>
  );
}
