const request = require('supertest')
const express = require('express')
const clientsRouter = require('../../routes/clients')
const { authenticateToken } = require('../../middleware/auth')
const { query } = require('../../config/database')

// Mock des dépendances
jest.mock('../../middleware/auth')
jest.mock('../../config/database')

const app = express()
app.use(express.json())
app.use('/clients', clientsRouter)

describe('Clients Routes', () => {
  let mockQuery

  beforeEach(() => {
    mockQuery = jest.fn()
    query.mockImplementation(mockQuery)
    authenticateToken.mockImplementation((req, res, next) => {
      req.user = { userId: 'test-user-id' }
      next()
    })
    jest.clearAllMocks()
  })

  describe('GET /clients', () => {
    it('should return all clients for authenticated user', async () => {
      const mockClients = [
        {
          id: 'client-1',
          first_name: 'John',
          last_name: 'Doe',
          company_name: 'Test Company',
          email: 'john@test.com',
          phone: '0123456789',
          address_line1: '123 Test St',
          postal_code: '75001',
          city: 'Paris',
          country: 'France',
          is_company: true,
          siret: '12345678901234',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ]

      const mockCount = { rows: [{ total: '1' }] }
      mockQuery.mockResolvedValueOnce({ rows: mockClients })
      mockQuery.mockResolvedValueOnce(mockCount)

      const response = await request(app).get('/clients').expect(200)

      expect(response.body.clients).toHaveLength(1)
      expect(response.body.clients[0]).toMatchObject({
        id: 'client-1',
        firstName: 'John',
        lastName: 'Doe',
        companyName: 'Test Company',
        email: 'john@test.com',
        phone: '0123456789',
        addressLine1: '123 Test St',
        postalCode: '75001',
        city: 'Paris',
        country: 'France',
        isCompany: true,
        siret: '12345678901234',
      })
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 20,
        total: 1,
        pages: 1,
      })
    })

    it('should handle search query', async () => {
      const mockCount = { rows: [{ total: '0' }] }
      mockQuery.mockResolvedValueOnce({ rows: [] })
      mockQuery.mockResolvedValueOnce(mockCount)

      await request(app).get('/clients?search=John').expect(200)

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        expect.arrayContaining(['test-user-id', '%John%'])
      )
    })

    it('should support sorting and return counts', async () => {
      const mockClients = [
        {
          id: 'client-1',
          first_name: 'Alice',
          last_name: 'Zephyr',
          company_name: 'ACME',
          email: 'alice@test.com',
          phone: '0102030405',
          address_line1: '1 rue A',
          address_line2: null,
          postal_code: '75001',
          city: 'Paris',
          country: 'France',
          notes: null,
          is_company: true,
          siret: '12345678901234',
          vat_number: null,
          legal_form: null,
          rcs_number: null,
          ape_code: null,
          capital_social: null,
          quotes_count: '3',
          invoices_count: '2',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ]
      const mockCount = { rows: [{ total: '1' }] }

      mockQuery
        .mockResolvedValueOnce({ rows: mockClients })
        .mockResolvedValueOnce(mockCount)

      const res = await request(app)
        .get('/clients?sortBy=created_at&sortOrder=desc&page=1&limit=20')
        .expect(200)

      // Vérifie que le tri est appliqué dans la requête SQL
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY created_at DESC'),
        expect.arrayContaining(['test-user-id', '20', 0])
      )

      // Vérifie le mapping des compteurs
      expect(res.body.clients[0].quotesCount).toBe(3)
      expect(res.body.clients[0].invoicesCount).toBe(2)
    })

    it('should handle pagination', async () => {
      const mockCount = { rows: [{ total: '0' }] }
      mockQuery.mockResolvedValueOnce({ rows: [] })
      mockQuery.mockResolvedValueOnce(mockCount)

      await request(app).get('/clients?page=2&limit=10').expect(200)

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT $2 OFFSET $3'),
        expect.arrayContaining(['test-user-id', '10', 10])
      )
    })

    it('should handle database errors', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'))

      await request(app).get('/clients').expect(500)
    })
  })

  describe('GET /clients/export', () => {
    it('should export clients as CSV', async () => {
      const mockClients = [
        {
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
          is_company: true,
          siret: '12345678901234',
          vat_number: 'FR12345678901',
          legal_form: 'SARL',
          rcs_number: 'RCS123456',
          ape_code: '4321A',
          capital_social: 10000,
          notes: 'Test notes',
        },
      ]

      mockQuery.mockResolvedValueOnce({ rows: mockClients })

      const response = await request(app).get('/clients/export').expect(200)

      expect(response.headers['content-type']).toContain('text/csv')
      expect(response.headers['content-disposition']).toContain('attachment')
      expect(response.text).toContain('"John","Doe","Test Company"')
      expect(response.text).toContain('Oui') // is_company = true
    })

    it('should handle empty clients list', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] })

      const response = await request(app).get('/clients/export').expect(200)

      expect(response.headers['content-type']).toContain('text/csv')
      expect(response.text).toContain('Prénom,Nom,Entreprise')
    })

    it('should handle database errors during export', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'))

      await request(app).get('/clients/export').expect(500)
    })
  })

  describe('GET /clients/:id', () => {
    it('should return a specific client', async () => {
      const mockClient = {
        id: 'client-1',
        first_name: 'John',
        last_name: 'Doe',
        company_name: 'Test Company',
        email: 'john@test.com',
        phone: '0123456789',
        address_line1: '123 Test St',
        postal_code: '75001',
        city: 'Paris',
        country: 'France',
        is_company: true,
        siret: '12345678901234',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      }

      mockQuery.mockResolvedValueOnce({ rows: [mockClient] })

      const response = await request(app).get('/clients/client-1').expect(200)

      expect(response.body.client).toMatchObject({
        id: 'client-1',
        firstName: 'John',
        lastName: 'Doe',
        companyName: 'Test Company',
      })
    })

    it('should return 404 if client not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] })

      await request(app).get('/clients/non-existent').expect(404)
    })

    it('should return 500 for invalid UUID (database error)', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Invalid UUID format'))

      await request(app).get('/clients/invalid-uuid').expect(500)
    })
  })

  describe('POST /clients', () => {
    it('should create a new client', async () => {
      const newClient = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@test.com',
        phone: '0987654321',
        addressLine1: '456 Test Ave',
        postalCode: '75002',
        city: 'Lyon',
        country: 'France',
        isCompany: false,
      }

      const mockCreatedClient = {
        id: 'client-2',
        first_name: 'Jane',
        last_name: 'Smith',
        company_name: null,
        email: 'jane@test.com',
        phone: '0987654321',
        address_line1: '456 Test Ave',
        address_line2: null,
        postal_code: '75002',
        city: 'Lyon',
        country: 'France',
        notes: null,
        is_company: false,
        siret: null,
        vat_number: null,
        legal_form: null,
        rcs_number: null,
        ape_code: null,
        capital_social: null,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      }

      mockQuery.mockResolvedValueOnce({ rows: [mockCreatedClient] })

      const response = await request(app)
        .post('/clients')
        .send(newClient)
        .expect(201)

      expect(response.body.client).toMatchObject({
        id: 'client-2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@test.com',
        phone: '0987654321',
        addressLine1: '456 Test Ave',
        postalCode: '75002',
        city: 'Lyon',
        country: 'France',
        isCompany: false,
      })
    })

    it('should create a company client with legal fields', async () => {
      const companyClient = {
        firstName: 'Company',
        lastName: 'Owner',
        companyName: 'Test Company Ltd',
        email: 'contact@testcompany.com',
        phone: '0123456789',
        addressLine1: '789 Business St',
        postalCode: '75003',
        city: 'Marseille',
        country: 'France',
        isCompany: true,
        siret: '98765432109876',
        vatNumber: 'FR12345678901',
        legalForm: 'SARL',
        rcsNumber: 'RCS123456',
        apeCode: '4321A',
        capitalSocial: 10000,
      }

      const mockCreatedClient = {
        id: 'client-3',
        first_name: 'Company',
        last_name: 'Owner',
        company_name: 'Test Company Ltd',
        email: 'contact@testcompany.com',
        phone: '0123456789',
        address_line1: '789 Business St',
        address_line2: null,
        postal_code: '75003',
        city: 'Marseille',
        country: 'France',
        notes: null,
        is_company: true,
        siret: '98765432109876',
        vat_number: 'FR12345678901',
        legal_form: 'SARL',
        rcs_number: 'RCS123456',
        ape_code: '4321A',
        capital_social: 10000,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      }

      mockQuery.mockResolvedValueOnce({ rows: [mockCreatedClient] })

      const response = await request(app)
        .post('/clients')
        .send(companyClient)
        .expect(201)

      expect(response.body.client).toMatchObject({
        id: 'client-3',
        firstName: 'Company',
        lastName: 'Owner',
        companyName: 'Test Company Ltd',
        siret: '98765432109876',
        vatNumber: 'FR12345678901',
        legalForm: 'SARL',
        capitalSocial: 10000,
      })
    })

    it('should return 400 for invalid data', async () => {
      const invalidClient = {
        firstName: '', // Invalid: too short
        lastName: 'Smith',
        email: 'invalid-email', // Invalid email format
      }

      await request(app).post('/clients').send(invalidClient).expect(400)
    })

    it('should return 400 for missing required fields', async () => {
      const incompleteClient = {
        email: 'jane@test.com',
        // Missing firstName and lastName
      }

      await request(app).post('/clients').send(incompleteClient).expect(400)
    })

    it('should handle database errors during creation', async () => {
      const newClient = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@test.com',
      }

      mockQuery.mockRejectedValueOnce(new Error('Database error'))

      await request(app).post('/clients').send(newClient).expect(500)
    })
  })

  describe('PUT /clients/:id', () => {
    it('should update an existing client', async () => {
      const updateData = {
        firstName: 'John Updated',
        lastName: 'Doe Updated',
        email: 'john.updated@test.com',
        phone: '0111111111',
      }

      const mockUpdatedClient = {
        id: 'client-1',
        first_name: 'John Updated',
        last_name: 'Doe Updated',
        company_name: 'Test Company',
        email: 'john.updated@test.com',
        phone: '0111111111',
        address_line1: '123 Test St',
        address_line2: null,
        postal_code: '75001',
        city: 'Paris',
        country: 'France',
        notes: null,
        is_company: true,
        siret: '12345678901234',
        vat_number: null,
        legal_form: null,
        rcs_number: null,
        ape_code: null,
        capital_social: null,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      }

      mockQuery.mockResolvedValueOnce({ rows: [mockUpdatedClient] })

      const response = await request(app)
        .put('/clients/client-1')
        .send(updateData)
        .expect(200)

      expect(response.body.client).toMatchObject({
        id: 'client-1',
        firstName: 'John Updated',
        lastName: 'Doe Updated',
        email: 'john.updated@test.com',
        phone: '0111111111',
      })
    })

    it('should return 404 if client not found', async () => {
      const updateData = {
        firstName: 'John Updated',
        lastName: 'Doe Updated',
      }

      mockQuery.mockResolvedValueOnce({ rows: [] })

      await request(app)
        .put('/clients/non-existent')
        .send(updateData)
        .expect(404)
    })

    it('should return 500 for invalid UUID (database error)', async () => {
      const updateData = {
        firstName: 'John Updated',
        lastName: 'Doe Updated',
      }

      mockQuery.mockRejectedValueOnce(new Error('Invalid UUID format'))

      await request(app)
        .put('/clients/invalid-uuid')
        .send(updateData)
        .expect(500)
    })

    it('should return 400 for invalid update data', async () => {
      const invalidUpdate = {
        firstName: '', // Invalid: too short
        email: 'invalid-email', // Invalid email format
      }

      await request(app)
        .put('/clients/client-1')
        .send(invalidUpdate)
        .expect(400)
    })
  })

  describe('DELETE /clients/:id', () => {
    it('should delete a client', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'client-1' }] })

      await request(app).delete('/clients/client-1').expect(200)

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM clients'),
        expect.arrayContaining(['client-1', 'test-user-id'])
      )
    })

    it('should return 404 if client not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] })

      await request(app).delete('/clients/non-existent').expect(404)
    })

    it('should return 500 for invalid UUID (database error)', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Invalid UUID format'))

      await request(app).delete('/clients/invalid-uuid').expect(500)
    })

    it('should handle database errors during deletion', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'))

      await request(app).delete('/clients/client-1').expect(500)
    })
  })

  describe('Authentication', () => {
    it('should require authentication for all routes', async () => {
      authenticateToken.mockImplementationOnce((req, res, next) => {
        res.status(401).json({ error: 'Unauthorized' })
      })

      await request(app).get('/clients').expect(401)
    })
  })
})
