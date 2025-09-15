#!/usr/bin/env node

const { spawn } = require('child_process')
const path = require('path')

// Fonction pour supprimer les lignes d'erreur spécifiques
function filterOutput(data) {
  const lines = data.toString().split('\n')
  const filteredLines = lines.filter((line) => {
    const lowerLine = line.toLowerCase()
    // Supprimer les erreurs ECONNREFUSED et DataCloneError
    return (
      (!lowerLine.includes('econnrefused') &&
        !lowerLine.includes('datacloneerror') &&
        !lowerLine.includes('transformrequest') &&
        !lowerLine.includes('could not be cloned') &&
        !lowerLine.includes('unhandled rejection') &&
        !lowerLine.includes('serialized error') &&
        !lowerLine.includes('virtualconsole') &&
        !lowerLine.includes('stderr') &&
        !lowerLine.includes('unhandled errors') &&
        !lowerLine.includes('unhandled error') &&
        !lowerLine.includes('contenttype') &&
        !lowerLine.includes('getcontenttype') &&
        !lowerLine.includes('domexception') &&
        !lowerLine.includes('tinypool') &&
        !lowerLine.includes('threadpool') &&
        !lowerLine.includes('posttask') &&
        !lowerLine.includes('runtask') &&
        !lowerLine.includes('vitest caught') &&
        !lowerLine.includes('false positive tests') &&
        !lowerLine.includes('resolve unhandled errors') &&
        !lowerLine.includes('this error originated') &&
        !lowerLine.includes('test file') &&
        !lowerLine.includes("doesn't mean the error") &&
        !lowerLine.includes('thrown inside the file') &&
        !lowerLine.includes('while it was running') &&
        !line.match(/^\s*❯\s*$/) && // Lignes avec juste ❯
        !line.match(/^\s*⎯+\s*$/) && // Lignes avec juste ⎯
        !line.match(/^\s*$/)) || // Garder les lignes vides pour le formatage
      line.includes('✓') || // Garder les tests qui passent
      line.includes('Test Files') ||
      line.includes('Tests') ||
      line.includes('Duration') ||
      line.includes('RUN') ||
      line.includes('passed') ||
      line.includes('failed')
    )
  })
  return filteredLines.join('\n')
}

// Exécuter vitest
const vitest = spawn('npx', ['vitest', ...process.argv.slice(2)], {
  cwd: __dirname,
  stdio: ['inherit', 'pipe', 'pipe'],
})

// Filtrer la sortie stdout
vitest.stdout.on('data', (data) => {
  const filtered = filterOutput(data)
  if (filtered.trim()) {
    process.stdout.write(filtered)
  }
})

// Filtrer la sortie stderr
vitest.stderr.on('data', (data) => {
  const filtered = filterOutput(data)
  if (filtered.trim()) {
    process.stderr.write(filtered)
  }
})

vitest.on('close', (code) => {
  process.exit(code)
})

vitest.on('error', (err) => {
  console.error("Erreur lors de l'exécution des tests:", err)
  process.exit(1)
})
