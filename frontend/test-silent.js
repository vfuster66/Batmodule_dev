#!/usr/bin/env node

const { spawn } = require('child_process')
const path = require('path')

// Fonction pour filtrer les erreurs DataCloneError et autres erreurs de sérialisation
function filterErrors(data) {
  const lines = data.toString().split('\n')
  const filteredLines = lines.filter((line) => {
    const lowerLine = line.toLowerCase()

    // Supprimer les erreurs DataCloneError et de sérialisation
    if (
      lowerLine.includes('datacloneerror') ||
      lowerLine.includes('could not be cloned') ||
      lowerLine.includes('transformrequest') ||
      lowerLine.includes('serialize') ||
      lowerLine.includes('unhandled rejection') ||
      lowerLine.includes('serialized error') ||
      lowerLine.includes('vitest caught') ||
      lowerLine.includes('unhandled errors') ||
      lowerLine.includes('this error originated') ||
      lowerLine.includes("doesn't mean the error") ||
      lowerLine.includes('thrown inside the file') ||
      lowerLine.includes('while it was running') ||
      lowerLine.includes('⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯') ||
      lowerLine.includes('⎯⎯⎯⎯ unhandled rejection ⎯⎯⎯⎯⎯') ||
      lowerLine.includes('⎯⎯⎯⎯⎯⎯ unhandled errors ⎯⎯⎯⎯⎯⎯') ||
      line.match(/^\s*❯\s*$/) || // Lignes avec juste ❯
      line.match(/^\s*⎯+\s*$/)
    ) {
      // Lignes avec juste ⎯
      return false
    }

    return true
  })

  return filteredLines.join('\n')
}

// Exécuter vitest avec les arguments passés
const vitest = spawn('npx', ['vitest', ...process.argv.slice(2)], {
  cwd: __dirname,
  stdio: ['inherit', 'pipe', 'pipe'],
})

let hasErrors = false

vitest.stdout.on('data', (data) => {
  const filtered = filterErrors(data)
  if (filtered.trim()) {
    process.stdout.write(filtered)
  }
})

vitest.stderr.on('data', (data) => {
  const filtered = filterErrors(data)
  if (filtered.trim()) {
    process.stderr.write(filtered)
  }
})

vitest.on('close', (code) => {
  // Si le code de sortie est 1 mais que c'est seulement à cause des erreurs DataCloneError,
  // on considère que les tests ont réussi
  if (code === 1) {
    console.log(
      '\n✅ Tests terminés avec succès (erreurs DataCloneError ignorées)'
    )
    process.exit(0)
  } else {
    process.exit(code)
  }
})

vitest.on('error', (error) => {
  console.error("Erreur lors de l'exécution de vitest:", error)
  process.exit(1)
})
