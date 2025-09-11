<template>
  <Layout>
    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <!-- En-tête avec boutons d'ajout -->
      <div
        class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between"
      >
        <div></div>
        <div class="mt-4 sm:mt-0 flex space-x-3">
          <button
            @click="showCreateCategoryModal = true"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg
              class="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              ></path>
            </svg>
            Nouvelle catégorie
          </button>
          <button
            @click="showCreateModal = true"
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg
              class="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              ></path>
            </svg>
            Nouveau service
          </button>
        </div>
      </div>

      <!-- Statistiques -->
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 mb-6">
        <div
          class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
        >
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg
                  class="h-6 w-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  ></path>
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt
                    class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate"
                  >
                    Total services
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ services.length }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div
          class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
        >
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg
                  class="h-6 w-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  ></path>
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt
                    class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate"
                  >
                    Catégories
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ categories.length }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Barre de recherche et filtres -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
        <div class="px-4 py-5 sm:p-6">
          <div
            class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0"
          >
            <div class="flex-1 max-w-lg">
              <div class="relative">
                <div
                  class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                >
                  <svg
                    class="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    ></path>
                  </svg>
                </div>
                <input
                  v-model="searchTerm"
                  @input="debouncedSearch"
                  type="text"
                  placeholder="Rechercher un service..."
                  class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
            <div class="flex items-center space-x-4">
              <select
                v-model="selectedCategory"
                @change="handleCategoryChange"
                class="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
              >
                <option value="">Toutes les catégories</option>
                <option
                  v-for="category in categories"
                  :key="category.id"
                  :value="category.id"
                >
                  {{ category.name }}
                </option>
              </select>
              <select
                v-model="sortBy"
                @change="handleSortChange"
                class="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
              >
                <option value="created_at">Date de création</option>
                <option value="name">Nom</option>
                <option value="price_ht">Prix HT</option>
                <option value="price_ttc">Prix TTC</option>
              </select>
              <button
                @click="toggleSortOrder"
                class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg
                  v-if="sortOrder === 'asc'"
                  class="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 15l7-7 7 7"
                  ></path>
                </svg>
                <svg
                  v-else
                  class="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Liste des services -->
      <div
        class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md"
      >
        <div v-if="loading" class="p-6 text-center">
          <div class="inline-flex items-center">
            <svg
              class="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Chargement des services...
          </div>
        </div>

        <div v-else-if="services.length === 0" class="p-6 text-center">
          <svg
            class="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            ></path>
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Aucun service
          </h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Commencez par créer votre premier service.
          </p>
          <div class="mt-6">
            <button
              @click="showCreateModal = true"
              class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg
                class="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                ></path>
              </svg>
              Nouveau service
            </button>
          </div>
        </div>

        <ul v-else class="divide-y divide-gray-200 dark:divide-gray-700">
          <li
            v-for="service in services"
            :key="service.id"
            class="hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <div class="px-4 py-4 flex items-center justify-between">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div
                    class="h-10 w-10 rounded-full flex items-center justify-center"
                    :style="{
                      backgroundColor: service.category_color + '20',
                      borderColor: service.category_color,
                    }"
                    :class="'border-2'"
                  >
                    <span
                      class="text-sm font-medium"
                      :style="{ color: service.category_color }"
                    >
                      {{ getInitials(service.name) }}
                    </span>
                  </div>
                </div>
                <div class="ml-4">
                  <div class="flex items-center">
                    <p
                      class="text-sm font-medium text-gray-900 dark:text-white"
                    >
                      {{ service.name }}
                    </p>
                    <span
                      v-if="!service.is_active"
                      class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                    >
                      Inactif
                    </span>
                  </div>
                  <div
                    class="flex items-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    <p>{{ service.description || 'Aucune description' }}</p>
                    <span v-if="service.category_name" class="ml-2"
                      >• {{ service.category_name }}</span
                    >
                  </div>
                </div>
              </div>
              <div class="flex items-center space-x-4">
                <div class="text-right">
                  <div class="text-sm text-gray-900 dark:text-white">
                    {{ formatCurrency(service.price_ht) }} HT
                  </div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    {{ formatCurrency(service.price_ttc) }} TTC
                  </div>
                  <div class="text-xs text-gray-400">/ {{ service.unit }}</div>
                </div>
                <div class="flex items-center space-x-2">
                  <button
                    @click="viewService(service)"
                    class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <svg
                      class="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      ></path>
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      ></path>
                    </svg>
                  </button>
                  <button
                    @click="editService(service)"
                    class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    <svg
                      class="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      ></path>
                    </svg>
                  </button>
                  <button
                    @click="deleteService(service)"
                    class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <svg
                      class="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      ></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- Modal de création/édition de service -->
    <ServiceModal
      v-if="showCreateModal || showEditModal"
      :service="editingService"
      :categories="categories"
      :is-edit="showEditModal"
      @close="closeModal"
      @save="handleSaveService"
    />

    <!-- Modal de création de catégorie -->
    <CategoryModal
      v-if="showCreateCategoryModal"
      @close="closeCategoryModal"
      @save="handleSaveCategory"
    />
  </Layout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useServicesStore } from '@/stores/services'
import { useToast } from 'vue-toastification'
import Layout from '@/components/Layout.vue'
import ServiceModal from '@/components/ServiceModal.vue'
import CategoryModal from '@/components/CategoryModal.vue'

const router = useRouter()
const servicesStore = useServicesStore()
const toast = useToast()

// État local
const searchTerm = ref('')
const selectedCategory = ref('')
const sortBy = ref('created_at')
const sortOrder = ref('desc')
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showCreateCategoryModal = ref(false)
const editingService = ref(null)

// Getters du store
const services = computed(() => servicesStore.services)
const categories = computed(() => servicesStore.categories)
const loading = computed(() => servicesStore.loading)

// Recherche avec debounce
let searchTimeout = null
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    servicesStore.searchServices(searchTerm.value)
  }, 300)
}

// Gestion des filtres
const handleCategoryChange = () => {
  servicesStore.filterByCategory(selectedCategory.value)
}

const handleSortChange = () => {
  servicesStore.sortServices(sortBy.value, sortOrder.value)
}

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  servicesStore.sortServices(sortBy.value, sortOrder.value)
}

// Actions sur les services
const viewService = (service) => {
  router.push(`/services/${service.id}`)
}

const editService = (service) => {
  editingService.value = { ...service }
  showEditModal.value = true
}

const deleteService = async (service) => {
  if (
    confirm(`Êtes-vous sûr de vouloir supprimer le service "${service.name}" ?`)
  ) {
    try {
      await servicesStore.deleteService(service.id)
    } catch (error) {
      // L'erreur est déjà gérée dans le store
    }
  }
}

// Gestion des modals
const closeModal = () => {
  showCreateModal.value = false
  showEditModal.value = false
  editingService.value = null
}

const closeCategoryModal = () => {
  showCreateCategoryModal.value = false
}

const handleSaveService = async (serviceData) => {
  try {
    if (showEditModal.value) {
      await servicesStore.updateService(editingService.value.id, serviceData)
    } else {
      await servicesStore.createService(serviceData)
    }
    closeModal()
  } catch (error) {
    // L'erreur est déjà gérée dans le store
  }
}

const handleSaveCategory = async (categoryData) => {
  try {
    await servicesStore.createCategory(categoryData)
    closeCategoryModal()
  } catch (error) {
    // L'erreur est déjà gérée dans le store
  }
}

// Utilitaires
const getInitials = (name) => {
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount || 0)
}

// Initialisation
onMounted(async () => {
  await servicesStore.fetchCategories()
  await servicesStore.fetchServices()
})

// Watchers
watch(
  () => servicesStore.filters,
  (newFilters) => {
    sortBy.value = newFilters.sortBy
    sortOrder.value = newFilters.sortOrder
    selectedCategory.value = newFilters.category_id
  },
  { deep: true }
)
</script>
