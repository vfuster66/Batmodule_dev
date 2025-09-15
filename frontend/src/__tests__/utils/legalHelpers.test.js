import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  generateLegalMentions,
  validateLegalCompliance,
} from '../../utils/legalHelpers'

describe('Legal Helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateLegalMentions', () => {
    it('should return empty string for null company settings', () => {
      const result = generateLegalMentions(null)
      expect(result).toBe('')
    })

    it('should return empty string for undefined company settings', () => {
      const result = generateLegalMentions(undefined)
      expect(result).toBe('')
    })

    it('should generate basic legal mentions', () => {
      const companySettings = {
        company_name: 'Test Company',
        forme_juridique: 'SARL',
        capital_social: 10000,
        siret: '12345678901234',
        vat_number: 'FR12345678901',
        address_line1: '123 Test St',
        city: 'Paris',
        postal_code: '75001',
        country: 'France',
        email: 'test@example.com',
        phone: '0123456789',
      }

      const result = generateLegalMentions(companySettings)

      expect(result).toContain('<h2>Test Company</h2>')
      expect(result).toContain('Forme juridique :</strong> SARL')
      expect(result).toContain('SIRET :</strong> 12345678901234')
      expect(result).toContain(
        'N° de TVA intracommunautaire :</strong> FR12345678901'
      )
      expect(result).toContain('123 Test St')
      expect(result).toContain('Paris')
      expect(result).toContain('75001')
      expect(result).toContain('France')
      expect(result).toContain('test@example.com')
      expect(result).toContain('0123456789')
    })

    it('should include commercial name when different from legal name', () => {
      const companySettings = {
        company_name: 'Commercial Name',
        legal_name: 'Legal Name',
        forme_juridique: 'SARL',
      }

      const result = generateLegalMentions(companySettings)

      expect(result).toContain('<h2>Commercial Name</h2>')
      expect(result).toContain('Nom commercial :</strong> Commercial Name')
    })

    it('should handle missing optional fields gracefully', () => {
      const companySettings = {
        company_name: 'Test Company',
      }

      const result = generateLegalMentions(companySettings)

      expect(result).toContain('<h2>Test Company</h2>')
      expect(result).not.toContain('Forme juridique')
      expect(result).not.toContain('SIRET')
    })
  })

  describe('validateLegalCompliance', () => {
    it('should return valid for complete company settings', () => {
      const companySettings = {
        company_name: 'Test Company',
        forme_juridique: 'SARL',
        capital_social: 10000,
        siret: '12345678901234',
        vat_number: 'FR12345678901',
        address_line1: '123 Test St',
        city: 'Paris',
        postal_code: '75001',
        country: 'France',
        email: 'test@example.com',
        phone: '0123456789',
        assurance_rc: true,
        rgpd_compliance: true,
      }

      const result = validateLegalCompliance(companySettings)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })

    it('should return errors for missing required fields', () => {
      const companySettings = {
        // Missing required fields
      }

      const result = validateLegalCompliance(companySettings)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors).toContain("Le nom de l'entreprise est obligatoire")
    })

    it('should return warnings for missing recommended fields', () => {
      const companySettings = {
        company_name: 'Test Company',
        address_line1: '123 Test St',
        city: 'Paris',
        postal_code: '75001',
        country: 'France',
        email: 'test@example.com',
        phone: '0123456789',
        // Missing recommended fields
      }

      const result = validateLegalCompliance(companySettings)

      expect(result.isValid).toBe(true)
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings).toContain('Le numéro SIRET est recommandé')
      expect(result.warnings).toContain('Le numéro de TVA est recommandé')
      expect(result.warnings).toContain(
        "L'assurance responsabilité civile est recommandée"
      )
      expect(result.warnings).toContain('La conformité RGPD est recommandée')
    })

    it('should validate basic company settings', () => {
      const companySettings = {
        company_name: 'Test Company',
        email: 'test@example.com',
        phone: '0123456789',
        address_line1: '123 Test St',
        city: 'Paris',
        postal_code: '75001',
        country: 'France',
      }

      const result = validateLegalCompliance(companySettings)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })
})
