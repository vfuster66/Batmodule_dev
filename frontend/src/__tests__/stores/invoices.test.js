import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useInvoicesStore } from '../../stores/invoices'
import api from '../../utils/api'

// Mock des dépendances
vi.mock('../../utils/api')
vi.mock('vue-toastification', () => ({
  useToast: () => ({
    error: vi.fn(),
    success: vi.fn(),
  }),
}))

describe('Invoices Store', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useInvoicesStore()
    vi.clearAllMocks()
  })

  describe('State', () => {
    it('should have initial state', () => {
      expect(store.invoices).toEqual([])
      expect(store.currentInvoice).toBeNull()
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

  describe('fetchInvoices', () => {
    it('should fetch invoices successfully', async () => {
      const mockResponse = {
        data: {
          invoices: [
            { id: 1, title: 'Invoice 1', status: 'draft' },
            { id: 2, title: 'Invoice 2', status: 'sent' },
          ],
          pagination: { page: 1, limit: 10, total: 2, pages: 1 },
        },
      }

      api.get.mockResolvedValueOnce(mockResponse)

      await store.fetchInvoices()

      expect(api.get).toHaveBeenCalledWith('/invoices', {
        params: {
          page: 1,
          limit: 10,
          search: '',
          status: '',
          sortBy: 'created_at',
          sortOrder: 'desc',
        },
      })
      expect(store.invoices).toEqual(mockResponse.data.invoices)
      expect(store.pagination).toEqual(mockResponse.data.pagination)
      expect(store.loading).toBe(false)
    })

    it('should handle fetch invoices error', async () => {
      const mockError = new Error('Network error')
      api.get.mockRejectedValueOnce(mockError)

      await expect(store.fetchInvoices()).rejects.toThrow('Network error')
      expect(store.error).toBe(mockError)
      expect(store.loading).toBe(false)
    })
  })

  describe('fetchInvoice', () => {
    it('should fetch single invoice successfully', async () => {
      const mockResponse = {
        data: {
          invoice: { id: 1, title: 'Invoice 1', status: 'draft' },
        },
      }

      api.get.mockResolvedValueOnce(mockResponse)

      await store.fetchInvoice(1)

      expect(api.get).toHaveBeenCalledWith('/invoices/1')
      expect(store.currentInvoice).toEqual(mockResponse.data.invoice)
      expect(store.loading).toBe(false)
    })

    it('should handle fetch invoice error', async () => {
      const mockError = new Error('Invoice not found')
      api.get.mockRejectedValueOnce(mockError)

      await expect(store.fetchInvoice(999)).rejects.toThrow('Invoice not found')
      expect(store.error).toBe(mockError)
      expect(store.loading).toBe(false)
    })
  })

  describe('createInvoice', () => {
    it('should create invoice successfully', async () => {
      const invoiceData = { title: 'New Invoice', clientId: 1 }
      const mockResponse = {
        data: {
          invoice: { id: 3, title: 'New Invoice', status: 'draft' },
        },
      }

      api.post.mockResolvedValueOnce(mockResponse)

      const result = await store.createInvoice(invoiceData)

      expect(api.post).toHaveBeenCalledWith('/invoices', invoiceData)
      expect(result).toEqual(mockResponse.data.invoice)
      expect(store.loading).toBe(false)
    })

    it('should handle create invoice error', async () => {
      const invoiceData = { title: 'New Invoice' }
      const mockError = new Error('Validation error')
      api.post.mockRejectedValueOnce(mockError)

      await expect(store.createInvoice(invoiceData)).rejects.toThrow(
        'Validation error'
      )
      expect(store.error).toBe(mockError)
      expect(store.loading).toBe(false)
    })
  })

  describe('updateInvoice', () => {
    it('should update invoice successfully', async () => {
      const invoiceData = { title: 'Updated Invoice' }
      const mockResponse = {
        data: {
          invoice: { id: 1, title: 'Updated Invoice', status: 'draft' },
        },
      }

      api.put.mockResolvedValueOnce(mockResponse)

      const result = await store.updateInvoice(1, invoiceData)

      expect(api.put).toHaveBeenCalledWith('/invoices/1', invoiceData)
      expect(result).toEqual(mockResponse.data.invoice)
      expect(store.loading).toBe(false)
    })

    it('should handle update invoice error', async () => {
      const invoiceData = { title: 'Updated Invoice' }
      const mockError = new Error('Update failed')
      api.put.mockRejectedValueOnce(mockError)

      await expect(store.updateInvoice(1, invoiceData)).rejects.toThrow(
        'Update failed'
      )
      expect(store.error).toBe(mockError)
      expect(store.loading).toBe(false)
    })
  })

  describe('addPayment', () => {
    it('should add payment successfully', async () => {
      const paymentData = { amount: 100, method: 'card' }
      const mockResponse = {
        data: {
          payment: { id: 1, amount: 100, method: 'card' },
        },
      }

      api.post.mockResolvedValueOnce(mockResponse)

      const result = await store.addPayment(1, paymentData)

      expect(api.post).toHaveBeenCalledWith('/invoices/1/payments', paymentData)
      expect(result).toEqual(mockResponse.data.payment)
      expect(store.loading).toBe(false)
    })

    it('should handle add payment error', async () => {
      const paymentData = { amount: 100 }
      const mockError = new Error('Payment failed')
      api.post.mockRejectedValueOnce(mockError)

      await expect(store.addPayment(1, paymentData)).rejects.toThrow(
        'Payment failed'
      )
      expect(store.error).toBe(mockError)
      expect(store.loading).toBe(false)
    })
  })

  describe('updateStatus', () => {
    it('should update invoice status successfully', async () => {
      const mockResponse = {
        data: {
          invoice: { id: 1, title: 'Invoice 1', status: 'sent' },
        },
      }

      api.put.mockResolvedValueOnce(mockResponse)

      const result = await store.updateStatus(1, 'sent')

      expect(api.put).toHaveBeenCalledWith('/invoices/1/status', {
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
