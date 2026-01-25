import { render, screen } from '@testing-library/react';
import UsersTable from '../UsersTable';

describe('UsersTable', () => {
  const mockUsers = [
    {
      empId: 'N001',
      name: 'John Doe',
      role: 'Nurse',
      status: 'Active',
      lastLogin: '2024-01-15 10:30:00',
    },
    {
      empId: 'P001',
      name: 'Jane Smith',
      role: 'Pharmacist',
      status: 'Active',
      lastLogin: '2024-01-16 14:20:00',
    },
    {
      empId: 'N002',
      name: 'Bob Johnson',
      role: 'Nurse',
      status: 'Blacklisted',
      lastLogin: '',
    },
  ];

  it('should render table title', () => {
    render(<UsersTable users={mockUsers} />);

    expect(screen.getByText('All Users')).toBeInTheDocument();
  });

  it('should render all column headers', () => {
    render(<UsersTable users={mockUsers} />);

    // Headers are uppercased by CSS, check for text content
    expect(screen.getByText(/id/i)).toBeInTheDocument();
    expect(screen.getByText(/name/i)).toBeInTheDocument();
    expect(screen.getByText(/role/i)).toBeInTheDocument();
    expect(screen.getByText(/status/i)).toBeInTheDocument();
    expect(screen.getByText(/last login/i)).toBeInTheDocument();
  });

  it('should render all users', () => {
    render(<UsersTable users={mockUsers} />);

    expect(screen.getByText('N001')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('P001')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('N002')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
  });

  it('should display user roles correctly', () => {
    render(<UsersTable users={mockUsers} />);

    const nurseElements = screen.getAllByText('Nurse');
    expect(nurseElements).toHaveLength(2);
    expect(screen.getByText('Pharmacist')).toBeInTheDocument();
  });

  it('should display Active status with green badge', () => {
    const { container } = render(<UsersTable users={mockUsers} />);

    const activebadges = container.querySelectorAll('.bg-green-100.text-green-800');
    expect(activebadges.length).toBe(2);
  });

  it('should display Blacklisted status with red badge', () => {
    const { container } = render(<UsersTable users={mockUsers} />);

    const blacklistedBadge = container.querySelector('.bg-red-100.text-red-800');
    expect(blacklistedBadge).toBeInTheDocument();
    expect(blacklistedBadge?.textContent).toBe('Blacklisted');
  });

  it('should display last login times', () => {
    render(<UsersTable users={mockUsers} />);

    expect(screen.getByText('2024-01-15 10:30:00')).toBeInTheDocument();
    expect(screen.getByText('2024-01-16 14:20:00')).toBeInTheDocument();
  });

  it('should display "Never" for users who never logged in', () => {
    render(<UsersTable users={mockUsers} />);

    expect(screen.getByText('Never')).toBeInTheDocument();
  });

  it('should render empty table when no users', () => {
    render(<UsersTable users={[]} />);

    expect(screen.getByText('All Users')).toBeInTheDocument();
    // Table headers should still be there
    expect(screen.getByText('ID')).toBeInTheDocument();
  });

  it('should apply hover effect to table rows', () => {
    const { container } = render(<UsersTable users={mockUsers} />);

    const rows = container.querySelectorAll('tbody tr');
    rows.forEach(row => {
      expect(row).toHaveClass('hover:bg-gray-50');
    });
  });

  it('should display all user properties correctly', () => {
    const singleUser = [
      {
        empId: 'M001',
        name: 'Admin User',
        role: 'Master',
        status: 'Active',
        lastLogin: '2024-01-20 09:00:00',
      },
    ];

    render(<UsersTable users={singleUser} />);

    expect(screen.getByText('M001')).toBeInTheDocument();
    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.getByText('Master')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('2024-01-20 09:00:00')).toBeInTheDocument();
  });

  it('should handle long names gracefully', () => {
    const userWithLongName = [
      {
        empId: 'N010',
        name: 'Alexander Christopher Montgomery Wellington',
        role: 'Nurse',
        status: 'Active',
        lastLogin: '2024-01-01 10:00:00',
      },
    ];

    render(<UsersTable users={userWithLongName} />);

    expect(screen.getByText('Alexander Christopher Montgomery Wellington')).toBeInTheDocument();
  });
});
