const crypto = require('crypto')

class CSRFProtection {
  constructor() {
    this.secret =
      process.env.CSRF_SECRET || process.env.JWT_SECRET || 'csrf-secret-key'
  }

  /**
   * Génère un token CSRF
   * @param {string} sessionId - ID de session
   * @returns {string} - Token CSRF
   */
  generateToken(sessionId) {
    const timestamp = Date.now()
    const data = `${sessionId}:${timestamp}`
    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(data)
      .digest('hex')

    return Buffer.from(`${data}:${signature}`).toString('base64')
  }

  /**
   * Vérifie un token CSRF
   * @param {string} token - Token à vérifier
   * @param {string} sessionId - ID de session
   * @param {number} maxAge - Âge maximum en ms (défaut: 1h)
   * @returns {boolean} - Token valide
   */
  verifyToken(token, sessionId, maxAge = 3600000) {
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf8')
      const parts = decoded.split(':')
      if (parts.length !== 3) {
        return false
      }
      const [tokenSessionId, timestamp, signature] = parts

      // Vérifier l'âge du token
      if (Date.now() - parseInt(timestamp) > maxAge) {
        return false
      }

      // Vérifier la session
      if (tokenSessionId !== sessionId) {
        return false
      }

      // Vérifier la signature
      const data = `${tokenSessionId}:${timestamp}`
      const expectedSignature = crypto
        .createHmac('sha256', this.secret)
        .update(data)
        .digest('hex')

      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      )
    } catch (error) {
      return false
    }
  }
}

const csrfProtection = new CSRFProtection()

/**
 * Middleware CSRF pour les routes sensibles
 */
const csrfMiddleware = (req, res, next) => {
  // Routes exemptées (GET, HEAD, OPTIONS)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next()
  }

  // Routes exemptées (authentification, RGPD)
  const exemptedPaths = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/rgpd/export',
  ]
  if (exemptedPaths.some((path) => req.path.startsWith(path))) {
    return next()
  }

  const token = req.headers['x-csrf-token'] || req.body._csrf
  const sessionId = req.session?.id || String(req.user?.userId)

  if (!token || !sessionId) {
    return res.status(403).json({
      error: 'Token CSRF manquant',
      message: 'Un token CSRF est requis pour cette opération',
    })
  }

  if (!csrfProtection.verifyToken(token, sessionId)) {
    return res.status(403).json({
      error: 'Token CSRF invalide',
      message: 'Le token CSRF est invalide ou expiré',
    })
  }

  next()
}

module.exports = {
  csrfProtection,
  csrfMiddleware,
}
