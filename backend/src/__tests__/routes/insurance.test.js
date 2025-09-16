/* eslint-disable no-unused-vars */
const request = require('supertest')
const express = require('express')
const insuranceRouter = require('../../routes/insurance')
const { authenticateToken } = require('../../middleware/auth')
const insuranceService = require('../../services/insuranceService')

jest.mock('../../middleware/auth')
jest.mock('../../services/insuranceService')

const app = express()
app.use(express.json())
app.use('/insurance', insuranceRouter)

describe('Insurance Routes (service-based)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    authenticateToken.mockImplementation((req, res, next) => {
      req.user = { userId: 'test-user-id' }
      next()
    })
  })

  describe('GET /insurance', () => {
    it('returns insurances', async () => {
      insuranceService.getInsurances.mockResolvedValueOnce([
        { id: 'ins-1', certificateType: 'decennale' },
        { id: 'ins-2', certificateType: 'rc_pro' },
      ])
      const res = await request(app).get('/insurance').expect(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveLength(2)
      expect(res.body.count).toBe(2)
    })

    it('handles errors', async () => {
      insuranceService.getInsurances.mockRejectedValueOnce(new Error('boom'))
      await request(app).get('/insurance').expect(500)
    })
  })

  describe('GET /insurance/:id', () => {
    it('returns insurance by id', async () => {
      insuranceService.getInsuranceById.mockResolvedValueOnce({
        id: 'ins-1',
        certificateType: 'decennale',
      })
      const res = await request(app).get('/insurance/ins-1').expect(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.id).toBe('ins-1')
    })

    it('404 when not found', async () => {
      insuranceService.getInsuranceById.mockRejectedValueOnce(
        new Error('Assurance non trouvée')
      )
      await request(app).get('/insurance/unknown').expect(404)
    })
  })

  describe('POST /insurance', () => {
    it('creates insurance', async () => {
      const payload = {
        certificateType: 'decennale',
        certificateNumber: 'C-123',
        insuranceCompany: 'Assureur',
        startDate: '2023-01-01',
        endDate: '2024-01-01',
      }
      insuranceService.createInsurance.mockResolvedValueOnce({
        id: 'ins-3',
        ...payload,
        isActive: true,
      })
      const res = await request(app)
        .post('/insurance')
        .send(payload)
        .expect(201)
      expect(res.body.success).toBe(true)
      expect(res.body.message).toBe('Assurance créée avec succès')
      expect(res.body.data.id).toBe('ins-3')
    })

    it('validates payload', async () => {
      await request(app)
        .post('/insurance')
        .send({ certificateType: 'invalid' })
        .expect(400)
    })
  })

  describe('PUT /insurance/:id', () => {
    it('updates insurance', async () => {
      const update = { insuranceCompany: 'New Co' }
      insuranceService.updateInsurance.mockResolvedValueOnce({
        id: 'ins-1',
        ...update,
      })
      const res = await request(app)
        .put('/insurance/ins-1')
        .send(update)
        .expect(200)
      expect(res.body.success).toBe(true)
      expect(res.body.message).toBe('Assurance mise à jour avec succès')
    })

    it('404 when not found', async () => {
      insuranceService.updateInsurance.mockRejectedValueOnce(
        new Error('Assurance non trouvée')
      )
      await request(app)
        .put('/insurance/unknown')
        .send({ insuranceCompany: 'X' })
        .expect(404)
    })

    it('validates payload', async () => {
      await request(app)
        .put('/insurance/ins-1')
        .send({ certificateType: 'invalid' })
        .expect(400)
    })
  })

  describe('DELETE /insurance/:id', () => {
    it('deletes insurance', async () => {
      insuranceService.deleteInsurance.mockResolvedValueOnce(true)
      const res = await request(app).delete('/insurance/ins-1').expect(200)
      expect(res.body.success).toBe(true)
      expect(res.body.message).toBe('Assurance supprimée avec succès')
    })

    it('404 when not found', async () => {
      insuranceService.deleteInsurance.mockResolvedValueOnce(false)
      await request(app).delete('/insurance/unknown').expect(404)
    })
  })

  describe('GET /insurance/alerts/expiring', () => {
    it('returns expiring insurances', async () => {
      insuranceService.getExpiringInsurances.mockResolvedValueOnce([
        { id: 'ins-1' },
      ])
      const res = await request(app)
        .get('/insurance/alerts/expiring')
        .expect(200)
      expect(res.body.success).toBe(true)
      expect(res.body.count).toBe(1)
    })

    it('handles errors', async () => {
      insuranceService.getExpiringInsurances.mockRejectedValueOnce(
        new Error('boom')
      )
      await request(app).get('/insurance/alerts/expiring').expect(500)
    })
  })

  describe('GET /insurance/compliance/check', () => {
    it('returns compliance check', async () => {
      insuranceService.checkInsuranceCompliance.mockResolvedValueOnce({
        isValid: true,
      })
      const res = await request(app)
        .get('/insurance/compliance/check')
        .expect(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.isValid).toBe(true)
    })
  })

  describe('GET /insurance/reports/generate', () => {
    it('requires dates', async () => {
      const res = await request(app)
        .get('/insurance/reports/generate')
        .expect(400)
      expect(res.body.error).toBe('Dates de début et de fin requises')
    })
  })

  describe('GET /insurance/types/info', () => {
    it('returns types info', async () => {
      const res = await request(app).get('/insurance/types/info').expect(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('decennale')
    })
  })

  describe('Authentication', () => {
    it('requires auth', async () => {
      authenticateToken.mockImplementationOnce((req, res, _next) =>
        res.status(401).json({ error: 'Unauthorized' })
      )
      await request(app).get('/insurance').expect(401)
    })
  })
})
