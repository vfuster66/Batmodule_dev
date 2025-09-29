#!/usr/bin/env node

/**
 * Script pour traiter les rappels automatiques
 * À exécuter quotidiennement via un cron job
 */

const reminderService = require('../backend/src/services/reminderService')

async function main() {
  try {
    console.log('🔄 Démarrage du traitement des rappels automatiques...')
    await reminderService.processReminders()
    console.log('✅ Traitement des rappels terminé avec succès')
    process.exit(0)
  } catch (error) {
    console.error('❌ Erreur lors du traitement des rappels:', error)
    process.exit(1)
  }
}

// Exécuter le script
main()
