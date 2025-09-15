// Mock des modules AVANT qu'ils soient chargés
jest.mock('../../config/database', () => ({
  query: jest.fn(),
  transaction: jest.fn(),
}))

jest.mock('../../services/calculationService', () => ({
  calculateTotals: jest.fn(),
}))

// Import des modules après les mocks
const advanceInvoiceService = require('../../services/advanceInvoiceService')
const { query, transaction } = require('../../config/database')
const calculationService = require('../../services/calculationService')

describe('AdvanceInvoiceService', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Mock par défaut pour calculationService
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
  })

  describe('createAdvanceInvoice', () => {
    it('should create advance invoice successfully', async () => {
      const params = {
        userId: 'user123',
        clientId: 'client123',
        quoteId: 'quote123',
        title: 'Projet Test',
        description: 'Description du projet',
        advanceAmount: 600,
        totalAmount: 1200,
        dueDate: new Date('2023-12-31'),
        notes: 'Notes de test',
        purchaseOrderNumber: 'PO-001',
      }

      const mockSettings = [{ invoice_prefix: 'FAC', invoice_counter: 0 }]
      const mockYearCount = [{ cnt: '0' }]
      const mockInvoice = {
        id: 'invoice-1',
        invoice_number: 'FAC-AC-2023-0001',
        title: 'Projet Test',
        description: 'Description du projet',
        status: 'pending',
        subtotal_ht: 500,
        total_vat: 100,
        total_ttc: 600,
        paid_amount: 0,
        due_date: new Date('2023-12-31'),
        notes: 'Notes de test',
        created_at: new Date(),
        updated_at: new Date(),
      }

      transaction.mockImplementation(async (callback) => {
        const mockClient = {
          query: jest
            .fn()
            .mockResolvedValueOnce({ rows: mockSettings })
            .mockResolvedValueOnce({ rows: mockYearCount })
            .mockResolvedValueOnce({ rows: [] }) // UPDATE
            .mockResolvedValueOnce({ rows: [mockInvoice] }) // INSERT invoice
            .mockResolvedValueOnce({ rows: [{ id: 'item-1' }] }), // INSERT item
        }
        return await callback(mockClient)
      })

      const result = await advanceInvoiceService.createAdvanceInvoice(params)

      expect(result).toMatchObject({
        id: 'invoice-1',
        invoice_number: 'FAC-AC-2023-0001',
        title: 'Projet Test',
        status: 'pending',
      })

      expect(transaction).toHaveBeenCalled()
    })

    it('should handle database errors', async () => {
      const params = {
        userId: 'user123',
        clientId: 'client123',
        title: 'Projet Test',
        advanceAmount: 600,
        totalAmount: 1200,
        dueDate: new Date('2023-12-31'),
      }

      transaction.mockRejectedValueOnce(new Error('Database error'))

      await expect(
        advanceInvoiceService.createAdvanceInvoice(params)
      ).rejects.toThrow('Database error')
    })
  })

  describe('createFinalInvoice', () => {
    it('should create final invoice successfully', async () => {
      const params = {
        userId: 'user123',
        clientId: 'client123',
        quoteId: 'quote123',
        parentInvoiceId: 'advance-invoice-1',
        title: 'Projet Test - Solde',
        description: 'Description du solde',
        items: [
          {
            description: 'Service test',
            quantity: 1,
            unitPriceHt: 1000,
            vatRate: 20,
          },
        ],
        dueDate: new Date('2023-12-31'),
        notes: 'Notes de test',
        purchaseOrderNumber: 'PO-001',
      }

      const mockAdvanceInvoice = {
        total_ttc: 600,
        advance_amount: 600,
      }

      const mockSettings = [{ invoice_prefix: 'FAC', invoice_counter: 0 }]
      const mockYearCount = [{ cnt: '0' }]
      const mockFinalInvoice = {
        id: 'final-invoice-1',
        invoice_number: 'FAC-SOL-2023-0001',
        title: 'Projet Test - Solde',
        status: 'pending',
        subtotal_ht: 500,
        total_vat: 100,
        total_ttc: 600,
        paid_amount: 0,
      }

      transaction.mockImplementation(async (callback) => {
        const mockClient = {
          query: jest
            .fn()
            .mockResolvedValueOnce({ rows: [mockAdvanceInvoice] }) // Get advance invoice
            .mockResolvedValueOnce({ rows: mockSettings }) // Get settings
            .mockResolvedValueOnce({ rows: mockYearCount }) // Count year
            .mockResolvedValueOnce({ rows: [] }) // UPDATE
            .mockResolvedValueOnce({ rows: [mockFinalInvoice] }) // INSERT final invoice
            .mockResolvedValueOnce({ rows: [{ id: 'item-1' }] }), // INSERT item
        }
        return await callback(mockClient)
      })

      const result = await advanceInvoiceService.createFinalInvoice(params)

      expect(result.invoice).toMatchObject({
        id: 'final-invoice-1',
        invoice_number: 'FAC-SOL-2023-0001',
        title: 'Projet Test - Solde',
      })

      expect(result.items).toHaveLength(1)
      expect(transaction).toHaveBeenCalled()
    })

    it('should throw error if advance invoice not found', async () => {
      const params = {
        userId: 'user123',
        clientId: 'client123',
        parentInvoiceId: 'non-existent',
        title: 'Projet Test - Solde',
        items: [],
        dueDate: new Date('2023-12-31'),
      }

      transaction.mockImplementation(async (callback) => {
        const mockClient = {
          query: jest.fn().mockResolvedValueOnce({ rows: [] }), // No advance invoice
        }
        return await callback(mockClient)
      })

      await expect(
        advanceInvoiceService.createFinalInvoice(params)
      ).rejects.toThrow("Facture d'acompte non trouvée")
    })

    it('should throw error if advance amount >= total amount', async () => {
      const params = {
        userId: 'user123',
        clientId: 'client123',
        parentInvoiceId: 'advance-invoice-1',
        title: 'Projet Test - Solde',
        items: [
          {
            description: 'Service test',
            quantity: 1,
            unitPriceHt: 500,
            vatRate: 20,
          },
        ],
        dueDate: new Date('2023-12-31'),
      }

      const mockAdvanceInvoice = {
        total_ttc: 600,
        advance_amount: 600,
      }

      // Mock calculationService pour ce test spécifique
      calculationService.calculateTotals.mockReturnValue({
        subtotalHt: 500,
        totalVat: 100,
        totalTtc: 600, // Même montant que l'acompte
        items: [
          {
            serviceId: null,
            description: 'Service test',
            quantity: 1,
            unitPriceHt: 500,
            unitPriceTtc: 600,
            vatRate: 20,
            totalHt: 500,
            totalTtc: 600,
            sortOrder: 0,
            sectionId: null,
          },
        ],
      })

      transaction.mockImplementation(async (callback) => {
        const mockClient = {
          query: jest
            .fn()
            .mockResolvedValueOnce({ rows: [mockAdvanceInvoice] }), // Advance invoice
        }
        return await callback(mockClient)
      })

      await expect(
        advanceInvoiceService.createFinalInvoice(params)
      ).rejects.toThrow(
        "Le montant de l'acompte est supérieur ou égal au montant total du projet"
      )
    })
  })

  describe('getRelatedInvoices', () => {
    it('should return related invoices', async () => {
      const userId = 'user123'
      const parentInvoiceId = 'parent-1'

      const mockInvoices = [
        {
          id: 'parent-1',
          invoice_type: 'advance',
          invoice_number: 'FAC-AC-2023-0001',
          created_at: new Date('2023-01-01'),
        },
        {
          id: 'final-1',
          invoice_type: 'final',
          invoice_number: 'FAC-SOL-2023-0001',
          created_at: new Date('2023-01-02'),
        },
      ]

      query.mockResolvedValueOnce({ rows: mockInvoices })

      const result = await advanceInvoiceService.getRelatedInvoices(
        userId,
        parentInvoiceId
      )

      expect(result.advance).toMatchObject({
        id: 'parent-1',
        invoice_type: 'advance',
      })
      expect(result.final).toMatchObject({
        id: 'final-1',
        invoice_type: 'final',
      })
      expect(result.all).toHaveLength(2)
    })
  })

  describe('getPaymentStatus', () => {
    it('should return payment status', async () => {
      const userId = 'user123'
      const parentInvoiceId = 'parent-1'

      const mockRelatedInvoices = {
        advance: {
          total_ttc: 600,
          paid_amount: 300,
          status: 'pending',
        },
        final: {
          total_ttc: 600,
          paid_amount: 0,
          status: 'pending',
        },
      }

      // Mock getRelatedInvoices
      jest
        .spyOn(advanceInvoiceService, 'getRelatedInvoices')
        .mockResolvedValueOnce(mockRelatedInvoices)

      const result = await advanceInvoiceService.getPaymentStatus(
        userId,
        parentInvoiceId
      )

      expect(result.totalAmount).toBe(1200)
      expect(result.paidAmount).toBe(300)
      expect(result.remainingAmount).toBe(900)
      expect(result.advancePaid).toBe(false)
      expect(result.finalPaid).toBe(false)
      expect(result.fullyPaid).toBe(false)
    })

    it('should return error if no advance invoice found', async () => {
      const userId = 'user123'
      const parentInvoiceId = 'parent-1'

      const mockRelatedInvoices = {
        advance: null,
        final: null,
      }

      jest
        .spyOn(advanceInvoiceService, 'getRelatedInvoices')
        .mockResolvedValueOnce(mockRelatedInvoices)

      const result = await advanceInvoiceService.getPaymentStatus(
        userId,
        parentInvoiceId
      )

      expect(result.error).toBe("Aucune facture d'acompte trouvée")
    })
  })
})
