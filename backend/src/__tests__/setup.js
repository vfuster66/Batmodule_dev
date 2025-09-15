// Configuration globale pour les tests
const { Pool } = require('pg')

// Mock de la base de données pour les tests
const mockPool = {
  connect: jest.fn(),
  query: jest.fn(),
  end: jest.fn(),
}

// Mock du module pg
jest.mock('pg', () => ({
  Pool: jest.fn(() => mockPool),
}))

// Mock des modules externes
jest.mock('bcryptjs')
jest.mock('jsonwebtoken')
jest.mock('nodemailer')
jest.mock('puppeteer')
jest.mock('redis')

// Variables d'environnement pour les tests
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-secret-key-for-testing-only'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.REDIS_URL = 'redis://localhost:6379'
process.env.SMTP_HOST = 'localhost'
process.env.SMTP_PORT = '587'
process.env.SMTP_USER = 'test@example.com'
process.env.SMTP_PASS = 'testpass'

// Mock des logs pour éviter le spam dans les tests
const originalConsole = global.console
global.console = {
  ...originalConsole,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}

// Mock des timers pour les tests (désactivé pour éviter les conflits)
// jest.useFakeTimers();

// Nettoyage après chaque test
afterEach(() => {
  jest.clearAllMocks()
  // jest.clearAllTimers();
})

// Nettoyage global
afterAll(() => {
  // jest.useRealTimers();
  global.console = originalConsole
})

// Helper pour créer des mocks de base de données
global.createMockQuery = (rows = [], rowCount = 0) => ({
  rows,
  rowCount,
  command: 'SELECT',
})

// Helper pour créer des mocks d'utilisateur
global.createMockUser = (overrides = {}) => ({
  id: 1,
  email: 'test@example.com',
  password_hash: 'hashedPassword',
  first_name: 'John',
  last_name: 'Doe',
  company_name: 'Test Company',
  phone: '0123456789',
  address: '123 Test Street',
  created_at: new Date('2024-01-01'),
  updated_at: new Date('2024-01-01'),
  ...overrides,
})

// Helper pour créer des mocks de JWT
global.createMockJWT = (payload = { userId: 1, email: 'test@example.com' }) => {
  const jwt = require('jsonwebtoken')
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' })
}
