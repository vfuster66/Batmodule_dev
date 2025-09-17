import { onMounted } from 'vue'

/**
 * Composable pour la sécurité côté client
 */
export function useSecurity() {
  /**
   * Masque les données sensibles dans les outils de développement
   */
  const hideSensitiveData = () => {
    if (typeof window === 'undefined') return

    // Masquer les données sensibles dans localStorage
    const originalSetItem = localStorage.setItem
    localStorage.setItem = function (key, value) {
      if (
        key.toLowerCase().includes('token') ||
        key.toLowerCase().includes('password')
      ) {
        // Masquer visuellement dans les outils de développement
        const maskedValue = '*'.repeat(Math.min(value.length, 20))
        originalSetItem.call(this, key, maskedValue)
      } else {
        originalSetItem.call(this, key, value)
      }
    }

    // Masquer les données sensibles dans sessionStorage
    const originalSessionSetItem = sessionStorage.setItem
    sessionStorage.setItem = function (key, value) {
      if (
        key.toLowerCase().includes('token') ||
        key.toLowerCase().includes('password')
      ) {
        const maskedValue = '*'.repeat(Math.min(value.length, 20))
        originalSessionSetItem.call(this, key, maskedValue)
      } else {
        originalSessionSetItem.call(this, key, value)
      }
    }
  }

  /**
   * Désactive le clic droit et les raccourcis clavier sensibles
   */
  const disableDevTools = () => {
    if (import.meta.env.PROD && typeof window !== 'undefined') {
      // Désactiver F12, Ctrl+Shift+I, Ctrl+U
      document.addEventListener('keydown', (e) => {
        if (
          e.key === 'F12' ||
          (e.ctrlKey && e.shiftKey && e.key === 'I') ||
          (e.ctrlKey && e.key === 'u')
        ) {
          e.preventDefault()
          return false
        }
      })

      // Désactiver le clic droit
      document.addEventListener('contextmenu', (e) => {
        e.preventDefault()
        return false
      })
    }
  }

  /**
   * Initialise les protections de sécurité
   */
  const initSecurity = () => {
    hideSensitiveData()
    disableDevTools()
  }

  onMounted(() => {
    initSecurity()
  })

  return {
    hideSensitiveData,
    disableDevTools,
    initSecurity,
  }
}
