import { defineStore } from 'pinia'
import api from '@/utils/api'
import { useToast } from 'vue-toastification'

export const useInvoicesStore = defineStore('invoices', {
  state: () => ({
    invoices: [],
    currentInvoice: null,
    loading: false,
    error: null,
    pagination: { page: 1, limit: 10, total: 0, pages: 0 },
    filters: {
      search: '',
      status: '',
      sortBy: 'created_at',
      sortOrder: 'desc',
    },
  }),
  actions: {
    async fetchInvoices(params = {}) {
      this.loading = true
      this.error = null
      try {
        const query = {
          page: params.page || this.pagination.page,
          limit: params.limit || this.pagination.limit,
          search: params.search ?? this.filters.search,
          status: params.status ?? this.filters.status,
          sortBy: params.sortBy || this.filters.sortBy,
          sortOrder: params.sortOrder || this.filters.sortOrder,
        }
        const { data } = await api.get('/invoices', { params: query })
        this.invoices = data.invoices || []
        if (data.pagination) this.pagination = data.pagination
        this.filters.search = query.search
        this.filters.status = query.status
        this.filters.sortBy = query.sortBy
        this.filters.sortOrder = query.sortOrder
      } catch (error) {
        this.error = error
        useToast().error('Erreur lors du chargement des factures.')
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchInvoice(id) {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.get(`/invoices/${id}`)
        this.currentInvoice = data.invoice
        return data.invoice
      } catch (error) {
        this.error = error
        useToast().error('Erreur lors du chargement de la facture.')
        throw error
      } finally {
        this.loading = false
      }
    },

    async createInvoice(payload) {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.post('/invoices', payload)
        const created = data.invoice
        this.invoices.unshift(created)
        useToast().success('Facture créée avec succès !')
        return created
      } catch (error) {
        this.error = error
        useToast().error('Erreur lors de la création de la facture.')
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateInvoice(id, payload) {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.put(`/invoices/${id}`, payload)
        const updated = data.invoice
        const idx = this.invoices.findIndex((i) => i.id === id)
        if (idx !== -1) this.invoices[idx] = updated
        if (this.currentInvoice?.id === id) this.currentInvoice = updated
        useToast().success('Facture mise à jour !')
        return updated
      } catch (error) {
        this.error = error
        useToast().error('Erreur lors de la mise à jour de la facture.')
        throw error
      } finally {
        this.loading = false
      }
    },

    // Suppression de factures interdite pour conformité légale française
    // Utiliser un avoir à la place

    async updateStatus(id, status) {
      return this.updateInvoice(id, { status })
    },

    async downloadPdf(id) {
      try {
        const resp = await api.get(`/invoices/${id}/pdf`, {
          responseType: 'blob',
        })
        const url = URL.createObjectURL(
          new Blob([resp.data], { type: 'application/pdf' })
        )
        const link = document.createElement('a')
        link.href = url
        link.download = `facture-${id}.pdf`
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)
      } catch (error) {
        useToast().error('Échec du téléchargement du PDF de la facture.')
        throw error
      }
    },

    async createFromQuote(quoteId) {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.post(`/invoices/from-quote/${quoteId}`)
        const created = data.invoice
        this.invoices.unshift(created)
        useToast().success('Facture créée avec succès à partir du devis !')
        return created
      } catch (error) {
        this.error = error
        useToast().error('Erreur lors de la conversion du devis en facture.')
        throw error
      } finally {
        this.loading = false
      }
    },
  },
})
