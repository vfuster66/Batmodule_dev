const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const cookieParser = require('cookie-parser')
const { errorHandler } = require('./middleware/errorHandler')
// const { setRLSContext, clearRLSContext } = require('./middleware/rlsContext') // Temporairement désactivé
const authRoutes = require('./routes/auth')
const clientsRoutes = require('./routes/clients')
const servicesRoutes = require('./routes/services')
const quotesRoutes = require('./routes/quotes')
const invoicesRoutes = require('./routes/invoices')
const dashboardRoutes = require('./routes/dashboard')
const notificationsRoutes = require('./routes/notifications')
const creditsRoutes = require('./routes/credits')
const rgpdRoutes = require('./routes/rgpd')
const btpRoutes = require('./routes/btp')
const insuranceRoutes = require('./routes/insurance')
const certificationRoutes = require('./routes/certifications')
const wasteRoutes = require('./routes/waste')
const complianceRoutes = require('./routes/compliance')
const accountingRoutes = require('./routes/accounting')
const companySettingsRoutes = require('./routes/companySettings')
const publicLegalRoutes = require('./routes/publicLegal')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3001

// Configuration de la base de données (pool non utilisé dans ce fichier)

// Configuration de sécurité
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
)

// Configuration CORS
const corsOptions = {
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // Plus permissif en développement
  message: {
    error: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting pour certaines routes en développement
  skip: (req) => {
    if (process.env.NODE_ENV === 'development') {
      // Skip pour les routes de company-settings en développement
      return req.path.includes('/company-settings')
    }
    return false
  },
})

// authLimiter non utilisé dans ce fichier

// Middleware
app.use(cors(corsOptions))
// Appliquer le rate limiter seulement si pas en développement ou pas sur company-settings
if (process.env.NODE_ENV !== 'development') {
  app.use(limiter)
} else {
  // En développement, appliquer un rate limiter plus permissif
  const devLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Très permissif en développement
    message: {
      error: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  })
  app.use(devLimiter)
}
app.use(express.json({ limit: '10mb' })) // Augmenter la limite pour les logos en base64
app.use(express.urlencoded({ limit: '10mb', extended: true }))
app.use(cookieParser())

// Middleware d'authentification (importé depuis middleware/auth.js)

// Routes de base
app.get('/', (req, res) => {
  res.json({
    message: 'BatModule API - Application pour artisans du bâtiment',
    version: '1.0.0',
    status: 'running',
  })
})

// Route de santé
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'BatModule API',
    version: '1.0.0',
  })
})

// Routes d'authentification (déplacées vers routes/auth.js)
app.use('/api/auth', authRoutes)

// Middleware RLS activé pour la sécurité multi-tenant
const { setRLSContext, clearRLSContext } = require('./middleware/rlsContext')

app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/auth')) {
    return next()
  }

  if (req.user && req.user.userId) {
    setRLSContext(req, res, next)
  } else {
    next()
  }
})

app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/auth')) {
    return next()
  }

  res.on('finish', () => {
    if (req.user && req.user.userId) {
      clearRLSContext(req, res, () => {})
    }
  })
  next()
})

// Routes legacy supprimées: /api/company/settings (GET, PUT)
// Utiliser les routes modulaires: app.use('/api/company-settings', require('./routes/companySettings'))

// Middleware de gestion d'erreurs global
app.use(errorHandler)

// ===== ROUTES POUR LA GESTION DES CLIENTS =====
// Utiliser les routes clients depuis routes/clients.js
app.use('/api/clients', clientsRoutes)
app.use('/api/services', servicesRoutes)
app.use('/api/quotes', quotesRoutes)
app.use('/api/invoices', invoicesRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/notifications', notificationsRoutes)
app.use('/api/credits', creditsRoutes)
app.use('/api/rgpd', rgpdRoutes)
app.use('/api/btp', btpRoutes)
app.use('/api/insurance', insuranceRoutes)
app.use('/api/certifications', certificationRoutes)
app.use('/api/waste', wasteRoutes)
app.use('/api/compliance', complianceRoutes)
app.use('/api/accounting', accountingRoutes)
app.use('/api/company-settings', companySettingsRoutes)

// Routes publiques (sans authentification)
app.use('/api/public/legal', publicLegalRoutes)

// Démarrage du serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur BatModule démarré sur le port ${PORT}`)
  console.log(`📊 Environnement: ${process.env.NODE_ENV || 'development'}`)
  console.log(
    `🔐 JWT Secret: ${process.env.JWT_SECRET ? 'Configuré' : 'Non configuré'}`
  )
})
