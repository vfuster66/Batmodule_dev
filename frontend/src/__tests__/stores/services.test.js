import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useServicesStore } from '../../stores/services'
import api from '../../utils/api'

// Mock des dépendances
vi.mock('../../utils/api')
vi.mock('vue-toastification', () => ({
  useToast: () => ({
    error: vi.fn(),
    success: vi.fn(),
  }),
}))

describe('Services Store', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useServicesStore()
    vi.clearAllMocks()
  })

  describe('State', () => {
    it('should have initial state', () => {
      expect(store.services).toEqual([])
      expect(store.categories).toEqual([])
      expect(store.currentService).toBeNull()
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
      expect(store.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
      })
      expect(store.filters).toEqual({
        search: '',
        category_id: '',
        sortBy: 'created_at',
        sortOrder: 'desc',
      })
    })
  })

  describe('Getters', () => {
    it('should return filtered services', () => {
      store.services = [
        { id: 1, name: 'Service 1', is_active: true },
        { id: 2, name: 'Service 2', is_active: false },
      ]

      expect(store.filteredServices).toEqual(store.services)
    })

    it('should calculate services stats', () => {
      store.services = [
        { id: 1, name: 'Service 1', is_active: true, price_ttc: 100 },
        { id: 2, name: 'Service 2', is_active: true, price_ttc: 200 },
        { id: 3, name: 'Service 3', is_active: false, price_ttc: 150 },
      ]
      store.categories = [
        { id: 1, name: 'Category 1' },
        { id: 2, name: 'Category 2' },
      ]

      const stats = store.servicesStats
      expect(stats.total).toBe(3)
      expect(stats.active).toBe(2)
      expect(stats.inactive).toBe(1)
      expect(stats.categories).toBe(2)
      expect(stats.totalValue).toBe(450)
    })
  })

  describe('fetchServices', () => {
    it('should fetch services successfully', async () => {
      const mockResponse = {
        data: {
          services: [
            { id: 1, name: 'Service 1', price_ttc: 100 },
            { id: 2, name: 'Service 2', price_ttc: 200 },
          ],
          pagination: { page: 1, limit: 1000, total: 2, pages: 1 },
        },
      }

      api.get.mockResolvedValueOnce(mockResponse)

      await store.fetchServices()

      expect(api.get).toHaveBeenCalledWith('/services', {
        params: {
          page: 1,
          limit: 1000,
          search: '',
          category_id: '',
          sortBy: 'created_at',
          sortOrder: 'desc',
        },
      })
      expect(store.services).toEqual(mockResponse.data.services)
      expect(store.pagination).toEqual(mockResponse.data.pagination)
      expect(store.loading).toBe(false)
    })

    it('should handle fetch services error', async () => {
      const mockError = new Error('Network error')
      api.get.mockRejectedValueOnce(mockError)

      await expect(store.fetchServices()).rejects.toThrow('Network error')
      expect(store.error).toBe(mockError)
      expect(store.loading).toBe(false)
    })
  })

  describe('fetchService', () => {
    it('should fetch single service successfully', async () => {
      const mockResponse = {
        data: {
          service: { id: 1, name: 'Service 1', price_ttc: 100 },
        },
      }

      api.get.mockResolvedValueOnce(mockResponse)

      await store.fetchService(1)

      expect(api.get).toHaveBeenCalledWith('/services/1')
      expect(store.currentService).toEqual(mockResponse.data.service)
      expect(store.loading).toBe(false)
    })

    it('should handle fetch service error', async () => {
      const mockError = new Error('Service not found')
      api.get.mockRejectedValueOnce(mockError)

      await expect(store.fetchService(999)).rejects.toThrow('Service not found')
      expect(store.error).toBe(mockError)
      expect(store.loading).toBe(false)
    })
  })

  describe('createService', () => {
    it('should create service successfully', async () => {
      const serviceData = { name: 'New Service', price_ttc: 150 }
      const mockResponse = {
        data: {
          service: { id: 3, name: 'New Service', price_ttc: 150 },
        },
      }

      api.post.mockResolvedValueOnce(mockResponse)

      const result = await store.createService(serviceData)

      expect(api.post).toHaveBeenCalledWith('/services', serviceData)
      expect(result).toEqual(mockResponse.data.service)
      expect(store.loading).toBe(false)
    })

    it('should handle create service error', async () => {
      const serviceData = { name: 'New Service' }
      const mockError = new Error('Validation error')
      api.post.mockRejectedValueOnce(mockError)

      await expect(store.createService(serviceData)).rejects.toThrow(
        'Validation error'
      )
      expect(store.error).toBe(mockError)
      expect(store.loading).toBe(false)
    })
  })

  describe('updateService', () => {
    it('should update service successfully', async () => {
      const serviceData = { name: 'Updated Service' }
      const mockResponse = {
        data: {
          service: { id: 1, name: 'Updated Service', price_ttc: 100 },
        },
      }

      api.put.mockResolvedValueOnce(mockResponse)

      const result = await store.updateService(1, serviceData)

      expect(api.put).toHaveBeenCalledWith('/services/1', serviceData)
      expect(result).toEqual(mockResponse.data.service)
      expect(store.loading).toBe(false)
    })

    it('should handle update service error', async () => {
      const serviceData = { name: 'Updated Service' }
      const mockError = new Error('Update failed')
      api.put.mockRejectedValueOnce(mockError)

      await expect(store.updateService(1, serviceData)).rejects.toThrow(
        'Update failed'
      )
      expect(store.error).toBe(mockError)
      expect(store.loading).toBe(false)
    })
  })

  describe('deleteService', () => {
    it('should delete service successfully', async () => {
      api.delete.mockResolvedValueOnce({ data: { message: 'Service deleted' } })

      await store.deleteService(1)

      expect(api.delete).toHaveBeenCalledWith('/services/1')
      expect(store.loading).toBe(false)
    })

    it('should handle delete service error', async () => {
      const mockError = new Error('Delete failed')
      api.delete.mockRejectedValueOnce(mockError)

      await expect(store.deleteService(1)).rejects.toThrow('Delete failed')
      expect(store.error).toBe(mockError)
      expect(store.loading).toBe(false)
    })
  })

  describe('fetchCategories', () => {
    it('should fetch categories successfully', async () => {
      const mockResponse = {
        data: {
          categories: [
            { id: 1, name: 'Category 1' },
            { id: 2, name: 'Category 2' },
          ],
        },
      }

      api.get.mockResolvedValueOnce(mockResponse)

      await store.fetchCategories()

      expect(api.get).toHaveBeenCalledWith('/services/categories')
      expect(store.categories).toEqual(mockResponse.data.categories)
      expect(store.loading).toBe(false)
    })

    it('should handle fetch categories error', async () => {
      const mockError = new Error('Categories not found')
      api.get.mockRejectedValueOnce(mockError)

      await expect(store.fetchCategories()).rejects.toThrow(
        'Categories not found'
      )
      expect(store.error).toBe(mockError)
      expect(store.loading).toBe(false)
    })
  })
})
