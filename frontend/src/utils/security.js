// Utilitaires de sécurité pour masquer les données sensibles

/**
 * Masque les données sensibles dans les logs
 * @param {string} message - Message à filtrer
 * @returns {string} Message filtré
 */
export const sanitizeLogMessage = (message) => {
  if (typeof message !== 'string') return message

  // Masquer les emails
  message = message.replace(
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    '[EMAIL_MASQUÉ]'
  )

  // Masquer les mots de passe
  message = message.replace(
    /password["\s]*[:=]["\s]*[^"\s,}]+/gi,
    'password: [MASQUÉ]'
  )

  // Masquer les tokens
  message = message.replace(
    /token["\s]*[:=]["\s]*[^"\s,}]+/gi,
    'token: [MASQUÉ]'
  )

  // Masquer les clés API
  message = message.replace(
    /api[_-]?key["\s]*[:=]["\s]*[^"\s,}]+/gi,
    'api_key: [MASQUÉ]'
  )

  return message
}

/**
 * Vérifie si une URL contient des données sensibles
 * @param {string} url - URL à vérifier
 * @returns {boolean} True si l'URL contient des données sensibles
 */
export const isSensitiveUrl = (url) => {
  const sensitivePaths = [
    '/auth/login',
    '/auth/register',
    '/auth/password',
    '/auth/reset',
    '/profile/password',
    '/settings/security',
  ]

  return sensitivePaths.some((path) => url.includes(path))
}

/**
 * Masque les données sensibles dans un objet
 * @param {object} obj - Objet à nettoyer
 * @returns {object} Objet nettoyé
 */
export const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj

  const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'key']
  const sanitized = { ...obj }

  sensitiveKeys.forEach((key) => {
    if (sanitized[key]) {
      sanitized[key] = '[MASQUÉ]'
    }
  })

  return sanitized
}

/**
 * Configure la console pour masquer les données sensibles en production
 */
export const configureSecureConsole = () => {
  if (import.meta.env.PROD && typeof window !== 'undefined') {
    const originalLog = console.log
    const originalError = console.error
    const originalWarn = console.warn

    console.log = (...args) => {
      const sanitized = args.map((arg) =>
        typeof arg === 'string'
          ? sanitizeLogMessage(arg)
          : typeof arg === 'object'
            ? sanitizeObject(arg)
            : arg
      )
      originalLog.apply(console, sanitized)
    }

    console.error = (...args) => {
      const sanitized = args.map((arg) =>
        typeof arg === 'string'
          ? sanitizeLogMessage(arg)
          : typeof arg === 'object'
            ? sanitizeObject(arg)
            : arg
      )
      originalError.apply(console, sanitized)
    }

    console.warn = (...args) => {
      const sanitized = args.map((arg) =>
        typeof arg === 'string'
          ? sanitizeLogMessage(arg)
          : typeof arg === 'object'
            ? sanitizeObject(arg)
            : arg
      )
      originalWarn.apply(console, sanitized)
    }
  }
}
