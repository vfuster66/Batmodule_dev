const express = require('express')
const Joi = require('joi')
const { authenticateToken } = require('../middleware/auth')
const companySettingsService = require('../services/companySettingsService')

const router = express.Router()

// Schémas de validation
const updateSettingsSchema = Joi.object({
  // Informations de base
  company_name: Joi.string().max(255).optional().allow('', null),
  legal_name: Joi.string().max(255).optional().allow('', null),
  primary_color: Joi.string()
    .pattern(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .allow('', null),
  secondary_color: Joi.string()
    .pattern(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .allow('', null),
  logo_url: Joi.string().uri().optional().allow('', null),
  logo_base64: Joi.string().optional().allow('', null),
  stamp_base64: Joi.string().optional().allow('', null),

  // Informations légales
  siret: Joi.string()
    .max(14)
    .pattern(/^\d{0,14}$/)
    .optional()
    .allow('', null),
  vat_number: Joi.string().max(20).optional().allow('', null),
  forme_juridique: Joi.string().max(100).optional().allow('', null),
  rcs_number: Joi.string().max(50).optional().allow('', null),
  tribunal_commercial: Joi.string().max(100).optional().allow('', null),
  tva_intracommunautaire: Joi.string().max(20).optional().allow('', null),
  ape_code: Joi.string().max(10).optional().allow('', null),
  code_ape: Joi.string().max(10).optional().allow('', null),
  capital_social: Joi.string().max(100).optional().allow('', null),
  dirigeant_nom: Joi.string().max(255).optional().allow('', null),
  dirigeant_qualite: Joi.string().max(100).optional().allow('', null),
  assurance_rc: Joi.string().max(255).optional().allow('', null),
  numero_rcs: Joi.string().max(50).optional().allow('', null),

  // Coordonnées
  address_line1: Joi.string().max(255).optional().allow('', null),
  address_line2: Joi.string().max(255).optional().allow('', null),
  postal_code: Joi.string().max(10).optional().allow('', null),
  city: Joi.string().max(100).optional().allow('', null),
  country: Joi.string().max(100).optional().allow('', null),
  phone: Joi.string().max(20).optional().allow('', null),
  email: Joi.string().email().optional().allow('', null),
  website: Joi.string().uri().optional().allow('', null),

  // Informations bancaires
  iban: Joi.string().max(34).optional().allow('', null),
  bic: Joi.string().max(11).optional().allow('', null),
  bank_name: Joi.string().max(255).optional().allow('', null),

  // Configuration facturation
  default_vat_rate: Joi.alternatives()
    .try(
      Joi.number().min(0).max(100),
      Joi.string()
        .pattern(/^\d+(\.\d{1,2})?$/)
        .optional()
        .allow('')
    )
    .optional()
    .allow(null, ''),
  currency: Joi.string().max(3).optional().allow('', null),
  payment_terms: Joi.alternatives()
    .try(
      Joi.number().integer().min(0).max(365),
      Joi.string().pattern(/^\d+$/).optional().allow('')
    )
    .optional()
    .allow(null, ''),
  quote_prefix: Joi.string().max(10).optional().allow('', null),
  invoice_prefix: Joi.string().max(10).optional().allow('', null),
  show_vat: Joi.boolean().optional().allow(null),
  show_logo_on_documents: Joi.boolean().optional().allow(null),

  // Pénalités de retard
  late_fee_rate: Joi.alternatives()
    .try(
      Joi.number().min(0).max(100),
      Joi.string()
        .pattern(/^\d+(\.\d{1,2})?$/)
        .optional()
        .allow('')
    )
    .optional()
    .allow(null, ''),
  late_fee_description: Joi.string().max(1000).optional().allow('', null),

  // Assurance
  insurance_company: Joi.string().max(255).optional().allow('', null),
  insurance_policy_number: Joi.string().max(100).optional().allow('', null),
  insurance_coverage: Joi.alternatives()
    .try(
      Joi.number().min(0),
      Joi.string()
        .pattern(/^\d+(\.\d{1,2})?$/)
        .optional()
        .allow('')
    )
    .optional()
    .allow('', null),

  // Médiateur de la consommation
  mediator_name: Joi.string().max(255).optional().allow('', null),
  mediator_website: Joi.string().uri().optional().allow('', null),
  mediator_contact: Joi.string().max(255).optional().allow('', null),

  // Configuration NF525
  cash_payments_enabled: Joi.boolean().optional().allow(null),
  nf525_compliant: Joi.boolean().optional().allow(null),
  cash_payment_limit: Joi.alternatives()
    .try(
      Joi.number().min(0),
      Joi.string()
        .pattern(/^\d+(\.\d{1,2})?$/)
        .optional()
        .allow('')
    )
    .optional()
    .allow(null, ''),

  // TVA sur encaissements
  vat_on_payments: Joi.boolean().optional().allow(null),
  vat_on_payments_text: Joi.string().max(500).optional().allow('', null),

  // Mentions légales
  legal_mentions: Joi.string().max(5000).optional().allow('', null),
  legal_notice: Joi.string().max(5000).optional().allow('', null),
  terms_conditions: Joi.string().max(5000).optional().allow('', null),
  privacy_policy: Joi.string().max(5000).optional().allow('', null),
  cgv: Joi.string().max(5000).optional().allow('', null),
  mentions_legales: Joi.string().max(5000).optional().allow('', null),
  politique_confidentialite: Joi.string().max(5000).optional().allow('', null),
  cgv_url: Joi.string().uri().optional().allow('', null),
  privacy_policy_url: Joi.string().uri().optional().allow('', null),
  document_footer: Joi.string().max(1000).optional().allow('', null),
  signature_email_base64: Joi.string().optional().allow('', null),

  // Configuration BTP
  reverse_charge_btp: Joi.boolean().optional().allow(null),
  reverse_charge_btp_text: Joi.string().max(500).optional().allow('', null),
  reduced_vat_10: Joi.boolean().optional().allow(null),
  reduced_vat_10_text: Joi.string().max(500).optional().allow('', null),
  reduced_vat_5_5: Joi.boolean().optional().allow(null),
  reduced_vat_5_5_text: Joi.string().max(500).optional().allow('', null),

  // Configuration NF525
  nf525_certificate_number: Joi.string().max(100).optional().allow('', null),
  nf525_certificate_date: Joi.string().optional().allow('', null),
  nf525_attestation_text: Joi.string().max(1000).optional().allow('', null),

  // RGPD
  rgpd_compliance: Joi.boolean().optional().allow(null),

  // Informations bancaires supplémentaires
  bank_address: Joi.string().max(500).optional().allow('', null),
  payment_instructions: Joi.string().max(1000).optional().allow('', null),

  // Compteurs (lecture seule, ne pas permettre la modification)
  quote_counter: Joi.number().integer().min(0).optional(),
  invoice_counter: Joi.number().integer().min(0).optional(),
})

// GET /api/company-settings - Récupérer les paramètres
router.get('/', authenticateToken, async (req, res) => {
  try {
    const settings = await companySettingsService.getSettings(req.user.userId)

    res.json({
      success: true,
      data: settings,
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres:', error)
    res
      .status(500)
      .json({ error: 'Erreur lors de la récupération des paramètres' })
  }
})

// PUT /api/company-settings - Mettre à jour les paramètres
router.put('/', authenticateToken, async (req, res) => {
  try {
    const { error, value } = updateSettingsSchema.validate(req.body)

    if (error) {
      return res.status(400).json({
        error: 'Données invalides',
        details: error.details.map((detail) => detail.message),
      })
    }

    console.log(
      '🔍 Données validées pour mise à jour:',
      JSON.stringify(value, null, 2)
    )
    const settings = await companySettingsService.updateSettings(
      req.user.userId,
      value
    )

    res.json({
      success: true,
      message: 'Paramètres mis à jour avec succès',
      data: settings,
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres:', error)
    res
      .status(500)
      .json({ error: 'Erreur lors de la mise à jour des paramètres' })
  }
})

// GET /api/company-settings/validate - Valider les paramètres
router.get('/validate', authenticateToken, async (req, res) => {
  try {
    const settings = await companySettingsService.getSettings(req.user.userId)
    const validation = companySettingsService.validateRequiredSettings(settings)

    const score = companySettingsService.calculateComplianceScore(settings)
    const missingFields = companySettingsService.getMissingFields(settings)
    const recommendations = companySettingsService.getRecommendations(settings)

    res.json({
      success: true,
      data: {
        isValid: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings,
        score: score,
        missingFields: missingFields,
        recommendations: recommendations,
      },
    })
  } catch (error) {
    console.error('Erreur lors de la validation des paramètres:', error)
    res
      .status(500)
      .json({ error: 'Erreur lors de la validation des paramètres' })
  }
})

// GET /api/company-settings/compliance-report - Rapport de conformité
router.get('/compliance-report', authenticateToken, async (req, res) => {
  try {
    const report = await companySettingsService.generateComplianceReport(
      req.user.userId
    )

    res.json({
      success: true,
      data: report,
    })
  } catch (error) {
    console.error('Erreur lors de la génération du rapport:', error)
    res.status(500).json({ error: 'Erreur lors de la génération du rapport' })
  }
})

// POST /api/company-settings/reset - Réinitialiser aux valeurs par défaut
router.post('/reset', authenticateToken, async (req, res) => {
  try {
    const { confirm } = req.body

    if (!confirm) {
      return res.status(400).json({
        error: 'Confirmation requise',
        message: 'Vous devez confirmer la réinitialisation des paramètres',
      })
    }

    // Supprimer les paramètres existants
    const { query } = require('../config/database')
    await query('DELETE FROM company_settings WHERE user_id = $1', [
      req.user.userId,
    ])

    // Créer de nouveaux paramètres par défaut
    const settings = await companySettingsService.createDefaultSettings(
      req.user.userId
    )

    res.json({
      success: true,
      message: 'Paramètres réinitialisés avec succès',
      data: settings,
    })
  } catch (error) {
    console.error('Erreur lors de la réinitialisation:', error)
    res
      .status(500)
      .json({ error: 'Erreur lors de la réinitialisation des paramètres' })
  }
})

router.get('/legal-templates', authenticateToken, async (req, res) => {
  try {
    const templates = {
      late_fee_description:
        "En cas de retard de paiement, des pénalités sont exigibles au taux légal en vigueur, ainsi qu'une indemnité forfaitaire pour frais de recouvrement de 40€ (art. L441‑10 C. com.).",
      vat_on_payments_text: 'TVA sur les encaissements (art. 283-1 CGI)',
      withdrawal_text:
        "Vous disposez d'un délai de rétractation de 14 jours pour renoncer à votre commande. Ce délai court à compter du jour de la signature du devis ou de la réception de la facture.",
      legal_mentions:
        'Société immatriculée au RCS de [VILLE] sous le numéro [RCS], TVA intracommunautaire [TVA], Code APE [APE]. Siège social : [ADRESSE].',
      forme_juridique_options: [
        'SARL',
        'SAS',
        'EURL',
        'SASU',
        'SA',
        'SNC',
        'SCI',
        'Auto-entrepreneur',
        'Micro-entreprise',
      ],
      country_options: ['France', 'Belgique', 'Suisse', 'Luxembourg', 'Monaco'],
    }

    res.json({
      success: true,
      data: templates,
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des modèles:', error)
    res
      .status(500)
      .json({ error: 'Erreur lors de la récupération des modèles' })
  }
})

module.exports = router
