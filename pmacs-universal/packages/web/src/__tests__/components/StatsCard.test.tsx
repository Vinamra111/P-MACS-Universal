/**
 * Tests for StatsCard component
 */

import { render, screen } from '@testing-library/react'
import StatsCard from '@/components/StatsCard'
import { Package } from 'lucide-react'

describe('StatsCard', () => {
  it('should render title and value', () => {
    render(
      <StatsCard
        title="Total Items"
        value="199"
        icon={Package}
        color="blue"
      />
    )

    expect(screen.getByText('Total Items')).toBeInTheDocument()
    expect(screen.getByText('199')).toBeInTheDocument()
  })

  it('should render icon', () => {
    const { container } = render(
      <StatsCard
        title="Total Items"
        value="199"
        icon={Package}
        color="blue"
      />
    )

    // Icon should be rendered (lucide-react renders as svg)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('should apply correct color classes for blue', () => {
    const { container } = render(
      <StatsCard
        title="Total Items"
        value="199"
        icon={Package}
        color="blue"
      />
    )

    // Check if blue color classes are applied
    const iconContainer = container.querySelector('.bg-blue-50')
    expect(iconContainer).toBeInTheDocument()
  })

  it('should apply correct color classes for red', () => {
    const { container } = render(
      <StatsCard
        title="Critical Alerts"
        value="5"
        icon={Package}
        color="red"
      />
    )

    const iconContainer = container.querySelector('.bg-red-50')
    expect(iconContainer).toBeInTheDocument()
  })

  it('should apply correct color classes for yellow', () => {
    const { container } = render(
      <StatsCard
        title="Warnings"
        value="3"
        icon={Package}
        color="yellow"
      />
    )

    const iconContainer = container.querySelector('.bg-yellow-50')
    expect(iconContainer).toBeInTheDocument()
  })

  it('should apply correct color classes for green', () => {
    const { container } = render(
      <StatsCard
        title="Good Stock"
        value="150"
        icon={Package}
        color="green"
      />
    )

    const iconContainer = container.querySelector('.bg-green-50')
    expect(iconContainer).toBeInTheDocument()
  })

  it('should render with different values', () => {
    const { rerender } = render(
      <StatsCard
        title="Stock Count"
        value="100"
        icon={Package}
        color="blue"
      />
    )

    expect(screen.getByText('100')).toBeInTheDocument()

    // Rerender with different value
    rerender(
      <StatsCard
        title="Stock Count"
        value="200"
        icon={Package}
        color="blue"
      />
    )

    expect(screen.getByText('200')).toBeInTheDocument()
    expect(screen.queryByText('100')).not.toBeInTheDocument()
  })

  it('should handle zero values', () => {
    render(
      <StatsCard
        title="Stockouts"
        value="0"
        icon={Package}
        color="red"
      />
    )

    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('should handle large values', () => {
    render(
      <StatsCard
        title="Total Value"
        value="1,234,567"
        icon={Package}
        color="blue"
      />
    )

    expect(screen.getByText('1,234,567')).toBeInTheDocument()
  })
})
