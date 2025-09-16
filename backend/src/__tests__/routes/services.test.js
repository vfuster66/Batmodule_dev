/* eslint-disable no-unused-vars */
const request = require('supertest')
const express = require('express')
const servicesRouter = require('../../routes/services')
const { authenticateToken } = require('../../middleware/auth')
const { query } = require('../../config/database')

// Mock des dépendances
jest.mock('../../middleware/auth')
jest.mock('../../config/database')

const app = express()
app.use(express.json())
app.use('/services', servicesRouter)

describe('Services Routes', () => {
  let mockQuery

  beforeEach(() => {
    mockQuery = jest.fn()
    query.mockImplementation(mockQuery)
    authenticateToken.mockImplementation((req, res, next) => {
      req.user = { userId: 'test-user-id' }
      next()
    })
    jest.clearAllMocks()
  })

  describe('Categories', () => {
    describe('GET /services/categories', () => {
      it('should return all categories for authenticated user', async () => {
        const mockCategories = [
          {
            id: 'category-1',
            name: 'Peinture',
            description: 'Services de peinture',
            color: '#004AAD',
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z',
          },
          {
            id: 'category-2',
            name: 'Rénovation',
            description: 'Services de rénovation',
            color: '#FF6B6B',
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z',
          },
        ]

        mockQuery.mockResolvedValueOnce({ rows: mockCategories })

        const response = await request(app)
          .get('/services/categories')
          .expect(200)

        expect(response.body.categories).toHaveLength(2)
        expect(response.body.categories[0]).toMatchObject({
          id: 'category-1',
          name: 'Peinture',
          description: 'Services de peinture',
          color: '#004AAD',
        })
      })

      it('should handle database errors', async () => {
        mockQuery.mockRejectedValueOnce(new Error('Database error'))

        await request(app).get('/services/categories').expect(500)
      })
    })

    describe('POST /services/categories', () => {
      it('should create a new category', async () => {
        const newCategory = {
          name: 'Nouvelle Catégorie',
          description: 'Description de la nouvelle catégorie',
          color: '#00FF00',
        }

        const mockCreatedCategory = {
          id: 'category-3',
          ...newCategory,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        }

        mockQuery.mockResolvedValueOnce({ rows: [mockCreatedCategory] })

        const response = await request(app)
          .post('/services/categories')
          .send(newCategory)
          .expect(201)

        expect(response.body.category).toMatchObject({
          id: 'category-3',
          name: 'Nouvelle Catégorie',
          description: 'Description de la nouvelle catégorie',
          color: '#00FF00',
        })
      })

      it('should create category with default color', async () => {
        const newCategory = {
          name: 'Catégorie Sans Couleur',
        }

        const mockCreatedCategory = {
          id: 'category-4',
          name: 'Catégorie Sans Couleur',
          description: null,
          color: '#004AAD', // Default color
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        }

        mockQuery.mockResolvedValueOnce({ rows: [mockCreatedCategory] })

        const response = await request(app)
          .post('/services/categories')
          .send(newCategory)
          .expect(201)

        expect(response.body.category.color).toBe('#004AAD')
      })

      it('should return 400 for invalid data', async () => {
        const invalidCategory = {
          name: '', // Invalid: too short
          color: 'invalid-color', // Invalid color format
        }

        await request(app)
          .post('/services/categories')
          .send(invalidCategory)
          .expect(400)
      })

      it('should return 400 for missing required fields', async () => {
        const incompleteCategory = {
          description: 'Description sans nom',
          // Missing name
        }

        await request(app)
          .post('/services/categories')
          .send(incompleteCategory)
          .expect(400)
      })
    })

    // Note: no update/delete routes for categories in current API

    // No DELETE category route in current API
  })

  describe('Services', () => {
    describe('GET /services', () => {
      it('should return all services for authenticated user', async () => {
        const mockServices = [
          {
            id: 'service-1',
            category_id: 'category-1',
            name: 'Peinture Mur',
            description: 'Peinture de murs intérieurs',
            unit: 'm²',
            price_ht: 25.0,
            price_ttc: 30.0,
            vat_rate: 20.0,
            is_active: true,
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z',
            category_name: 'Peinture',
            category_color: '#004AAD',
          },
        ]

        const mockCount = { rows: [{ total: '1' }] }
        mockQuery.mockResolvedValueOnce({ rows: mockServices })
        mockQuery.mockResolvedValueOnce(mockCount)

        const response = await request(app).get('/services').expect(200)

        expect(response.body.services).toHaveLength(1)
        expect(response.body.services[0]).toMatchObject({
          id: 'service-1',
          category_id: 'category-1',
          name: 'Peinture Mur',
          description: 'Peinture de murs intérieurs',
          unit: 'm²',
          price_ht: 25.0,
          price_ttc: 30.0,
          vat_rate: 20.0,
          is_active: true,
          category_name: 'Peinture',
          category_color: '#004AAD',
        })
      })

      it('should handle search query', async () => {
        const mockCount = { rows: [{ total: '0' }] }
        mockQuery.mockResolvedValueOnce({ rows: [] })
        mockQuery.mockResolvedValueOnce(mockCount)

        await request(app).get('/services?search=peinture').expect(200)

        expect(mockQuery).toHaveBeenCalledWith(
          expect.stringContaining('ILIKE'),
          expect.arrayContaining(['test-user-id', '%peinture%'])
        )
      })

      it('should filter by category', async () => {
        const mockCount = { rows: [{ total: '0' }] }
        mockQuery.mockResolvedValueOnce({ rows: [] })
        mockQuery.mockResolvedValueOnce(mockCount)

        await request(app).get('/services?categoryId=category-1').expect(200)

        expect(mockQuery).toHaveBeenCalledWith(
          expect.stringContaining('category_id = $'),
          expect.arrayContaining(['test-user-id', 'category-1'])
        )
      })

      it('should handle pagination', async () => {
        const mockCount = { rows: [{ total: '0' }] }
        mockQuery.mockResolvedValueOnce({ rows: [] })
        mockQuery.mockResolvedValueOnce(mockCount)

        await request(app).get('/services?page=2&limit=10').expect(200)

        expect(mockQuery).toHaveBeenCalledWith(
          expect.stringContaining('LIMIT $2 OFFSET $3'),
          expect.arrayContaining(['test-user-id', 10, 10])
        )
      })

      it('should support camelCase categoryId param', async () => {
        const mockCount = { rows: [{ total: '0' }] }
        mockQuery.mockResolvedValueOnce({ rows: [] })
        mockQuery.mockResolvedValueOnce(mockCount)

        await request(app).get('/services?categoryId=category-99').expect(200)

        expect(mockQuery).toHaveBeenCalledWith(
          expect.stringContaining('s.category_id = $'),
          expect.arrayContaining(['test-user-id', 'category-99'])
        )
      })

      it('should sort by price_ht desc when specified', async () => {
        const mockServices = []
        const mockCount = { rows: [{ total: '0' }] }
        mockQuery.mockResolvedValueOnce({ rows: mockServices })
        mockQuery.mockResolvedValueOnce(mockCount)

        await request(app)
          .get('/services?sortBy=price_ht&sortOrder=desc')
          .expect(200)

        expect(mockQuery).toHaveBeenCalledWith(
          expect.stringContaining('ORDER BY s.price_ht DESC'),
          expect.arrayContaining(['test-user-id', 20, 0])
        )
      })

      it('should default to name asc when sort invalid', async () => {
        const mockCount = { rows: [{ total: '0' }] }
        mockQuery.mockResolvedValueOnce({ rows: [] })
        mockQuery.mockResolvedValueOnce(mockCount)

        await request(app)
          .get('/services?sortBy=invalid&sortOrder=invalid')
          .expect(200)

        expect(mockQuery).toHaveBeenCalledWith(
          expect.stringContaining('ORDER BY s.name ASC'),
          expect.arrayContaining(['test-user-id', 20, 0])
        )
      })
    })

    describe('GET /services/:id', () => {
      it('should return a specific service', async () => {
        const mockService = {
          id: 'service-1',
          category_id: 'category-1',
          name: 'Peinture Mur',
          description: 'Peinture de murs intérieurs',
          unit: 'm²',
          price_ht: 25.0,
          price_ttc: 30.0,
          vat_rate: 20.0,
          is_active: true,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          category_name: 'Peinture',
          category_color: '#004AAD',
        }

        mockQuery.mockResolvedValueOnce({ rows: [mockService] })

        const response = await request(app)
          .get('/services/service-1')
          .expect(200)

        expect(response.body.service).toMatchObject({
          id: 'service-1',
          category_id: 'category-1',
          name: 'Peinture Mur',
          description: 'Peinture de murs intérieurs',
          unit: 'm²',
          price_ht: 25.0,
          price_ttc: 30.0,
          vat_rate: 20.0,
          is_active: true,
          category_name: 'Peinture',
          category_color: '#004AAD',
        })
      })

      it('should return 404 if service not found', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [] })

        await request(app).get('/services/non-existent').expect(404)
      })
    })

    describe('POST /services', () => {
      it('should create a new service', async () => {
        const newService = {
          category_id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Peinture Plafond',
          description: 'Peinture de plafonds',
          unit: 'm²',
          price_ht: 30.0,
          price_ttc: 36.0,
          vat_rate: 20.0,
          is_active: true,
        }

        const mockCreatedService = {
          id: 'service-2',
          ...newService,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        }

        mockQuery.mockResolvedValueOnce({ rows: [mockCreatedService] })

        const response = await request(app)
          .post('/services')
          .send(newService)
          .expect(201)

        expect(response.body.service).toMatchObject({
          id: 'service-2',
          category_id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Peinture Plafond',
          description: 'Peinture de plafonds',
          unit: 'm²',
          price_ht: 30.0,
          price_ttc: 36.0,
          vat_rate: 20.0,
          is_active: true,
        })
      })

      it('should create service with default values', async () => {
        const newService = {
          name: 'Service Simple',
          price_ht: 20.0,
          price_ttc: 24.0,
        }

        const mockCreatedService = {
          id: 'service-3',
          category_id: null,
          name: 'Service Simple',
          description: null,
          unit: 'm²', // Default unit
          price_ht: 20.0,
          price_ttc: 24.0,
          vat_rate: 20.0, // Default VAT rate
          is_active: true, // Default active
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        }

        mockQuery.mockResolvedValueOnce({ rows: [mockCreatedService] })

        const response = await request(app)
          .post('/services')
          .send(newService)
          .expect(201)

        expect(response.body.service).toMatchObject({
          id: 'service-3',
          name: 'Service Simple',
          unit: 'm²',
          vat_rate: 20.0,
          is_active: true,
        })
      })

      it('should return 400 for invalid data', async () => {
        const invalidService = {
          name: '', // Invalid: too short
          price_ht: -10, // Invalid: negative price
          price_ttc: 'invalid', // Invalid: not a number
        }

        await request(app).post('/services').send(invalidService).expect(400)
      })

      it('should return 400 for missing required fields', async () => {
        const incompleteService = {
          description: 'Service sans nom ni prix',
          // Missing name, price_ht, price_ttc
        }

        await request(app).post('/services').send(incompleteService).expect(400)
      })
    })

    describe('PUT /services/:id', () => {
      it('should update an existing service', async () => {
        const updateData = {
          name: 'Peinture Mur Mise à Jour',
          description: 'Description mise à jour',
          price_ht: 35.0,
          price_ttc: 42.0,
          vat_rate: 20.0,
        }

        const mockUpdatedService = {
          id: 'service-1',
          category_id: 'category-1',
          ...updateData,
          unit: 'm²',
          is_active: true,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        }

        mockQuery.mockResolvedValueOnce({ rows: [mockUpdatedService] })

        const response = await request(app)
          .put('/services/service-1')
          .send(updateData)
          .expect(200)

        expect(response.body.service).toMatchObject({
          id: 'service-1',
          name: 'Peinture Mur Mise à Jour',
          description: 'Description mise à jour',
          price_ht: 35.0,
          price_ttc: 42.0,
          vat_rate: 20.0,
        })
      })

      it('should return 404 if service not found', async () => {
        const updateData = {
          name: 'Service Mis à Jour',
          description: 'Desc',
          unit: 'm²',
          price_ht: 10.0,
          price_ttc: 12.0,
          vat_rate: 20.0,
          is_active: true,
        }

        mockQuery.mockResolvedValueOnce({ rows: [] })

        await request(app)
          .put('/services/non-existent')
          .send(updateData)
          .expect(404)
      })
    })

    describe('DELETE /services/:id', () => {
      it('should delete a service', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [{ id: 'service-1' }] })

        await request(app).delete('/services/service-1').expect(200)

        expect(mockQuery).toHaveBeenCalledWith(
          expect.stringContaining('DELETE FROM services'),
          expect.arrayContaining(['service-1', 'test-user-id'])
        )
      })

      it('should return 404 if service not found', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [] })

        await request(app).delete('/services/non-existent').expect(404)
      })
    })
  })

  describe('Authentication', () => {
    it('should require authentication for all routes', async () => {
      authenticateToken.mockImplementationOnce((req, res, _next) => {
        res.status(401).json({ error: 'Unauthorized' })
      })

      await request(app).get('/services').expect(401)
    })
  })
})
