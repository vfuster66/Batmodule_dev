#!/usr/bin/env node

/**
 * Script pour appliquer la migration de numérotation des services
 */

const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// Configuration de la base de données
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://batmodule:batmodule123@localhost:5432/batmodule',
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
})

async function applyMigration() {
  const client = await pool.connect()

  try {
    console.log(
      '🔄 Application de la migration de numérotation des services...'
    )

    // Lire le fichier de migration
    const migrationPath = path.join(
      __dirname,
      '../database/migrations/2025-01-add-service-numbering.sql'
    )
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    // Exécuter la migration
    await client.query(migrationSQL)

    console.log('✅ Migration appliquée avec succès !')

    // Vérifier que les colonnes ont été ajoutées
    const categoryCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'service_categories' 
      AND column_name = 'category_number'
    `)

    const serviceCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'services' 
      AND column_name = 'service_number'
    `)

    if (categoryCheck.rows.length > 0 && serviceCheck.rows.length > 0) {
      console.log('✅ Colonnes de numérotation ajoutées avec succès')
    } else {
      console.log("⚠️  Problème avec l'ajout des colonnes")
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'application de la migration:", error)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

// Exécuter la migration
applyMigration()
