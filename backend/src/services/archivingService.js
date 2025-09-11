const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { query } = require('../config/database');

class ArchivingService {
    constructor() {
        this.archiveDir = process.env.ARCHIVE_DIR || './archives';
        this.ensureArchiveDir();
    }

    async ensureArchiveDir() {
        try {
            await fs.mkdir(this.archiveDir, { recursive: true });
        } catch (error) {
            console.error('Erreur lors de la création du répertoire d\'archivage:', error);
        }
    }

    /**
     * Archive une facture avec hash SHA-256 pour conformité légale
     * @param {Object} invoice - La facture à archiver
     * @param {Buffer} pdfBuffer - Le contenu PDF de la facture
     * @param {Object} companySettings - Les paramètres de l'entreprise
     * @returns {Object} - Informations d'archivage (hash, chemin, etc.)
     */
    async archiveInvoice(invoice, pdfBuffer, companySettings) {
        try {
            // Calculer le hash SHA-256 du PDF
            const hash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

            // Créer le nom de fichier avec le numéro de facture
            const fileName = `facture_${invoice.invoice_number}_${invoice.id}.pdf`;
            const filePath = path.join(this.archiveDir, fileName);

            // Sauvegarder le PDF
            await fs.writeFile(filePath, pdfBuffer);

            // Mettre à jour la facture avec les informations d'archivage
            await query(
                `UPDATE invoices 
                 SET pdf_hash = $1, pdf_storage_path = $2, archived_at = CURRENT_TIMESTAMP, is_archived = true
                 WHERE id = $3`,
                [hash, filePath, invoice.id]
            );

            // Enregistrer l'événement d'archivage
            await this.logInvoiceEvent(invoice.id, 'archived', null, 'Facture archivée automatiquement');

            return {
                hash,
                filePath,
                archivedAt: new Date(),
                fileName
            };
        } catch (error) {
            console.error('Erreur lors de l\'archivage de la facture:', error);
            throw new Error('Échec de l\'archivage de la facture');
        }
    }

    /**
     * Vérifie l'intégrité d'une facture archivée
     * @param {string} invoiceId - ID de la facture
     * @returns {Object} - Résultat de la vérification
     */
    async verifyInvoiceIntegrity(invoiceId) {
        try {
            const result = await query(
                'SELECT pdf_hash, pdf_storage_path, is_archived FROM invoices WHERE id = $1',
                [invoiceId]
            );

            if (result.rows.length === 0) {
                return { valid: false, error: 'Facture non trouvée' };
            }

            const invoice = result.rows[0];

            if (!invoice.is_archived || !invoice.pdf_storage_path) {
                return { valid: false, error: 'Facture non archivée' };
            }

            // Lire le fichier archivé
            const fileBuffer = await fs.readFile(invoice.pdf_storage_path);
            const currentHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

            return {
                valid: currentHash === invoice.pdf_hash,
                storedHash: invoice.pdf_hash,
                currentHash,
                filePath: invoice.pdf_storage_path
            };
        } catch (error) {
            console.error('Erreur lors de la vérification d\'intégrité:', error);
            return { valid: false, error: 'Erreur de vérification' };
        }
    }

    /**
     * Enregistre un événement dans l'historique des factures
     * @param {string} invoiceId - ID de la facture
     * @param {string} status - Nouveau statut
     * @param {string} userId - ID de l'utilisateur (optionnel)
     * @param {string} notes - Notes additionnelles
     * @param {string} ipAddress - Adresse IP (optionnel)
     * @param {string} userAgent - User Agent (optionnel)
     */
    async logInvoiceEvent(invoiceId, status, userId = null, notes = null, ipAddress = null, userAgent = null) {
        try {
            await query(
                `INSERT INTO invoice_status_history (invoice_id, status, changed_by, notes, ip_address, user_agent)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [invoiceId, status, userId, notes, ipAddress, userAgent]
            );
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement de l\'événement:', error);
        }
    }

    /**
     * Récupère l'historique des événements d'une facture
     * @param {string} invoiceId - ID de la facture
     * @returns {Array} - Liste des événements
     */
    async getInvoiceHistory(invoiceId) {
        try {
            const result = await query(
                `SELECT h.*, u.first_name, u.last_name, u.email
                 FROM invoice_status_history h
                 LEFT JOIN users u ON h.changed_by = u.id
                 WHERE h.invoice_id = $1
                 ORDER BY h.changed_at DESC`,
                [invoiceId]
            );
            return result.rows;
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'historique:', error);
            return [];
        }
    }

    /**
     * Génère un rapport d'audit pour une période donnée
     * @param {Date} startDate - Date de début
     * @param {Date} endDate - Date de fin
     * @param {string} userId - ID de l'utilisateur (optionnel)
     * @returns {Object} - Rapport d'audit
     */
    async generateAuditReport(startDate, endDate, userId = null) {
        try {
            let whereClause = 'WHERE i.created_at BETWEEN $1 AND $2';
            let params = [startDate, endDate];

            if (userId) {
                whereClause += ' AND i.user_id = $3';
                params.push(userId);
            }

            const result = await query(
                `SELECT 
                    i.id,
                    i.invoice_number,
                    i.status,
                    i.total_ttc,
                    i.created_at,
                    i.archived_at,
                    i.is_archived,
                    i.pdf_hash,
                    c.first_name as client_first_name,
                    c.last_name as client_last_name,
                    c.company_name as client_company
                 FROM invoices i
                 LEFT JOIN clients c ON i.client_id = c.id
                 ${whereClause}
                 ORDER BY i.created_at DESC`,
                params
            );

            return {
                period: { startDate, endDate },
                invoices: result.rows,
                totalInvoices: result.rows.length,
                archivedInvoices: result.rows.filter(i => i.is_archived).length,
                totalAmount: result.rows.reduce((sum, i) => sum + parseFloat(i.total_ttc || 0), 0)
            };
        } catch (error) {
            console.error('Erreur lors de la génération du rapport d\'audit:', error);
            throw new Error('Échec de la génération du rapport d\'audit');
        }
    }

    /**
     * Purge les archives selon la politique de rétention
     * @param {number} retentionYears - Nombre d'années de rétention
     * @returns {Object} - Résultat de la purge
     */
    async purgeArchives(retentionYears = 10) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setFullYear(cutoffDate.getFullYear() - retentionYears);

            // Récupérer les factures à purger
            const result = await query(
                'SELECT id, pdf_storage_path FROM invoices WHERE created_at < $1 AND is_archived = true',
                [cutoffDate]
            );

            let purgedCount = 0;
            let errors = [];

            for (const invoice of result.rows) {
                try {
                    // Supprimer le fichier physique
                    if (invoice.pdf_storage_path) {
                        await fs.unlink(invoice.pdf_storage_path);
                    }

                    // Marquer comme purgé dans la DB
                    await query(
                        'UPDATE invoices SET is_archived = false, pdf_storage_path = NULL WHERE id = $1',
                        [invoice.id]
                    );

                    purgedCount++;
                } catch (error) {
                    errors.push({ invoiceId: invoice.id, error: error.message });
                }
            }

            return {
                purgedCount,
                errors,
                cutoffDate
            };
        } catch (error) {
            console.error('Erreur lors de la purge des archives:', error);
            throw new Error('Échec de la purge des archives');
        }
    }
}

module.exports = new ArchivingService();
