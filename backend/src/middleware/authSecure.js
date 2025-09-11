const { query } = require('../config/database');
const { csrfProtection } = require('./csrf');

/**
 * Middleware d'authentification sécurisé avec cookies
 * Remplace le système JWT par des sessions sécurisées
 */
const authenticateSecure = async (req, res, next) => {
    try {
        // Vérifier la session
        if (!req.session || !req.session.userId) {
            return res.status(401).json({
                error: 'Non authentifié',
                message: 'Session invalide ou expirée'
            });
        }

        // Vérifier que l'utilisateur existe toujours
        const result = await query(
            'SELECT id, email, first_name, last_name, company_name FROM users WHERE id = $1',
            [req.session.userId]
        );

        if (result.rows.length === 0) {
            // Détruire la session si l'utilisateur n'existe plus
            req.session.destroy();
            return res.status(401).json({
                error: 'Utilisateur non trouvé',
                message: 'L\'utilisateur associé à cette session n\'existe plus'
            });
        }

        // Ajouter les informations utilisateur à la requête
        req.user = {
            userId: req.session.userId,
            email: result.rows[0].email,
            firstName: result.rows[0].first_name,
            lastName: result.rows[0].last_name,
            companyName: result.rows[0].company_name
        };

        next();
    } catch (error) {
        console.error('Erreur lors de l\'authentification sécurisée:', error);
        res.status(500).json({
            error: 'Erreur d\'authentification',
            message: 'Une erreur est survenue lors de la vérification de l\'authentification'
        });
    }
};

/**
 * Middleware d'authentification optionnel (ne bloque pas si pas de session)
 */
const optionalAuthSecure = async (req, res, next) => {
    try {
        if (req.session && req.session.userId) {
            const result = await query(
                'SELECT id, email, first_name, last_name, company_name FROM users WHERE id = $1',
                [req.session.userId]
            );

            if (result.rows.length > 0) {
                req.user = {
                    userId: req.session.userId,
                    email: result.rows[0].email,
                    firstName: result.rows[0].first_name,
                    lastName: result.rows[0].last_name,
                    companyName: result.rows[0].company_name
                };
            }
        }

        next();
    } catch (error) {
        // En cas d'erreur, on continue sans authentification
        next();
    }
};

/**
 * Middleware pour générer un token CSRF pour les requêtes
 */
const generateCSRFToken = (req, res, next) => {
    if (req.session && req.session.id) {
        req.csrfToken = csrfProtection.generateToken(req.session.id);
        res.locals.csrfToken = req.csrfToken;
    }
    next();
};

/**
 * Middleware pour vérifier le token CSRF
 */
const verifyCSRF = (req, res, next) => {
    // Routes exemptées
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    const exemptedPaths = ['/api/auth/login', '/api/auth/register', '/api/rgpd/export'];
    if (exemptedPaths.some(path => req.path.startsWith(path))) {
        return next();
    }

    const token = req.headers['x-csrf-token'] || req.body._csrf;
    const sessionId = req.session?.id;

    if (!token || !sessionId) {
        return res.status(403).json({
            error: 'Token CSRF manquant',
            message: 'Un token CSRF est requis pour cette opération'
        });
    }

    if (!csrfProtection.verifyToken(token, sessionId)) {
        return res.status(403).json({
            error: 'Token CSRF invalide',
            message: 'Le token CSRF est invalide ou expiré'
        });
    }

    next();
};

module.exports = {
    authenticateSecure,
    optionalAuthSecure,
    generateCSRFToken,
    verifyCSRF
};
