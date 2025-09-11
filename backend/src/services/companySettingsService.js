const { query, transaction } = require('../config/database');

class CompanySettingsService {
    /**
     * Récupère les paramètres de l'entreprise
     * @param {string} userId - ID de l'utilisateur
     * @returns {Object} - Paramètres de l'entreprise
     */
    async getSettings(userId, createDefault = true) {
        try {
            const result = await query(
                'SELECT * FROM company_settings WHERE user_id = $1',
                [userId]
            );

            if (result.rows.length === 0) {
                if (createDefault) {
                    // Créer des paramètres par défaut
                    return await this.createDefaultSettings(userId);
                } else {
                    return null;
                }
            }

            return result.rows[0];
        } catch (error) {
            console.error('Erreur lors de la récupération des paramètres:', error);
            throw new Error('Échec de la récupération des paramètres');
        }
    }

    /**
     * Crée des paramètres par défaut
     * @param {string} userId - ID de l'utilisateur
     * @returns {Object} - Paramètres par défaut créés
     */
    async createDefaultSettings(userId, initialData = {}) {
        try {
            const defaultSettings = {
                user_id: userId,
                company_name: initialData.company_name || 'Mon Entreprise',
                primary_color: '#004AAD',
                secondary_color: '#6B7280',
                default_vat_rate: 20.00,
                currency: 'EUR',
                payment_terms: 30,
                quote_prefix: 'DEV',
                invoice_prefix: 'FAC',
                show_vat: true,
                show_logo_on_documents: true,
                country: 'France',
                // Champs alimentés depuis l'inscription si disponibles
                address_line1: initialData.address_line1 || null,
                phone: initialData.phone || null,
                email: initialData.email || null
            };

            // Insère si absent, ignore si déjà présent (conflit sur user_id)
            const result = await query(
                `INSERT INTO company_settings (
                    user_id, company_name, primary_color, secondary_color,
                    default_vat_rate, currency, payment_terms, quote_prefix,
                    invoice_prefix, show_vat, show_logo_on_documents, country,
                    address_line1, phone, email
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                ON CONFLICT (user_id) DO UPDATE SET
                    updated_at = CURRENT_TIMESTAMP
                RETURNING *`,
                [
                    defaultSettings.user_id, defaultSettings.company_name,
                    defaultSettings.primary_color, defaultSettings.secondary_color,
                    defaultSettings.default_vat_rate, defaultSettings.currency,
                    defaultSettings.payment_terms, defaultSettings.quote_prefix,
                    defaultSettings.invoice_prefix, defaultSettings.show_vat,
                    defaultSettings.show_logo_on_documents, defaultSettings.country,
                    defaultSettings.address_line1, defaultSettings.phone, defaultSettings.email
                ]
            );

            return result.rows[0];
        } catch (error) {
            console.error('Erreur lors de la création des paramètres par défaut:', error);
            throw new Error('Échec de la création des paramètres par défaut');
        }
    }

    /**
     * Met à jour les paramètres de l'entreprise
     * @param {string} userId - ID de l'utilisateur
     * @param {Object} updateData - Données à mettre à jour
     * @returns {Object} - Paramètres mis à jour
     */
    async updateSettings(userId, updateData) {
        try {
            const fields = [];
            const values = [];
            let paramCount = 1;

            // Construire dynamiquement la requête UPDATE
            Object.keys(updateData).forEach(key => {
                if (updateData[key] !== undefined) {
                    fields.push(`${key} = $${paramCount}`);
                    // Convertir les chaînes vides en null pour éviter les erreurs de validation
                    const value = updateData[key] === '' ? null : updateData[key];

                    // Tronquer les valeurs trop longues pour éviter les erreurs 500
                    let processedValue = value;
                    if (typeof value === 'string') {
                        // Limites de longueur par champ
                        const fieldLimits = {
                            'phone': 20,
                            'vat_number': 20,
                            'rcs_number': 20,
                            'tva_intracommunautaire': 20
                        };

                        const limit = fieldLimits[key];
                        if (limit && value.length > limit) {
                            console.log(`⚠️  Champ ${key} tronqué: ${value.length} → ${limit} caractères`);
                            processedValue = value.substring(0, limit);
                        }
                    }

                    values.push(processedValue);
                    paramCount++;
                }
            });

            if (fields.length === 0) {
                throw new Error('Aucune donnée à mettre à jour');
            }

            fields.push(`updated_at = CURRENT_TIMESTAMP`);
            values.push(userId);


            const result = await query(
                `UPDATE company_settings 
                 SET ${fields.join(', ')}
                 WHERE user_id = $${paramCount}
                 RETURNING *`,
                values
            );

            if (result.rows.length === 0) {
                throw new Error('Paramètres non trouvés');
            }

            return result.rows[0];
        } catch (error) {
            console.error('Erreur lors de la mise à jour des paramètres:', error);
            throw error;
        }
    }

    /**
     * Valide les paramètres obligatoires
     * @param {Object} settings - Paramètres à valider
     * @returns {Object} - Résultat de la validation
     */
    validateRequiredSettings(settings) {
        const errors = [];
        const warnings = [];

        // Champs obligatoires pour la conformité légale
        const requiredFields = [
            'company_name',
            'siret',
            'forme_juridique',
            'address_line1',
            'postal_code',
            'city',
            'phone',
            'email'
        ];

        requiredFields.forEach(field => {
            if (!settings[field] || settings[field].toString().trim() === '') {
                errors.push(`Le champ ${field} est obligatoire`);
            }
        });

        // Validation SIRET
        if (settings.siret && !this.validateSIRET(settings.siret)) {
            errors.push('Le SIRET est invalide');
        }

        // Validation email
        if (settings.email && !this.validateEmail(settings.email)) {
            errors.push('L\'adresse email est invalide');
        }

        // Validation téléphone
        if (settings.phone && !this.validatePhone(settings.phone)) {
            warnings.push('Le format du téléphone pourrait être amélioré');
        }

        // Validation IBAN
        if (settings.iban && !this.validateIBAN(settings.iban)) {
            warnings.push('Le format de l\'IBAN pourrait être incorrect');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Valide un SIRET
     * @param {string} siret - SIRET à valider
     * @returns {boolean} - SIRET valide
     */
    validateSIRET(siret) {
        if (!siret || siret.length !== 14) return false;
        if (!/^\d{14}$/.test(siret)) return false;

        // Algorithme de Luhn
        let sum = 0;
        for (let i = 0; i < 13; i++) {
            let digit = parseInt(siret[i]);
            if (i % 2 === 1) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }
            sum += digit;
        }

        return (10 - (sum % 10)) % 10 === parseInt(siret[13]);
    }

    /**
     * Valide un email
     * @param {string} email - Email à valider
     * @returns {boolean} - Email valide
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Valide un téléphone
     * @param {string} phone - Téléphone à valider
     * @returns {boolean} - Téléphone valide
     */
    validatePhone(phone) {
        const phoneRegex = /^(?:\+33|0)[1-9](?:[0-9]{8})$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    /**
     * Valide un IBAN
     * @param {string} iban - IBAN à valider
     * @returns {boolean} - IBAN valide
     */
    validateIBAN(iban) {
        if (!iban || iban.length < 15) return false;

        // Format basique pour la France
        const ibanRegex = /^FR\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{2}$/;
        return ibanRegex.test(iban);
    }

    /**
     * Génère un rapport de conformité
     * @param {string} userId - ID de l'utilisateur
     * @returns {Object} - Rapport de conformité
     */
    async generateComplianceReport(userId) {
        try {
            const settings = await this.getSettings(userId);
            const validation = this.validateRequiredSettings(settings);

            const report = {
                userId,
                settings,
                validation,
                compliance: {
                    legal: validation.isValid,
                    score: this.calculateComplianceScore(settings),
                    missingFields: this.getMissingFields(settings),
                    recommendations: this.getRecommendations(settings)
                }
            };

            return report;
        } catch (error) {
            console.error('Erreur lors de la génération du rapport de conformité:', error);
            throw new Error('Échec de la génération du rapport de conformité');
        }
    }

    /**
     * Calcule le score de conformité
     * @param {Object} settings - Paramètres
     * @returns {number} - Score de conformité (0-100)
     */
    calculateComplianceScore(settings) {
        let score = 0;
        const maxScore = 100;

        // Champs obligatoires (60 points)
        const requiredFields = [
            'company_name', 'siret', 'forme_juridique', 'address_line1',
            'postal_code', 'city', 'phone', 'email'
        ];

        const requiredScore = (requiredFields.filter(field => settings[field]).length / requiredFields.length) * 60;
        score += requiredScore;

        // Champs légaux (25 points)
        const legalFields = [
            'rcs_number', 'tribunal_commercial', 'tva_intracommunautaire',
            'ape_code', 'insurance_company', 'insurance_policy_number'
        ];

        const legalScore = (legalFields.filter(field => settings[field]).length / legalFields.length) * 25;
        score += legalScore;

        // Champs bancaires (15 points)
        const bankFields = ['iban', 'bic', 'bank_name'];
        const bankScore = (bankFields.filter(field => settings[field]).length / bankFields.length) * 15;
        score += bankScore;

        return Math.round(score);
    }

    /**
     * Récupère les champs manquants
     * @param {Object} settings - Paramètres
     * @returns {Array} - Champs manquants
     */
    getMissingFields(settings) {
        const requiredFields = [
            'company_name', 'siret', 'forme_juridique', 'address_line1',
            'postal_code', 'city', 'phone', 'email'
        ];

        return requiredFields.filter(field => !settings[field]);
    }

    /**
     * Génère des recommandations
     * @param {Object} settings - Paramètres
     * @returns {Array} - Recommandations
     */
    getRecommendations(settings) {
        const recommendations = [];

        if (!settings.siret) {
            recommendations.push('Ajoutez votre SIRET pour la conformité légale');
        }

        if (!settings.insurance_company) {
            recommendations.push('Configurez votre assurance décennale obligatoire');
        }

        if (!settings.iban) {
            recommendations.push('Ajoutez vos coordonnées bancaires pour les paiements');
        }

        if (!settings.mediator_name && settings.is_b2c) {
            recommendations.push('Configurez le médiateur de la consommation pour le B2C');
        }

        return recommendations;
    }
}

module.exports = new CompanySettingsService();
