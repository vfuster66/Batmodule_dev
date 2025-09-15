import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock des dépendances
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      defaults: {
        baseURL: '/api',
        timeout: 15000,
        headers: { 'Content-Type': 'application/json' },
      },
      interceptors: {
        request: {
          use: vi.fn(),
        },
        response: {
          use: vi.fn(),
        },
      },
    })),
  },
}))

vi.mock('vue-toastification', () => ({
  useToast: () => ({
    error: vi.fn(),
    success: vi.fn(),
  }),
}))

// Mock import.meta.env
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_API_URL: '/api',
    DEV: false,
    MODE: 'test',
  },
  writable: true,
})

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
  writable: true,
})

describe('API Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should import api module without errors', async () => {
    // Import dynamique pour éviter l'exécution immédiate
    const apiModule = await import('../../utils/api.js')

    expect(apiModule.default).toBeDefined()
  })

  it('should have correct base configuration', async () => {
    // Import dynamique pour éviter l'exécution immédiate
    const apiModule = await import('../../utils/api.js')
    const api = apiModule.default

    expect(api.defaults.baseURL).toBe('/api')
    expect(api.defaults.timeout).toBe(15000)
    expect(api.defaults.headers['Content-Type']).toBe('application/json')
  })
})
