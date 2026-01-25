'use client';

import { useState, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useChatMessages, Message } from '@/hooks/useChatMessages';
import { UserRole } from '@/hooks/useRoleColors';
import ChatHeader from './chat/ChatHeader';
import MessageItem from './chat/MessageItem';
import ChatInput from './chat/ChatInput';
import RobotLogo from './chat/RobotLogo';

interface ChatInterfaceProps {
  triggeredQuery?: string | null;
  onQueryProcessed?: () => void;
  apiEndpoint?: string;
  userRole?: UserRole;
}

export default function ChatInterface({
  triggeredQuery,
  onQueryProcessed,
  apiEndpoint = '/api/chat',
  userRole = 'Pharmacist',
}: ChatInterfaceProps) {
  const { messages, addMessage, clearMessages, exportMessages } = useChatMessages();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const submitQuery = async (query: string) => {
    if (!query.trim() || isLoading) return;

    const userMessage: Message = {
      id: messages.length,
      role: 'user',
      content: query,
      timestamp: new Date(),
    };

    addMessage(userMessage);
    setIsLoading(true);

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const assistantMessage: Message = {
        id: messages.length + 1,
        role: 'assistant',
        content: data.response || 'Sorry, I encountered an error processing your request.',
        timestamp: new Date(),
        suggestions: data.suggestions || [],
      };

      addMessage(assistantMessage);
    } catch (error) {
      const errorMessage: Message = {
        id: messages.length + 1,
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date(),
      };
      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle triggered queries from parent component
  useEffect(() => {
    if (triggeredQuery) {
      submitQuery(triggeredQuery);
      if (onQueryProcessed) {
        onQueryProcessed();
      }
    }
  }, [triggeredQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    await submitQuery(input);
    setInput('');
  };

  const handleClearChat = () => {
    if (confirm('Clear all chat history?')) {
      clearMessages();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    submitQuery(suggestion);
  };

  return (
    <>
      {/* Fade-in animation styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `,
        }}
      />

      <div className="h-full flex flex-col bg-white">
        {/* Header */}
        <ChatHeader messageCount={messages.length} onExport={exportMessages} onClear={handleClearChat} userRole={userRole} />

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <RobotLogo />
              <p className="mt-4 text-sm text-gray-500">P-MACS Agent</p>
              <p className="mt-1 text-xs text-gray-400">Start a conversation by typing your question below</p>
            </div>
          )}

          {messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              onSuggestionClick={handleSuggestionClick}
              isLoading={isLoading}
              userRole={userRole}
            />
          ))}

          {isLoading && (
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 pt-3">
                <RobotLogo />
              </div>
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-2xl">
                <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                <span className="text-sm text-gray-600">Thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <ChatInput value={input} onChange={setInput} onSubmit={handleSubmit} isLoading={isLoading} userRole={userRole} />
      </div>
    </>
  );
}
