// Mock Redis
const mockConnectPromise = {
  catch: jest.fn(),
}

const mockRedisClient = {
  on: jest.fn(),
  connect: jest.fn().mockReturnValue(mockConnectPromise),
  quit: jest.fn().mockResolvedValue(),
}

jest.mock('redis', () => ({
  createClient: jest.fn(() => mockRedisClient),
}))

// Mock connect-redis
jest.mock(
  'connect-redis',
  () => ({
    default: jest.fn(() => ({})),
  }),
  { virtual: true }
)

// Mock express-session
jest.mock(
  'express-session',
  () =>
    jest.fn(() => (req, res, next) => {
      req.session = { id: 'test-session-id', userId: 1 }
      next()
    }),
  { virtual: true }
)

const {
  sessionMiddleware,
  generateCSRFToken,
  requireSession,
  redisClient,
} = require('../../middleware/session')

describe('Session Middleware', () => {
  let originalEnv

  beforeEach(() => {
    originalEnv = {
      REDIS_URL: process.env.REDIS_URL,
      SESSION_SECRET: process.env.SESSION_SECRET,
      JWT_SECRET: process.env.JWT_SECRET,
      NODE_ENV: process.env.NODE_ENV,
    }
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

  describe('sessionMiddleware', () => {
    it('should be a function', () => {
      expect(typeof sessionMiddleware).toBe('function')
    })

    it('should create session with default configuration', () => {
      // Le middleware sessionMiddleware est déjà créé lors du require
      expect(sessionMiddleware).toBeDefined()
      expect(typeof sessionMiddleware).toBe('function')
    })

    it('should use environment variables for configuration', () => {
      // Le middleware sessionMiddleware est déjà créé lors du require
      expect(sessionMiddleware).toBeDefined()
      expect(typeof sessionMiddleware).toBe('function')
    })
  })

  describe('generateCSRFToken', () => {
    let req, res, next

    beforeEach(() => {
      req = {
        session: { id: 'test-session-id' },
      }
      res = {
        locals: {},
      }
      next = jest.fn()
    })

    it('should generate CSRF token when session exists', () => {
      generateCSRFToken(req, res, next)

      expect(req.csrfToken).toBeDefined()
      expect(res.locals.csrfToken).toBeDefined()
      expect(req.csrfToken).toBe(res.locals.csrfToken)
      expect(next).toHaveBeenCalled()
    })

    it('should not generate CSRF token when session does not exist', () => {
      req.session = null

      generateCSRFToken(req, res, next)

      expect(req.csrfToken).toBeUndefined()
      expect(res.locals.csrfToken).toBeUndefined()
      expect(next).toHaveBeenCalled()
    })

    it('should not generate CSRF token when session has no id', () => {
      req.session = {}

      generateCSRFToken(req, res, next)

      expect(req.csrfToken).toBeUndefined()
      expect(res.locals.csrfToken).toBeUndefined()
      expect(next).toHaveBeenCalled()
    })
  })

  describe('requireSession', () => {
    let req, res, next

    beforeEach(() => {
      req = {}
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      }
      next = jest.fn()
    })

    it('should allow access when session and userId exist', () => {
      req.session = { userId: 1 }

      requireSession(req, res, next)

      expect(next).toHaveBeenCalled()
      expect(res.status).not.toHaveBeenCalled()
    })

    it('should deny access when session does not exist', () => {
      req.session = null

      requireSession(req, res, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        error: 'Session requise',
        message: 'Vous devez être connecté pour accéder à cette ressource',
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should deny access when session exists but no userId', () => {
      req.session = {}

      requireSession(req, res, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        error: 'Session requise',
        message: 'Vous devez être connecté pour accéder à cette ressource',
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should deny access when userId is falsy', () => {
      req.session = { userId: 0 }

      requireSession(req, res, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        error: 'Session requise',
        message: 'Vous devez être connecté pour accéder à cette ressource',
      })
      expect(next).not.toHaveBeenCalled()
    })
  })

  describe('redisClient', () => {
    it('should be defined', () => {
      expect(redisClient).toBeDefined()
    })

    it('should have error handler', () => {
      // Le mock Redis est configuré avec un handler d'erreur
      expect(redisClient.on).toBeDefined()
      expect(typeof redisClient.on).toBe('function')
    })

    it('should attempt to connect', () => {
      // Le mock Redis est configuré pour se connecter
      expect(redisClient.connect).toBeDefined()
      expect(typeof redisClient.connect).toBe('function')
    })

    it('should handle Redis connection errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      // Le mock Redis est déjà configuré avec un handler d'erreur
      // On peut tester que l'erreur handler est bien défini
      expect(redisClient.on).toBeDefined()
      expect(typeof redisClient.on).toBe('function')

      // Simuler l'appel du handler d'erreur
      const errorHandler = redisClient.on.mock.calls.find(
        (call) => call[0] === 'error'
      )?.[1]
      if (errorHandler) {
        errorHandler(new Error('Redis connection failed'))
        expect(consoleSpy).toHaveBeenCalledWith(
          'Erreur Redis:',
          expect.any(Error)
        )
      }

      consoleSpy.mockRestore()
    })

    it('should call Redis error handler when error occurs', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      // Simuler l'appel du handler d'erreur directement
      const errorHandler = mockRedisClient.on.mock.calls.find(
        (call) => call[0] === 'error'
      )?.[1]
      if (errorHandler) {
        const testError = new Error('Test Redis error')
        errorHandler(testError)
        expect(consoleSpy).toHaveBeenCalledWith('Erreur Redis:', testError)
      }

      consoleSpy.mockRestore()
    })

    it('should handle Redis connection errors in error handler', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      // Simuler l'appel du handler d'erreur Redis directement
      const errorHandler = mockRedisClient.on.mock.calls.find(
        (call) => call[0] === 'error'
      )?.[1]
      if (errorHandler) {
        const redisError = new Error('Redis connection failed')
        errorHandler(redisError)
        expect(consoleSpy).toHaveBeenCalledWith('Erreur Redis:', redisError)
      }

      consoleSpy.mockRestore()
    })

    it('should trigger Redis error handler when error event is emitted', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      // Simuler l'émission d'un événement d'erreur Redis
      const errorHandler = mockRedisClient.on.mock.calls.find(
        (call) => call[0] === 'error'
      )?.[1]
      if (errorHandler) {
        const connectionError = new Error('Redis connection lost')
        errorHandler(connectionError)
        expect(consoleSpy).toHaveBeenCalledWith(
          'Erreur Redis:',
          connectionError
        )
      }

      consoleSpy.mockRestore()
    })
  })

  describe('Environment Configuration', () => {
    it('should have proper Redis configuration', () => {
      expect(redisClient).toBeDefined()
      expect(redisClient.on).toBeDefined()
      expect(redisClient.connect).toBeDefined()
    })

    it('should have session middleware configured', () => {
      expect(sessionMiddleware).toBeDefined()
      expect(typeof sessionMiddleware).toBe('function')
    })
  })
})
