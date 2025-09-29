const { query } = require('../src/config/database')

async function verifyAmounts() {
  console.log('🔍 Vérification des montants...')

  try {
    // Récupérer la facture d'acompte
    const invoiceResult = await query(
      `SELECT i.*, c.first_name, c.last_name, c.company_name, c.email, c.phone, c.address_line1, c.city, c.postal_code, c.country
             FROM invoices i
             JOIN clients c ON i.client_id = c.id
             WHERE i.id = $1`,
      ['f52acca1-b165-4da4-808d-940a68830ead']
    )

    const invoice = invoiceResult.rows[0]

    console.log("📊 Données de la facture d'acompte:")
    console.log(`  - Total TTC de la facture: ${invoice.total_ttc}€`)
    console.log(`  - Total HT de la facture: ${invoice.subtotal_ht}€`)
    console.log(`  - TVA de la facture: ${invoice.total_vat}€`)
    console.log(`  - Total TTC du devis: ${invoice.quote_total_ttc}€`)

    // Calculs attendus pour le PDF
    const totalTtc = Number(invoice.quote_total_ttc || 0) // 2776.20€
    const totalHt = totalTtc / 1.2 // 2313.50€
    const totalVat = totalTtc - totalHt // 462.70€

    const acompteTtc = Number(invoice.total_ttc || 0) // 832.86€
    const acompteHt = Number(invoice.subtotal_ht || 0) // 693.05€
    const acompteVat = Number(invoice.total_vat || 0) // 138.61€

    const remainingTtc = totalTtc - acompteTtc // 1943.34€
    const remainingHt = totalHt - acompteHt // 1620.45€
    const remainingVat = totalVat - acompteVat // 324.09€

    console.log('\n📋 Montants attendus dans le PDF:')
    console.log("  MONTANTS TOTAUX (du devis d'origine):")
    console.log(`    - Montant total HT: ${totalHt.toFixed(2)}€`)
    console.log(`    - Montant total TVA: ${totalVat.toFixed(2)}€`)
    console.log(`    - Montant total TTC: ${totalTtc.toFixed(2)}€`)

    console.log("\n  MONTANTS DE L'ACOMPTE:")
    console.log(`    - Montant de l'acompte HT: ${acompteHt.toFixed(2)}€`)
    console.log(`    - Montant de l'acompte TVA: ${acompteVat.toFixed(2)}€`)
    console.log(`    - Montant de l'acompte TTC: ${acompteTtc.toFixed(2)}€`)

    console.log('\n  RESTANT À RÉGLER:')
    console.log(`    - Restant à régler HT: ${remainingHt.toFixed(2)}€`)
    console.log(`    - Restant à régler TVA: ${remainingVat.toFixed(2)}€`)
    console.log(`    - Restant à régler TTC: ${remainingTtc.toFixed(2)}€`)

    console.log('\n✅ Vérification terminée')
  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

verifyAmounts()
  .then(() => {
    console.log('✅ Test terminé')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })
