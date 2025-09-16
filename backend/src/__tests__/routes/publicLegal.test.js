/* eslint-disable no-unused-vars */
const request = require('supertest')
const express = require('express')
const publicLegalRouter = require('../../routes/publicLegal')
const { authenticateToken } = require('../../middleware/auth')
const companySettingsService = require('../../services/companySettingsService')

// Mock des dépendances
jest.mock('../../middleware/auth')
jest.mock('../../services/companySettingsService')

const app = express()
app.use(express.json())
app.use('/public-legal', publicLegalRouter)

describe('Public Legal Routes', () => {
  beforeEach(() => {
    authenticateToken.mockImplementation((req, res, next) => {
      req.user = { userId: 'test-user-id' }
      next()
    })
    jest.clearAllMocks()
  })

  describe('GET /public-legal/current', () => {
    it('should return current company settings successfully', async () => {
      const mockSettings = {
        id: 'settings-1',
        company_name: 'Test Company',
        legal_name: 'Test Company SARL',
        email: 'test@company.com',
        phone: '0123456789',
        address_line1: '123 Test Street',
        city: 'Paris',
        postal_code: '75001',
        country: 'France',
        siret: '12345678901234',
        vat_number: 'FR12345678901',
        forme_juridique: 'SARL',
        capital_social: '10000',
      }

      companySettingsService.getSettings.mockResolvedValue(mockSettings)

      const response = await request(app)
        .get('/public-legal/current')
        .set('Authorization', 'Bearer valid-token')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toMatchObject({
        id: 'settings-1',
        company_name: 'Test Company',
        legal_name: 'Test Company SARL',
        email: 'test@company.com',
        phone: '0123456789',
        address_line1: '123 Test Street',
        city: 'Paris',
        postal_code: '75001',
        country: 'France',
        siret: '12345678901234',
        vat_number: 'FR12345678901',
        forme_juridique: 'SARL',
        capital_social: '10000',
      })
    })

    it('should return 404 if no settings found', async () => {
      companySettingsService.getSettings.mockResolvedValue(null)

      const response = await request(app)
        .get('/public-legal/current')
        .set('Authorization', 'Bearer valid-token')
        .expect(404)

      expect(response.body.error).toBe('Paramètres non trouvés')
      expect(response.body.message).toBe(
        "Aucun paramètre d'entreprise configuré"
      )
    })

    it('should handle service errors', async () => {
      companySettingsService.getSettings.mockRejectedValue(
        new Error('Database error')
      )

      const response = await request(app)
        .get('/public-legal/current')
        .set('Authorization', 'Bearer valid-token')
        .expect(500)

      expect(response.body.error).toBe(
        'Erreur lors de la récupération des paramètres'
      )
    })

    it('should require authentication', async () => {
      authenticateToken.mockImplementation((req, res, _next) => {
        res.status(401).json({ error: 'Token manquant' })
      })

      const response = await request(app)
        .get('/public-legal/current')
        .expect(401)

      expect(response.body.error).toBe('Token manquant')
    })
  })

  describe('GET /public-legal/mentions', () => {
    it('should return legal mentions successfully', async () => {
      const mockSettings = {
        company_name: 'Test Company',
        legal_name: 'Test Company SARL',
        siret: '12345678901234',
        vat_number: 'FR12345678901',
        address_line1: '123 Test Street',
        city: 'Paris',
        postal_code: '75001',
        country: 'France',
        phone: '0123456789',
        email: 'test@company.com',
        website: 'https://test.com',
        dirigeant_nom: 'John Doe',
        dirigeant_qualite: 'Gérant',
        tribunal_commercial: 'Paris',
        capital_social: '10000',
        mentions_legales: 'Mentions légales complètes...',
      }

      companySettingsService.getSettings.mockResolvedValue(mockSettings)

      const response = await request(app)
        .get('/public-legal/mentions?company_id=test-company-id')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toMatchObject({
        company_name: 'Test Company',
        legal_name: 'Test Company SARL',
        siret: '12345678901234',
        vat_number: 'FR12345678901',
        address_line1: '123 Test Street',
        city: 'Paris',
        postal_code: '75001',
        country: 'France',
        phone: '0123456789',
        email: 'test@company.com',
        website: 'https://test.com',
        dirigeant_nom: 'John Doe',
        dirigeant_qualite: 'Gérant',
        tribunal_commercial: 'Paris',
        capital_social: '10000',
        mentions_legales: 'Mentions légales complètes...',
      })
    })

    it('should return 400 if no company_id provided', async () => {
      const response = await request(app)
        .get('/public-legal/mentions')
        .expect(400)

      expect(response.body.error).toBe("ID de l'entreprise ou domaine requis")
    })

    it('should return 404 if company not found', async () => {
      companySettingsService.getSettings.mockResolvedValue(null)

      const response = await request(app)
        .get('/public-legal/mentions?company_id=non-existent')
        .expect(404)

      expect(response.body.error).toBe('Entreprise non trouvée')
    })

    it('should handle service errors', async () => {
      companySettingsService.getSettings.mockRejectedValue(
        new Error('Database error')
      )

      const response = await request(app)
        .get('/public-legal/mentions?company_id=test-company-id')
        .expect(500)

      expect(response.body.error).toBe(
        'Erreur lors de la récupération des mentions légales'
      )
    })

    it('should use default company_id for invalid UUID', async () => {
      const mockSettings = {
        company_name: 'Default Company',
        legal_name: 'Default Company SARL',
      }

      companySettingsService.getSettings.mockResolvedValue(mockSettings)

      const response = await request(app)
        .get('/public-legal/mentions?company_id=invalid-uuid')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.company_name).toBe('Default Company')
    })
  })

  describe('GET /public-legal/cgv', () => {
    it('should return CGV successfully', async () => {
      const mockSettings = {
        company_name: 'Test Company',
        legal_name: 'Test Company SARL',
        cgv: 'Conditions générales de vente...',
        terms_conditions: 'Termes et conditions...',
        late_fee_description: 'Frais de retard...',
        vat_on_payments: true,
        vat_on_payments_text: 'TVA sur les paiements...',
        is_b2c: true,
        withdrawal_applicable: true,
        withdrawal_text: 'Droit de rétractation...',
        cgv_url: 'https://test.com/cgv',
      }

      companySettingsService.getSettings.mockResolvedValue(mockSettings)

      const response = await request(app)
        .get('/public-legal/cgv?company_id=test-company-id')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toMatchObject({
        company_name: 'Test Company',
        legal_name: 'Test Company SARL',
        cgv: 'Conditions générales de vente...',
        terms_conditions: 'Termes et conditions...',
        late_fee_description: 'Frais de retard...',
        vat_on_payments: true,
        vat_on_payments_text: 'TVA sur les paiements...',
        is_b2c: true,
        withdrawal_applicable: true,
        withdrawal_text: 'Droit de rétractation...',
        cgv_url: 'https://test.com/cgv',
      })
    })

    it('should return 400 if no company_id provided', async () => {
      const response = await request(app).get('/public-legal/cgv').expect(400)

      expect(response.body.error).toBe("ID de l'entreprise ou domaine requis")
    })

    it('should return 404 if company not found', async () => {
      companySettingsService.getSettings.mockResolvedValue(null)

      const response = await request(app)
        .get('/public-legal/cgv?company_id=non-existent')
        .expect(404)

      expect(response.body.error).toBe('Entreprise non trouvée')
    })

    it('should handle service errors', async () => {
      companySettingsService.getSettings.mockRejectedValue(
        new Error('Database error')
      )

      const response = await request(app)
        .get('/public-legal/cgv?company_id=test-company-id')
        .expect(500)

      expect(response.body.error).toBe('Erreur lors de la récupération des CGV')
    })
  })

  describe('GET /public-legal/privacy', () => {
    it('should return privacy policy successfully', async () => {
      const mockSettings = {
        company_name: 'Test Company',
        legal_name: 'Test Company SARL',
        privacy_policy: 'Politique de confidentialité...',
        politique_confidentialite: 'Politique de confidentialité FR...',
        rgpd_compliance: true,
        privacy_policy_url: 'https://test.com/privacy',
        email: 'test@company.com',
        phone: '0123456789',
        address_line1: '123 Test Street',
        city: 'Paris',
        postal_code: '75001',
        country: 'France',
      }

      companySettingsService.getSettings.mockResolvedValue(mockSettings)

      const response = await request(app)
        .get('/public-legal/privacy?company_id=test-company-id')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toMatchObject({
        company_name: 'Test Company',
        legal_name: 'Test Company SARL',
        privacy_policy: 'Politique de confidentialité...',
        politique_confidentialite: 'Politique de confidentialité FR...',
        rgpd_compliance: true,
        privacy_policy_url: 'https://test.com/privacy',
        email: 'test@company.com',
        phone: '0123456789',
        address_line1: '123 Test Street',
        city: 'Paris',
        postal_code: '75001',
        country: 'France',
      })
    })

    it('should return 400 if no company_id provided', async () => {
      const response = await request(app)
        .get('/public-legal/privacy')
        .expect(400)

      expect(response.body.error).toBe("ID de l'entreprise ou domaine requis")
    })

    it('should return 404 if company not found', async () => {
      companySettingsService.getSettings.mockResolvedValue(null)

      const response = await request(app)
        .get('/public-legal/privacy?company_id=non-existent')
        .expect(404)

      expect(response.body.error).toBe('Entreprise non trouvée')
    })

    it('should handle service errors', async () => {
      companySettingsService.getSettings.mockRejectedValue(
        new Error('Database error')
      )

      const response = await request(app)
        .get('/public-legal/privacy?company_id=test-company-id')
        .expect(500)

      expect(response.body.error).toBe(
        'Erreur lors de la récupération de la politique de confidentialité'
      )
    })
  })
})
