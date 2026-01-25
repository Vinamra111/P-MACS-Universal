import { render, screen, fireEvent } from '@testing-library/react';
import SidebarNavigation from '../SidebarNavigation';

describe('SidebarNavigation', () => {
  const mockSetActiveView = jest.fn();

  beforeEach(() => {
    mockSetActiveView.mockClear();
  });

  it('should render navigation items', () => {
    render(
      <SidebarNavigation activeView="dashboard" setActiveView={mockSetActiveView} userRole="Nurse" />
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Chat')).toBeInTheDocument();
  });

  it('should highlight active view', () => {
    const { container } = render(
      <SidebarNavigation activeView="dashboard" setActiveView={mockSetActiveView} userRole="Nurse" />
    );

    const dashboardButton = screen.getByText('Dashboard').closest('button');
    expect(dashboardButton).toHaveClass('bg-violet-50'); // Nurse color
    expect(dashboardButton).toHaveClass('text-violet-700');
  });

  it('should call setActiveView when clicking navigation item', () => {
    render(
      <SidebarNavigation activeView="dashboard" setActiveView={mockSetActiveView} userRole="Pharmacist" />
    );

    const chatButton = screen.getByText('Chat');
    fireEvent.click(chatButton);

    expect(mockSetActiveView).toHaveBeenCalledWith('chat');
  });

  it('should apply Pharmacist colors when active', () => {
    const { container } = render(
      <SidebarNavigation activeView="chat" setActiveView={mockSetActiveView} userRole="Pharmacist" />
    );

    const chatButton = screen.getByText('Chat').closest('button');
    expect(chatButton).toHaveClass('bg-cyan-50');
    expect(chatButton).toHaveClass('text-cyan-700');
  });

  it('should apply Master colors when active', () => {
    const { container } = render(
      <SidebarNavigation activeView="dashboard" setActiveView={mockSetActiveView} userRole="Master" />
    );

    const dashboardButton = screen.getByText('Dashboard').closest('button');
    expect(dashboardButton).toHaveClass('bg-orange-50');
    expect(dashboardButton).toHaveClass('text-orange-700');
  });

  it('should not highlight inactive items', () => {
    const { container } = render(
      <SidebarNavigation activeView="dashboard" setActiveView={mockSetActiveView} userRole="Nurse" />
    );

    const chatButton = screen.getByText('Chat').closest('button');
    expect(chatButton).not.toHaveClass('bg-violet-50');
    expect(chatButton).toHaveClass('text-gray-600');
  });
});
