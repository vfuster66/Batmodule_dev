import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCompanySettingsStore } from '@/stores/companySettings'
import api from '@/utils/api'

// Mock des dépendances
vi.mock('@/utils/api')

describe('Company Settings Store', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useCompanySettingsStore()

    // Mock api.defaults.headers
    api.defaults = {
      headers: {
        common: {},
      },
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('State', () => {
    it('should have initial state', () => {
      expect(store.settings).toEqual({})
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
      expect(store.validation).toEqual({})
    })
  })

  describe('Getters', () => {
    beforeEach(() => {
      store.settings = {
        company_name: 'Test Company',
        siret: '12345678901234',
        forme_juridique: 'SARL',
        address_line1: '123 Rue de la Paix',
        postal_code: '75001',
        city: 'Paris',
        phone: '0123456789',
        email: 'test@example.com',
      }
    })

    it('should return isConfigured as true when all required fields are present', () => {
      expect(store.isConfigured).toBe(true)
    })

    it('should return isConfigured as false when required fields are missing', () => {
      store.settings.company_name = ''
      expect(store.isConfigured).toBe(false)
    })

    it('should return compliance score', () => {
      store.validation = { score: 85 }
      expect(store.complianceScore).toBe(85)
    })

    it('should return compliance score as 0 when no score', () => {
      expect(store.complianceScore).toBe(0)
    })

    it('should return isCompliant as true when score >= 100', () => {
      store.validation = { score: 100 }
      expect(store.isCompliant).toBe(true)
    })

    it('should return isCompliant as false when score < 100', () => {
      store.validation = { score: 85 }
      expect(store.isCompliant).toBe(false)
    })

    it('should return missing fields', () => {
      store.validation = { missingFields: ['siret', 'email'] }
      expect(store.missingFields).toEqual(['siret', 'email'])
    })

    it('should return empty array for missing fields when compliant', () => {
      store.validation = { score: 100, missingFields: ['siret'] }
      expect(store.missingFields).toEqual([])
    })

    it('should return recommendations', () => {
      store.validation = { recommendations: ['Add SIRET number'] }
      expect(store.recommendations).toEqual(['Add SIRET number'])
    })
  })

  describe('fetchSettings', () => {
    it('should fetch settings successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            company_name: 'Test Company',
            siret: '12345678901234',
          },
        },
      }

      api.get.mockResolvedValueOnce(mockResponse)

      await store.fetchSettings()

      expect(api.get).toHaveBeenCalledWith('/company-settings')
      expect(store.settings).toEqual(mockResponse.data.data)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should handle fetch settings error', async () => {
      const mockError = {
        response: {
          data: {
            error: 'Server error',
          },
        },
      }

      api.get.mockRejectedValueOnce(mockError)

      await store.fetchSettings()

      expect(store.error).toBe('Server error')
      expect(store.loading).toBe(false)
    })

    it('should handle fetch settings error without response', async () => {
      const mockError = new Error('Network error')

      api.get.mockRejectedValueOnce(mockError)

      await store.fetchSettings()

      expect(store.error).toBe('Erreur lors de la récupération des paramètres')
      expect(store.loading).toBe(false)
    })

    it('should not fetch if already loading', async () => {
      store.loading = true

      await store.fetchSettings()

      expect(api.get).not.toHaveBeenCalled()
    })

    it('should not fetch if data is recent', async () => {
      // Set some data to simulate recent fetch
      store.settings = { company_name: 'Test' }

      // Mock the internal lastFetchedAt by calling fetchSettings once first
      const mockResponse = {
        data: {
          data: { company_name: 'Test' },
        },
      }
      api.get.mockResolvedValueOnce(mockResponse)
      await store.fetchSettings()

      // Clear the mock and try to fetch again immediately
      vi.clearAllMocks()
      await store.fetchSettings()

      // Should not call API again due to recent data
      expect(api.get).not.toHaveBeenCalled()
    })
  })

  describe('updateSettings', () => {
    it('should update settings successfully', async () => {
      const updateData = {
        company_name: 'New Company',
        siret: '98765432109876',
      }

      const mockResponse = {
        data: {
          data: updateData,
        },
      }

      api.put.mockResolvedValueOnce(mockResponse)

      const result = await store.updateSettings(updateData)

      expect(api.put).toHaveBeenCalledWith('/company-settings', updateData)
      expect(store.settings).toEqual(updateData)
      expect(result).toEqual(mockResponse.data)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should handle update settings error', async () => {
      const updateData = { company_name: 'Test' }
      const mockError = {
        response: {
          data: {
            error: 'Validation error',
          },
        },
      }

      api.put.mockRejectedValueOnce(mockError)

      await expect(store.updateSettings(updateData)).rejects.toThrow()
      expect(store.error).toBe('Validation error')
      expect(store.loading).toBe(false)
    })

    it('should handle update settings error without response', async () => {
      const updateData = { company_name: 'Test' }
      const mockError = new Error('Network error')

      api.put.mockRejectedValueOnce(mockError)

      await expect(store.updateSettings(updateData)).rejects.toThrow()
      expect(store.error).toBe('Erreur lors de la mise à jour des paramètres')
      expect(store.loading).toBe(false)
    })
  })

  describe('updateSetting', () => {
    it('should update a single setting', async () => {
      const mockResponse = {
        data: {
          data: {
            company_name: 'Updated Company',
          },
        },
      }

      api.put.mockResolvedValueOnce(mockResponse)

      const result = await store.updateSetting(
        'company_name',
        'Updated Company'
      )

      expect(api.put).toHaveBeenCalledWith('/company-settings', {
        company_name: 'Updated Company',
      })
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('validateSettings', () => {
    it('should validate settings successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            score: 85,
            missingFields: ['siret'],
            recommendations: ['Add SIRET number'],
          },
        },
      }

      api.get.mockResolvedValueOnce(mockResponse)

      const result = await store.validateSettings()

      expect(api.get).toHaveBeenCalledWith('/company-settings/validate')
      expect(store.validation).toEqual(mockResponse.data.data)
      expect(result).toEqual(mockResponse.data.data)
    })
  })

  describe('getComplianceReport', () => {
    it('should get compliance report successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            score: 90,
            details: 'Compliance report details',
          },
        },
      }

      api.get.mockResolvedValueOnce(mockResponse)

      const result = await store.getComplianceReport()

      expect(api.get).toHaveBeenCalledWith(
        '/company-settings/compliance-report'
      )
      expect(result).toEqual(mockResponse.data.data)
    })
  })

  describe('resetSettings', () => {
    it('should reset settings successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            company_name: '',
            siret: '',
          },
        },
      }

      api.post.mockResolvedValueOnce(mockResponse)

      const result = await store.resetSettings()

      expect(api.post).toHaveBeenCalledWith('/company-settings/reset', {
        confirm: true,
      })
      expect(store.settings).toEqual(mockResponse.data.data)
      expect(result).toEqual(mockResponse.data)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should handle reset settings error', async () => {
      const mockError = {
        response: {
          data: {
            error: 'Reset failed',
          },
        },
      }

      api.post.mockRejectedValueOnce(mockError)

      await expect(store.resetSettings()).rejects.toThrow()
      expect(store.error).toBe('Reset failed')
      expect(store.loading).toBe(false)
    })
  })

  describe('getLegalTemplates', () => {
    it('should get legal templates successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            cgv: 'Template CGV',
            mentions_legales: 'Template mentions légales',
          },
        },
      }

      api.get.mockResolvedValueOnce(mockResponse)

      const result = await store.getLegalTemplates()

      expect(api.get).toHaveBeenCalledWith('/company-settings/legal-templates')
      expect(result).toEqual(mockResponse.data.data)
    })
  })

  describe('uploadLogo', () => {
    beforeEach(() => {
      // Mock convertFileToBase64 to avoid FileReader issues
      store.convertFileToBase64 = vi
        .fn()
        .mockResolvedValue('data:image/png;base64,test')
      store.updateSetting = vi.fn().mockResolvedValue({})
    })

    it('should reject file too large', async () => {
      const mockFile = {
        name: 'large-logo.png',
        size: 6 * 1024 * 1024, // 6MB
        type: 'image/png',
      }

      await expect(store.uploadLogo(mockFile)).rejects.toThrow(
        'Le fichier est trop volumineux (max 5MB)'
      )
    })

    it('should reject non-image file', async () => {
      const mockFile = {
        name: 'document.pdf',
        size: 1000,
        type: 'application/pdf',
      }

      await expect(store.uploadLogo(mockFile)).rejects.toThrow(
        'Veuillez sélectionner un fichier image'
      )
    })
  })

  describe('Validation functions', () => {
    describe('validateSIRET', () => {
      it('should validate correct SIRET', () => {
        // SIRET valide selon l'algorithme de Luhn (calculé manuellement)
        expect(store.validateSIRET('12345678901237')).toBe(true)
      })

      it('should reject invalid SIRET length', () => {
        expect(store.validateSIRET('1234567890123')).toBe(false)
        expect(store.validateSIRET('123456789012345')).toBe(false)
      })

      it('should reject non-numeric SIRET', () => {
        expect(store.validateSIRET('1234567890123a')).toBe(false)
      })

      it('should reject empty SIRET', () => {
        expect(store.validateSIRET('')).toBe(false)
        expect(store.validateSIRET(null)).toBe(false)
      })
    })

    describe('validateEmail', () => {
      it('should validate correct email', () => {
        expect(store.validateEmail('test@example.com')).toBe(true)
        expect(store.validateEmail('user.name+tag@domain.co.uk')).toBe(true)
      })

      it('should reject invalid email', () => {
        expect(store.validateEmail('invalid-email')).toBe(false)
        expect(store.validateEmail('test@')).toBe(false)
        expect(store.validateEmail('@example.com')).toBe(false)
        expect(store.validateEmail('')).toBe(false)
      })
    })

    describe('validatePhone', () => {
      it('should validate correct French phone numbers', () => {
        expect(store.validatePhone('0123456789')).toBe(true)
        expect(store.validatePhone('+33123456789')).toBe(true)
        expect(store.validatePhone('01 23 45 67 89')).toBe(true)
      })

      it('should reject invalid phone numbers', () => {
        expect(store.validatePhone('012345678')).toBe(false)
        expect(store.validatePhone('01234567890')).toBe(false)
        expect(store.validatePhone('+3312345678')).toBe(false)
        expect(store.validatePhone('')).toBe(false)
      })
    })

    describe('validateIBAN', () => {
      it('should validate correct French IBAN', () => {
        expect(store.validateIBAN('FR1420041010050500013M02606')).toBe(true)
        expect(store.validateIBAN('FR14 2004 1010 0505 0001 3M02 606')).toBe(
          true
        )
      })

      it('should reject invalid IBAN', () => {
        expect(store.validateIBAN('FR1420041010050500013M')).toBe(false) // Too short
        expect(store.validateIBAN('DE1420041010050500013M02606')).toBe(false) // Wrong country
        expect(store.validateIBAN('')).toBe(false)
      })
    })
  })

  describe('Format functions', () => {
    describe('formatSIRET', () => {
      it('should format SIRET correctly', () => {
        expect(store.formatSIRET('12345678901234')).toBe('123 456 789 01234')
      })

      it('should return empty string for empty SIRET', () => {
        expect(store.formatSIRET('')).toBe('')
        expect(store.formatSIRET(null)).toBe('')
      })
    })

    describe('formatPhone', () => {
      it('should format 10-digit phone correctly', () => {
        expect(store.formatPhone('0123456789')).toBe('01 23 45 67 89')
      })

      it('should return original for non-10-digit phone', () => {
        expect(store.formatPhone('012345678')).toBe('012345678')
        expect(store.formatPhone('+33123456789')).toBe('+33123456789')
      })

      it('should return empty string for empty phone', () => {
        expect(store.formatPhone('')).toBe('')
        expect(store.formatPhone(null)).toBe('')
      })
    })

    describe('formatIBAN', () => {
      it('should format IBAN correctly', () => {
        expect(store.formatIBAN('FR1420041010050500013M02606')).toBe(
          'FR14 2004 1010 0505 0001 3M02 606'
        )
      })

      it('should return empty string for empty IBAN', () => {
        expect(store.formatIBAN('')).toBe('')
        expect(store.formatIBAN(null)).toBe('')
      })
    })
  })
})
