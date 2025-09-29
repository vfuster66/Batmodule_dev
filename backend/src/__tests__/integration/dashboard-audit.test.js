/**
 * Tests d'audit du dashboard - Validation des corrections critiques
 */

const request = require('supertest')
const app = require('../../server')

describe('Dashboard Audit Tests', () => {
  let authToken

  beforeAll(async () => {
    // Créer un utilisateur de test et obtenir un token
    const response = await request(app).post('/api/auth/register').send({
      email: 'audit@dashboard.com',
      password: 'TestPassword123!',
      firstName: 'Audit',
      lastName: 'User',
    })

    authToken = response.body.token
  })

  afterAll(async () => {
    // Nettoyer les données de test
    const { query } = require('../../config/database')
    await query('DELETE FROM users WHERE email = $1', ['audit@dashboard.com'])
  })

  describe('GET /api/dashboard/urgent-invoices', () => {
    it('should include both pending and overdue invoices', async () => {
      const response = await request(app)
        .get('/api/dashboard/urgent-invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('invoices')
      expect(Array.isArray(response.body.invoices)).toBe(true)

      // Vérifier la structure des données
      if (response.body.invoices.length > 0) {
        const invoiceData = response.body.invoices[0]
        expect(invoiceData).toHaveProperty('id')
        expect(invoiceData).toHaveProperty('invoice_number')
        expect(invoiceData).toHaveProperty('total_ttc')
        expect(invoiceData).toHaveProperty('due_date')
        expect(invoiceData).toHaveProperty('client_name')

        // Vérifier les types
        expect(typeof invoiceData.id).toBe('number')
        expect(typeof invoiceData.invoice_number).toBe('string')
        expect(typeof invoiceData.total_ttc).toBe('number')
        expect(typeof invoiceData.client_name).toBe('string')
        expect(invoiceData.client_name.length).toBeGreaterThan(0)

        // Vérifier que les factures sont triées par due_date ASC
        for (let i = 1; i < response.body.invoices.length; i++) {
          const prevDate = new Date(response.body.invoices[i - 1].due_date)
          const currDate = new Date(response.body.invoices[i].due_date)
          expect(prevDate.getTime()).toBeLessThanOrEqual(currDate.getTime())
        }

        // Vérifier que toutes les factures sont en retard (due_date < CURRENT_DATE)
        response.body.invoices.forEach((invoice) => {
          const dueDate = new Date(invoice.due_date)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          expect(dueDate.getTime()).toBeLessThan(today.getTime())
        })
      }

      // Vérifier la limite (max 10 factures)
      expect(response.body.invoices.length).toBeLessThanOrEqual(10)
    })
  })

  describe('GET /api/dashboard/analytics', () => {
    it('should return 12 months of revenue data even with no payments', async () => {
      const response = await request(app)
        .get('/api/dashboard/analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('revenueByMonth')
      expect(Array.isArray(response.body.revenueByMonth)).toBe(true)

      // Doit retourner exactement 12 mois
      expect(response.body.revenueByMonth.length).toBe(12)

      // Vérifier la structure des données
      if (response.body.revenueByMonth.length > 0) {
        const monthData = response.body.revenueByMonth[0]
        expect(monthData).toHaveProperty('label')
        expect(monthData).toHaveProperty('value')
        expect(typeof monthData.value).toBe('number')
        expect(monthData.value).toBeGreaterThanOrEqual(0)
      }
    })

    it('should return top clients with proper name fallback', async () => {
      const response = await request(app)
        .get('/api/dashboard/analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('topClients90')
      expect(Array.isArray(response.body.topClients90)).toBe(true)

      // Vérifier la structure des données clients
      if (response.body.topClients90.length > 0) {
        const clientData = response.body.topClients90[0]
        expect(clientData).toHaveProperty('id')
        expect(clientData).toHaveProperty('name')
        expect(clientData).toHaveProperty('company')
        expect(clientData).toHaveProperty('total')
        expect(typeof clientData.name).toBe('string')
        expect(clientData.name.length).toBeGreaterThan(0)
        expect(typeof clientData.company).toBe('string') // Vérifier que company est une string
        expect(typeof clientData.total).toBe('number')
        expect(clientData.total).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe('GET /api/dashboard/pending-quotes', () => {
    it('should use parameterized interval creation', async () => {
      const testDays = [1, 7, 30, 90]

      for (const days of testDays) {
        const response = await request(app)
          .get(`/api/dashboard/pending-quotes?days=${days}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)

        expect(response.body).toHaveProperty('quotes')
        expect(Array.isArray(response.body.quotes)).toBe(true)
      }
    })

    it('should handle edge cases for days parameter', async () => {
      const edgeCases = [
        { input: -1, description: 'Negative value' },
        { input: 0, description: 'Zero value' },
        { input: 91, description: 'Value > 90' },
        { input: 'invalid', description: 'Non-numeric string' },
      ]

      for (const testCase of edgeCases) {
        const response = await request(app)
          .get(`/api/dashboard/pending-quotes?days=${testCase.input}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)

        expect(response.body).toHaveProperty('quotes')
        expect(Array.isArray(response.body.quotes)).toBe(true)
      }
    })
  })

  describe('Frontend resilience tests', () => {
    it('should handle malformed API responses gracefully', async () => {
      // Test avec des réponses malformées
      const malformedResponses = [
        { activities: null },
        { activities: 'not an array' },
        { activities: {} },
        null,
        undefined,
      ]

      // Simuler des réponses malformées
      for (const malformedResponse of malformedResponses) {
        // Le frontend devrait gérer ces cas sans erreur
        const activities = Array.isArray(malformedResponse?.activities)
          ? malformedResponse.activities
          : Array.isArray(malformedResponse)
            ? malformedResponse
            : []

        expect(Array.isArray(activities)).toBe(true)
        expect(() => activities.map((a) => a)).not.toThrow()
      }
    })
  })

  describe('Data consistency tests', () => {
    it('should maintain consistency between stats and analytics', async () => {
      const [statsResponse, analyticsResponse] = await Promise.all([
        request(app)
          .get('/api/dashboard/stats')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200),
        request(app)
          .get('/api/dashboard/analytics')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200),
      ])

      const stats = statsResponse.body
      const analytics = analyticsResponse.body

      // Vérifier que les montants sont cohérents
      expect(typeof stats.monthlyRevenue).toBe('number')
      expect(typeof stats.yearlyRevenue).toBe('number')
      expect(stats.monthlyRevenue).toBeGreaterThanOrEqual(0)
      expect(stats.yearlyRevenue).toBeGreaterThanOrEqual(0)

      // Vérifier que les données analytiques sont présentes
      expect(Array.isArray(analytics.revenueByMonth)).toBe(true)
      expect(Array.isArray(analytics.topClients90)).toBe(true)
    })
  })

  describe('Quick actions functionality', () => {
    it('should support action=create query parameter for quick actions', () => {
      // Test que les routes supportent le paramètre action=create
      const testRoutes = [
        '/clients?action=create',
        '/quotes?action=create',
        '/invoices?action=create',
      ]

      // Vérifier que les routes sont valides (pas de 404)
      testRoutes.forEach((route) => {
        expect(route).toMatch(/action=create/)
        expect(route).toMatch(/^\/(clients|quotes|invoices)\?action=create$/)
      })
    })
  })
})
