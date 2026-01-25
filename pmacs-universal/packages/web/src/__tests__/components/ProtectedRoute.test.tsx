/**
 * Tests for ProtectedRoute component
 */

import { render, screen, waitFor } from '@testing-library/react'
import { ProtectedRoute } from '@/components/ProtectedRoute'

// Mock the AuthContext
const mockUseAuth = jest.fn()

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

// Mock next/navigation with our own mockPush
const mockPush = jest.fn()
const mockReplace = jest.fn()
const mockPrefetch = jest.fn()
const mockBack = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: mockPrefetch,
    back: mockBack,
    pathname: '/',
    query: {},
    asPath: '/',
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockUseAuth.mockClear()
    mockPush.mockClear()
    mockReplace.mockClear()
    mockPrefetch.mockClear()
    mockBack.mockClear()
  })

  it('should show loading state when auth is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: true,
      login: jest.fn(),
      logout: jest.fn(),
    })

    render(
      <ProtectedRoute allowedRoles={['Pharmacist']}>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('should redirect to login when user is not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
    })

    render(
      <ProtectedRoute allowedRoles={['Pharmacist']}>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login')
    })

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('should redirect Pharmacist to /pharmacist when accessing Master-only route', async () => {
    mockUseAuth.mockReturnValue({
      user: {
        empId: 'PHARM001',
        name: 'Test Pharmacist',
        role: 'Pharmacist',
        status: 'Active',
      },
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
    })

    render(
      <ProtectedRoute allowedRoles={['Master']}>
        <div>Admin Content</div>
      </ProtectedRoute>
    )

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/pharmacist')
    })

    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
  })

  it('should redirect Nurse to /nurse when accessing Pharmacist-only route', async () => {
    mockUseAuth.mockReturnValue({
      user: {
        empId: 'NURSE001',
        name: 'Test Nurse',
        role: 'Nurse',
        status: 'Active',
      },
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
    })

    render(
      <ProtectedRoute allowedRoles={['Pharmacist']}>
        <div>Pharmacist Content</div>
      </ProtectedRoute>
    )

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/nurse')
    })

    expect(screen.queryByText('Pharmacist Content')).not.toBeInTheDocument()
  })

  it('should redirect Master to /admin when accessing Nurse-only route', async () => {
    mockUseAuth.mockReturnValue({
      user: {
        empId: 'MASTER001',
        name: 'Test Master',
        role: 'Master',
        status: 'Active',
      },
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
    })

    render(
      <ProtectedRoute allowedRoles={['Nurse']}>
        <div>Nurse Content</div>
      </ProtectedRoute>
    )

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin')
    })

    expect(screen.queryByText('Nurse Content')).not.toBeInTheDocument()
  })

  it('should render children when Pharmacist accesses Pharmacist route', () => {
    mockUseAuth.mockReturnValue({
      user: {
        empId: 'PHARM001',
        name: 'Test Pharmacist',
        role: 'Pharmacist',
        status: 'Active',
      },
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
    })

    render(
      <ProtectedRoute allowedRoles={['Pharmacist']}>
        <div>Pharmacist Dashboard</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Pharmacist Dashboard')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should render children when Nurse accesses Nurse route', () => {
    mockUseAuth.mockReturnValue({
      user: {
        empId: 'NURSE001',
        name: 'Test Nurse',
        role: 'Nurse',
        status: 'Active',
      },
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
    })

    render(
      <ProtectedRoute allowedRoles={['Nurse']}>
        <div>Nurse Dashboard</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Nurse Dashboard')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should render children when Master accesses Master route', () => {
    mockUseAuth.mockReturnValue({
      user: {
        empId: 'MASTER001',
        name: 'Test Master',
        role: 'Master',
        status: 'Active',
      },
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
    })

    render(
      <ProtectedRoute allowedRoles={['Master']}>
        <div>Admin Dashboard</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should allow multiple roles - Pharmacist accessing route with Pharmacist and Master', () => {
    mockUseAuth.mockReturnValue({
      user: {
        empId: 'PHARM001',
        name: 'Test Pharmacist',
        role: 'Pharmacist',
        status: 'Active',
      },
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
    })

    render(
      <ProtectedRoute allowedRoles={['Master', 'Pharmacist']}>
        <div>Shared Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Shared Content')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should allow multiple roles - Master accessing route with Pharmacist and Master', () => {
    mockUseAuth.mockReturnValue({
      user: {
        empId: 'MASTER001',
        name: 'Test Master',
        role: 'Master',
        status: 'Active',
      },
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
    })

    render(
      <ProtectedRoute allowedRoles={['Master', 'Pharmacist']}>
        <div>Shared Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Shared Content')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should allow all roles when all three roles are specified', () => {
    mockUseAuth.mockReturnValue({
      user: {
        empId: 'NURSE001',
        name: 'Test Nurse',
        role: 'Nurse',
        status: 'Active',
      },
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
    })

    render(
      <ProtectedRoute allowedRoles={['Master', 'Pharmacist', 'Nurse']}>
        <div>Public Authenticated Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Public Authenticated Content')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should show "Redirecting..." when user is not authorized', () => {
    mockUseAuth.mockReturnValue({
      user: {
        empId: 'NURSE001',
        name: 'Test Nurse',
        role: 'Nurse',
        status: 'Active',
      },
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
    })

    render(
      <ProtectedRoute allowedRoles={['Master']}>
        <div>Admin Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Redirecting...')).toBeInTheDocument()
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
  })

  it('should show loading spinner in loading state', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: true,
      login: jest.fn(),
      logout: jest.fn(),
    })

    const { container } = render(
      <ProtectedRoute allowedRoles={['Pharmacist']}>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    // Check for spinner (lucide-react renders as svg with animation class)
    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('should render complex children when authorized', () => {
    mockUseAuth.mockReturnValue({
      user: {
        empId: 'PHARM001',
        name: 'Test Pharmacist',
        role: 'Pharmacist',
        status: 'Active',
      },
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
    })

    render(
      <ProtectedRoute allowedRoles={['Pharmacist']}>
        <div>
          <h1>Dashboard</h1>
          <p>Welcome to the dashboard</p>
          <button>Click me</button>
        </div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Welcome to the dashboard')).toBeInTheDocument()
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('should not redirect when transitioning from loading to authorized', async () => {
    // Start with loading state
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: true,
      login: jest.fn(),
      logout: jest.fn(),
    })

    const { rerender } = render(
      <ProtectedRoute allowedRoles={['Pharmacist']}>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()

    // Update to authorized state
    mockUseAuth.mockReturnValue({
      user: {
        empId: 'PHARM001',
        name: 'Test Pharmacist',
        role: 'Pharmacist',
        status: 'Active',
      },
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
    })

    rerender(
      <ProtectedRoute allowedRoles={['Pharmacist']}>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })
})
