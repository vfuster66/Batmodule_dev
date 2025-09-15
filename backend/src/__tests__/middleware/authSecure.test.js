const {
  authenticateSecure,
  optionalAuthSecure,
  generateCSRFToken,
  verifyCSRF,
} = require('../../middleware/authSecure')
const { query } = require('../../config/database')
const { csrfProtection } = require('../../middleware/csrf')

// Mock dependencies
jest.mock('../../config/database')
jest.mock('../../middleware/csrf')

describe('Auth Secure Middleware', () => {
  let req, res, next

  beforeEach(() => {
    req = {
      session: null,
      user: null,
    }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {},
    }
    next = jest.fn()
    jest.clearAllMocks()
  })

  describe('authenticateSecure', () => {
    it('should authenticate user with valid session', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        company_name: 'Test Company',
      }

      req.session = { userId: 1 }
      query.mockResolvedValueOnce({ rows: [mockUser] })

      await authenticateSecure(req, res, next)

      expect(query).toHaveBeenCalledWith(
        'SELECT id, email, first_name, last_name, company_name FROM users WHERE id = $1',
        [1]
      )
      expect(req.user).toEqual({
        userId: 1,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        companyName: 'Test Company',
      })
      expect(next).toHaveBeenCalled()
    })

    it('should return 401 when no session', async () => {
      req.session = null

      await authenticateSecure(req, res, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        error: 'Non authentifié',
        message: 'Session invalide ou expirée',
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should return 401 when session has no userId', async () => {
      req.session = {}

      await authenticateSecure(req, res, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        error: 'Non authentifié',
        message: 'Session invalide ou expirée',
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should destroy session and return 401 when user not found', async () => {
      req.session = {
        userId: 999,
        destroy: jest.fn(),
      }
      query.mockResolvedValueOnce({ rows: [] })

      await authenticateSecure(req, res, next)

      expect(req.session.destroy).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        error: 'Utilisateur non trouvé',
        message: "L'utilisateur associé à cette session n'existe plus",
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should handle database errors', async () => {
      req.session = { userId: 1 }
      const dbError = new Error('Database error')
      query.mockRejectedValueOnce(dbError)

      await authenticateSecure(req, res, next)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({
        error: "Erreur d'authentification",
        message:
          "Une erreur est survenue lors de la vérification de l'authentification",
      })
      expect(next).not.toHaveBeenCalled()
    })
  })

  describe('optionalAuthSecure', () => {
    it('should authenticate user when session exists', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        company_name: 'Test Company',
      }

      req.session = { userId: 1 }
      query.mockResolvedValueOnce({ rows: [mockUser] })

      await optionalAuthSecure(req, res, next)

      expect(req.user).toEqual({
        userId: 1,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        companyName: 'Test Company',
      })
      expect(next).toHaveBeenCalled()
    })

    it('should continue without authentication when no session', async () => {
      req.session = null

      await optionalAuthSecure(req, res, next)

      expect(req.user).toBeNull()
      expect(next).toHaveBeenCalled()
    })

    it('should continue without authentication when user not found', async () => {
      req.session = { userId: 999 }
      query.mockResolvedValueOnce({ rows: [] })

      await optionalAuthSecure(req, res, next)

      expect(req.user).toBeNull()
      expect(next).toHaveBeenCalled()
    })

    it('should continue without authentication on database error', async () => {
      req.session = { userId: 1 }
      query.mockRejectedValueOnce(new Error('Database error'))

      await optionalAuthSecure(req, res, next)

      expect(req.user).toBeNull()
      expect(next).toHaveBeenCalled()
    })
  })

  describe('generateCSRFToken', () => {
    it('should generate CSRF token when session exists', () => {
      const mockToken = 'mock-csrf-token'
      req.session = { id: 'test-session-123' }
      csrfProtection.generateToken.mockReturnValue(mockToken)

      generateCSRFToken(req, res, next)

      expect(csrfProtection.generateToken).toHaveBeenCalledWith(
        'test-session-123'
      )
      expect(req.csrfToken).toBe(mockToken)
      expect(res.locals.csrfToken).toBe(mockToken)
      expect(next).toHaveBeenCalled()
    })

    it('should not generate CSRF token when no session', () => {
      req.session = null

      generateCSRFToken(req, res, next)

      expect(csrfProtection.generateToken).not.toHaveBeenCalled()
      expect(req.csrfToken).toBeUndefined()
      expect(res.locals.csrfToken).toBeUndefined()
      expect(next).toHaveBeenCalled()
    })

    it('should not generate CSRF token when session has no id', () => {
      req.session = {}

      generateCSRFToken(req, res, next)

      expect(csrfProtection.generateToken).not.toHaveBeenCalled()
      expect(req.csrfToken).toBeUndefined()
      expect(res.locals.csrfToken).toBeUndefined()
      expect(next).toHaveBeenCalled()
    })
  })

  describe('verifyCSRF', () => {
    beforeEach(() => {
      req.path = '/api/test'
      req.method = 'POST'
      req.session = { id: 'test-session-123' }
      req.headers = {}
      req.body = {}
    })

    it('should allow GET requests without CSRF token', () => {
      req.method = 'GET'

      verifyCSRF(req, res, next)

      expect(next).toHaveBeenCalled()
      expect(res.status).not.toHaveBeenCalled()
    })

    it('should allow HEAD requests without CSRF token', () => {
      req.method = 'HEAD'

      verifyCSRF(req, res, next)

      expect(next).toHaveBeenCalled()
      expect(res.status).not.toHaveBeenCalled()
    })

    it('should allow OPTIONS requests without CSRF token', () => {
      req.method = 'OPTIONS'

      verifyCSRF(req, res, next)

      expect(next).toHaveBeenCalled()
      expect(res.status).not.toHaveBeenCalled()
    })

    it('should allow exempted paths without CSRF token', () => {
      req.path = '/api/auth/login'

      verifyCSRF(req, res, next)

      expect(next).toHaveBeenCalled()
      expect(res.status).not.toHaveBeenCalled()
    })

    it('should allow register path without CSRF token', () => {
      req.path = '/api/auth/register'

      verifyCSRF(req, res, next)

      expect(next).toHaveBeenCalled()
      expect(res.status).not.toHaveBeenCalled()
    })

    it('should allow RGPD export path without CSRF token', () => {
      req.path = '/api/rgpd/export'

      verifyCSRF(req, res, next)

      expect(next).toHaveBeenCalled()
      expect(res.status).not.toHaveBeenCalled()
    })

    it('should require CSRF token for POST requests', () => {
      verifyCSRF(req, res, next)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        error: 'Token CSRF manquant',
        message: 'Un token CSRF est requis pour cette opération',
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should accept valid CSRF token in header', () => {
      const token = 'valid-csrf-token'
      req.headers['x-csrf-token'] = token
      csrfProtection.verifyToken.mockReturnValue(true)

      verifyCSRF(req, res, next)

      expect(csrfProtection.verifyToken).toHaveBeenCalledWith(
        token,
        'test-session-123'
      )
      expect(next).toHaveBeenCalled()
      expect(res.status).not.toHaveBeenCalled()
    })

    it('should accept valid CSRF token in body', () => {
      const token = 'valid-csrf-token'
      req.body._csrf = token
      csrfProtection.verifyToken.mockReturnValue(true)

      verifyCSRF(req, res, next)

      expect(csrfProtection.verifyToken).toHaveBeenCalledWith(
        token,
        'test-session-123'
      )
      expect(next).toHaveBeenCalled()
      expect(res.status).not.toHaveBeenCalled()
    })

    it('should reject invalid CSRF token', () => {
      const token = 'invalid-csrf-token'
      req.headers['x-csrf-token'] = token
      csrfProtection.verifyToken.mockReturnValue(false)

      verifyCSRF(req, res, next)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        error: 'Token CSRF invalide',
        message: 'Le token CSRF est invalide ou expiré',
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should require session ID for CSRF verification', () => {
      req.session = null

      verifyCSRF(req, res, next)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        error: 'Token CSRF manquant',
        message: 'Un token CSRF est requis pour cette opération',
      })
      expect(next).not.toHaveBeenCalled()
    })
  })
})
