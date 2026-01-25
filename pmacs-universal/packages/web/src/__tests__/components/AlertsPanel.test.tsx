/**
 * Tests for AlertsPanel component
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AlertsPanel from '@/components/AlertsPanel'

describe('AlertsPanel', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    ;(global.fetch as jest.Mock).mockClear()
  })

  it('should show loading state initially', () => {
    // Mock fetch to never resolve (simulate loading)
    ;(global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))

    render(<AlertsPanel />)

    // Should show spinner
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('should fetch alerts on mount', async () => {
    const mockAlerts = [
      {
        id: 'alert-1',
        type: 'stockout',
        drug: 'Paracetamol',
        location: 'Ward-1',
        severity: 'critical',
        message: 'OUT OF STOCK',
        quantity: 0,
      },
    ]

    ;(global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        success: true,
        alerts: mockAlerts,
        criticalCount: 1,
        warningCount: 0,
      }),
    })

    render(<AlertsPanel />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/alerts')
    })
  })

  it('should render alerts after loading', async () => {
    const mockAlerts = [
      {
        id: 'alert-1',
        type: 'stockout',
        drug: 'Paracetamol',
        location: 'Ward-1',
        severity: 'critical',
        message: 'OUT OF STOCK',
        quantity: 0,
      },
      {
        id: 'alert-2',
        type: 'expiring',
        drug: 'Ibuprofen',
        location: 'Ward-2',
        severity: 'warning',
        message: 'Expires in 15 days',
        daysUntilExpiry: 15,
      },
    ]

    ;(global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        success: true,
        alerts: mockAlerts,
        criticalCount: 1,
        warningCount: 1,
      }),
    })

    render(<AlertsPanel />)

    await waitFor(() => {
      expect(screen.getByText('Paracetamol')).toBeInTheDocument()
      expect(screen.getByText('Ibuprofen')).toBeInTheDocument()
    })

    expect(screen.getByText('Ward-1')).toBeInTheDocument()
    expect(screen.getByText('Ward-2')).toBeInTheDocument()
    expect(screen.getByText('OUT OF STOCK')).toBeInTheDocument()
    expect(screen.getByText('Expires in 15 days')).toBeInTheDocument()
  })

  it('should show empty state when no alerts', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        success: true,
        alerts: [],
        criticalCount: 0,
        warningCount: 0,
      }),
    })

    render(<AlertsPanel />)

    await waitFor(() => {
      expect(screen.getByText('No alerts in this category')).toBeInTheDocument()
    })
  })

  it('should render all three tabs', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        success: true,
        alerts: [],
        criticalCount: 5,
        warningCount: 3,
      }),
    })

    render(<AlertsPanel />)

    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument()
    })

    expect(screen.getByText('Critical')).toBeInTheDocument()
    expect(screen.getByText('Warning')).toBeInTheDocument()
  })

  it('should show counts in Critical and Warning tabs', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        success: true,
        alerts: [],
        criticalCount: 5,
        warningCount: 3,
      }),
    })

    render(<AlertsPanel />)

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument() // Critical count
    })

    expect(screen.getByText('3')).toBeInTheDocument() // Warning count
  })

  it('should filter alerts when Critical tab is clicked', async () => {
    const user = userEvent.setup()

    const mockAlerts = [
      {
        id: 'critical-1',
        type: 'stockout',
        drug: 'Critical Drug',
        location: 'Ward-1',
        severity: 'critical',
        message: 'Critical alert',
      },
      {
        id: 'warning-1',
        type: 'low-stock',
        drug: 'Warning Drug',
        location: 'Ward-2',
        severity: 'warning',
        message: 'Warning alert',
      },
    ]

    ;(global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        success: true,
        alerts: mockAlerts,
        criticalCount: 1,
        warningCount: 1,
      }),
    })

    render(<AlertsPanel />)

    // Wait for alerts to load
    await waitFor(() => {
      expect(screen.getByText('Critical Drug')).toBeInTheDocument()
    })

    // Both alerts should be visible initially
    expect(screen.getByText('Critical Drug')).toBeInTheDocument()
    expect(screen.getByText('Warning Drug')).toBeInTheDocument()

    // Click Critical tab
    const criticalTab = screen.getByText('Critical')
    await user.click(criticalTab)

    // Only critical alert should be visible
    expect(screen.getByText('Critical Drug')).toBeInTheDocument()
    expect(screen.queryByText('Warning Drug')).not.toBeInTheDocument()
  })

  it('should filter alerts when Warning tab is clicked', async () => {
    const user = userEvent.setup()

    const mockAlerts = [
      {
        id: 'critical-1',
        type: 'stockout',
        drug: 'Critical Drug',
        location: 'Ward-1',
        severity: 'critical',
        message: 'Critical alert',
      },
      {
        id: 'warning-1',
        type: 'low-stock',
        drug: 'Warning Drug',
        location: 'Ward-2',
        severity: 'warning',
        message: 'Warning alert',
      },
    ]

    ;(global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        success: true,
        alerts: mockAlerts,
        criticalCount: 1,
        warningCount: 1,
      }),
    })

    render(<AlertsPanel />)

    // Wait for alerts to load
    await waitFor(() => {
      expect(screen.getByText('Critical Drug')).toBeInTheDocument()
    })

    // Click Warning tab
    const warningTab = screen.getByText('Warning')
    await user.click(warningTab)

    // Only warning alert should be visible
    expect(screen.queryByText('Critical Drug')).not.toBeInTheDocument()
    expect(screen.getByText('Warning Drug')).toBeInTheDocument()
  })

  it('should show all alerts when All tab is clicked after filtering', async () => {
    const user = userEvent.setup()

    const mockAlerts = [
      {
        id: 'critical-1',
        type: 'stockout',
        drug: 'Critical Drug',
        location: 'Ward-1',
        severity: 'critical',
        message: 'Critical alert',
      },
      {
        id: 'warning-1',
        type: 'low-stock',
        drug: 'Warning Drug',
        location: 'Ward-2',
        severity: 'warning',
        message: 'Warning alert',
      },
    ]

    ;(global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        success: true,
        alerts: mockAlerts,
        criticalCount: 1,
        warningCount: 1,
      }),
    })

    render(<AlertsPanel />)

    // Wait for alerts to load
    await waitFor(() => {
      expect(screen.getByText('Critical Drug')).toBeInTheDocument()
    })

    // Click Critical tab
    const criticalTab = screen.getByText('Critical')
    await user.click(criticalTab)

    // Only critical should be visible
    expect(screen.queryByText('Warning Drug')).not.toBeInTheDocument()

    // Click All tab
    const allTab = screen.getByText('All')
    await user.click(allTab)

    // Both should be visible again
    expect(screen.getByText('Critical Drug')).toBeInTheDocument()
    expect(screen.getByText('Warning Drug')).toBeInTheDocument()
  })

  it('should render correct icons for different alert types', async () => {
    const mockAlerts = [
      {
        id: 'stockout-1',
        type: 'stockout',
        drug: 'Stockout Drug',
        location: 'Ward-1',
        severity: 'critical',
        message: 'Out of stock',
      },
      {
        id: 'expiring-1',
        type: 'expiring',
        drug: 'Expiring Drug',
        location: 'Ward-2',
        severity: 'warning',
        message: 'Expiring soon',
      },
      {
        id: 'low-stock-1',
        type: 'low-stock',
        drug: 'Low Stock Drug',
        location: 'Ward-3',
        severity: 'warning',
        message: 'Low stock',
      },
    ]

    ;(global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        success: true,
        alerts: mockAlerts,
        criticalCount: 1,
        warningCount: 2,
      }),
    })

    const { container } = render(<AlertsPanel />)

    await waitFor(() => {
      expect(screen.getByText('Stockout Drug')).toBeInTheDocument()
    })

    // All three types should render SVG icons
    const svgs = container.querySelectorAll('svg')
    expect(svgs.length).toBeGreaterThan(0)
  })

  it('should apply critical styling to critical alerts', async () => {
    const mockAlerts = [
      {
        id: 'critical-1',
        type: 'stockout',
        drug: 'Critical Drug',
        location: 'Ward-1',
        severity: 'critical',
        message: 'Critical alert',
      },
    ]

    ;(global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        success: true,
        alerts: mockAlerts,
        criticalCount: 1,
        warningCount: 0,
      }),
    })

    const { container } = render(<AlertsPanel />)

    await waitFor(() => {
      expect(screen.getByText('Critical Drug')).toBeInTheDocument()
    })

    // Check for critical severity badge
    const severityBadge = screen.getByText('critical')
    expect(severityBadge).toBeInTheDocument()

    // Check for critical styling classes
    const criticalBg = container.querySelector('.bg-danger-50')
    expect(criticalBg).toBeInTheDocument()
  })

  it('should apply warning styling to warning alerts', async () => {
    const mockAlerts = [
      {
        id: 'warning-1',
        type: 'low-stock',
        drug: 'Warning Drug',
        location: 'Ward-1',
        severity: 'warning',
        message: 'Warning alert',
      },
    ]

    ;(global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        success: true,
        alerts: mockAlerts,
        criticalCount: 0,
        warningCount: 1,
      }),
    })

    const { container } = render(<AlertsPanel />)

    await waitFor(() => {
      expect(screen.getByText('Warning Drug')).toBeInTheDocument()
    })

    // Check for warning severity badge
    const severityBadge = screen.getByText('warning')
    expect(severityBadge).toBeInTheDocument()

    // Check for warning styling classes
    const warningBg = container.querySelector('.bg-warning-50')
    expect(warningBg).toBeInTheDocument()
  })

  it('should render quantity when provided', async () => {
    const mockAlerts = [
      {
        id: 'alert-1',
        type: 'low-stock',
        drug: 'Test Drug',
        location: 'Ward-1',
        severity: 'warning',
        message: 'Low stock',
        quantity: 5,
      },
    ]

    ;(global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        success: true,
        alerts: mockAlerts,
        criticalCount: 0,
        warningCount: 1,
      }),
    })

    render(<AlertsPanel />)

    await waitFor(() => {
      expect(screen.getByText('Quantity: 5 units')).toBeInTheDocument()
    })
  })

  it('should handle fetch errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

    render(<AlertsPanel />)

    await waitFor(() => {
      // Loading should stop
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).not.toBeInTheDocument()
    })

    // Should show empty state since alerts array is still empty
    expect(screen.getByText('No alerts in this category')).toBeInTheDocument()

    // Should log error
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to fetch alerts:',
      expect.any(Error)
    )

    consoleErrorSpy.mockRestore()
  })

  it('should show empty state when filtering results in no matches', async () => {
    const user = userEvent.setup()

    const mockAlerts = [
      {
        id: 'critical-1',
        type: 'stockout',
        drug: 'Critical Drug',
        location: 'Ward-1',
        severity: 'critical',
        message: 'Critical alert',
      },
    ]

    ;(global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        success: true,
        alerts: mockAlerts,
        criticalCount: 1,
        warningCount: 0,
      }),
    })

    render(<AlertsPanel />)

    // Wait for alerts to load
    await waitFor(() => {
      expect(screen.getByText('Critical Drug')).toBeInTheDocument()
    })

    // Click Warning tab (no warning alerts exist)
    const warningTab = screen.getByText('Warning')
    await user.click(warningTab)

    // Should show empty state
    expect(screen.getByText('No alerts in this category')).toBeInTheDocument()
    expect(screen.queryByText('Critical Drug')).not.toBeInTheDocument()
  })
})
