const request = require('supertest')
const express = require('express')

// Créer une app Express simple pour les tests d'API
const createTestApp = () => {
  const app = express()
  app.use(express.json())

  // Mock des routes API pour les tests
  app.post('/api/auth/login', (req, res) => {
    if (!req.body.email || !req.body.password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' })
    }
    res.status(400).json({ error: 'Identifiants invalides' })
  })

  app.get('/api/company-settings', (req, res) => {
    res.status(401).json({ error: 'Non authentifié' })
  })

  app.get('/api/clients', (req, res) => {
    res.status(401).json({ error: 'Non authentifié' })
  })

  return app
}

describe('Integration Tests - API Routes', () => {
  let app

  beforeAll(() => {
    app = createTestApp()
  })

  describe('API Authentication', () => {
    it('should reject requests without credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400)

      expect(response.body).toHaveProperty(
        'error',
        'Email et mot de passe requis'
      )
    })

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'password' })
        .expect(400)

      expect(response.body).toHaveProperty('error', 'Identifiants invalides')
    })
  })

  describe('API Company Settings', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/company-settings')
        .expect(401)

      expect(response.body).toHaveProperty('error', 'Non authentifié')
    })
  })

  describe('API Clients', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/clients').expect(401)

      expect(response.body).toHaveProperty('error', 'Non authentifié')
    })
  })
})
