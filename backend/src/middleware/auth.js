const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Middleware d'authentification JWT
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const bearer = authHeader && authHeader.split(' ')[1];
        const cookieToken = req.cookies && req.cookies.token;
        const token = bearer || cookieToken; // Priorité au Bearer, sinon cookie HttpOnly

        if (!token) {
            return res.status(401).json({ error: 'Token manquant' });
        }

        // Vérifier le token
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET non configuré. Variable d\'environnement requise.');
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Vérifier que l'utilisateur existe toujours
        const result = await query(
            'SELECT id, email, first_name, last_name FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                error: 'Utilisateur non trouvé',
                message: 'L\'utilisateur associé à ce token n\'existe plus'
            });
        }

        // Ajouter les informations utilisateur à la requête
        req.user = {
            userId: decoded.userId,
            email: decoded.email
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Token invalide',
                message: 'Le token d\'authentification est invalide'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expiré',
                message: 'Le token d\'authentification a expiré'
            });
        }

        next(error);
    }
};

// Middleware optionnel d'authentification (ne bloque pas si pas de token)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            if (!process.env.JWT_SECRET) {
                throw new Error('JWT_SECRET non configuré. Variable d\'environnement requise.');
            }
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const result = await query(
                'SELECT id, email, first_name, last_name FROM users WHERE id = $1',
                [decoded.userId]
            );

            if (result.rows.length > 0) {
                req.user = {
                    userId: decoded.userId,
                    email: decoded.email
                };
            }
        }

        next();
    } catch (error) {
        // En cas d'erreur, on continue sans authentification
        next();
    }
};

module.exports = {
    authenticateToken,
    optionalAuth
};
