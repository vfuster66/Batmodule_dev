process.env.NODE_ENV = 'test'

const request = require('supertest')
const express = require('express')

// Mock dependencies before import
jest.doMock('../../middleware/auth', () => ({
  authenticateToken: (req, _res, next) => {
    req.user = { userId: 'user-1' }
    next()
  },
}))
jest.doMock('../../config/database', () => ({
  query: jest.fn(),
  transaction: jest.fn(),
}))
jest.doMock('../../services/calculationService', () => ({
  calculateTotals: jest.fn(() => ({
    subtotalHt: 0,
    totalVat: 0,
    totalTtc: 0,
    items: [],
  })),
}))

const creditsRouter = require('../../routes/credits')
const { query, transaction } = require('../../config/database')
const calculationService = require('../../services/calculationService')

const app = express()
app.use(express.json())
app.use('/credits', creditsRouter)

describe('Credits Routes (basic coverage)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('POST /credits/from-invoice/:id returns 404 when invoice not found', async () => {
    // ensureSchema calls (ALTER/CREATE) - just resolve a few times
    query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})

    // transaction that returns 404 path
    transaction.mockImplementation(async (cb) => {
      const client = { query: jest.fn().mockResolvedValueOnce({ rows: [] }) }
      return cb(client)
    })

    await request(app).post('/credits/from-invoice/inv-1').expect(404)
  })

  it('POST /credits/from-invoice/:id creates credit note successfully', async () => {
    // ensureSchema queries
    query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})

    // Mock calculated items to trigger insert loop
    calculationService.calculateTotals.mockReturnValueOnce({
      subtotalHt: 100,
      totalVat: 20,
      totalTtc: 120,
      items: [
        {
          quantity: -1,
          unitPriceHt: 100,
          unitPriceTtc: 120,
          vatRate: 20,
          totalHt: 100,
          totalTtc: 120,
        },
      ],
    })

    transaction.mockImplementation(async (cb) => {
      const client = { query: jest.fn() }
      // 1) Load invoice
      client.query
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'inv-1',
              title: 'T',
              description: 'D',
              invoice_number: 'F-1',
            },
          ],
        })
        // 2) Load items
        .mockResolvedValueOnce({
          rows: [
            {
              service_id: null,
              description: 'Desc',
              quantity: 1,
              unit_price_ht: 100,
              vat_rate: 20,
              sort_order: 0,
            },
          ],
        })
        // 3) settings FOR UPDATE
        .mockResolvedValueOnce({
          rows: [{ credit_prefix: 'AVO', credit_counter: 0 }],
        })
        // 4) count year
        .mockResolvedValueOnce({ rows: [{ cnt: '0' }] })
        // 5) update counter
        .mockResolvedValueOnce({ rows: [] })
        // 6) insert credit note
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'c1',
              credit_number: 'AVO-2025-0001',
              invoice_id: 'inv-1',
              title: 'Avoir - T',
              description: 'D',
              subtotal_ht: 100,
              total_vat: 20,
              total_ttc: 120,
              notes: 'Avoir basé sur la facture F-1',
              created_at: 'now',
              updated_at: 'now',
            },
          ],
        })
        // 7) insert credit item
        .mockResolvedValueOnce({ rows: [] })

      return cb(client)
    })

    const res = await request(app)
      .post('/credits/from-invoice/inv-1')
      .expect(201)
    expect(res.body).toHaveProperty('credit')
    expect(res.body.credit).toHaveProperty('creditNumber', 'AVO-2025-0001')
  })
})
