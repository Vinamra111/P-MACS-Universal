import { render, screen, fireEvent } from '@testing-library/react';
import MessageSuggestions from '../MessageSuggestions';

describe('MessageSuggestions', () => {
  const mockOnSuggestionClick = jest.fn();
  const suggestions = [
    'What is the current inventory status?',
    'Show me expiring drugs',
    'Check safety stock levels',
  ];

  beforeEach(() => {
    mockOnSuggestionClick.mockClear();
  });

  it('should not render when suggestions array is empty', () => {
    const { container } = render(
      <MessageSuggestions
        suggestions={[]}
        onSuggestionClick={mockOnSuggestionClick}
        isLoading={false}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render all suggestion buttons', () => {
    render(
      <MessageSuggestions
        suggestions={suggestions}
        onSuggestionClick={mockOnSuggestionClick}
        isLoading={false}
      />
    );

    suggestions.forEach((suggestion) => {
      expect(screen.getByText(suggestion)).toBeInTheDocument();
    });
  });

  it('should display "Suggested questions:" label', () => {
    render(
      <MessageSuggestions
        suggestions={suggestions}
        onSuggestionClick={mockOnSuggestionClick}
        isLoading={false}
      />
    );

    expect(screen.getByText('Suggested questions:')).toBeInTheDocument();
  });

  it('should call onSuggestionClick when a suggestion is clicked', () => {
    render(
      <MessageSuggestions
        suggestions={suggestions}
        onSuggestionClick={mockOnSuggestionClick}
        isLoading={false}
      />
    );

    const firstSuggestion = screen.getByText(suggestions[0]);
    fireEvent.click(firstSuggestion);

    expect(mockOnSuggestionClick).toHaveBeenCalledWith(suggestions[0]);
    expect(mockOnSuggestionClick).toHaveBeenCalledTimes(1);
  });

  it('should call onSuggestionClick with correct suggestion for each button', () => {
    render(
      <MessageSuggestions
        suggestions={suggestions}
        onSuggestionClick={mockOnSuggestionClick}
        isLoading={false}
      />
    );

    suggestions.forEach((suggestion, idx) => {
      const button = screen.getByText(suggestion);
      fireEvent.click(button);
      expect(mockOnSuggestionClick).toHaveBeenCalledWith(suggestion);
    });

    expect(mockOnSuggestionClick).toHaveBeenCalledTimes(suggestions.length);
  });

  it('should disable buttons when isLoading is true', () => {
    render(
      <MessageSuggestions
        suggestions={suggestions}
        onSuggestionClick={mockOnSuggestionClick}
        isLoading={true}
      />
    );

    suggestions.forEach((suggestion) => {
      const button = screen.getByText(suggestion).closest('button');
      expect(button).toBeDisabled();
    });
  });

  it('should enable buttons when isLoading is false', () => {
    render(
      <MessageSuggestions
        suggestions={suggestions}
        onSuggestionClick={mockOnSuggestionClick}
        isLoading={false}
      />
    );

    suggestions.forEach((suggestion) => {
      const button = screen.getByText(suggestion).closest('button');
      expect(button).not.toBeDisabled();
    });
  });

  it('should apply default blue color classes', () => {
    render(
      <MessageSuggestions
        suggestions={suggestions}
        onSuggestionClick={mockOnSuggestionClick}
        isLoading={false}
      />
    );

    const firstButton = screen.getByText(suggestions[0]).closest('button');
    expect(firstButton).toHaveClass('border-blue-200');
    expect(firstButton).toHaveClass('text-blue-700');
  });

  it('should apply custom color classes when provided', () => {
    const customColors = {
      bg: 'bg-white',
      border: 'border-violet-500',
      text: 'text-violet-700',
      hoverBg: 'hover:bg-violet-50',
      hoverBorder: 'hover:border-violet-300',
    };

    render(
      <MessageSuggestions
        suggestions={suggestions}
        onSuggestionClick={mockOnSuggestionClick}
        isLoading={false}
        colorClasses={customColors}
      />
    );

    const firstButton = screen.getByText(suggestions[0]).closest('button');
    expect(firstButton).toHaveClass('border-violet-500');
    expect(firstButton).toHaveClass('text-violet-700');
  });

  it('should render with single suggestion', () => {
    const singleSuggestion = ['Single question?'];
    render(
      <MessageSuggestions
        suggestions={singleSuggestion}
        onSuggestionClick={mockOnSuggestionClick}
        isLoading={false}
      />
    );

    expect(screen.getByText(singleSuggestion[0])).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('should handle long suggestion text', () => {
    const longSuggestion = [
      'This is a very long suggestion that might wrap to multiple lines and should still be clickable',
    ];
    render(
      <MessageSuggestions
        suggestions={longSuggestion}
        onSuggestionClick={mockOnSuggestionClick}
        isLoading={false}
      />
    );

    const button = screen.getByText(longSuggestion[0]);
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(mockOnSuggestionClick).toHaveBeenCalledWith(longSuggestion[0]);
  });
});
