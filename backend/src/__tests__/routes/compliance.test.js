const request = require('supertest')
const express = require('express')
const complianceRouter = require('../../routes/compliance')
const { authenticateToken } = require('../../middleware/auth')
const complianceAlertService = require('../../services/complianceAlertService')

jest.mock('../../middleware/auth')
jest.mock('../../services/complianceAlertService')

const app = express()
app.use(express.json())
app.use('/compliance', complianceRouter)

describe('Compliance Routes (service-based)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    authenticateToken.mockImplementation((req, res, next) => {
      req.user = { userId: 'test-user-id' }
      next()
    })
  })

  describe('GET /compliance/dashboard', () => {
    it('returns dashboard', async () => {
      complianceAlertService.getComplianceDashboard.mockResolvedValueOnce({
        complianceScore: 90,
        statistics: {},
      })
      const res = await request(app).get('/compliance/dashboard').expect(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.complianceScore).toBe(90)
    })
  })

  describe('GET /compliance/alerts', () => {
    it('returns alerts', async () => {
      complianceAlertService.getAlerts.mockResolvedValueOnce([
        { id: 'a1' },
        { id: 'a2' },
      ])
      const res = await request(app).get('/compliance/alerts').expect(200)
      expect(res.body.success).toBe(true)
      expect(res.body.count).toBe(2)
    })

    it('filters by severity', async () => {
      complianceAlertService.getAlerts.mockResolvedValueOnce([])
      await request(app).get('/compliance/alerts?severity=warning').expect(200)
      expect(complianceAlertService.getAlerts).toHaveBeenCalledWith(
        'test-user-id',
        'warning',
        true
      )
    })

    it('handles errors', async () => {
      complianceAlertService.getAlerts.mockRejectedValueOnce(new Error('boom'))
      await request(app).get('/compliance/alerts').expect(500)
    })
  })

  describe('POST /compliance/alerts/generate', () => {
    it('generates alerts', async () => {
      complianceAlertService.generateAllAlerts.mockResolvedValueOnce({
        generated: 3,
      })
      const res = await request(app)
        .post('/compliance/alerts/generate')
        .expect(200)
      expect(res.body.success).toBe(true)
      expect(res.body.message).toBe('Alertes générées avec succès')
    })
  })

  describe('PUT /compliance/alerts/:id/resolve', () => {
    it('resolves alert', async () => {
      complianceAlertService.resolveAlert.mockResolvedValueOnce({
        id: 'a1',
        resolved: true,
      })
      const res = await request(app)
        .put('/compliance/alerts/a1/resolve')
        .send({ notes: 'ok' })
        .expect(200)
      expect(res.body.success).toBe(true)
      expect(res.body.message).toBe('Alerte résolue avec succès')
    })

    it('validates payload', async () => {
      await request(app)
        .put('/compliance/alerts/a1/resolve')
        .send({ notes: 'x'.repeat(2000) })
        .expect(400)
    })

    it('404 when not found', async () => {
      complianceAlertService.resolveAlert.mockRejectedValueOnce(
        new Error('Alerte non trouvée')
      )
      await request(app)
        .put('/compliance/alerts/unknown/resolve')
        .send({ notes: 'x' })
        .expect(404)
    })
  })

  describe('DELETE /compliance/alerts/:id', () => {
    it('deletes alert', async () => {
      complianceAlertService.deleteAlert.mockResolvedValueOnce(true)
      const res = await request(app).delete('/compliance/alerts/a1').expect(200)
      expect(res.body.success).toBe(true)
      expect(res.body.message).toBe('Alerte supprimée avec succès')
    })

    it('404 when not found', async () => {
      complianceAlertService.deleteAlert.mockResolvedValueOnce(false)
      await request(app).delete('/compliance/alerts/unknown').expect(404)
    })
  })

  describe('GET /compliance/reports/generate', () => {
    it('requires dates', async () => {
      const res = await request(app)
        .get('/compliance/reports/generate')
        .expect(400)
      expect(res.body.error).toBe('Dates de début et de fin requises')
    })
  })

  describe('GET /compliance/statistics', () => {
    it('returns statistics', async () => {
      complianceAlertService.getComplianceDashboard.mockResolvedValueOnce({
        complianceScore: 80,
        statistics: {},
        recommendations: [],
      })
      const res = await request(app).get('/compliance/statistics').expect(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.complianceScore).toBe(80)
    })
  })

  describe('GET /compliance/expiring', () => {
    it('returns expiring elements', async () => {
      complianceAlertService.getComplianceDashboard.mockResolvedValueOnce({
        expiringSoon: [{ id: 'x' }],
      })
      const res = await request(app).get('/compliance/expiring').expect(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveLength(1)
    })
  })

  describe('Authentication', () => {
    it('requires auth', async () => {
      authenticateToken.mockImplementationOnce((req, res, next) =>
        res.status(401).json({ error: 'Unauthorized' })
      )
      await request(app).get('/compliance/dashboard').expect(401)
    })
  })
})
