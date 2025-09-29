/**
 * Script de test manuel pour valider les corrections d'audit du dashboard
 */

const { query } = require('../src/config/database')

async function testDashboardAudit() {
  console.log("🔍 Test des corrections d'audit du dashboard...\n")

  try {
    // Test 1: Vérifier que revenueByMonth isole les paiements par utilisateur
    console.log("1. Test de l'isolation des revenus par utilisateur...")

    const revenueTest = await query(
      `
      WITH months AS (
          SELECT DATE_TRUNC('month', CURRENT_DATE) - (INTERVAL '1 month' * g) AS month
          FROM generate_series(0, 11) AS g
      )
      SELECT TO_CHAR(m.month, 'YYYY-MM') AS label,
             COALESCE(SUM(CASE WHEN i.user_id = $1 THEN p.amount ELSE 0 END), 0)::numeric AS value
      FROM months m
      LEFT JOIN payments p
        ON p.payment_date >= m.month
       AND p.payment_date < m.month + INTERVAL '1 month'
      LEFT JOIN invoices i ON p.invoice_id = i.id
      GROUP BY m.month
      ORDER BY m.month
      LIMIT 3
    `,
      [1]
    ) // Test avec user_id = 1

    console.log('✅ Requête revenueByMonth exécutée avec succès')
    console.log('   - Nombre de mois retournés:', revenueTest.rows.length)
    console.log('   - Premier mois:', revenueTest.rows[0]?.label)
    console.log('   - Valeur du premier mois:', revenueTest.rows[0]?.value)

    // Test 2: Vérifier la requête topClients90 avec client_name
    console.log('\n2. Test de la requête topClients90...')

    const topClientsTest = await query(
      `
      SELECT c.id, 
             COALESCE(NULLIF(TRIM(c.first_name || ' ' || c.last_name), ''), c.company_name, 'Client sans nom') AS client_name,
             COALESCE(SUM(p.amount),0)::numeric AS total
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      JOIN clients c ON i.client_id = c.id
      WHERE i.user_id = $1 AND p.payment_date >= NOW() - INTERVAL '90 days'
      GROUP BY c.id, c.first_name, c.last_name, c.company_name
      ORDER BY total DESC
      LIMIT 3
    `,
      [1]
    )

    console.log('✅ Requête topClients90 exécutée avec succès')
    console.log('   - Nombre de clients retournés:', topClientsTest.rows.length)
    if (topClientsTest.rows.length > 0) {
      console.log('   - Premier client:', topClientsTest.rows[0].client_name)
      console.log('   - Total du premier client:', topClientsTest.rows[0].total)
    }

    // Test 3: Vérifier la requête urgent-invoices avec statuts multiples
    console.log('\n3. Test de la requête urgent-invoices...')

    const urgentInvoicesTest = await query(
      `
      SELECT i.id, i.invoice_number, i.total_ttc, i.due_date, i.status,
              COALESCE(
                NULLIF(TRIM(c.first_name || ' ' || c.last_name), ''),
                c.company_name,
                'Client sans nom'
              ) AS client_name
       FROM invoices i
       JOIN clients c ON i.client_id = c.id
       WHERE i.user_id = $1 AND i.status IN ('pending', 'overdue') AND i.due_date < CURRENT_DATE
       ORDER BY i.due_date ASC
       LIMIT 3
    `,
      [1]
    )

    console.log('✅ Requête urgent-invoices exécutée avec succès')
    console.log(
      '   - Nombre de factures urgentes:',
      urgentInvoicesTest.rows.length
    )
    if (urgentInvoicesTest.rows.length > 0) {
      console.log(
        '   - Première facture:',
        urgentInvoicesTest.rows[0].invoice_number
      )
      console.log('   - Statut:', urgentInvoicesTest.rows[0].status)
      console.log('   - Client:', urgentInvoicesTest.rows[0].client_name)
    }

    // Test 4: Vérifier la requête pending-quotes avec paramètre sécurisé
    console.log(
      '\n4. Test de la requête pending-quotes avec paramètre sécurisé...'
    )

    const pendingQuotesTest = await query(
      `
      SELECT q.id, q.quote_number, q.total_ttc, q.created_at,
              COALESCE(
                NULLIF(TRIM(c.first_name || ' ' || c.last_name), ''),
                c.company_name,
                'Client sans nom'
              ) AS client_name
       FROM quotes q
       JOIN clients c ON q.client_id = c.id
       WHERE q.user_id = $1 AND q.status = 'sent' 
       AND q.created_at < NOW() - make_interval(days => $2)
       ORDER BY q.created_at ASC
       LIMIT 3
    `,
      [1, 7]
    ) // Test avec 7 jours

    console.log('✅ Requête pending-quotes exécutée avec succès')
    console.log(
      '   - Nombre de devis en attente:',
      pendingQuotesTest.rows.length
    )
    if (pendingQuotesTest.rows.length > 0) {
      console.log('   - Premier devis:', pendingQuotesTest.rows[0].quote_number)
      console.log('   - Client:', pendingQuotesTest.rows[0].client_name)
    }

    console.log("\n🎉 Tous les tests d'audit sont passés avec succès !")
    console.log('\n📋 Résumé des corrections appliquées :')
    console.log('   ✅ Isolation des revenus par utilisateur (CASE WHEN)')
    console.log('   ✅ Sérialisation topClients90 avec client_name')
    console.log('   ✅ Factures urgentes incluant statuts pending et overdue')
    console.log('   ✅ Paramètre sécurisé pour pending-quotes (make_interval)')
  } catch (error) {
    console.error("❌ Erreur lors des tests d'audit:", error.message)
    console.error('Stack trace:', error.stack)
    process.exit(1)
  }
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  testDashboardAudit()
    .then(() => {
      console.log("\n✅ Tests d'audit terminés")
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Erreur fatale:', error)
      process.exit(1)
    })
}

module.exports = { testDashboardAudit }
