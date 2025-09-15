import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCompanyStore } from '@/stores/company'
import api from '@/utils/api'

// Mock des dépendances
vi.mock('@/utils/api')

describe('Company Store', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useCompanyStore()

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
      expect(store.settings).toBeDefined()
      expect(store.settings.company_name).toBe('')
      expect(store.settings.default_vat_rate).toBe(20.0)
      expect(store.settings.currency).toBe('EUR')
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  describe('Getters', () => {
    beforeEach(() => {
      store.settings = {
        address_line1: '123 Rue de la Paix',
        address_line2: 'Appartement 4B',
        postal_code: '75001',
        city: 'Paris',
        country: 'France',
        legal_name: 'Entreprise SARL',
        company_name: 'Mon Entreprise',
        siret: '12345678901234',
        vat_number: 'FR12345678901',
        rcs_number: 'RCS123456',
        ape_code: '6201Z',
        logo_url: 'https://example.com/logo.png',
        logo_base64:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      }
    })

    it('should return full address', () => {
      expect(store.fullAddress).toBe(
        '123 Rue de la Paix, Appartement 4B, 75001, Paris, France'
      )
    })

    it('should return full address without empty parts', () => {
      store.settings.address_line2 = ''
      store.settings.country = ''
      expect(store.fullAddress).toBe('123 Rue de la Paix, 75001, Paris')
    })

    it('should return display name (legal name preferred)', () => {
      expect(store.displayName).toBe('Entreprise SARL')
    })

    it('should return company name when no legal name', () => {
      store.settings.legal_name = ''
      expect(store.displayName).toBe('Mon Entreprise')
    })

    it('should return legal info', () => {
      expect(store.legalInfo).toBe(
        'SIRET: 12345678901234 - TVA: FR12345678901 - RCS: RCS123456 - APE: 6201Z'
      )
    })

    it('should return legal info with partial data', () => {
      store.settings.vat_number = ''
      store.settings.rcs_number = ''
      expect(store.legalInfo).toBe('SIRET: 12345678901234 - APE: 6201Z')
    })

    it('should return display logo (URL preferred)', () => {
      expect(store.displayLogo).toBe('https://example.com/logo.png')
    })

    it('should return base64 logo when no URL', () => {
      store.settings.logo_url = ''
      expect(store.displayLogo).toBe(
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      )
    })
  })

  describe('fetchSettings', () => {
    it('should fetch settings successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            company_name: 'Test Company',
            default_vat_rate: 20.0,
            currency: 'EUR',
          },
        },
      }

      api.get.mockResolvedValueOnce(mockResponse)

      await store.fetchSettings()

      expect(api.get).toHaveBeenCalledWith('/company-settings')
      expect(store.settings.company_name).toBe('Test Company')
      expect(store.settings.default_vat_rate).toBe(20.0)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should handle fetch settings error', async () => {
      const mockError = {
        response: {
          data: {
            message: 'Erreur serveur',
          },
        },
      }

      api.get.mockRejectedValueOnce(mockError)

      await store.fetchSettings()

      expect(store.error).toBe('Erreur serveur')
      expect(store.loading).toBe(false)
    })

    it('should handle fetch settings error without response', async () => {
      const mockError = new Error('Network error')

      api.get.mockRejectedValueOnce(mockError)

      await store.fetchSettings()

      expect(store.error).toBe('Erreur lors du chargement des paramètres')
      expect(store.loading).toBe(false)
    })

    it('should merge settings without overwriting with null', async () => {
      // Set initial settings
      store.settings.company_name = 'Initial Company'
      store.settings.default_vat_rate = 20.0

      const mockResponse = {
        data: {
          data: {
            company_name: 'Updated Company',
            default_vat_rate: null, // This should not overwrite
            currency: 'USD',
          },
        },
      }

      api.get.mockResolvedValueOnce(mockResponse)

      await store.fetchSettings()

      expect(store.settings.company_name).toBe('Updated Company')
      expect(store.settings.default_vat_rate).toBe(20.0) // Should not be overwritten with null
      expect(store.settings.currency).toBe('USD')
    })
  })

  describe('saveSettings', () => {
    it('should save settings successfully', async () => {
      const settingsData = {
        company_name: 'New Company',
        default_vat_rate: 19.6,
      }

      const mockResponse = {
        data: {
          data: {
            company_name: 'New Company',
            default_vat_rate: 19.6,
          },
        },
      }

      api.put.mockResolvedValueOnce(mockResponse)

      const result = await store.saveSettings(settingsData)

      expect(api.put).toHaveBeenCalledWith('/company-settings', settingsData)
      expect(store.settings.company_name).toBe('New Company')
      expect(store.settings.default_vat_rate).toBe(19.6)
      expect(result).toEqual(mockResponse.data)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should handle save settings error', async () => {
      const settingsData = { company_name: 'Test' }
      const mockError = {
        response: {
          data: {
            message: 'Erreur de validation',
          },
        },
      }

      api.put.mockRejectedValueOnce(mockError)

      await expect(store.saveSettings(settingsData)).rejects.toThrow()
      expect(store.error).toBe('Erreur de validation')
      expect(store.loading).toBe(false)
    })

    it('should handle save settings error without response', async () => {
      const settingsData = { company_name: 'Test' }
      const mockError = new Error('Network error')

      api.put.mockRejectedValueOnce(mockError)

      await expect(store.saveSettings(settingsData)).rejects.toThrow()
      expect(store.error).toBe('Erreur lors de la sauvegarde')
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

  describe('convertFileToBase64', () => {
    it('should convert file to base64 successfully', async () => {
      const mockFile = {
        type: 'image/png',
        size: 1000,
      }

      // Mock DOM elements
      const mockImage = {
        onload: null,
        onerror: null,
        src: '',
        width: 100,
        height: 100,
      }

      global.Image = vi.fn(() => mockImage)

      global.HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
        drawImage: vi.fn(),
      }))

      global.HTMLCanvasElement.prototype.toDataURL = vi.fn(
        () => 'data:image/png;base64,test'
      )

      const mockFileReader = {
        onload: null,
        onerror: null,
        readAsDataURL: vi.fn(),
      }

      global.FileReader = vi.fn(() => mockFileReader)

      const promise = store.convertFileToBase64(mockFile)

      // Simulate successful file reading
      mockFileReader.onload({
        target: { result: 'data:image/png;base64,original' },
      })

      // Simulate successful image loading
      mockImage.onload()

      const result = await promise

      expect(result).toBe('data:image/png;base64,test')
      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(mockFile)
    })

    it('should handle image resizing for wide images', async () => {
      const mockFile = {
        type: 'image/png',
        size: 1000,
      }

      // Mock DOM elements with wide image
      const mockImage = {
        onload: null,
        onerror: null,
        src: '',
        width: 400, // Larger than maxSize (200)
        height: 100,
      }

      global.Image = vi.fn(() => mockImage)

      global.HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
        drawImage: vi.fn(),
      }))

      global.HTMLCanvasElement.prototype.toDataURL = vi.fn(
        () => 'data:image/png;base64,test'
      )

      const mockFileReader = {
        onload: null,
        onerror: null,
        readAsDataURL: vi.fn(),
      }

      global.FileReader = vi.fn(() => mockFileReader)

      const promise = store.convertFileToBase64(mockFile)

      // Simulate successful file reading
      mockFileReader.onload({
        target: { result: 'data:image/png;base64,original' },
      })

      // Simulate successful image loading
      mockImage.onload()

      const result = await promise

      expect(result).toBe('data:image/png;base64,test')
      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(mockFile)
    })

    it('should handle image resizing for tall images', async () => {
      const mockFile = {
        type: 'image/png',
        size: 1000,
      }

      // Mock DOM elements with tall image
      const mockImage = {
        onload: null,
        onerror: null,
        src: '',
        width: 100,
        height: 400, // Larger than maxSize (200)
      }

      global.Image = vi.fn(() => mockImage)

      global.HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
        drawImage: vi.fn(),
      }))

      global.HTMLCanvasElement.prototype.toDataURL = vi.fn(
        () => 'data:image/png;base64,test'
      )

      const mockFileReader = {
        onload: null,
        onerror: null,
        readAsDataURL: vi.fn(),
      }

      global.FileReader = vi.fn(() => mockFileReader)

      const promise = store.convertFileToBase64(mockFile)

      // Simulate successful file reading
      mockFileReader.onload({
        target: { result: 'data:image/png;base64,original' },
      })

      // Simulate successful image loading
      mockImage.onload()

      const result = await promise

      expect(result).toBe('data:image/png;base64,test')
      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(mockFile)
    })

    it('should handle file reader error', async () => {
      const mockFile = {
        type: 'image/png',
        size: 1000,
      }

      const mockFileReader = {
        onload: null,
        onerror: null,
        readAsDataURL: vi.fn(),
      }

      global.FileReader = vi.fn(() => mockFileReader)

      const promise = store.convertFileToBase64(mockFile)

      // Simulate file reader error
      mockFileReader.onerror(new Error('File read error'))

      await expect(promise).rejects.toThrow('File read error')
    })

    it('should handle image load error', async () => {
      const mockFile = {
        type: 'image/png',
        size: 1000,
      }

      const mockImage = {
        onload: null,
        onerror: null,
        src: '',
      }

      global.Image = vi.fn(() => mockImage)

      const mockFileReader = {
        onload: null,
        onerror: null,
        readAsDataURL: vi.fn(),
      }

      global.FileReader = vi.fn(() => mockFileReader)

      const promise = store.convertFileToBase64(mockFile)

      // Simulate successful file reading
      mockFileReader.onload({
        target: { result: 'data:image/png;base64,original' },
      })

      // Simulate image load error
      mockImage.onerror(new Error('Image load error'))

      await expect(promise).rejects.toThrow('Image load error')
    })
  })

  describe('uploadLogo', () => {
    beforeEach(() => {
      // Mock convertFileToBase64
      store.convertFileToBase64 = vi
        .fn()
        .mockResolvedValue('data:image/png;base64,test')
      store.updateSetting = vi.fn().mockResolvedValue({})
    })

    it('should upload logo successfully', async () => {
      const mockFile = {
        name: 'logo.png',
        size: 1000,
        type: 'image/png',
      }

      const result = await store.uploadLogo(mockFile)

      expect(store.convertFileToBase64).toHaveBeenCalledWith(mockFile)
      expect(store.updateSetting).toHaveBeenCalledWith(
        'logo_base64',
        'data:image/png;base64,test'
      )
      expect(result).toBe('data:image/png;base64,test')
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

    it('should handle upload error', async () => {
      const mockFile = {
        name: 'logo.png',
        size: 1000,
        type: 'image/png',
      }

      store.convertFileToBase64.mockRejectedValueOnce(
        new Error('Conversion failed')
      )

      await expect(store.uploadLogo(mockFile)).rejects.toThrow(
        'Conversion failed'
      )
    })
  })

  describe('uploadSignatureEmail', () => {
    beforeEach(() => {
      // Mock convertFileToBase64
      store.convertFileToBase64 = vi
        .fn()
        .mockResolvedValue('data:image/png;base64,test')
      store.updateSetting = vi.fn().mockResolvedValue({})
    })

    it('should upload signature email successfully', async () => {
      const mockFile = {
        name: 'signature.png',
        size: 1000,
        type: 'image/png',
      }

      const result = await store.uploadSignatureEmail(mockFile)

      expect(store.convertFileToBase64).toHaveBeenCalledWith(mockFile)
      expect(store.updateSetting).toHaveBeenCalledWith(
        'signature_email_base64',
        'data:image/png;base64,test'
      )
      expect(result).toBe('data:image/png;base64,test')
    })

    it('should reject file too large', async () => {
      const mockFile = {
        name: 'large-signature.png',
        size: 6 * 1024 * 1024, // 6MB
        type: 'image/png',
      }

      await expect(store.uploadSignatureEmail(mockFile)).rejects.toThrow(
        'Le fichier est trop volumineux (max 5MB)'
      )
    })

    it('should reject non-image file', async () => {
      const mockFile = {
        name: 'document.pdf',
        size: 1000,
        type: 'application/pdf',
      }

      await expect(store.uploadSignatureEmail(mockFile)).rejects.toThrow(
        'Veuillez sélectionner un fichier image'
      )
    })
  })

  describe('resetSettings', () => {
    it('should reset all settings to default values', () => {
      // Set some custom values
      store.settings.company_name = 'Custom Company'
      store.settings.default_vat_rate = 19.6
      store.settings.currency = 'USD'

      store.resetSettings()

      expect(store.settings.company_name).toBe('')
      expect(store.settings.default_vat_rate).toBe(20.0)
      expect(store.settings.currency).toBe('EUR')
      expect(store.settings.country).toBe('France')
      expect(store.settings.primary_color).toBe('#004AAD')
    })
  })
})
