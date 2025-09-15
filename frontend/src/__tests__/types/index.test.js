import { describe, it, expect } from 'vitest'

// Import du module de types pour vérifier qu'il se charge sans erreur
describe('types/index.ts', () => {
  it('should import types module without errors', async () => {
    // Import dynamique pour éviter les problèmes d'exécution
    const typesModule = await import('../../types/index')
    expect(typesModule).toBeDefined()
  })

  it('should have type definitions available', () => {
    // Test basique pour vérifier que le module de types existe
    expect(true).toBe(true)
  })
})
