process.env.NODE_ENV = 'test'

const request = require('supertest')
const express = require('express')

jest.doMock('../../middleware/authSecure', () => ({
  authenticateSecure: (req, _res, next) => {
    req.user = {
      userId: 'u1',
      email: 'user@test.com',
      firstName: 'A',
      lastName: 'B',
      companyName: 'Co',
    }
    next()
  },
  optionalAuthSecure: (_req, _res, next) => next(),
  generateCSRFToken: (req, _res, next) => {
    req.csrfToken = 'csrf123'
    next()
  },
  verifyCSRF: (_req, _res, next) => next(),
}))

jest.doMock('../../config/database', () => ({
  query: jest.fn(),
}))
jest.doMock('bcryptjs', () => ({
  compare: jest.fn(async () => true),
  hash: jest.fn(async () => 'newhash'),
}))

const authSecureRouter = require('../../routes/authSecure')
const { query } = require('../../config/database')
const bcrypt = require('bcryptjs')

const app = express()
app.use(express.json())
// simple session stub middleware
app.use((req, _res, next) => {
  req.session = {
    cookie: {},
    regenerate: (cb) => cb && cb(null),
    destroy: (cb) => cb && cb(null),
  }
  next()
})
app.use('/auth', authSecureRouter)

describe('AuthSecure Routes (basic coverage)', () => {
  it('GET /auth/csrf returns csrf token', async () => {
    const res = await request(app).get('/auth/csrf').expect(200)
    expect(res.body).toHaveProperty('csrfToken', 'csrf123')
  })

  it('GET /auth/me returns current user', async () => {
    const res = await request(app).get('/auth/me').expect(200)
    expect(res.body).toHaveProperty('user.email', 'user@test.com')
  })

  it('POST /auth/logout destroys session', async () => {
    const res = await request(app).post('/auth/logout').expect(200)
    expect(res.body).toHaveProperty('message')
  })

  it('PUT /auth/change-password success', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ password_hash: 'hash' }] }) // load current
      .mockResolvedValueOnce({ rows: [] }) // update
    bcrypt.compare.mockResolvedValueOnce(true)
    await request(app)
      .put('/auth/change-password')
      .send({ currentPassword: 'old', newPassword: 'newpass123' })
      .expect(200)
  })

  it('DELETE /auth/account success', async () => {
    query.mockResolvedValueOnce({ rows: [] }) // delete user
    await request(app)
      .delete('/auth/account')
      .send({ confirm: true })
      .expect(200)
  })
})
