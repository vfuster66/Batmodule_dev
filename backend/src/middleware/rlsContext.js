const { query } = require('../config/database');

/**
 * Middleware pour définir le contexte utilisateur RLS
 * Doit être appelé avant chaque requête authentifiée
 */
const setRLSContext = async (req, res, next) => {
    try {
        // Si l'utilisateur est authentifié, définir le contexte RLS
        if (req.user && req.user.userId) {
            await query('SELECT set_user_context($1)', [req.user.userId]);
            console.log(`[RLS] Contexte utilisateur défini: ${req.user.userId}`);
        }
        next();
    } catch (error) {
        console.error('Erreur lors de la définition du contexte RLS:', error);
        next(error);
    }
};

/**
 * Middleware pour nettoyer le contexte utilisateur RLS
 * Doit être appelé après chaque requête
 */
const clearRLSContext = async (req, res, next) => {
    try {
        // Nettoyer le contexte RLS
        await query('SELECT set_user_context(NULL::uuid)');
        console.log('[RLS] Contexte utilisateur nettoyé');
        next();
    } catch (error) {
        console.error('Erreur lors du nettoyage du contexte RLS:', error);
        next(error);
    }
};

/**
 * Wrapper pour les requêtes avec contexte RLS automatique
 * @param {string} text - Requête SQL
 * @param {Array} params - Paramètres
 * @param {string} userId - ID utilisateur
 * @returns {Object} - Résultat de la requête
 */
const queryWithRLS = async (text, params, userId) => {
    try {
        // Définir le contexte utilisateur
        if (userId) {
            await query('SELECT set_user_context($1)', [userId]);
        }

        // Exécuter la requête
        const result = await query(text, params);

        // Nettoyer le contexte
        if (userId) {
            await query('SELECT set_user_context(NULL::uuid)');
        }

        return result;
    } catch (error) {
        // Nettoyer le contexte en cas d'erreur
        if (userId) {
            try {
                await query('SELECT set_user_context(NULL::uuid)');
            } catch (cleanupError) {
                console.error('Erreur lors du nettoyage RLS:', cleanupError);
            }
        }
        throw error;
    }
};

/**
 * Wrapper pour les transactions avec contexte RLS automatique
 * @param {Function} callback - Fonction de transaction
 * @param {string} userId - ID utilisateur
 * @returns {Object} - Résultat de la transaction
 */
const transactionWithRLS = async (callback, userId) => {
    const { transaction } = require('../config/database');

    try {
        // Définir le contexte utilisateur
        if (userId) {
            await query('SELECT set_user_context($1)', [userId]);
        }

        // Exécuter la transaction
        const result = await transaction(callback);

        // Nettoyer le contexte
        if (userId) {
            await query('SELECT set_user_context(NULL::uuid)');
        }

        return result;
    } catch (error) {
        // Nettoyer le contexte en cas d'erreur
        if (userId) {
            try {
                await query('SELECT set_user_context(NULL::uuid)');
            } catch (cleanupError) {
                console.error('Erreur lors du nettoyage RLS:', cleanupError);
            }
        }
        throw error;
    }
};

module.exports = {
    setRLSContext,
    clearRLSContext,
    queryWithRLS,
    transactionWithRLS
};
