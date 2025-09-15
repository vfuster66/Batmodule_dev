const request = require('supertest')
const express = require('express')
const invoicesRouter = require('../../routes/invoices')
const { authenticateToken } = require('../../middleware/auth')
const { query, transaction } = require('../../config/database')
const pdfService = require('../../services/pdfService')
const calculationService = require('../../services/calculationService')
const archivingService = require('../../services/archivingService')
const advanceInvoiceService = require('../../services/advanceInvoiceService')

// Mock des dépendances
jest.mock('../../middleware/auth')
jest.mock('../../config/database')
jest.mock('../../services/pdfService')
jest.mock('../../services/calculationService')
jest.mock('../../services/archivingService')
jest.mock('../../services/advanceInvoiceService')

const app = express()
app.use(express.json())
app.use('/invoices', invoicesRouter)

describe('Invoices Routes', () => {
  let mockQuery, mockTransaction

  beforeEach(() => {
    mockQuery = jest.fn()
    mockTransaction = jest.fn()
    query.mockImplementation(mockQuery)
    transaction.mockImplementation(mockTransaction)
    authenticateToken.mockImplementation((req, res, next) => {
      req.user = { userId: 'test-user-id' }
      next()
    })

    // Les mocks calculationService seront configurés dans chaque test

    // Ne pas effacer les mocks configurés dans les tests
    // jest.clearAllMocks();
  })

  describe('GET /invoices', () => {
    it('should return all invoices for authenticated user', async () => {
      const mockInvoices = [
        {
          id: 'invoice-1',
          client_id: 'client-1',
          quote_id: null,
          invoice_number: 'FAC-2023-0001',
          title: 'Facture Test',
          description: 'Description test',
          status: 'pending',
          subtotal_ht: 1000.0,
          total_vat: 200.0,
          total_ttc: 1200.0,
          paid_amount: 0.0,
          due_date: '2023-12-31',
          notes: 'Notes test',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          first_name: 'John',
          last_name: 'Doe',
          company_name: 'Test Company',
        },
      ]

      const mockCount = { rows: [{ total: '1' }] }
      mockQuery.mockResolvedValueOnce({ rows: mockInvoices })
      mockQuery.mockResolvedValueOnce(mockCount)

      const response = await request(app).get('/invoices').expect(200)

      expect(response.body.invoices).toHaveLength(1)
      expect(response.body.invoices[0]).toMatchObject({
        id: 'invoice-1',
        clientId: 'client-1',
        clientName: 'John Doe',
        clientCompany: 'Test Company',
        invoiceNumber: 'FAC-2023-0001',
        title: 'Facture Test',
        status: 'pending',
        subtotalHt: 1000,
        totalVat: 200,
        totalTtc: 1200,
        paidAmount: 0,
      })
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 20,
        total: 1,
        pages: 1,
      })
    })

    it('should filter invoices by status', async () => {
      const mockCount = { rows: [{ total: '0' }] }
      mockQuery.mockResolvedValueOnce({ rows: [] })
      mockQuery.mockResolvedValueOnce(mockCount)

      await request(app).get('/invoices?status=pending').expect(200)

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND i.status = $2'),
        expect.arrayContaining(['test-user-id', 'pending'])
      )
    })

    it('should filter invoices by client', async () => {
      const mockCount = { rows: [{ total: '0' }] }
      mockQuery.mockResolvedValueOnce({ rows: [] })
      mockQuery.mockResolvedValueOnce(mockCount)

      await request(app).get('/invoices?clientId=client-1').expect(200)

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND i.client_id = $2'),
        expect.arrayContaining(['test-user-id', 'client-1'])
      )
    })

    it('should search invoices', async () => {
      const mockCount = { rows: [{ total: '0' }] }
      mockQuery.mockResolvedValueOnce({ rows: [] })
      mockQuery.mockResolvedValueOnce(mockCount)

      await request(app).get('/invoices?search=test').expect(200)

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        expect.arrayContaining(['test-user-id', '%test%'])
      )
    })

    it('should handle pagination', async () => {
      const mockCount = { rows: [{ total: '0' }] }
      mockQuery.mockResolvedValueOnce({ rows: [] })
      mockQuery.mockResolvedValueOnce(mockCount)

      await request(app).get('/invoices?page=2&limit=10').expect(200)

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT $2 OFFSET $3'),
        expect.arrayContaining(['test-user-id', '10', 10])
      )
    })

    it('should support sorting with allowed columns', async () => {
      const mockCount = { rows: [{ total: '0' }] }
      mockQuery.mockResolvedValueOnce({ rows: [] })
      mockQuery.mockResolvedValueOnce(mockCount)

      await request(app)
        .get('/invoices?sortBy=invoice_number&sortOrder=asc&page=1&limit=20')
        .expect(200)

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY i.invoice_number ASC'),
        expect.arrayContaining(['test-user-id', '20', 0])
      )
    })

    it('should handle database errors', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'))

      await request(app).get('/invoices').expect(500)
    })
  })

  describe('GET /invoices/:id', () => {
    it('should return a specific invoice with items and payments', async () => {
      const mockInvoice = {
        id: 'invoice-1',
        client_id: 'client-1',
        quote_id: null,
        invoice_number: 'FAC-2023-0001',
        title: 'Facture Test',
        description: 'Description test',
        status: 'pending',
        subtotal_ht: 1000.0,
        total_vat: 200.0,
        total_ttc: 1200.0,
        paid_amount: 0.0,
        due_date: '2023-12-31',
        notes: 'Notes test',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
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
          service_id: 'service-1',
          description: 'Service test',
          quantity: 1,
          unit_price_ht: 1000.0,
          unit_price_ttc: 1200.0,
          vat_rate: 20.0,
          total_ht: 1000.0,
          total_ttc: 1200.0,
          sort_order: 0,
          section_id: null,
        },
      ]

      const mockPayments = [
        {
          id: 'payment-1',
          amount: 600.0,
          payment_method: 'transfer',
          payment_date: '2023-01-15',
          reference: 'REF123',
          notes: 'Payment notes',
          created_at: '2023-01-15T00:00:00Z',
        },
      ]

      mockQuery
        .mockResolvedValueOnce({ rows: [mockInvoice] })
        .mockResolvedValueOnce({ rows: mockItems })
        .mockResolvedValueOnce({ rows: mockPayments })

      const response = await request(app).get('/invoices/invoice-1').expect(200)

      expect(response.body.invoice).toMatchObject({
        id: 'invoice-1',
        invoiceNumber: 'FAC-2023-0001',
        title: 'Facture Test',
        status: 'pending',
        subtotalHt: 1000,
        totalVat: 200,
        totalTtc: 1200,
        paidAmount: 0,
      })
      expect(response.body.invoice.client).toMatchObject({
        id: 'client-1',
        firstName: 'John',
        lastName: 'Doe',
        companyName: 'Test Company',
        email: 'john@test.com',
      })
      expect(response.body.invoice.items).toHaveLength(1)
      expect(response.body.invoice.payments).toHaveLength(1)
    })

    it('should return 404 if invoice not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] })

      const response = await request(app)
        .get('/invoices/non-existent')
        .expect(404)

      expect(response.body.error).toBe('Facture non trouvée')
    })
  })

  describe('POST /invoices', () => {
    it('should create a new invoice successfully', async () => {
      const newInvoice = {
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Nouvelle Facture',
        description: 'Description de la facture',
        dueDate: '2023-12-31',
        notes: 'Notes de la facture',
        items: [
          {
            description: 'Service test',
            quantity: 1,
            unitPriceHt: 1000,
            vatRate: 20,
          },
        ],
      }

      const mockClient = {
        rows: [{ id: '123e4567-e89b-12d3-a456-426614174000' }],
      }
      const mockSettings = {
        rows: [{ invoice_prefix: 'FAC', invoice_counter: 0 }],
      }
      const mockYearCount = { rows: [{ cnt: '0' }] }
      const mockInvoice = {
        id: 'invoice-2',
        invoice_number: 'FAC-2023-0001',
        title: 'Nouvelle Facture',
        description: 'Description de la facture',
        status: 'pending',
        subtotal_ht: 1000.0,
        total_vat: 200.0,
        total_ttc: 1200.0,
        paid_amount: 0.0,
        due_date: '2023-12-31',
        notes: 'Notes de la facture',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      }
      const mockItem = {
        id: 'item-2',
        service_id: null,
        description: 'Service test',
        quantity: 1,
        unit_price_ht: 1000.0,
        unit_price_ttc: 1200.0,
        vat_rate: 20.0,
        total_ht: 1000.0,
        total_ttc: 1200.0,
        sort_order: 0,
        section_id: null,
      }

      mockQuery
        .mockResolvedValueOnce(mockClient)
        .mockResolvedValueOnce(mockSettings)
        .mockResolvedValueOnce(mockYearCount)

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

      mockTransaction.mockImplementation(async (callback) => {
        const mockClient = {
          query: jest
            .fn()
            // SELECT invoice_prefix, invoice_counter FROM company_settings ... FOR UPDATE
            .mockResolvedValueOnce(mockSettings)
            // SELECT COUNT(*) AS cnt FROM invoices WHERE ...
            .mockResolvedValueOnce(mockYearCount)
            // UPDATE company_settings SET invoice_counter = ...
            .mockResolvedValueOnce({ rows: [] })
            // INSERT INTO invoices ... RETURNING *
            .mockResolvedValueOnce({ rows: [mockInvoice] })
            // INSERT INTO invoice_items ... RETURNING *
            .mockResolvedValueOnce({ rows: [mockItem] }),
        }
        return await callback(mockClient)
      })

      const response = await request(app).post('/invoices').send(newInvoice)

      console.log('Response status:', response.status)
      console.log('Response body:', response.body)

      expect(response.status).toBe(201)

      expect(response.body.message).toBe('Facture créée avec succès')
      expect(response.body.invoice.invoiceNumber).toBe('FAC-2023-0001')
      expect(response.body.invoice.title).toBe('Nouvelle Facture')
      expect(response.body.invoice.items).toHaveLength(1)
    })

    it('should return 400 for invalid data', async () => {
      const invalidInvoice = {
        clientId: 'invalid-uuid-format',
        title: '', // Invalid: too short
        items: [], // Invalid: empty items
      }

      const response = await request(app)
        .post('/invoices')
        .send(invalidInvoice)
        .expect(400)

      expect(response.body.error).toBe('Données invalides')
    })

    it('should return 404 if client not found', async () => {
      const newInvoice = {
        clientId: '00000000-0000-0000-0000-000000000000',
        title: 'Nouvelle Facture',
        items: [
          {
            description: 'Service test',
            quantity: 1,
            unitPriceHt: 1000,
            vatRate: 20,
          },
        ],
      }

      mockQuery.mockResolvedValueOnce({ rows: [] })

      // Les items doivent être considérés valides pour atteindre la vérification du client
      calculationService.validateItems.mockReturnValue({ isValid: true })

      const response = await request(app)
        .post('/invoices')
        .send(newInvoice)
        .expect(404)

      expect(response.body.error).toBe('Client non trouvé')
    })

    it('should validate items', async () => {
      const newInvoice = {
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Nouvelle Facture',
        items: [
          {
            description: 'Service test',
            // Données valides côté schéma, l'erreur vient de la validation métier
            quantity: 1,
            unitPriceHt: 1000,
            vatRate: 20,
          },
        ],
      }

      const mockClient = { rows: [{ id: 'client-1' }] }
      mockQuery.mockResolvedValueOnce(mockClient)

      calculationService.validateItems.mockReturnValue({
        isValid: false,
        errors: ['Quantité invalide'],
      })

      const response = await request(app)
        .post('/invoices')
        .send(newInvoice)
        .expect(400)

      expect(response.body.error).toBe('Données des items invalides')
    })
  })

  describe('POST /invoices/:id/payments', () => {
    it('should add a payment successfully', async () => {
      const paymentData = {
        amount: 600,
        paymentMethod: 'transfer',
        paymentDate: '2023-01-15',
        reference: 'REF123',
        notes: 'Payment notes',
      }

      const mockInvoice = {
        id: 'invoice-1',
        total_ttc: 1200.0,
        paid_amount: 0.0,
        status: 'pending',
      }

      const mockPayment = {
        id: 'payment-1',
        amount: 600.0,
        payment_method: 'transfer',
        payment_date: '2023-01-15',
        reference: 'REF123',
        notes: 'Payment notes',
        created_at: '2023-01-15T00:00:00Z',
      }

      mockQuery
        .mockResolvedValueOnce({ rows: [mockInvoice] })
        .mockResolvedValueOnce({ rows: [mockPayment] })
        .mockResolvedValueOnce({ rows: [] })

      mockTransaction.mockImplementation(async (callback) => {
        const mockClient = {
          query: jest
            .fn()
            .mockResolvedValueOnce({ rows: [mockInvoice] })
            .mockResolvedValueOnce({ rows: [mockPayment] })
            .mockResolvedValueOnce({ rows: [] }),
        }
        return await callback(mockClient)
      })

      const response = await request(app)
        .post('/invoices/invoice-1/payments')
        .send(paymentData)
        .expect(201)

      expect(response.body.message).toBe('Paiement ajouté avec succès')
      expect(response.body.payment.amount).toBe(600)
      expect(response.body.payment.paymentMethod).toBe('transfer')
    })

    it('should return 400 for invalid payment data', async () => {
      const invalidPayment = {
        amount: -100, // Invalid: negative amount
        paymentMethod: 'invalid-method', // Invalid method
        paymentDate: 'invalid-date', // Invalid date
      }

      const response = await request(app)
        .post('/invoices/invoice-1/payments')
        .send(invalidPayment)
        .expect(400)

      expect(response.body.error).toBe('Données invalides')
    })

    it('should return 404 if invoice not found', async () => {
      const paymentData = {
        amount: 600,
        paymentMethod: 'transfer',
        paymentDate: '2023-01-15',
      }

      mockQuery.mockResolvedValueOnce({ rows: [] })

      mockTransaction.mockImplementation(async (callback) => {
        const mockClient = {
          query: jest.fn().mockResolvedValueOnce({ rows: [] }),
        }
        return await callback(mockClient)
      })

      const response = await request(app)
        .post('/invoices/non-existent/payments')
        .send(paymentData)
        .expect(404)

      expect(response.body.error).toBe('Facture non trouvée')
    })

    it('should handle cash payment restrictions', async () => {
      const paymentData = {
        amount: 1000,
        paymentMethod: 'cash',
        paymentDate: '2023-01-15',
      }

      const mockNf525Settings = {
        rows: [
          {
            cash_payments_enabled: false,
            cash_payment_limit: 1000,
            nf525_compliant: true,
            is_b2c: false,
            is_resident: true,
          },
        ],
      }

      mockQuery.mockResolvedValueOnce(mockNf525Settings)

      const response = await request(app)
        .post('/invoices/invoice-1/payments')
        .send(paymentData)
        .expect(400)

      expect(response.body.error).toBe('Paiements espèces non autorisés')
    })

    it('should enforce cash payment limit', async () => {
      const paymentData = {
        amount: 1200,
        paymentMethod: 'cash',
        paymentDate: '2023-01-15',
      }
      const mockNf525Settings = {
        rows: [
          {
            cash_payments_enabled: true,
            cash_payment_limit: 1000,
            nf525_compliant: true,
            is_b2c: false,
            is_resident: true,
          },
        ],
      }
      mockQuery.mockResolvedValueOnce(mockNf525Settings)
      const response = await request(app)
        .post('/invoices/invoice-1/payments')
        .send(paymentData)
        .expect(400)
      expect(response.body.error).toBe('Plafond espèces dépassé')
    })

    it("should return 404 when company settings aren't found for cash payment", async () => {
      const paymentData = {
        amount: 100,
        paymentMethod: 'cash',
        paymentDate: '2023-01-15',
      }
      mockQuery.mockResolvedValueOnce({ rows: [] })
      const response = await request(app)
        .post('/invoices/invoice-1/payments')
        .send(paymentData)
        .expect(404)
      expect(response.body.error).toBe("Paramètres de l'entreprise non trouvés")
    })
  })

  describe('PUT /invoices/:id/status', () => {
    it('should update invoice status successfully', async () => {
      const statusData = { status: 'paid' }
      const mockResult = {
        rows: [
          {
            id: 'invoice-1',
            status: 'paid',
            updated_at: '2023-01-15T00:00:00Z',
          },
        ],
      }

      mockQuery.mockResolvedValueOnce(mockResult)

      const response = await request(app)
        .put('/invoices/invoice-1/status')
        .send(statusData)
        .expect(200)

      expect(response.body.message).toBe(
        'Statut de la facture mis à jour avec succès'
      )
      expect(response.body.status).toBe('paid')
    })

    it('should return 400 for invalid status', async () => {
      const statusData = { status: 'cancelled' } // Invalid status

      const response = await request(app)
        .put('/invoices/invoice-1/status')
        .send(statusData)
        .expect(400)

      expect(response.body.error).toBe('Statut invalide')
    })

    it('should return 404 if invoice not found', async () => {
      const statusData = { status: 'paid' }
      mockQuery.mockResolvedValueOnce({ rows: [] })

      const response = await request(app)
        .put('/invoices/non-existent/status')
        .send(statusData)
        .expect(404)

      expect(response.body.error).toBe('Facture non trouvée')
    })
  })

  describe('DELETE /invoices/:id', () => {
    it('should return 400 for deletion (forbidden in France)', async () => {
      const response = await request(app)
        .delete('/invoices/invoice-1')
        .expect(400)

      expect(response.body.error).toBe('Suppression interdite')
      expect(response.body.message).toBe(
        'La suppression de factures est interdite. Utilisez un avoir.'
      )
    })
  })

  describe('GET /invoices/:id/pdf', () => {
    it('should generate invoice PDF successfully', async () => {
      const mockInvoice = {
        id: 'invoice-1',
        client_id: 'client-1',
        invoice_number: 'FAC-2023-0001',
        title: 'Facture Test',
        description: 'Description test',
        status: 'pending',
        subtotal_ht: 1000.0,
        total_vat: 200.0,
        total_ttc: 1200.0,
        paid_amount: 0.0,
        due_date: '2023-12-31',
        notes: 'Notes test',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
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
          service_id: 'service-1',
          description: 'Service test',
          quantity: 1,
          unit_price_ht: 1000.0,
          unit_price_ttc: 1200.0,
          vat_rate: 20.0,
          total_ht: 1000.0,
          total_ttc: 1200.0,
          sort_order: 0,
          section_id: null,
        },
      ]

      const mockCompany = {
        rows: [
          {
            company_name: 'Test Company',
            address_line1: '123 Company St',
            postal_code: '75001',
            city: 'Paris',
            country: 'France',
            phone: '0123456789',
            email: 'contact@test.com',
            siret: '12345678901234',
            vat_number: 'FR12345678901',
          },
        ],
      }

      const mockPdfBuffer = Buffer.from('PDF content')

      mockQuery
        .mockResolvedValueOnce({ rows: [mockInvoice] })
        .mockResolvedValueOnce({ rows: mockItems })
        .mockResolvedValueOnce(mockCompany)

      pdfService.generateInvoicePDF.mockResolvedValueOnce(mockPdfBuffer)

      const response = await request(app)
        .get('/invoices/invoice-1/pdf')
        .expect(200)

      expect(response.headers['content-type']).toBe('application/pdf')
      expect(response.headers['content-disposition']).toBe(
        'attachment; filename="facture-FAC-2023-0001.pdf"'
      )
      expect(response.body).toEqual(mockPdfBuffer)
    })

    it('should return 404 if invoice not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] })

      const response = await request(app)
        .get('/invoices/non-existent/pdf')
        .expect(404)

      expect(response.body.error).toBe('Facture non trouvée')
    })

    it('should handle PDF generation errors', async () => {
      const mockInvoice = {
        id: 'invoice-1',
        client_id: 'client-1',
        invoice_number: 'FAC-2023-0001',
        title: 'Facture Test',
        description: '',
        status: 'pending',
        subtotal_ht: 100,
        total_vat: 20,
        total_ttc: 120,
        paid_amount: 0,
        due_date: null,
        notes: null,
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
        first_name: 'A',
        last_name: 'B',
        company_name: 'C',
        email: 'a@b.c',
        phone: '',
        address_line1: '',
        address_line2: null,
        postal_code: '',
        city: '',
        country: '',
      }
      const mockItems = []
      const mockCompany = { rows: [{ company_name: 'X' }] }
      mockQuery
        .mockResolvedValueOnce({ rows: [mockInvoice] })
        .mockResolvedValueOnce({ rows: mockItems })
        .mockResolvedValueOnce(mockCompany)
      pdfService.generateInvoicePDF.mockRejectedValueOnce(
        new Error('PDF error')
      )
      await request(app).get('/invoices/invoice-1/pdf').expect(500)
    })
  })

  describe('POST /invoices/from-quote/:id', () => {
    it('should convert quote to invoice successfully', async () => {
      const mockQuote = {
        id: 'quote-1',
        user_id: 'test-user-id',
        client_id: 'client-1',
        quote_number: 'DEV-2023-0001',
        title: 'Devis Test',
        description: 'Description du devis',
        status: 'accepted',
        subtotal_ht: 1000.0,
        total_vat: 200.0,
        total_ttc: 1200.0,
        valid_until: '2023-12-31',
        notes: 'Notes du devis',
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
          service_id: 'service-1',
          description: 'Service test',
          quantity: 1,
          unit_price_ht: 1000.0,
          unit_price_ttc: 1200.0,
          vat_rate: 20.0,
          total_ht: 1000.0,
          total_ttc: 1200.0,
          sort_order: 0,
          discount_percent: 0,
          markup_percent: 0,
          unit: 'm²',
          section_id: null,
        },
      ]

      const mockSettings = {
        rows: [{ invoice_prefix: 'FAC', invoice_counter: 0 }],
      }
      const mockYearCount = { rows: [{ cnt: '0' }] }
      const mockInvoice = {
        id: 'invoice-2',
        invoice_number: 'FAC-2023-0001',
        title: 'Facture DEV-2023-0001',
        description: 'Facture basée sur le devis DEV-2023-0001',
        subtotal_ht: 1000.0,
        total_vat: 200.0,
        total_ttc: 1200.0,
        due_date: '2023-12-31',
        notes: 'Notes du devis',
        status: 'pending',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      }

      const mockFullInvoice = {
        id: 'invoice-2',
        client_id: 'client-1',
        quote_id: 'quote-1',
        invoice_number: 'FAC-2023-0001',
        title: 'Facture DEV-2023-0001',
        description: 'Facture basée sur le devis DEV-2023-0001',
        subtotal_ht: 1000.0,
        total_vat: 200.0,
        total_ttc: 1200.0,
        due_date: '2023-12-31',
        notes: 'Notes du devis',
        status: 'pending',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
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

      // Requêtes hors transaction:
      // 1) Sélection du devis
      // 2) Récupération de la facture complète après conversion
      mockQuery
        .mockResolvedValueOnce({ rows: [mockQuote] })
        .mockResolvedValueOnce({ rows: [mockFullInvoice] })

      calculationService.calculateTotals.mockReturnValue({
        subtotalHt: 1000,
        totalVat: 200,
        totalTtc: 1200,
        items: [
          {
            serviceId: 'service-1',
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

      mockTransaction.mockImplementation(async (callback) => {
        const mockClient = {
          query: jest
            .fn()
            // SELECT items of quote inside transaction
            .mockResolvedValueOnce({ rows: mockItems })
            // SELECT invoice_prefix, invoice_counter FROM company_settings ... FOR UPDATE
            .mockResolvedValueOnce(mockSettings)
            // SELECT COUNT(*) AS cnt FROM invoices WHERE ...
            .mockResolvedValueOnce(mockYearCount)
            // UPDATE company_settings SET invoice_counter = ...
            .mockResolvedValueOnce({ rows: [] })
            // INSERT INTO invoices ... RETURNING *
            .mockResolvedValueOnce({ rows: [mockInvoice] })
            // INSERT invoice_items (no RETURNING)
            .mockResolvedValueOnce({ rows: [] })
            // UPDATE quotes status
            .mockResolvedValueOnce({ rows: [] }),
        }
        return await callback(mockClient)
      })

      const response = await request(app)
        .post('/invoices/from-quote/quote-1')
        .expect(201)

      expect(response.body.message).toBe(
        'Facture créée avec succès à partir du devis'
      )
      expect(response.body.invoice.invoiceNumber).toBe('FAC-2023-0001')
      expect(response.body.invoice.quoteId).toBe('quote-1')
    })

    it('should return 404 if quote not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] })

      const response = await request(app)
        .post('/invoices/from-quote/non-existent')
        .expect(404)

      expect(response.body.message).toBe('Devis non trouvé')
    })

    it('should return 400 if quote is not accepted', async () => {
      const mockQuote = {
        id: 'quote-1',
        user_id: 'test-user-id',
        status: 'draft', // Not accepted
      }

      mockQuery.mockResolvedValueOnce({ rows: [mockQuote] })

      const response = await request(app)
        .post('/invoices/from-quote/quote-1')
        .expect(400)

      expect(response.body.message).toBe(
        'Seuls les devis acceptés peuvent être convertis en facture'
      )
    })
  })

  describe('Authentication', () => {
    it('should require authentication for all routes', async () => {
      authenticateToken.mockImplementationOnce((req, res, next) => {
        res.status(401).json({ error: 'Unauthorized' })
      })

      await request(app).get('/invoices').expect(401)
    })
  })
})
