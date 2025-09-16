const request = require('supertest')
const express = require('express')
const companySettingsRouter = require('../../routes/companySettings')
const { authenticateToken } = require('../../middleware/auth')
const companySettingsService = require('../../services/companySettingsService')
const { query } = require('../../config/database')

jest.mock('../../middleware/auth')
jest.mock('../../services/companySettingsService')
jest.mock('../../config/database')

const app = express()
app.use(express.json())
app.use('/company-settings', companySettingsRouter)

describe('Company Settings Routes (service-based)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    authenticateToken.mockImplementation((req, res, next) => {
      req.user = { userId: 'test-user-id' }
      next()
    })
  })

  describe('GET /company-settings', () => {
    it('returns settings', async () => {
      companySettingsService.getSettings.mockResolvedValueOnce({
        id: 'settings-1',
        company_name: 'Test Co',
      })
      const res = await request(app).get('/company-settings').expect(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.id).toBe('settings-1')
    })

    it('handles errors', async () => {
      companySettingsService.getSettings.mockRejectedValueOnce(
        new Error('boom')
      )
      await request(app).get('/company-settings').expect(500)
    })
  })

  describe('PUT /company-settings', () => {
    it('updates settings (snake_case fields)', async () => {
      const payload = { company_name: 'Updated Co', address_line1: 'Rue 1' }
      companySettingsService.updateSettings.mockResolvedValueOnce({
        id: 'settings-1',
        ...payload,
      })
      const res = await request(app)
        .put('/company-settings')
        .send(payload)
        .expect(200)
      expect(res.body.success).toBe(true)
      expect(res.body.message).toBe('Paramètres mis à jour avec succès')
      expect(res.body.data.company_name).toBe('Updated Co')
    })

    it('validates payload', async () => {
      await request(app)
        .put('/company-settings')
        .send({ email: 'not-an-email' })
        .expect(400)
    })
  })

  describe('GET /company-settings/validate', () => {
    it('returns validation with score and recommendations', async () => {
      companySettingsService.getSettings.mockResolvedValueOnce({})
      companySettingsService.validateRequiredSettings.mockReturnValueOnce({
        isValid: true,
        errors: [],
        warnings: [],
      })
      companySettingsService.calculateComplianceScore.mockReturnValueOnce(85)
      companySettingsService.getMissingFields.mockReturnValueOnce([])
      companySettingsService.getRecommendations.mockReturnValueOnce([
        'Add logo',
      ])

      const res = await request(app)
        .get('/company-settings/validate')
        .expect(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.score).toBe(85)
      expect(res.body.data.recommendations).toContain('Add logo')
    })
  })

  describe('GET /company-settings/compliance-report', () => {
    it('returns report', async () => {
      companySettingsService.generateComplianceReport.mockResolvedValueOnce({
        totalIssues: 0,
      })
      const res = await request(app)
        .get('/company-settings/compliance-report')
        .expect(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.totalIssues).toBe(0)
    })
  })

  describe('POST /company-settings/reset', () => {
    it('requires confirmation', async () => {
      const res = await request(app)
        .post('/company-settings/reset')
        .send({})
        .expect(400)
      expect(res.body.error).toBe('Confirmation requise')
    })

    it('resets to defaults', async () => {
      // simulate deletion of existing settings
      query.mockResolvedValueOnce({ rows: [] })
      companySettingsService.createDefaultSettings.mockResolvedValueOnce({
        id: 'settings-new',
      })
      const res = await request(app)
        .post('/company-settings/reset')
        .send({ confirm: true })
        .expect(200)
      expect(res.body.success).toBe(true)
      expect(res.body.message).toBe('Paramètres réinitialisés avec succès')
    })
  })

  describe('GET /company-settings/legal-templates', () => {
    it('returns templates', async () => {
      const res = await request(app)
        .get('/company-settings/legal-templates')
        .expect(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('late_fee_description')
    })
  })

  describe('Authentication', () => {
    it('requires auth', async () => {
      // eslint-disable-next-line no-unused-vars
      authenticateToken.mockImplementationOnce((req, res, _next) =>
        res.status(401).json({ error: 'Unauthorized' })
      )
      await request(app).get('/company-settings').expect(401)
    })
  })
})
