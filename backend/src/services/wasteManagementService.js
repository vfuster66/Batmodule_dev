const { query, transaction } = require('../config/database');

class WasteManagementService {
    /**
     * Récupère tous les déchets d'un utilisateur
     * @param {string} userId - ID de l'utilisateur
     * @param {string} projectId - ID du projet (optionnel)
     * @returns {Array} - Liste des déchets
     */
    async getWasteRecords(userId, projectId = null) {
        try {
            let whereClause = 'WHERE wm.user_id = $1';
            let params = [userId];

            if (projectId) {
                whereClause += ' AND wm.project_id = $2';
                params.push(projectId);
            }

            const result = await query(
                `SELECT 
                    wm.*,
                    p.project_name,
                    c.first_name as client_first_name,
                    c.last_name as client_last_name,
                    c.company_name as client_company
                 FROM waste_management wm
                 LEFT JOIN projects p ON wm.project_id = p.id
                 LEFT JOIN clients c ON p.client_id = c.id
                 ${whereClause}
                 ORDER BY wm.collection_date DESC, wm.created_at DESC`,
                params
            );

            return result.rows;
        } catch (error) {
            console.error('Erreur lors de la récupération des déchets:', error);
            throw new Error('Échec de la récupération des déchets');
        }
    }

    /**
     * Récupère un enregistrement de déchet par ID
     * @param {string} wasteId - ID du déchet
     * @param {string} userId - ID de l'utilisateur
     * @returns {Object} - Enregistrement de déchet
     */
    async getWasteRecordById(wasteId, userId) {
        try {
            const result = await query(
                `SELECT 
                    wm.*,
                    p.project_name,
                    c.first_name as client_first_name,
                    c.last_name as client_last_name,
                    c.company_name as client_company
                 FROM waste_management wm
                 LEFT JOIN projects p ON wm.project_id = p.id
                 LEFT JOIN clients c ON p.client_id = c.id
                 WHERE wm.id = $1 AND wm.user_id = $2`,
                [wasteId, userId]
            );

            if (result.rows.length === 0) {
                throw new Error('Enregistrement de déchet non trouvé');
            }

            return result.rows[0];
        } catch (error) {
            console.error('Erreur lors de la récupération du déchet:', error);
            throw error;
        }
    }

    /**
     * Crée un nouvel enregistrement de déchet
     * @param {Object} wasteData - Données du déchet
     * @returns {Object} - Enregistrement créé
     */
    async createWasteRecord(wasteData) {
        try {
            const {
                userId,
                projectId,
                wasteType,
                wasteCode,
                quantity,
                unit,
                collectionDate,
                transporterName,
                transporterSiret,
                destinationFacility,
                facilitySiret,
                bsdNumber,
                disposalMethod,
                cost,
                notes
            } = wasteData;

            const result = await query(
                `INSERT INTO waste_management 
                 (user_id, project_id, waste_type, waste_code, quantity, unit, 
                  collection_date, transporter_name, transporter_siret, 
                  destination_facility, facility_siret, bsd_number, 
                  disposal_method, cost, notes)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                 RETURNING *`,
                [
                    userId, projectId, wasteType, wasteCode, quantity, unit,
                    collectionDate, transporterName, transporterSiret,
                    destinationFacility, facilitySiret, bsdNumber,
                    disposalMethod, cost, notes
                ]
            );

            return result.rows[0];
        } catch (error) {
            console.error('Erreur lors de la création de l\'enregistrement de déchet:', error);
            throw new Error('Échec de la création de l\'enregistrement de déchet');
        }
    }

    /**
     * Met à jour un enregistrement de déchet
     * @param {string} wasteId - ID du déchet
     * @param {string} userId - ID de l'utilisateur
     * @param {Object} updateData - Données à mettre à jour
     * @returns {Object} - Enregistrement mis à jour
     */
    async updateWasteRecord(wasteId, userId, updateData) {
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
            values.push(wasteId, userId);

            const result = await query(
                `UPDATE waste_management 
                 SET ${fields.join(', ')}
                 WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
                 RETURNING *`,
                values
            );

            if (result.rows.length === 0) {
                throw new Error('Enregistrement de déchet non trouvé');
            }

            return result.rows[0];
        } catch (error) {
            console.error('Erreur lors de la mise à jour de l\'enregistrement de déchet:', error);
            throw error;
        }
    }

    /**
     * Supprime un enregistrement de déchet
     * @param {string} wasteId - ID du déchet
     * @param {string} userId - ID de l'utilisateur
     * @returns {boolean} - Succès de la suppression
     */
    async deleteWasteRecord(wasteId, userId) {
        try {
            const result = await query(
                'DELETE FROM waste_management WHERE id = $1 AND user_id = $2',
                [wasteId, userId]
            );

            return result.rowCount > 0;
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'enregistrement de déchet:', error);
            throw new Error('Échec de la suppression de l\'enregistrement de déchet');
        }
    }

    /**
     * Récupère les statistiques de déchets pour un utilisateur
     * @param {string} userId - ID de l'utilisateur
     * @param {Date} startDate - Date de début (optionnel)
     * @param {Date} endDate - Date de fin (optionnel)
     * @returns {Object} - Statistiques de déchets
     */
    async getWasteStatistics(userId, startDate = null, endDate = null) {
        try {
            let whereClause = 'WHERE user_id = $1';
            let params = [userId];

            if (startDate && endDate) {
                whereClause += ' AND collection_date BETWEEN $2 AND $3';
                params.push(startDate, endDate);
            }

            const result = await query(
                `SELECT 
                    waste_type,
                    COUNT(*) as record_count,
                    SUM(quantity) as total_quantity,
                    AVG(quantity) as avg_quantity,
                    SUM(cost) as total_cost,
                    AVG(cost) as avg_cost,
                    COUNT(DISTINCT project_id) as projects_count
                 FROM waste_management 
                 ${whereClause}
                 GROUP BY waste_type
                 ORDER BY total_quantity DESC`,
                params
            );

            const summary = {
                totalRecords: 0,
                totalQuantity: 0,
                totalCost: 0,
                projectsCount: 0,
                byType: {}
            };

            result.rows.forEach(row => {
                summary.totalRecords += parseInt(row.record_count);
                summary.totalQuantity += parseFloat(row.total_quantity || 0);
                summary.totalCost += parseFloat(row.total_cost || 0);
                summary.projectsCount += parseInt(row.projects_count);

                summary.byType[row.waste_type] = {
                    records: parseInt(row.record_count),
                    quantity: parseFloat(row.total_quantity || 0),
                    avgQuantity: parseFloat(row.avg_quantity || 0),
                    cost: parseFloat(row.total_cost || 0),
                    avgCost: parseFloat(row.avg_cost || 0),
                    projects: parseInt(row.projects_count)
                };
            });

            return {
                period: { startDate, endDate },
                summary,
                details: result.rows
            };
        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques:', error);
            throw new Error('Échec de la récupération des statistiques de déchets');
        }
    }

    /**
     * Récupère les types de déchets et leurs codes
     * @returns {Object} - Types de déchets
     */
    async getWasteTypes() {
        return {
            peinture: {
                name: 'Déchets de peinture',
                code: '08 01 11',
                description: 'Peintures, vernis, laques en phase aqueuse',
                disposal: 'Valorisation énergétique ou élimination',
                cost: '15-25€/kg'
            },
            solvants: {
                name: 'Solvants usagés',
                code: '08 01 12',
                description: 'Solvants, diluants, décapants',
                disposal: 'Incinération avec récupération d\'énergie',
                cost: '20-40€/kg'
            },
            emballages: {
                name: 'Emballages souillés',
                code: '15 01 10',
                description: 'Emballages contenant des résidus de peinture',
                disposal: 'Incinération ou enfouissement',
                cost: '5-15€/kg'
            },
            dechets_amiante: {
                name: 'Déchets d\'amiante',
                code: '17 06 01',
                description: 'Matériaux contenant de l\'amiante',
                disposal: 'Installation de stockage de déchets dangereux',
                cost: '50-100€/kg',
                special: 'Transport et élimination réglementés'
            },
            dechets_plomb: {
                name: 'Déchets contenant du plomb',
                code: '17 04 05',
                description: 'Peintures au plomb, poussières de ponçage',
                disposal: 'Installation de stockage de déchets dangereux',
                cost: '30-60€/kg',
                special: 'Transport et élimination réglementés'
            }
        };
    }

    /**
     * Génère un rapport de déchets pour une période
     * @param {string} userId - ID de l'utilisateur
     * @param {Date} startDate - Date de début
     * @param {Date} endDate - Date de fin
     * @returns {Object} - Rapport de déchets
     */
    async generateWasteReport(userId, startDate, endDate) {
        try {
            const result = await query(
                `SELECT 
                    wm.*,
                    p.project_name,
                    c.first_name as client_first_name,
                    c.last_name as client_last_name,
                    c.company_name as client_company
                 FROM waste_management wm
                 LEFT JOIN projects p ON wm.project_id = p.id
                 LEFT JOIN clients c ON p.client_id = c.id
                 WHERE wm.user_id = $1
                 AND wm.collection_date BETWEEN $2 AND $3
                 ORDER BY wm.collection_date DESC`,
                [userId, startDate, endDate]
            );

            const summary = {
                totalRecords: result.rows.length,
                totalQuantity: 0,
                totalCost: 0,
                byType: {},
                byProject: {},
                compliance: {
                    hasBsd: 0,
                    hasTransporter: 0,
                    hasDestination: 0
                }
            };

            result.rows.forEach(record => {
                summary.totalQuantity += parseFloat(record.quantity || 0);
                summary.totalCost += parseFloat(record.cost || 0);

                // Par type
                if (!summary.byType[record.waste_type]) {
                    summary.byType[record.waste_type] = {
                        count: 0,
                        quantity: 0,
                        cost: 0
                    };
                }
                summary.byType[record.waste_type].count++;
                summary.byType[record.waste_type].quantity += parseFloat(record.quantity || 0);
                summary.byType[record.waste_type].cost += parseFloat(record.cost || 0);

                // Par projet
                if (record.project_name) {
                    if (!summary.byProject[record.project_name]) {
                        summary.byProject[record.project_name] = {
                            count: 0,
                            quantity: 0,
                            cost: 0
                        };
                    }
                    summary.byProject[record.project_name].count++;
                    summary.byProject[record.project_name].quantity += parseFloat(record.quantity || 0);
                    summary.byProject[record.project_name].cost += parseFloat(record.cost || 0);
                }

                // Conformité
                if (record.bsd_number) summary.compliance.hasBsd++;
                if (record.transporter_name) summary.compliance.hasTransporter++;
                if (record.destination_facility) summary.compliance.hasDestination++;
            });

            // Calculer les pourcentages de conformité
            summary.compliance.hasBsd = Math.round((summary.compliance.hasBsd / summary.totalRecords) * 100) || 0;
            summary.compliance.hasTransporter = Math.round((summary.compliance.hasTransporter / summary.totalRecords) * 100) || 0;
            summary.compliance.hasDestination = Math.round((summary.compliance.hasDestination / summary.totalRecords) * 100) || 0;

            return {
                period: { startDate, endDate },
                records: result.rows,
                summary
            };
        } catch (error) {
            console.error('Erreur lors de la génération du rapport:', error);
            throw new Error('Échec de la génération du rapport de déchets');
        }
    }
}

module.exports = new WasteManagementService();
