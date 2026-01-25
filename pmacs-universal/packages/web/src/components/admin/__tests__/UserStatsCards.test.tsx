import { render, screen } from '@testing-library/react';
import UserStatsCards from '../UserStatsCards';

describe('UserStatsCards', () => {
  const defaultProps = {
    totalUsers: 10,
    activeUsers: 8,
    blacklistedUsers: 2,
    nurses: 5,
    pharmacists: 3,
  };

  it('should render all stat cards', () => {
    render(<UserStatsCards {...defaultProps} />);

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Nurses')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Pharmacists')).toBeInTheDocument();
  });

  it('should show blacklisted warning when users are blacklisted', () => {
    render(<UserStatsCards {...defaultProps} />);

    expect(screen.getByText('2 user(s) blacklisted')).toBeInTheDocument();
  });

  it('should not show blacklisted warning when no users are blacklisted', () => {
    render(<UserStatsCards {...defaultProps} blacklistedUsers={0} />);

    expect(screen.queryByText(/blacklisted/)).not.toBeInTheDocument();
  });

  it('should apply correct color classes to stat cards', () => {
    const { container } = render(<UserStatsCards {...defaultProps} />);

    expect(container.querySelector('.bg-blue-50')).toBeInTheDocument(); // Total
    expect(container.querySelector('.bg-green-50')).toBeInTheDocument(); // Active
    expect(container.querySelector('.bg-violet-50')).toBeInTheDocument(); // Nurses
    expect(container.querySelector('.bg-cyan-50')).toBeInTheDocument(); // Pharmacists
  });

  it('should apply red warning style to blacklisted alert', () => {
    const { container } = render(<UserStatsCards {...defaultProps} />);

    const alert = container.querySelector('.bg-red-50');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveClass('border-red-200');
  });

  it('should handle zero values correctly', () => {
    render(
      <UserStatsCards
        totalUsers={0}
        activeUsers={0}
        blacklistedUsers={0}
        nurses={0}
        pharmacists={0}
      />
    );

    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThan(0);
  });

  it('should handle large numbers', () => {
    render(
      <UserStatsCards
        totalUsers={1000}
        activeUsers={950}
        blacklistedUsers={50}
        nurses={600}
        pharmacists={350}
      />
    );

    expect(screen.getByText('1000')).toBeInTheDocument();
    expect(screen.getByText('950')).toBeInTheDocument();
    expect(screen.getByText('600')).toBeInTheDocument();
    expect(screen.getByText('350')).toBeInTheDocument();
  });
});
