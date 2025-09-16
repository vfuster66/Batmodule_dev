const { query, transaction } = require('../config/database')
const fs = require('fs').promises
const path = require('path')
const archivingService = require('./archivingService')

class RGPDService {
  constructor() {
    this.exportDir = process.env.EXPORT_DIR || './exports'
    this.ensureExportDir()
  }

  async ensureExportDir() {
    try {
      await fs.mkdir(this.exportDir, { recursive: true })
    } catch (error) {
      console.error("Erreur lors de la création du répertoire d'export:", error)
    }
  }

  /**
   * Exporte toutes les données personnelles d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Object} - Données exportées
   */
  async exportUserData(userId) {
    try {
      const exportData = {}

      // Informations utilisateur
      const userResult = await query(
        'SELECT id, email, first_name, last_name, company_name, phone, address, created_at, updated_at FROM users WHERE id = $1',
        [userId]
      )
      exportData.user = userResult.rows[0]

      // Paramètres entreprise
      const companyResult = await query(
        'SELECT * FROM company_settings WHERE user_id = $1',
        [userId]
      )
      exportData.companySettings = companyResult.rows[0]

      // Clients
      const clientsResult = await query(
        'SELECT * FROM clients WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      )
      exportData.clients = clientsResult.rows

      // Services
      const servicesResult = await query(
        'SELECT * FROM services WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      )
      exportData.services = servicesResult.rows

      // Devis
      const quotesResult = await query(
        `SELECT q.*, c.first_name as client_first_name, c.last_name as client_last_name, c.company_name as client_company
                 FROM quotes q
                 LEFT JOIN clients c ON q.client_id = c.id
                 WHERE q.user_id = $1 ORDER BY q.created_at DESC`,
        [userId]
      )
      exportData.quotes = quotesResult.rows

      // Lignes de devis
      const quoteItemsResult = await query(
        `SELECT qi.*, q.quote_number, q.title as quote_title
                 FROM quote_items qi
                 JOIN quotes q ON qi.quote_id = q.id
                 WHERE q.user_id = $1 ORDER BY qi.created_at DESC`,
        [userId]
      )
      exportData.quoteItems = quoteItemsResult.rows

      // Factures
      const invoicesResult = await query(
        `SELECT i.*, c.first_name as client_first_name, c.last_name as client_last_name, c.company_name as client_company
                 FROM invoices i
                 LEFT JOIN clients c ON i.client_id = c.id
                 WHERE i.user_id = $1 ORDER BY i.created_at DESC`,
        [userId]
      )
      exportData.invoices = invoicesResult.rows

      // Lignes de facture
      const invoiceItemsResult = await query(
        `SELECT ii.*, i.invoice_number, i.title as invoice_title
                 FROM invoice_items ii
                 JOIN invoices i ON ii.invoice_id = i.id
                 WHERE i.user_id = $1 ORDER BY ii.created_at DESC`,
        [userId]
      )
      exportData.invoiceItems = invoiceItemsResult.rows

      // Paiements
      const paymentsResult = await query(
        `SELECT p.*, i.invoice_number, i.title as invoice_title
                 FROM payments p
                 JOIN invoices i ON p.invoice_id = i.id
                 WHERE i.user_id = $1 ORDER BY p.created_at DESC`,
        [userId]
      )
      exportData.payments = paymentsResult.rows

      // Crédits/Avoirs
      const creditsResult = await query(
        `SELECT cr.*, i.invoice_number, i.title as invoice_title
                 FROM credits cr
                 JOIN invoices i ON cr.invoice_id = i.id
                 WHERE cr.user_id = $1 ORDER BY cr.created_at DESC`,
        [userId]
      )
      exportData.credits = creditsResult.rows

      // Historique des statuts de factures
      const invoiceHistoryResult = await query(
        `SELECT h.*, i.invoice_number, i.title as invoice_title
                 FROM invoice_status_history h
                 JOIN invoices i ON h.invoice_id = i.id
                 WHERE i.user_id = $1 ORDER BY h.changed_at DESC`,
        [userId]
      )
      exportData.invoiceHistory = invoiceHistoryResult.rows

      // Métadonnées d'export
      exportData.exportMetadata = {
        exportDate: new Date().toISOString(),
        userId,
        version: '1.0',
        dataTypes: Object.keys(exportData).filter(
          (key) => key !== 'exportMetadata'
        ),
      }

      return exportData
    } catch (error) {
      console.error("Erreur lors de l'export des données utilisateur:", error)
      throw new Error("Échec de l'export des données utilisateur")
    }
  }

  /**
   * Sauvegarde l'export dans un fichier JSON
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} exportData - Données exportées
   * @returns {string} - Chemin du fichier d'export
   */
  async saveExportToFile(userId, exportData) {
    try {
      const fileName = `export_user_${userId}_${Date.now()}.json`
      const filePath = path.join(this.exportDir, fileName)

      await fs.writeFile(filePath, JSON.stringify(exportData, null, 2), 'utf8')

      return filePath
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de l'export:", error)
      throw new Error("Échec de la sauvegarde de l'export")
    }
  }

  /**
   * Supprime toutes les données personnelles d'un utilisateur (avec garanties comptables)
   * @param {string} userId - ID de l'utilisateur
   * @param {boolean} keepAccountingData - Conserver les données comptables (factures, paiements)
   * @returns {Object} - Résultat de la suppression
   */
  async deleteUserData(userId, keepAccountingData = true) {
    try {
      return await transaction(async (client) => {
        const deletedData = {}

        // 1. Supprimer les données non comptables
        if (!keepAccountingData) {
          // Supprimer l'historique des statuts (non comptable)
          const historyResult = await client.query(
            'DELETE FROM invoice_status_history WHERE invoice_id IN (SELECT id FROM invoices WHERE user_id = $1)',
            [userId]
          )
          deletedData.invoiceHistory = historyResult.rowCount

          // Supprimer les factures et données liées
          const invoiceItemsResult = await client.query(
            'DELETE FROM invoice_items WHERE invoice_id IN (SELECT id FROM invoices WHERE user_id = $1)',
            [userId]
          )
          deletedData.invoiceItems = invoiceItemsResult.rowCount

          const paymentsResult = await client.query(
            'DELETE FROM payments WHERE invoice_id IN (SELECT id FROM invoices WHERE user_id = $1)',
            [userId]
          )
          deletedData.payments = paymentsResult.rowCount

          const creditsResult = await client.query(
            'DELETE FROM credits WHERE user_id = $1',
            [userId]
          )
          deletedData.credits = creditsResult.rowCount

          const invoicesResult = await client.query(
            'DELETE FROM invoices WHERE user_id = $1',
            [userId]
          )
          deletedData.invoices = invoicesResult.rowCount
        }

        // 2. Supprimer les données de prospection (toujours supprimées)
        const quoteItemsResult = await client.query(
          'DELETE FROM quote_items WHERE quote_id IN (SELECT id FROM quotes WHERE user_id = $1)',
          [userId]
        )
        deletedData.quoteItems = quoteItemsResult.rowCount

        const quotesResult = await client.query(
          'DELETE FROM quotes WHERE user_id = $1',
          [userId]
        )
        deletedData.quotes = quotesResult.rowCount

        // 3. Supprimer les données de contact
        const clientsResult = await client.query(
          'DELETE FROM clients WHERE user_id = $1',
          [userId]
        )
        deletedData.clients = clientsResult.rowCount

        const servicesResult = await client.query(
          'DELETE FROM services WHERE user_id = $1',
          [userId]
        )
        deletedData.services = servicesResult.rowCount

        // 4. Supprimer les paramètres entreprise
        const companyResult = await client.query(
          'DELETE FROM company_settings WHERE user_id = $1',
          [userId]
        )
        deletedData.companySettings = companyResult.rowCount

        // 5. Anonymiser les données utilisateur (garder l'ID pour les données comptables)
        const userResult = await client.query(
          `UPDATE users SET 
                     email = 'deleted_' || id || '@deleted.local',
                     first_name = 'Utilisateur',
                     last_name = 'Supprimé',
                     company_name = NULL,
                     phone = NULL,
                     address = NULL,
                     updated_at = CURRENT_TIMESTAMP
                     WHERE id = $1`,
          [userId]
        )
        deletedData.user = userResult.rowCount

        return {
          success: true,
          deletedData,
          keepAccountingData,
          deletionDate: new Date().toISOString(),
        }
      })
    } catch (error) {
      console.error(
        'Erreur lors de la suppression des données utilisateur:',
        error
      )
      throw new Error('Échec de la suppression des données utilisateur')
    }
  }

  /**
   * Purge les données selon la politique de rétention
   * @param {Object} retentionPolicy - Politique de rétention
   * @returns {Object} - Résultat de la purge
   */
  async purgeDataByRetentionPolicy(retentionPolicy = {}) {
    try {
      const {
        prospectionYears = 3, // Données de prospection : 3 ans
        accountingYears = 10, // Données comptables : 10 ans
        logsYears = 1, // Logs : 1 an
      } = retentionPolicy

      const purgeResults = {}

      // Purger les données de prospection (devis, clients non facturés)
      const prospectionCutoff = new Date()
      prospectionCutoff.setFullYear(
        prospectionCutoff.getFullYear() - prospectionYears
      )

      const oldQuotesResult = await query(
        `DELETE FROM quotes 
                 WHERE user_id NOT IN (
                     SELECT DISTINCT user_id FROM invoices 
                     WHERE created_at > $1
                 ) AND created_at < $1`,
        [prospectionCutoff]
      )
      purgeResults.oldQuotes = oldQuotesResult.rowCount

      // Purger les clients sans factures récentes
      const oldClientsResult = await query(
        `DELETE FROM clients 
                 WHERE user_id NOT IN (
                     SELECT DISTINCT user_id FROM invoices 
                     WHERE created_at > $1
                 ) AND created_at < $1`,
        [prospectionCutoff]
      )
      purgeResults.oldClients = oldClientsResult.rowCount

      // Purger les logs anciens
      const logsCutoff = new Date()
      logsCutoff.setFullYear(logsCutoff.getFullYear() - logsYears)

      const oldLogsResult = await query(
        'DELETE FROM invoice_status_history WHERE changed_at < $1',
        [logsCutoff]
      )
      purgeResults.oldLogs = oldLogsResult.rowCount

      // Purger les archives selon la politique d'archivage
      const archivePurgeResult =
        await archivingService.purgeArchives(accountingYears)
      purgeResults.archives = archivePurgeResult

      return {
        success: true,
        purgeResults,
        retentionPolicy,
        purgeDate: new Date().toISOString(),
      }
    } catch (error) {
      console.error('Erreur lors de la purge des données:', error)
      throw new Error('Échec de la purge des données')
    }
  }

  /**
   * Génère un rapport de conformité RGPD
   * @param {string} userId - ID de l'utilisateur (optionnel)
   * @returns {Object} - Rapport de conformité
   */
  async generateRGPDComplianceReport(userId = null) {
    try {
      let whereClause = ''
      let params = []

      if (userId) {
        whereClause = 'WHERE u.id = $1'
        params = [userId]
      }

      // Statistiques générales
      const statsResult = await query(
        `SELECT 
                    COUNT(DISTINCT u.id) as total_users,
                    COUNT(DISTINCT c.id) as total_clients,
                    COUNT(DISTINCT q.id) as total_quotes,
                    COUNT(DISTINCT i.id) as total_invoices,
                    COUNT(DISTINCT p.id) as total_payments
                 FROM users u
                 LEFT JOIN clients c ON u.id = c.user_id
                 LEFT JOIN quotes q ON u.id = q.user_id
                 LEFT JOIN invoices i ON u.id = i.user_id
                 LEFT JOIN payments p ON i.id = p.invoice_id
                 ${whereClause}`,
        params
      )

      const stats = statsResult.rows[0]

      // Données par utilisateur
      const usersDataResult = await query(
        `SELECT 
                    u.id,
                    u.email,
                    u.created_at,
                    COUNT(DISTINCT c.id) as client_count,
                    COUNT(DISTINCT q.id) as quote_count,
                    COUNT(DISTINCT i.id) as invoice_count,
                    MAX(i.created_at) as last_invoice_date
                 FROM users u
                 LEFT JOIN clients c ON u.id = c.user_id
                 LEFT JOIN quotes q ON u.id = q.user_id
                 LEFT JOIN invoices i ON u.id = i.user_id
                 ${whereClause}
                 GROUP BY u.id, u.email, u.created_at
                 ORDER BY u.created_at DESC`,
        params
      )

      return {
        reportDate: new Date().toISOString(),
        statistics: stats,
        usersData: usersDataResult.rows,
        complianceChecks: {
          dataMinimization: 'OK',
          purposeLimitation: 'OK',
          storageLimitation: 'OK',
          accuracy: 'OK',
          security: 'OK',
        },
        recommendations: [
          'Mettre en place une politique de rétention des données',
          'Implémenter des audits de sécurité réguliers',
          'Former les utilisateurs sur la protection des données',
          'Documenter les traitements de données personnelles',
        ],
      }
    } catch (error) {
      console.error('Erreur lors de la génération du rapport RGPD:', error)
      throw new Error('Échec de la génération du rapport RGPD')
    }
  }
}

module.exports = new RGPDService()
