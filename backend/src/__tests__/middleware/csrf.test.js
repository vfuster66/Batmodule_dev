const { csrfProtection, csrfMiddleware } = require('../../middleware/csrf')

describe('CSRF Protection', () => {
  let originalEnv

  beforeEach(() => {
    originalEnv = {
      CSRF_SECRET: process.env.CSRF_SECRET,
      JWT_SECRET: process.env.JWT_SECRET,
    }
    process.env.CSRF_SECRET = 'test-csrf-secret'
    jest.clearAllMocks()
  })

  afterEach(() => {
    Object.keys(originalEnv).forEach((key) => {
      if (originalEnv[key] !== undefined) {
        process.env[key] = originalEnv[key]
      } else {
        delete process.env[key]
      }
    })
  })

  describe('generateToken', () => {
    it('should generate a valid CSRF token', () => {
      const sessionId = 'test-session-123'
      const token = csrfProtection.generateToken(sessionId)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(0)
    })

    it('should generate different tokens for different sessions', () => {
      const sessionId1 = 'session-1'
      const sessionId2 = 'session-2'

      const token1 = csrfProtection.generateToken(sessionId1)
      const token2 = csrfProtection.generateToken(sessionId2)

      expect(token1).not.toBe(token2)
    })

    it('should generate different tokens at different times', () => {
      const sessionId = 'test-session'

      const token1 = csrfProtection.generateToken(sessionId)
      // Attendre un peu pour avoir un timestamp différent
      setTimeout(() => {
        const token2 = csrfProtection.generateToken(sessionId)
        expect(token1).not.toBe(token2)
      }, 1)
    })

    it('should generate base64 encoded token', () => {
      const sessionId = 'test-session-123'
      const token = csrfProtection.generateToken(sessionId)

      // Vérifier que c'est du base64 valide
      expect(() => Buffer.from(token, 'base64')).not.toThrow()
    })
  })

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const sessionId = 'test-session-123'
      const token = csrfProtection.generateToken(sessionId)

      const isValid = csrfProtection.verifyToken(token, sessionId)

      expect(isValid).toBe(true)
    })

    it('should reject token with wrong session ID', () => {
      const sessionId = 'test-session-123'
      const wrongSessionId = 'wrong-session-456'
      const token = csrfProtection.generateToken(sessionId)

      const isValid = csrfProtection.verifyToken(token, wrongSessionId)

      expect(isValid).toBe(false)
    })

    it('should reject expired token', () => {
      const sessionId = 'test-session-123'
      const token = csrfProtection.generateToken(sessionId)
      const maxAge = 1 // 1ms

      // Attendre que le token expire
      setTimeout(() => {
        const isValid = csrfProtection.verifyToken(token, sessionId, maxAge)
        expect(isValid).toBe(false)
      }, 2)
    })

    it('should accept token within maxAge', () => {
      const sessionId = 'test-session-123'
      const token = csrfProtection.generateToken(sessionId)
      const maxAge = 3600000 // 1 heure

      const isValid = csrfProtection.verifyToken(token, sessionId, maxAge)

      expect(isValid).toBe(true)
    })

    it('should reject invalid token format', () => {
      const sessionId = 'test-session-123'
      const invalidToken = 'invalid-token-format'

      const isValid = csrfProtection.verifyToken(invalidToken, sessionId)

      expect(isValid).toBe(false)
    })

    it('should reject malformed base64 token', () => {
      const sessionId = 'test-session-123'
      const malformedToken = 'not-base64-valid'

      const isValid = csrfProtection.verifyToken(malformedToken, sessionId)

      expect(isValid).toBe(false)
    })

    it('should use custom maxAge', () => {
      const sessionId = 'test-session-123'
      const token = csrfProtection.generateToken(sessionId)
      const customMaxAge = 1 // 1ms

      // Attendre que le token expire
      setTimeout(() => {
        const isValid = csrfProtection.verifyToken(
          token,
          sessionId,
          customMaxAge
        )
        expect(isValid).toBe(false)
      }, 2)
    })

    it('should reject token with invalid signature', () => {
      const sessionId = 'test-session-123'
      const token = csrfProtection.generateToken(sessionId)

      // Modifier le token pour avoir une signature invalide
      const modifiedToken = token.slice(0, -10) + 'invalid123'

      const isValid = csrfProtection.verifyToken(modifiedToken, sessionId)

      expect(isValid).toBe(false)
    })

    it('should handle token with missing parts', () => {
      const sessionId = 'test-session-123'
      const invalidToken = Buffer.from('incomplete:token').toString('base64')

      const isValid = csrfProtection.verifyToken(invalidToken, sessionId)

      expect(isValid).toBe(false)
    })

    it('should use JWT_SECRET as fallback when CSRF_SECRET is not set', () => {
      delete process.env.CSRF_SECRET
      process.env.JWT_SECRET = 'test-jwt-secret'

      // Re-require pour tester avec les nouvelles variables d'environnement
      jest.resetModules()
      const {
        csrfProtection: newCsrfProtection,
      } = require('../../middleware/csrf')

      const sessionId = 'test-session-123'
      const token = newCsrfProtection.generateToken(sessionId)
      const isValid = newCsrfProtection.verifyToken(token, sessionId)

      expect(isValid).toBe(true)
    })

    it('should use default secret when neither CSRF_SECRET nor JWT_SECRET is set', () => {
      delete process.env.CSRF_SECRET
      delete process.env.JWT_SECRET

      // Re-require pour tester avec les nouvelles variables d'environnement
      jest.resetModules()
      const {
        csrfProtection: newCsrfProtection,
      } = require('../../middleware/csrf')

      const sessionId = 'test-session-123'
      const token = newCsrfProtection.generateToken(sessionId)
      const isValid = newCsrfProtection.verifyToken(token, sessionId)

      expect(isValid).toBe(true)
    })
  })
})

describe('CSRF Middleware', () => {
  let req, res, next

  beforeEach(() => {
    req = {
      method: 'POST',
      path: '/api/test',
      headers: {},
      body: {},
      session: { id: 'test-session-123' },
      user: { userId: 1 },
    }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
    next = jest.fn()
    jest.clearAllMocks()
  })

  it('should allow GET requests without CSRF token', () => {
    req.method = 'GET'

    csrfMiddleware(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })

  it('should allow HEAD requests without CSRF token', () => {
    req.method = 'HEAD'

    csrfMiddleware(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })

  it('should allow OPTIONS requests without CSRF token', () => {
    req.method = 'OPTIONS'

    csrfMiddleware(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })

  it('should allow exempted paths without CSRF token', () => {
    req.path = '/api/auth/login'

    csrfMiddleware(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })

  it('should allow register path without CSRF token', () => {
    req.path = '/api/auth/register'

    csrfMiddleware(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })

  it('should allow RGPD export path without CSRF token', () => {
    req.path = '/api/rgpd/export'

    csrfMiddleware(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })

  it('should require CSRF token for POST requests', () => {
    csrfMiddleware(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({
      error: 'Token CSRF manquant',
      message: 'Un token CSRF est requis pour cette opération',
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('should require CSRF token for PUT requests', () => {
    req.method = 'PUT'

    csrfMiddleware(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({
      error: 'Token CSRF manquant',
      message: 'Un token CSRF est requis pour cette opération',
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('should require CSRF token for DELETE requests', () => {
    req.method = 'DELETE'

    csrfMiddleware(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({
      error: 'Token CSRF manquant',
      message: 'Un token CSRF est requis pour cette opération',
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('should accept valid CSRF token in header', () => {
    const token = csrfProtection.generateToken(req.session.id)
    req.headers['x-csrf-token'] = token

    csrfMiddleware(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })

  it('should accept valid CSRF token in body', () => {
    const token = csrfProtection.generateToken(req.session.id)
    req.body._csrf = token

    csrfMiddleware(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })

  it('should reject invalid CSRF token', () => {
    req.headers['x-csrf-token'] = 'invalid-token'

    csrfMiddleware(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({
      error: 'Token CSRF invalide',
      message: 'Le token CSRF est invalide ou expiré',
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('should use user ID as session ID when session not available', () => {
    req.session = null
    req.user = { userId: 1 }
    const token = csrfProtection.generateToken('1')
    req.headers['x-csrf-token'] = token

    csrfMiddleware(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })

  it('should require session or user ID', () => {
    req.session = null
    req.user = null

    csrfMiddleware(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({
      error: 'Token CSRF manquant',
      message: 'Un token CSRF est requis pour cette opération',
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('should prioritize header token over body token', () => {
    const token = csrfProtection.generateToken(req.session.id)
    req.headers['x-csrf-token'] = token
    req.body._csrf = 'invalid-token'

    csrfMiddleware(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })

  it('should reject expired CSRF token', () => {
    const token = csrfProtection.generateToken(req.session.id)
    req.headers['x-csrf-token'] = token

    // Attendre que le token expire (maxAge par défaut est 1h, mais on peut le tester avec un token très ancien)
    const oldToken = Buffer.from(
      `${req.session.id}:${Date.now() - 7200000}:signature`
    ).toString('base64')
    req.headers['x-csrf-token'] = oldToken

    csrfMiddleware(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({
      error: 'Token CSRF invalide',
      message: 'Le token CSRF est invalide ou expiré',
    })
    expect(next).not.toHaveBeenCalled()
  })
})
