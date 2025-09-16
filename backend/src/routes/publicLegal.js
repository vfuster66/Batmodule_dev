const express = require('express')
const router = express.Router()
const companySettingsService = require('../services/companySettingsService')
const { authenticateToken } = require('../middleware/auth')

// GET /api/public/legal/current - Récupérer les paramètres de l'utilisateur connecté
router.get('/current', authenticateToken, async (req, res) => {
  try {
    const settings = await companySettingsService.getSettings(
      req.user.userId,
      false
    )

    if (!settings) {
      return res.status(404).json({
        error: 'Paramètres non trouvés',
        message: "Aucun paramètre d'entreprise configuré",
      })
    }

    res.json({
      success: true,
      data: settings,
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres:', error)
    res.status(500).json({
      error: 'Erreur lors de la récupération des paramètres',
    })
  }
})

// GET /api/public/legal/mentions - Mentions légales publiques
router.get('/mentions', async (req, res) => {
  try {
    // Récupérer les paramètres de l'entreprise par ID ou par domaine
    const companyId = req.query.company_id || req.query.domain

    if (!companyId) {
      return res.status(400).json({
        error: "ID de l'entreprise ou domaine requis",
      })
    }

    // Vérifier si c'est un UUID valide, sinon utiliser un ID par défaut
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const validCompanyId = uuidRegex.test(companyId)
      ? companyId
      : '8f843e79-7460-4f3e-874b-28ff8bab3316'

    const settings = await companySettingsService.getSettings(
      validCompanyId,
      false
    )

    if (!settings) {
      return res.status(404).json({
        error: 'Entreprise non trouvée',
      })
    }

    // Retourner seulement les informations publiques nécessaires
    const publicData = {
      company_name: settings.company_name,
      legal_name: settings.legal_name,
      forme_juridique: settings.forme_juridique,
      siret: settings.siret,
      vat_number: settings.vat_number,
      rcs_number: settings.rcs_number,
      ape_code: settings.ape_code,
      address_line1: settings.address_line1,
      address_line2: settings.address_line2,
      postal_code: settings.postal_code,
      city: settings.city,
      country: settings.country,
      phone: settings.phone,
      email: settings.email,
      website: settings.website,
      dirigeant_nom: settings.dirigeant_nom,
      dirigeant_qualite: settings.dirigeant_qualite,
      tribunal_commercial: settings.tribunal_commercial,
      assurance_rc: settings.assurance_rc,
      capital_social: settings.capital_social,
      mentions_legales: settings.mentions_legales,
      legal_notice: settings.legal_notice,
      terms_conditions: settings.terms_conditions,
      privacy_policy: settings.privacy_policy,
      cgv: settings.cgv,
      politique_confidentialite: settings.politique_confidentialite,
      rgpd_compliance: settings.rgpd_compliance,
      late_fee_description: settings.late_fee_description,
      vat_on_payments: settings.vat_on_payments,
      vat_on_payments_text: settings.vat_on_payments_text,
      is_b2c: settings.is_b2c,
      withdrawal_applicable: settings.withdrawal_applicable,
      withdrawal_text: settings.withdrawal_text,
    }

    res.json({
      success: true,
      data: publicData,
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des mentions légales:', error)
    res.status(500).json({
      error: 'Erreur lors de la récupération des mentions légales',
    })
  }
})

// GET /api/public/legal/cgv - CGV publiques
router.get('/cgv', async (req, res) => {
  try {
    const companyId = req.query.company_id || req.query.domain

    if (!companyId) {
      return res.status(400).json({
        error: "ID de l'entreprise ou domaine requis",
      })
    }

    // Vérifier si c'est un UUID valide, sinon utiliser un ID par défaut
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const validCompanyId = uuidRegex.test(companyId)
      ? companyId
      : '8f843e79-7460-4f3e-874b-28ff8bab3316'

    const settings = await companySettingsService.getSettings(
      validCompanyId,
      false
    )

    if (!settings) {
      return res.status(404).json({
        error: 'Entreprise non trouvée',
      })
    }

    const cgvData = {
      company_name: settings.company_name,
      legal_name: settings.legal_name,
      cgv: settings.cgv,
      terms_conditions: settings.terms_conditions,
      late_fee_description: settings.late_fee_description,
      vat_on_payments: settings.vat_on_payments,
      vat_on_payments_text: settings.vat_on_payments_text,
      is_b2c: settings.is_b2c,
      withdrawal_applicable: settings.withdrawal_applicable,
      withdrawal_text: settings.withdrawal_text,
      cgv_url: settings.cgv_url,
    }

    res.json({
      success: true,
      data: cgvData,
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des CGV:', error)
    res.status(500).json({
      error: 'Erreur lors de la récupération des CGV',
    })
  }
})

// GET /api/public/legal/privacy - Politique de confidentialité publique
router.get('/privacy', async (req, res) => {
  try {
    const companyId = req.query.company_id || req.query.domain

    if (!companyId) {
      return res.status(400).json({
        error: "ID de l'entreprise ou domaine requis",
      })
    }

    // Vérifier si c'est un UUID valide, sinon utiliser un ID par défaut
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const validCompanyId = uuidRegex.test(companyId)
      ? companyId
      : '8f843e79-7460-4f3e-874b-28ff8bab3316'

    const settings = await companySettingsService.getSettings(
      validCompanyId,
      false
    )

    if (!settings) {
      return res.status(404).json({
        error: 'Entreprise non trouvée',
      })
    }

    const privacyData = {
      company_name: settings.company_name,
      legal_name: settings.legal_name,
      privacy_policy: settings.privacy_policy,
      politique_confidentialite: settings.politique_confidentialite,
      rgpd_compliance: settings.rgpd_compliance,
      privacy_policy_url: settings.privacy_policy_url,
      email: settings.email,
      phone: settings.phone,
      address_line1: settings.address_line1,
      address_line2: settings.address_line2,
      postal_code: settings.postal_code,
      city: settings.city,
      country: settings.country,
    }

    res.json({
      success: true,
      data: privacyData,
    })
  } catch (error) {
    console.error(
      'Erreur lors de la récupération de la politique de confidentialité:',
      error
    )
    res.status(500).json({
      error:
        'Erreur lors de la récupération de la politique de confidentialité',
    })
  }
})

module.exports = router
