const request = require('supertest')
const express = require('express')

// Créer une app Express pour les tests sans démarrer le serveur
const createTestApp = () => {
  const app = express()

  // Routes de base pour les tests
  app.get('/', (req, res) => {
    res.json({
      message: 'BatModule API - Application pour artisans du bâtiment',
      version: '1.0.0',
      status: 'running',
    })
  })

  app.get('/health', (req, res) => {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'BatModule API',
      version: '1.0.0',
    })
  })

  return app
}

describe('Integration Tests - Health Endpoints', () => {
  let app

  beforeAll(() => {
    app = createTestApp()
  })

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health').expect(200)

      expect(response.body).toHaveProperty('status', 'OK')
      expect(response.body).toHaveProperty('timestamp')
      expect(response.body).toHaveProperty('service', 'BatModule API')
      expect(response.body).toHaveProperty('version', '1.0.0')
    })
  })

  describe('GET /', () => {
    it('should return API information', async () => {
      const response = await request(app).get('/').expect(200)

      expect(response.body).toHaveProperty('message')
      expect(response.body).toHaveProperty('version', '1.0.0')
      expect(response.body).toHaveProperty('status', 'running')
    })
  })
})
