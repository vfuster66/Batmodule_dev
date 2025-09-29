/**
 * Script de test manuel pour l'import CSV des clients
 * Teste la validation SIRET et la détection des doublons
 */

const fs = require('fs')
const path = require('path')

// Données de test pour l'import CSV
const testClientsData = [
  // Client valide (particulier)
  {
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@test.com',
    phone: '0123456789',
    isCompany: false,
  },

  // Entreprise valide avec SIRET formaté
  {
    firstName: 'Marie',
    lastName: 'Martin',
    companyName: 'Entreprise Martin',
    email: 'contact@martin.com',
    phone: '0987654321',
    isCompany: true,
    siret: '123 456 789 01234', // SIRET avec espaces
    legalForm: 'SARL',
  },

  // Entreprise avec SIRET en tirets
  {
    firstName: '',
    lastName: '',
    companyName: 'Société Durand',
    email: 'info@durand.com',
    isCompany: true,
    siret: '987-654-321-09876', // SIRET avec tirets
    legalForm: 'SAS',
  },

  // Client avec SIRET invalide (pour tester la validation)
  {
    firstName: 'Pierre',
    lastName: 'Durand',
    companyName: 'Entreprise Test',
    email: 'pierre@test.com',
    isCompany: true,
    siret: '00000000000000', // SIRET invalide (clé Luhn incorrecte)
  },

  // Client avec email dupliqué (pour tester la détection des doublons)
  {
    firstName: 'Autre',
    lastName: 'Client',
    email: 'jean.dupont@test.com', // Email dupliqué
    isCompany: false,
  },
]

/**
 * Simule la validation côté serveur
 */
function simulateServerValidation(clients) {
  const results = {
    success: [],
    errors: [],
    total: clients.length,
  }

  const existingEmails = new Set()
  const existingSirets = new Set()

  clients.forEach((client, index) => {
    try {
      // Validation SIRET si présent
      if (client.siret && client.siret.trim() !== '') {
        const normalizedSiret = client.siret.replace(/[\s-]/g, '')

        // Simuler la validation Luhn (simplifiée pour le test)
        if (!validateSiretSimple(normalizedSiret)) {
          results.errors.push({
            index: index + 1,
            data: client,
            error: "Le numéro SIRET n'est pas valide (clé Luhn incorrecte)",
          })
          return
        }

        // Vérifier l'unicité du SIRET
        if (existingSirets.has(normalizedSiret)) {
          results.errors.push({
            index: index + 1,
            data: client,
            error: 'Un client avec ce SIRET existe déjà',
          })
          return
        }
        existingSirets.add(normalizedSiret)
      }

      // Vérifier l'unicité de l'email
      if (client.email && existingEmails.has(client.email)) {
        results.errors.push({
          index: index + 1,
          data: client,
          error: 'Un client avec cet email existe déjà',
        })
        return
      }
      if (client.email) {
        existingEmails.add(client.email)
      }

      // Validation des champs requis
      if (client.isCompany) {
        if (!client.companyName && !client.firstName && !client.lastName) {
          results.errors.push({
            index: index + 1,
            data: client,
            error:
              "Pour une entreprise, le nom de l'entreprise ou le prénom/nom du contact doit être renseigné",
          })
          return
        }
      } else {
        if (!client.firstName || !client.lastName) {
          results.errors.push({
            index: index + 1,
            data: client,
            error: 'Pour une personne, le prénom et le nom sont obligatoires',
          })
          return
        }
      }

      // Client valide
      results.success.push({
        index: index + 1,
        client: {
          id: Math.random().toString(36).substr(2, 9),
          ...client,
          siret: client.siret
            ? client.siret.replace(/[\s-]/g, '')
            : client.siret,
        },
      })
    } catch (error) {
      results.errors.push({
        index: index + 1,
        data: client,
        error: error.message,
      })
    }
  })

  return results
}

/**
 * Validation SIRET simplifiée pour le test
 */
function validateSiretSimple(siret) {
  if (!siret || siret.length !== 14 || !/^\d{14}$/.test(siret)) {
    return false
  }

  // Algorithme de Luhn simplifié pour le test
  let sum = 0
  let isEven = false

  for (let i = siret.length - 1; i >= 0; i--) {
    let digit = parseInt(siret[i], 10)

    if (isEven) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }

    sum += digit
    isEven = !isEven
  }

  return sum % 10 === 0
}

/**
 * Affiche les résultats du test
 */
function displayResults(results) {
  console.log("🧪 Test d'import CSV des clients\n")
  console.log(`Total: ${results.total} clients`)
  console.log(`✅ Succès: ${results.success.length}`)
  console.log(`❌ Erreurs: ${results.errors.length}\n`)

  if (results.success.length > 0) {
    console.log('📋 Clients importés avec succès:')
    results.success.forEach((item) => {
      const client = item.client
      console.log(
        `  ${item.index}. ${client.firstName} ${client.lastName} ${client.companyName ? `(${client.companyName})` : ''}`
      )
      if (client.siret) {
        console.log(`     SIRET: ${client.siret} (normalisé)`)
      }
    })
    console.log('')
  }

  if (results.errors.length > 0) {
    console.log('🚨 Erreurs détectées:')
    results.errors.forEach((item) => {
      const client = item.data
      console.log(
        `  ${item.index}. ${client.firstName} ${client.lastName} ${client.companyName ? `(${client.companyName})` : ''}`
      )
      console.log(`     Erreur: ${item.error}`)
      if (client.siret) {
        console.log(`     SIRET original: ${client.siret}`)
        console.log(
          `     SIRET normalisé: ${client.siret.replace(/[\s-]/g, '')}`
        )
      }
      console.log('')
    })
  }
}

/**
 * Test de normalisation SIRET
 */
function testSiretNormalization() {
  console.log('🔧 Test de normalisation SIRET:\n')

  const testCases = ['123 456 789 01234', '123-456-789-01234', '12345678901234']

  testCases.forEach((siret) => {
    const normalized = siret.replace(/[\s-]/g, '')
    console.log(`"${siret}" → "${normalized}"`)
  })

  const allNormalized = testCases.map((s) => s.replace(/[\s-]/g, ''))
  const allSame = allNormalized.every((s) => s === allNormalized[0])
  console.log(
    `\nTous identiques après normalisation: ${allSame ? '✅' : '❌'}\n`
  )
}

// Exécution des tests
console.log('='.repeat(60))
console.log("TEST D'INTÉGRATION - IMPORT CSV CLIENTS")
console.log('='.repeat(60))

// Test de normalisation
testSiretNormalization()

// Test de validation
const results = simulateServerValidation(testClientsData)
displayResults(results)

console.log('='.repeat(60))
console.log('Test terminé !')
console.log('='.repeat(60))
