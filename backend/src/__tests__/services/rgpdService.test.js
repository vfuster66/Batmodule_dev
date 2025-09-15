// Mock des modules AVANT qu'ils soient chargés
jest.mock('../../config/database', () => ({
  query: jest.fn(),
  transaction: jest.fn(),
}))

jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    writeFile: jest.fn(),
  },
}))

jest.mock('../../services/archivingService', () => ({
  purgeArchives: jest.fn(),
}))

// Import des modules après les mocks
const rgpdService = require('../../services/rgpdService')
const { query, transaction } = require('../../config/database')
const fs = require('fs')
const archivingService = require('../../services/archivingService')

describe('RGPDService', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Mock par défaut pour fs.promises
    fs.promises.mkdir.mockResolvedValue()
    fs.promises.writeFile.mockResolvedValue()

    // Mock par défaut pour archivingService
    archivingService.purgeArchives.mockResolvedValue({
      purgedCount: 5,
      errors: [],
      cutoffDate: new Date(),
    })
  })

  describe('exportUserData', () => {
    it('should export all user data successfully', async () => {
      const userId = 'user123'
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        company_name: 'Test Company',
        phone: '0123456789',
        address: '123 Test St',
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-01'),
      }

      const mockCompanySettings = {
        id: 'settings-1',
        user_id: userId,
        company_name: 'Test Company',
        primary_color: '#004AAD',
      }

      const mockClients = [
        {
          id: 'client-1',
          user_id: userId,
          first_name: 'Client',
          last_name: 'One',
          company_name: 'Client Company',
          email: 'client@example.com',
        },
      ]

      const mockServices = [
        {
          id: 'service-1',
          user_id: userId,
          name: 'Test Service',
          description: 'Service description',
        },
      ]

      const mockQuotes = [
        {
          id: 'quote-1',
          user_id: userId,
          quote_number: 'DEV-2023-0001',
          title: 'Test Quote',
          client_first_name: 'Client',
          client_last_name: 'One',
          client_company: 'Client Company',
        },
      ]

      const mockQuoteItems = [
        {
          id: 'item-1',
          quote_id: 'quote-1',
          description: 'Test Item',
          quantity: 1,
          unit_price_ht: 1000,
          quote_number: 'DEV-2023-0001',
          quote_title: 'Test Quote',
        },
      ]

      const mockInvoices = [
        {
          id: 'invoice-1',
          user_id: userId,
          invoice_number: 'FAC-2023-0001',
          title: 'Test Invoice',
          client_first_name: 'Client',
          client_last_name: 'One',
          client_company: 'Client Company',
        },
      ]

      const mockInvoiceItems = [
        {
          id: 'item-1',
          invoice_id: 'invoice-1',
          description: 'Test Item',
          quantity: 1,
          unit_price_ht: 1000,
          invoice_number: 'FAC-2023-0001',
          invoice_title: 'Test Invoice',
        },
      ]

      const mockPayments = [
        {
          id: 'payment-1',
          invoice_id: 'invoice-1',
          amount: 1200,
          payment_date: new Date('2023-01-15'),
          invoice_number: 'FAC-2023-0001',
          invoice_title: 'Test Invoice',
        },
      ]

      const mockCredits = [
        {
          id: 'credit-1',
          user_id: userId,
          invoice_id: 'invoice-1',
          amount: 100,
          invoice_number: 'FAC-2023-0001',
          invoice_title: 'Test Invoice',
        },
      ]

      const mockInvoiceHistory = [
        {
          id: 'history-1',
          invoice_id: 'invoice-1',
          status: 'paid',
          changed_at: new Date('2023-01-15'),
          invoice_number: 'FAC-2023-0001',
          invoice_title: 'Test Invoice',
        },
      ]

      // Mock des requêtes
      query
        .mockResolvedValueOnce({ rows: [mockUser] }) // User
        .mockResolvedValueOnce({ rows: [mockCompanySettings] }) // Company settings
        .mockResolvedValueOnce({ rows: mockClients }) // Clients
        .mockResolvedValueOnce({ rows: mockServices }) // Services
        .mockResolvedValueOnce({ rows: mockQuotes }) // Quotes
        .mockResolvedValueOnce({ rows: mockQuoteItems }) // Quote items
        .mockResolvedValueOnce({ rows: mockInvoices }) // Invoices
        .mockResolvedValueOnce({ rows: mockInvoiceItems }) // Invoice items
        .mockResolvedValueOnce({ rows: mockPayments }) // Payments
        .mockResolvedValueOnce({ rows: mockCredits }) // Credits
        .mockResolvedValueOnce({ rows: mockInvoiceHistory }) // Invoice history

      const result = await rgpdService.exportUserData(userId)

      expect(result.user).toMatchObject(mockUser)
      expect(result.companySettings).toMatchObject(mockCompanySettings)
      expect(result.clients).toHaveLength(1)
      expect(result.services).toHaveLength(1)
      expect(result.quotes).toHaveLength(1)
      expect(result.quoteItems).toHaveLength(1)
      expect(result.invoices).toHaveLength(1)
      expect(result.invoiceItems).toHaveLength(1)
      expect(result.payments).toHaveLength(1)
      expect(result.credits).toHaveLength(1)
      expect(result.invoiceHistory).toHaveLength(1)
      expect(result.exportMetadata).toMatchObject({
        userId,
        version: '1.0',
        dataTypes: expect.arrayContaining([
          'user',
          'companySettings',
          'clients',
          'services',
          'quotes',
          'quoteItems',
          'invoices',
          'invoiceItems',
          'payments',
          'credits',
          'invoiceHistory',
        ]),
      })
    })

    it('should handle database errors', async () => {
      const userId = 'user123'
      query.mockRejectedValueOnce(new Error('Database error'))

      await expect(rgpdService.exportUserData(userId)).rejects.toThrow(
        "Échec de l'export des données utilisateur"
      )
    })
  })

  describe('saveExportToFile', () => {
    it('should save export to file successfully', async () => {
      const userId = 'user123'
      const exportData = {
        user: { id: userId, email: 'test@example.com' },
        exportMetadata: { exportDate: new Date().toISOString() },
      }

      const result = await rgpdService.saveExportToFile(userId, exportData)

      expect(result).toContain('export_user_user123_')
      expect(result).toContain('.json')
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('export_user_user123_'),
        JSON.stringify(exportData, null, 2),
        'utf8'
      )
    })

    it('should handle file save errors', async () => {
      const userId = 'user123'
      const exportData = { user: { id: userId } }
      fs.promises.writeFile.mockRejectedValueOnce(new Error('File write error'))

      await expect(
        rgpdService.saveExportToFile(userId, exportData)
      ).rejects.toThrow("Échec de la sauvegarde de l'export")
    })
  })

  describe('deleteUserData', () => {
    it('should delete user data with accounting data kept', async () => {
      const userId = 'user123'
      const keepAccountingData = true

      transaction.mockImplementation(async (callback) => {
        const mockClient = {
          query: jest
            .fn()
            .mockResolvedValueOnce({ rowCount: 2 }) // Quote items
            .mockResolvedValueOnce({ rowCount: 1 }) // Quotes
            .mockResolvedValueOnce({ rowCount: 3 }) // Clients
            .mockResolvedValueOnce({ rowCount: 2 }) // Services
            .mockResolvedValueOnce({ rowCount: 1 }) // Company settings
            .mockResolvedValueOnce({ rowCount: 1 }), // User update
        }
        return await callback(mockClient)
      })

      const result = await rgpdService.deleteUserData(
        userId,
        keepAccountingData
      )

      expect(result.success).toBe(true)
      expect(result.keepAccountingData).toBe(true)
      expect(result.deletedData).toMatchObject({
        quoteItems: 2,
        quotes: 1,
        clients: 3,
        services: 2,
        companySettings: 1,
        user: 1,
      })
      expect(result.deletionDate).toBeDefined()
    })

    it('should delete user data including accounting data', async () => {
      const userId = 'user123'
      const keepAccountingData = false

      transaction.mockImplementation(async (callback) => {
        const mockClient = {
          query: jest
            .fn()
            .mockResolvedValueOnce({ rowCount: 1 }) // Invoice history
            .mockResolvedValueOnce({ rowCount: 2 }) // Invoice items
            .mockResolvedValueOnce({ rowCount: 1 }) // Payments
            .mockResolvedValueOnce({ rowCount: 1 }) // Credits
            .mockResolvedValueOnce({ rowCount: 1 }) // Invoices
            .mockResolvedValueOnce({ rowCount: 2 }) // Quote items
            .mockResolvedValueOnce({ rowCount: 1 }) // Quotes
            .mockResolvedValueOnce({ rowCount: 3 }) // Clients
            .mockResolvedValueOnce({ rowCount: 2 }) // Services
            .mockResolvedValueOnce({ rowCount: 1 }) // Company settings
            .mockResolvedValueOnce({ rowCount: 1 }), // User update
        }
        return await callback(mockClient)
      })

      const result = await rgpdService.deleteUserData(
        userId,
        keepAccountingData
      )

      expect(result.success).toBe(true)
      expect(result.keepAccountingData).toBe(false)
      expect(result.deletedData).toMatchObject({
        invoiceHistory: 1,
        invoiceItems: 2,
        payments: 1,
        credits: 1,
        invoices: 1,
        quoteItems: 2,
        quotes: 1,
        clients: 3,
        services: 2,
        companySettings: 1,
        user: 1,
      })
    })

    it('should handle database errors', async () => {
      const userId = 'user123'
      transaction.mockRejectedValueOnce(new Error('Database error'))

      await expect(rgpdService.deleteUserData(userId)).rejects.toThrow(
        'Échec de la suppression des données utilisateur'
      )
    })
  })

  describe('purgeDataByRetentionPolicy', () => {
    it('should purge data according to retention policy', async () => {
      const retentionPolicy = {
        prospectionYears: 3,
        accountingYears: 10,
        logsYears: 1,
      }

      query
        .mockResolvedValueOnce({ rowCount: 5 }) // Old quotes
        .mockResolvedValueOnce({ rowCount: 3 }) // Old clients
        .mockResolvedValueOnce({ rowCount: 10 }) // Old logs

      const result =
        await rgpdService.purgeDataByRetentionPolicy(retentionPolicy)

      expect(result.success).toBe(true)
      expect(result.purgeResults).toMatchObject({
        oldQuotes: 5,
        oldClients: 3,
        oldLogs: 10,
        archives: {
          purgedCount: 5,
          errors: [],
          cutoffDate: expect.any(Date),
        },
      })
      expect(result.retentionPolicy).toEqual(retentionPolicy)
      expect(result.purgeDate).toBeDefined()
    })

    it('should use default retention policy', async () => {
      query
        .mockResolvedValueOnce({ rowCount: 2 }) // Old quotes
        .mockResolvedValueOnce({ rowCount: 1 }) // Old clients
        .mockResolvedValueOnce({ rowCount: 5 }) // Old logs

      const result = await rgpdService.purgeDataByRetentionPolicy()

      expect(result.success).toBe(true)
      expect(typeof result.retentionPolicy).toBe('object') // Should return retention policy object
    })

    it('should handle database errors', async () => {
      query.mockRejectedValueOnce(new Error('Database error'))

      await expect(rgpdService.purgeDataByRetentionPolicy()).rejects.toThrow(
        'Échec de la purge des données'
      )
    })
  })

  describe('generateRGPDComplianceReport', () => {
    it('should generate RGPD compliance report for all users', async () => {
      const mockStats = {
        total_users: '5',
        total_clients: '25',
        total_quotes: '50',
        total_invoices: '30',
        total_payments: '25',
      }

      const mockUsersData = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          created_at: new Date('2023-01-01'),
          client_count: '5',
          quote_count: '10',
          invoice_count: '6',
          last_invoice_date: new Date('2023-12-01'),
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          created_at: new Date('2023-02-01'),
          client_count: '3',
          quote_count: '8',
          invoice_count: '4',
          last_invoice_date: new Date('2023-11-15'),
        },
      ]

      query
        .mockResolvedValueOnce({ rows: [mockStats] }) // Statistics
        .mockResolvedValueOnce({ rows: mockUsersData }) // Users data

      const result = await rgpdService.generateRGPDComplianceReport()

      expect(result.reportDate).toBeDefined()
      expect(result.statistics).toMatchObject(mockStats)
      expect(result.usersData).toHaveLength(2)
      expect(result.complianceChecks).toMatchObject({
        dataMinimization: 'OK',
        purposeLimitation: 'OK',
        storageLimitation: 'OK',
        accuracy: 'OK',
        security: 'OK',
      })
      expect(result.recommendations).toHaveLength(4)
      expect(result.recommendations).toContain(
        'Mettre en place une politique de rétention des données'
      )
    })

    it('should generate RGPD compliance report for specific user', async () => {
      const userId = 'user123'
      const mockStats = {
        total_users: '1',
        total_clients: '5',
        total_quotes: '10',
        total_invoices: '6',
        total_payments: '5',
      }

      const mockUsersData = [
        {
          id: userId,
          email: 'user@example.com',
          created_at: new Date('2023-01-01'),
          client_count: '5',
          quote_count: '10',
          invoice_count: '6',
          last_invoice_date: new Date('2023-12-01'),
        },
      ]

      query
        .mockResolvedValueOnce({ rows: [mockStats] }) // Statistics
        .mockResolvedValueOnce({ rows: mockUsersData }) // Users data

      const result = await rgpdService.generateRGPDComplianceReport(userId)

      expect(result.statistics).toMatchObject(mockStats)
      expect(result.usersData).toHaveLength(1)
      expect(result.usersData[0].id).toBe(userId)
    })

    it('should handle database errors', async () => {
      query.mockRejectedValueOnce(new Error('Database error'))

      await expect(rgpdService.generateRGPDComplianceReport()).rejects.toThrow(
        'Échec de la génération du rapport RGPD'
      )
    })
  })

  describe('ensureExportDir', () => {
    it('should handle directory creation errors', async () => {
      // Mock fs.mkdir to throw an error
      fs.promises.mkdir.mockRejectedValueOnce(new Error('Permission denied'))

      // This should not throw an error, just log it
      await expect(rgpdService.ensureExportDir()).resolves.toBeUndefined()
    })
  })
})
