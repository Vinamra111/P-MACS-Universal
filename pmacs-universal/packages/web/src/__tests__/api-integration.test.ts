/**
 * Integration Tests - Testing API endpoints via HTTP
 * These tests verify the actual API endpoints work correctly
 */

describe('API Integration Tests', () => {
  const BASE_URL = 'http://localhost:3007'

  describe('Nurse Dashboard API', () => {
    it('should return valid dashboard stats structure', async () => {
      const response = await fetch(`${BASE_URL}/api/nurse/dashboard`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('stats')

      // Verify all required fields exist
      expect(data.stats).toHaveProperty('wardStock')
      expect(data.stats).toHaveProperty('expiringSoon')
      expect(data.stats).toHaveProperty('lowStock')
      expect(data.stats).toHaveProperty('locations')

      // Verify types
      expect(typeof data.stats.wardStock).toBe('number')
      expect(typeof data.stats.expiringSoon).toBe('number')
      expect(typeof data.stats.lowStock).toBe('number')
      expect(typeof data.stats.locations).toBe('number')
    })

    it('should return valid alerts structure', async () => {
      const response = await fetch(`${BASE_URL}/api/nurse/alerts`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('alerts')
      expect(Array.isArray(data.alerts)).toBe(true)

      // If there are alerts, verify structure
      if (data.alerts.length > 0) {
        const alert = data.alerts[0]
        expect(alert).toHaveProperty('id')
        expect(alert).toHaveProperty('type')
        expect(alert).toHaveProperty('drug')
        expect(alert).toHaveProperty('location')
        expect(alert).toHaveProperty('severity')
        expect(alert).toHaveProperty('message')
      }
    })
  })

  describe('Pharmacist Dashboard API', () => {
    it('should return valid dashboard stats structure', async () => {
      const response = await fetch(`${BASE_URL}/api/dashboard`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('stats')

      // Verify all required fields exist
      expect(data.stats).toHaveProperty('totalItems')
      expect(data.stats).toHaveProperty('lowStock')
      expect(data.stats).toHaveProperty('expiringSoon')
      expect(data.stats).toHaveProperty('stockouts')
      expect(data.stats).toHaveProperty('criticalAlerts')

      // Verify types
      expect(typeof data.stats.totalItems).toBe('number')
      expect(typeof data.stats.lowStock).toBe('number')
      expect(typeof data.stats.expiringSoon).toBe('number')
      expect(typeof data.stats.stockouts).toBe('number')
      expect(typeof data.stats.criticalAlerts).toBe('number')
    })

    it('should return valid alerts structure', async () => {
      const response = await fetch(`${BASE_URL}/api/alerts`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('alerts')
      expect(Array.isArray(data.alerts)).toBe(true)
    })
  })

  describe('Data Consistency', () => {
    it('nurse and pharmacist should have consistent data counts', async () => {
      const [nurseRes, pharmacistRes] = await Promise.all([
        fetch(`${BASE_URL}/api/nurse/dashboard`),
        fetch(`${BASE_URL}/api/dashboard`)
      ])

      const nurseData = await nurseRes.json()
      const pharmacistData = await pharmacistRes.json()

      // Both should show same inventory count (wardStock vs totalItems)
      expect(nurseData.stats.wardStock).toBe(pharmacistData.stats.totalItems)

      // Both should show same expiring soon count
      expect(nurseData.stats.expiringSoon).toBe(pharmacistData.stats.expiringSoon)

      // Both should show same low stock count
      expect(nurseData.stats.lowStock).toBe(pharmacistData.stats.lowStock)
    })
  })
})
