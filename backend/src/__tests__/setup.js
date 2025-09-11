// Configuration globale pour les tests
const { Pool } = require('pg');

// Mock de la base de données pour les tests
const mockPool = {
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn()
};

// Mock du module pg
jest.mock('pg', () => ({
    Pool: jest.fn(() => mockPool)
}));

// Variables d'environnement pour les tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Mock des logs pour éviter le spam dans les tests
global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn()
};

// Nettoyage après chaque test
afterEach(() => {
    jest.clearAllMocks();
});
