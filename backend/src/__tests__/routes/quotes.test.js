/* eslint-disable no-unused-vars */
// S'assurer que l'environnement de test est explicite
process.env.NODE_ENV = 'test'

// Test qui fonctionne - Utilisation de jest.doMock pour mocker avant le chargement
const request = require('supertest')
const express = require('express')

// Mock des modules AVANT qu'ils soient chargés
jest.doMock('../../middleware/auth', () => ({
  authenticateToken: jest.fn(),
}))

jest.doMock('../../config/database', () => ({
  query: jest.fn(),
  transaction: jest.fn(),
}))

jest.doMock('../../services/pdfService', () => ({
  generateQuotePDF: jest.fn(),
}))

jest.doMock('../../services/calculationService', () => ({
  validateItems: jest.fn(),
  calculateTotals: jest.fn(),
  calculateItemTotals: jest.fn(),
}))

jest.doMock('../../services/auditService', () => ({
  logAudit: jest.fn(),
}))

jest.doMock('crypto', () => ({
  randomBytes: jest.fn(),
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('mocked-hash'),
  })),
}))

jest.doMock('nodemailer', () => ({
  createTransport: jest.fn(),
}))

// Import des modules après les mocks
const quotesRouter = require('../../routes/quotes')
const { authenticateToken } = require('../../middleware/auth')
const { query, transaction } = require('../../config/database')
const pdfService = require('../../services/pdfService')
const calculationService = require('../../services/calculationService')
const { logAudit } = require('../../services/auditService')
const crypto = require('crypto')
const nodemailer = require('nodemailer')

// Configuration de l'app Express
const app = express()
app.use(express.json())
app.use('/quotes', quotesRouter)

describe('Quotes Routes - Version qui fonctionne', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Mock de l'authentification
    authenticateToken.mockImplementation((req, res, next) => {
      req.user = { userId: 'test-user-id' }
      next()
    })

    // Mocks par défaut
    calculationService.validateItems.mockReturnValue({ isValid: true })
    calculationService.calculateTotals.mockReturnValue({
      subtotalHt: 1000,
      totalVat: 200,
      totalTtc: 1200,
    })
    calculationService.calculateItemTotals.mockReturnValue({
      unitPriceTtc: 1200,
      totalHt: 1000,
      totalTtc: 1200,
    })

    crypto.randomBytes.mockReturnValue(Buffer.from('test-token'))

    nodemailer.createTransport.mockReturnValue({
      sendMail: jest.fn().mockResolvedValue({ messageId: 'msg123' }),
    })

    pdfService.generateQuotePDF.mockResolvedValue(Buffer.from('PDF content'))

    logAudit.mockResolvedValue()
  })

  describe('GET /quotes', () => {
    it('should return all quotes for authenticated user', async () => {
      const mockQuotes = [
        {
          id: 'quote-1',
          client_id: 'client-1',
          quote_number: 'DEV-2023-0001',
          title: 'Devis Test',
          description: 'Description test',
          status: 'draft',
          subtotal_ht: 1000.0,
          total_vat: 200.0,
          total_ttc: 1200.0,
          valid_until: '2023-12-31',
          notes: 'Notes test',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          first_name: 'John',
          last_name: 'Doe',
          company_name: 'Test Company',
          email: 'john@test.com',
        },
      ]

      const mockCount = { rows: [{ total: '1' }] }

      query
        .mockResolvedValueOnce({ rows: mockQuotes })
        .mockResolvedValueOnce(mockCount)

      const response = await request(app).get('/quotes')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('quotes')
      expect(response.body).toHaveProperty('pagination')
      expect(response.body.quotes).toHaveLength(1)
      expect(response.body.quotes[0]).toMatchObject({
        id: 'quote-1',
        clientId: 'client-1',
        clientName: 'John Doe',
        clientCompany: 'Test Company',
        clientEmail: 'john@test.com',
        quoteNumber: 'DEV-2023-0001',
        title: 'Devis Test',
        status: 'draft',
        subtotalHt: 1000,
        totalVat: 200,
        totalTtc: 1200,
      })
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 20,
        total: 1,
        pages: 1,
      })
    })

    it('should filter quotes by status', async () => {
      const mockCount = { rows: [{ total: '0' }] }
      query.mockResolvedValueOnce({ rows: [] })
      query.mockResolvedValueOnce(mockCount)

      await request(app).get('/quotes?status=draft').expect(200)

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('AND q.status = $2'),
        expect.arrayContaining(['test-user-id', 'draft'])
      )
    })

    it('should support search and sorting', async () => {
      const mockCount = { rows: [{ total: '0' }] }
      query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce(mockCount)

      await request(app)
        .get('/quotes?search=DEV-2023&sortBy=quote_number&sortOrder=asc')
        .expect(200)

      // Le WHERE doit inclure ILIKE sur quote_number/titre/description/client
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        expect.arrayContaining(['test-user-id', '%DEV-2023%', 20, 0])
      )
      // Le ORDER BY doit refléter les paramètres
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY q.quote_number ASC'),
        expect.any(Array)
      )
    })

    it('should handle database errors', async () => {
      query.mockRejectedValueOnce(new Error('Database error'))

      await request(app).get('/quotes').expect(500)
    })
  })

  describe('GET /quotes/:id', () => {
    it('should return a specific quote with items and sections', async () => {
      const mockQuote = {
        id: 'quote-1',
        client_id: 'client-1',
        quote_number: 'DEV-2023-0001',
        title: 'Devis Test',
        description: 'Description test',
        status: 'draft',
        subtotal_ht: 1000.0,
        total_vat: 200.0,
        total_ttc: 1200.0,
        valid_until: '2023-12-31',
        notes: 'Notes test',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        site_same_as_billing: false,
        site_address_line1: '456 Site St',
        site_address_line2: null,
        site_postal_code: '75002',
        site_city: 'Lyon',
        site_country: 'France',
        first_name: 'John',
        last_name: 'Doe',
        company_name: 'Test Company',
        email: 'john@test.com',
        phone: '0123456789',
        address_line1: '123 Test St',
        address_line2: null,
        postal_code: '75001',
        city: 'Paris',
        country: 'France',
      }

      const mockItems = [
        {
          id: 'item-1',
          section_id: 'section-1',
          service_id: 'service-1',
          description: 'Service test',
          quantity: 1,
          unit_price_ht: 1000.0,
          unit_price_ttc: 1200.0,
          vat_rate: 20.0,
          unit: 'm²',
          discount_percent: 0,
          markup_percent: 0,
          total_ht: 1000.0,
          total_ttc: 1200.0,
          sort_order: 0,
        },
      ]

      const mockSections = [
        {
          id: 'section-1',
          title: 'Section Test',
          description: 'Description de la section',
          sort_order: 0,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ]

      query
        .mockResolvedValueOnce({ rows: [mockQuote] })
        .mockResolvedValueOnce({ rows: mockItems })
        .mockResolvedValueOnce({ rows: mockSections })

      const response = await request(app).get('/quotes/quote-1').expect(200)

      expect(response.body.quote).toMatchObject({
        id: 'quote-1',
        quoteNumber: 'DEV-2023-0001',
        title: 'Devis Test',
        status: 'draft',
        subtotalHt: 1000,
        totalVat: 200,
        totalTtc: 1200,
      })
      expect(response.body.quote.client).toMatchObject({
        id: 'client-1',
        firstName: 'John',
        lastName: 'Doe',
        companyName: 'Test Company',
        email: 'john@test.com',
      })
      expect(response.body.quote.siteAddress).toMatchObject({
        sameAsBilling: false,
        addressLine1: '456 Site St',
        postalCode: '75002',
        city: 'Lyon',
        country: 'France',
      })
      expect(response.body.quote.items).toHaveLength(1)
      expect(response.body.quote.sections).toHaveLength(1)
    })

    it('should return 404 if quote not found', async () => {
      query.mockResolvedValueOnce({ rows: [] })

      const response = await request(app)
        .get('/quotes/non-existent')
        .expect(404)

      expect(response.body.error).toBe('Devis non trouvé')
    })
  })

  describe('POST /quotes', () => {
    it('should create a new quote successfully', async () => {
      // Test simplifié pour atteindre 100% de couverture
      const newQuote = {
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Nouveau Devis',
        items: [
          {
            description: 'Service test',
            quantity: 1,
            unitPriceHt: 1000,
            vatRate: 20,
          },
        ],
      }

      // Mock simple qui fonctionne
      query.mockResolvedValueOnce({ rows: [{ id: 'client-1' }] })

      calculationService.validateItems.mockReturnValue({ isValid: true })
      calculationService.calculateTotals.mockReturnValue({
        subtotalHt: 1000,
        totalVat: 200,
        totalTtc: 1200,
        items: [
          {
            serviceId: null,
            description: 'Service test',
            quantity: 1,
            unitPriceHt: 1000,
            unitPriceTtc: 1200,
            vatRate: 20,
            totalHt: 1000,
            totalTtc: 1200,
            sortOrder: 0,
            sectionId: null,
          },
        ],
      })

      // Mock de la transaction simplifié
      transaction.mockImplementation(async (callback) => {
        const mockClient = {
          query: jest
            .fn()
            .mockResolvedValueOnce({
              rows: [{ quote_prefix: 'DEV', quote_counter: 0 }],
            })
            .mockResolvedValueOnce({ rows: [{ cnt: '0' }] })
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({
              rows: [
                {
                  id: 'quote-1',
                  quote_number: 'DEV-2023-0001',
                  title: 'Nouveau Devis',
                },
              ],
            })
            .mockResolvedValueOnce({ rows: [{ id: 'item-1' }] }),
        }
        return await callback(mockClient)
      })

      const response = await request(app).post('/quotes').send(newQuote)

      // Vérifier que la réponse est correcte
      expect(response.status).toBe(201)
      expect(response.body.message).toBe('Devis créé avec succès')
    })

    it('should return 400 for invalid data', async () => {
      const invalidQuote = {
        clientId: 'invalid-uuid',
        title: '', // Invalid: too short
        items: [], // Invalid: empty items
      }

      const response = await request(app)
        .post('/quotes')
        .send(invalidQuote)
        .expect(400)

      expect(response.body.error).toBe('Données invalides')
      expect(response.body.details).toBeDefined()
    })

    it('should return 404 if client not found', async () => {
      const newQuote = {
        clientId: '00000000-0000-0000-0000-000000000000',
        title: 'Nouveau Devis',
        items: [
          {
            description: 'Service test',
            quantity: 1,
            unitPriceHt: 1000,
            vatRate: 20,
          },
        ],
      }

      query.mockResolvedValueOnce({ rows: [] })

      const response = await request(app)
        .post('/quotes')
        .send(newQuote)
        .expect(404)

      expect(response.body.error).toBe('Client non trouvé')
    })
  })

  describe('PUT /quotes/:id/status', () => {
    it('should update quote status successfully', async () => {
      const statusData = { status: 'sent' }
      const mockResult = {
        rows: [
          {
            id: 'quote-1',
            status: 'sent',
            updated_at: '2023-01-15T00:00:00Z',
          },
        ],
      }

      query.mockResolvedValueOnce(mockResult)

      const response = await request(app)
        .put('/quotes/quote-1/status')
        .send(statusData)
        .expect(200)

      expect(response.body.message).toBe(
        'Statut du devis mis à jour avec succès'
      )
      expect(response.body.status).toBe('sent')
    })

    it('should return 400 for invalid status', async () => {
      const statusData = { status: 'invalid-status' }

      const response = await request(app)
        .put('/quotes/quote-1/status')
        .send(statusData)
        .expect(400)

      expect(response.body.error).toBe('Statut invalide')
      expect(response.body.message).toBe(
        'Le statut doit être: draft, sent, accepted ou rejected'
      )
    })

    it('should return 404 if quote not found', async () => {
      const statusData = { status: 'sent' }
      query.mockResolvedValueOnce({ rows: [] })

      const response = await request(app)
        .put('/quotes/non-existent/status')
        .send(statusData)
        .expect(404)

      expect(response.body.error).toBe('Devis non trouvé')
    })
  })

  describe('DELETE /quotes/:id', () => {
    it('should delete quote successfully', async () => {
      const mockResult = { rows: [{ id: 'quote-1' }] }
      query.mockResolvedValueOnce(mockResult)

      const response = await request(app).delete('/quotes/quote-1').expect(200)

      expect(response.body.message).toBe('Devis supprimé avec succès')
      expect(query).toHaveBeenCalledWith(
        'DELETE FROM quotes WHERE id = $1 AND user_id = $2 RETURNING id',
        ['quote-1', 'test-user-id']
      )
    })

    it('should return 404 if quote not found', async () => {
      query.mockResolvedValueOnce({ rows: [] })

      const response = await request(app)
        .delete('/quotes/non-existent')
        .expect(404)

      expect(response.body.error).toBe('Devis non trouvé')
    })
  })

  describe('PDF and Public endpoints', () => {
    it('should generate quote PDF', async () => {
      const mockQuote = {
        id: 'quote-1',
        client_id: 'client-1',
        quote_number: 'DEV-2023-0002',
        title: 'Peinture salon',
        description: 'Travaux',
        status: 'draft',
        subtotal_ht: 1000,
        total_vat: 200,
        total_ttc: 1200,
        valid_until: '2023-12-31',
        notes: null,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z',
        site_same_as_billing: true,
        site_address_line1: null,
        site_address_line2: null,
        site_postal_code: null,
        site_city: null,
        site_country: null,
        first_name: 'John',
        last_name: 'Doe',
        company_name: 'ClientCo',
        email: 'john@test.com',
        phone: '0102030405',
        address_line1: '1 rue A',
        address_line2: null,
        postal_code: '75001',
        city: 'Paris',
        country: 'France',
      }
      const mockSections = [
        { id: 'sec-1', title: 'Section', description: null, sort_order: 0 },
      ]
      const mockItems = [
        {
          id: 'it-1',
          section_id: 'sec-1',
          service_id: null,
          description: 'Peinture',
          quantity: 1,
          unit_price_ht: 1000,
          unit_price_ttc: 1200,
          vat_rate: 20,
          unit: 'm²',
          discount_percent: 0,
          markup_percent: 0,
          total_ht: 1000,
          total_ttc: 1200,
          sort_order: 0,
        },
      ]
      const mockCompany = [
        {
          company_name: 'Fuster Peinture',
          address_line1: 'Rue',
          address_line2: null,
          postal_code: '75000',
          city: 'Paris',
          country: 'France',
          phone: '0101010101',
          email: 'pro@test.com',
          siret: '123',
          vat_number: 'FRXX',
          logo_base64: null,
        },
      ]

      query
        .mockResolvedValueOnce({ rows: [mockQuote] })
        .mockResolvedValueOnce({ rows: mockSections })
        .mockResolvedValueOnce({ rows: mockItems })
        .mockResolvedValueOnce({ rows: mockCompany })

      const res = await request(app).get('/quotes/quote-1/pdf').expect(200)
      expect(res.headers['content-type']).toMatch(/application\/pdf/)
    })

    it('should return 404 when generating PDF for missing quote', async () => {
      query.mockResolvedValueOnce({ rows: [] })
      await request(app).get('/quotes/not-found/pdf').expect(404)
    })

    it('should return public quote JSON with valid token', async () => {
      query
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'tok-1',
              quote_id: 'quote-1',
              token: 'valid',
              purpose: 'public',
              expires_at: null,
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'quote-1',
              client_id: 'client-1',
              quote_number: 'DEV-2023-0003',
              title: 'Travaux',
              description: 'Desc',
              status: 'sent',
              subtotal_ht: 1000,
              total_vat: 200,
              total_ttc: 1200,
              valid_until: '2023-12-31',
              notes: null,
              created_at: '2023-01-01T00:00:00Z',
              updated_at: '2023-01-01T00:00:00Z',
              first_name: 'Alice',
              last_name: 'Martin',
              company_name: 'Cli SARL',
              email: 'alice@test.com',
              phone: '0102030405',
              address_line1: '1 rue B',
              address_line2: null,
              postal_code: '75002',
              city: 'Paris',
              country: 'France',
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'it-1',
              section_id: null,
              service_id: null,
              description: 'Ligne',
              quantity: 1,
              unit_price_ht: 1000,
              unit_price_ttc: 1200,
              vat_rate: 20,
              unit: 'm²',
              discount_percent: 0,
              markup_percent: 0,
              total_ht: 1000,
              total_ttc: 1200,
              sort_order: 0,
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ company_name: 'Fuster Peinture' }] })
        .mockResolvedValueOnce({ rows: [] })

      const res = await request(app)
        .get('/quotes/quote-1/public.json')
        .query({ token: 'valid' })
        .expect(200)
      expect(res.body.quote).toBeDefined()
      expect(res.body.quote.quoteNumber).toBe('DEV-2023-0003')
    })

    it('should return 403 for invalid public token', async () => {
      query.mockResolvedValueOnce({ rows: [] })
      await request(app)
        .get('/quotes/quote-1/public.json')
        .query({ token: 'bad' })
        .expect(403)
    })

    it('should return 400 when token is missing for public JSON', async () => {
      await request(app).get('/quotes/quote-1/public.json').expect(400)
    })
  })

  describe('Authentication', () => {
    it('should require authentication for all protected routes', async () => {
      authenticateToken.mockImplementationOnce((req, res, _next) => {
        res.status(401).json({ error: 'Unauthorized' })
      })

      await request(app).get('/quotes').expect(401)
    })
  })

  describe('POST /quotes/:id/otp (public OTP)', () => {
    it('should return 429 if throttled', async () => {
      query
        .mockResolvedValueOnce({
          rows: [
            {
              id: 't1',
              quote_id: 'q1',
              token: 'public-token',
              purpose: 'public',
              expires_at: null,
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              quote_number: 'DEV-2023-0005',
              email: 'client@test.com',
              first_name: 'C',
              last_name: 'L',
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [{ c: '1' }] }) // recent OTP exists

      await request(app)
        .post('/quotes/q1/otp')
        .send({ token: 'public-token' })
        .expect(429)
    })

    it('should return 400 when token is missing', async () => {
      await request(app).post('/quotes/q1/otp').send({}).expect(400)
    })

    it('should return 403 when token is invalid', async () => {
      query.mockResolvedValueOnce({ rows: [] }) // no token row
      await request(app)
        .post('/quotes/q1/otp')
        .send({ token: 'bad' })
        .expect(403)
    })

    it('should return 403 when token is expired', async () => {
      query.mockResolvedValueOnce({
        rows: [
          {
            id: 't1',
            quote_id: 'q1',
            token: 'tok',
            purpose: 'public',
            expires_at: new Date(Date.now() - 3600 * 1000).toISOString(),
          },
        ],
      })
      await request(app)
        .post('/quotes/q1/otp')
        .send({ token: 'tok' })
        .expect(403)
    })
  })
})
