const { query } = require('../config/database')

class InsuranceService {
  /**
   * Récupère toutes les assurances d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {string} type - Type d'assurance (optionnel)
   * @returns {Array} - Liste des assurances
   */
  async getInsurances(userId, type = null) {
    try {
      let whereClause = 'WHERE user_id = $1'
      let params = [userId]

      if (type) {
        whereClause += ' AND certificate_type = $2'
        params.push(type)
      }

      const result = await query(
        `SELECT * FROM insurance_certificates 
                 ${whereClause}
                 ORDER BY end_date DESC, created_at DESC`,
        params
      )

      return result.rows
    } catch (error) {
      console.error('Erreur lors de la récupération des assurances:', error)
      throw new Error('Échec de la récupération des assurances')
    }
  }

  /**
   * Récupère une assurance par ID
   * @param {string} insuranceId - ID de l'assurance
   * @param {string} userId - ID de l'utilisateur
   * @returns {Object} - Assurance
   */
  async getInsuranceById(insuranceId, userId) {
    try {
      const result = await query(
        'SELECT * FROM insurance_certificates WHERE id = $1 AND user_id = $2',
        [insuranceId, userId]
      )

      if (result.rows.length === 0) {
        throw new Error('Assurance non trouvée')
      }

      return result.rows[0]
    } catch (error) {
      console.error("Erreur lors de la récupération de l'assurance:", error)
      throw error
    }
  }

  /**
   * Crée une nouvelle assurance
   * @param {Object} insuranceData - Données de l'assurance
   * @returns {Object} - Assurance créée
   */
  async createInsurance(insuranceData) {
    try {
      const {
        userId,
        certificateType,
        certificateNumber,
        insuranceCompany,
        policyNumber,
        startDate,
        endDate,
        coverageAmount,
        deductible,
        notes,
        documentUrl,
      } = insuranceData

      const result = await query(
        `INSERT INTO insurance_certificates 
                 (user_id, certificate_type, certificate_number, insurance_company, 
                  policy_number, start_date, end_date, coverage_amount, deductible, 
                  notes, document_url)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                 RETURNING *`,
        [
          userId,
          certificateType,
          certificateNumber,
          insuranceCompany,
          policyNumber,
          startDate,
          endDate,
          coverageAmount,
          deductible,
          notes,
          documentUrl,
        ]
      )

      return result.rows[0]
    } catch (error) {
      console.error("Erreur lors de la création de l'assurance:", error)
      throw new Error("Échec de la création de l'assurance")
    }
  }

  /**
   * Met à jour une assurance
   * @param {string} insuranceId - ID de l'assurance
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} updateData - Données à mettre à jour
   * @returns {Object} - Assurance mise à jour
   */
  async updateInsurance(insuranceId, userId, updateData) {
    try {
      const fields = []
      const values = []
      let paramCount = 1

      // Construire dynamiquement la requête UPDATE
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] !== undefined) {
          fields.push(`${key} = $${paramCount}`)
          values.push(updateData[key])
          paramCount++
        }
      })

      if (fields.length === 0) {
        throw new Error('Aucune donnée à mettre à jour')
      }

      fields.push(`updated_at = CURRENT_TIMESTAMP`)
      values.push(insuranceId, userId)

      const result = await query(
        `UPDATE insurance_certificates 
                 SET ${fields.join(', ')}
                 WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
                 RETURNING *`,
        values
      )

      if (result.rows.length === 0) {
        throw new Error('Assurance non trouvée')
      }

      return result.rows[0]
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'assurance:", error)
      throw error
    }
  }

  /**
   * Supprime une assurance
   * @param {string} insuranceId - ID de l'assurance
   * @param {string} userId - ID de l'utilisateur
   * @returns {boolean} - Succès de la suppression
   */
  async deleteInsurance(insuranceId, userId) {
    try {
      const result = await query(
        'DELETE FROM insurance_certificates WHERE id = $1 AND user_id = $2',
        [insuranceId, userId]
      )

      return result.rowCount > 0
    } catch (error) {
      console.error("Erreur lors de la suppression de l'assurance:", error)
      throw new Error("Échec de la suppression de l'assurance")
    }
  }

  /**
   * Récupère les assurances expirant bientôt
   * @param {string} userId - ID de l'utilisateur
   * @param {number} days - Nombre de jours avant expiration
   * @returns {Array} - Assurances expirant bientôt
   */
  async getExpiringInsurances(userId, days = 30) {
    try {
      const result = await query(
        `SELECT * FROM insurance_certificates 
                 WHERE user_id = $1 
                 AND is_active = true 
                 AND end_date <= CURRENT_DATE + INTERVAL '${days} days'
                 ORDER BY end_date ASC`,
        [userId]
      )

      return result.rows
    } catch (error) {
      console.error(
        'Erreur lors de la récupération des assurances expirantes:',
        error
      )
      throw new Error('Échec de la récupération des assurances expirantes')
    }
  }

  /**
   * Vérifie la conformité des assurances pour un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Object} - Rapport de conformité
   */
  async checkInsuranceCompliance(userId) {
    try {
      const result = await query(
        `SELECT 
                    certificate_type,
                    COUNT(*) as total_count,
                    COUNT(CASE WHEN is_active = true THEN 1 END) as active_count,
                    COUNT(CASE WHEN end_date > CURRENT_DATE THEN 1 END) as valid_count,
                    COUNT(CASE WHEN end_date <= CURRENT_DATE THEN 1 END) as expired_count,
                    COUNT(CASE WHEN end_date <= CURRENT_DATE + INTERVAL '30 days' AND end_date > CURRENT_DATE THEN 1 END) as expiring_soon_count
                 FROM insurance_certificates 
                 WHERE user_id = $1
                 GROUP BY certificate_type`,
        [userId]
      )

      const compliance = {
        isCompliant: true,
        warnings: [],
        errors: [],
        summary: {},
      }

      result.rows.forEach((row) => {
        compliance.summary[row.certificate_type] = {
          total: parseInt(row.total_count),
          active: parseInt(row.active_count),
          valid: parseInt(row.valid_count),
          expired: parseInt(row.expired_count),
          expiringSoon: parseInt(row.expiring_soon_count),
        }

        // Vérifier les obligations légales
        if (row.certificate_type === 'decennale' && row.active_count == 0) {
          compliance.isCompliant = false
          compliance.errors.push('Assurance décennale obligatoire manquante')
        }

        if (row.certificate_type === 'rc_pro' && row.active_count == 0) {
          compliance.isCompliant = false
          compliance.errors.push('Assurance RC Pro obligatoire manquante')
        }

        if (row.expired_count > 0) {
          compliance.warnings.push(
            `${row.certificate_type}: ${row.expired_count} assurance(s) expirée(s)`
          )
        }

        if (row.expiring_soon_count > 0) {
          compliance.warnings.push(
            `${row.certificate_type}: ${row.expiring_soon_count} assurance(s) expirant bientôt`
          )
        }
      })

      return compliance
    } catch (error) {
      console.error('Erreur lors de la vérification de conformité:', error)
      throw new Error('Échec de la vérification de conformité')
    }
  }

  /**
   * Génère un rapport d'assurances pour une période
   * @param {string} userId - ID de l'utilisateur
   * @param {Date} startDate - Date de début
   * @param {Date} endDate - Date de fin
   * @returns {Object} - Rapport d'assurances
   */
  async generateInsuranceReport(userId, startDate, endDate) {
    try {
      const result = await query(
        `SELECT 
                    ic.*,
                    u.first_name,
                    u.last_name,
                    u.company_name
                 FROM insurance_certificates ic
                 JOIN users u ON ic.user_id = u.id
                 WHERE ic.user_id = $1
                 AND ic.created_at BETWEEN $2 AND $3
                 ORDER BY ic.created_at DESC`,
        [userId, startDate, endDate]
      )

      const summary = {
        totalInsurances: result.rows.length,
        byType: {},
        totalCoverage: 0,
        expiringSoon: 0,
        expired: 0,
      }

      result.rows.forEach((insurance) => {
        const type = insurance.certificate_type
        if (!summary.byType[type]) {
          summary.byType[type] = 0
        }
        summary.byType[type]++

        if (insurance.coverage_amount) {
          summary.totalCoverage += parseFloat(insurance.coverage_amount)
        }

        if (insurance.end_date <= new Date()) {
          summary.expired++
        } else if (
          insurance.end_date <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        ) {
          summary.expiringSoon++
        }
      })

      return {
        period: { startDate, endDate },
        insurances: result.rows,
        summary,
      }
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error)
      throw new Error("Échec de la génération du rapport d'assurances")
    }
  }
}

module.exports = new InsuranceService()
