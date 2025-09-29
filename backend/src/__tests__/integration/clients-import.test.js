const request = require('supertest')
const app = require('../../server')
const { query } = require('../../config/database')

describe("Import CSV Clients - Tests d'intégration", () => {
  let authToken
  let userId

  beforeAll(async () => {
    // Créer un utilisateur de test et obtenir un token d'authentification
    // Note: Dans un vrai test, vous utiliseriez une base de données de test
    authToken = 'test-token' // Simulé pour l'exemple
    userId = 1 // Simulé pour l'exemple
  })

  afterAll(async () => {
    // Nettoyer les données de test
    await query('DELETE FROM clients WHERE user_id = $1', [userId])
  })

  describe("Validation SIRET lors de l'import", () => {
    test('Devrait rejeter un SIRET invalide (clé Luhn incorrecte)', async () => {
      const clientsData = [
        {
          firstName: 'Jean',
          lastName: 'Dupont',
          companyName: 'Entreprise Test',
          email: 'jean@test.com',
          isCompany: true,
          siret: '12345678901234', // SIRET invalide (clé Luhn incorrecte)
        },
      ]

      const response = await request(app)
        .post('/clients/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ clients: clientsData })

      expect(response.status).toBe(200)
      expect(response.body.results.errors).toHaveLength(1)
      expect(response.body.results.errors[0].error).toContain(
        "SIRET n'est pas valide"
      )
    })

    test('Devrait accepter un SIRET valide avec espaces', async () => {
      const clientsData = [
        {
          firstName: 'Marie',
          lastName: 'Martin',
          companyName: 'Société Test',
          email: 'marie@test.com',
          isCompany: true,
          siret: '123 456 789 01234', // SIRET avec espaces (sera normalisé)
        },
      ]

      const response = await request(app)
        .post('/clients/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ clients: clientsData })

      expect(response.status).toBe(200)
      expect(response.body.results.success).toHaveLength(1)
      expect(response.body.results.errors).toHaveLength(0)
    })

    test('Devrait normaliser les SIRET avec tirets', async () => {
      const clientsData = [
        {
          firstName: 'Pierre',
          lastName: 'Durand',
          companyName: 'Entreprise Durand',
          email: 'pierre@test.com',
          isCompany: true,
          siret: '123-456-789-01234', // SIRET avec tirets
        },
      ]

      const response = await request(app)
        .post('/clients/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ clients: clientsData })

      expect(response.status).toBe(200)
      expect(response.body.results.success).toHaveLength(1)

      // Vérifier que le SIRET a été normalisé en base
      const result = await query(
        'SELECT siret FROM clients WHERE user_id = $1 AND siret IS NOT NULL',
        [userId]
      )
      expect(result.rows[0].siret).toBe('12345678901234')
    })
  })

  describe("Détection des doublons lors de l'import", () => {
    beforeEach(async () => {
      // Créer un client existant pour les tests de doublons
      await query(
        `INSERT INTO clients (user_id, first_name, last_name, company_name, email, siret, is_company)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          userId,
          'Client',
          'Existant',
          'Entreprise Existante',
          'existant@test.com',
          '98765432109876',
          true,
        ]
      )
    })

    test('Devrait détecter un doublon par email', async () => {
      const clientsData = [
        {
          firstName: 'Nouveau',
          lastName: 'Client',
          companyName: 'Nouvelle Entreprise',
          email: 'existant@test.com', // Email déjà existant
          isCompany: true,
        },
      ]

      const response = await request(app)
        .post('/clients/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ clients: clientsData })

      expect(response.status).toBe(200)
      expect(response.body.results.errors).toHaveLength(1)
      expect(response.body.results.errors[0].error).toContain(
        'email existe déjà'
      )
    })

    test('Devrait détecter un doublon par SIRET (même avec formatage différent)', async () => {
      const clientsData = [
        {
          firstName: 'Autre',
          lastName: 'Client',
          companyName: 'Autre Entreprise',
          email: 'autre@test.com',
          isCompany: true,
          siret: '987 654 321 09876', // Même SIRET que l'existant mais avec espaces
        },
      ]

      const response = await request(app)
        .post('/clients/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ clients: clientsData })

      expect(response.status).toBe(200)
      expect(response.body.results.errors).toHaveLength(1)
      expect(response.body.results.errors[0].error).toContain(
        'SIRET existe déjà'
      )
    })

    test("Devrait permettre l'import si pas de doublon", async () => {
      const clientsData = [
        {
          firstName: 'Nouveau',
          lastName: 'Client',
          companyName: 'Nouvelle Entreprise',
          email: 'nouveau@test.com',
          isCompany: true,
          siret: '11111111111111',
        },
      ]

      const response = await request(app)
        .post('/clients/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ clients: clientsData })

      expect(response.status).toBe(200)
      expect(response.body.results.success).toHaveLength(1)
      expect(response.body.results.errors).toHaveLength(0)
    })
  })

  describe('Validation des entreprises sans prénom/nom', () => {
    test("Devrait accepter une entreprise avec seulement le nom de l'entreprise", async () => {
      const clientsData = [
        {
          firstName: '', // Vide
          lastName: '', // Vide
          companyName: 'Entreprise Sans Contact',
          email: 'contact@entreprise.com',
          isCompany: true,
          siret: '22222222222222',
        },
      ]

      const response = await request(app)
        .post('/clients/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ clients: clientsData })

      expect(response.status).toBe(200)
      expect(response.body.results.success).toHaveLength(1)
      expect(response.body.results.errors).toHaveLength(0)
    })

    test("Devrait rejeter une entreprise sans nom d'entreprise ni contact", async () => {
      const clientsData = [
        {
          firstName: '', // Vide
          lastName: '', // Vide
          companyName: '', // Vide
          email: 'test@test.com',
          isCompany: true,
        },
      ]

      const response = await request(app)
        .post('/clients/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ clients: clientsData })

      expect(response.status).toBe(200)
      expect(response.body.results.errors).toHaveLength(1)
      expect(response.body.results.errors[0].error).toContain(
        'entreprise ou le prénom/nom du contact'
      )
    })
  })

  describe('Import mixte avec succès et erreurs', () => {
    test('Devrait traiter un lot mixte correctement', async () => {
      const clientsData = [
        // Client valide
        {
          firstName: 'Client',
          lastName: 'Valide',
          email: 'valide@test.com',
          isCompany: false,
        },
        // Entreprise valide
        {
          firstName: '',
          lastName: '',
          companyName: 'Entreprise Valide',
          email: 'entreprise@test.com',
          isCompany: true,
          siret: '33333333333333',
        },
        // Client avec SIRET invalide
        {
          firstName: 'Client',
          lastName: 'Invalide',
          email: 'invalide@test.com',
          isCompany: true,
          siret: '00000000000000', // SIRET invalide
        },
        // Client avec email dupliqué
        {
          firstName: 'Autre',
          lastName: 'Client',
          email: 'existant@test.com', // Email déjà existant
          isCompany: false,
        },
      ]

      const response = await request(app)
        .post('/clients/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ clients: clientsData })

      expect(response.status).toBe(200)
      expect(response.body.results.success).toHaveLength(2) // 2 clients valides
      expect(response.body.results.errors).toHaveLength(2) // 2 erreurs

      // Vérifier les types d'erreurs
      const errorMessages = response.body.results.errors.map((e) => e.error)
      expect(
        errorMessages.some((msg) => msg.includes("SIRET n'est pas valide"))
      ).toBe(true)
      expect(
        errorMessages.some((msg) => msg.includes('email existe déjà'))
      ).toBe(true)
    })
  })

  describe('Gestion des cas limites', () => {
    test('Devrait gérer un tableau vide', async () => {
      const response = await request(app)
        .post('/clients/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ clients: [] })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Données invalides')
    })

    test('Devrait gérer des données manquantes', async () => {
      const response = await request(app)
        .post('/clients/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Données invalides')
    })
  })
})
