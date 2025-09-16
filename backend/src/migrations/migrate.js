#!/usr/bin/env node

/**
 * Script de migration simple pour BatModule
 * Ce script vérifie la connexion à la base de données et peut être étendu
 * pour exécuter des migrations réelles si nécessaire.
 */

const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://test:test@localhost:5432/batmodule_test',
})

async function runMigrations() {
  const client = await pool.connect()

  try {
    console.log('🔍 Vérification de la connexion à la base de données...')

    // Test de connexion
    const result = await client.query('SELECT NOW()')
    console.log('✅ Connexion à la base de données réussie')
    console.log(`📅 Heure du serveur: ${result.rows[0].now}`)

    // Vérifier si les tables principales existent
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `)

    console.log(`📊 Tables existantes: ${tablesResult.rows.length}`)

    if (tablesResult.rows.length === 0) {
      console.log('⚠️  Aucune table trouvée - la base de données est vide')
      console.log(
        '💡 Pour créer les tables, exécutez les scripts SQL appropriés'
      )
    } else {
      console.log('📋 Tables trouvées:')
      tablesResult.rows.forEach((row) => {
        console.log(`   - ${row.table_name}`)
      })
    }

    console.log('✅ Migration terminée avec succès')
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

// Exécuter les migrations
runMigrations().catch((error) => {
  console.error('❌ Erreur fatale:', error)
  process.exit(1)
})
