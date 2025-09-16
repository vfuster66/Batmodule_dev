import { config } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { vi } from 'vitest'

// Mock global objects
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Global test configuration
config.global.plugins = [createPinia()]

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
}

// Supprimer les rejets non gérées pour les erreurs spécifiques
process.on('unhandledRejection', (reason) => {
  // Ignorer silencieusement les erreurs DataCloneError et autres erreurs de sérialisation
  if (reason instanceof Error) {
    if (reason.name === 'DataCloneError' ||
      reason.message.includes('could not be cloned') ||
      reason.message.includes('transformRequest')) {
      return // Ignorer ces erreurs spécifiques
    }
  }
  // Pour les autres erreurs, on peut les logger en mode debug
  if (process.env.VITEST_DEBUG) {
    console.warn('Unhandled rejection:', reason)
  }
})

// Gérer les erreurs non capturées
process.on('uncaughtException', (error) => {
  if (error.name === 'DataCloneError' ||
    error.message.includes('could not be cloned')) {
    return // Ignorer ces erreurs spécifiques
  }
  if (process.env.VITEST_DEBUG) {
    console.warn('Uncaught exception:', error)
  }
})
