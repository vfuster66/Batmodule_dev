const express = require('express');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const { query } = require('../config/database');
const rateLimit = require('express-rate-limit');
const { authenticateSecure, optionalAuthSecure, generateCSRFToken, verifyCSRF } = require('../middleware/authSecure');

const router = express.Router();

// Rate limiting spécifique pour l'authentification
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limite les tentatives de connexion à 5 par IP
    message: {
        error: 'Trop de tentatives de connexion, veuillez réessayer plus tard.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Schémas de validation
const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    firstName: Joi.string().min(2).max(100).required(),
    lastName: Joi.string().min(2).max(100).required(),
    companyName: Joi.string().max(255).optional()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    rememberMe: Joi.boolean().optional()
});

const changePasswordSchema = Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required()
});

// POST /api/auth/register - Inscription d'un nouvel utilisateur
router.post('/register', authLimiter, async (req, res, next) => {
    try {
        const { error, value } = registerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: 'Données invalides',
                details: error.details.map(detail => detail.message)
            });
        }

        const { email, password, firstName, lastName, companyName } = value;

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                error: 'Email déjà utilisé',
                message: 'Un compte avec cet email existe déjà'
            });
        }

        // Hasher le mot de passe
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Créer l'utilisateur
        const result = await query(
            `INSERT INTO users (email, password_hash, first_name, last_name, company_name)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, email, first_name, last_name, company_name, created_at`,
            [email, passwordHash, firstName, lastName, companyName]
        );

        const user = result.rows[0];

        // Créer la session
        req.session.userId = user.id;
        req.session.email = user.email;
        req.session.regenerate((err) => {
            if (err) {
                console.error('Erreur lors de la régénération de session:', err);
                return res.status(500).json({
                    error: 'Erreur de session',
                    message: 'Erreur lors de la création de la session'
                });
            }

            res.status(201).json({
                message: 'Compte créé avec succès',
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    companyName: user.company_name,
                    createdAt: user.created_at
                }
            });
        });

    } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        next(error);
    }
});

// POST /api/auth/login - Connexion d'un utilisateur
router.post('/login', authLimiter, async (req, res, next) => {
    try {
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: 'Données invalides',
                details: error.details.map(detail => detail.message)
            });
        }

        const { email, password, rememberMe } = value;

        // Récupérer l'utilisateur
        const result = await query(
            'SELECT id, email, password_hash, first_name, last_name, company_name FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                error: 'Identifiants invalides',
                message: 'Email ou mot de passe incorrect'
            });
        }

        const user = result.rows[0];

        // Vérifier le mot de passe
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                error: 'Identifiants invalides',
                message: 'Email ou mot de passe incorrect'
            });
        }

        // Créer la session
        req.session.userId = user.id;
        req.session.email = user.email;

        // Régénérer la session pour la sécurité
        req.session.regenerate((err) => {
            if (err) {
                console.error('Erreur lors de la régénération de session:', err);
                return res.status(500).json({
                    error: 'Erreur de session',
                    message: 'Erreur lors de la création de la session'
                });
            }

            // Configurer la durée de session selon rememberMe
            if (rememberMe) {
                req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 jours
            } else {
                req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 24h
            }

            res.json({
                message: 'Connexion réussie',
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    companyName: user.company_name
                }
            });
        });

    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        next(error);
    }
});

// POST /api/auth/logout - Déconnexion
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Erreur lors de la déconnexion:', err);
            return res.status(500).json({
                error: 'Erreur de déconnexion',
                message: 'Erreur lors de la suppression de la session'
            });
        }

        res.clearCookie('batmodule.sid');
        res.json({
            message: 'Déconnexion réussie'
        });
    });
});

// GET /api/auth/me - Récupérer les informations de l'utilisateur connecté
router.get('/me', authenticateSecure, (req, res) => {
    res.json({
        user: {
            id: req.user.userId,
            email: req.user.email,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            companyName: req.user.companyName
        }
    });
});

// GET /api/auth/csrf - Récupérer le token CSRF
router.get('/csrf', generateCSRFToken, (req, res) => {
    res.json({
        csrfToken: req.csrfToken
    });
});

// PUT /api/auth/change-password - Changer le mot de passe
router.put('/change-password', authenticateSecure, verifyCSRF, async (req, res, next) => {
    try {
        const { error, value } = changePasswordSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: 'Données invalides',
                details: error.details.map(detail => detail.message)
            });
        }

        const { currentPassword, newPassword } = value;

        // Récupérer le hash actuel
        const result = await query(
            'SELECT password_hash FROM users WHERE id = $1',
            [req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Utilisateur non trouvé'
            });
        }

        const currentHash = result.rows[0].password_hash;

        // Vérifier le mot de passe actuel
        const isValidPassword = await bcrypt.compare(currentPassword, currentHash);
        if (!isValidPassword) {
            return res.status(401).json({
                error: 'Mot de passe actuel incorrect'
            });
        }

        // Hasher le nouveau mot de passe
        const saltRounds = 12;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

        // Mettre à jour le mot de passe
        await query(
            'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [newPasswordHash, req.user.userId]
        );

        res.json({
            message: 'Mot de passe modifié avec succès'
        });

    } catch (error) {
        console.error('Erreur lors du changement de mot de passe:', error);
        next(error);
    }
});

// DELETE /api/auth/account - Supprimer le compte
router.delete('/account', authenticateSecure, verifyCSRF, async (req, res, next) => {
    try {
        const { confirm } = req.body;

        if (!confirm) {
            return res.status(400).json({
                error: 'Confirmation requise',
                message: 'Vous devez confirmer la suppression de votre compte'
            });
        }

        // Supprimer l'utilisateur (cascade supprimera les données liées)
        await query('DELETE FROM users WHERE id = $1', [req.user.userId]);

        // Détruire la session
        req.session.destroy((err) => {
            if (err) {
                console.error('Erreur lors de la suppression de session:', err);
            }

            res.clearCookie('batmodule.sid');
            res.json({
                message: 'Compte supprimé avec succès'
            });
        });

    } catch (error) {
        console.error('Erreur lors de la suppression du compte:', error);
        next(error);
    }
});

module.exports = router;
