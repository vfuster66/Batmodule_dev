import { defineStore } from 'pinia'
import api from '@/utils/api'
import { useToast } from 'vue-toastification'

export const useClientsStore = defineStore('clients', {
  state: () => ({
    clients: [],
    filters: {
      search: '',
      sortBy: 'created_at',
      sortOrder: 'desc',
    },
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      pages: 0,
    },
    loading: false,
    error: null,
  }),
  actions: {
    async fetchClients(params = {}) {
      this.loading = true
      this.error = null
      try {
        const queryParams = {
          page: params.page || this.pagination.page,
          limit: params.limit || this.pagination.limit,
          search: params.search ?? this.filters.search,
          sortBy: params.sortBy || this.filters.sortBy,
          sortOrder: params.sortOrder || this.filters.sortOrder,
        }

        const response = await api.get('/clients', { params: queryParams })
        this.clients = response.data.clients
        this.pagination = response.data.pagination
        // sync filters
        this.filters.search = queryParams.search
        this.filters.sortBy = queryParams.sortBy
        this.filters.sortOrder = queryParams.sortOrder
      } catch (error) {
        this.error = error
        useToast().error('Erreur lors du chargement des clients.')
      } finally {
        this.loading = false
      }
    },
    async searchClients(term) {
      this.filters.search = term
      await this.fetchClients({ search: term, page: 1 })
    },
    async sortClients(sortBy, sortOrder = 'desc') {
      this.filters.sortBy = sortBy
      this.filters.sortOrder = sortOrder
      await this.fetchClients({ sortBy, sortOrder, page: 1 })
    },
    async toggleSortOrder() {
      const next = this.filters.sortOrder === 'asc' ? 'desc' : 'asc'
      await this.sortClients(this.filters.sortBy, next)
    },
    async changePage(page) {
      await this.fetchClients({ page })
    },
    resetFilters() {
      this.filters = { search: '', sortBy: 'created_at', sortOrder: 'desc' }
    },
    async createClient(clientData) {
      this.loading = true
      this.error = null
      try {
        const payload = mapClientPayload(clientData)
        // Debug payload shape in console to help trace 400s
        console.debug('POST /clients payload:', payload)
        const response = await api.post('/clients', payload)
        useToast().success('Client créé avec succès !')
        return response.data.client
      } catch (error) {
        this.error = error
        useToast().error(
          error.response?.data?.message ||
            'Erreur lors de la création du client.'
        )
        throw error
      } finally {
        this.loading = false
      }
    },
    async updateClient(id, clientData) {
      this.loading = true
      this.error = null
      try {
        const payload = mapClientPayload(clientData)
        console.debug('PUT /clients payload:', payload)
        const response = await api.put(`/clients/${id}`, payload)
        useToast().success('Client mis à jour avec succès !')
        return response.data.client
      } catch (error) {
        this.error = error
        console.error('Erreur updateClient:', error.response?.data)
        useToast().error(
          error.response?.data?.message ||
            'Erreur lors de la mise à jour du client.'
        )
        throw error
      } finally {
        this.loading = false
      }
    },
    async deleteClient(id) {
      this.loading = true
      this.error = null
      try {
        await api.delete(`/clients/${id}`)
        useToast().success('Client supprimé avec succès !')
        this.clients = this.clients.filter((client) => client.id !== id)
        this.pagination.total--
      } catch (error) {
        this.error = error
        useToast().error(
          error.response?.data?.message ||
            'Erreur lors de la suppression du client.'
        )
        throw error
      } finally {
        this.loading = false
      }
    },
    resetClients() {
      this.clients = []
      this.pagination = { page: 1, limit: 10, total: 0, pages: 0 }
      this.loading = false
      this.error = null
    },
    async exportClients() {
      this.loading = true
      this.error = null
      try {
        const response = await api.get('/clients/export', {
          responseType: 'blob',
        })

        // Créer un lien de téléchargement
        const blob = new Blob([response.data], {
          type: 'text/csv;charset=utf-8;',
        })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute(
          'download',
          `clients-${new Date().toISOString().split('T')[0]}.csv`
        )
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        useToast().success('Export des clients réussi !')
      } catch (error) {
        this.error = error
        useToast().error("Erreur lors de l'export des clients.")
        throw error
      } finally {
        this.loading = false
      }
    },
    async importClients(clientsData) {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.post('/clients/import', {
          clients: clientsData,
        })
        useToast().success(data.message)

        // Recharger la liste des clients
        await this.fetchClients()

        return data.results
      } catch (error) {
        this.error = error
        useToast().error("Erreur lors de l'import des clients.")
        throw error
      } finally {
        this.loading = false
      }
    },
  },
})

// Map snake_case (modal) to backend's expected camelCase and drop empty strings
function mapClientPayload(raw) {
  const obj = raw || {}
  const map = {
    first_name: 'firstName',
    last_name: 'lastName',
    company_name: 'companyName',
    address_line1: 'addressLine1',
    address_line2: 'addressLine2',
    postal_code: 'postalCode',
    ape_code: 'apeCode',
    vat_number: 'vatNumber',
    legal_form: 'legalForm',
    rcs_number: 'rcsNumber',
    capital_social: 'capitalSocial',
    is_company: 'isCompany',
  }

  const payload = {}
  // copy known mappings
  Object.keys(obj).forEach((key) => {
    const target = map[key] || key
    let v = obj[key]
    if (typeof v === 'string') v = v.trim()
    // Pour les champs requis (firstName, lastName), on garde même les chaînes vides
    if (target === 'firstName' || target === 'lastName') {
      payload[target] = v || ''
    } else if (v === '' || v === undefined) {
      return
    } else {
      payload[target] = v
    }
  })

  return payload
}
