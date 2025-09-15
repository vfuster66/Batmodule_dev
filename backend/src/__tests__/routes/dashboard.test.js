const request = require('supertest')
const express = require('express')
const dashboardRouter = require('../../routes/dashboard')
const { authenticateToken } = require('../../middleware/auth')
const { query } = require('../../config/database')

jest.mock('../../middleware/auth')
jest.mock('../../config/database')

const app = express()
app.use(express.json())
app.use('/dashboard', dashboardRouter)

describe('Dashboard Routes', () => {
  let mockQuery

  beforeEach(() => {
    jest.clearAllMocks()
    mockQuery = jest.fn()
    query.mockImplementation(mockQuery)
    authenticateToken.mockImplementation((req, res, next) => {
      req.user = { userId: 'test-user-id' }
      next()
    })
  })

  describe('GET /dashboard/stats', () => {
    it('returns stats', async () => {
      // 1 clients
      mockQuery.mockResolvedValueOnce({ rows: [{ c: 25 }] })
      // 2 sent quotes
      mockQuery.mockResolvedValueOnce({ rows: [{ c: 10 }] })
      // 3 accepted quotes
      mockQuery.mockResolvedValueOnce({ rows: [{ c: 5 }] })
      // 4 monthly revenue
      mockQuery.mockResolvedValueOnce({ rows: [{ sum: '25000.00' }] })
      // 5 yearly revenue
      mockQuery.mockResolvedValueOnce({ rows: [{ sum: '150000.00' }] })
      // 6 sent invoices
      mockQuery.mockResolvedValueOnce({ rows: [{ c: 12 }] })
      // 7 paid invoices
      mockQuery.mockResolvedValueOnce({ rows: [{ c: 8 }] })
      // 8 follow-ups needed
      mockQuery.mockResolvedValueOnce({ rows: [{ c: 2 }] })
      // 9 overdue invoices
      mockQuery.mockResolvedValueOnce({ rows: [{ c: 1 }] })

      const res = await request(app).get('/dashboard/stats').expect(200)
      expect(res.body.clients).toBe(25)
      expect(res.body.sentQuotes).toBe(10)
      expect(res.body.acceptedQuotes).toBe(5)
      expect(res.body.monthlyRevenue).toBe(25000)
      expect(res.body.yearlyRevenue).toBe(150000)
      expect(res.body.overdueInvoices).toBe(1)
    })

    it('handles DB errors', async () => {
      mockQuery.mockRejectedValueOnce(new Error('db'))
      await request(app).get('/dashboard/stats').expect(500)
    })
  })

  describe('GET /dashboard/recent-activity', () => {
    it('returns recent activity from clients, quotes, invoices', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            type: 'client',
            id: 'c1',
            label: 'John D',
            created_at: '2023-01-01T00:00:00Z',
          },
        ],
      })
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            type: 'quote',
            id: 'q1',
            label: 'DEV-001',
            created_at: '2023-01-02T00:00:00Z',
          },
        ],
      })
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            type: 'invoice',
            id: 'i1',
            label: 'FAC-001',
            created_at: '2023-01-03T00:00:00Z',
          },
        ],
      })
      const res = await request(app)
        .get('/dashboard/recent-activity')
        .expect(200)
      expect(res.body.activities.length).toBeGreaterThan(0)
    })

    it('handles DB errors', async () => {
      mockQuery.mockRejectedValueOnce(new Error('db'))
      await request(app).get('/dashboard/recent-activity').expect(500)
    })
  })

  describe('GET /dashboard/analytics', () => {
    it('returns analytics data', async () => {
      // revenueByMonth
      mockQuery.mockResolvedValueOnce({
        rows: [{ label: '2023-01', value: '1000.00' }],
      })
      // quotesMonthly
      mockQuery.mockResolvedValueOnce({
        rows: [{ label: '2023-01', accepted: 2, sent: 5 }],
      })
      // topClients90
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'c1',
            first_name: 'John',
            last_name: 'Doe',
            company_name: 'ACME',
            total: '5000.00',
          },
        ],
      })
      // outstandingAging buckets
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            o0_30: '100.00',
            o31_60: '200.00',
            o61_90: '300.00',
            o90_plus: '400.00',
            due_soon: '50.00',
          },
        ],
      })
      // pipelineSentByMonth
      mockQuery.mockResolvedValueOnce({
        rows: [{ label: '2023-01', value: '2000.00' }],
      })

      const res = await request(app).get('/dashboard/analytics').expect(200)
      expect(res.body.revenueByMonth[0]).toMatchObject({
        label: '2023-01',
        value: 1000,
      })
      expect(res.body.quotesMonthly[0]).toMatchObject({
        label: '2023-01',
        accepted: 2,
        sent: 5,
      })
      expect(res.body.pipelineSentByMonth[0]).toMatchObject({
        label: '2023-01',
        value: 2000,
      })
      expect(res.body.topClients90[0]).toMatchObject({
        id: 'c1',
        name: 'John Doe',
        company: 'ACME',
        total: 5000,
      })
      expect(res.body.outstandingAging).toMatchObject({
        o0_30: 100,
        o31_60: 200,
        o61_90: 300,
        o90_plus: 400,
        dueSoon: 50,
      })
    })

    it('handles DB errors', async () => {
      mockQuery.mockRejectedValueOnce(new Error('db'))
      await request(app).get('/dashboard/analytics').expect(500)
    })
  })
})
