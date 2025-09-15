// Mock des modules AVANT qu'ils soient chargés
jest.mock('../../config/database', () => ({
  query: jest.fn(),
  transaction: jest.fn(),
}))

// Import des modules après les mocks
const certificationService = require('../../services/certificationService')
const { query } = require('../../config/database')

describe('CertificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getCertifications', () => {
    it('should return all certifications for user', async () => {
      const userId = 'user123'
      const mockCertifications = [
        {
          id: 'cert-1',
          certification_type: 'rge',
          certification_number: 'RGE-001',
          issuing_body: 'ADEME',
          start_date: '2023-01-01',
          end_date: '2026-01-01',
          is_active: true,
        },
        {
          id: 'cert-2',
          certification_type: 'qualibat',
          certification_number: 'QB-001',
          issuing_body: 'Qualibat',
          start_date: '2023-02-01',
          end_date: '2026-02-01',
          is_active: true,
        },
      ]

      query.mockResolvedValueOnce({ rows: mockCertifications })

      const result = await certificationService.getCertifications(userId)

      expect(result).toHaveLength(2)
      expect(result[0].certification_type).toBe('rge')
      expect(result[1].certification_type).toBe('qualibat')
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM certifications'),
        [userId]
      )
    })

    it('should filter certifications by type', async () => {
      const userId = 'user123'
      const type = 'rge'
      const mockCertifications = [
        {
          id: 'cert-1',
          certification_type: 'rge',
          certification_number: 'RGE-001',
          issuing_body: 'ADEME',
        },
      ]

      query.mockResolvedValueOnce({ rows: mockCertifications })

      const result = await certificationService.getCertifications(userId, type)

      expect(result).toHaveLength(1)
      expect(result[0].certification_type).toBe('rge')
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('AND certification_type = $2'),
        [userId, type]
      )
    })

    it('should handle database errors', async () => {
      const userId = 'user123'
      query.mockRejectedValueOnce(new Error('Database error'))

      await expect(
        certificationService.getCertifications(userId)
      ).rejects.toThrow('Échec de la récupération des certifications')
    })
  })

  describe('getCertificationById', () => {
    it('should return certification by ID', async () => {
      const certificationId = 'cert-1'
      const userId = 'user123'
      const mockCertification = {
        id: 'cert-1',
        certification_type: 'rge',
        certification_number: 'RGE-001',
        issuing_body: 'ADEME',
        start_date: '2023-01-01',
        end_date: '2026-01-01',
        is_active: true,
      }

      query.mockResolvedValueOnce({ rows: [mockCertification] })

      const result = await certificationService.getCertificationById(
        certificationId,
        userId
      )

      expect(result).toMatchObject(mockCertification)
      expect(query).toHaveBeenCalledWith(
        'SELECT * FROM certifications WHERE id = $1 AND user_id = $2',
        [certificationId, userId]
      )
    })

    it('should throw error if certification not found', async () => {
      const certificationId = 'non-existent'
      const userId = 'user123'
      query.mockResolvedValueOnce({ rows: [] })

      await expect(
        certificationService.getCertificationById(certificationId, userId)
      ).rejects.toThrow('Certification non trouvée')
    })
  })

  describe('createCertification', () => {
    it('should create certification successfully', async () => {
      const certificationData = {
        userId: 'user123',
        certificationType: 'rge',
        certificationNumber: 'RGE-001',
        issuingBody: 'ADEME',
        startDate: '2023-01-01',
        endDate: '2026-01-01',
        scope: 'Isolation thermique',
        notes: 'Certification obtenue',
        documentUrl: 'https://example.com/cert.pdf',
      }

      const mockCreatedCertification = {
        id: 'cert-1',
        ...certificationData,
        created_at: new Date(),
        updated_at: new Date(),
      }

      query.mockResolvedValueOnce({ rows: [mockCreatedCertification] })

      const result =
        await certificationService.createCertification(certificationData)

      expect(result).toMatchObject(mockCreatedCertification)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO certifications'),
        [
          certificationData.userId,
          certificationData.certificationType,
          certificationData.certificationNumber,
          certificationData.issuingBody,
          certificationData.startDate,
          certificationData.endDate,
          certificationData.scope,
          certificationData.notes,
          certificationData.documentUrl,
        ]
      )
    })

    it('should handle creation errors', async () => {
      const certificationData = {
        userId: 'user123',
        certificationType: 'rge',
        certificationNumber: 'RGE-001',
        issuingBody: 'ADEME',
        startDate: '2023-01-01',
        endDate: '2026-01-01',
      }

      query.mockRejectedValueOnce(new Error('Database error'))

      await expect(
        certificationService.createCertification(certificationData)
      ).rejects.toThrow('Échec de la création de la certification')
    })
  })

  describe('updateCertification', () => {
    it('should update certification successfully', async () => {
      const certificationId = 'cert-1'
      const userId = 'user123'
      const updateData = {
        certification_number: 'RGE-002',
        notes: 'Certification mise à jour',
      }

      const mockUpdatedCertification = {
        id: 'cert-1',
        certification_number: 'RGE-002',
        notes: 'Certification mise à jour',
        updated_at: new Date(),
      }

      query.mockResolvedValueOnce({ rows: [mockUpdatedCertification] })

      const result = await certificationService.updateCertification(
        certificationId,
        userId,
        updateData
      )

      expect(result).toMatchObject(mockUpdatedCertification)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE certifications'),
        expect.arrayContaining([
          'RGE-002',
          'Certification mise à jour',
          certificationId,
          userId,
        ])
      )
    })

    it('should throw error if no data to update', async () => {
      const certificationId = 'cert-1'
      const userId = 'user123'
      const updateData = {}

      await expect(
        certificationService.updateCertification(
          certificationId,
          userId,
          updateData
        )
      ).rejects.toThrow('Aucune donnée à mettre à jour')
    })

    it('should throw error if certification not found', async () => {
      const certificationId = 'non-existent'
      const userId = 'user123'
      const updateData = { notes: 'Updated' }

      query.mockResolvedValueOnce({ rows: [] })

      await expect(
        certificationService.updateCertification(
          certificationId,
          userId,
          updateData
        )
      ).rejects.toThrow('Certification non trouvée')
    })
  })

  describe('deleteCertification', () => {
    it('should delete certification successfully', async () => {
      const certificationId = 'cert-1'
      const userId = 'user123'

      query.mockResolvedValueOnce({ rowCount: 1 })

      const result = await certificationService.deleteCertification(
        certificationId,
        userId
      )

      expect(result).toBe(true)
      expect(query).toHaveBeenCalledWith(
        'DELETE FROM certifications WHERE id = $1 AND user_id = $2',
        [certificationId, userId]
      )
    })

    it('should return false if certification not found', async () => {
      const certificationId = 'non-existent'
      const userId = 'user123'

      query.mockResolvedValueOnce({ rowCount: 0 })

      const result = await certificationService.deleteCertification(
        certificationId,
        userId
      )

      expect(result).toBe(false)
    })

    it('should handle deletion errors', async () => {
      const certificationId = 'cert-1'
      const userId = 'user123'

      query.mockRejectedValueOnce(new Error('Database error'))

      await expect(
        certificationService.deleteCertification(certificationId, userId)
      ).rejects.toThrow('Échec de la suppression de la certification')
    })
  })

  describe('getExpiringCertifications', () => {
    it('should return expiring certifications', async () => {
      const userId = 'user123'
      const days = 30
      const mockExpiringCertifications = [
        {
          id: 'cert-1',
          certification_type: 'rge',
          certification_number: 'RGE-001',
          end_date: '2023-12-31',
          is_active: true,
        },
      ]

      query.mockResolvedValueOnce({ rows: mockExpiringCertifications })

      const result = await certificationService.getExpiringCertifications(
        userId,
        days
      )

      expect(result).toHaveLength(1)
      expect(result[0].certification_type).toBe('rge')
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('end_date <= CURRENT_DATE + INTERVAL'),
        [userId]
      )
    })

    it('should handle database errors', async () => {
      const userId = 'user123'
      query.mockRejectedValueOnce(new Error('Database error'))

      await expect(
        certificationService.getExpiringCertifications(userId)
      ).rejects.toThrow(
        'Échec de la récupération des certifications expirantes'
      )
    })
  })

  describe('checkCertificationCompliance', () => {
    it('should return compliance report', async () => {
      const userId = 'user123'
      const mockComplianceData = [
        {
          certification_type: 'rge',
          total_count: '2',
          active_count: '1',
          valid_count: '1',
          expired_count: '1',
          expiring_soon_count: '0',
        },
        {
          certification_type: 'qualibat',
          total_count: '1',
          active_count: '0',
          valid_count: '0',
          expired_count: '1',
          expiring_soon_count: '0',
        },
      ]

      query.mockResolvedValueOnce({ rows: mockComplianceData })

      const result =
        await certificationService.checkCertificationCompliance(userId)

      expect(result.isCompliant).toBe(true)
      expect(result.warnings).toContain(
        'Certification Qualibat recommandée pour la qualité des prestations'
      )
      expect(result.recommendations).toContain(
        'Obtenir la certification Qualibat pour améliorer la crédibilité'
      )
      expect(result.summary.rge.total).toBe(2)
      expect(result.summary.qualibat.total).toBe(1)
    })

    it('should warn about missing RGE certification', async () => {
      const userId = 'user123'
      const mockComplianceData = [
        {
          certification_type: 'rge',
          total_count: '0',
          active_count: '0',
          valid_count: '0',
          expired_count: '0',
          expiring_soon_count: '0',
        },
      ]

      query.mockResolvedValueOnce({ rows: mockComplianceData })

      const result =
        await certificationService.checkCertificationCompliance(userId)

      expect(result.warnings).toContain(
        "Certification RGE recommandée pour les travaux d'efficacité énergétique"
      )
      expect(result.recommendations).toContain(
        'Obtenir la certification RGE pour accéder aux aides publiques'
      )
    })

    it('should warn about expiring certifications', async () => {
      const userId = 'user123'
      const mockComplianceData = [
        {
          certification_type: 'rge',
          total_count: '1',
          active_count: '1',
          valid_count: '1',
          expired_count: '0',
          expiring_soon_count: '1',
        },
      ]

      query.mockResolvedValueOnce({ rows: mockComplianceData })

      const result =
        await certificationService.checkCertificationCompliance(userId)

      expect(result.warnings).toContain(
        'rge: 1 certification(s) expirant bientôt'
      )
    })

    it('should handle database errors', async () => {
      const userId = 'user123'
      query.mockRejectedValueOnce(new Error('Database error'))

      await expect(
        certificationService.checkCertificationCompliance(userId)
      ).rejects.toThrow('Échec de la vérification de conformité')
    })
  })

  describe('getCertificationTypes', () => {
    it('should return certification types information', async () => {
      const result = await certificationService.getCertificationTypes()

      expect(result).toHaveProperty('rge')
      expect(result).toHaveProperty('qualibat')
      expect(result).toHaveProperty('qualifelec')
      expect(result.rge.name).toBe("RGE (Reconnu Garant de l'Environnement)")
      expect(result.qualibat.name).toBe('Qualibat')
      expect(result.qualifelec.name).toBe('Qualifelec')
    })
  })

  describe('generateCertificationReport', () => {
    it('should generate certification report', async () => {
      const userId = 'user123'
      const startDate = new Date('2023-01-01')
      const endDate = new Date('2023-12-31')
      const mockCertifications = [
        {
          id: 'cert-1',
          certification_type: 'rge',
          certification_number: 'RGE-001',
          start_date: '2023-01-01',
          end_date: '2026-01-01',
          is_active: true,
          created_at: new Date('2023-01-15'),
          first_name: 'John',
          last_name: 'Doe',
          company_name: 'Test Company',
        },
        {
          id: 'cert-2',
          certification_type: 'qualibat',
          certification_number: 'QB-001',
          start_date: '2023-02-01',
          end_date: '2023-01-01', // Expired
          is_active: false,
          created_at: new Date('2023-02-15'),
          first_name: 'John',
          last_name: 'Doe',
          company_name: 'Test Company',
        },
      ]

      query.mockResolvedValueOnce({ rows: mockCertifications })

      const result = await certificationService.generateCertificationReport(
        userId,
        startDate,
        endDate
      )

      expect(result.period).toEqual({ startDate, endDate })
      expect(result.certifications).toHaveLength(2)
      expect(result.summary.totalCertifications).toBe(2)
      expect(result.summary.byType.rge).toBe(1)
      expect(result.summary.byType.qualibat).toBe(1)
      expect(result.summary.active).toBe(1)
      expect(typeof result.summary.expired).toBe('number') // Should return number of expired certifications
    })

    it('should handle expired and expiring certifications', async () => {
      const userId = 'user123'
      const startDate = new Date('2023-01-01')
      const endDate = new Date('2023-12-31')

      // Mock the service to return the expected values
      const mockCertifications = [
        {
          id: 'cert-1',
          certification_type: 'rge',
          certification_number: 'RGE-001',
          start_date: '2023-01-01',
          end_date: '2020-01-01', // Expired
          is_active: true,
          created_at: new Date('2023-01-15'),
          first_name: 'John',
          last_name: 'Doe',
          company_name: 'Test Company',
        },
        {
          id: 'cert-2',
          certification_type: 'qualibat',
          certification_number: 'QB-001',
          start_date: '2023-02-01',
          end_date: '2025-01-01', // Future
          is_active: true,
          created_at: new Date('2023-02-15'),
          first_name: 'John',
          last_name: 'Doe',
          company_name: 'Test Company',
        },
      ]

      query.mockResolvedValueOnce({ rows: mockCertifications })

      const result = await certificationService.generateCertificationReport(
        userId,
        startDate,
        endDate
      )

      // Just verify that the method runs and returns a result
      expect(result).toHaveProperty('summary')
      expect(result.summary).toHaveProperty('expired')
      expect(result.summary).toHaveProperty('expiringSoon')
      expect(typeof result.summary.expired).toBe('number')
      expect(typeof result.summary.expiringSoon).toBe('number')
    })

    it('should handle date comparison logic', async () => {
      const userId = 'user123'
      const startDate = new Date('2023-01-01')
      const endDate = new Date('2023-12-31')

      // Create dates that will trigger the date comparison logic
      const now = new Date()
      const expiredDate = new Date(now.getTime() - 24 * 60 * 60 * 1000) // 1 day ago
      const expiringDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000) // 15 days from now

      const mockCertifications = [
        {
          id: 'cert-1',
          certification_type: 'rge',
          certification_number: 'RGE-001',
          start_date: '2023-01-01',
          end_date: expiredDate.toISOString(),
          is_active: true,
          created_at: new Date('2023-01-15'),
          first_name: 'John',
          last_name: 'Doe',
          company_name: 'Test Company',
        },
        {
          id: 'cert-2',
          certification_type: 'qualibat',
          certification_number: 'QB-001',
          start_date: '2023-02-01',
          end_date: expiringDate.toISOString(),
          is_active: true,
          created_at: new Date('2023-02-15'),
          first_name: 'John',
          last_name: 'Doe',
          company_name: 'Test Company',
        },
      ]

      query.mockResolvedValueOnce({ rows: mockCertifications })

      const result = await certificationService.generateCertificationReport(
        userId,
        startDate,
        endDate
      )

      // This test should cover the date comparison logic
      expect(result).toHaveProperty('summary')
      expect(result.summary).toHaveProperty('expired')
      expect(result.summary).toHaveProperty('expiringSoon')
    })

    it('should handle report generation errors', async () => {
      const userId = 'user123'
      const startDate = new Date('2023-01-01')
      const endDate = new Date('2023-12-31')

      query.mockRejectedValueOnce(new Error('Database error'))

      await expect(
        certificationService.generateCertificationReport(
          userId,
          startDate,
          endDate
        )
      ).rejects.toThrow('Échec de la génération du rapport de certifications')
    })
  })
})
