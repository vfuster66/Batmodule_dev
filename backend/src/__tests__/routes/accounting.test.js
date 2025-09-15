const request = require('supertest')
const express = require('express')
const accountingRouter = require('../../routes/accounting')
const { authenticateToken } = require('../../middleware/auth')
const accountingExportService = require('../../services/accountingExportService')
const { query } = require('../../config/database')
const fs = require('fs')

// Mock des dépendances
jest.mock('../../middleware/auth')
jest.mock('../../services/accountingExportService')
jest.mock('../../config/database')
jest.mock('fs')

const app = express()
app.use(express.json())
app.use('/accounting', accountingRouter)

describe('Accounting Routes', () => {
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

  describe('GET /accounting/fec', () => {
    it('should generate FEC export successfully', async () => {
      const mockResult = {
        filename: 'FEC_2023.txt',
        filepath: '/tmp/fec_2023.txt',
      }
      const mockFileContent = 'FEC content here'

      accountingExportService.generateFECExport.mockResolvedValueOnce(
        mockResult
      )
      fs.readFileSync.mockReturnValueOnce(mockFileContent)
      fs.unlinkSync.mockImplementation(() => {})

      const response = await request(app)
        .get('/accounting/fec?startDate=2023-01-01&endDate=2023-12-31')
        .expect(200)

      expect(accountingExportService.generateFECExport).toHaveBeenCalledWith(
        'test-user-id',
        new Date('2023-01-01'),
        new Date('2023-12-31')
      )
      expect(response.headers['content-type']).toBe('text/plain; charset=utf-8')
      expect(response.headers['content-disposition']).toBe(
        'attachment; filename="FEC_2023.txt"'
      )
      expect(response.text).toBe(mockFileContent)
    })

    it('should return 400 if startDate is missing', async () => {
      const response = await request(app)
        .get('/accounting/fec?endDate=2023-12-31')
        .expect(400)

      expect(response.body.error).toBe('Dates requises')
    })

    it('should return 400 if endDate is missing', async () => {
      const response = await request(app)
        .get('/accounting/fec?startDate=2023-01-01')
        .expect(400)

      expect(response.body.error).toBe('Dates requises')
    })

    it('should handle service errors', async () => {
      accountingExportService.generateFECExport.mockRejectedValueOnce(
        new Error('Service error')
      )

      const response = await request(app)
        .get('/accounting/fec?startDate=2023-01-01&endDate=2023-12-31')
        .expect(500)

      expect(response.body.error).toBe(
        "Erreur lors de la génération de l'export FEC"
      )
    })

    it('should clean up temporary file after sending', async () => {
      const mockResult = {
        filename: 'FEC_2023.txt',
        filepath: '/tmp/fec_2023.txt',
      }

      accountingExportService.generateFECExport.mockResolvedValueOnce(
        mockResult
      )
      fs.readFileSync.mockReturnValueOnce('FEC content')

      await request(app)
        .get('/accounting/fec?startDate=2023-01-01&endDate=2023-12-31')
        .expect(200)

      // Vérifier que la suppression est programmée
      setTimeout(() => {
        expect(fs.unlinkSync).toHaveBeenCalledWith('/tmp/fec_2023.txt')
      }, 6000)
    })
  })

  describe('GET /accounting/sales-csv', () => {
    it('should generate sales CSV export successfully', async () => {
      const mockResult = {
        filename: 'ventes_2023.csv',
        filepath: '/tmp/ventes_2023.csv',
      }
      const mockFileContent = 'CSV content here'

      accountingExportService.generateSalesCSV.mockResolvedValueOnce(mockResult)
      fs.readFileSync.mockReturnValueOnce(mockFileContent)

      const response = await request(app)
        .get('/accounting/sales-csv?startDate=2023-01-01&endDate=2023-12-31')
        .expect(200)

      expect(accountingExportService.generateSalesCSV).toHaveBeenCalledWith(
        'test-user-id',
        new Date('2023-01-01'),
        new Date('2023-12-31')
      )
      expect(response.headers['content-type']).toBe('text/csv; charset=utf-8')
      expect(response.headers['content-disposition']).toBe(
        'attachment; filename="ventes_2023.csv"'
      )
      expect(response.text).toBe(mockFileContent)
    })

    it('should return 400 if dates are missing', async () => {
      const response = await request(app)
        .get('/accounting/sales-csv')
        .expect(400)

      expect(response.body.error).toBe('Dates requises')
    })

    it('should handle service errors', async () => {
      accountingExportService.generateSalesCSV.mockRejectedValueOnce(
        new Error('Service error')
      )

      const response = await request(app)
        .get('/accounting/sales-csv?startDate=2023-01-01&endDate=2023-12-31')
        .expect(500)

      expect(response.body.error).toBe(
        "Erreur lors de la génération de l'export CSV"
      )
    })
  })

  describe('GET /accounting/statistics', () => {
    it('should return accounting statistics successfully', async () => {
      const mockStats = {
        rows: [
          {
            total_invoices: '10',
            total_revenue: '50000.00',
            total_vat: '10000.00',
            total_paid: '45000.00',
            average_invoice: '5000.00',
            paid_invoices: '8',
            pending_invoices: '2',
            overdue_invoices: '0',
          },
        ],
      }

      mockQuery.mockResolvedValueOnce(mockStats)

      const response = await request(app)
        .get('/accounting/statistics?startDate=2023-01-01&endDate=2023-12-31')
        .expect(200)

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['test-user-id', '2023-01-01', '2023-12-31']
      )

      expect(response.body.success).toBe(true)
      expect(response.body.data.period).toEqual({
        startDate: '2023-01-01',
        endDate: '2023-12-31',
      })
      expect(response.body.data.invoices.total).toBe(10)
      expect(response.body.data.amounts.totalRevenue).toBe(50000)
    })

    it('should return 400 if dates are missing', async () => {
      const response = await request(app)
        .get('/accounting/statistics')
        .expect(400)

      expect(response.body.error).toBe('Dates requises')
    })

    it('should handle database errors', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'))

      const response = await request(app)
        .get('/accounting/statistics?startDate=2023-01-01&endDate=2023-12-31')
        .expect(500)

      expect(response.body.error).toBe(
        'Erreur lors de la récupération des statistiques'
      )
    })

    it('should handle null values in statistics', async () => {
      const mockStats = {
        rows: [
          {
            total_invoices: '0',
            total_revenue: null,
            total_vat: null,
            total_paid: null,
            average_invoice: null,
            paid_invoices: '0',
            pending_invoices: '0',
            overdue_invoices: '0',
          },
        ],
      }

      mockQuery.mockResolvedValueOnce(mockStats)

      const response = await request(app)
        .get('/accounting/statistics?startDate=2023-01-01&endDate=2023-12-31')
        .expect(200)

      expect(response.body.data.amounts.totalRevenue).toBe(0)
      expect(response.body.data.amounts.totalVAT).toBe(0)
      expect(response.body.data.amounts.totalPaid).toBe(0)
      expect(response.body.data.amounts.averageInvoice).toBe(0)
    })
  })

  describe('Authentication', () => {
    it('should require authentication for all routes', async () => {
      authenticateToken.mockImplementationOnce((req, res, next) => {
        res.status(401).json({ error: 'Unauthorized' })
      })

      await request(app)
        .get('/accounting/fec?startDate=2023-01-01&endDate=2023-12-31')
        .expect(401)
    })
  })
})
