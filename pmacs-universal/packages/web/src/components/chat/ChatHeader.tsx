import { Download, Trash2 } from 'lucide-react';
import { UserRole } from '@/hooks/useRoleColors';
import { cn } from '@/lib/utils';

interface ChatHeaderProps {
  messageCount: number;
  onExport: () => void;
  onClear: () => void;
  userRole?: UserRole;
}

export default function ChatHeader({ messageCount, onExport, onClear, userRole = 'Pharmacist' }: ChatHeaderProps) {
  return (
    <div className="border-b border-gray-200 px-6 py-4 bg-white flex items-center justify-between">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Chat</h2>
        <p className="text-xs text-gray-500">
          {messageCount} message{messageCount !== 1 ? 's' : ''}
        </p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onExport}
          className={cn(
            "p-2 rounded-lg text-gray-600 transition-colors border border-transparent",
            userRole === 'Nurse' && 'hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200',
            userRole === 'Pharmacist' && 'hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-200',
            userRole === 'Master' && 'hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200'
          )}
          title="Export chat"
        >
          <Download className="h-4 w-4" />
        </button>
        <button
          onClick={onClear}
          className="p-2 rounded-lg hover:bg-red-50 text-gray-600 hover:text-red-700 transition-colors border border-transparent hover:border-red-200"
          title="Clear chat"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
