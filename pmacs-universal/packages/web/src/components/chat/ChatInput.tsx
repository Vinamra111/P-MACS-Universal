import { Send, Loader2 } from 'lucide-react';
import { UserRole, useRoleColors } from '@/hooks/useRoleColors';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  userRole?: UserRole;
}

export default function ChatInput({ value, onChange, onSubmit, isLoading, userRole = 'Pharmacist' }: ChatInputProps) {
  const colors = useRoleColors(userRole);
  return (
    <div className="border-t border-gray-200 px-6 py-4 bg-white">
      <form onSubmit={onSubmit} className="flex gap-3">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your question..."
          className={`flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 ${colors.ring} focus:border-transparent text-sm`}
          disabled={isLoading}
          autoFocus
        />
        <button
          type="submit"
          disabled={!value.trim() || isLoading}
          className={`px-6 py-3 ${colors.bg} text-white rounded-xl ${colors.bgHover} disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium text-sm`}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Sending</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>Send</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
