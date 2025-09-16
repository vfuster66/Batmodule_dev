const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Joi = require('joi')
const { query } = require('../config/database')
const rateLimit = require('express-rate-limit')

const router = express.Router()

// S'assurer des colonnes optionnelles
async function ensureUserOptionalColumns() {
  try {
    await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_base64 TEXT')
    // Colonne phone existe déjà dans le schéma, on la laisse
  } catch (_) {
    /* no-op */
  }
}

// Rate limiting spécifique pour l'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limite les tentatives de connexion à 5 par IP
  message: {
    error: 'Trop de tentatives de connexion, veuillez réessayer plus tard.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Schémas de validation
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().min(2).max(100).required(),
  lastName: Joi.string().min(2).max(100).required(),
  companyName: Joi.string().max(255).optional(),
  phone: Joi.string().max(20).optional(),
  address: Joi.string().max(500).optional(),
})

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
})

// POST /api/auth/register - Inscription d'un nouvel utilisateur
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    await ensureUserOptionalColumns()
    const { error, value } = registerSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Données invalides',
        details: error.details.map((detail) => detail.message),
      })
    }

    const {
      email,
      password,
      firstName,
      lastName,
      companyName,
      phone,
      address,
    } = value

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [
      email,
    ])

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'Un utilisateur avec cet email existe déjà',
      })
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12)

    // Créer l'utilisateur
    const result = await query(
      'INSERT INTO users (email, password_hash, first_name, last_name, company_name, phone, address) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, email, first_name, last_name, phone, avatar_base64',
      [email, hashedPassword, firstName, lastName, companyName, phone, address]
    )

    const user = result.rows[0]

    // Pré-remplir company_settings avec les infos d'inscription (best effort)
    try {
      const {
        createDefaultSettings,
      } = require('../services/companySettingsService')
      await createDefaultSettings(user.id, {
        company_name: companyName || null,
        address_line1: address || null,
        phone: phone || null,
        email: email,
      })
    } catch (_) {
      /* ne bloque pas l'inscription */
    }

    // Générer le token JWT
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        error: 'Configuration manquante',
        message: "JWT_SECRET non configuré. Variable d'environnement requise.",
      })
    }
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Définir un cookie HttpOnly + Secure en prod
    const isProd = process.env.NODE_ENV === 'production'
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'lax' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        avatar: user.avatar_base64,
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/auth/login - Connexion d'un utilisateur
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    await ensureUserOptionalColumns()
    const { error, value } = loginSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Données invalides',
        details: error.details.map((detail) => detail.message),
      })
    }

    const { email, password } = value

    // Récupérer l'utilisateur
    const result = await query(
      'SELECT id, email, password_hash, first_name, last_name, phone, avatar_base64 FROM users WHERE email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Email ou mot de passe incorrect',
      })
    }

    const user = result.rows[0]

    // Vérifier le mot de passe (gérer les comptes anciens/incomplets)
    if (!user.password_hash || typeof user.password_hash !== 'string') {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' })
    }
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Email ou mot de passe incorrect',
      })
    }

    // Générer le token JWT
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        error: 'Configuration manquante',
        message: "JWT_SECRET non configuré. Variable d'environnement requise.",
      })
    }
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    const isProd = process.env.NODE_ENV === 'production'
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'lax' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    res.json({
      message: 'Connexion réussie',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        avatar: user.avatar_base64,
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/auth/me - Récupérer les informations de l'utilisateur connecté
router.get('/me', async (req, res, next) => {
  try {
    await ensureUserOptionalColumns()
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({ error: "Token d'accès requis" })
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        error: 'Configuration manquante',
        message: "JWT_SECRET non configuré. Variable d'environnement requise.",
      })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const result = await query(
      'SELECT id, email, first_name, last_name, phone, avatar_base64 FROM users WHERE id = $1',
      [decoded.userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }

    const user = result.rows[0]
    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        avatar: user.avatar_base64,
      },
    })
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Token invalide' })
    }
    next(error)
  }
})

// PUT /api/auth/profile - Mettre à jour profil (dont avatar)
router.put('/profile', async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (!token) {
      return res.status(401).json({ error: "Token d'accès requis" })
    }
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        error: 'Configuration manquante',
        message: "JWT_SECRET non configuré. Variable d'environnement requise.",
      })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const { firstName, lastName, email, phone, avatar } = req.body || {}

    // S'assurer que la colonne avatar existe
    await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_base64 TEXT')

    // Mettre à jour les champs autorisés
    const result = await query(
      `UPDATE users
             SET first_name = COALESCE($1, first_name),
                 last_name = COALESCE($2, last_name),
                 email = COALESCE($3, email),
                 phone = COALESCE($4, phone),
                 avatar_base64 = COALESCE($5, avatar_base64),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $6
             RETURNING id, email, first_name, last_name, phone, avatar_base64`,
      [firstName, lastName, email, phone, avatar, decoded.userId]
    )

    const user = result.rows[0]
    res.json({
      message: 'Profil mis à jour avec succès',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        avatar: user.avatar_base64,
      },
    })
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Token invalide' })
    }
    next(error)
  }
})

module.exports = router
