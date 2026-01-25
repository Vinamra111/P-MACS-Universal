import { render, screen, fireEvent } from '@testing-library/react';
import ChatHeader from '../ChatHeader';

describe('ChatHeader', () => {
  const mockOnExport = jest.fn();
  const mockOnClear = jest.fn();

  beforeEach(() => {
    mockOnExport.mockClear();
    mockOnClear.mockClear();
  });

  it('should render chat title', () => {
    render(<ChatHeader messageCount={5} onExport={mockOnExport} onClear={mockOnClear} />);

    expect(screen.getByText('Chat')).toBeInTheDocument();
  });

  it('should display message count correctly (singular)', () => {
    render(<ChatHeader messageCount={1} onExport={mockOnExport} onClear={mockOnClear} />);

    expect(screen.getByText('1 message')).toBeInTheDocument();
  });

  it('should display message count correctly (plural)', () => {
    render(<ChatHeader messageCount={5} onExport={mockOnExport} onClear={mockOnClear} />);

    expect(screen.getByText('5 messages')).toBeInTheDocument();
  });

  it('should display zero messages correctly', () => {
    render(<ChatHeader messageCount={0} onExport={mockOnExport} onClear={mockOnClear} />);

    expect(screen.getByText('0 messages')).toBeInTheDocument();
  });

  it('should call onExport when export button is clicked', () => {
    render(<ChatHeader messageCount={5} onExport={mockOnExport} onClear={mockOnClear} />);

    const exportButton = screen.getByTitle('Export chat');
    fireEvent.click(exportButton);

    expect(mockOnExport).toHaveBeenCalledTimes(1);
  });

  it('should call onClear when clear button is clicked', () => {
    render(<ChatHeader messageCount={5} onExport={mockOnExport} onClear={mockOnClear} />);

    const clearButton = screen.getByTitle('Clear chat');
    fireEvent.click(clearButton);

    expect(mockOnClear).toHaveBeenCalledTimes(1);
  });

  it('should render export and clear icons', () => {
    const { container } = render(
      <ChatHeader messageCount={5} onExport={mockOnExport} onClear={mockOnClear} />
    );

    const buttons = container.querySelectorAll('button');
    expect(buttons).toHaveLength(2);
  });

  it('should apply default pharmacist hover colors to export button', () => {
    const { container } = render(
      <ChatHeader messageCount={5} onExport={mockOnExport} onClear={mockOnClear} />
    );

    const exportButton = screen.getByTitle('Export chat');
    expect(exportButton).toHaveClass('hover:bg-cyan-50');
    expect(exportButton).toHaveClass('hover:text-cyan-700');
  });

  it('should apply nurse hover colors when userRole is Nurse', () => {
    const { container } = render(
      <ChatHeader messageCount={5} onExport={mockOnExport} onClear={mockOnClear} userRole="Nurse" />
    );

    const exportButton = screen.getByTitle('Export chat');
    expect(exportButton).toHaveClass('hover:bg-violet-50');
    expect(exportButton).toHaveClass('hover:text-violet-700');
  });

  it('should apply master hover colors when userRole is Master', () => {
    const { container } = render(
      <ChatHeader
        messageCount={5}
        onExport={mockOnExport}
        onClear={mockOnClear}
        userRole="Master"
      />
    );

    const exportButton = screen.getByTitle('Export chat');
    expect(exportButton).toHaveClass('hover:bg-orange-50');
    expect(exportButton).toHaveClass('hover:text-orange-700');
  });

  it('should always apply red colors to clear button regardless of role', () => {
    const { container } = render(
      <ChatHeader messageCount={5} onExport={mockOnExport} onClear={mockOnClear} userRole="Nurse" />
    );

    const clearButton = screen.getByTitle('Clear chat');
    expect(clearButton).toHaveClass('hover:bg-red-50');
    expect(clearButton).toHaveClass('hover:text-red-700');
  });
});
