import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MessageItem, { Message } from '../MessageItem';

// Mock react-markdown
jest.mock('react-markdown', () => {
  return function ReactMarkdown({ children }: { children: string }) {
    return <div>{children}</div>;
  };
});

jest.mock('remark-gfm', () => {
  return {};
});

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

describe('MessageItem', () => {
  const mockOnSuggestionClick = jest.fn();

  beforeEach(() => {
    mockOnSuggestionClick.mockClear();
    jest.clearAllMocks();
  });

  it('should render user message', () => {
    const message: Message = {
      id: 1,
      role: 'user',
      content: 'Hello, how are you?',
      timestamp: new Date('2024-01-01T10:00:00'),
    };

    render(<MessageItem message={message} onSuggestionClick={mockOnSuggestionClick} />);

    expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
  });

  it('should render assistant message', () => {
    const message: Message = {
      id: 1,
      role: 'assistant',
      content: 'I am doing well, thank you!',
      timestamp: new Date('2024-01-01T10:00:00'),
    };

    render(<MessageItem message={message} onSuggestionClick={mockOnSuggestionClick} />);

    expect(screen.getByText('I am doing well, thank you!')).toBeInTheDocument();
  });

  it('should display timestamp', () => {
    const message: Message = {
      id: 1,
      role: 'user',
      content: 'Test message',
      timestamp: new Date('2024-01-01T14:30:00'),
    };

    render(<MessageItem message={message} onSuggestionClick={mockOnSuggestionClick} />);

    // Timestamp format will vary by locale, but should be present
    const timestamp = screen.getByText(/\d{1,2}:\d{2}/);
    expect(timestamp).toBeInTheDocument();
  });

  it('should show copy button for assistant messages', () => {
    const message: Message = {
      id: 1,
      role: 'assistant',
      content: 'Test response',
      timestamp: new Date(),
    };

    render(<MessageItem message={message} onSuggestionClick={mockOnSuggestionClick} />);

    expect(screen.getByText('Copy')).toBeInTheDocument();
  });

  it('should not show copy button for user messages', () => {
    const message: Message = {
      id: 1,
      role: 'user',
      content: 'Test question',
      timestamp: new Date(),
    };

    render(<MessageItem message={message} onSuggestionClick={mockOnSuggestionClick} />);

    expect(screen.queryByText('Copy')).not.toBeInTheDocument();
  });

  it('should copy message content when copy button is clicked', async () => {
    const message: Message = {
      id: 1,
      role: 'assistant',
      content: 'Content to copy',
      timestamp: new Date(),
    };

    render(<MessageItem message={message} onSuggestionClick={mockOnSuggestionClick} />);

    const copyButton = screen.getByText('Copy');
    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Content to copy');
  });

  it('should show "Copied" text after copying', async () => {
    const message: Message = {
      id: 1,
      role: 'assistant',
      content: 'Test content',
      timestamp: new Date(),
    };

    render(<MessageItem message={message} onSuggestionClick={mockOnSuggestionClick} />);

    const copyButton = screen.getByText('Copy');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(screen.getByText('Copied')).toBeInTheDocument();
    });
  });

  it('should render suggestion buttons when provided', () => {
    const message: Message = {
      id: 1,
      role: 'assistant',
      content: 'Here are some options:',
      timestamp: new Date(),
      suggestions: ['Show inventory', 'Check stock levels', 'View alerts'],
    };

    render(<MessageItem message={message} onSuggestionClick={mockOnSuggestionClick} />);

    expect(screen.getByText('Show inventory')).toBeInTheDocument();
    expect(screen.getByText('Check stock levels')).toBeInTheDocument();
    expect(screen.getByText('View alerts')).toBeInTheDocument();
  });

  it('should not render suggestions section when no suggestions', () => {
    const message: Message = {
      id: 1,
      role: 'assistant',
      content: 'No suggestions here',
      timestamp: new Date(),
    };

    render(<MessageItem message={message} onSuggestionClick={mockOnSuggestionClick} />);

    expect(screen.queryByText('Suggested questions:')).not.toBeInTheDocument();
  });

  it('should call onSuggestionClick when suggestion is clicked', () => {
    const message: Message = {
      id: 1,
      role: 'assistant',
      content: 'Test',
      timestamp: new Date(),
      suggestions: ['Test suggestion'],
    };

    render(<MessageItem message={message} onSuggestionClick={mockOnSuggestionClick} />);

    const suggestionButton = screen.getByText('Test suggestion');
    fireEvent.click(suggestionButton);

    expect(mockOnSuggestionClick).toHaveBeenCalledWith('Test suggestion');
  });

  it('should disable suggestion buttons when loading', () => {
    const message: Message = {
      id: 1,
      role: 'assistant',
      content: 'Test',
      timestamp: new Date(),
      suggestions: ['Test suggestion'],
    };

    render(
      <MessageItem message={message} onSuggestionClick={mockOnSuggestionClick} isLoading={true} />
    );

    const suggestionButton = screen.getByText('Test suggestion');
    expect(suggestionButton).toBeDisabled();
  });

  it('should enable suggestion buttons when not loading', () => {
    const message: Message = {
      id: 1,
      role: 'assistant',
      content: 'Test',
      timestamp: new Date(),
      suggestions: ['Test suggestion'],
    };

    render(
      <MessageItem message={message} onSuggestionClick={mockOnSuggestionClick} isLoading={false} />
    );

    const suggestionButton = screen.getByText('Test suggestion');
    expect(suggestionButton).not.toBeDisabled();
  });

  it('should apply correct styling for user messages with default role', () => {
    const message: Message = {
      id: 1,
      role: 'user',
      content: 'Test',
      timestamp: new Date(),
    };

    const { container } = render(
      <MessageItem message={message} onSuggestionClick={mockOnSuggestionClick} />
    );

    // Default role is Pharmacist (cyan)
    const messageContainer = container.querySelector('.bg-cyan-600');
    expect(messageContainer).toBeInTheDocument();
    expect(messageContainer).toHaveClass('text-white');
  });

  it('should apply correct styling for assistant messages with default role', () => {
    const message: Message = {
      id: 1,
      role: 'assistant',
      content: 'Test',
      timestamp: new Date(),
    };

    const { container } = render(
      <MessageItem message={message} onSuggestionClick={mockOnSuggestionClick} />
    );

    // Default role is Pharmacist (cyan)
    const messageContainer = container.querySelector('.bg-cyan-50');
    expect(messageContainer).toBeInTheDocument();
    expect(messageContainer).toHaveClass('text-gray-900');
  });

  it('should apply nurse colors when userRole is Nurse', () => {
    const message: Message = {
      id: 1,
      role: 'user',
      content: 'Test',
      timestamp: new Date(),
    };

    const { container } = render(
      <MessageItem message={message} onSuggestionClick={mockOnSuggestionClick} userRole="Nurse" />
    );

    const messageContainer = container.querySelector('.bg-violet-600');
    expect(messageContainer).toBeInTheDocument();
  });

  it('should apply pharmacist colors when userRole is Pharmacist', () => {
    const message: Message = {
      id: 1,
      role: 'user',
      content: 'Test',
      timestamp: new Date(),
    };

    const { container } = render(
      <MessageItem
        message={message}
        onSuggestionClick={mockOnSuggestionClick}
        userRole="Pharmacist"
      />
    );

    const messageContainer = container.querySelector('.bg-cyan-600');
    expect(messageContainer).toBeInTheDocument();
  });

  it('should apply master colors when userRole is Master', () => {
    const message: Message = {
      id: 1,
      role: 'user',
      content: 'Test',
      timestamp: new Date(),
    };

    const { container } = render(
      <MessageItem message={message} onSuggestionClick={mockOnSuggestionClick} userRole="Master" />
    );

    const messageContainer = container.querySelector('.bg-orange-600');
    expect(messageContainer).toBeInTheDocument();
  });

  it('should apply role-based colors to assistant messages', () => {
    const message: Message = {
      id: 1,
      role: 'assistant',
      content: 'Test',
      timestamp: new Date(),
    };

    const { container: nurseContainer } = render(
      <MessageItem message={message} onSuggestionClick={mockOnSuggestionClick} userRole="Nurse" />
    );

    expect(nurseContainer.querySelector('.bg-violet-50')).toBeInTheDocument();
  });

  it('should apply role-based colors to user avatar', () => {
    const message: Message = {
      id: 1,
      role: 'user',
      content: 'Test',
      timestamp: new Date(),
    };

    const { container } = render(
      <MessageItem message={message} onSuggestionClick={mockOnSuggestionClick} userRole="Nurse" />
    );

    // User avatar should have violet background for Nurse role
    // Find the avatar specifically (rounded-full element with U text)
    const avatars = container.querySelectorAll('.rounded-full');
    const avatar = Array.from(avatars).find((el) => el.textContent === 'U');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveClass('bg-violet-600');
  });
});
