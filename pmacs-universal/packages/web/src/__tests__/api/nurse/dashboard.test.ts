/**
 * Tests for /api/nurse/dashboard endpoint
 */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/nurse/dashboard/route'

// Mock the database adapter
jest.mock('@pmacs/core', () => ({
  CSVDatabaseAdapter: jest.fn().mockImplementation(() => ({
    loadInventory: jest.fn(),
  })),
}))

describe('/api/nurse/dashboard', () => {
  let mockLoadInventory: jest.Mock

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks()
    const { CSVDatabaseAdapter } = require('@pmacs/core')
    const dbInstance = new CSVDatabaseAdapter()
    mockLoadInventory = dbInstance.loadInventory
  })

  it('should return correct stats structure', async () => {
    // Mock inventory data
    mockLoadInventory.mockResolvedValue([
      {
        drugId: 'TEST-001',
        drugName: 'Test Drug 1',
        location: 'Ward-1',
        qtyOnHand: 10,
        safetyStock: 20,
        expiryDate: '2025-12-31',
      },
      {
        drugId: 'TEST-002',
        drugName: 'Test Drug 2',
        location: 'Ward-2',
        qtyOnHand: 5,
        safetyStock: 10,
        expiryDate: '2025-02-15',
      },
    ])

    const request = new NextRequest('http://localhost:3000/api/nurse/dashboard')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('success', true)
    expect(data).toHaveProperty('stats')
    expect(data.stats).toHaveProperty('wardStock')
    expect(data.stats).toHaveProperty('expiringSoon')
    expect(data.stats).toHaveProperty('lowStock')
    expect(data.stats).toHaveProperty('locations')
  })

  it('should calculate wardStock correctly', async () => {
    mockLoadInventory.mockResolvedValue([
      { drugId: '1', drugName: 'Drug 1', location: 'Ward-1', qtyOnHand: 10, safetyStock: 5, expiryDate: '2025-12-31' },
      { drugId: '2', drugName: 'Drug 2', location: 'Ward-2', qtyOnHand: 20, safetyStock: 10, expiryDate: '2025-12-31' },
      { drugId: '3', drugName: 'Drug 3', location: 'ICU', qtyOnHand: 15, safetyStock: 8, expiryDate: '2025-12-31' },
    ])

    const request = new NextRequest('http://localhost:3000/api/nurse/dashboard')
    const response = await GET(request)
    const data = await response.json()

    expect(data.stats.wardStock).toBe(3) // Total number of items
  })

  it('should calculate lowStock correctly', async () => {
    const today = new Date()
    const futureDate = new Date(today)
    futureDate.setDate(futureDate.getDate() + 60) // 60 days from now

    mockLoadInventory.mockResolvedValue([
      { drugId: '1', drugName: 'Drug 1', location: 'Ward-1', qtyOnHand: 3, safetyStock: 10, expiryDate: futureDate.toISOString() }, // Low stock
      { drugId: '2', drugName: 'Drug 2', location: 'Ward-2', qtyOnHand: 15, safetyStock: 10, expiryDate: futureDate.toISOString() }, // Normal
      { drugId: '3', drugName: 'Drug 3', location: 'ICU', qtyOnHand: 5, safetyStock: 20, expiryDate: futureDate.toISOString() }, // Low stock
      { drugId: '4', drugName: 'Drug 4', location: 'ER', qtyOnHand: 0, safetyStock: 10, expiryDate: futureDate.toISOString() }, // Out of stock (not counted in lowStock)
    ])

    const request = new NextRequest('http://localhost:3000/api/nurse/dashboard')
    const response = await GET(request)
    const data = await response.json()

    expect(data.stats.lowStock).toBe(2) // Only items below safety stock but not zero
  })

  it('should calculate expiringSoon correctly', async () => {
    const today = new Date()

    // Drug expiring in 15 days (within 30 days)
    const expiring15Days = new Date(today)
    expiring15Days.setDate(expiring15Days.getDate() + 15)

    // Drug expiring in 45 days (outside 30 days)
    const expiring45Days = new Date(today)
    expiring45Days.setDate(expiring45Days.getDate() + 45)

    // Drug expiring in 5 days (within 30 days)
    const expiring5Days = new Date(today)
    expiring5Days.setDate(expiring5Days.getDate() + 5)

    mockLoadInventory.mockResolvedValue([
      { drugId: '1', drugName: 'Drug 1', location: 'Ward-1', qtyOnHand: 10, safetyStock: 5, expiryDate: expiring15Days.toISOString().split('T')[0] },
      { drugId: '2', drugName: 'Drug 2', location: 'Ward-2', qtyOnHand: 20, safetyStock: 10, expiryDate: expiring45Days.toISOString().split('T')[0] },
      { drugId: '3', drugName: 'Drug 3', location: 'ICU', qtyOnHand: 15, safetyStock: 8, expiryDate: expiring5Days.toISOString().split('T')[0] },
    ])

    const request = new NextRequest('http://localhost:3000/api/nurse/dashboard')
    const response = await GET(request)
    const data = await response.json()

    expect(data.stats.expiringSoon).toBe(2) // Only drugs expiring within 30 days
  })

  it('should calculate unique locations correctly', async () => {
    mockLoadInventory.mockResolvedValue([
      { drugId: '1', drugName: 'Drug 1', location: 'Ward-1', qtyOnHand: 10, safetyStock: 5, expiryDate: '2025-12-31' },
      { drugId: '2', drugName: 'Drug 2', location: 'Ward-1', qtyOnHand: 20, safetyStock: 10, expiryDate: '2025-12-31' }, // Same location
      { drugId: '3', drugName: 'Drug 3', location: 'ICU', qtyOnHand: 15, safetyStock: 8, expiryDate: '2025-12-31' },
      { drugId: '4', drugName: 'Drug 4', location: 'ER', qtyOnHand: 5, safetyStock: 3, expiryDate: '2025-12-31' },
    ])

    const request = new NextRequest('http://localhost:3000/api/nurse/dashboard')
    const response = await GET(request)
    const data = await response.json()

    expect(data.stats.locations).toBe(3) // Ward-1, ICU, ER = 3 unique locations
  })

  it('should handle empty inventory', async () => {
    mockLoadInventory.mockResolvedValue([])

    const request = new NextRequest('http://localhost:3000/api/nurse/dashboard')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.stats.wardStock).toBe(0)
    expect(data.stats.expiringSoon).toBe(0)
    expect(data.stats.lowStock).toBe(0)
    expect(data.stats.locations).toBe(0)
  })

  it('should handle database errors gracefully', async () => {
    mockLoadInventory.mockRejectedValue(new Error('Database connection failed'))

    const request = new NextRequest('http://localhost:3000/api/nurse/dashboard')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('Failed to fetch dashboard data')
  })
})
