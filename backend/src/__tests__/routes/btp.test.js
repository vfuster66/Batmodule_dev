/* eslint-disable no-unused-vars */
const request = require('supertest')
const express = require('express')
const btpRouter = require('../../routes/btp')
const { authenticateToken } = require('../../middleware/auth')
const btpValidationService = require('../../services/btpValidationService')

jest.mock('../../middleware/auth')
jest.mock('../../services/btpValidationService')

const app = express()
app.use(express.json())
app.use('/btp', btpRouter)

describe('BTP Routes (service-based)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    authenticateToken.mockImplementation((req, res, next) => {
      req.user = { userId: 'test-user-id' }
      next()
    })
  })

  describe('POST /btp/validate-reverse-charge', () => {
    it('validates reverse charge payload', async () => {
      btpValidationService.validateReverseChargeBTP.mockResolvedValueOnce({
        is_valid: true,
      })
      const res = await request(app)
        .post('/btp/validate-reverse-charge')
        .send({ clientIsVatRegistered: true, reverseChargeBtp: true })
        .expect(200)
      expect(res.body.validation.is_valid).toBe(true)
      expect(res.body.message).toBe('Validation réussie')
    })

    it('rejects invalid payload', async () => {
      await request(app)
        .post('/btp/validate-reverse-charge')
        .send({})
        .expect(400)
    })
  })

  describe('POST /btp/validate-reduced-vat', () => {
    it('validates reduced VAT', async () => {
      btpValidationService.validateReducedVAT.mockResolvedValueOnce({
        is_valid: true,
      })
      const res = await request(app)
        .post('/btp/validate-reduced-vat')
        .send({
          propertyType: 'residential',
          propertyAgeYears: 5,
          workType: 'renovation',
          reducedVatRate: 10,
        })
        .expect(200)
      expect(res.body.validation.is_valid).toBe(true)
    })

    it('rejects invalid payload', async () => {
      await request(app).post('/btp/validate-reduced-vat').send({}).expect(400)
    })
  })

  describe('POST /btp/validate-conditions', () => {
    it('validates combined conditions', async () => {
      btpValidationService.validateBTPConditions.mockResolvedValueOnce({
        isValid: true,
      })
      const res = await request(app)
        .post('/btp/validate-conditions')
        .send({ reverseChargeBtp: true, clientIsVatRegistered: true })
        .expect(200)
      expect(res.body.validation.isValid).toBe(true)
    })

    it('rejects invalid payload', async () => {
      await request(app)
        .post('/btp/validate-conditions')
        .send({ reducedVatRate: 3 })
        .expect(400)
    })
  })

  describe('POST /btp/calculate-vat-rate', () => {
    it('calculates VAT rate', async () => {
      btpValidationService.calculateApplicableVATRate.mockResolvedValueOnce({
        rate: 10,
      })
      const res = await request(app)
        .post('/btp/calculate-vat-rate')
        .send({
          propertyType: 'residential',
          propertyAgeYears: 5,
          workType: 'renovation',
          reducedVatRate: 10,
        })
        .expect(200)
      expect(res.body.vatCalculation.rate).toBe(10)
    })
  })

  describe('GET /btp/stats', () => {
    it('returns stats', async () => {
      btpValidationService.getBTPValidationStats.mockResolvedValueOnce({
        validations: 3,
      })
      const res = await request(app).get('/btp/stats').expect(200)
      expect(res.body.validations).toBe(3)
    })
  })

  describe('GET /btp/info', () => {
    it('returns info', async () => {
      const res = await request(app).get('/btp/info').expect(200)
      expect(res.body).toHaveProperty('reverseChargeBTP')
      expect(res.body).toHaveProperty('reducedVAT')
    })
  })

  describe('Authentication', () => {
    it('requires auth', async () => {
      authenticateToken.mockImplementationOnce((req, res, _next) =>
        res.status(401).json({ error: 'Unauthorized' })
      )
      await request(app).get('/btp/info').expect(401)
    })
  })
})
