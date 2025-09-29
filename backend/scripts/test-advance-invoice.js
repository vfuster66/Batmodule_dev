const { query, transaction } = require('../src/config/database')
const advanceInvoiceService = require('../src/services/advanceInvoiceService')

async function testAdvanceInvoice() {
  console.log("🧪 Test de création d'une facture d'acompte...")

  try {
    const params = {
      userId: '57ea133f-838c-43a1-bd75-475e05966852',
      clientId: '652ea741-af40-4fbc-94b1-21e18b249c84',
      quoteId: 'e1ef23f5-16e6-4891-8819-eb8e8dcfc180',
      title: 'Acompte – Rénovation Séjour',
      description: 'Acompte pour la rénovation du séjour',
      advanceAmount: 832.86,
      dueDate: new Date('2025-10-27'),
      notes: 'Acompte de 30%',
    }

    const invoice = await advanceInvoiceService.createAdvanceInvoice(params)
    console.log("✅ Facture d'acompte créée:", {
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      totalTtc: invoice.total_ttc,
    })

    // Vérifier les items créés
    const itemsResult = await query(
      `SELECT id, description, section_id, sort_order 
       FROM invoice_items 
       WHERE invoice_id = $1 
       ORDER BY sort_order`,
      [invoice.id]
    )

    console.log('📋 Items de la facture:')
    itemsResult.rows.forEach((item, index) => {
      console.log(
        `  ${index + 1}. ${item.description} (section: ${item.section_id})`
      )
    })

    // Vérifier les sections
    const sectionsResult = await query(
      `SELECT id, title, sort_order 
       FROM quote_sections 
       WHERE quote_id = $1 
       ORDER BY sort_order`,
      [params.quoteId]
    )

    console.log('📂 Sections du devis:')
    sectionsResult.rows.forEach((section, index) => {
      console.log(`  ${index + 1}. ${section.title} (id: ${section.id})`)
    })
  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

testAdvanceInvoice()
  .then(() => {
    console.log('✅ Test terminé')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })
