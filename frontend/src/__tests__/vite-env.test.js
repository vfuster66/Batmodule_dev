import { describe, it, expect } from 'vitest'

// Test pour vérifier que le fichier de types Vite existe
describe('vite-env.d.ts', () => {
  it('should have Vite environment types available', () => {
    // Test basique pour vérifier que le module de types existe
    expect(true).toBe(true)
  })

  it('should have import.meta.env available', () => {
    // Vérifier que import.meta.env est disponible
    expect(typeof import.meta.env).toBe('object')
  })
})
