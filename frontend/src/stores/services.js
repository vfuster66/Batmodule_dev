import { defineStore } from 'pinia'
import api from '@/utils/api'
import { useToast } from 'vue-toastification'

export const useServicesStore = defineStore('services', {
  state: () => ({
    services: [],
    categories: [],
    currentService: null,
    loading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      pages: 0,
    },
    filters: {
      search: '',
      category_id: '',
      sortBy: 'created_at',
      sortOrder: 'desc',
    },
  }),

  getters: {
    // Services triés et filtrés
    filteredServices: (state) => {
      return state.services
    },

    // Statistiques des services
    servicesStats: (state) => {
      const total = state.services.length
      const active = state.services.filter((s) => s.is_active).length
      const inactive = total - active
      const categories = state.categories.length
      const totalValue = state.services.reduce(
        (sum, service) => sum + parseFloat(service.price_ttc || 0),
        0
      )

      return {
        total,
        active,
        inactive,
        categories,
        totalValue,
      }
    },

    // Service par ID
    getServiceById: (state) => (id) => {
      return state.services.find((service) => service.id === id)
    },

    // Services par catégorie
    getServicesByCategory: (state) => (categoryId) => {
      return state.services.filter(
        (service) => service.category_id === categoryId
      )
    },

    // Catégorie par ID
    getCategoryById: (state) => (id) => {
      return state.categories.find((category) => category.id === id)
    },
  },

  actions: {
    // Récupérer toutes les catégories
    async fetchCategories() {
      this.loading = true
      this.error = null

      try {
        const response = await api.get('/services/categories')
        this.categories = response.data.categories
      } catch (error) {
        this.error = error
        useToast().error('Erreur lors du chargement des catégories.')
        throw error
      } finally {
        this.loading = false
      }
    },

    // Créer une nouvelle catégorie
    async createCategory(categoryData) {
      this.loading = true
      this.error = null

      try {
        const response = await api.post('/services/categories', categoryData)
        const newCategory = response.data.category

        // Ajouter la nouvelle catégorie à la liste
        this.categories.push(newCategory)

        useToast().success('Catégorie créée avec succès !')
        return newCategory
      } catch (error) {
        this.error = error
        useToast().error('Erreur lors de la création de la catégorie.')
        throw error
      } finally {
        this.loading = false
      }
    },

    // Récupérer tous les services avec pagination et filtres
    async fetchServices(params = {}) {
      this.loading = true
      this.error = null

      try {
        const queryParams = {
          page: 1,
          limit: 1000, // Récupérer tous les services
          search: params.search || this.filters.search,
          category_id: params.category_id || this.filters.category_id,
          sortBy: params.sortBy || this.filters.sortBy,
          sortOrder: params.sortOrder || this.filters.sortOrder,
        }

        const response = await api.get('/services', { params: queryParams })

        this.services = response.data.services
        this.pagination = {
          page: 1,
          limit: 1000,
          total: response.data.services.length,
          pages: 1,
        }

        // Mettre à jour les filtres
        this.filters.search = queryParams.search
        this.filters.category_id = queryParams.category_id
        this.filters.sortBy = queryParams.sortBy
        this.filters.sortOrder = queryParams.sortOrder
      } catch (error) {
        this.error = error
        useToast().error('Erreur lors du chargement des services.')
        throw error
      } finally {
        this.loading = false
      }
    },

    // Récupérer un service par ID
    async fetchService(id) {
      this.loading = true
      this.error = null

      try {
        const response = await api.get(`/services/${id}`)
        this.currentService = response.data.service
        return response.data.service
      } catch (error) {
        this.error = error
        useToast().error('Erreur lors du chargement du service.')
        throw error
      } finally {
        this.loading = false
      }
    },

    // Créer un nouveau service
    async createService(serviceData) {
      this.loading = true
      this.error = null

      try {
        const response = await api.post('/services', serviceData)
        const newService = response.data.service

        // Ajouter le nouveau service à la liste
        this.services.unshift(newService)

        useToast().success('Service créé avec succès !')
        return newService
      } catch (error) {
        this.error = error
        useToast().error('Erreur lors de la création du service.')
        throw error
      } finally {
        this.loading = false
      }
    },

    // Mettre à jour un service
    async updateService(id, serviceData) {
      this.loading = true
      this.error = null

      try {
        const response = await api.put(`/services/${id}`, serviceData)
        const updatedService = response.data.service

        // Mettre à jour le service dans la liste
        const index = this.services.findIndex((s) => s.id === id)
        if (index !== -1) {
          this.services[index] = updatedService
        }

        // Mettre à jour le service courant si c'est le même
        if (this.currentService && this.currentService.id === id) {
          this.currentService = updatedService
        }

        useToast().success('Service mis à jour avec succès !')
        return updatedService
      } catch (error) {
        this.error = error
        useToast().error('Erreur lors de la mise à jour du service.')
        throw error
      } finally {
        this.loading = false
      }
    },

    // Supprimer un service
    async deleteService(id) {
      this.loading = true
      this.error = null

      try {
        await api.delete(`/services/${id}`)

        // Retirer le service de la liste
        this.services = this.services.filter((s) => s.id !== id)

        // Vider le service courant si c'est le même
        if (this.currentService && this.currentService.id === id) {
          this.currentService = null
        }

        useToast().success('Service supprimé avec succès !')
      } catch (error) {
        this.error = error
        useToast().error('Erreur lors de la suppression du service.')
        throw error
      } finally {
        this.loading = false
      }
    },

    // Rechercher des services
    async searchServices(searchTerm) {
      this.filters.search = searchTerm
      await this.fetchServices({ search: searchTerm, page: 1 })
    },

    // Filtrer par catégorie
    async filterByCategory(categoryId) {
      this.filters.category_id = categoryId
      await this.fetchServices({ category_id: categoryId, page: 1 })
    },

    // Trier les services
    async sortServices(sortBy, sortOrder = 'desc') {
      this.filters.sortBy = sortBy
      this.filters.sortOrder = sortOrder
      await this.fetchServices({ sortBy, sortOrder, page: 1 })
    },

    // Réinitialiser les filtres
    resetFilters() {
      this.filters = {
        search: '',
        category_id: '',
        sortBy: 'created_at',
        sortOrder: 'desc',
      }
    },

    // Vider le service courant
    clearCurrentService() {
      this.currentService = null
    },

    // Réinitialiser le store
    reset() {
      this.services = []
      this.categories = []
      this.currentService = null
      this.loading = false
      this.error = null
      this.pagination = {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
      }
      this.filters = {
        search: '',
        category_id: '',
        sortBy: 'created_at',
        sortOrder: 'desc',
      }
    },
  },
})
