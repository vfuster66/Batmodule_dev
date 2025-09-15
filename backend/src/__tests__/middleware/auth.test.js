const jwt = require('jsonwebtoken')
const { authenticateToken, optionalAuth } = require('../../middleware/auth')
const { query } = require('../../config/database')

// Mock des dépendances
jest.mock('jsonwebtoken')
jest.mock('../../config/database')

describe('Auth Middleware', () => {
  let req, res, next

  beforeEach(() => {
    req = {
      headers: {},
      user: null,
    }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
    next = jest.fn()
    jest.clearAllMocks()
  })

  describe('authenticateToken', () => {
    it('should authenticate user with valid token', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
      }

      req.headers.authorization = 'Bearer valid-token'

      // Mock JWT verify
      jwt.verify.mockReturnValueOnce({
        userId: 1,
        email: 'test@example.com',
      })

      // Mock database query
      query.mockResolvedValueOnce({ rows: [mockUser] })

      await authenticateToken(req, res, next)

      expect(jwt.verify).toHaveBeenCalledWith(
        'valid-token',
        'test-secret-key-for-testing-only'
      )
      expect(query).toHaveBeenCalledWith(
        'SELECT id, email, first_name, last_name FROM users WHERE id = $1',
        [1]
      )
      expect(req.user).toEqual({
        userId: 1,
        email: 'test@example.com',
      })
      expect(next).toHaveBeenCalled()
    })

    it('should return 401 if no token provided', async () => {
      await authenticateToken(req, res, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        error: 'Token manquant',
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should authenticate with cookie token when no Bearer token', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
      }

      req.cookies = { token: 'cookie-token' }

      // Mock JWT verify
      jwt.verify.mockReturnValueOnce({
        userId: 1,
        email: 'test@example.com',
      })

      // Mock database query
      query.mockResolvedValueOnce({ rows: [mockUser] })

      await authenticateToken(req, res, next)

      expect(jwt.verify).toHaveBeenCalledWith(
        'cookie-token',
        'test-secret-key-for-testing-only'
      )
      expect(req.user).toEqual({
        userId: 1,
        email: 'test@example.com',
      })
      expect(next).toHaveBeenCalled()
    })

    it('should prioritize Bearer token over cookie token', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
      }

      req.headers.authorization = 'Bearer bearer-token'
      req.cookies = { token: 'cookie-token' }

      // Mock JWT verify
      jwt.verify.mockReturnValueOnce({
        userId: 1,
        email: 'test@example.com',
      })

      // Mock database query
      query.mockResolvedValueOnce({ rows: [mockUser] })

      await authenticateToken(req, res, next)

      expect(jwt.verify).toHaveBeenCalledWith(
        'bearer-token',
        'test-secret-key-for-testing-only'
      )
      expect(next).toHaveBeenCalled()
    })

    it('should handle missing JWT_SECRET', async () => {
      const originalSecret = process.env.JWT_SECRET
      delete process.env.JWT_SECRET

      req.headers.authorization = 'Bearer valid-token'

      await authenticateToken(req, res, next)

      expect(next).toHaveBeenCalledWith(expect.any(Error))
      expect(next.mock.calls[0][0].message).toContain(
        'JWT_SECRET non configuré'
      )

      // Restore
      process.env.JWT_SECRET = originalSecret
    })

    it('should return 401 if token is invalid', async () => {
      req.headers.authorization = 'Bearer invalid-token'

      // Mock JWT verify to throw error
      jwt.verify.mockImplementationOnce(() => {
        const error = new Error('Invalid token')
        error.name = 'JsonWebTokenError'
        throw error
      })

      await authenticateToken(req, res, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        error: 'Token invalide',
        message: "Le token d'authentification est invalide",
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should return 401 if token is expired', async () => {
      req.headers.authorization = 'Bearer expired-token'

      // Mock JWT verify to throw expired error
      jwt.verify.mockImplementationOnce(() => {
        const error = new Error('Token expired')
        error.name = 'TokenExpiredError'
        throw error
      })

      await authenticateToken(req, res, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        error: 'Token expiré',
        message: "Le token d'authentification a expiré",
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should return 401 if user not found in database', async () => {
      req.headers.authorization = 'Bearer valid-token'

      // Mock JWT verify
      jwt.verify.mockReturnValueOnce({
        userId: 999,
        email: 'nonexistent@example.com',
      })

      // Mock database query - user not found
      query.mockResolvedValueOnce({ rows: [] })

      await authenticateToken(req, res, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        error: 'Utilisateur non trouvé',
        message: "L'utilisateur associé à ce token n'existe plus",
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should handle database errors', async () => {
      req.headers.authorization = 'Bearer valid-token'

      // Mock JWT verify
      jwt.verify.mockReturnValueOnce({
        userId: 1,
        email: 'test@example.com',
      })

      // Mock database query to throw error
      query.mockRejectedValueOnce(new Error('Database error'))

      await authenticateToken(req, res, next)

      expect(next).toHaveBeenCalledWith(expect.any(Error))
    })
  })

  describe('optionalAuth', () => {
    it('should authenticate user with valid token', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
      }

      req.headers.authorization = 'Bearer valid-token'

      // Mock JWT verify
      jwt.verify.mockReturnValueOnce({
        userId: 1,
        email: 'test@example.com',
      })

      // Mock database query
      query.mockResolvedValueOnce({ rows: [mockUser] })

      await optionalAuth(req, res, next)

      expect(req.user).toEqual({
        userId: 1,
        email: 'test@example.com',
      })
      expect(next).toHaveBeenCalled()
    })

    it('should continue without authentication if no token', async () => {
      await optionalAuth(req, res, next)

      expect(req.user).toBeNull()
      expect(next).toHaveBeenCalled()
    })

    it('should continue without authentication if token is invalid', async () => {
      req.headers.authorization = 'Bearer invalid-token'

      // Mock JWT verify to throw error
      jwt.verify.mockImplementationOnce(() => {
        const error = new Error('Invalid token')
        error.name = 'JsonWebTokenError'
        throw error
      })

      await optionalAuth(req, res, next)

      expect(req.user).toBeNull()
      expect(next).toHaveBeenCalled()
    })

    it('should continue without authentication if user not found', async () => {
      req.headers.authorization = 'Bearer valid-token'

      // Mock JWT verify
      jwt.verify.mockReturnValueOnce({
        userId: 999,
        email: 'nonexistent@example.com',
      })

      // Mock database query - user not found
      query.mockResolvedValueOnce({ rows: [] })

      await optionalAuth(req, res, next)

      expect(req.user).toBeNull()
      expect(next).toHaveBeenCalled()
    })

    it('should handle missing JWT_SECRET in optionalAuth', async () => {
      const originalSecret = process.env.JWT_SECRET
      delete process.env.JWT_SECRET

      req.headers.authorization = 'Bearer valid-token'

      await optionalAuth(req, res, next)

      expect(req.user).toBeNull()
      expect(next).toHaveBeenCalled()

      // Restore
      process.env.JWT_SECRET = originalSecret
    })
  })
})
