import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import RobotLogo from './RobotLogo';
import MessageSuggestions from './MessageSuggestions';
import { getMarkdownComponents } from '@/utils/markdownComponents';
import { UserRole, useRoleColors } from '@/hooks/useRoleColors';

export interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface MessageItemProps {
  message: Message;
  onSuggestionClick: (suggestion: string) => void;
  isLoading?: boolean;
  userRole?: UserRole;
}

export default function MessageItem({ message, onSuggestionClick, isLoading, userRole = 'Pharmacist' }: MessageItemProps) {
  const colors = useRoleColors(userRole);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const copyMessage = (content: string, id: number) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div
      key={message.id}
      className={`flex gap-4 items-start ${message.role === 'user' ? 'justify-end' : 'justify-start'} opacity-0 animate-fade-in`}
    >
      {message.role === 'assistant' && (
        <div className="flex-shrink-0 pt-3">
          <RobotLogo />
        </div>
      )}

      <div className={`max-w-3xl ${message.role === 'user' ? 'order-first' : ''}`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            message.role === 'user' ? `${colors.bg} text-white` : `${colors.bgActive} text-gray-900`
          }`}
        >
          {message.role === 'user' ? (
            <p>{message.content}</p>
          ) : (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={getMarkdownComponents(userRole)}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        <div
          className={`flex items-center gap-2 mt-1 px-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <span className="text-xs text-gray-400">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {message.role === 'assistant' && (
            <button
              onClick={() => copyMessage(message.content, message.id)}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {copiedId === message.id ? 'Copied' : 'Copy'}
            </button>
          )}
        </div>

        {/* Suggested Follow-Up Questions */}
        {message.role === 'assistant' && (
          <MessageSuggestions
            suggestions={message.suggestions || []}
            onSuggestionClick={onSuggestionClick}
            isLoading={isLoading}
            colorClasses={{
              bg: 'bg-white',
              border: colors.border,
              text: colors.textActive,
              hoverBg: colors.bgActive,
              hoverBorder: colors.border,
            }}
          />
        )}
      </div>

      {message.role === 'user' && (
        <div className="flex-shrink-0 pt-3">
          <div className={`w-8 h-8 rounded-full ${colors.bg} flex items-center justify-center text-white text-sm font-medium`}>
            U
          </div>
        </div>
      )}
    </div>
  );
}
