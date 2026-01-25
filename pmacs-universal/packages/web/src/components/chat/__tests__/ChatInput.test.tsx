import { render, screen, fireEvent } from '@testing-library/react';
import ChatInput from '../ChatInput';

describe('ChatInput', () => {
  const mockOnChange = jest.fn();
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
    mockOnSubmit.mockClear();
  });

  it('should render input field', () => {
    render(
      <ChatInput value="" onChange={mockOnChange} onSubmit={mockOnSubmit} isLoading={false} />
    );

    const input = screen.getByPlaceholderText('Type your question...');
    expect(input).toBeInTheDocument();
  });

  it('should display current value', () => {
    render(
      <ChatInput
        value="Hello world"
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    const input = screen.getByPlaceholderText('Type your question...') as HTMLInputElement;
    expect(input.value).toBe('Hello world');
  });

  it('should call onChange when typing', () => {
    render(
      <ChatInput value="" onChange={mockOnChange} onSubmit={mockOnSubmit} isLoading={false} />
    );

    const input = screen.getByPlaceholderText('Type your question...');
    fireEvent.change(input, { target: { value: 'New message' } });

    expect(mockOnChange).toHaveBeenCalledWith('New message');
  });

  it('should call onSubmit when form is submitted', () => {
    render(
      <ChatInput
        value="Test message"
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    const form = screen.getByPlaceholderText('Type your question...').closest('form')!;
    fireEvent.submit(form);

    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it('should call onSubmit when send button is clicked', () => {
    render(
      <ChatInput
        value="Test message"
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    const sendButton = screen.getByText('Send');
    fireEvent.click(sendButton);

    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it('should disable input when loading', () => {
    render(
      <ChatInput value="" onChange={mockOnChange} onSubmit={mockOnSubmit} isLoading={true} />
    );

    const input = screen.getByPlaceholderText('Type your question...');
    expect(input).toBeDisabled();
  });

  it('should disable send button when loading', () => {
    render(
      <ChatInput
        value="Test"
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        isLoading={true}
      />
    );

    const sendButton = screen.getByText('Sending');
    expect(sendButton.closest('button')).toBeDisabled();
  });

  it('should disable send button when value is empty', () => {
    render(
      <ChatInput value="" onChange={mockOnChange} onSubmit={mockOnSubmit} isLoading={false} />
    );

    const sendButton = screen.getByText('Send');
    expect(sendButton.closest('button')).toBeDisabled();
  });

  it('should disable send button when value is only whitespace', () => {
    render(
      <ChatInput value="   " onChange={mockOnChange} onSubmit={mockOnSubmit} isLoading={false} />
    );

    const sendButton = screen.getByText('Send');
    expect(sendButton.closest('button')).toBeDisabled();
  });

  it('should enable send button when value is not empty', () => {
    render(
      <ChatInput
        value="Hello"
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    const sendButton = screen.getByText('Send');
    expect(sendButton.closest('button')).not.toBeDisabled();
  });

  it('should show "Sending" text when loading', () => {
    render(
      <ChatInput
        value="Test"
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        isLoading={true}
      />
    );

    expect(screen.getByText('Sending')).toBeInTheDocument();
    expect(screen.queryByText('Send')).not.toBeInTheDocument();
  });

  it('should show "Send" text when not loading', () => {
    render(
      <ChatInput
        value="Test"
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    expect(screen.getByText('Send')).toBeInTheDocument();
    expect(screen.queryByText('Sending')).not.toBeInTheDocument();
  });

  it('should apply default pharmacist colors to send button', () => {
    const { container } = render(
      <ChatInput
        value="Test"
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    const sendButton = screen.getByText('Send').closest('button');
    expect(sendButton).toHaveClass('bg-cyan-600');
  });

  it('should apply nurse colors when userRole is Nurse', () => {
    const { container } = render(
      <ChatInput
        value="Test"
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        isLoading={false}
        userRole="Nurse"
      />
    );

    const sendButton = screen.getByText('Send').closest('button');
    expect(sendButton).toHaveClass('bg-violet-600');
  });

  it('should apply master colors when userRole is Master', () => {
    const { container } = render(
      <ChatInput
        value="Test"
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        isLoading={false}
        userRole="Master"
      />
    );

    const sendButton = screen.getByText('Send').closest('button');
    expect(sendButton).toHaveClass('bg-orange-600');
  });

  it('should apply role-based focus ring color', () => {
    const { container } = render(
      <ChatInput
        value=""
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        isLoading={false}
        userRole="Nurse"
      />
    );

    const input = screen.getByPlaceholderText('Type your question...');
    expect(input).toHaveClass('focus:ring-violet-500');
  });
});
