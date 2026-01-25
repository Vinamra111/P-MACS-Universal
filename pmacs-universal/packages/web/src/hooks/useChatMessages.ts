import { useState, useEffect } from 'react';

export interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

const STORAGE_KEY = 'pmacs-chat-history';

export function useChatMessages() {
  const [messages, setMessages] = useState<Message[]>([]);

  // Load messages from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(
          parsed.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }))
        );
      } catch (e) {
        setMessages([]);
      }
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  const clearMessages = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);

    // Add welcome message after clearing
    setTimeout(() => {
      const welcomeMessage: Message = {
        id: Date.now(),
        role: 'assistant',
        content: "Hello! I'm P-MACS Agent. How can I help you with pharmacy management today?",
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([welcomeMessage]));
    }, 50);
  };

  const exportMessages = () => {
    const text = messages
      .map(
        (m) =>
          `[${m.timestamp.toLocaleString()}] ${m.role === 'user' ? 'user' : 'assistant'}: ${m.content}`
      )
      .join('\n\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pmacs-chat-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return {
    messages,
    addMessage,
    clearMessages,
    exportMessages,
  };
}
