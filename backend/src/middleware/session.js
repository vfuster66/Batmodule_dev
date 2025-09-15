const session = require('express-session')
const RedisStore = require('connect-redis').default
const redis = require('redis')

// Configuration Redis pour les sessions
const redisClient = redis.createClient({
  url:
    process.env.REDIS_URL ||
    /* istanbul ignore next */ 'redis://localhost:6379',
})

// istanbul ignore next
redisClient.on('error', (err) => {
  console.error('Erreur Redis:', err)
})

redisClient.connect().catch(console.error)

const redisStore = new RedisStore({
  client: redisClient,
  prefix: 'batmodule:session:',
})

/**
 * Configuration des sessions sécurisées
 */
const sessionConfig = {
  store: redisStore,
  secret:
    process.env.SESSION_SECRET ||
    process.env.JWT_SECRET ||
    /* istanbul ignore next */ 'session-secret-key',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: process.env.NODE_ENV === /* istanbul ignore next */ 'production', // HTTPS en production
    httpOnly: true, // Protection XSS
    maxAge: 24 * 60 * 60 * 1000, // 24h
    sameSite: 'lax', // Protection CSRF
  },
  name: 'batmodule.sid', // Nom de cookie personnalisé
}

/**
 * Middleware de session
 */
const sessionMiddleware = session(sessionConfig)

/**
 * Middleware pour générer un token CSRF
 */
const generateCSRFToken = (req, res, next) => {
  if (req.session && req.session.id) {
    const { csrfProtection } = require('./csrf')
    req.csrfToken = csrfProtection.generateToken(req.session.id)
    res.locals.csrfToken = req.csrfToken
  }
  next()
}

/**
 * Middleware pour vérifier la session utilisateur
 */
const requireSession = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      error: 'Session requise',
      message: 'Vous devez être connecté pour accéder à cette ressource',
    })
  }
  next()
}

module.exports = {
  sessionMiddleware,
  generateCSRFToken,
  requireSession,
  redisClient,
}
