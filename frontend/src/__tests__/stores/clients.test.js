import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useClientsStore } from '@/stores/clients'
import api from '@/utils/api'
import { useToast } from 'vue-toastification'

// Mock des dépendances
vi.mock('@/utils/api')
vi.mock('vue-toastification')

describe('Clients Store', () => {
  let store
  let mockToast

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useClientsStore()

    // Mock toast
    mockToast = {
      success: vi.fn(),
      error: vi.fn(),
    }
    useToast.mockReturnValue(mockToast)
  })

  describe('State', () => {
    it('should have initial state', () => {
      expect(store.clients).toEqual([])
      expect(store.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
      })
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  describe('fetchClients', () => {
    it('should fetch clients successfully', async () => {
      const mockResponse = {
        data: {
          clients: [
            {
              id: 1,
              name: 'Client 1',
              email: 'client1@example.com',
              phone: '0123456789',
            },
            {
              id: 2,
              name: 'Client 2',
              email: 'client2@example.com',
              phone: '0987654321',
            },
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            pages: 1,
          },
        },
      }

      api.get.mockResolvedValueOnce(mockResponse)

      await store.fetchClients()

      expect(api.get).toHaveBeenCalledWith('/clients', { params: {} })
      expect(store.clients).toEqual(mockResponse.data.clients)
      expect(store.pagination).toEqual(mockResponse.data.pagination)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should fetch clients with params', async () => {
      const params = { page: 2, limit: 5, search: 'test' }
      const mockResponse = {
        data: {
          clients: [],
          pagination: { page: 2, limit: 5, total: 0, pages: 0 },
        },
      }

      api.get.mockResolvedValueOnce(mockResponse)

      await store.fetchClients(params)

      expect(api.get).toHaveBeenCalledWith('/clients', { params })
    })

    it('should handle fetch clients error', async () => {
      const mockError = new Error('Network error')
      api.get.mockRejectedValueOnce(mockError)

      await store.fetchClients()

      expect(store.error).toBe(mockError)
      expect(store.loading).toBe(false)
      expect(mockToast.error).toHaveBeenCalledWith(
        'Erreur lors du chargement des clients.'
      )
    })

    it('should set loading state during fetch', async () => {
      const mockResponse = {
        data: {
          clients: [],
          pagination: { page: 1, limit: 10, total: 0, pages: 0 },
        },
      }

      api.get.mockResolvedValueOnce(mockResponse)

      const fetchPromise = store.fetchClients()
      expect(store.loading).toBe(true)

      await fetchPromise
      expect(store.loading).toBe(false)
    })
  })

  describe('createClient', () => {
    it('should create client successfully', async () => {
      const clientData = {
        name: 'New Client',
        email: 'new@example.com',
        phone: '0123456789',
      }

      const mockResponse = {
        data: {
          client: {
            id: 3,
            ...clientData,
          },
        },
      }

      api.post.mockResolvedValueOnce(mockResponse)

      const result = await store.createClient(clientData)

      expect(api.post).toHaveBeenCalledWith('/clients', clientData)
      expect(result).toEqual(mockResponse.data.client)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
      expect(mockToast.success).toHaveBeenCalledWith(
        'Client créé avec succès !'
      )
    })

    it('should handle create client error', async () => {
      const clientData = {
        name: 'New Client',
        email: 'invalid-email',
      }

      const mockError = {
        response: {
          data: {
            message: 'Email invalide',
          },
        },
      }

      api.post.mockRejectedValueOnce(mockError)

      await expect(store.createClient(clientData)).rejects.toThrow()
      expect(store.error).toBe(mockError)
      expect(store.loading).toBe(false)
      expect(mockToast.error).toHaveBeenCalledWith('Email invalide')
    })
  })

  describe('updateClient', () => {
    it('should update client successfully', async () => {
      const clientId = 1
      const updateData = {
        name: 'Updated Client',
        email: 'updated@example.com',
      }

      const mockResponse = {
        data: {
          client: {
            id: clientId,
            ...updateData,
          },
        },
      }

      api.put.mockResolvedValueOnce(mockResponse)

      const result = await store.updateClient(clientId, updateData)

      expect(api.put).toHaveBeenCalledWith(`/clients/${clientId}`, updateData)
      expect(result).toEqual(mockResponse.data.client)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
      expect(mockToast.success).toHaveBeenCalledWith(
        'Client mis à jour avec succès !'
      )
    })

    it('should handle update client error', async () => {
      const clientId = 1
      const updateData = {
        name: 'Updated Client',
      }

      const mockError = {
        response: {
          data: {
            message: 'Client non trouvé',
          },
        },
      }

      api.put.mockRejectedValueOnce(mockError)

      await expect(store.updateClient(clientId, updateData)).rejects.toThrow()
      expect(store.error).toBe(mockError)
      expect(store.loading).toBe(false)
      expect(mockToast.error).toHaveBeenCalledWith('Client non trouvé')
    })
  })

  describe('deleteClient', () => {
    it('should delete client successfully', async () => {
      const clientId = 1

      // Set initial state
      store.clients = [
        { id: 1, name: 'Client 1' },
        { id: 2, name: 'Client 2' },
      ]
      store.pagination.total = 2

      api.delete.mockResolvedValueOnce({})

      await store.deleteClient(clientId)

      expect(api.delete).toHaveBeenCalledWith(`/clients/${clientId}`)
      expect(store.clients).toEqual([{ id: 2, name: 'Client 2' }])
      expect(store.pagination.total).toBe(1)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
      expect(mockToast.success).toHaveBeenCalledWith(
        'Client supprimé avec succès !'
      )
    })

    it('should handle delete client error', async () => {
      const clientId = 1

      const mockError = {
        response: {
          data: {
            message: 'Impossible de supprimer ce client',
          },
        },
      }

      api.delete.mockRejectedValueOnce(mockError)

      await expect(store.deleteClient(clientId)).rejects.toThrow()
      expect(store.error).toBe(mockError)
      expect(store.loading).toBe(false)
      expect(mockToast.error).toHaveBeenCalledWith(
        'Impossible de supprimer ce client'
      )
    })
  })

  describe('resetClients', () => {
    it('should reset clients state', () => {
      // Set some state
      store.clients = [{ id: 1, name: 'Client 1' }]
      store.pagination = { page: 2, limit: 5, total: 10, pages: 2 }
      store.loading = true
      store.error = new Error('Test error')

      store.resetClients()

      expect(store.clients).toEqual([])
      expect(store.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
      })
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })
  })
})
