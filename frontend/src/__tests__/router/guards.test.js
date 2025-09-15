import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setupNavigationGuards } from '../../router/guards.js'

// Mock des stores
const mockCompanySettingsStore = {
  settings: {},
}

vi.mock('../../stores/companySettings', () => ({
  useCompanySettingsStore: () => mockCompanySettingsStore,
}))

describe('Navigation Guards', () => {
  let mockRouter
  let mockNext

  beforeEach(() => {
    vi.clearAllMocks()

    mockNext = vi.fn()
    mockRouter = {
      beforeEach: vi.fn(),
    }
  })

  describe('setupNavigationGuards', () => {
    it('should setup router guards', () => {
      setupNavigationGuards(mockRouter)

      expect(mockRouter.beforeEach).toHaveBeenCalledWith(expect.any(Function))
    })

    it('should allow access to public pages', async () => {
      setupNavigationGuards(mockRouter)
      const guard = mockRouter.beforeEach.mock.calls[0][0]

      // Test avec une page publique
      await guard({ path: '/login' }, {}, mockNext)

      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should allow access to company settings page', async () => {
      setupNavigationGuards(mockRouter)
      const guard = mockRouter.beforeEach.mock.calls[0][0]

      // Test avec la page de configuration
      await guard({ path: '/company-settings' }, {}, mockNext)

      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should redirect when no settings are loaded', async () => {
      mockCompanySettingsStore.settings = {}

      setupNavigationGuards(mockRouter)
      const guard = mockRouter.beforeEach.mock.calls[0][0]

      // Test avec une page nécessitant la configuration
      await guard({ path: '/dashboard' }, {}, mockNext)

      expect(mockNext).toHaveBeenCalledWith('/company-settings')
    })

    it('should redirect when setup is incomplete', async () => {
      mockCompanySettingsStore.settings = {
        company_name: 'Test Company',
        siret: '12345678901234',
        forme_juridique: 'SARL',
        address_line1: '123 Test St',
        postal_code: '75001',
        city: 'Paris',
        phone: '0123456789',
        // email manquant
      }

      setupNavigationGuards(mockRouter)
      const guard = mockRouter.beforeEach.mock.calls[0][0]

      // Test avec une page nécessitant la configuration
      await guard({ path: '/dashboard' }, {}, mockNext)

      expect(mockNext).toHaveBeenCalledWith('/company-settings')
    })

    it('should allow access when setup is complete', async () => {
      mockCompanySettingsStore.settings = {
        company_name: 'Test Company',
        siret: '12345678901234',
        forme_juridique: 'SARL',
        address_line1: '123 Test St',
        postal_code: '75001',
        city: 'Paris',
        phone: '0123456789',
        email: 'test@example.com',
      }

      setupNavigationGuards(mockRouter)
      const guard = mockRouter.beforeEach.mock.calls[0][0]

      // Test avec une page nécessitant la configuration
      await guard({ path: '/dashboard' }, {}, mockNext)

      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should allow access to pages not requiring setup', async () => {
      mockCompanySettingsStore.settings = {}

      setupNavigationGuards(mockRouter)
      const guard = mockRouter.beforeEach.mock.calls[0][0]

      // Test avec une page qui ne nécessite pas la configuration
      await guard({ path: '/profile' }, {}, mockNext)

      expect(mockNext).toHaveBeenCalledWith()
    })
  })
})
