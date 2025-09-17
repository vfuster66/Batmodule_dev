// Configuration de production pour masquer les données sensibles

/**
 * Désactive complètement la console en production
 */
export const disableConsoleInProduction = () => {
  if (import.meta.env.PROD && typeof window !== 'undefined') {
    // Remplacer toutes les méthodes de console par des fonctions vides
    const noop = () => {}

    console.log = noop
    console.error = noop
    console.warn = noop
    console.info = noop
    console.debug = noop
    console.trace = noop
    console.table = noop
    console.group = noop
    console.groupEnd = noop
    console.time = noop
    console.timeEnd = noop
    console.count = noop
    console.clear = noop
  }
}

/**
 * Masque les données sensibles dans les erreurs globales
 */
export const setupGlobalErrorHandling = () => {
  if (typeof window !== 'undefined') {
    // Intercepter les erreurs globales
    window.addEventListener('error', (event) => {
      // Masquer les données sensibles dans les messages d'erreur
      if (event.message && typeof event.message === 'string') {
        event.message = event.message
          .replace(
            /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
            '[EMAIL_MASQUÉ]'
          )
          .replace(/password["\s]*[:=]["\s]*[^"\s,}]+/gi, 'password: [MASQUÉ]')
          .replace(/token["\s]*[:=]["\s]*[^"\s,}]+/gi, 'token: [MASQUÉ]')
      }
    })

    // Intercepter les promesses rejetées
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && typeof event.reason === 'string') {
        event.reason = event.reason
          .replace(
            /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
            '[EMAIL_MASQUÉ]'
          )
          .replace(/password["\s]*[:=]["\s]*[^"\s,}]+/gi, 'password: [MASQUÉ]')
          .replace(/token["\s]*[:=]["\s]*[^"\s,}]+/gi, 'token: [MASQUÉ]')
      }
    })
  }
}

/**
 * Initialise toutes les protections de production
 */
export const initProductionSecurity = () => {
  disableConsoleInProduction()
  setupGlobalErrorHandling()
}
