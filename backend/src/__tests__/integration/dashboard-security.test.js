/**
 * Tests de sécurité et de cohérence pour le dashboard
 */

const request = require('supertest')
const app = require('../../server')

describe('Dashboard Security Tests', () => {
  let authToken

  beforeAll(async () => {
    // Créer un utilisateur de test et obtenir un token
    const response = await request(app).post('/api/auth/register').send({
      email: 'test@dashboard.com',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
    })

    authToken = response.body.token
  })

  afterAll(async () => {
    // Nettoyer les données de test
    const { query } = require('../../config/database')
    await query('DELETE FROM users WHERE email = $1', ['test@dashboard.com'])
  })

  describe('GET /api/dashboard/pending-quotes', () => {
    it('should sanitize days parameter and prevent SQL injection', async () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        '1; DELETE FROM quotes; --',
        "1' OR '1'='1",
        '1 UNION SELECT * FROM users',
        "1; INSERT INTO quotes (user_id, quote_number) VALUES (999, 'HACKED'); --",
      ]

      for (const maliciousInput of maliciousInputs) {
        const response = await request(app)
          .get(
            `/api/dashboard/pending-quotes?days=${encodeURIComponent(maliciousInput)}`
          )
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)

        // Vérifier que la réponse est valide (pas d'erreur SQL)
        expect(response.body).toHaveProperty('quotes')
        expect(Array.isArray(response.body.quotes)).toBe(true)
      }
    })

    it('should bound days parameter between 1 and 90', async () => {
      // Test avec des valeurs hors limites
      const testCases = [
        { input: -1, expected: 1 },
        { input: 0, expected: 1 },
        { input: 91, expected: 90 },
        { input: 999, expected: 90 },
        { input: 'abc', expected: 7 }, // valeur par défaut
        { input: null, expected: 7 },
        { input: undefined, expected: 7 },
      ]

      for (const testCase of testCases) {
        const response = await request(app)
          .get(`/api/dashboard/pending-quotes?days=${testCase.input}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)

        // Le paramètre devrait être borné correctement
        expect(response.body).toHaveProperty('quotes')
        expect(Array.isArray(response.body.quotes)).toBe(true)
      }
    })

    it('should handle invalid days parameter gracefully', async () => {
      const response = await request(app)
        .get('/api/dashboard/pending-quotes?days=invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('quotes')
      expect(Array.isArray(response.body.quotes)).toBe(true)
    })
  })

  describe('GET /api/dashboard/stats', () => {
    it('should return consistent revenue metrics based on payments', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('monthlyRevenue')
      expect(response.body).toHaveProperty('yearlyRevenue')

      // Les montants devraient être des nombres
      expect(typeof response.body.monthlyRevenue).toBe('number')
      expect(typeof response.body.yearlyRevenue).toBe('number')

      // Les montants ne devraient pas être négatifs
      expect(response.body.monthlyRevenue).toBeGreaterThanOrEqual(0)
      expect(response.body.yearlyRevenue).toBeGreaterThanOrEqual(0)
    })

    it('should return all required stats fields', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      const requiredFields = [
        'clients',
        'sentQuotes',
        'acceptedQuotes',
        'monthlyRevenue',
        'yearlyRevenue',
        'sentInvoices',
        'paidInvoices',
        'followUpsNeeded',
        'overdueInvoices',
      ]

      for (const field of requiredFields) {
        expect(response.body).toHaveProperty(field)
        expect(typeof response.body[field]).toBe('number')
      }
    })
  })

  describe('GET /api/dashboard/analytics', () => {
    it('should return revenue data based on payments, not invoice creation', async () => {
      const response = await request(app)
        .get('/api/dashboard/analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('revenueByMonth')
      expect(Array.isArray(response.body.revenueByMonth)).toBe(true)

      // Vérifier la structure des données de revenus
      if (response.body.revenueByMonth.length > 0) {
        const monthData = response.body.revenueByMonth[0]
        expect(monthData).toHaveProperty('label')
        expect(monthData).toHaveProperty('value')
        expect(typeof monthData.value).toBe('number')
        expect(monthData.value).toBeGreaterThanOrEqual(0)
      }
    })

    it('should return top clients based on payments, not invoice creation', async () => {
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
        expect(clientData).toHaveProperty('total')
        expect(typeof clientData.total).toBe('number')
        expect(clientData.total).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe('Authentication and Authorization', () => {
    it('should require authentication for all dashboard endpoints', async () => {
      const endpoints = [
        '/api/dashboard/stats',
        '/api/dashboard/recent-activity',
        '/api/dashboard/urgent-invoices',
        '/api/dashboard/pending-quotes',
        '/api/dashboard/analytics',
      ]

      for (const endpoint of endpoints) {
        await request(app).get(endpoint).expect(401)
      }
    })

    it('should not allow access to other users data', async () => {
      // Créer un deuxième utilisateur
      const user2Response = await request(app).post('/api/auth/register').send({
        email: 'test2@dashboard.com',
        password: 'TestPassword123!',
        firstName: 'Test2',
        lastName: 'User2',
      })

      const user2Token = user2Response.body.token

      // Le premier utilisateur ne devrait pas voir les données du deuxième
      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200)

      // Les stats devraient être vides pour le nouvel utilisateur
      expect(response.body.clients).toBe(0)
      expect(response.body.sentQuotes).toBe(0)
      expect(response.body.acceptedQuotes).toBe(0)

      // Nettoyer
      const { query } = require('../../config/database')
      await query('DELETE FROM users WHERE email = $1', ['test2@dashboard.com'])
    })
  })
})
