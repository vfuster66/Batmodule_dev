// Middleware de gestion d'erreurs global
const errorHandler = (err, req, res) => {
  console.error('❌ Erreur:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  })

  // Erreur de validation Joi
  if (err.isJoi) {
    return res.status(400).json({
      error: 'Données invalides',
      details: err.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      })),
    })
  }

  // Erreur de base de données
  if (err.code) {
    switch (err.code) {
      case '23505': // Violation de contrainte unique
        return res.status(409).json({
          error: 'Conflit de données',
          message: 'Cette ressource existe déjà',
        })
      case '23503': // Violation de clé étrangère
        return res.status(400).json({
          error: 'Référence invalide',
          message: "La ressource référencée n'existe pas",
        })
      case '23502': // Violation de contrainte NOT NULL
        return res.status(400).json({
          error: 'Données manquantes',
          message: 'Certains champs obligatoires sont manquants',
        })
      default:
        return res.status(500).json({
          error: 'Erreur de base de données',
          message: "Une erreur est survenue lors de l'accès aux données",
        })
    }
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token invalide',
      message: "Le token d'authentification est invalide",
    })
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expiré',
      message: "Le token d'authentification a expiré",
    })
  }

  // Erreur par défaut
  const statusCode = err.statusCode || 500
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Une erreur interne est survenue'
      : err.message

  res.status(statusCode).json({
    error: 'Erreur serveur',
    message: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  })
}

module.exports = { errorHandler }
