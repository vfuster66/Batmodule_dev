/* eslint-disable no-unused-vars */
const request = require('supertest')
const express = require('express')
const certificationsRouter = require('../../routes/certifications')
const { authenticateToken } = require('../../middleware/auth')
const certificationService = require('../../services/certificationService')

jest.mock('../../middleware/auth')
jest.mock('../../services/certificationService')

const app = express()
app.use(express.json())
app.use('/certifications', certificationsRouter)

describe('Certifications Routes (service-based)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    authenticateToken.mockImplementation((req, res, next) => {
      req.user = { userId: 'test-user-id' }
      next()
    })
  })

  describe('GET /certifications', () => {
    it('returns certifications for user', async () => {
      certificationService.getCertifications.mockResolvedValueOnce([
        { id: 'cert-1', certificationType: 'rge' },
        { id: 'cert-2', certificationType: 'qualibat' },
      ])

      const res = await request(app).get('/certifications').expect(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveLength(2)
      expect(res.body.count).toBe(2)
    })

    it('handles service errors', async () => {
      certificationService.getCertifications.mockRejectedValueOnce(
        new Error('boom')
      )
      await request(app).get('/certifications').expect(500)
    })
  })

  describe('GET /certifications/:id', () => {
    it('returns certification by id', async () => {
      certificationService.getCertificationById.mockResolvedValueOnce({
        id: 'cert-1',
        certificationType: 'rge',
      })
      const res = await request(app).get('/certifications/cert-1').expect(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.id).toBe('cert-1')
    })

    it('returns 404 when not found', async () => {
      certificationService.getCertificationById.mockRejectedValueOnce(
        new Error('Certification non trouvée')
      )
      const res = await request(app).get('/certifications/unknown').expect(404)
      expect(res.body.error).toBe('Certification non trouvée')
    })
  })

  describe('POST /certifications', () => {
    it('creates a certification', async () => {
      const payload = {
        certificationType: 'rge',
        certificationNumber: 'CERT123',
        issuingBody: 'Org',
        startDate: '2023-01-01',
        endDate: '2025-01-01',
      }
      certificationService.createCertification.mockResolvedValueOnce({
        id: 'cert-3',
        ...payload,
        isActive: true,
      })
      const res = await request(app)
        .post('/certifications')
        .send(payload)
        .expect(201)
      expect(res.body.success).toBe(true)
      expect(res.body.message).toBe('Certification créée avec succès')
      expect(res.body.data.id).toBe('cert-3')
    })

    it('validates payload', async () => {
      await request(app)
        .post('/certifications')
        .send({ certificationType: 'invalid' })
        .expect(400)
    })
  })

  describe('PUT /certifications/:id', () => {
    it('updates a certification', async () => {
      const update = { issuingBody: 'New Org' }
      certificationService.updateCertification.mockResolvedValueOnce({
        id: 'cert-1',
        ...update,
      })
      const res = await request(app)
        .put('/certifications/cert-1')
        .send(update)
        .expect(200)
      expect(res.body.success).toBe(true)
      expect(res.body.message).toBe('Certification mise à jour avec succès')
    })

    it('404 when not found', async () => {
      certificationService.updateCertification.mockRejectedValueOnce(
        new Error('Certification non trouvée')
      )
      await request(app)
        .put('/certifications/unknown')
        .send({ issuingBody: 'X' })
        .expect(404)
    })

    it('validates payload', async () => {
      await request(app)
        .put('/certifications/cert-1')
        .send({ certificationType: 'invalid' })
        .expect(400)
    })
  })

  describe('DELETE /certifications/:id', () => {
    it('deletes a certification', async () => {
      certificationService.deleteCertification.mockResolvedValueOnce(true)
      const res = await request(app)
        .delete('/certifications/cert-1')
        .expect(200)
      expect(res.body.success).toBe(true)
      expect(res.body.message).toBe('Certification supprimée avec succès')
    })

    it('404 when not found', async () => {
      certificationService.deleteCertification.mockResolvedValueOnce(false)
      await request(app).delete('/certifications/unknown').expect(404)
    })
  })

  describe('GET /certifications/alerts/expiring', () => {
    it('returns expiring certifications', async () => {
      certificationService.getExpiringCertifications.mockResolvedValueOnce([
        { id: 'cert-1' },
      ])
      const res = await request(app)
        .get('/certifications/alerts/expiring')
        .expect(200)
      expect(res.body.success).toBe(true)
      expect(res.body.count).toBe(1)
    })

    it('handles service errors', async () => {
      certificationService.getExpiringCertifications.mockRejectedValueOnce(
        new Error('boom')
      )
      await request(app).get('/certifications/alerts/expiring').expect(500)
    })
  })

  describe('Authentication', () => {
    it('requires auth', async () => {
      authenticateToken.mockImplementationOnce((req, res, _next) =>
        res.status(401).json({ error: 'Unauthorized' })
      )
      await request(app).get('/certifications').expect(401)
    })
  })
})
