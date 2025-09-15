const request = require('supertest')
const express = require('express')
const wasteRouter = require('../../routes/waste')
const { authenticateToken } = require('../../middleware/auth')
const wasteManagementService = require('../../services/wasteManagementService')

// Mock des dépendances
jest.mock('../../middleware/auth')
jest.mock('../../services/wasteManagementService')

const app = express()
app.use(express.json())
app.use('/waste', wasteRouter)

describe('Waste Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    authenticateToken.mockImplementation((req, res, next) => {
      req.user = { userId: 'test-user-id' }
      next()
    })
  })

  describe('GET /waste', () => {
    it('should return all waste records for authenticated user', async () => {
      const mockWasteRecords = [
        { id: '1', wasteType: 'inert', quantity: 100, unit: 'kg' },
        { id: '2', wasteType: 'dangerous', quantity: 50, unit: 'kg' },
      ]

      wasteManagementService.getWasteRecords.mockResolvedValue(mockWasteRecords)

      const response = await request(app).get('/waste').expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveLength(2)
      expect(response.body.count).toBe(2)
    })

    it('should handle service errors', async () => {
      wasteManagementService.getWasteRecords.mockRejectedValue(
        new Error('Service error')
      )

      const response = await request(app).get('/waste').expect(500)

      expect(response.body.error).toBe(
        'Erreur lors de la récupération des déchets'
      )
    })
  })

  describe('GET /waste/:id', () => {
    it('should return a waste record by id', async () => {
      const mockWasteRecord = {
        id: '1',
        wasteType: 'inert',
        quantity: 100,
        unit: 'kg',
      }

      wasteManagementService.getWasteRecordById.mockResolvedValue(
        mockWasteRecord
      )

      const response = await request(app).get('/waste/1').expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toMatchObject(mockWasteRecord)
    })

    it('should return 404 if record not found', async () => {
      wasteManagementService.getWasteRecordById.mockRejectedValue(
        new Error('Enregistrement de déchet non trouvé')
      )

      const response = await request(app).get('/waste/unknown').expect(404)

      expect(response.body.error).toBe('Enregistrement de déchet non trouvé')
    })
  })

  describe('POST /waste', () => {
    it('should create a new waste record', async () => {
      const newWaste = {
        wasteType: 'inert',
        quantity: 200,
        collectionDate: '2023-09-10',
      }

      const mockCreated = { id: '3', ...newWaste, unit: 'kg' }

      wasteManagementService.createWasteRecord.mockResolvedValue(mockCreated)

      const response = await request(app)
        .post('/waste')
        .send(newWaste)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe(
        'Enregistrement de déchet créé avec succès'
      )
      expect(response.body.data).toMatchObject(mockCreated)
    })

    it('should return 400 for invalid data', async () => {
      const invalidWaste = { wasteType: '', quantity: -10 }

      const response = await request(app)
        .post('/waste')
        .send(invalidWaste)
        .expect(400)

      expect(response.body.error).toBe('Données invalides')
    })
  })

  describe('PUT /waste/:id', () => {
    it('should update an existing waste record', async () => {
      const updateData = { quantity: 300 }
      const updatedRecord = {
        id: '1',
        wasteType: 'inert',
        quantity: 300,
        unit: 'kg',
      }

      wasteManagementService.updateWasteRecord.mockResolvedValue(updatedRecord)

      const response = await request(app)
        .put('/waste/1')
        .send(updateData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe(
        'Enregistrement de déchet mis à jour avec succès'
      )
      expect(response.body.data).toMatchObject(updatedRecord)
    })

    it('should return 404 if record not found', async () => {
      wasteManagementService.updateWasteRecord.mockRejectedValue(
        new Error('Enregistrement de déchet non trouvé')
      )

      const response = await request(app)
        .put('/waste/999')
        .send({ quantity: 50 })
        .expect(404)

      expect(response.body.error).toBe('Enregistrement de déchet non trouvé')
    })

    it('should return 400 for invalid data', async () => {
      const response = await request(app)
        .put('/waste/1')
        .send({ quantity: -100 })
        .expect(400)

      expect(response.body.error).toBe('Données invalides')
    })
  })

  describe('DELETE /waste/:id', () => {
    it('should delete a waste record', async () => {
      wasteManagementService.deleteWasteRecord.mockResolvedValue(true)

      const response = await request(app).delete('/waste/1').expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe(
        'Enregistrement de déchet supprimé avec succès'
      )
    })

    it('should return 404 if record not found', async () => {
      wasteManagementService.deleteWasteRecord.mockResolvedValue(false)

      const response = await request(app).delete('/waste/999').expect(404)

      expect(response.body.error).toBe('Enregistrement de déchet non trouvé')
    })
  })

  describe('GET /waste/statistics/overview', () => {
    it('should return waste statistics', async () => {
      const mockStats = { totalWeight: 500, inertWeight: 300 }

      wasteManagementService.getWasteStatistics.mockResolvedValue(mockStats)

      const response = await request(app)
        .get('/waste/statistics/overview')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toMatchObject(mockStats)
    })
  })

  describe('GET /waste/reports/generate', () => {
    it('should return 400 if no dates provided', async () => {
      const response = await request(app)
        .get('/waste/reports/generate')
        .expect(400)

      expect(response.body.error).toBe('Dates de début et de fin requises')
    })

    it('should generate report with valid dates', async () => {
      const mockReport = { summary: { totalRecords: 10 } }

      wasteManagementService.generateWasteReport.mockResolvedValue(mockReport)

      const response = await request(app)
        .get('/waste/reports/generate?startDate=2023-01-01&endDate=2023-12-31')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toMatchObject(mockReport)
    })
  })

  describe('GET /waste/types/info', () => {
    it('should return waste types', async () => {
      const mockTypes = ['inert', 'dangerous']

      wasteManagementService.getWasteTypes.mockResolvedValue(mockTypes)

      const response = await request(app).get('/waste/types/info').expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockTypes)
    })
  })

  describe('GET /waste/compliance/check', () => {
    it('should return compliance report', async () => {
      const mockReport = {
        summary: {
          totalRecords: 10,
          compliance: { hasBsd: 90, hasTransporter: 95, hasDestination: 92 },
        },
      }

      wasteManagementService.generateWasteReport.mockResolvedValue(mockReport)

      const response = await request(app)
        .get('/waste/compliance/check')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.summary.totalRecords).toBe(10)
      expect(response.body.data.warnings).toEqual([])
    })

    it('should include warnings when thresholds are not met', async () => {
      const mockReport = {
        summary: {
          totalRecords: 10,
          compliance: { hasBsd: 75, hasTransporter: 85, hasDestination: 80 },
        },
      }

      wasteManagementService.generateWasteReport.mockResolvedValue(mockReport)

      const response = await request(app)
        .get('/waste/compliance/check')
        .expect(200)

      expect(response.body.data.isCompliant).toBe(true)
      expect(response.body.data.warnings).toEqual([
        'Taux de conformité BSD faible (< 80%)',
        'Informations transporteur manquantes',
        'Informations destination manquantes',
      ])
    })

    it('should set isCompliant to false when BSD < 50%', async () => {
      const mockReport = {
        summary: {
          totalRecords: 10,
          compliance: { hasBsd: 40, hasTransporter: 100, hasDestination: 100 },
        },
      }

      wasteManagementService.generateWasteReport.mockResolvedValue(mockReport)

      const response = await request(app)
        .get('/waste/compliance/check')
        .expect(200)

      expect(response.body.data.isCompliant).toBe(false)
      expect(response.body.data.errors).toContain(
        'Conformité BSD insuffisante (< 50%)'
      )
    })

    it('should handle service errors', async () => {
      wasteManagementService.generateWasteReport.mockRejectedValue(
        new Error('Service error')
      )
      const response = await request(app)
        .get('/waste/compliance/check')
        .expect(500)
      expect(response.body.error).toBe(
        'Erreur lors de la vérification de conformité'
      )
    })
  })

  describe('Additional branches and errors', () => {
    it('passes projectId to service in list route', async () => {
      wasteManagementService.getWasteRecords.mockResolvedValue([])
      await request(app)
        .get('/waste?projectId=123e4567-e89b-12d3-a456-426614174000')
        .expect(200)
      expect(wasteManagementService.getWasteRecords).toHaveBeenCalledWith(
        'test-user-id',
        '123e4567-e89b-12d3-a456-426614174000'
      )
    })

    it('handles errors on statistics route', async () => {
      wasteManagementService.getWasteStatistics.mockRejectedValue(
        new Error('db')
      )
      const response = await request(app)
        .get('/waste/statistics/overview')
        .expect(500)
      expect(response.body.error).toBe(
        'Erreur lors de la récupération des statistiques'
      )
    })

    it('handles errors on report generation', async () => {
      wasteManagementService.generateWasteReport.mockRejectedValue(
        new Error('db')
      )
      const response = await request(app)
        .get('/waste/reports/generate?startDate=2023-01-01&endDate=2023-12-31')
        .expect(500)
      expect(response.body.error).toBe(
        'Erreur lors de la génération du rapport'
      )
    })

    it('handles errors on types info route', async () => {
      wasteManagementService.getWasteTypes.mockRejectedValue(new Error('db'))
      const response = await request(app).get('/waste/types/info').expect(500)
      expect(response.body.error).toBe(
        'Erreur lors de la récupération des types de déchets'
      )
    })

    it('handles errors on create route', async () => {
      wasteManagementService.createWasteRecord.mockRejectedValue(
        new Error('db')
      )
      const response = await request(app)
        .post('/waste')
        .send({
          wasteType: 'inert',
          quantity: 10,
          collectionDate: '2023-01-01',
        })
        .expect(500)
      expect(response.body.error).toBe(
        "Erreur lors de la création de l'enregistrement de déchet"
      )
    })

    it('handles errors on update route', async () => {
      wasteManagementService.updateWasteRecord.mockRejectedValue(
        new Error('db')
      )
      const response = await request(app)
        .put('/waste/1')
        .send({ quantity: 10 })
        .expect(500)
      expect(response.body.error).toBe(
        "Erreur lors de la mise à jour de l'enregistrement de déchet"
      )
    })
  })

  describe('Authentication', () => {
    it('should block access without authentication', async () => {
      authenticateToken.mockImplementationOnce((req, res, next) => {
        return res.status(401).json({ error: 'Unauthorized' })
      })

      const response = await request(app).get('/waste').expect(401)

      expect(response.body.error).toBe('Unauthorized')
    })
  })
})
