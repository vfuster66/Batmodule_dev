const { query } = require('../config/database')

class ComplianceAlertService {
  /**
   * Génère toutes les alertes de conformité pour un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Object} - Résultat de la génération des alertes
   */
  async generateAllAlerts(userId) {
    try {
      // Exécuter la fonction de génération d'alertes
      await query('SELECT generate_compliance_alerts()')

      // Récupérer les alertes pour l'utilisateur
      const result = await query(
        `SELECT 
                    ca.*,
                    CASE 
                        WHEN ca.entity_type = 'insurance' THEN ic.certificate_type
                        WHEN ca.entity_type = 'certification' THEN c.certification_type
                        WHEN ca.entity_type = 'training' THEN st.training_type
                        WHEN ca.entity_type = 'equipment' THEN ppe.equipment_type
                    END as entity_subtype,
                    CASE 
                        WHEN ca.entity_type = 'insurance' THEN ic.insurance_company
                        WHEN ca.entity_type = 'certification' THEN c.issuing_body
                        WHEN ca.entity_type = 'training' THEN st.provider
                        WHEN ca.entity_type = 'equipment' THEN ppe.brand
                    END as entity_name
                 FROM compliance_alerts ca
                 LEFT JOIN insurance_certificates ic ON ca.entity_type = 'insurance' AND ca.entity_id = ic.id
                 LEFT JOIN certifications c ON ca.entity_type = 'certification' AND ca.entity_id = c.id
                 LEFT JOIN safety_training st ON ca.entity_type = 'training' AND ca.entity_id = st.id
                 LEFT JOIN personal_protective_equipment ppe ON ca.entity_type = 'equipment' AND ca.entity_id = ppe.id
                 WHERE ca.user_id = $1
                 ORDER BY ca.severity DESC, ca.alert_date ASC`,
        [userId]
      )

      return {
        success: true,
        alerts: result.rows,
        count: result.rows.length,
        bySeverity: this.groupAlertsBySeverity(result.rows),
      }
    } catch (error) {
      console.error('Erreur lors de la génération des alertes:', error)
      throw new Error('Échec de la génération des alertes')
    }
  }

  /**
   * Récupère les alertes d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {string} severity - Gravité (optionnel)
   * @param {boolean} unresolved - Seulement les non résolues (optionnel)
   * @returns {Array} - Liste des alertes
   */
  async getAlerts(userId, severity = null, unresolved = true) {
    try {
      let whereClause = 'WHERE ca.user_id = $1'
      let params = [userId]

      if (severity) {
        whereClause += ' AND ca.severity = $2'
        params.push(severity)
      }

      if (unresolved) {
        whereClause += ` AND ca.is_resolved = false`
      }

      const result = await query(
        `SELECT 
                    ca.*,
                    CASE 
                        WHEN ca.entity_type = 'insurance' THEN ic.certificate_type
                        WHEN ca.entity_type = 'certification' THEN c.certification_type
                        WHEN ca.entity_type = 'training' THEN st.training_type
                        WHEN ca.entity_type = 'equipment' THEN ppe.equipment_type
                    END as entity_subtype,
                    CASE 
                        WHEN ca.entity_type = 'insurance' THEN ic.insurance_company
                        WHEN ca.entity_type = 'certification' THEN c.issuing_body
                        WHEN ca.entity_type = 'training' THEN st.provider
                        WHEN ca.entity_type = 'equipment' THEN ppe.brand
                    END as entity_name
                 FROM compliance_alerts ca
                 LEFT JOIN insurance_certificates ic ON ca.entity_type = 'insurance' AND ca.entity_id = ic.id
                 LEFT JOIN certifications c ON ca.entity_type = 'certification' AND ca.entity_id = c.id
                 LEFT JOIN safety_training st ON ca.entity_type = 'training' AND ca.entity_id = st.id
                 LEFT JOIN personal_protective_equipment ppe ON ca.entity_type = 'equipment' AND ca.entity_id = ppe.id
                 ${whereClause}
                 ORDER BY ca.severity DESC, ca.alert_date ASC`,
        params
      )

      return result.rows
    } catch (error) {
      console.error('Erreur lors de la récupération des alertes:', error)
      throw new Error('Échec de la récupération des alertes')
    }
  }

  /**
   * Marque une alerte comme résolue
   * @param {string} alertId - ID de l'alerte
   * @param {string} userId - ID de l'utilisateur
   * @param {string} notes - Notes de résolution
   * @returns {Object} - Alerte mise à jour
   */
  async resolveAlert(alertId, userId, notes = null) {
    try {
      const result = await query(
        `UPDATE compliance_alerts 
                 SET is_resolved = true, resolved_at = CURRENT_TIMESTAMP, resolved_by = $1, notes = $2
                 WHERE id = $3 AND user_id = $4
                 RETURNING *`,
        [userId, notes, alertId, userId]
      )

      if (result.rows.length === 0) {
        throw new Error('Alerte non trouvée')
      }

      return result.rows[0]
    } catch (error) {
      console.error("Erreur lors de la résolution de l'alerte:", error)
      throw error
    }
  }

  /**
   * Supprime une alerte
   * @param {string} alertId - ID de l'alerte
   * @param {string} userId - ID de l'utilisateur
   * @returns {boolean} - Succès de la suppression
   */
  async deleteAlert(alertId, userId) {
    try {
      const result = await query(
        'DELETE FROM compliance_alerts WHERE id = $1 AND user_id = $2',
        [alertId, userId]
      )

      return result.rowCount > 0
    } catch (error) {
      console.error("Erreur lors de la suppression de l'alerte:", error)
      throw new Error("Échec de la suppression de l'alerte")
    }
  }

  /**
   * Récupère le tableau de bord de conformité
   * @param {string} userId - ID de l'utilisateur
   * @returns {Object} - Tableau de bord de conformité
   */
  async getComplianceDashboard(userId) {
    try {
      // Générer les alertes d'abord
      await this.generateAllAlerts(userId)

      // Récupérer les statistiques générales
      const statsResult = await query(
        `SELECT 
                    (SELECT COUNT(*) FROM insurance_certificates WHERE user_id = $1 AND is_active = true) as active_insurances,
                    (SELECT COUNT(*) FROM certifications WHERE user_id = $1 AND is_active = true) as active_certifications,
                    (SELECT COUNT(*) FROM safety_training WHERE user_id = $1 AND is_valid = true) as valid_trainings,
                    (SELECT COUNT(*) FROM personal_protective_equipment WHERE user_id = $1 AND is_active = true) as active_equipment,
                    (SELECT COUNT(*) FROM compliance_alerts WHERE user_id = $1 AND is_resolved = false) as unresolved_alerts,
                    (SELECT COUNT(*) FROM compliance_alerts WHERE user_id = $1 AND is_resolved = false AND severity = 'critical') as critical_alerts,
                    (SELECT COUNT(*) FROM compliance_alerts WHERE user_id = $1 AND is_resolved = false AND severity = 'high') as high_alerts
                `,
        [userId]
      )

      const stats = statsResult.rows[0]

      // Récupérer les alertes récentes
      const recentAlerts = await this.getAlerts(userId, null, true)

      // Calculer le score de conformité
      const complianceScore = this.calculateComplianceScore(stats)

      // Récupérer les éléments expirant bientôt
      const expiringSoon = await this.getExpiringItems(userId)

      return {
        complianceScore,
        statistics: {
          activeInsurances: parseInt(stats.active_insurances),
          activeCertifications: parseInt(stats.active_certifications),
          validTrainings: parseInt(stats.valid_trainings),
          activeEquipment: parseInt(stats.active_equipment),
          unresolvedAlerts: parseInt(stats.unresolved_alerts),
          criticalAlerts: parseInt(stats.critical_alerts),
          highAlerts: parseInt(stats.high_alerts),
        },
        recentAlerts: recentAlerts.slice(0, 10),
        expiringSoon,
        recommendations: this.generateRecommendations(stats, recentAlerts),
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du tableau de bord:', error)
      throw new Error('Échec de la récupération du tableau de bord')
    }
  }

  /**
   * Calcule le score de conformité
   * @param {Object} stats - Statistiques
   * @returns {number} - Score de conformité (0-100)
   */
  calculateComplianceScore(stats) {
    let score = 100

    // Pénalités pour les alertes critiques
    score -= parseInt(stats.critical_alerts) * 20

    // Pénalités pour les alertes importantes
    score -= parseInt(stats.high_alerts) * 10

    // Pénalités pour les alertes non résolues
    score -= parseInt(stats.unresolved_alerts) * 5

    // Bonus pour avoir des assurances
    if (parseInt(stats.active_insurances) > 0) score += 10

    // Bonus pour avoir des certifications
    if (parseInt(stats.active_certifications) > 0) score += 5

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Récupère les éléments expirant bientôt
   * @param {string} userId - ID de l'utilisateur
   * @returns {Array} - Éléments expirant bientôt
   */
  async getExpiringItems(userId) {
    try {
      const result = await query(
        `SELECT 
                    'insurance' as type,
                    certificate_type as subtype,
                    certificate_number as number,
                    insurance_company as name,
                    end_date,
                    'Assurance' as category
                 FROM insurance_certificates 
                 WHERE user_id = $1 AND is_active = true AND end_date <= CURRENT_DATE + INTERVAL '30 days'
                 
                 UNION ALL
                 
                 SELECT 
                    'certification' as type,
                    certification_type as subtype,
                    certification_number as number,
                    issuing_body as name,
                    end_date,
                    'Certification' as category
                 FROM certifications 
                 WHERE user_id = $1 AND is_active = true AND end_date <= CURRENT_DATE + INTERVAL '30 days'
                 
                 UNION ALL
                 
                 SELECT 
                    'training' as type,
                    training_type as subtype,
                    certificate_number as number,
                    provider as name,
                    end_date,
                    'Formation' as category
                 FROM safety_training 
                 WHERE user_id = $1 AND is_valid = true AND end_date <= CURRENT_DATE + INTERVAL '30 days'
                 
                 UNION ALL
                 
                 SELECT 
                    'equipment' as type,
                    equipment_type as subtype,
                    equipment_name as number,
                    brand as name,
                    expiry_date as end_date,
                    'Équipement' as category
                 FROM personal_protective_equipment 
                 WHERE user_id = $1 AND is_active = true AND expiry_date IS NOT NULL AND expiry_date <= CURRENT_DATE + INTERVAL '30 days'
                 
                 ORDER BY end_date ASC`,
        [userId]
      )

      return result.rows
    } catch (error) {
      console.error(
        'Erreur lors de la récupération des éléments expirants:',
        error
      )
      return []
    }
  }

  /**
   * Génère des recommandations de conformité
   * @param {Object} stats - Statistiques
   * @param {Array} alerts - Alertes
   * @returns {Array} - Recommandations
   */
  generateRecommendations(stats) {
    const recommendations = []

    if (parseInt(stats.active_insurances) === 0) {
      recommendations.push({
        priority: 'high',
        category: 'insurance',
        title: 'Assurance décennale obligatoire',
        description:
          'Vous devez souscrire une assurance décennale pour exercer légalement dans le BTP',
        action: 'Souscrire une assurance décennale',
      })
    }

    if (parseInt(stats.active_certifications) === 0) {
      recommendations.push({
        priority: 'medium',
        category: 'certification',
        title: 'Certifications recommandées',
        description:
          'Obtenez des certifications (RGE, Qualibat) pour améliorer votre crédibilité',
        action: 'Envisager des certifications professionnelles',
      })
    }

    if (parseInt(stats.critical_alerts) > 0) {
      recommendations.push({
        priority: 'critical',
        category: 'alerts',
        title: 'Alertes critiques à traiter',
        description: `${stats.critical_alerts} alerte(s) critique(s) nécessitent une attention immédiate`,
        action: 'Résoudre les alertes critiques',
      })
    }

    if (parseInt(stats.valid_trainings) === 0) {
      recommendations.push({
        priority: 'medium',
        category: 'training',
        title: 'Formations de sécurité',
        description: 'Planifiez des formations de sécurité pour vos employés',
        action: 'Organiser des formations SST et HSE',
      })
    }

    return recommendations
  }

  /**
   * Groupe les alertes par gravité
   * @param {Array} alerts - Liste des alertes
   * @returns {Object} - Alertes groupées par gravité
   */
  groupAlertsBySeverity(alerts) {
    return alerts.reduce((groups, alert) => {
      if (!groups[alert.severity]) {
        groups[alert.severity] = []
      }
      groups[alert.severity].push(alert)
      return groups
    }, {})
  }

  /**
   * Génère un rapport de conformité
   * @param {string} userId - ID de l'utilisateur
   * @param {Date} startDate - Date de début
   * @param {Date} endDate - Date de fin
   * @returns {Object} - Rapport de conformité
   */
  async generateComplianceReport(userId, startDate, endDate) {
    try {
      const dashboard = await this.getComplianceDashboard(userId)

      // Récupérer l'historique des alertes pour la période
      const historyResult = await query(
        `SELECT 
                    ca.*,
                    u.first_name,
                    u.last_name
                 FROM compliance_alerts ca
                 LEFT JOIN users u ON ca.resolved_by = u.id
                 WHERE ca.user_id = $1
                 AND ca.alert_date BETWEEN $2 AND $3
                 ORDER BY ca.alert_date DESC`,
        [userId, startDate, endDate]
      )

      return {
        period: { startDate, endDate },
        dashboard,
        alertHistory: historyResult.rows,
        summary: {
          totalAlerts: historyResult.rows.length,
          resolvedAlerts: historyResult.rows.filter((a) => a.is_resolved)
            .length,
          criticalAlerts: historyResult.rows.filter(
            (a) => a.severity === 'critical'
          ).length,
          complianceScore: dashboard.complianceScore,
        },
      }
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error)
      throw new Error('Échec de la génération du rapport de conformité')
    }
  }
}

module.exports = new ComplianceAlertService()
