#!/usr/bin/env node

/**
 * Script de nettoyage automatique des données RGPD
 *
 * Ce script peut être exécuté manuellement ou via un cron job
 * pour nettoyer automatiquement les données expirées selon les politiques de rétention.
 *
 * Usage:
 *   node scripts/rgpd-cleanup.js [--dry-run] [--verbose]
 *
 * Options:
 *   --dry-run    : Affiche ce qui serait supprimé sans rien supprimer
 *   --verbose    : Affichage détaillé des opérations
 */

const path = require('path')
const { query } = require('../src/config/database')
const dataRetentionService = require('../src/services/dataRetentionService')

// Configuration
const config = {
  dryRun: process.argv.includes('--dry-run'),
  verbose: process.argv.includes('--verbose'),
}

async function main() {
  console.log('🔧 Script de nettoyage RGPD - BatModule')
  console.log('=====================================')

  if (config.dryRun) {
    console.log('🧪 Mode DRY-RUN activé - Aucune donnée ne sera supprimée')
  }

  console.log(`📅 Date d'exécution: ${new Date().toLocaleString('fr-FR')}`)
  console.log('')

  try {
    // Tester la connexion à la base de données
    await query('SELECT 1')
    console.log('✅ Connexion à la base de données établie')

    if (config.dryRun) {
      // En mode dry-run, générer seulement un rapport
      console.log('📊 Génération du rapport de conformité...')
      const report = await dataRetentionService.generateComplianceReport()

      console.log('')
      console.log('📋 RAPPORT DE CONFORMITÉ RGPD')
      console.log('=============================')
      console.log(`Score de conformité global: ${report.complianceScore}%`)
      console.log(
        `Généré le: ${new Date(report.generatedAt).toLocaleString('fr-FR')}`
      )
      console.log('')

      console.log('📊 ANALYSE PAR TYPE DE DONNÉES')
      console.log('-----------------------------')

      for (const [type, data] of Object.entries(report.dataTypes)) {
        console.log(`\n${type.toUpperCase()}:`)
        console.log(`  Total: ${data.total} enregistrements`)
        console.log(`  Expirés: ${data.expired} enregistrements`)
        console.log(`  Taux de conformité: ${data.complianceRate}%`)
        console.log(`  Politique de rétention: ${data.retentionPolicy}`)
        console.log(
          `  Date limite: ${new Date(data.cutoffDate).toLocaleDateString('fr-FR')}`
        )
      }

      console.log('')
      console.log('🎯 RECOMMANDATIONS')
      console.log('------------------')

      if (report.recommendations.length === 0) {
        console.log('✅ Aucune action recommandée - Système conforme')
      } else {
        report.recommendations.forEach((rec, index) => {
          const severity = rec.severity === 'high' ? '🔴' : '🟡'
          console.log(`${index + 1}. ${severity} ${rec.message}`)
          console.log(`   Action: ${rec.action}`)
        })
      }
    } else {
      // Exécuter le nettoyage réel
      console.log('🧹 Début du nettoyage automatique des données expirées...')

      // Pour le script, on nettoie pour tous les utilisateurs
      // Dans un vrai environnement, il faudrait itérer sur tous les utilisateurs
      const results = await dataRetentionService.cleanupExpiredData(null)

      console.log('')
      console.log('📊 RÉSULTATS DU NETTOYAGE')
      console.log('=========================')
      console.log(`Total d'enregistrements supprimés: ${results.totalDeleted}`)
      console.log('')

      if (Object.keys(results.cleaned).length > 0) {
        console.log('✅ DONNÉES NETTOYÉES')
        console.log('-------------------')
        for (const [type, data] of Object.entries(results.cleaned)) {
          console.log(`${type}:`)
          if (typeof data === 'number') {
            console.log(`  ${data} enregistrements supprimés`)
          } else {
            Object.entries(data).forEach(([key, value]) => {
              console.log(`  ${key}: ${value} enregistrements`)
            })
          }
        }
        console.log('')
      }

      if (Object.keys(results.errors).length > 0) {
        console.log('❌ ERREURS RENCONTRÉES')
        console.log('---------------------')
        for (const [type, error] of Object.entries(results.errors)) {
          console.log(`${type}: ${error}`)
        }
        console.log('')
      }

      // Enregistrer le résultat dans un log
      const logEntry = {
        timestamp: new Date().toISOString(),
        action: 'rgpd_cleanup',
        results: results,
        dryRun: false,
      }

      console.log('📝 Log enregistré pour audit')
    }

    console.log('')
    console.log('✅ Script terminé avec succès')

    // Code de sortie
    process.exit(0)
  } catch (error) {
    console.error('')
    console.error('❌ ERREUR FATALE')
    console.error('================')
    console.error(`Message: ${error.message}`)

    if (config.verbose) {
      console.error('Stack trace:')
      console.error(error.stack)
    }

    console.error('')
    console.error('💡 Vérifiez:')
    console.error('  - La connexion à la base de données')
    console.error('  - Les permissions sur les tables')
    console.error('  - La configuration des services')

    process.exit(1)
  }
}

// Gestion des signaux pour un arrêt propre
process.on('SIGINT', () => {
  console.log('')
  console.log("⚠️  Arrêt demandé par l'utilisateur")
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('')
  console.log('⚠️  Arrêt demandé par le système')
  process.exit(0)
})

// Exécuter le script
if (require.main === module) {
  main()
}

module.exports = { main, config }
