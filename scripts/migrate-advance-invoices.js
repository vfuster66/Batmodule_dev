const { query, transaction } = require('../src/config/database')

/**
 * Script de migration pour mettre à jour les factures d'acompte existantes
 * en ajoutant les items du devis d'origine
 */
async function migrateAdvanceInvoices() {
  console.log("🔄 Début de la migration des factures d'acompte...")

  try {
    // Récupérer toutes les factures d'acompte
    const advanceInvoicesResult = await query(
      `SELECT i.id, i.quote_id, i.invoice_number, i.user_id
       FROM invoices i
       WHERE i.invoice_type = 'acompte' AND i.quote_id IS NOT NULL
       ORDER BY i.created_at`
    )

    console.log(
      `📊 ${advanceInvoicesResult.rows.length} factures d'acompte trouvées`
    )

    for (const invoice of advanceInvoicesResult.rows) {
      console.log(`\n🔍 Traitement de la facture ${invoice.invoice_number}...`)

      await transaction(async (client) => {
        // Vérifier si la facture a déjà des items du devis
        const existingItemsResult = await client.query(
          `SELECT COUNT(*) as count FROM invoice_items 
           WHERE invoice_id = $1 AND description NOT LIKE 'Acompte sur%'`,
          [invoice.id]
        )

        const hasQuoteItems = parseInt(existingItemsResult.rows[0].count) > 0

        if (hasQuoteItems) {
          console.log(
            `  ✅ La facture ${invoice.invoice_number} a déjà des items du devis`
          )
          return
        }

        // Récupérer les items du devis d'origine
        const quoteItemsResult = await client.query(
          `SELECT description, quantity, unit, unit_price_ht, unit_price_ttc, vat_rate, 
                  total_ht, total_ttc, sort_order, section_id
           FROM quote_items 
           WHERE quote_id = $1 
           ORDER BY sort_order, created_at`,
          [invoice.quote_id]
        )

        if (quoteItemsResult.rows.length === 0) {
          console.log(
            `  ⚠️  Aucun item trouvé pour le devis ${invoice.quote_id}`
          )
          return
        }

        console.log(
          `  📝 Ajout de ${quoteItemsResult.rows.length} items du devis...`
        )

        // Ajouter les items du devis à la facture d'acompte
        for (const item of quoteItemsResult.rows) {
          await client.query(
            `INSERT INTO invoice_items (
                        invoice_id, service_id, description, quantity, unit, unit_price_ht, unit_price_ttc, 
                        vat_rate, total_ht, total_ttc, sort_order
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
              invoice.id,
              null, // service_id
              item.description,
              item.quantity,
              item.unit,
              item.unit_price_ht,
              item.unit_price_ttc,
              item.vat_rate,
              item.total_ht,
              item.total_ttc,
              item.sort_order,
            ]
          )
        }

        console.log(
          `  ✅ Facture ${invoice.invoice_number} mise à jour avec succès`
        )
      })
    }

    console.log('\n🎉 Migration terminée avec succès !')
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
    process.exit(1)
  }
}

// Exécuter la migration si le script est appelé directement
if (require.main === module) {
  migrateAdvanceInvoices()
    .then(() => {
      console.log('✅ Migration terminée')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Erreur:', error)
      process.exit(1)
    })
}

module.exports = { migrateAdvanceInvoices }
