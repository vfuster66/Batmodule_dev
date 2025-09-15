import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useQuotesStore } from '../../stores/quotes'
import api from '../../utils/api'

// Mock des dépendances
vi.mock('../../utils/api')
vi.mock('vue-toastification', () => ({
  useToast: () => ({
    error: vi.fn(),
    success: vi.fn(),
  }),
}))

describe('Quotes Store', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useQuotesStore()
    vi.clearAllMocks()
  })

  describe('State', () => {
    it('should have initial state', () => {
      expect(store.quotes).toEqual([])
      expect(store.currentQuote).toBeNull()
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
        status: '',
        sortBy: 'created_at',
        sortOrder: 'desc',
      })
    })
  })

  describe('fetchQuotes', () => {
    it('should fetch quotes successfully', async () => {
      const mockResponse = {
        data: {
          quotes: [
            { id: 1, title: 'Quote 1', status: 'draft' },
            { id: 2, title: 'Quote 2', status: 'sent' },
          ],
          pagination: { page: 1, limit: 10, total: 2, pages: 1 },
        },
      }

      api.get.mockResolvedValueOnce(mockResponse)

      await store.fetchQuotes()

      expect(api.get).toHaveBeenCalledWith('/quotes', {
        params: {
          page: 1,
          limit: 10,
          search: '',
          status: '',
          sortBy: 'created_at',
          sortOrder: 'desc',
        },
      })
      expect(store.quotes).toEqual(mockResponse.data.quotes)
      expect(store.pagination).toEqual(mockResponse.data.pagination)
      expect(store.loading).toBe(false)
    })

    it('should handle fetch quotes error', async () => {
      const mockError = new Error('Network error')
      api.get.mockRejectedValueOnce(mockError)

      await expect(store.fetchQuotes()).rejects.toThrow('Network error')
      expect(store.error).toBe(mockError)
      expect(store.loading).toBe(false)
    })

    it('should use custom parameters', async () => {
      const mockResponse = {
        data: {
          quotes: [],
          pagination: { page: 2, limit: 20, total: 0, pages: 0 },
        },
      }

      api.get.mockResolvedValueOnce(mockResponse)

      await store.fetchQuotes({ page: 2, limit: 20, search: 'test' })

      expect(api.get).toHaveBeenCalledWith('/quotes', {
        params: {
          page: 2,
          limit: 20,
          search: 'test',
          status: '',
          sortBy: 'created_at',
          sortOrder: 'desc',
        },
      })
    })
  })

  describe('fetchQuote', () => {
    it('should fetch single quote successfully', async () => {
      const mockResponse = {
        data: {
          quote: { id: 1, title: 'Quote 1', status: 'draft' },
        },
      }

      api.get.mockResolvedValueOnce(mockResponse)

      await store.fetchQuote(1)

      expect(api.get).toHaveBeenCalledWith('/quotes/1')
      expect(store.currentQuote).toEqual(mockResponse.data.quote)
      expect(store.loading).toBe(false)
    })

    it('should handle fetch quote error', async () => {
      const mockError = new Error('Quote not found')
      api.get.mockRejectedValueOnce(mockError)

      await expect(store.fetchQuote(999)).rejects.toThrow('Quote not found')
      expect(store.error).toBe(mockError)
      expect(store.loading).toBe(false)
    })
  })

  describe('createQuote', () => {
    it('should create quote successfully', async () => {
      const quoteData = { title: 'New Quote', clientId: 1 }
      const mockResponse = {
        data: {
          quote: { id: 3, title: 'New Quote', status: 'draft' },
        },
      }

      api.post.mockResolvedValueOnce(mockResponse)

      const result = await store.createQuote(quoteData)

      expect(api.post).toHaveBeenCalledWith('/quotes', quoteData)
      expect(result).toEqual(mockResponse.data.quote)
      expect(store.loading).toBe(false)
    })

    it('should handle create quote error', async () => {
      const quoteData = { title: 'New Quote' }
      const mockError = new Error('Validation error')
      api.post.mockRejectedValueOnce(mockError)

      await expect(store.createQuote(quoteData)).rejects.toThrow(
        'Validation error'
      )
      expect(store.error).toBe(mockError)
      expect(store.loading).toBe(false)
    })
  })

  describe('updateQuote', () => {
    it('should update quote successfully', async () => {
      const quoteData = { title: 'Updated Quote' }
      const mockResponse = {
        data: {
          quote: { id: 1, title: 'Updated Quote', status: 'draft' },
        },
      }

      api.put.mockResolvedValueOnce(mockResponse)

      const result = await store.updateQuote(1, quoteData)

      expect(api.put).toHaveBeenCalledWith('/quotes/1', quoteData)
      expect(result).toEqual(mockResponse.data.quote)
      expect(store.loading).toBe(false)
    })

    it('should handle update quote error', async () => {
      const quoteData = { title: 'Updated Quote' }
      const mockError = new Error('Update failed')
      api.put.mockRejectedValueOnce(mockError)

      await expect(store.updateQuote(1, quoteData)).rejects.toThrow(
        'Update failed'
      )
      expect(store.error).toBe(mockError)
      expect(store.loading).toBe(false)
    })
  })

  describe('deleteQuote', () => {
    it('should delete quote successfully', async () => {
      api.delete.mockResolvedValueOnce({ data: { message: 'Quote deleted' } })

      await store.deleteQuote(1)

      expect(api.delete).toHaveBeenCalledWith('/quotes/1')
      expect(store.loading).toBe(false)
    })

    it('should handle delete quote error', async () => {
      const mockError = new Error('Delete failed')
      api.delete.mockRejectedValueOnce(mockError)

      await expect(store.deleteQuote(1)).rejects.toThrow('Delete failed')
      expect(store.error).toBe(mockError)
      expect(store.loading).toBe(false)
    })
  })

  describe('updateStatus', () => {
    it('should update quote status successfully', async () => {
      const mockResponse = {
        data: {
          quote: { id: 1, title: 'Quote 1', status: 'sent' },
        },
      }

      api.put.mockResolvedValueOnce(mockResponse)

      const result = await store.updateStatus(1, 'sent')

      expect(api.put).toHaveBeenCalledWith('/quotes/1/status', {
        status: 'sent',
      })
      expect(result).toEqual(mockResponse.data)
      expect(store.loading).toBe(false)
    })

    it('should handle update status error', async () => {
      const mockError = new Error('Status update failed')
      api.put.mockRejectedValueOnce(mockError)

      await expect(store.updateStatus(1, 'invalid')).rejects.toThrow(
        'Status update failed'
      )
      expect(store.error).toBe(mockError)
      expect(store.loading).toBe(false)
    })
  })
})
