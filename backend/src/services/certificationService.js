const { query, transaction } = require('../config/database');

class CertificationService {
    /**
     * Récupère toutes les certifications d'un utilisateur
     * @param {string} userId - ID de l'utilisateur
     * @param {string} type - Type de certification (optionnel)
     * @returns {Array} - Liste des certifications
     */
    async getCertifications(userId, type = null) {
        try {
            let whereClause = 'WHERE user_id = $1';
            let params = [userId];

            if (type) {
                whereClause += ' AND certification_type = $2';
                params.push(type);
            }

            const result = await query(
                `SELECT * FROM certifications 
                 ${whereClause}
                 ORDER BY end_date DESC, created_at DESC`,
                params
            );

            return result.rows;
        } catch (error) {
            console.error('Erreur lors de la récupération des certifications:', error);
            throw new Error('Échec de la récupération des certifications');
        }
    }

    /**
     * Récupère une certification par ID
     * @param {string} certificationId - ID de la certification
     * @param {string} userId - ID de l'utilisateur
     * @returns {Object} - Certification
     */
    async getCertificationById(certificationId, userId) {
        try {
            const result = await query(
                'SELECT * FROM certifications WHERE id = $1 AND user_id = $2',
                [certificationId, userId]
            );

            if (result.rows.length === 0) {
                throw new Error('Certification non trouvée');
            }

            return result.rows[0];
        } catch (error) {
            console.error('Erreur lors de la récupération de la certification:', error);
            throw error;
        }
    }

    /**
     * Crée une nouvelle certification
     * @param {Object} certificationData - Données de la certification
     * @returns {Object} - Certification créée
     */
    async createCertification(certificationData) {
        try {
            const {
                userId,
                certificationType,
                certificationNumber,
                issuingBody,
                startDate,
                endDate,
                scope,
                notes,
                documentUrl
            } = certificationData;

            const result = await query(
                `INSERT INTO certifications 
                 (user_id, certification_type, certification_number, issuing_body, 
                  start_date, end_date, scope, notes, document_url)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 RETURNING *`,
                [
                    userId, certificationType, certificationNumber, issuingBody,
                    startDate, endDate, scope, notes, documentUrl
                ]
            );

            return result.rows[0];
        } catch (error) {
            console.error('Erreur lors de la création de la certification:', error);
            throw new Error('Échec de la création de la certification');
        }
    }

    /**
     * Met à jour une certification
     * @param {string} certificationId - ID de la certification
     * @param {string} userId - ID de l'utilisateur
     * @param {Object} updateData - Données à mettre à jour
     * @returns {Object} - Certification mise à jour
     */
    async updateCertification(certificationId, userId, updateData) {
        try {
            const fields = [];
            const values = [];
            let paramCount = 1;

            // Construire dynamiquement la requête UPDATE
            Object.keys(updateData).forEach(key => {
                if (updateData[key] !== undefined) {
                    fields.push(`${key} = $${paramCount}`);
                    values.push(updateData[key]);
                    paramCount++;
                }
            });

            if (fields.length === 0) {
                throw new Error('Aucune donnée à mettre à jour');
            }

            fields.push(`updated_at = CURRENT_TIMESTAMP`);
            values.push(certificationId, userId);

            const result = await query(
                `UPDATE certifications 
                 SET ${fields.join(', ')}
                 WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
                 RETURNING *`,
                values
            );

            if (result.rows.length === 0) {
                throw new Error('Certification non trouvée');
            }

            return result.rows[0];
        } catch (error) {
            console.error('Erreur lors de la mise à jour de la certification:', error);
            throw error;
        }
    }

    /**
     * Supprime une certification
     * @param {string} certificationId - ID de la certification
     * @param {string} userId - ID de l'utilisateur
     * @returns {boolean} - Succès de la suppression
     */
    async deleteCertification(certificationId, userId) {
        try {
            const result = await query(
                'DELETE FROM certifications WHERE id = $1 AND user_id = $2',
                [certificationId, userId]
            );

            return result.rowCount > 0;
        } catch (error) {
            console.error('Erreur lors de la suppression de la certification:', error);
            throw new Error('Échec de la suppression de la certification');
        }
    }

    /**
     * Récupère les certifications expirant bientôt
     * @param {string} userId - ID de l'utilisateur
     * @param {number} days - Nombre de jours avant expiration
     * @returns {Array} - Certifications expirant bientôt
     */
    async getExpiringCertifications(userId, days = 30) {
        try {
            const result = await query(
                `SELECT * FROM certifications 
                 WHERE user_id = $1 
                 AND is_active = true 
                 AND end_date <= CURRENT_DATE + INTERVAL '${days} days'
                 ORDER BY end_date ASC`,
                [userId]
            );

            return result.rows;
        } catch (error) {
            console.error('Erreur lors de la récupération des certifications expirantes:', error);
            throw new Error('Échec de la récupération des certifications expirantes');
        }
    }

    /**
     * Vérifie la conformité des certifications pour un utilisateur
     * @param {string} userId - ID de l'utilisateur
     * @returns {Object} - Rapport de conformité
     */
    async checkCertificationCompliance(userId) {
        try {
            const result = await query(
                `SELECT 
                    certification_type,
                    COUNT(*) as total_count,
                    COUNT(CASE WHEN is_active = true THEN 1 END) as active_count,
                    COUNT(CASE WHEN end_date > CURRENT_DATE THEN 1 END) as valid_count,
                    COUNT(CASE WHEN end_date <= CURRENT_DATE THEN 1 END) as expired_count,
                    COUNT(CASE WHEN end_date <= CURRENT_DATE + INTERVAL '30 days' AND end_date > CURRENT_DATE THEN 1 END) as expiring_soon_count
                 FROM certifications 
                 WHERE user_id = $1
                 GROUP BY certification_type`,
                [userId]
            );

            const compliance = {
                isCompliant: true,
                warnings: [],
                errors: [],
                summary: {},
                recommendations: []
            };

            result.rows.forEach(row => {
                compliance.summary[row.certification_type] = {
                    total: parseInt(row.total_count),
                    active: parseInt(row.active_count),
                    valid: parseInt(row.valid_count),
                    expired: parseInt(row.expired_count),
                    expiringSoon: parseInt(row.expiring_soon_count)
                };

                // Vérifier les certifications importantes
                if (row.certification_type === 'rge' && row.active_count == 0) {
                    compliance.warnings.push('Certification RGE recommandée pour les travaux d\'efficacité énergétique');
                    compliance.recommendations.push('Obtenir la certification RGE pour accéder aux aides publiques');
                }

                if (row.certification_type === 'qualibat' && row.active_count == 0) {
                    compliance.warnings.push('Certification Qualibat recommandée pour la qualité des prestations');
                    compliance.recommendations.push('Obtenir la certification Qualibat pour améliorer la crédibilité');
                }

                if (row.expired_count > 0) {
                    compliance.warnings.push(`${row.certification_type}: ${row.expired_count} certification(s) expirée(s)`);
                }

                if (row.expiring_soon_count > 0) {
                    compliance.warnings.push(`${row.certification_type}: ${row.expiring_soon_count} certification(s) expirant bientôt`);
                }
            });

            return compliance;
        } catch (error) {
            console.error('Erreur lors de la vérification de conformité:', error);
            throw new Error('Échec de la vérification de conformité');
        }
    }

    /**
     * Récupère les informations sur les types de certifications
     * @returns {Object} - Informations sur les certifications
     */
    async getCertificationTypes() {
        return {
            rge: {
                name: 'RGE (Reconnu Garant de l\'Environnement)',
                description: 'Certification pour les travaux d\'efficacité énergétique',
                benefits: [
                    'Accès aux aides publiques (CITE, MaPrimeRénov\')',
                    'Crédibilité auprès des clients',
                    'Différenciation concurrentielle'
                ],
                requirements: [
                    'Formation technique obligatoire',
                    'Assurance décennale',
                    'Contrôle qualité des travaux'
                ],
                validity: '3 ans'
            },
            qualibat: {
                name: 'Qualibat',
                description: 'Certification qualité des entreprises du bâtiment',
                benefits: [
                    'Gage de qualité et de professionnalisme',
                    'Accès aux marchés publics',
                    'Amélioration de l\'image de marque'
                ],
                requirements: [
                    'Compétences techniques vérifiées',
                    'Références clients',
                    'Engagement qualité'
                ],
                validity: '3 ans'
            },
            qualifelec: {
                name: 'Qualifelec',
                description: 'Certification pour les électriciens',
                benefits: [
                    'Spécialisation électricité',
                    'Accès aux marchés spécialisés',
                    'Formation continue'
                ],
                requirements: [
                    'Formation électricité',
                    'Expérience professionnelle',
                    'Contrôle technique'
                ],
                validity: '3 ans'
            }
        };
    }

    /**
     * Génère un rapport de certifications pour une période
     * @param {string} userId - ID de l'utilisateur
     * @param {Date} startDate - Date de début
     * @param {Date} endDate - Date de fin
     * @returns {Object} - Rapport de certifications
     */
    async generateCertificationReport(userId, startDate, endDate) {
        try {
            const result = await query(
                `SELECT 
                    c.*,
                    u.first_name,
                    u.last_name,
                    u.company_name
                 FROM certifications c
                 JOIN users u ON c.user_id = u.id
                 WHERE c.user_id = $1
                 AND c.created_at BETWEEN $2 AND $3
                 ORDER BY c.created_at DESC`,
                [userId, startDate, endDate]
            );

            const summary = {
                totalCertifications: result.rows.length,
                byType: {},
                expiringSoon: 0,
                expired: 0,
                active: 0
            };

            result.rows.forEach(certification => {
                const type = certification.certification_type;
                if (!summary.byType[type]) {
                    summary.byType[type] = 0;
                }
                summary.byType[type]++;

                if (certification.is_active) {
                    summary.active++;
                }

                if (certification.end_date <= new Date()) {
                    summary.expired++;
                } else if (certification.end_date <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) {
                    summary.expiringSoon++;
                }
            });

            return {
                period: { startDate, endDate },
                certifications: result.rows,
                summary
            };
        } catch (error) {
            console.error('Erreur lors de la génération du rapport:', error);
            throw new Error('Échec de la génération du rapport de certifications');
        }
    }
}

module.exports = new CertificationService();
