import { render, screen } from '@testing-library/react';
import UserInfo from '../UserInfo';

describe('UserInfo', () => {
  it('should render user name and role', () => {
    render(<UserInfo userName="John Doe" userRole="Nurse" />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Nurse')).toBeInTheDocument();
  });

  it('should display user initials', () => {
    render(<UserInfo userName="Emily Chen" userRole="Pharmacist" />);

    expect(screen.getByText('EC')).toBeInTheDocument();
  });

  it('should handle single name', () => {
    render(<UserInfo userName="Admin" userRole="Master" />);

    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('should handle multi-word names', () => {
    render(<UserInfo userName="John Michael Smith" userRole="Nurse" />);

    expect(screen.getByText('JMS')).toBeInTheDocument();
  });

  it('should apply Nurse role colors', () => {
    const { container } = render(<UserInfo userName="Test User" userRole="Nurse" />);

    const badge = container.querySelector('.bg-violet-50');
    expect(badge).toBeInTheDocument();
  });

  it('should apply Pharmacist role colors', () => {
    const { container } = render(<UserInfo userName="Test User" userRole="Pharmacist" />);

    const badge = container.querySelector('.bg-cyan-50');
    expect(badge).toBeInTheDocument();
  });

  it('should apply Master role colors', () => {
    const { container } = render(<UserInfo userName="Test User" userRole="Master" />);

    const badge = container.querySelector('.bg-orange-50');
    expect(badge).toBeInTheDocument();
  });
});
