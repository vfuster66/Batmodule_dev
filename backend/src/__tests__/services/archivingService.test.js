// Mock des modules AVANT qu'ils soient chargés
jest.mock('crypto', () => ({
  createHash: jest.fn(),
}))

jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    writeFile: jest.fn(),
    readFile: jest.fn(),
    unlink: jest.fn(),
  },
}))

jest.mock('../../config/database', () => ({
  query: jest.fn(),
}))

// Import des modules après les mocks
const archivingService = require('../../services/archivingService')
const crypto = require('crypto')
const fs = require('fs')
const { query } = require('../../config/database')

describe('ArchivingService', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Mock par défaut pour crypto
    const mockHash = {
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('abc123def456'),
    }
    crypto.createHash.mockReturnValue(mockHash)

    // Mock par défaut pour fs.promises
    fs.promises.mkdir.mockResolvedValue()
    fs.promises.writeFile.mockResolvedValue()
    fs.promises.readFile.mockResolvedValue(Buffer.from('fake pdf content'))
    fs.promises.unlink.mockResolvedValue()

    // Mock par défaut pour query
    query.mockResolvedValue({ rows: [] })
  })

  describe('archiveInvoice', () => {
    it('should archive invoice successfully', async () => {
      const invoice = {
        id: 'invoice-1',
        invoice_number: 'FAC-2023-0001',
      }
      const pdfBuffer = Buffer.from('fake pdf content')
      const companySettings = {
        company_name: 'Test Company',
      }

      const mockHash = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('abc123def456'),
      }
      crypto.createHash.mockReturnValue(mockHash)

      query.mockResolvedValueOnce({ rows: [] }) // UPDATE invoice
      query.mockResolvedValueOnce({ rows: [] }) // logInvoiceEvent

      const result = await archivingService.archiveInvoice(
        invoice,
        pdfBuffer,
        companySettings
      )

      expect(result.hash).toBe('abc123def456')
      expect(result.fileName).toBe('facture_FAC-2023-0001_invoice-1.pdf')
      expect(result.filePath).toContain('facture_FAC-2023-0001_invoice-1.pdf')
      expect(result.archivedAt).toBeInstanceOf(Date)

      expect(fs.promises.writeFile).toHaveBeenCalled()
      expect(query).toHaveBeenCalledTimes(2)
    })

    it('should handle archiving errors', async () => {
      const invoice = {
        id: 'invoice-1',
        invoice_number: 'FAC-2023-0001',
      }
      const pdfBuffer = Buffer.from('fake pdf content')
      const companySettings = {}

      fs.promises.writeFile.mockRejectedValueOnce(new Error('File write error'))

      await expect(
        archivingService.archiveInvoice(invoice, pdfBuffer, companySettings)
      ).rejects.toThrow("Échec de l'archivage de la facture")
    })
  })

  describe('verifyInvoiceIntegrity', () => {
    it('should verify invoice integrity successfully', async () => {
      const invoiceId = 'invoice-1'
      const mockInvoice = {
        pdf_hash: 'abc123def456',
        pdf_storage_path: '/archives/facture_FAC-2023-0001_invoice-1.pdf',
        is_archived: true,
      }

      query.mockResolvedValueOnce({ rows: [mockInvoice] })

      const result = await archivingService.verifyInvoiceIntegrity(invoiceId)

      expect(result.valid).toBe(true)
      expect(result.storedHash).toBe('abc123def456')
      expect(result.currentHash).toBe('abc123def456')
      expect(result.filePath).toBe(
        '/archives/facture_FAC-2023-0001_invoice-1.pdf'
      )
    })

    it('should return invalid if invoice not found', async () => {
      const invoiceId = 'non-existent'
      query.mockResolvedValueOnce({ rows: [] })

      const result = await archivingService.verifyInvoiceIntegrity(invoiceId)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Facture non trouvée')
    })

    it('should return invalid if invoice not archived', async () => {
      const invoiceId = 'invoice-1'
      const mockInvoice = {
        pdf_hash: null,
        pdf_storage_path: null,
        is_archived: false,
      }

      query.mockResolvedValueOnce({ rows: [mockInvoice] })

      const result = await archivingService.verifyInvoiceIntegrity(invoiceId)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Facture non archivée')
    })

    it('should handle verification errors', async () => {
      const invoiceId = 'invoice-1'
      query.mockRejectedValueOnce(new Error('Database error'))

      const result = await archivingService.verifyInvoiceIntegrity(invoiceId)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Erreur de vérification')
    })
  })

  describe('logInvoiceEvent', () => {
    it('should log invoice event successfully', async () => {
      const invoiceId = 'invoice-1'
      const status = 'paid'
      const userId = 'user123'
      const notes = 'Payment received'
      const ipAddress = '192.168.1.1'
      const userAgent = 'Mozilla/5.0'

      query.mockResolvedValueOnce({ rows: [] })

      await archivingService.logInvoiceEvent(
        invoiceId,
        status,
        userId,
        notes,
        ipAddress,
        userAgent
      )

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO invoice_status_history'),
        [invoiceId, status, userId, notes, ipAddress, userAgent]
      )
    })

    it('should handle logging errors gracefully', async () => {
      const invoiceId = 'invoice-1'
      const status = 'paid'

      query.mockRejectedValueOnce(new Error('Database error'))

      // Should not throw error
      await expect(
        archivingService.logInvoiceEvent(invoiceId, status)
      ).resolves.toBeUndefined()
    })
  })

  describe('getInvoiceHistory', () => {
    it('should return invoice history', async () => {
      const invoiceId = 'invoice-1'
      const mockHistory = [
        {
          id: 'event-1',
          status: 'created',
          changed_at: new Date('2023-01-01'),
          notes: 'Invoice created',
          first_name: 'John',
          last_name: 'Doe',
        },
        {
          id: 'event-2',
          status: 'paid',
          changed_at: new Date('2023-01-02'),
          notes: 'Payment received',
          first_name: 'John',
          last_name: 'Doe',
        },
      ]

      query.mockResolvedValueOnce({ rows: mockHistory })

      const result = await archivingService.getInvoiceHistory(invoiceId)

      expect(result).toHaveLength(2)
      expect(result[0].status).toBe('created')
      expect(result[1].status).toBe('paid')
    })

    it('should return empty array on error', async () => {
      const invoiceId = 'invoice-1'
      query.mockRejectedValueOnce(new Error('Database error'))

      const result = await archivingService.getInvoiceHistory(invoiceId)

      expect(result).toEqual([])
    })
  })

  describe('generateAuditReport', () => {
    it('should generate audit report for all users', async () => {
      const startDate = new Date('2023-01-01')
      const endDate = new Date('2023-12-31')

      const mockInvoices = [
        {
          id: 'invoice-1',
          invoice_number: 'FAC-2023-0001',
          status: 'paid',
          total_ttc: 1200,
          created_at: new Date('2023-01-15'),
          archived_at: new Date('2023-01-16'),
          is_archived: true,
          pdf_hash: 'abc123',
          client_first_name: 'John',
          client_last_name: 'Doe',
          client_company: 'Test Company',
        },
        {
          id: 'invoice-2',
          invoice_number: 'FAC-2023-0002',
          status: 'pending',
          total_ttc: 800,
          created_at: new Date('2023-02-15'),
          archived_at: null,
          is_archived: false,
          pdf_hash: null,
          client_first_name: 'Jane',
          client_last_name: 'Smith',
          client_company: 'Another Company',
        },
      ]

      query.mockResolvedValueOnce({ rows: mockInvoices })

      const result = await archivingService.generateAuditReport(
        startDate,
        endDate
      )

      expect(result.period).toEqual({ startDate, endDate })
      expect(result.totalInvoices).toBe(2)
      expect(result.archivedInvoices).toBe(1)
      expect(result.totalAmount).toBe(2000)
      expect(result.invoices).toHaveLength(2)
    })

    it('should generate audit report for specific user', async () => {
      const startDate = new Date('2023-01-01')
      const endDate = new Date('2023-12-31')
      const userId = 'user123'

      const mockInvoices = [
        {
          id: 'invoice-1',
          invoice_number: 'FAC-2023-0001',
          status: 'paid',
          total_ttc: 1200,
          created_at: new Date('2023-01-15'),
          archived_at: new Date('2023-01-16'),
          is_archived: true,
          pdf_hash: 'abc123',
          client_first_name: 'John',
          client_last_name: 'Doe',
          client_company: 'Test Company',
        },
      ]

      query.mockResolvedValueOnce({ rows: mockInvoices })

      const result = await archivingService.generateAuditReport(
        startDate,
        endDate,
        userId
      )

      expect(result.period).toEqual({ startDate, endDate })
      expect(result.totalInvoices).toBe(1)
      expect(result.archivedInvoices).toBe(1)
      expect(result.totalAmount).toBe(1200)
    })

    it('should handle audit report errors', async () => {
      const startDate = new Date('2023-01-01')
      const endDate = new Date('2023-12-31')

      query.mockRejectedValueOnce(new Error('Database error'))

      await expect(
        archivingService.generateAuditReport(startDate, endDate)
      ).rejects.toThrow("Échec de la génération du rapport d'audit")
    })
  })

  describe('purgeArchives', () => {
    it('should purge archives successfully', async () => {
      const retentionYears = 5
      const mockInvoices = [
        {
          id: 'invoice-1',
          pdf_storage_path: '/archives/old_invoice_1.pdf',
        },
        {
          id: 'invoice-2',
          pdf_storage_path: '/archives/old_invoice_2.pdf',
        },
      ]

      query.mockResolvedValueOnce({ rows: mockInvoices })
      query.mockResolvedValue({ rows: [] }) // UPDATE queries

      const result = await archivingService.purgeArchives(retentionYears)

      expect(result.purgedCount).toBe(2)
      expect(result.errors).toHaveLength(0)
      expect(result.cutoffDate).toBeInstanceOf(Date)
      expect(fs.promises.unlink).toHaveBeenCalledTimes(2)
    })

    it('should handle purge errors gracefully', async () => {
      const retentionYears = 5
      const mockInvoices = [
        {
          id: 'invoice-1',
          pdf_storage_path: '/archives/old_invoice_1.pdf',
        },
      ]

      query.mockResolvedValueOnce({ rows: mockInvoices })
      fs.promises.unlink.mockRejectedValueOnce(new Error('File not found'))
      query.mockResolvedValue({ rows: [] }) // UPDATE queries

      const result = await archivingService.purgeArchives(retentionYears)

      expect(result.purgedCount).toBe(0)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].invoiceId).toBe('invoice-1')
      expect(result.errors[0].error).toBe('File not found')
    })

    it('should handle purge database errors', async () => {
      const retentionYears = 5
      query.mockRejectedValueOnce(new Error('Database error'))

      await expect(
        archivingService.purgeArchives(retentionYears)
      ).rejects.toThrow('Échec de la purge des archives')
    })
  })

  describe('ensureArchiveDir', () => {
    it('should handle directory creation errors', async () => {
      // Mock fs.mkdir to throw an error
      fs.promises.mkdir.mockRejectedValueOnce(new Error('Permission denied'))

      // This should not throw an error, just log it
      await expect(archivingService.ensureArchiveDir()).resolves.toBeUndefined()
    })
  })
})
