const insuranceService = require('../../services/insuranceService')
const { query } = require('../../config/database')

// Mock database
jest.mock('../../config/database', () => ({
  query: jest.fn(),
  transaction: jest.fn(),
}))

describe('Insurance Service', () => {
  let consoleSpy

  beforeEach(() => {
    jest.clearAllMocks()
    consoleSpy = jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  describe('getInsurances', () => {
    it('should get all insurances for a user', async () => {
      const userId = 'user123'
      const mockInsurances = [
        {
          id: 'ins1',
          user_id: 'user123',
          certificate_type: 'RC',
          name: 'Responsabilité Civile',
          end_date: '2025-12-31',
          created_at: '2023-01-01',
        },
      ]

      query.mockResolvedValueOnce({ rows: mockInsurances })

      const result = await insuranceService.getInsurances(userId)

      expect(result).toEqual(mockInsurances)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM insurance_certificates'),
        ['user123']
      )
    })

    it('should get insurances filtered by type', async () => {
      const userId = 'user123'
      const type = 'RC'
      const mockInsurances = [
        {
          id: 'ins1',
          user_id: 'user123',
          certificate_type: 'RC',
          name: 'Responsabilité Civile',
          end_date: '2025-12-31',
          created_at: '2023-01-01',
        },
      ]

      query.mockResolvedValueOnce({ rows: mockInsurances })

      const result = await insuranceService.getInsurances(userId, type)

      expect(result).toEqual(mockInsurances)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('certificate_type = $2'),
        ['user123', 'RC']
      )
    })

    it('should handle database errors', async () => {
      const userId = 'user123'
      const error = new Error('Database error')
      query.mockRejectedValueOnce(error)

      await expect(insuranceService.getInsurances(userId)).rejects.toThrow(
        'Échec de la récupération des assurances'
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        'Erreur lors de la récupération des assurances:',
        error
      )
    })
  })

  describe('getInsuranceById', () => {
    it('should get an insurance by ID', async () => {
      const insuranceId = 'ins1'
      const userId = 'user123'
      const mockInsurance = {
        id: 'ins1',
        user_id: 'user123',
        certificate_type: 'RC',
        name: 'Responsabilité Civile',
        end_date: '2025-12-31',
        created_at: '2023-01-01',
      }

      query.mockResolvedValueOnce({ rows: [mockInsurance] })

      const result = await insuranceService.getInsuranceById(
        insuranceId,
        userId
      )

      expect(result).toEqual(mockInsurance)
      expect(query).toHaveBeenCalledWith(
        'SELECT * FROM insurance_certificates WHERE id = $1 AND user_id = $2',
        ['ins1', 'user123']
      )
    })

    it('should throw error when insurance not found', async () => {
      const insuranceId = 'ins1'
      const userId = 'user123'

      query.mockResolvedValueOnce({ rows: [] })

      await expect(
        insuranceService.getInsuranceById(insuranceId, userId)
      ).rejects.toThrow('Assurance non trouvée')
    })

    it('should handle database errors', async () => {
      const insuranceId = 'ins1'
      const userId = 'user123'
      const error = new Error('Database error')
      query.mockRejectedValueOnce(error)

      await expect(
        insuranceService.getInsuranceById(insuranceId, userId)
      ).rejects.toThrow('Database error')
    })
  })

  describe('createInsurance', () => {
    it('should create insurance successfully', async () => {
      const insuranceData = {
        userId: 'user123',
        certificateType: 'RC',
        certificateNumber: 'RC-001',
        insuranceCompany: 'Test Insurance',
        policyNumber: 'POL-001',
        startDate: '2023-01-01',
        endDate: '2024-01-01',
        coverageAmount: 100000,
        deductible: 500,
        notes: 'Test insurance',
        documentUrl: 'http://example.com/doc.pdf',
      }

      const mockCreatedInsurance = {
        id: 'ins1',
        ...insuranceData,
        created_at: '2023-01-01T00:00:00Z',
      }

      query.mockResolvedValueOnce({ rows: [mockCreatedInsurance] })

      const result = await insuranceService.createInsurance(insuranceData)

      expect(result).toEqual(mockCreatedInsurance)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO insurance_certificates'),
        expect.arrayContaining([
          'user123',
          'RC',
          'RC-001',
          'Test Insurance',
          'POL-001',
          '2023-01-01',
          '2024-01-01',
          100000,
          500,
          'Test insurance',
          'http://example.com/doc.pdf',
        ])
      )
    })

    it('should handle creation errors', async () => {
      const insuranceData = {
        userId: 'user123',
        certificateType: 'RC',
      }

      const error = new Error('Database error')
      query.mockRejectedValueOnce(error)

      await expect(
        insuranceService.createInsurance(insuranceData)
      ).rejects.toThrow("Échec de la création de l'assurance")
      expect(consoleSpy).toHaveBeenCalledWith(
        "Erreur lors de la création de l'assurance:",
        error
      )
    })
  })

  describe('updateInsurance', () => {
    it('should update insurance successfully', async () => {
      const insuranceId = 'ins1'
      const userId = 'user123'
      const updateData = {
        certificateType: 'RC',
        endDate: '2024-12-31',
        coverageAmount: 200000,
      }

      const mockUpdatedInsurance = {
        id: 'ins1',
        user_id: 'user123',
        certificate_type: 'RC',
        end_date: '2024-12-31',
        coverage_amount: 200000,
        updated_at: '2023-01-15T00:00:00Z',
      }

      query.mockResolvedValueOnce({ rows: [mockUpdatedInsurance] })

      const result = await insuranceService.updateInsurance(
        insuranceId,
        userId,
        updateData
      )

      expect(result).toEqual(mockUpdatedInsurance)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE insurance_certificates'),
        expect.arrayContaining(['RC', '2024-12-31', 200000, 'ins1', 'user123'])
      )
    })

    it('should throw error if no data to update', async () => {
      const insuranceId = 'ins1'
      const userId = 'user123'
      const updateData = {}

      await expect(
        insuranceService.updateInsurance(insuranceId, userId, updateData)
      ).rejects.toThrow('Aucune donnée à mettre à jour')
    })

    it('should throw error if insurance not found', async () => {
      const insuranceId = 'ins1'
      const userId = 'user123'
      const updateData = { certificateType: 'RC' }

      query.mockResolvedValueOnce({ rows: [] })

      await expect(
        insuranceService.updateInsurance(insuranceId, userId, updateData)
      ).rejects.toThrow('Assurance non trouvée')
    })

    it('should handle update errors', async () => {
      const insuranceId = 'ins1'
      const userId = 'user123'
      const updateData = { certificateType: 'RC' }
      const error = new Error('Database error')

      query.mockRejectedValueOnce(error)

      await expect(
        insuranceService.updateInsurance(insuranceId, userId, updateData)
      ).rejects.toThrow('Database error')
      expect(consoleSpy).toHaveBeenCalledWith(
        "Erreur lors de la mise à jour de l'assurance:",
        error
      )
    })
  })

  describe('deleteInsurance', () => {
    it('should delete insurance successfully', async () => {
      const insuranceId = 'ins1'
      const userId = 'user123'

      query.mockResolvedValueOnce({ rowCount: 1 })

      const result = await insuranceService.deleteInsurance(insuranceId, userId)

      expect(result).toBe(true)
      expect(query).toHaveBeenCalledWith(
        'DELETE FROM insurance_certificates WHERE id = $1 AND user_id = $2',
        ['ins1', 'user123']
      )
    })

    it('should return false if insurance not found', async () => {
      const insuranceId = 'ins1'
      const userId = 'user123'

      query.mockResolvedValueOnce({ rowCount: 0 })

      const result = await insuranceService.deleteInsurance(insuranceId, userId)

      expect(result).toBe(false)
    })

    it('should handle deletion errors', async () => {
      const insuranceId = 'ins1'
      const userId = 'user123'
      const error = new Error('Database error')

      query.mockRejectedValueOnce(error)

      await expect(
        insuranceService.deleteInsurance(insuranceId, userId)
      ).rejects.toThrow("Échec de la suppression de l'assurance")
      expect(consoleSpy).toHaveBeenCalledWith(
        "Erreur lors de la suppression de l'assurance:",
        error
      )
    })
  })

  describe('getExpiringInsurances', () => {
    it('should return expiring insurances', async () => {
      const userId = 'user123'
      const days = 30
      const mockExpiringInsurances = [
        {
          id: 'ins1',
          user_id: 'user123',
          certificate_type: 'RC',
          end_date: '2023-02-15',
          is_active: true,
        },
      ]

      query.mockResolvedValueOnce({ rows: mockExpiringInsurances })

      const result = await insuranceService.getExpiringInsurances(userId, days)

      expect(result).toEqual(mockExpiringInsurances)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('end_date <= CURRENT_DATE + INTERVAL'),
        ['user123']
      )
    })

    it('should handle database errors', async () => {
      const userId = 'user123'
      const error = new Error('Database error')

      query.mockRejectedValueOnce(error)

      await expect(
        insuranceService.getExpiringInsurances(userId)
      ).rejects.toThrow('Échec de la récupération des assurances expirantes')
      expect(consoleSpy).toHaveBeenCalledWith(
        'Erreur lors de la récupération des assurances expirantes:',
        error
      )
    })
  })

  describe('checkInsuranceCompliance', () => {
    it('should return compliance report', async () => {
      const userId = 'user123'
      const mockComplianceData = [
        {
          certificate_type: 'decennale',
          total_count: '2',
          active_count: '1',
          valid_count: '1',
          expired_count: '1',
          expiring_soon_count: '0',
        },
        {
          certificate_type: 'rc_pro',
          total_count: '1',
          active_count: '1',
          valid_count: '1',
          expired_count: '0',
          expiring_soon_count: '0',
        },
      ]

      query.mockResolvedValueOnce({ rows: mockComplianceData })

      const result = await insuranceService.checkInsuranceCompliance(userId)

      expect(result.isCompliant).toBe(true)
      expect(result.summary).toHaveProperty('decennale')
      expect(result.summary).toHaveProperty('rc_pro')
      expect(result.warnings).toContain('decennale: 1 assurance(s) expirée(s)')
    })

    it('should detect missing mandatory insurances', async () => {
      const userId = 'user123'
      const mockComplianceData = [
        {
          certificate_type: 'decennale',
          total_count: '0',
          active_count: '0',
          valid_count: '0',
          expired_count: '0',
          expiring_soon_count: '0',
        },
      ]

      query.mockResolvedValueOnce({ rows: mockComplianceData })

      const result = await insuranceService.checkInsuranceCompliance(userId)

      expect(result.isCompliant).toBe(false)
      expect(result.errors).toContain(
        'Assurance décennale obligatoire manquante'
      )
    })

    it('should detect missing RC Pro insurance', async () => {
      const userId = 'user123'
      const mockComplianceData = [
        {
          certificate_type: 'rc_pro',
          total_count: '0',
          active_count: '0',
          valid_count: '0',
          expired_count: '0',
          expiring_soon_count: '0',
        },
      ]

      query.mockResolvedValueOnce({ rows: mockComplianceData })

      const result = await insuranceService.checkInsuranceCompliance(userId)

      expect(result.isCompliant).toBe(false)
      expect(result.errors).toContain('Assurance RC Pro obligatoire manquante')
    })

    it('should detect expiring soon insurances', async () => {
      const userId = 'user123'
      const mockComplianceData = [
        {
          certificate_type: 'decennale',
          total_count: '1',
          active_count: '1',
          valid_count: '1',
          expired_count: '0',
          expiring_soon_count: '1',
        },
      ]

      query.mockResolvedValueOnce({ rows: mockComplianceData })

      const result = await insuranceService.checkInsuranceCompliance(userId)

      expect(result.isCompliant).toBe(true)
      expect(result.warnings).toContain(
        'decennale: 1 assurance(s) expirant bientôt'
      )
    })

    it('should handle database errors', async () => {
      const userId = 'user123'
      const error = new Error('Database error')

      query.mockRejectedValueOnce(error)

      await expect(
        insuranceService.checkInsuranceCompliance(userId)
      ).rejects.toThrow('Échec de la vérification de conformité')
      expect(consoleSpy).toHaveBeenCalledWith(
        'Erreur lors de la vérification de conformité:',
        error
      )
    })
  })

  describe('generateInsuranceReport', () => {
    it('should generate insurance report', async () => {
      const userId = 'user123'
      const startDate = new Date('2023-01-01')
      const endDate = new Date('2023-12-31')
      const mockReportData = [
        {
          id: 'ins1',
          user_id: 'user123',
          certificate_type: 'RC',
          coverage_amount: 100000,
          end_date: '2024-01-01',
          created_at: '2023-01-01T00:00:00Z',
          first_name: 'John',
          last_name: 'Doe',
          company_name: 'Test Company',
        },
      ]

      query.mockResolvedValueOnce({ rows: mockReportData })

      const result = await insuranceService.generateInsuranceReport(
        userId,
        startDate,
        endDate
      )

      expect(result.period).toEqual({ startDate, endDate })
      expect(result.insurances).toEqual(mockReportData)
      expect(result.summary.totalInsurances).toBe(1)
      expect(result.summary.byType.RC).toBe(1)
      expect(result.summary.totalCoverage).toBe(100000)
    })

    it('should handle expired and expiring insurances', async () => {
      const userId = 'user123'
      const startDate = new Date('2023-01-01')
      const endDate = new Date('2023-12-31')

      // Use Date objects that will be compared correctly
      const now = new Date()
      const expiredDate = new Date(now.getTime() - 24 * 60 * 60 * 1000) // 1 day ago
      const expiringDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000) // 15 days from now

      const mockReportData = [
        {
          id: 'ins1',
          user_id: 'user123',
          certificate_type: 'RC',
          coverage_amount: 100000,
          end_date: expiredDate, // Expired
          created_at: '2023-01-01T00:00:00Z',
          first_name: 'John',
          last_name: 'Doe',
          company_name: 'Test Company',
        },
        {
          id: 'ins2',
          user_id: 'user123',
          certificate_type: 'decennale',
          coverage_amount: 200000,
          end_date: expiringDate, // Expiring soon
          created_at: '2023-01-01T00:00:00Z',
          first_name: 'John',
          last_name: 'Doe',
          company_name: 'Test Company',
        },
      ]

      query.mockResolvedValueOnce({ rows: mockReportData })

      const result = await insuranceService.generateInsuranceReport(
        userId,
        startDate,
        endDate
      )

      expect(result.summary.expired).toBe(1)
      expect(result.summary.expiringSoon).toBe(1)
    })

    it('should handle database errors', async () => {
      const userId = 'user123'
      const startDate = new Date('2023-01-01')
      const endDate = new Date('2023-12-31')
      const error = new Error('Database error')

      query.mockRejectedValueOnce(error)

      await expect(
        insuranceService.generateInsuranceReport(userId, startDate, endDate)
      ).rejects.toThrow("Échec de la génération du rapport d'assurances")
      expect(consoleSpy).toHaveBeenCalledWith(
        'Erreur lors de la génération du rapport:',
        error
      )
    })
  })

  describe('module exports', () => {
    it('should export insuranceService instance', () => {
      expect(insuranceService).toBeDefined()
      expect(typeof insuranceService).toBe('object')
    })
  })
})
