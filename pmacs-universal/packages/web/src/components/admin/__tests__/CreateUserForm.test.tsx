import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateUserForm from '../CreateUserForm';

describe('CreateUserForm', () => {
  const mockOnCreateUser = jest.fn();

  beforeEach(() => {
    mockOnCreateUser.mockClear();
  });

  it('should render create user button', () => {
    render(<CreateUserForm onCreateUser={mockOnCreateUser} loading={false} />);

    expect(screen.getByText('Create New User')).toBeInTheDocument();
  });

  it('should show form when button is clicked', () => {
    render(<CreateUserForm onCreateUser={mockOnCreateUser} loading={false} />);

    const button = screen.getByText('Create New User');
    fireEvent.click(button);

    expect(screen.getByPlaceholderText('Employee ID (e.g., N012)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Full Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });

  it('should hide form when button is clicked again', () => {
    render(<CreateUserForm onCreateUser={mockOnCreateUser} loading={false} />);

    const button = screen.getByText('Create New User');
    fireEvent.click(button);
    expect(screen.getByPlaceholderText('Employee ID (e.g., N012)')).toBeInTheDocument();

    fireEvent.click(button);
    expect(screen.queryByPlaceholderText('Employee ID (e.g., N012)')).not.toBeInTheDocument();
  });

  it('should render all form fields', () => {
    render(<CreateUserForm onCreateUser={mockOnCreateUser} loading={false} />);

    fireEvent.click(screen.getByText('Create New User'));

    expect(screen.getByPlaceholderText('Employee ID (e.g., N012)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Full Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Nurse')).toBeInTheDocument();
  });

  it('should have all role options', () => {
    render(<CreateUserForm onCreateUser={mockOnCreateUser} loading={false} />);

    fireEvent.click(screen.getByText('Create New User'));

    expect(screen.getByText('Nurse')).toBeInTheDocument();
    expect(screen.getByText('Pharmacist')).toBeInTheDocument();
    expect(screen.getByText('Master')).toBeInTheDocument();
  });

  it('should call onCreateUser with correct data when form is submitted', async () => {
    mockOnCreateUser.mockResolvedValue(undefined);

    render(<CreateUserForm onCreateUser={mockOnCreateUser} loading={false} />);

    fireEvent.click(screen.getByText('Create New User'));

    fireEvent.change(screen.getByPlaceholderText('Employee ID (e.g., N012)'), {
      target: { value: 'N015' },
    });
    fireEvent.change(screen.getByPlaceholderText('Full Name'), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password123' },
    });

    const form = screen.getByPlaceholderText('Employee ID (e.g., N012)').closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockOnCreateUser).toHaveBeenCalledWith({
        empId: 'N015',
        name: 'John Doe',
        role: 'Nurse',
        password: 'password123',
      });
    });
  });

  it('should allow selecting different roles', () => {
    render(<CreateUserForm onCreateUser={mockOnCreateUser} loading={false} />);

    fireEvent.click(screen.getByText('Create New User'));

    const roleSelect = screen.getByDisplayValue('Nurse') as HTMLSelectElement;
    fireEvent.change(roleSelect, { target: { value: 'Pharmacist' } });

    expect(roleSelect.value).toBe('Pharmacist');
  });

  it('should clear form after successful submission', async () => {
    mockOnCreateUser.mockResolvedValue(undefined);

    render(<CreateUserForm onCreateUser={mockOnCreateUser} loading={false} />);

    fireEvent.click(screen.getByText('Create New User'));

    const empIdInput = screen.getByPlaceholderText('Employee ID (e.g., N012)') as HTMLInputElement;
    const nameInput = screen.getByPlaceholderText('Full Name') as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;

    fireEvent.change(empIdInput, { target: { value: 'N015' } });
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    const form = empIdInput.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      // Form should be hidden after submission
      expect(screen.queryByPlaceholderText('Employee ID (e.g., N012)')).not.toBeInTheDocument();
    });
  });

  it('should disable Create button when loading', () => {
    render(<CreateUserForm onCreateUser={mockOnCreateUser} loading={true} />);

    fireEvent.click(screen.getByText('Create New User'));

    const createButton = screen.getByText('Creating...');
    expect(createButton).toBeDisabled();
  });

  it('should show "Creating..." text when loading', () => {
    render(<CreateUserForm onCreateUser={mockOnCreateUser} loading={true} />);

    fireEvent.click(screen.getByText('Create New User'));

    expect(screen.getByText('Creating...')).toBeInTheDocument();
  });

  it('should show "Create" text when not loading', () => {
    render(<CreateUserForm onCreateUser={mockOnCreateUser} loading={false} />);

    fireEvent.click(screen.getByText('Create New User'));

    expect(screen.getByText('Create')).toBeInTheDocument();
  });

  it('should hide form when Cancel is clicked', () => {
    render(<CreateUserForm onCreateUser={mockOnCreateUser} loading={false} />);

    fireEvent.click(screen.getByText('Create New User'));
    expect(screen.getByPlaceholderText('Employee ID (e.g., N012)')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByPlaceholderText('Employee ID (e.g., N012)')).not.toBeInTheDocument();
  });

  it('should require all fields', () => {
    render(<CreateUserForm onCreateUser={mockOnCreateUser} loading={false} />);

    fireEvent.click(screen.getByText('Create New User'));

    const empIdInput = screen.getByPlaceholderText('Employee ID (e.g., N012)');
    const nameInput = screen.getByPlaceholderText('Full Name');
    const passwordInput = screen.getByPlaceholderText('Password');

    expect(empIdInput).toBeRequired();
    expect(nameInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });
});
