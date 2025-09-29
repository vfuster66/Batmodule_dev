const express = require('express')
const path = require('path')
const fs = require('fs').promises
const { authenticateToken } = require('../middleware/auth')
const rgpdService = require('../services/rgpdService')
const { query, transaction } = require('../config/database')

const router = express.Router()

// Route pour exporter les données personnelles d'un utilisateur
router.get('/export', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId

    // Exporter les données
    const exportData = await rgpdService.exportUserData(userId)

    // Sauvegarder dans un fichier
    const filePath = await rgpdService.saveExportToFile(userId, exportData)

    res.json({
      message: 'Export des données personnelles généré avec succès',
      downloadUrl: `/api/rgpd/download/${path.basename(filePath)}`,
      exportDate: exportData.exportMetadata.exportDate,
      dataTypes: exportData.exportMetadata.dataTypes,
    })
  } catch (error) {
    console.error("Erreur lors de l'export des données:", error)
    res
      .status(500)
      .json({ error: "Erreur lors de l'export des données personnelles" })
  }
})

// Route pour télécharger un export
router.get('/download/:filename', authenticateToken, async (req, res) => {
  try {
    const { filename } = req.params
    const userId = req.user.userId

    // Vérifier que le fichier appartient à l'utilisateur
    if (!filename.startsWith(`export_user_${userId}_`)) {
      return res.status(403).json({ error: 'Accès non autorisé à ce fichier' })
    }

    const filePath = path.join(rgpdService.exportDir, filename)

    // Vérifier que le fichier existe
    try {
      await fs.access(filePath)
    } catch {
      return res.status(404).json({ error: "Fichier d'export non trouvé" })
    }

    res.download(filePath, filename, (err) => {
      // istanbul ignore else
      if (err) {
        console.error('Erreur lors du téléchargement:', err)
        // istanbul ignore next
        res.status(500).json({ error: 'Erreur lors du téléchargement' })
      }
    })
  } catch (error) {
    // istanbul ignore next
    console.error('Erreur lors du téléchargement:', error)
    // istanbul ignore next
    res.status(500).json({ error: 'Erreur lors du téléchargement' })
  }
})

// Route pour supprimer les données personnelles d'un utilisateur
router.delete('/delete-data', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId
    const { keepAccountingData = true } = req.body

    // Confirmation requise pour la suppression
    const { confirm } = req.body
    if (!confirm) {
      return res.status(400).json({
        error: 'Confirmation requise',
        message:
          'Vous devez confirmer la suppression de vos données personnelles',
      })
    }

    const result = await rgpdService.deleteUserData(userId, keepAccountingData)

    res.json({
      message: 'Données personnelles supprimées avec succès',
      result,
    })
  } catch (error) {
    console.error('Erreur lors de la suppression des données:', error)
    res.status(500).json({
      error: 'Erreur lors de la suppression des données personnelles',
    })
  }
})

// Route pour purger les données selon la politique de rétention
router.post('/purge', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin (à implémenter selon votre logique)
    const { retentionPolicy } = req.body

    const result = await rgpdService.purgeDataByRetentionPolicy(retentionPolicy)

    res.json({
      message: 'Purge des données effectuée avec succès',
      result,
    })
  } catch (error) {
    console.error('Erreur lors de la purge des données:', error)
    res.status(500).json({ error: 'Erreur lors de la purge des données' })
  }
})

// Route pour générer un rapport de conformité RGPD
router.get('/compliance-report', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId

    const report = await rgpdService.generateRGPDComplianceReport(userId)

    res.json(report)
  } catch (error) {
    console.error('Erreur lors de la génération du rapport:', error)
    res
      .status(500)
      .json({ error: 'Erreur lors de la génération du rapport de conformité' })
  }
})

// Route pour obtenir les informations sur les traitements de données
router.get('/data-processing-info', authenticateToken, async (req, res) => {
  try {
    const dataProcessingInfo = {
      purposes: [
        'Gestion des clients et prospects',
        'Émission de devis et factures',
        'Suivi des paiements',
        'Archivage légal des documents comptables',
        'Communication commerciale',
      ],
      legalBasis: [
        'Exécution du contrat (art. 6.1.b RGPD)',
        'Intérêt légitime (art. 6.1.f RGPD)',
        'Obligation légale (art. 6.1.c RGPD)',
      ],
      dataTypes: [
        "Données d'identification (nom, prénom, email)",
        'Données de contact (téléphone, adresse)',
        'Données commerciales (devis, factures, paiements)',
        'Données de connexion (logs, IP)',
      ],
      retentionPeriods: {
        'Données de prospection': '3 ans',
        'Données comptables': '10 ans',
        'Logs de connexion': '1 an',
        'Données de facturation': '10 ans',
      },
      recipients: [
        'Prestataires de services (hébergement, email)',
        "Autorités compétentes (en cas d'obligation légale)",
      ],
      rights: [
        "Droit d'accès aux données",
        'Droit de rectification',
        "Droit d'effacement",
        'Droit à la portabilité',
        "Droit d'opposition",
        'Droit de limitation du traitement',
      ],
      contact: {
        email: 'dpo@votre-entreprise.com',
        phone: '+33 1 23 45 67 89',
        address: 'Adresse de votre entreprise',
      },
    }

    res.json(dataProcessingInfo)
  } catch (error) {
    // istanbul ignore next
    console.error('Erreur lors de la récupération des informations:', error)
    // istanbul ignore next
    res
      .status(500)
      .json({ error: 'Erreur lors de la récupération des informations' })
  }
})

// GET /api/rgpd/data-summary - Résumé des données pour le tableau de bord
router.get('/data-summary', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.userId

    // Compter les différents types de données
    const [
      usersResult,
      clientsResult,
      quotesResult,
      invoicesResult,
      paidInvoicesResult,
      expiredResult,
    ] = await Promise.all([
      query('SELECT COUNT(*) as count FROM users WHERE id = $1', [userId]),
      query('SELECT COUNT(*) as count FROM clients WHERE user_id = $1', [
        userId,
      ]),
      query('SELECT COUNT(*) as count FROM quotes WHERE user_id = $1', [
        userId,
      ]),
      query('SELECT COUNT(*) as count FROM invoices WHERE user_id = $1', [
        userId,
      ]),
      query(
        "SELECT COUNT(*) as count FROM invoices WHERE user_id = $1 AND status = 'paid'",
        [userId]
      ),
      query(
        `
        SELECT COUNT(*) as count FROM invoices 
        WHERE user_id = $1 AND created_at < NOW() - INTERVAL '10 years'
      `,
        [userId]
      ),
    ])

    const totalRecords =
      parseInt(usersResult.rows[0].count) +
      parseInt(clientsResult.rows[0].count) +
      parseInt(quotesResult.rows[0].count) +
      parseInt(invoicesResult.rows[0].count)

    // Types de données avec détails
    const dataTypes = [
      {
        type: 'users',
        name: 'Données utilisateur',
        count: parseInt(usersResult.rows[0].count),
        lastModified: new Date().toISOString(),
        retention: 'Durée de vie du compte',
      },
      {
        type: 'clients',
        name: 'Données clients',
        count: parseInt(clientsResult.rows[0].count),
        lastModified: new Date().toISOString(),
        retention: '3 ans après fin de relation',
      },
      {
        type: 'quotes',
        name: 'Devis',
        count: parseInt(quotesResult.rows[0].count),
        lastModified: new Date().toISOString(),
        retention: '10 ans (obligation légale)',
      },
      {
        type: 'invoices',
        name: 'Factures',
        count: parseInt(invoicesResult.rows[0].count),
        lastModified: new Date().toISOString(),
        retention: '10 ans (obligation légale)',
      },
    ]

    // Récupérer le score de conformité légale des paramètres d'entreprise
    const companySettingsService = require('../services/companySettingsService')
    const companySettings = await query(
      'SELECT * FROM company_settings WHERE user_id = $1',
      [userId]
    )

    let complianceScore = 0
    if (companySettings.rows.length > 0) {
      complianceScore = companySettingsService.calculateComplianceScore(
        companySettings.rows[0]
      )
    }

    // Utiliser la variable déjà déclarée dans Promise.all
    const paidInvoicesCount = parseInt(paidInvoicesResult.rows[0].count)

    res.json({
      summary: {
        totalRecords,
        paidDocuments: paidInvoicesCount,
        expiredRecords: parseInt(expiredResult.rows[0].count),
      },
      dataTypes,
      complianceScore,
    })
  } catch (error) {
    console.error('Erreur lors du chargement du résumé des données:', error)
    next(error)
  }
})

// DELETE /api/rgpd/delete-account - Suppression définitive du compte
router.delete('/delete-account', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.userId

    // Vérifier que l'utilisateur confirme la suppression
    const { confirmation } = req.body
    if (confirmation !== 'SUPPRIMER') {
      return res.status(400).json({
        error: 'Confirmation requise',
        message: 'Vous devez confirmer la suppression en tapant "SUPPRIMER"',
      })
    }

    // Supprimer toutes les données en transaction
    await transaction(async (client) => {
      // Supprimer dans l'ordre pour respecter les contraintes de clés étrangères
      await client.query(
        'DELETE FROM payments WHERE invoice_id IN (SELECT id FROM invoices WHERE user_id = $1)',
        [userId]
      )
      await client.query(
        'DELETE FROM invoice_items WHERE invoice_id IN (SELECT id FROM invoices WHERE user_id = $1)',
        [userId]
      )
      await client.query(
        'DELETE FROM quote_items WHERE quote_id IN (SELECT id FROM quotes WHERE user_id = $1)',
        [userId]
      )
      await client.query('DELETE FROM invoices WHERE user_id = $1', [userId])
      await client.query('DELETE FROM quotes WHERE user_id = $1', [userId])
      await client.query('DELETE FROM clients WHERE user_id = $1', [userId])
      await client.query('DELETE FROM company_settings WHERE user_id = $1', [
        userId,
      ])
      await client.query('DELETE FROM users WHERE id = $1', [userId])
    })

    res.json({
      success: true,
      message: 'Compte et toutes les données supprimés avec succès',
    })
  } catch (error) {
    console.error('Erreur lors de la suppression du compte:', error)
    next(error)
  }
})

// POST /api/rgpd/cleanup - Déclencher le nettoyage automatique des données expirées
router.post('/cleanup', authenticateToken, async (req, res, next) => {
  try {
    const dataRetentionService = require('../services/dataRetentionService')

    // Exécuter le nettoyage
    const results = await dataRetentionService.cleanupExpiredData(
      req.user.userId
    )

    // Enregistrer l'action dans l'audit
    const { logAudit } = require('../services/auditService')
    await logAudit({
      userId: req.user.userId,
      action: 'data_cleanup_executed',
      resourceType: 'system',
      resourceId: 'data_retention',
      details: {
        totalDeleted: results.totalDeleted,
        cleaned: results.cleaned,
        errors: results.errors,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    })

    res.json({
      success: true,
      message: 'Nettoyage automatique des données expirées exécuté',
      results,
    })
  } catch (error) {
    console.error('Erreur lors du nettoyage des données:', error)
    next(error)
  }
})

// GET /api/rgpd/compliance-report - Générer un rapport de conformité
router.get('/compliance-report', authenticateToken, async (req, res, next) => {
  try {
    const dataRetentionService = require('../services/dataRetentionService')

    const report = await dataRetentionService.generateComplianceReport()

    res.json({
      success: true,
      report,
    })
  } catch (error) {
    console.error('Erreur lors de la génération du rapport:', error)
    next(error)
  }
})

module.exports = router
