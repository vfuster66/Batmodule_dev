import { vi } from 'vitest'

// Manual mock for '@/utils/api' used in store unit tests.
// Provides axios-like instance shape with mocked HTTP methods and defaults.
const api = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  patch: vi.fn(),
  defaults: {
    headers: {
      common: {},
    },
    baseURL: '/api',
  },
  interceptors: {
    request: { use: vi.fn(), eject: vi.fn() },
    response: { use: vi.fn(), eject: vi.fn() },
  },
}

export default api
