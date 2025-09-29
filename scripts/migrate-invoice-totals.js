#!/usr/bin/env node

/**
 * Script de migration pour mettre à jour les factures existantes
 * avec le total du devis (quote_total_ttc)
 */

const { Pool } = require('pg')

async function migrateInvoiceTotals() {
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL ||
      'postgresql://batmodule:batmodule123@localhost:5432/batmodule',
  })

  const client = await pool.connect()

  try {
    console.log('🔄 Démarrage de la migration des totaux de factures...')

    // Récupérer toutes les factures qui ont un quote_id mais pas de quote_total_ttc
    const invoicesResult = await client.query(`
      SELECT i.id, i.quote_id, i.user_id, i.total_ttc, i.invoice_type
      FROM invoices i
      WHERE i.quote_id IS NOT NULL 
      AND (i.quote_total_ttc IS NULL OR i.quote_total_ttc = 0)
    `)

    console.log(`📊 ${invoicesResult.rows.length} factures à migrer`)

    for (const invoice of invoicesResult.rows) {
      try {
        // Récupérer le total du devis
        const quoteResult = await client.query(
          'SELECT total_ttc FROM quotes WHERE id = $1 AND user_id = $2',
          [invoice.quote_id, invoice.user_id]
        )

        if (quoteResult.rows.length === 0) {
          console.log(`⚠️ Devis non trouvé pour la facture ${invoice.id}`)
          continue
        }

        const quoteTotalTtc = quoteResult.rows[0].total_ttc

        // Mettre à jour la facture
        await client.query(
          'UPDATE invoices SET quote_total_ttc = $1 WHERE id = $2',
          [quoteTotalTtc, invoice.id]
        )

        console.log(
          `✅ Facture ${invoice.id} (${invoice.invoice_type}) mise à jour: ${invoice.total_ttc}€ -> ${quoteTotalTtc}€`
        )
      } catch (error) {
        console.error(`❌ Erreur pour la facture ${invoice.id}:`, error.message)
      }
    }

    console.log('🎉 Migration terminée avec succès!')
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

// Exécuter la migration
migrateInvoiceTotals()
  .then(() => {
    console.log('✅ Migration terminée')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })
