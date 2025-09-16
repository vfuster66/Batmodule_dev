/* eslint-disable no-unused-vars */
const request = require('supertest')
const express = require('express')
const notificationsRouter = require('../../routes/notifications')
const { authenticateToken } = require('../../middleware/auth')
const { query } = require('../../config/database')

// Mock des dépendances
jest.mock('../../middleware/auth')
jest.mock('../../config/database')

const app = express()
app.use(express.json())
app.use('/notifications', notificationsRouter)

describe('Notifications Routes', () => {
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

  describe('GET /notifications', () => {
    it('should return all notifications for authenticated user', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          title: 'Facture en retard',
          body: 'La facture FAC-2023-0001 est en retard de paiement',
          is_read: false,
          created_at: '2023-01-15T10:00:00Z',
        },
        {
          id: 'notif-2',
          title: 'Devis accepté',
          body: 'Le devis DEV-2023-0001 a été accepté par le client',
          is_read: true,
          created_at: '2023-01-14T15:30:00Z',
        },
      ]

      // Mock pour ensureTable() (CREATE TABLE)
      mockQuery.mockResolvedValueOnce({ rows: [] })
      // Mock pour la requête SELECT
      mockQuery.mockResolvedValueOnce({ rows: mockNotifications })

      const response = await request(app).get('/notifications').expect(200)

      expect(response.body.notifications).toHaveLength(2)
      expect(response.body.notifications[0]).toMatchObject({
        id: 'notif-1',
        title: 'Facture en retard',
        body: 'La facture FAC-2023-0001 est en retard de paiement',
        is_read: false,
      })
    })

    it('should handle database errors', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'))

      await request(app).get('/notifications').expect(500)
    })
  })

  describe('PUT /notifications/:id/read', () => {
    it('should mark notification as read successfully', async () => {
      const mockResult = {
        rows: [
          {
            id: 'notif-1',
          },
        ],
      }

      // Mock pour ensureTable() (CREATE TABLE)
      mockQuery.mockResolvedValueOnce({ rows: [] })
      // Mock pour la requête UPDATE
      mockQuery.mockResolvedValueOnce(mockResult)

      const response = await request(app)
        .put('/notifications/notif-1/read')
        .expect(200)

      expect(response.body.message).toBe('Notification lue')
    })

    it('should return 404 if notification not found', async () => {
      // Mock pour ensureTable() (CREATE TABLE)
      mockQuery.mockResolvedValueOnce({ rows: [] })
      // Mock pour la requête UPDATE (aucun résultat)
      mockQuery.mockResolvedValueOnce({ rows: [] })

      const response = await request(app)
        .put('/notifications/non-existent/read')
        .expect(404)

      expect(response.body.error).toBe('Notification non trouvée')
    })

    it('should handle database errors', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'))

      await request(app).put('/notifications/notif-1/read').expect(500)
    })
  })

  describe('Authentication', () => {
    it('should require authentication for all routes', async () => {
      authenticateToken.mockImplementation((req, res, _next) => {
        res.status(401).json({ error: 'Non autorisé' })
      })

      await request(app).get('/notifications').expect(401)
    })
  })
})
