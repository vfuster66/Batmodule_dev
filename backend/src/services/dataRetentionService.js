const { query } = require('../config/database')
const archivingService = require('./archivingService')

class DataRetentionService {
  constructor() {
    this.retentionPolicies = {
      // Données de connexion (logs) - 12 mois maximum
      connectionLogs: {
        months: 12,
        table: 'user_sessions',
        dateColumn: 'created_at',
      },

      // Données clients - 3 ans après fin de relation
      clients: { years: 3, table: 'clients', dateColumn: 'updated_at' },

      // Factures et devis - 10 ans (obligation légale)
      invoices: { years: 10, table: 'invoices', dateColumn: 'created_at' },
      quotes: { years: 10, table: 'quotes', dateColumn: 'created_at' },

      // Données de paiement - 10 ans (même que factures)
      payments: { years: 10, table: 'payments', dateColumn: 'created_at' },

      // Historique des statuts - 10 ans
      invoiceStatusHistory: {
        years: 10,
        table: 'invoice_status_history',
        dateColumn: 'created_at',
      },
    }
  }

  /**
   * Nettoie automatiquement les données expirées selon les politiques de rétention
   */
  async cleanupExpiredData(userId) {
    const results = {
      cleaned: {},
      errors: {},
      totalDeleted: 0,
    }

    try {
      console.log('🧹 Début du nettoyage automatique des données expirées...')

      // Nettoyer les données de connexion (12 mois)
      await this.cleanupConnectionLogs(results)

      // Nettoyer les clients inactifs (3 ans)
      if (userId) {
        // Nettoyage pour un utilisateur spécifique
        await this.cleanupInactiveClients(results, userId)
      } else {
        // Nettoyage global pour tous les utilisateurs
        await this.cleanupInactiveClientsGlobal(results)
      }

      // Nettoyer les données de test et développement
      await this.cleanupTestData(results)

      // Archiver les factures anciennes avant suppression
      await this.archiveOldInvoices(results)

      console.log('✅ Nettoyage terminé:', results)
      return results
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage des données:', error)
      results.errors.general = error.message
      return results
    }
  }

  /**
   * Nettoie les logs de connexion expirés (12 mois)
   */
  async cleanupConnectionLogs(results) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setMonth(cutoffDate.getMonth() - 12)

      // Supprimer les sessions expirées
      const sessionsResult = await query(
        `DELETE FROM user_sessions WHERE created_at < $1`,
        [cutoffDate]
      )

      // Supprimer les logs d'audit anciens (garder seulement 12 mois)
      const auditResult = await query(
        `DELETE FROM audit_logs WHERE created_at < $1`,
        [cutoffDate]
      )

      results.cleaned.connectionLogs = {
        sessions: sessionsResult.rowCount || 0,
        auditLogs: auditResult.rowCount || 0,
      }
      results.totalDeleted +=
        (sessionsResult.rowCount || 0) + (auditResult.rowCount || 0)

      console.log(
        `🗑️ Logs de connexion nettoyés: ${sessionsResult.rowCount || 0} sessions, ${auditResult.rowCount || 0} logs d'audit`
      )
    } catch (error) {
      console.error('Erreur lors du nettoyage des logs:', error)
      results.errors.connectionLogs = error.message
    }
  }

  /**
   * Nettoie les clients inactifs (3 ans sans activité)
   */
  async cleanupInactiveClients(results, userId) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 3)

      // Trouver les clients inactifs (pas de devis/factures récents) pour cet utilisateur
      const inactiveClientsResult = await query(
        `SELECT c.id, c.first_name, c.last_name, c.company_name
         FROM clients c
         WHERE c.user_id = $1
         AND c.updated_at < $2
         AND c.id NOT IN (
           SELECT DISTINCT client_id FROM quotes WHERE user_id = $1 AND created_at > $2
           UNION
           SELECT DISTINCT client_id FROM invoices WHERE user_id = $1 AND created_at > $2
         )`,
        [userId, cutoffDate]
      )

      const inactiveClients = inactiveClientsResult.rows

      if (inactiveClients.length > 0) {
        console.log(
          `🔍 ${inactiveClients.length} clients inactifs trouvés depuis 3 ans`
        )

        // Supprimer les clients inactifs et leurs données associées
        for (const client of inactiveClients) {
          await this.deleteClientData(client.id, userId)
        }

        results.cleaned.inactiveClients = inactiveClients.length
        results.totalDeleted += inactiveClients.length

        console.log(`🗑️ ${inactiveClients.length} clients inactifs supprimés`)
      }
    } catch (error) {
      console.error('Erreur lors du nettoyage des clients inactifs:', error)
      results.errors.inactiveClients = error.message
    }
  }

  /**
   * Nettoie les clients inactifs pour tous les utilisateurs (nettoyage global)
   */
  async cleanupInactiveClientsGlobal(results) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 3)

      // Trouver les clients inactifs pour tous les utilisateurs
      const inactiveClientsResult = await query(
        `SELECT c.id, c.first_name, c.last_name, c.company_name, c.user_id
         FROM clients c
         WHERE c.updated_at < $1
         AND c.id NOT IN (
           SELECT DISTINCT client_id FROM quotes WHERE created_at > $1
           UNION
           SELECT DISTINCT client_id FROM invoices WHERE created_at > $1
         )`,
        [cutoffDate]
      )

      const inactiveClients = inactiveClientsResult.rows

      if (inactiveClients.length > 0) {
        console.log(
          `🔍 ${inactiveClients.length} clients inactifs trouvés depuis 3 ans`
        )

        // Supprimer les clients inactifs et leurs données associées
        for (const client of inactiveClients) {
          await this.deleteClientData(client.id, client.user_id)
        }

        results.cleaned.inactiveClients = inactiveClients.length
        results.totalDeleted += inactiveClients.length

        console.log(`🗑️ ${inactiveClients.length} clients inactifs supprimés`)
      }
    } catch (error) {
      console.error(
        'Erreur lors du nettoyage global des clients inactifs:',
        error
      )
      results.errors.inactiveClients = error.message
    }
  }

  /**
   * Supprime toutes les données associées à un client
   */
  async deleteClientData(clientId, userId) {
    const { transaction } = require('../config/database')

    await transaction(async (client) => {
      // Supprimer dans l'ordre pour respecter les contraintes, en filtrant par utilisateur
      await client.query(
        'DELETE FROM payments WHERE invoice_id IN (SELECT id FROM invoices WHERE client_id = $1 AND user_id = $2)',
        [clientId, userId]
      )
      await client.query(
        'DELETE FROM invoice_items WHERE invoice_id IN (SELECT id FROM invoices WHERE client_id = $1 AND user_id = $2)',
        [clientId, userId]
      )
      await client.query(
        'DELETE FROM quote_items WHERE quote_id IN (SELECT id FROM quotes WHERE client_id = $1 AND user_id = $2)',
        [clientId, userId]
      )
      await client.query(
        'DELETE FROM invoices WHERE client_id = $1 AND user_id = $2',
        [clientId, userId]
      )
      await client.query(
        'DELETE FROM quotes WHERE client_id = $1 AND user_id = $2',
        [clientId, userId]
      )
      await client.query('DELETE FROM clients WHERE id = $1 AND user_id = $2', [
        clientId,
        userId,
      ])
    })
  }

  /**
   * Nettoie les données de test et développement
   */
  async cleanupTestData(results) {
    try {
      // Supprimer les utilisateurs de test
      const testUsersResult = await query(
        `DELETE FROM users 
         WHERE email LIKE '%test%' 
         OR email LIKE '%demo%' 
         OR first_name LIKE '%Test%' 
         OR company_name LIKE '%Test%'`
      )

      results.cleaned.testData = {
        testUsers: testUsersResult.rowCount || 0,
      }
      results.totalDeleted += testUsersResult.rowCount || 0

      if (testUsersResult.rowCount > 0) {
        console.log(`🗑️ ${testUsersResult.rowCount} comptes de test supprimés`)
      }
    } catch (error) {
      console.error('Erreur lors du nettoyage des données de test:', error)
      results.errors.testData = error.message
    }
  }

  /**
   * Archive les factures anciennes avant leur suppression
   */
  async archiveOldInvoices(results) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 10)

      // Trouver les factures très anciennes non archivées
      const oldInvoicesResult = await query(
        `SELECT * FROM invoices 
         WHERE created_at < $1 
         AND is_archived = false`,
        [cutoffDate]
      )

      const oldInvoices = oldInvoicesResult.rows

      if (oldInvoices.length > 0) {
        console.log(`📦 ${oldInvoices.length} factures anciennes à archiver`)

        for (const invoice of oldInvoices) {
          try {
            // Générer le PDF et l'archiver
            const PDFService = require('./pdfServiceSimple')
            const companySettings = await query(
              'SELECT * FROM company_settings WHERE user_id = $1',
              [invoice.user_id]
            )

            if (companySettings.rows.length > 0) {
              const pdfService = new PDFService()
              const pdfBuffer = await pdfService.generateInvoicePDF(
                invoice,
                companySettings.rows[0]
              )
              await archivingService.archiveInvoice(invoice, pdfBuffer)
            }
          } catch (error) {
            console.error(
              `Erreur lors de l'archivage de la facture ${invoice.invoice_number}:`,
              error
            )
          }
        }

        results.cleaned.archivedOldInvoices = oldInvoices.length
        console.log(`📦 ${oldInvoices.length} factures anciennes archivées`)
      }
    } catch (error) {
      console.error("Erreur lors de l'archivage des factures anciennes:", error)
      results.errors.archivedOldInvoices = error.message
    }
  }

  /**
   * Génère un rapport de conformité RGPD
   */
  async generateComplianceReport() {
    try {
      const report = {
        generatedAt: new Date().toISOString(),
        dataTypes: {},
        complianceScore: 0,
        recommendations: [],
      }

      // Analyser chaque type de données
      for (const [type, policy] of Object.entries(this.retentionPolicies)) {
        const cutoffDate = new Date()
        if (policy.years) {
          cutoffDate.setFullYear(cutoffDate.getFullYear() - policy.years)
        } else if (policy.months) {
          cutoffDate.setMonth(cutoffDate.getMonth() - policy.months)
        }

        const expiredResult = await query(
          `SELECT COUNT(*) as count FROM ${policy.table} WHERE ${policy.dateColumn} < $1`,
          [cutoffDate]
        )

        const totalResult = await query(
          `SELECT COUNT(*) as count FROM ${policy.table}`
        )

        const expired = parseInt(expiredResult.rows[0].count)
        const total = parseInt(totalResult.rows[0].count)

        report.dataTypes[type] = {
          total,
          expired,
          complianceRate:
            total > 0 ? (((total - expired) / total) * 100).toFixed(1) : 100,
          retentionPolicy: `${policy.years ? policy.years + ' ans' : policy.months + ' mois'}`,
          cutoffDate: cutoffDate.toISOString(),
        }

        // Recommandations
        if (expired > 0) {
          report.recommendations.push({
            type: 'cleanup',
            severity: expired > total * 0.1 ? 'high' : 'medium',
            message: `${expired} enregistrements expirés dans ${policy.table} nécessitent un nettoyage`,
            action: `Exécuter le nettoyage automatique pour ${policy.table}`,
          })
        }
      }

      // Calculer le score de conformité global
      const totalRecords = Object.values(report.dataTypes).reduce(
        (sum, data) => sum + data.total,
        0
      )
      const totalExpired = Object.values(report.dataTypes).reduce(
        (sum, data) => sum + data.expired,
        0
      )
      report.complianceScore =
        totalRecords > 0
          ? Math.round(((totalRecords - totalExpired) / totalRecords) * 100)
          : 100

      return report
    } catch (error) {
      console.error(
        'Erreur lors de la génération du rapport de conformité:',
        error
      )
      throw error
    }
  }
}

module.exports = new DataRetentionService()
