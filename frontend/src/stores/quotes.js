import { defineStore } from 'pinia'
import api from '@/utils/api'
import { useToast } from 'vue-toastification'

export const useQuotesStore = defineStore('quotes', {
  state: () => ({
    quotes: [],
    currentQuote: null,
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
    async fetchQuotes(params = {}) {
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
        const { data } = await api.get('/quotes', { params: query })
        this.quotes = data.quotes || []
        if (data.pagination) this.pagination = data.pagination
        this.filters.search = query.search
        this.filters.status = query.status
        this.filters.sortBy = query.sortBy
        this.filters.sortOrder = query.sortOrder
      } catch (error) {
        this.error = error
        useToast().error('Erreur lors du chargement des devis.')
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchQuote(id) {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.get(`/quotes/${id}`)
        this.currentQuote = data.quote
        return data.quote
      } catch (error) {
        this.error = error
        useToast().error('Erreur lors du chargement du devis.')
        throw error
      } finally {
        this.loading = false
      }
    },

    async createQuote(payload) {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.post('/quotes', payload)
        const created = data.quote
        this.quotes.unshift(created)
        useToast().success('Devis créé avec succès !')
        return created
      } catch (error) {
        this.error = error
        const details = error?.response?.data?.details
        if (Array.isArray(details) && details.length) {
          details.forEach((msg) => useToast().error(msg))
        } else {
          useToast().error(
            error?.response?.data?.message ||
              'Erreur lors de la création du devis.'
          )
        }
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateQuote(id, payload) {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.put(`/quotes/${id}`, payload)
        const updated = data.quote
        const idx = this.quotes.findIndex((q) => q.id === id)
        if (idx !== -1) this.quotes[idx] = updated
        if (this.currentQuote?.id === id) this.currentQuote = updated
        useToast().success('Devis mis à jour !')
        return updated
      } catch (error) {
        this.error = error
        useToast().error('Erreur lors de la mise à jour du devis.')
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteQuote(id) {
      this.loading = true
      this.error = null
      try {
        await api.delete(`/quotes/${id}`)
        this.quotes = this.quotes.filter((q) => q.id !== id)
        if (this.currentQuote?.id === id) this.currentQuote = null
        useToast().success('Devis supprimé !')
      } catch (error) {
        this.error = error
        useToast().error('Erreur lors de la suppression du devis.')
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateStatus(id, status) {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.put(`/quotes/${id}/status`, { status })
        // Mettre à jour le quote dans la liste
        const idx = this.quotes.findIndex((q) => q.id === id)
        if (idx !== -1)
          this.quotes[idx] = {
            ...this.quotes[idx],
            status: data.status,
            updatedAt: data.updatedAt,
          }
        if (this.currentQuote?.id === id)
          this.currentQuote = {
            ...this.currentQuote,
            status: data.status,
            updatedAt: data.updatedAt,
          }
        useToast().success('Statut du devis mis à jour')
        return data
      } catch (error) {
        this.error = error
        useToast().error('Erreur lors de la mise à jour du statut du devis.')
        throw error
      } finally {
        this.loading = false
      }
    },

    async downloadPdf(id, filename) {
      try {
        const resp = await api.get(`/quotes/${id}/pdf`, {
          responseType: 'blob',
        })
        const url = URL.createObjectURL(
          new Blob([resp.data], { type: 'application/pdf' })
        )
        const link = document.createElement('a')
        link.href = url
        link.download = filename || `devis-${id}.pdf`
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)
      } catch (error) {
        useToast().error('Échec du téléchargement du PDF du devis.')
        throw error
      }
    },
    async sendByEmail(id, payload) {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.post(`/quotes/${id}/send`, payload)
        useToast().success('Devis envoyé par e‑mail !')
        return data
      } catch (error) {
        this.error = error
        useToast().error("Échec de l'envoi du devis par e‑mail.")
        throw error
      } finally {
        this.loading = false
      }
    },
  },
})
