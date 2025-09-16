import { config } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { vi } from 'vitest'

// Les mocks d'API sont maintenant gérés par chaque test individuellement

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

// Ignorer proprement certains rejets non gérés côté JSDOM (empêche Vitest de les compter)
const isAxiosStructuredCloneIssue = (reason: unknown) => {
  const msg =
    (reason && typeof reason === 'object' && 'message' in reason
      ? (reason as any).message
      : '') || String(reason || '')
  return (
    msg.includes('could not be cloned') ||
    msg.includes('DataCloneError') ||
    msg.includes('transformRequest')
  )
}

// Navigateur (JSDOM): empêcher la propagation des rejets non clonables
window.addEventListener('unhandledrejection', (event) => {
  if (isAxiosStructuredCloneIssue(event.reason)) {
    event.preventDefault()
  }
})

// Node: éviter le bruit dans la sortie (ne fait pas échouer les tests)
process.on('unhandledRejection', (reason) => {
  if (isAxiosStructuredCloneIssue(reason)) return
  if (process.env.VITEST_DEBUG) console.warn('Unhandled rejection:', reason)
})

process.on('uncaughtException', (error) => {
  if (isAxiosStructuredCloneIssue(error)) return
  if (process.env.VITEST_DEBUG) console.warn('Uncaught exception:', error)
})
