// Mock des modules AVANT qu'ils soient chargés
jest.mock('../../config/database', () => ({
  query: jest.fn(),
  transaction: jest.fn(),
}))

// Import des modules après les mocks
const complianceAlertService = require('../../services/complianceAlertService')
const { query } = require('../../config/database')

describe('ComplianceAlertService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('generateAllAlerts', () => {
    it('should generate all alerts successfully', async () => {
      const userId = 'user123'
      const mockAlerts = [
        {
          id: 'alert-1',
          user_id: userId,
          entity_type: 'insurance',
          entity_id: 'insurance-1',
          severity: 'critical',
          alert_date: new Date('2023-01-01'),
          is_resolved: false,
          entity_subtype: 'decennale',
          entity_name: 'AXA',
        },
        {
          id: 'alert-2',
          user_id: userId,
          entity_type: 'certification',
          entity_id: 'cert-1',
          severity: 'high',
          alert_date: new Date('2023-01-02'),
          is_resolved: false,
          entity_subtype: 'rge',
          entity_name: 'ADEME',
        },
      ]

      query
        .mockResolvedValueOnce({ rows: [] }) // generate_compliance_alerts()
        .mockResolvedValueOnce({ rows: mockAlerts }) // SELECT alerts

      const result = await complianceAlertService.generateAllAlerts(userId)

      expect(result.success).toBe(true)
      expect(result.alerts).toHaveLength(2)
      expect(result.count).toBe(2)
      expect(result.bySeverity).toHaveProperty('critical')
      expect(result.bySeverity).toHaveProperty('high')
      expect(result.bySeverity.critical).toHaveLength(1)
      expect(result.bySeverity.high).toHaveLength(1)
    })

    it('should handle database errors', async () => {
      const userId = 'user123'
      query.mockRejectedValueOnce(new Error('Database error'))

      await expect(
        complianceAlertService.generateAllAlerts(userId)
      ).rejects.toThrow('Échec de la génération des alertes')
    })
  })

  describe('getAlerts', () => {
    it('should return all alerts for user', async () => {
      const userId = 'user123'
      const mockAlerts = [
        {
          id: 'alert-1',
          user_id: userId,
          entity_type: 'insurance',
          severity: 'critical',
          is_resolved: false,
          entity_subtype: 'decennale',
          entity_name: 'AXA',
        },
      ]

      query.mockResolvedValueOnce({ rows: mockAlerts })

      const result = await complianceAlertService.getAlerts(userId)

      expect(result).toHaveLength(1)
      expect(result[0].severity).toBe('critical')
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE ca.user_id = $1'),
        [userId]
      )
    })

    it('should filter alerts by severity', async () => {
      const userId = 'user123'
      const severity = 'critical'
      const mockAlerts = [
        {
          id: 'alert-1',
          user_id: userId,
          entity_type: 'insurance',
          severity: 'critical',
          is_resolved: false,
        },
      ]

      query.mockResolvedValueOnce({ rows: mockAlerts })

      const result = await complianceAlertService.getAlerts(userId, severity)

      expect(result).toHaveLength(1)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('AND ca.severity = $2'),
        [userId, severity]
      )
    })

    it('should filter unresolved alerts', async () => {
      const userId = 'user123'
      const unresolved = true
      const mockAlerts = [
        {
          id: 'alert-1',
          user_id: userId,
          entity_type: 'insurance',
          severity: 'critical',
          is_resolved: false,
        },
      ]

      query.mockResolvedValueOnce({ rows: mockAlerts })

      const result = await complianceAlertService.getAlerts(
        userId,
        null,
        unresolved
      )

      expect(result).toHaveLength(1)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('AND ca.is_resolved = false'),
        [userId]
      )
    })

    it('should handle database errors', async () => {
      const userId = 'user123'
      query.mockRejectedValueOnce(new Error('Database error'))

      await expect(complianceAlertService.getAlerts(userId)).rejects.toThrow(
        'Échec de la récupération des alertes'
      )
    })
  })

  describe('resolveAlert', () => {
    it('should resolve alert successfully', async () => {
      const alertId = 'alert-1'
      const userId = 'user123'
      const notes = 'Alert resolved'
      const mockResolvedAlert = {
        id: alertId,
        user_id: userId,
        is_resolved: true,
        resolved_at: new Date(),
        resolved_by: userId,
        notes: notes,
      }

      query.mockResolvedValueOnce({ rows: [mockResolvedAlert] })

      const result = await complianceAlertService.resolveAlert(
        alertId,
        userId,
        notes
      )

      expect(result).toMatchObject(mockResolvedAlert)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE compliance_alerts'),
        [userId, notes, alertId, userId]
      )
    })

    it('should throw error if alert not found', async () => {
      const alertId = 'non-existent'
      const userId = 'user123'
      const notes = 'Alert resolved'

      query.mockResolvedValueOnce({ rows: [] })

      await expect(
        complianceAlertService.resolveAlert(alertId, userId, notes)
      ).rejects.toThrow('Alerte non trouvée')
    })
  })

  describe('deleteAlert', () => {
    it('should delete alert successfully', async () => {
      const alertId = 'alert-1'
      const userId = 'user123'

      query.mockResolvedValueOnce({ rowCount: 1 })

      const result = await complianceAlertService.deleteAlert(alertId, userId)

      expect(result).toBe(true)
      expect(query).toHaveBeenCalledWith(
        'DELETE FROM compliance_alerts WHERE id = $1 AND user_id = $2',
        [alertId, userId]
      )
    })

    it('should return false if alert not found', async () => {
      const alertId = 'non-existent'
      const userId = 'user123'

      query.mockResolvedValueOnce({ rowCount: 0 })

      const result = await complianceAlertService.deleteAlert(alertId, userId)

      expect(result).toBe(false)
    })

    it('should handle database errors', async () => {
      const alertId = 'alert-1'
      const userId = 'user123'

      query.mockRejectedValueOnce(new Error('Database error'))

      await expect(
        complianceAlertService.deleteAlert(alertId, userId)
      ).rejects.toThrow("Échec de la suppression de l'alerte")
    })
  })

  describe('getComplianceDashboard', () => {
    it('should return compliance dashboard', async () => {
      const userId = 'user123'
      const mockStats = {
        active_insurances: '2',
        active_certifications: '1',
        valid_trainings: '3',
        active_equipment: '5',
        unresolved_alerts: '2',
        critical_alerts: '1',
        high_alerts: '1',
      }

      const mockAlerts = [
        {
          id: 'alert-1',
          severity: 'critical',
          is_resolved: false,
        },
        {
          id: 'alert-2',
          severity: 'high',
          is_resolved: false,
        },
      ]

      const mockExpiringItems = [
        {
          type: 'insurance',
          subtype: 'decennale',
          number: 'INS-001',
          name: 'AXA',
          end_date: new Date('2023-12-31'),
          category: 'Assurance',
        },
      ]

      // Mock generateAllAlerts
      jest
        .spyOn(complianceAlertService, 'generateAllAlerts')
        .mockResolvedValueOnce({ success: true, alerts: mockAlerts })

      // Mock getAlerts
      jest
        .spyOn(complianceAlertService, 'getAlerts')
        .mockResolvedValueOnce(mockAlerts)

      // Mock getExpiringItems
      jest
        .spyOn(complianceAlertService, 'getExpiringItems')
        .mockResolvedValueOnce(mockExpiringItems)

      query.mockResolvedValueOnce({ rows: [mockStats] })

      const result = await complianceAlertService.getComplianceDashboard(userId)

      expect(result.complianceScore).toBeGreaterThan(0)
      expect(result.statistics.activeInsurances).toBe(2)
      expect(result.statistics.activeCertifications).toBe(1)
      expect(result.statistics.validTrainings).toBe(3)
      expect(result.statistics.activeEquipment).toBe(5)
      expect(result.statistics.unresolvedAlerts).toBe(2)
      expect(result.statistics.criticalAlerts).toBe(1)
      expect(result.statistics.highAlerts).toBe(1)
      expect(result.recentAlerts).toHaveLength(2)
      expect(result.expiringSoon).toHaveLength(1)
      expect(Array.isArray(result.recommendations)).toBe(true) // Recommendations array
    })

    it('should handle database errors', async () => {
      const userId = 'user123'
      query.mockRejectedValueOnce(new Error('Database error'))

      await expect(
        complianceAlertService.getComplianceDashboard(userId)
      ).rejects.toThrow('Échec de la récupération du tableau de bord')
    })
  })

  describe('calculateComplianceScore', () => {
    it('should calculate high compliance score', () => {
      const stats = {
        critical_alerts: '0',
        high_alerts: '0',
        unresolved_alerts: '0',
        active_insurances: '2',
        active_certifications: '1',
      }

      const score = complianceAlertService.calculateComplianceScore(stats)
      expect(score).toBeGreaterThanOrEqual(100) // Should be high score with insurances and certifications
    })

    it('should calculate low compliance score with many alerts', () => {
      const stats = {
        critical_alerts: '2',
        high_alerts: '3',
        unresolved_alerts: '5',
        active_insurances: '0',
        active_certifications: '0',
      }

      const score = complianceAlertService.calculateComplianceScore(stats)
      expect(score).toBeLessThan(100) // Should be low score with many alerts
    })

    it('should not go below 0', () => {
      const stats = {
        critical_alerts: '10',
        high_alerts: '10',
        unresolved_alerts: '10',
        active_insurances: '0',
        active_certifications: '0',
      }

      const score = complianceAlertService.calculateComplianceScore(stats)
      expect(score).toBe(0)
    })

    it('should not go above 100', () => {
      const stats = {
        critical_alerts: '0',
        high_alerts: '0',
        unresolved_alerts: '0',
        active_insurances: '10',
        active_certifications: '10',
      }

      const score = complianceAlertService.calculateComplianceScore(stats)
      expect(score).toBe(100)
    })
  })

  describe('getExpiringItems', () => {
    it('should return expiring items', async () => {
      const userId = 'user123'
      const mockExpiringItems = [
        {
          type: 'insurance',
          subtype: 'decennale',
          number: 'INS-001',
          name: 'AXA',
          end_date: new Date('2023-12-31'),
          category: 'Assurance',
        },
        {
          type: 'certification',
          subtype: 'rge',
          number: 'RGE-001',
          name: 'ADEME',
          end_date: new Date('2023-12-31'),
          category: 'Certification',
        },
      ]

      query.mockResolvedValueOnce({ rows: mockExpiringItems })

      const result = await complianceAlertService.getExpiringItems(userId)

      expect(result).toHaveLength(2)
      expect(result[0].type).toBe('insurance')
      expect(result[1].type).toBe('certification')
    })

    it('should return empty array on error', async () => {
      const userId = 'user123'
      query.mockRejectedValueOnce(new Error('Database error'))

      const result = await complianceAlertService.getExpiringItems(userId)

      expect(result).toEqual([])
    })
  })

  describe('generateRecommendations', () => {
    it('should generate recommendations for missing insurances', () => {
      const stats = {
        active_insurances: '0',
        active_certifications: '1',
        critical_alerts: '0',
        valid_trainings: '1',
      }
      const alerts = []

      const recommendations = complianceAlertService.generateRecommendations(
        stats,
        alerts
      )

      expect(recommendations).toHaveLength(1)
      expect(recommendations[0].priority).toBe('high')
      expect(recommendations[0].category).toBe('insurance')
      expect(recommendations[0].title).toBe('Assurance décennale obligatoire')
    })

    it('should generate recommendations for missing certifications', () => {
      const stats = {
        active_insurances: '1',
        active_certifications: '0',
        critical_alerts: '0',
        valid_trainings: '1',
      }
      const alerts = []

      const recommendations = complianceAlertService.generateRecommendations(
        stats,
        alerts
      )

      expect(recommendations).toHaveLength(1)
      expect(recommendations[0].priority).toBe('medium')
      expect(recommendations[0].category).toBe('certification')
      expect(recommendations[0].title).toBe('Certifications recommandées')
    })

    it('should generate recommendations for critical alerts', () => {
      const stats = {
        active_insurances: '1',
        active_certifications: '1',
        critical_alerts: '2',
        valid_trainings: '1',
      }
      const alerts = []

      const recommendations = complianceAlertService.generateRecommendations(
        stats,
        alerts
      )

      expect(recommendations).toHaveLength(1)
      expect(recommendations[0].priority).toBe('critical')
      expect(recommendations[0].category).toBe('alerts')
      expect(recommendations[0].title).toBe('Alertes critiques à traiter')
    })

    it('should generate recommendations for missing trainings', () => {
      const stats = {
        active_insurances: '1',
        active_certifications: '1',
        critical_alerts: '0',
        valid_trainings: '0',
      }
      const alerts = []

      const recommendations = complianceAlertService.generateRecommendations(
        stats,
        alerts
      )

      expect(recommendations).toHaveLength(1)
      expect(recommendations[0].priority).toBe('medium')
      expect(recommendations[0].category).toBe('training')
      expect(recommendations[0].title).toBe('Formations de sécurité')
    })
  })

  describe('groupAlertsBySeverity', () => {
    it('should group alerts by severity', () => {
      const alerts = [
        { id: 'alert-1', severity: 'critical' },
        { id: 'alert-2', severity: 'critical' },
        { id: 'alert-3', severity: 'high' },
        { id: 'alert-4', severity: 'medium' },
      ]

      const result = complianceAlertService.groupAlertsBySeverity(alerts)

      expect(result.critical).toHaveLength(2)
      expect(result.high).toHaveLength(1)
      expect(result.medium).toHaveLength(1)
    })
  })

  describe('generateComplianceReport', () => {
    it('should generate compliance report', async () => {
      const userId = 'user123'
      const startDate = new Date('2023-01-01')
      const endDate = new Date('2023-12-31')

      const mockDashboard = {
        complianceScore: 85,
        statistics: {
          activeInsurances: 2,
          activeCertifications: 1,
          validTrainings: 3,
          activeEquipment: 5,
          unresolvedAlerts: 2,
          criticalAlerts: 1,
          highAlerts: 1,
        },
        recentAlerts: [],
        expiringSoon: [],
        recommendations: [],
      }

      const mockAlertHistory = [
        {
          id: 'alert-1',
          severity: 'critical',
          is_resolved: true,
          alert_date: new Date('2023-01-15'),
          first_name: 'John',
          last_name: 'Doe',
        },
        {
          id: 'alert-2',
          severity: 'high',
          is_resolved: false,
          alert_date: new Date('2023-01-20'),
          first_name: null,
          last_name: null,
        },
      ]

      // Mock getComplianceDashboard
      jest
        .spyOn(complianceAlertService, 'getComplianceDashboard')
        .mockResolvedValueOnce(mockDashboard)

      query.mockResolvedValueOnce({ rows: mockAlertHistory })

      const result = await complianceAlertService.generateComplianceReport(
        userId,
        startDate,
        endDate
      )

      expect(result.period).toEqual({ startDate, endDate })
      expect(result.dashboard).toMatchObject(mockDashboard)
      expect(result.alertHistory).toHaveLength(2)
      expect(result.summary.totalAlerts).toBe(2)
      expect(result.summary.resolvedAlerts).toBe(1)
      expect(result.summary.criticalAlerts).toBe(1)
      expect(result.summary.complianceScore).toBe(85)
    })

    it('should handle database errors', async () => {
      const userId = 'user123'
      const startDate = new Date('2023-01-01')
      const endDate = new Date('2023-12-31')

      jest
        .spyOn(complianceAlertService, 'getComplianceDashboard')
        .mockRejectedValueOnce(new Error('Database error'))

      await expect(
        complianceAlertService.generateComplianceReport(
          userId,
          startDate,
          endDate
        )
      ).rejects.toThrow('Échec de la génération du rapport de conformité')
    })
  })
})
