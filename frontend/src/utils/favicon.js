// Utilitaires pour gérer le favicon adaptatif

export function updateFavicon(isDark) {
  const faviconLight = document.getElementById('favicon-light')
  const faviconDark = document.getElementById('favicon-dark')

  if (faviconLight && faviconDark) {
    if (isDark) {
      faviconLight.setAttribute('media', '(prefers-color-scheme: light)')
      faviconDark.setAttribute('media', 'all')
    } else {
      faviconLight.setAttribute('media', 'all')
      faviconDark.setAttribute('media', '(prefers-color-scheme: dark)')
    }
  }
}

export function setupFaviconListener() {
  // Écouter les changements de thème
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

  const handleChange = (e) => {
    updateFavicon(e.matches)
  }

  // Écouter les changements
  mediaQuery.addEventListener('change', handleChange)

  // Appliquer le thème initial
  updateFavicon(mediaQuery.matches)

  // Retourner une fonction pour nettoyer l'écouteur
  return () => {
    mediaQuery.removeEventListener('change', handleChange)
  }
}
