import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import api from '@/utils/api'
import { useToast } from 'vue-toastification'

// Mock des dépendances
vi.mock('@/utils/api')
vi.mock('vue-toastification')

describe('Auth Store', () => {
  let store
  let mockToast

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useAuthStore()

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    })

    // Mock toast
    mockToast = {
      success: vi.fn(),
      error: vi.fn(),
    }
    useToast.mockReturnValue(mockToast)

    // Mock api.defaults.headers
    api.defaults = {
      headers: {
        common: {},
      },
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('State', () => {
    it('should have initial state', () => {
      expect(store.user).toBeNull()
      expect(store.token).toBeNull()
      expect(store.isLoading).toBe(false)
      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('login', () => {
    it('should login successfully', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      }

      const mockResponse = {
        data: {
          user: {
            id: 1,
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
          },
          token: 'mock-jwt-token',
        },
      }

      api.post.mockResolvedValueOnce(mockResponse)

      const result = await store.login(credentials)

      expect(api.post).toHaveBeenCalledWith('/auth/login', credentials)
      expect(store.token).toBe('mock-jwt-token')
      expect(store.user).toEqual(mockResponse.data.user)
      expect(store.isAuthenticated).toBe(true)
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'token',
        'mock-jwt-token'
      )
      expect(api.defaults.headers.common['Authorization']).toBe(
        'Bearer mock-jwt-token'
      )
      expect(mockToast.success).toHaveBeenCalledWith('Connexion réussie !')
      expect(result.success).toBe(true)
    })

    it('should handle login error', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      }

      const mockError = {
        response: {
          data: {
            message: 'Identifiants invalides',
          },
        },
      }

      api.post.mockRejectedValueOnce(mockError)

      const result = await store.login(credentials)

      expect(store.token).toBeNull()
      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(mockToast.error).toHaveBeenCalledWith('Identifiants invalides')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Identifiants invalides')
    })

    it('should set loading state during login', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      }

      const mockResponse = {
        data: {
          user: { id: 1, email: 'test@example.com' },
          token: 'mock-jwt-token',
        },
      }

      api.post.mockResolvedValueOnce(mockResponse)

      const loginPromise = store.login(credentials)
      expect(store.isLoading).toBe(true)

      await loginPromise
      expect(store.isLoading).toBe(false)
    })
  })

  describe('register', () => {
    it('should register successfully', async () => {
      const userData = {
        email: 'new@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
      }

      const mockResponse = {
        data: {
          user: {
            id: 2,
            email: 'new@example.com',
            firstName: 'Jane',
            lastName: 'Smith',
          },
          token: 'mock-jwt-token',
        },
      }

      api.post.mockResolvedValueOnce(mockResponse)

      const result = await store.register(userData)

      expect(api.post).toHaveBeenCalledWith('/auth/register', userData)
      expect(store.token).toBe('mock-jwt-token')
      expect(store.user).toEqual(mockResponse.data.user)
      expect(store.isAuthenticated).toBe(true)
      expect(mockToast.success).toHaveBeenCalledWith(
        'Compte créé avec succès !'
      )
      expect(result.success).toBe(true)
    })

    it('should handle registration error', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      }

      const mockError = {
        response: {
          data: {
            message: 'Un compte avec cet email existe déjà',
          },
        },
      }

      api.post.mockRejectedValueOnce(mockError)

      const result = await store.register(userData)

      expect(store.token).toBeNull()
      expect(store.user).toBeNull()
      expect(mockToast.error).toHaveBeenCalledWith(
        'Un compte avec cet email existe déjà'
      )
      expect(result.success).toBe(false)
    })
  })

  describe('logout', () => {
    it('should logout successfully', async () => {
      // Set initial state
      store.user = { id: 1, email: 'test@example.com' }
      store.token = 'mock-jwt-token'
      api.defaults.headers.common['Authorization'] = 'Bearer mock-jwt-token'

      await store.logout()

      expect(store.user).toBeNull()
      expect(store.token).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(localStorage.removeItem).toHaveBeenCalledWith('token')
      expect(api.defaults.headers.common['Authorization']).toBeUndefined()
      expect(mockToast.success).toHaveBeenCalledWith('Déconnexion réussie')
    })
  })

  describe('fetchProfile', () => {
    it('should fetch profile successfully', async () => {
      store.token = 'mock-jwt-token'
      api.defaults.headers.common['Authorization'] = 'Bearer mock-jwt-token'

      const mockResponse = {
        data: {
          user: {
            id: 1,
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
          },
        },
      }

      api.get.mockResolvedValueOnce(mockResponse)

      const result = await store.fetchProfile()

      expect(api.get).toHaveBeenCalledWith('/auth/profile')
      expect(store.user).toEqual(mockResponse.data.user)
      expect(result).toBe(true)
    })

    it('should handle fetch profile error and logout', async () => {
      store.token = 'invalid-token'
      store.user = { id: 1, email: 'test@example.com' }

      const mockError = {
        response: {
          status: 401,
        },
      }

      api.get.mockRejectedValueOnce(mockError)

      const result = await store.fetchProfile()

      expect(result).toBe(false)
      expect(store.user).toBeNull()
      expect(store.token).toBeNull()
    })

    it('should not fetch profile if no token', async () => {
      store.token = null

      const result = await store.fetchProfile()

      expect(api.get).not.toHaveBeenCalled()
      expect(result).toBeUndefined()
    })
  })

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const updateData = {
        firstName: 'John Updated',
        lastName: 'Doe Updated',
      }

      const mockResponse = {
        data: {
          user: {
            id: 1,
            email: 'test@example.com',
            firstName: 'John Updated',
            lastName: 'Doe Updated',
          },
        },
      }

      api.put.mockResolvedValueOnce(mockResponse)

      const result = await store.updateProfile(updateData)

      expect(api.put).toHaveBeenCalledWith('/auth/profile', updateData)
      expect(store.user).toEqual(mockResponse.data.user)
      expect(mockToast.success).toHaveBeenCalledWith(
        'Profil mis à jour avec succès'
      )
      expect(result.success).toBe(true)
    })

    it('should handle update profile error', async () => {
      const updateData = {
        firstName: 'John Updated',
      }

      const mockError = {
        response: {
          data: {
            message: 'Erreur de validation',
          },
        },
      }

      api.put.mockRejectedValueOnce(mockError)

      const result = await store.updateProfile(updateData)

      expect(mockToast.error).toHaveBeenCalledWith('Erreur de validation')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Erreur de validation')
    })
  })

  describe('initializeAuth', () => {
    it('should initialize auth with existing token', async () => {
      store.token = 'existing-token'
      api.defaults.headers.common['Authorization'] = 'Bearer existing-token'

      const mockResponse = {
        data: {
          user: {
            id: 1,
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
          },
        },
      }

      api.get.mockResolvedValueOnce(mockResponse)

      await store.initializeAuth()

      expect(api.defaults.headers.common['Authorization']).toBe(
        'Bearer existing-token'
      )
      expect(api.get).toHaveBeenCalledWith('/auth/profile')
      expect(store.user).toEqual(mockResponse.data.user)
    })

    it('should not initialize auth without token', async () => {
      store.token = null

      await store.initializeAuth()

      expect(api.get).not.toHaveBeenCalled()
    })
  })
})
