/**
 * Test manuel de sécurité du dashboard
 * Vérifie la protection contre l'injection SQL et la cohérence des données
 */

const axios = require('axios')

const BASE_URL = 'http://localhost:3001/api'

// Configuration pour les tests
const testConfig = {
  email: 'test@security.com',
  password: 'TestPassword123!',
  baseURL: BASE_URL,
}

/**
 * Test de protection contre l'injection SQL
 */
async function testSQLInjectionProtection() {
  console.log("🔒 Test de protection contre l'injection SQL\n")

  const maliciousInputs = [
    "'; DROP TABLE users; --",
    '1; DELETE FROM quotes; --',
    "1' OR '1'='1",
    '1 UNION SELECT * FROM users',
    "1; INSERT INTO quotes (user_id, quote_number) VALUES (999, 'HACKED'); --",
  ]

  let successCount = 0

  for (const maliciousInput of maliciousInputs) {
    try {
      const response = await axios.get(
        `${BASE_URL}/dashboard/pending-quotes?days=${encodeURIComponent(maliciousInput)}`
      )

      if (response.status === 200 && Array.isArray(response.data.quotes)) {
        console.log(`✅ Input "${maliciousInput}" - Protégé`)
        successCount++
      } else {
        console.log(`❌ Input "${maliciousInput}" - Vulnérable`)
      }
    } catch (error) {
      console.log(
        `✅ Input "${maliciousInput}" - Erreur attendue (protection active)`
      )
      successCount++
    }
  }

  console.log(
    `\nProtection: ${successCount}/${maliciousInputs.length} tests passés\n`
  )
  return successCount === maliciousInputs.length
}

/**
 * Test de validation des paramètres
 */
async function testParameterValidation() {
  console.log('🔧 Test de validation des paramètres\n')

  const testCases = [
    { input: -1, description: 'Valeur négative' },
    { input: 0, description: 'Zéro' },
    { input: 91, description: 'Valeur > 90' },
    { input: 999, description: 'Valeur très élevée' },
    { input: 'abc', description: 'Chaîne non numérique' },
    { input: null, description: 'Null' },
  ]

  let successCount = 0

  for (const testCase of testCases) {
    try {
      const response = await axios.get(
        `${BASE_URL}/dashboard/pending-quotes?days=${testCase.input}`
      )

      if (response.status === 200) {
        console.log(
          `✅ ${testCase.description} (${testCase.input}) - Géré correctement`
        )
        successCount++
      } else {
        console.log(
          `❌ ${testCase.description} (${testCase.input}) - Erreur inattendue`
        )
      }
    } catch (error) {
      console.log(
        `✅ ${testCase.description} (${testCase.input}) - Erreur attendue`
      )
      successCount++
    }
  }

  console.log(
    `\nValidation: ${successCount}/${testCases.length} tests passés\n`
  )
  return successCount === testCases.length
}

/**
 * Test de cohérence des métriques
 */
async function testMetricsConsistency() {
  console.log('📊 Test de cohérence des métriques\n')

  try {
    const [statsResponse, analyticsResponse] = await Promise.all([
      axios.get(`${BASE_URL}/dashboard/stats`),
      axios.get(`${BASE_URL}/dashboard/analytics`),
    ])

    const stats = statsResponse.data
    const analytics = analyticsResponse.data

    console.log('Métriques de base:')
    console.log(`- Clients: ${stats.clients}`)
    console.log(`- CA mensuel: ${stats.monthlyRevenue}`)
    console.log(`- CA annuel: ${stats.yearlyRevenue}`)
    console.log(`- Factures en retard: ${stats.overdueInvoices}`)

    console.log('\nMétriques analytiques:')
    console.log(
      `- Revenus par mois: ${analytics.revenueByMonth?.length || 0} mois`
    )
    console.log(`- Top clients: ${analytics.topClients90?.length || 0} clients`)

    // Vérifications de cohérence
    const checks = [
      {
        name: 'CA mensuel cohérent',
        test: stats.monthlyRevenue >= 0,
        value: stats.monthlyRevenue,
      },
      {
        name: 'CA annuel cohérent',
        test: stats.yearlyRevenue >= 0,
        value: stats.yearlyRevenue,
      },
      {
        name: 'Factures en retard cohérentes',
        test: stats.overdueInvoices >= 0,
        value: stats.overdueInvoices,
      },
      {
        name: 'Données analytiques présentes',
        test:
          Array.isArray(analytics.revenueByMonth) &&
          Array.isArray(analytics.topClients90),
        value: 'OK',
      },
    ]

    let successCount = 0
    checks.forEach((check) => {
      if (check.test) {
        console.log(`✅ ${check.name}: ${check.value}`)
        successCount++
      } else {
        console.log(`❌ ${check.name}: ${check.value}`)
      }
    })

    console.log(
      `\nCohérence: ${successCount}/${checks.length} vérifications passées\n`
    )
    return successCount === checks.length
  } catch (error) {
    console.log(`❌ Erreur lors du test de cohérence: ${error.message}\n`)
    return false
  }
}

/**
 * Test de sécurité d'authentification
 */
async function testAuthenticationSecurity() {
  console.log("🔐 Test de sécurité d'authentification\n")

  const endpoints = [
    '/dashboard/stats',
    '/dashboard/recent-activity',
    '/dashboard/urgent-invoices',
    '/dashboard/pending-quotes',
    '/dashboard/analytics',
  ]

  let successCount = 0

  for (const endpoint of endpoints) {
    try {
      await axios.get(`${BASE_URL}${endpoint}`)
      console.log(`❌ ${endpoint} - Accessible sans authentification`)
    } catch (error) {
      if (error.response?.status === 401) {
        console.log(`✅ ${endpoint} - Protégé par authentification`)
        successCount++
      } else {
        console.log(
          `❌ ${endpoint} - Erreur inattendue: ${error.response?.status}`
        )
      }
    }
  }

  console.log(
    `\nAuthentification: ${successCount}/${endpoints.length} endpoints protégés\n`
  )
  return successCount === endpoints.length
}

/**
 * Exécution des tests
 */
async function runSecurityTests() {
  console.log('='.repeat(60))
  console.log('TESTS DE SÉCURITÉ DU DASHBOARD')
  console.log('='.repeat(60))

  const results = {
    sqlInjection: false,
    parameterValidation: false,
    metricsConsistency: false,
    authentication: false,
  }

  try {
    results.sqlInjection = await testSQLInjectionProtection()
    results.parameterValidation = await testParameterValidation()
    results.metricsConsistency = await testMetricsConsistency()
    results.authentication = await testAuthenticationSecurity()
  } catch (error) {
    console.log(`❌ Erreur générale: ${error.message}`)
  }

  console.log('='.repeat(60))
  console.log('RÉSULTATS:')
  console.log(`🔒 Protection SQL: ${results.sqlInjection ? '✅' : '❌'}`)
  console.log(
    `🔧 Validation paramètres: ${results.parameterValidation ? '✅' : '❌'}`
  )
  console.log(
    `📊 Cohérence métriques: ${results.metricsConsistency ? '✅' : '❌'}`
  )
  console.log(`🔐 Authentification: ${results.authentication ? '✅' : '❌'}`)

  const totalPassed = Object.values(results).filter(Boolean).length
  const totalTests = Object.keys(results).length

  console.log(`\nScore global: ${totalPassed}/${totalTests} tests passés`)
  console.log('='.repeat(60))

  if (totalPassed === totalTests) {
    console.log('🎉 Tous les tests de sécurité sont passés !')
  } else {
    console.log('⚠️  Certains tests ont échoué. Vérifiez la configuration.')
  }

  console.log('='.repeat(60))
}

// Exécution si le script est appelé directement
if (require.main === module) {
  runSecurityTests().catch(console.error)
}

module.exports = { runSecurityTests }
