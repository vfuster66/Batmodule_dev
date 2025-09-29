const { query } = require('../src/config/database')
const pdfService = require('../src/services/pdfServiceSimple')

async function testPDF() {
  console.log('🧪 Test de génération PDF...')

  try {
    // Récupérer la facture d'acompte créée
    const invoiceResult = await query(
      `SELECT i.*, c.first_name, c.last_name, c.company_name, c.email, c.phone, c.address_line1, c.city, c.postal_code, c.country
             FROM invoices i
             JOIN clients c ON i.client_id = c.id
             WHERE i.id = $1`,
      ['f52acca1-b165-4da4-808d-940a68830ead']
    )

    if (invoiceResult.rows.length === 0) {
      throw new Error('Facture non trouvée')
    }

    const invoice = invoiceResult.rows[0]
    console.log('📄 Facture trouvée:', {
      id: invoice.id,
      title: invoice.title,
      totalTtc: invoice.total_ttc,
      quoteTotalTtc: invoice.quote_total_ttc,
      invoiceType: invoice.invoice_type,
    })

    // Récupérer les items de la facture
    const itemsResult = await query(
      `SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY sort_order`,
      [invoice.id]
    )

    console.log('📋 Items de la facture:', itemsResult.rows.length)

    // Récupérer les sections si c'est une facture d'acompte
    let sections = []
    if (invoice.quote_id) {
      const sectionsResult = await query(
        `SELECT * FROM quote_sections WHERE quote_id = $1 ORDER BY sort_order`,
        [invoice.quote_id]
      )
      sections = sectionsResult.rows
    }

    console.log('📂 Sections:', sections.length)

    // Préparer les données pour le PDF
    const invoiceData = {
      ...invoice,
      items: itemsResult.rows.map((item) => ({
        id: item.id,
        serviceId: item.service_id,
        description: item.description,
        unit: item.unit,
        quantity: parseFloat(item.quantity),
        unitPriceHt: parseFloat(item.unit_price_ht),
        unitPriceTtc: parseFloat(item.unit_price_ttc),
        vatRate: parseFloat(item.vat_rate),
        discountPercent: item.discount_percent
          ? parseFloat(item.discount_percent)
          : null,
        markupPercent: item.markup_percent
          ? parseFloat(item.markup_percent)
          : null,
        totalHt: parseFloat(item.total_ht),
        totalTtc: parseFloat(item.total_ttc),
        sortOrder: item.sort_order,
        sectionId: item.section_id,
      })),
      sections: sections.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        sortOrder: s.sort_order,
      })),
    }

    // Générer le PDF
    console.log('🔄 Génération du PDF...')
    const pdfBuffer = await pdfService.generateInvoicePDF(invoiceData, invoice)

    console.log(
      '✅ PDF généré avec succès, taille:',
      pdfBuffer.length,
      'octets'
    )

    // Sauvegarder le PDF pour inspection
    const fs = require('fs')
    fs.writeFileSync('/tmp/test-invoice-generated.pdf', pdfBuffer)
    console.log('💾 PDF sauvegardé dans /tmp/test-invoice-generated.pdf')
  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

testPDF()
  .then(() => {
    console.log('✅ Test terminé')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })
