// Mock des modules AVANT qu'ils soient chargés
jest.mock('../../config/database', () => ({
  query: jest.fn(),
}))

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
}))

jest.mock('csv-writer', () => ({
  createObjectCsvWriter: jest.fn(),
}))

// Import des modules après les mocks
const accountingExportService = require('../../services/accountingExportService')
const { query } = require('../../config/database')
const fs = require('fs')
const csv = require('csv-writer')

describe('AccountingExportService', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Mock par défaut pour fs
    fs.existsSync.mockReturnValue(false)
    fs.mkdirSync.mockImplementation(() => {})
    fs.writeFileSync.mockImplementation(() => {})

    // Mock par défaut pour csv-writer
    const mockCsvWriter = {
      writeRecords: jest.fn().mockResolvedValue(),
    }
    csv.createObjectCsvWriter.mockReturnValue(mockCsvWriter)
  })

  describe('generateFECExport', () => {
    it('should generate FEC export successfully', async () => {
      const userId = 'user123'
      const startDate = new Date('2023-01-01')
      const endDate = new Date('2023-12-31')

      const mockCompany = {
        siret: '12345678901234',
        company_name: 'Test Company',
      }

      const mockInvoices = [
        {
          journal_code: 'VENTE',
          journal_lib: 'VTE',
          piece_num: 'FAC-2023-0001',
          piece_date: '2023-01-15',
          piece_lib: 'Facture FAC-2023-0001',
          compte_num: '411',
          compte_lib: 'Test Company',
          sens: 'D',
          debit: 1200,
          credit: 0,
          ecriture_lib: 'Facture FAC-2023-0001',
          currency_code: 'EUR',
          ecriture_date: '2023-01-15',
        },
      ]

      const mockPayments = [
        {
          journal_code: 'BANQUE',
          journal_lib: 'BQ',
          piece_num: 'PAY-001',
          piece_date: '2023-01-20',
          piece_lib: 'Paiement PAY-001',
          compte_num: '512',
          compte_lib: 'Banque',
          sens: 'D',
          debit: 1200,
          credit: 0,
          ecriture_lib: 'Paiement PAY-001',
          currency_code: 'EUR',
          ecriture_date: '2023-01-20',
        },
      ]

      // Mock des requêtes
      query
        .mockResolvedValueOnce({ rows: [mockCompany] }) // Company settings
        .mockResolvedValueOnce({ rows: mockInvoices }) // Invoices
        .mockResolvedValueOnce({ rows: mockPayments }) // Payments

      const result = await accountingExportService.generateFECExport(
        userId,
        startDate,
        endDate
      )

      expect(result.success).toBe(true)
      expect(result.filename).toContain(
        'FEC_12345678901234_20230101_20231231.txt'
      )
      expect(result.entryCount).toBeGreaterThan(0)
      expect(result.period).toEqual({ startDate, endDate })

      // Vérifier que le fichier a été créé
      expect(fs.writeFileSync).toHaveBeenCalled()
    })

    it('should throw error if company settings not found', async () => {
      const userId = 'user123'
      const startDate = new Date('2023-01-01')
      const endDate = new Date('2023-12-31')

      query.mockResolvedValueOnce({ rows: [] }) // No company settings

      await expect(
        accountingExportService.generateFECExport(userId, startDate, endDate)
      ).rejects.toThrow("Échec de la génération de l'export FEC")
    })

    it('should handle database errors', async () => {
      const userId = 'user123'
      const startDate = new Date('2023-01-01')
      const endDate = new Date('2023-12-31')

      query.mockRejectedValueOnce(new Error('Database error'))

      await expect(
        accountingExportService.generateFECExport(userId, startDate, endDate)
      ).rejects.toThrow("Échec de la génération de l'export FEC")
    })
  })

  describe('generateSalesCSV', () => {
    it('should generate sales CSV successfully', async () => {
      const userId = 'user123'
      const startDate = new Date('2023-01-01')
      const endDate = new Date('2023-12-31')

      const mockSales = [
        {
          invoice_number: 'FAC-2023-0001',
          invoice_date: '2023-01-15',
          client_name: 'Test Company',
          client_first_name: 'John',
          client_last_name: 'Doe',
          subtotal: 1000,
          vat_amount: 200,
          total_amount: 1200,
          status: 'paid',
          payment_status: 'paid',
          created_at: '2023-01-15',
        },
      ]

      query.mockResolvedValueOnce({ rows: mockSales })

      const result = await accountingExportService.generateSalesCSV(
        userId,
        startDate,
        endDate
      )

      expect(result.success).toBe(true)
      expect(result.filename).toContain('ventes_20230101_20231231.csv')
      expect(result.recordCount).toBe(1)
      expect(result.period).toEqual({ startDate, endDate })

      // Vérifier que le CSV writer a été appelé
      expect(csv.createObjectCsvWriter).toHaveBeenCalled()
    })

    it('should handle database errors in CSV generation', async () => {
      const userId = 'user123'
      const startDate = new Date('2023-01-01')
      const endDate = new Date('2023-12-31')

      query.mockRejectedValueOnce(new Error('Database error'))

      await expect(
        accountingExportService.generateSalesCSV(userId, startDate, endDate)
      ).rejects.toThrow("Échec de la génération de l'export CSV")
    })
  })

  describe('formatDateForFEC', () => {
    it('should format date correctly for FEC', () => {
      const date = new Date('2023-01-15')
      const result = accountingExportService.formatDateForFEC(date)
      expect(result).toBe('20230115')
    })

    it('should handle null date', () => {
      const result = accountingExportService.formatDateForFEC(null)
      expect(result).toBe('')
    })
  })

  describe('formatDateForFilename', () => {
    it('should format date correctly for filename', () => {
      const date = new Date('2023-01-15')
      const result = accountingExportService.formatDateForFilename(date)
      expect(result).toBe('20230115')
    })

    it('should handle null date', () => {
      const result = accountingExportService.formatDateForFilename(null)
      expect(result).toBe('')
    })
  })

  describe('formatAmount', () => {
    it('should format amount correctly', () => {
      expect(accountingExportService.formatAmount(1234.56)).toBe('1234,56')
      expect(accountingExportService.formatAmount(0)).toBe('0.00')
      expect(accountingExportService.formatAmount(null)).toBe('0.00')
    })
  })
})
