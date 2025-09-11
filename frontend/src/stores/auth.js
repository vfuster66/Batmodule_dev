import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/utils/api'

export const useAuthStore = defineStore('auth', () => {
  // État
  const user = ref(null)
  const token = ref(localStorage.getItem('token'))
  const isLoading = ref(false)

  // Computed
  const isAuthenticated = computed(() => !!token.value && !!user.value)

  // Actions
  const login = async (credentials) => {
    isLoading.value = true

    try {
      const response = await api.post('/auth/login', credentials)
      const { user: userData, token: authToken } = response.data

      // Sauvegarder le token
      token.value = authToken
      localStorage.setItem('token', authToken)

      // Sauvegarder les données utilisateur
      user.value = userData

      // Configurer l'API avec le token
      api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`

      return { success: true, user: userData }
    } catch (error) {
      const message = error.response?.data?.message || 'Erreur de connexion'
      return { success: false, error: message }
    } finally {
      isLoading.value = false
    }
  }

  const register = async (data) => {
    isLoading.value = true

    try {
      const response = await api.post('/auth/register', data)
      const { user: userData, token: authToken } = response.data

      // Sauvegarder le token
      token.value = authToken
      localStorage.setItem('token', authToken)

      // Sauvegarder les données utilisateur
      user.value = userData

      // Configurer l'API avec le token
      api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`

      return { success: true, user: userData }
    } catch (error) {
      const message =
        error.response?.data?.message || 'Erreur lors de la création du compte'
      return { success: false, error: message }
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    try {
      // Nettoyer l'état local
      user.value = null
      token.value = null
      localStorage.removeItem('token')

      // Nettoyer l'API
      delete api.defaults.headers.common['Authorization']
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    }
  }

  const fetchProfile = async () => {
    if (!token.value) return

    try {
      // Configurer l'API avec le token
      api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`

      const response = await api.get('/auth/me')
      user.value = response.data.user
      return true
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error)

      // Ne pas déconnecter si c'est juste une requête interrompue
      if (
        error.code === 'ECONNABORTED' ||
        error.message === 'Request aborted'
      ) {
        console.log('Requête interrompue, pas de déconnexion')
        return false
      }

      // Token invalide, déconnecter l'utilisateur
      await logout()
      return false
    }
  }

  const updateProfile = async (data) => {
    isLoading.value = true

    try {
      const response = await api.put('/auth/profile', data)
      user.value = response.data.user
      return { success: true, user: response.data.user }
    } catch (error) {
      const message =
        error.response?.data?.message || 'Erreur lors de la mise à jour'
      return { success: false, error: message }
    } finally {
      isLoading.value = false
    }
  }

  const initializeAuth = async () => {
    if (token.value) {
      // Configurer l'API avec le token existant
      api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
      await fetchProfile()
    }
  }

  return {
    // État
    user,
    token,
    isLoading,

    // Computed
    isAuthenticated,

    // Actions
    login,
    register,
    logout,
    fetchProfile,
    updateProfile,
    initializeAuth,
  }
})
