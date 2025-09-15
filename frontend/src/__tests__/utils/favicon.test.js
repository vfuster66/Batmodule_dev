import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { updateFavicon, setupFaviconListener } from '../../utils/favicon'

describe('Favicon Utils', () => {
  let mockFaviconLight
  let mockFaviconDark
  let mockMediaQuery

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock DOM elements
    mockFaviconLight = {
      setAttribute: vi.fn(),
    }
    mockFaviconDark = {
      setAttribute: vi.fn(),
    }

    // Mock document.getElementById
    vi.spyOn(document, 'getElementById').mockImplementation((id) => {
      if (id === 'favicon-light') return mockFaviconLight
      if (id === 'favicon-dark') return mockFaviconDark
      return null
    })

    // Mock window.matchMedia
    mockMediaQuery = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => mockMediaQuery),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('updateFavicon', () => {
    it('should update favicon for dark theme', () => {
      updateFavicon(true)

      expect(mockFaviconLight.setAttribute).toHaveBeenCalledWith(
        'media',
        '(prefers-color-scheme: light)'
      )
      expect(mockFaviconDark.setAttribute).toHaveBeenCalledWith('media', 'all')
    })

    it('should update favicon for light theme', () => {
      updateFavicon(false)

      expect(mockFaviconLight.setAttribute).toHaveBeenCalledWith('media', 'all')
      expect(mockFaviconDark.setAttribute).toHaveBeenCalledWith(
        'media',
        '(prefers-color-scheme: dark)'
      )
    })

    it('should handle missing favicon elements gracefully', () => {
      vi.spyOn(document, 'getElementById').mockReturnValue(null)

      expect(() => updateFavicon(true)).not.toThrow()
      expect(() => updateFavicon(false)).not.toThrow()
    })

    it('should handle missing light favicon', () => {
      vi.spyOn(document, 'getElementById').mockImplementation((id) => {
        if (id === 'favicon-light') return null
        if (id === 'favicon-dark') return mockFaviconDark
        return null
      })

      expect(() => updateFavicon(true)).not.toThrow()
      // When light favicon is missing, function does nothing (both elements must exist)
      expect(mockFaviconDark.setAttribute).not.toHaveBeenCalled()
    })

    it('should handle missing dark favicon', () => {
      vi.spyOn(document, 'getElementById').mockImplementation((id) => {
        if (id === 'favicon-light') return mockFaviconLight
        if (id === 'favicon-dark') return null
        return null
      })

      expect(() => updateFavicon(true)).not.toThrow()
      // When dark favicon is missing, function does nothing (both elements must exist)
      expect(mockFaviconLight.setAttribute).not.toHaveBeenCalled()
    })
  })

  describe('setupFaviconListener', () => {
    it('should setup media query listener', () => {
      const cleanup = setupFaviconListener()

      expect(window.matchMedia).toHaveBeenCalledWith(
        '(prefers-color-scheme: dark)'
      )
      expect(mockMediaQuery.addEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      )

      // Test cleanup function
      expect(typeof cleanup).toBe('function')
      cleanup()
      expect(mockMediaQuery.removeEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      )
    })

    it('should apply initial theme based on media query', () => {
      mockMediaQuery.matches = true

      setupFaviconListener()

      expect(mockFaviconLight.setAttribute).toHaveBeenCalledWith(
        'media',
        '(prefers-color-scheme: light)'
      )
      expect(mockFaviconDark.setAttribute).toHaveBeenCalledWith('media', 'all')
    })

    it('should apply light theme when media query does not match', () => {
      mockMediaQuery.matches = false

      setupFaviconListener()

      expect(mockFaviconLight.setAttribute).toHaveBeenCalledWith('media', 'all')
      expect(mockFaviconDark.setAttribute).toHaveBeenCalledWith(
        'media',
        '(prefers-color-scheme: dark)'
      )
    })

    it('should handle theme changes', () => {
      const cleanup = setupFaviconListener()

      // Get the change handler
      const changeHandler = mockMediaQuery.addEventListener.mock.calls[0][1]

      // Simulate theme change to dark
      changeHandler({ matches: true })

      expect(mockFaviconLight.setAttribute).toHaveBeenCalledWith(
        'media',
        '(prefers-color-scheme: light)'
      )
      expect(mockFaviconDark.setAttribute).toHaveBeenCalledWith('media', 'all')

      // Simulate theme change to light
      changeHandler({ matches: false })

      expect(mockFaviconLight.setAttribute).toHaveBeenCalledWith('media', 'all')
      expect(mockFaviconDark.setAttribute).toHaveBeenCalledWith(
        'media',
        '(prefers-color-scheme: dark)'
      )

      cleanup()
    })

    it('should return cleanup function that removes event listener', () => {
      const cleanup = setupFaviconListener()

      // Verify listener was added
      expect(mockMediaQuery.addEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      )

      // Call cleanup
      cleanup()

      // Verify listener was removed
      expect(mockMediaQuery.removeEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      )
    })
  })
})
