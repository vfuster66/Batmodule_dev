import axios from 'axios'
import { useToast } from 'vue-toastification'

// Configuration de base de l'API
const api = axios.create({
  // Use Vite dev proxy by default to avoid CORS and DNS issues
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000, // Augmenté le timeout
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// Debug: Afficher l'URL de base utilisée (dev uniquement)
if (import.meta.env.DEV) {
  console.log('🔧 API Base URL:', api.defaults.baseURL)
}

// Intercepteur de requête
api.interceptors.request.use(
  (config) => {
    // En prod, on utilise le cookie HttpOnly; en dev on garde le Bearer si présent
    if (import.meta.env.MODE !== 'production') {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }

    // Log des requêtes en développement (sans payload)
    if (import.meta.env.DEV) {
      console.log(
        `🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`
      )
    }

    return config
  },
  (error) => {
    console.error('❌ API Request Error:', error)
    return Promise.reject(error)
  }
)

// Intercepteur de réponse
api.interceptors.response.use(
  (response) => {
    // Log des réponses en développement (ne pas afficher les données sensibles)
    if (import.meta.env.DEV) {
      const url = response.config?.url || ''
      const method = response.config?.method?.toUpperCase()
      const status = response.status
      // N’affiche jamais le body, et évite les routes d’auth
      console.log(`✅ API Response: ${method} ${url} — ${status}`)
    }

    return response
  },
  (error) => {
    const toast = useToast()

    // Log d'erreur sécurisé (ne pas afficher le payload ni les tokens)
    try {
      const url = error.config?.url || ''
      const method = error.config?.method?.toUpperCase()
      const status = error.response?.status
      const msg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message
      console.error('❌ API Error:', { method, url, status, message: msg })
    } catch (_) {
      console.error('❌ API Error')
    }

    // Gestion des erreurs HTTP
    if (error.response) {
      const { status, data } = error.response

      const url = error.config?.url || ''
      const isAuthPath =
        url.includes('/auth/login') || url.includes('/auth/register')
      switch (status) {
        case 401:
          if (!isAuthPath) {
            if (import.meta.env.MODE !== 'production') {
              localStorage.removeItem('token')
            }
            toast.error('Session expirée, veuillez vous reconnecter')
            window.location.href = '/login'
          }
          break

        case 403:
          toast.error('Accès refusé')
          break

        case 404:
          toast.error('Ressource non trouvée')
          break

        case 422:
          // Erreurs de validation
          if (data.details && Array.isArray(data.details)) {
            data.details.forEach((detail) => {
              toast.error(detail.message)
            })
          } else {
            toast.error(data.message || 'Données invalides')
          }
          break

        case 400:
          // Détails validation (backend peut renvoyer details)
          if (data?.details && Array.isArray(data.details)) {
            data.details.forEach((d) => toast.error(d.message || d))
          } else if (data?.error) {
            toast.error(data.error)
          } else {
            toast.error(data.message || 'Requête invalide')
          }
          break

        case 500:
          toast.error('Erreur serveur interne')
          break

        default:
          toast.error(data.message || 'Une erreur est survenue')
      }
    } else if (error.request) {
      // Erreur de réseau
      toast.error('Erreur de connexion au serveur')
    } else {
      // Autre erreur
      toast.error('Une erreur inattendue est survenue')
    }

    return Promise.reject(error)
  }
)

export default api
