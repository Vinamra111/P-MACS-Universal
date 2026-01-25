/**
 * Hook for role-based color theming
 */

export type UserRole = 'Nurse' | 'Pharmacist' | 'Master';

export interface RoleColors {
  bg: string;
  bgHover: string;
  bgActive: string;
  textActive: string;
  border: string;
  ring: string;
  badge: string;
}

export function useRoleColors(userRole: UserRole): RoleColors {
  switch (userRole) {
    case 'Nurse':
      return {
        bg: 'bg-violet-600',
        bgHover: 'hover:bg-violet-700',
        bgActive: 'bg-violet-50',
        textActive: 'text-violet-700',
        border: 'border-violet-500',
        ring: 'focus:ring-violet-500',
        badge: 'bg-violet-100 text-violet-700',
      };
    case 'Pharmacist':
      return {
        bg: 'bg-cyan-600',
        bgHover: 'hover:bg-cyan-700',
        bgActive: 'bg-cyan-50',
        textActive: 'text-cyan-700',
        border: 'border-cyan-500',
        ring: 'focus:ring-cyan-500',
        badge: 'bg-cyan-100 text-cyan-700',
      };
    case 'Master':
      return {
        bg: 'bg-orange-600',
        bgHover: 'hover:bg-orange-700',
        bgActive: 'bg-orange-50',
        textActive: 'text-orange-700',
        border: 'border-orange-500',
        ring: 'focus:ring-orange-500',
        badge: 'bg-orange-100 text-orange-700',
      };
    default:
      return {
        bg: 'bg-gray-900',
        bgHover: 'hover:bg-gray-800',
        bgActive: 'bg-gray-100',
        textActive: 'text-gray-900',
        border: 'border-gray-500',
        ring: 'focus:ring-gray-500',
        badge: 'bg-gray-100 text-gray-700',
      };
  }
}
