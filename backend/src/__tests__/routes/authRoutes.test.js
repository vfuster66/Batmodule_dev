// Force test env and mock dependencies before imports
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-secret'

const request = require('supertest')
const express = require('express')

jest.doMock('../../config/database', () => ({
  query: jest.fn(),
}))
jest.doMock('express-rate-limit', () => () => (req, res, next) => next())
jest.doMock('bcryptjs', () => ({
  hash: jest.fn(async () => 'hashed'),
  compare: jest.fn(async () => true),
}))
jest.doMock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'jwt-token'),
  verify: jest.fn(() => ({ userId: 'u1', email: 'user@test.com' })),
}))
jest.doMock('../../services/companySettingsService', () => ({
  createDefaultSettings: jest.fn(async () => undefined),
}))

const authRouter = require('../../routes/auth')
const { query } = require('../../config/database')
const jwt = require('jsonwebtoken')

const app = express()
app.use(express.json())
app.use('/auth', authRouter)

describe('Auth Routes (basic coverage)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('GET /auth/me returns 401 when token missing', async () => {
    await request(app).get('/auth/me').expect(401)
  })

  it('GET /auth/me returns 403 when token invalid', async () => {
    // ensureUserOptionalColumns
    query.mockResolvedValueOnce({ rows: [] })
    // Make jwt.verify throw a JWT error
    jwt.verify.mockImplementationOnce(() => {
      const e = new Error('bad')
      e.name = 'JsonWebTokenError'
      throw e
    })
    await request(app)
      .get('/auth/me')
      .set('Authorization', 'Bearer bad-token')
      .expect(403)
  })

  it('POST /auth/login returns 401 when user not found', async () => {
    query
      // ensureUserOptionalColumns
      .mockResolvedValueOnce({ rows: [] })
      // select user by email -> none
      .mockResolvedValueOnce({ rows: [] })

    await request(app)
      .post('/auth/login')
      .send({ email: 'user@test.com', password: 'secret' })
      .expect(401)
  })

  // Register duplicate case already well covered elsewhere; skipping here to avoid duplication.
})
