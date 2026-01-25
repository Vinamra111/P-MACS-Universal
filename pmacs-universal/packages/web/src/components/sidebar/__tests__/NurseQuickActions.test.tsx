import { render, screen, fireEvent } from '@testing-library/react';
import NurseQuickActions from '../NurseQuickActions';

describe('NurseQuickActions', () => {
  const mockOnQuickAction = jest.fn();

  beforeEach(() => {
    mockOnQuickAction.mockClear();
  });

  it('should render all quick action sections', () => {
    render(<NurseQuickActions onQuickAction={mockOnQuickAction} />);

    expect(screen.getByText('Emergency Drug Locator')).toBeInTheDocument();
    expect(screen.getByText('Location Inventory')).toBeInTheDocument();
    expect(screen.getByText('FEFO Check')).toBeInTheDocument();
  });

  it('should handle emergency drug search', () => {
    render(<NurseQuickActions onQuickAction={mockOnQuickAction} />);

    const inputs = screen.getAllByPlaceholderText('Drug name...');
    const emergencyInput = inputs[0] as HTMLInputElement; // First input is emergency
    const locateButton = screen.getByText('Locate');

    fireEvent.change(emergencyInput, { target: { value: 'Paracetamol' } });
    fireEvent.click(locateButton);

    expect(mockOnQuickAction).toHaveBeenCalledWith('Show me all Paracetamol stock');
    expect(emergencyInput.value).toBe(''); // Should clear after submit
  });

  it('should handle emergency drug search on Enter key', () => {
    render(<NurseQuickActions onQuickAction={mockOnQuickAction} />);

    const inputs = screen.getAllByPlaceholderText('Drug name...');
    const emergencyInput = inputs[0] as HTMLInputElement;

    fireEvent.change(emergencyInput, { target: { value: 'Aspirin' } });
    fireEvent.keyDown(emergencyInput, { key: 'Enter' });

    expect(mockOnQuickAction).toHaveBeenCalledWith('Show me all Aspirin stock');
  });

  it('should disable Locate button when input is empty', () => {
    render(<NurseQuickActions onQuickAction={mockOnQuickAction} />);

    const locateButton = screen.getByText('Locate');
    expect(locateButton).toBeDisabled();
  });

  it('should enable Locate button when input has value', () => {
    render(<NurseQuickActions onQuickAction={mockOnQuickAction} />);

    const inputs = screen.getAllByPlaceholderText('Drug name...');
    const emergencyInput = inputs[0] as HTMLInputElement;
    const locateButton = screen.getByText('Locate');

    fireEvent.change(emergencyInput, { target: { value: 'Test' } });

    expect(locateButton).not.toBeDisabled();
  });

  it('should handle location inventory view', () => {
    render(<NurseQuickActions onQuickAction={mockOnQuickAction} />);

    const select = screen.getByDisplayValue('ICU') as HTMLSelectElement;
    const viewStockButton = screen.getByText('View Stock');

    fireEvent.change(select, { target: { value: 'Ward-1' } });
    fireEvent.click(viewStockButton);

    expect(mockOnQuickAction).toHaveBeenCalledWith('Show Ward-1 inventory status');
  });

  it('should render all location options', () => {
    render(<NurseQuickActions onQuickAction={mockOnQuickAction} />);

    const select = screen.getByDisplayValue('ICU') as HTMLSelectElement;

    expect(select).toBeInTheDocument();
    expect(screen.getByText('Emergency-Room')).toBeInTheDocument();
    expect(screen.getByText('Ward-1')).toBeInTheDocument();
    expect(screen.getByText('Ward-2')).toBeInTheDocument();
    expect(screen.getByText('Ward-3')).toBeInTheDocument();
    expect(screen.getByText('Pharmacy-Main')).toBeInTheDocument();
  });

  it('should handle FEFO check', () => {
    render(<NurseQuickActions onQuickAction={mockOnQuickAction} />);

    const inputs = screen.getAllByPlaceholderText('Drug name...');
    const fefoInput = inputs[1]; // Second input is FEFO
    const getOrderButton = screen.getByText('Get Order');

    fireEvent.change(fefoInput, { target: { value: 'Ibuprofen' } });
    fireEvent.click(getOrderButton);

    expect(mockOnQuickAction).toHaveBeenCalledWith('Give me FEFO order for Ibuprofen');
    expect(fefoInput).toHaveValue(''); // Should clear after submit
  });

  it('should handle FEFO check on Enter key', () => {
    render(<NurseQuickActions onQuickAction={mockOnQuickAction} />);

    const inputs = screen.getAllByPlaceholderText('Drug name...');
    const fefoInput = inputs[1];

    fireEvent.change(fefoInput, { target: { value: 'Morphine' } });
    fireEvent.keyDown(fefoInput, { key: 'Enter' });

    expect(mockOnQuickAction).toHaveBeenCalledWith('Give me FEFO order for Morphine');
  });

  it('should not submit when input is only whitespace', () => {
    render(<NurseQuickActions onQuickAction={mockOnQuickAction} />);

    const inputs = screen.getAllByPlaceholderText('Drug name...');
    const emergencyInput = inputs[0] as HTMLInputElement;
    const locateButton = screen.getByText('Locate');

    fireEvent.change(emergencyInput, { target: { value: '   ' } });
    fireEvent.click(locateButton);

    expect(mockOnQuickAction).not.toHaveBeenCalled();
  });
});
