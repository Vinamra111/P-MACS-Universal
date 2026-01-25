/**
 * Reusable markdown component configuration for ReactMarkdown
 */

import { UserRole } from '@/hooks/useRoleColors';

// Role-based color mapping for markdown tables
const getRoleColors = (userRole: UserRole = 'Pharmacist') => {
  switch (userRole) {
    case 'Nurse':
      return {
        border: 'border-violet-200',
        bg: 'bg-violet-100',
        bgHover: 'hover:bg-violet-50/30',
        text: 'text-violet-900',
        divider: 'divide-violet-100',
        borderLight: 'border-violet-100',
      };
    case 'Pharmacist':
      return {
        border: 'border-cyan-200',
        bg: 'bg-cyan-100',
        bgHover: 'hover:bg-cyan-50/30',
        text: 'text-cyan-900',
        divider: 'divide-cyan-100',
        borderLight: 'border-cyan-100',
      };
    case 'Master':
      return {
        border: 'border-orange-200',
        bg: 'bg-orange-100',
        bgHover: 'hover:bg-orange-50/30',
        text: 'text-orange-900',
        divider: 'divide-orange-100',
        borderLight: 'border-orange-100',
      };
    default:
      return {
        border: 'border-cyan-200',
        bg: 'bg-cyan-100',
        bgHover: 'hover:bg-cyan-50/30',
        text: 'text-cyan-900',
        divider: 'divide-cyan-100',
        borderLight: 'border-cyan-100',
      };
  }
};

export const getMarkdownComponents = (userRole: UserRole = 'Pharmacist') => {
  const colors = getRoleColors(userRole);

  return {
    p: ({ children }: any) => <p className="mb-2 last:mb-0 text-gray-900">{children}</p>,
    ul: ({ children }: any) => <ul className="ml-4 mb-2 list-disc space-y-1 text-gray-900">{children}</ul>,
    ol: ({ children }: any) => <ol className="ml-4 mb-2 list-decimal space-y-1 text-gray-900">{children}</ol>,
    li: ({ children }: any) => <li className="leading-relaxed text-gray-900">{children}</li>,
    strong: ({ children }: any) => <strong className="font-semibold text-gray-900">{children}</strong>,
    code: ({ children }: any) => <code className="bg-gray-200 px-1.5 py-0.5 rounded text-xs text-gray-900">{children}</code>,
    table: ({ children }: any) => (
      <div className="my-3 overflow-x-auto">
        <table className={`min-w-full text-xs border ${colors.border} rounded-lg overflow-hidden`}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: any) => (
      <thead className={`${colors.bg} border-b-2 ${colors.border}`}>
        {children}
      </thead>
    ),
    tbody: ({ children }: any) => (
      <tbody className={`bg-white divide-y ${colors.divider}`}>
        {children}
      </tbody>
    ),
    tr: ({ children }: any) => (
      <tr className={`${colors.bgHover} transition-colors`}>
        {children}
      </tr>
    ),
    th: ({ children }: any) => (
      <th className={`px-3 py-2 text-left font-semibold ${colors.text} border-r ${colors.border} last:border-r-0`}>
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className={`px-3 py-2 text-gray-900 border-r ${colors.borderLight} last:border-r-0`}>
        {children}
      </td>
    ),
  };
};

// Keep original export for backwards compatibility
export const markdownComponents = getMarkdownComponents('Pharmacist');
