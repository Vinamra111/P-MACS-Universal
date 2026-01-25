import { renderHook, act, waitFor } from '@testing-library/react';
import { useChatMessages, Message } from '../useChatMessages';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

describe('useChatMessages', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should initialize with empty messages array', () => {
    const { result } = renderHook(() => useChatMessages());

    expect(result.current.messages).toEqual([]);
  });

  it('should load messages from localStorage on mount', () => {
    const savedMessages: Message[] = [
      {
        id: 1,
        role: 'user',
        content: 'Hello',
        timestamp: new Date('2024-01-01'),
      },
    ];

    localStorageMock.setItem('pmacs-chat-history', JSON.stringify(savedMessages));

    const { result } = renderHook(() => useChatMessages());

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].content).toBe('Hello');
  });

  it('should add a new message', () => {
    const { result } = renderHook(() => useChatMessages());

    const newMessage: Message = {
      id: 1,
      role: 'user',
      content: 'Test message',
      timestamp: new Date(),
    };

    act(() => {
      result.current.addMessage(newMessage);
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].content).toBe('Test message');
  });

  it('should save messages to localStorage when adding', () => {
    const { result } = renderHook(() => useChatMessages());

    const newMessage: Message = {
      id: 1,
      role: 'assistant',
      content: 'Response',
      timestamp: new Date(),
    };

    act(() => {
      result.current.addMessage(newMessage);
    });

    const saved = localStorageMock.getItem('pmacs-chat-history');
    expect(saved).toBeTruthy();

    const parsed = JSON.parse(saved!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].content).toBe('Response');
  });

  it('should clear all messages', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useChatMessages());

    const newMessage: Message = {
      id: 1,
      role: 'user',
      content: 'Test',
      timestamp: new Date(),
    };

    act(() => {
      result.current.addMessage(newMessage);
    });

    expect(result.current.messages).toHaveLength(1);

    act(() => {
      result.current.clearMessages();
    });

    // Messages should be cleared immediately
    expect(result.current.messages).toHaveLength(0);

    // Advance timers to trigger the setTimeout in clearMessages (50ms)
    act(() => {
      jest.advanceTimersByTime(50);
    });

    // Welcome message should now be added
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].role).toBe('assistant');
    expect(result.current.messages[0].content).toContain('P-MACS Agent');

    jest.useRealTimers();
  });

  it('should export messages to text file', () => {
    const { result } = renderHook(() => useChatMessages());

    const messages: Message[] = [
      {
        id: 1,
        role: 'user',
        content: 'Hello',
        timestamp: new Date('2024-01-01T10:00:00'),
      },
      {
        id: 2,
        role: 'assistant',
        content: 'Hi there!',
        timestamp: new Date('2024-01-01T10:00:05'),
      },
    ];

    act(() => {
      messages.forEach(msg => result.current.addMessage(msg));
    });

    // Mock DOM methods
    const createElementSpy = jest.spyOn(document, 'createElement');
    const appendChildSpy = jest.spyOn(document.body, 'appendChild');
    const removeChildSpy = jest.spyOn(document.body, 'removeChild');

    act(() => {
      result.current.exportMessages();
    });

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();

    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  it('should handle corrupted localStorage data gracefully', () => {
    localStorageMock.setItem('pmacs-chat-history', 'invalid json');

    const { result } = renderHook(() => useChatMessages());

    // Should initialize with empty array instead of crashing
    expect(result.current.messages).toEqual([]);
  });

  it('should preserve message order when adding multiple messages', () => {
    const { result } = renderHook(() => useChatMessages());

    const messages: Message[] = [
      { id: 1, role: 'user', content: 'First', timestamp: new Date() },
      { id: 2, role: 'assistant', content: 'Second', timestamp: new Date() },
      { id: 3, role: 'user', content: 'Third', timestamp: new Date() },
    ];

    act(() => {
      messages.forEach(msg => result.current.addMessage(msg));
    });

    expect(result.current.messages).toHaveLength(3);
    expect(result.current.messages[0].content).toBe('First');
    expect(result.current.messages[1].content).toBe('Second');
    expect(result.current.messages[2].content).toBe('Third');
  });
});
