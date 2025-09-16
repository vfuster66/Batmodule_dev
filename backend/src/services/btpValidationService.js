const { query } = require('../config/database')

class BTPValidationService {
  /**
   * Valide les conditions pour l'autoliquidation TVA BTP
   * @param {Object} params - Paramètres de validation
   * @param {string} params.clientVatNumber - Numéro de TVA du client
   * @param {boolean} params.clientIsVatRegistered - Client assujetti à la TVA
   * @param {boolean} params.reverseChargeBtp - Autoliquidation activée
   * @returns {Object} - Résultat de la validation
   */
  async validateReverseChargeBTP(params) {
    const { clientVatNumber, clientIsVatRegistered, reverseChargeBtp } = params

    const result = await query(
      'SELECT validate_reverse_charge_btp($1, $2, $3) as validation_result',
      [clientVatNumber, clientIsVatRegistered, reverseChargeBtp]
    )

    return result.rows[0].validation_result
  }

  /**
   * Valide les conditions pour la TVA réduite
   * @param {Object} params - Paramètres de validation
   * @param {string} params.propertyType - Type de propriété ('residential', 'commercial', 'mixed')
   * @param {number} params.propertyAgeYears - Âge de la propriété en années
   * @param {string} params.workType - Type de travaux ('renovation', 'energy_improvement', 'maintenance')
   * @param {number} params.reducedVatRate - Taux de TVA réduite (10 ou 5.5)
   * @returns {Object} - Résultat de la validation
   */
  async validateReducedVAT(params) {
    const { propertyType, propertyAgeYears, workType, reducedVatRate } = params

    const result = await query(
      'SELECT validate_reduced_vat_conditions($1, $2, $3, $4) as validation_result',
      [propertyType, propertyAgeYears, workType, reducedVatRate]
    )

    return result.rows[0].validation_result
  }

  /**
   * Valide toutes les conditions BTP pour une facture
   * @param {Object} invoiceData - Données de la facture
   * @returns {Object} - Résultat complet de la validation
   */
  async validateBTPConditions(invoiceData) {
    const validations = {}

    // Validation autoliquidation BTP
    if (invoiceData.reverseChargeBtp) {
      validations.btp = await this.validateReverseChargeBTP({
        clientVatNumber: invoiceData.clientVatNumber,
        clientIsVatRegistered: invoiceData.clientIsVatRegistered,
        reverseChargeBtp: invoiceData.reverseChargeBtp,
      })
    }

    // Validation TVA réduite
    if (invoiceData.reducedVatApplied) {
      validations.vat = await this.validateReducedVAT({
        propertyType: invoiceData.propertyType,
        propertyAgeYears: invoiceData.propertyAgeYears,
        workType: invoiceData.workType,
        reducedVatRate: invoiceData.reducedVatRate,
      })
    }

    // Validation globale
    const allValid = Object.values(validations).every((v) => v.is_valid)
    const allErrors = Object.values(validations)
      .flatMap((v) => v.error_messages || [])
      .filter(Boolean)

    return {
      isValid: allValid,
      validations,
      errors: allErrors,
      warnings: this.generateWarnings(invoiceData),
    }
  }

  /**
   * Génère des avertissements pour les conditions BTP
   * @param {Object} invoiceData - Données de la facture
   * @returns {Array} - Liste des avertissements
   */
  generateWarnings(invoiceData) {
    const warnings = []

    // Avertissement pour autoliquidation BTP
    if (invoiceData.reverseChargeBtp && !invoiceData.clientVatNumber) {
      warnings.push(
        'Autoliquidation BTP activée mais numéro de TVA client manquant'
      )
    }

    // Avertissement pour TVA réduite
    if (invoiceData.reducedVatApplied) {
      if (invoiceData.propertyType === 'commercial') {
        warnings.push(
          'TVA réduite généralement non applicable aux locaux commerciaux'
        )
      }
      if (
        invoiceData.propertyAgeYears < 2 &&
        invoiceData.reducedVatRate === 10
      ) {
        warnings.push('TVA 10% : Vérifiez que le logement a plus de 2 ans')
      }
    }

    return warnings
  }

  /**
   * Calcule le taux de TVA applicable selon les conditions BTP
   * @param {Object} invoiceData - Données de la facture
   * @returns {Object} - Taux de TVA et justifications
   */
  async calculateApplicableVATRate(invoiceData) {
    let applicableRate = 20.0 // Taux normal par défaut
    let justification = 'TVA au taux normal (20%)'
    let conditions = []

    // Autoliquidation BTP : TVA à 0
    if (invoiceData.reverseChargeBtp) {
      const btpValidation = await this.validateReverseChargeBTP({
        clientVatNumber: invoiceData.clientVatNumber,
        clientIsVatRegistered: invoiceData.clientIsVatRegistered,
        reverseChargeBtp: invoiceData.reverseChargeBtp,
      })

      if (btpValidation.is_valid) {
        applicableRate = 0.0
        justification =
          'TVA en sus, autoliquidation par le client (art. 283-2 CGI)'
        conditions.push('Client assujetti à la TVA')
        conditions.push('Autoliquidation BTP activée')
      }
    }

    // TVA réduite
    if (invoiceData.reducedVatApplied && !invoiceData.reverseChargeBtp) {
      const vatValidation = await this.validateReducedVAT({
        propertyType: invoiceData.propertyType,
        propertyAgeYears: invoiceData.propertyAgeYears,
        workType: invoiceData.workType,
        reducedVatRate: invoiceData.reducedVatRate,
      })

      if (vatValidation.is_valid) {
        applicableRate = invoiceData.reducedVatRate

        if (invoiceData.reducedVatRate === 10) {
          justification =
            "TVA 10% - Travaux de rénovation dans des locaux à usage d'habitation achevés depuis plus de deux ans"
          conditions.push("Logement d'habitation")
          conditions.push('Achevés depuis plus de 2 ans')
          conditions.push('Travaux de rénovation')
        } else if (invoiceData.reducedVatRate === 5.5) {
          justification =
            "TVA 5,5% - Travaux d'amélioration de la qualité énergétique des locaux à usage d'habitation"
          conditions.push("Logement d'habitation")
          conditions.push("Travaux d'amélioration énergétique")
        }
      }
    }

    return {
      rate: applicableRate,
      justification,
      conditions,
      isReverseCharge: invoiceData.reverseChargeBtp,
      isReducedRate:
        invoiceData.reducedVatApplied && !invoiceData.reverseChargeBtp,
    }
  }

  /**
   * Récupère les statistiques de validation BTP pour un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {Date} startDate - Date de début (optionnel)
   * @param {Date} endDate - Date de fin (optionnel)
   * @returns {Object} - Statistiques de validation
   */
  async getBTPValidationStats(userId, startDate = null, endDate = null) {
    let whereClause = 'WHERE user_id = $1'
    let params = [userId]

    if (startDate && endDate) {
      whereClause += ' AND created_at BETWEEN $2 AND $3'
      params.push(startDate, endDate)
    }

    const result = await query(
      `
            SELECT 
                COUNT(*) as total_invoices,
                COUNT(CASE WHEN reverse_charge_btp = true THEN 1 END) as reverse_charge_count,
                COUNT(CASE WHEN reduced_vat_applied = true THEN 1 END) as reduced_vat_count,
                COUNT(CASE WHEN validation_checks->>'btp_validation' IS NOT NULL THEN 1 END) as btp_validated_count,
                COUNT(CASE WHEN validation_checks->>'vat_validation' IS NOT NULL THEN 1 END) as vat_validated_count,
                AVG(CASE WHEN reduced_vat_applied THEN reduced_vat_rate ELSE 20 END) as avg_vat_rate
            FROM invoices 
            ${whereClause}
        `,
      params
    )

    const stats = result.rows[0]

    return {
      totalInvoices: parseInt(stats.total_invoices),
      reverseChargeInvoices: parseInt(stats.reverse_charge_count),
      reducedVATInvoices: parseInt(stats.reduced_vat_count),
      btpValidatedInvoices: parseInt(stats.btp_validated_count),
      vatValidatedInvoices: parseInt(stats.vat_validated_count),
      averageVATRate: parseFloat(stats.avg_vat_rate) || 20.0,
      period: { startDate, endDate },
    }
  }
}

module.exports = new BTPValidationService()
