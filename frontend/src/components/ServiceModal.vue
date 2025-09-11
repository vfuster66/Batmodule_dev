<template>
  <div
    class="fixed inset-0 z-50 overflow-y-auto"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true"
  >
    <div
      class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
    >
      <!-- Background overlay -->
      <div
        class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        aria-hidden="true"
        @click="closeModal"
      ></div>

      <!-- This element is to trick the browser into centering the modal contents. -->
      <span
        class="hidden sm:inline-block sm:align-middle sm:h-screen"
        aria-hidden="true"
        >&#8203;</span
      >

      <!-- Modal panel -->
      <div
        class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full"
      >
        <form @submit.prevent="handleSubmit">
          <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="w-full">
                <div class="flex items-center justify-between mb-4">
                  <h3
                    class="text-lg leading-6 font-medium text-gray-900 dark:text-white"
                    id="modal-title"
                  >
                    {{ isEdit ? 'Modifier le service' : 'Nouveau service' }}
                  </h3>
                  <button
                    type="button"
                    @click="closeModal"
                    class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg
                      class="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                      ></path>
                    </svg>
                  </button>
                </div>

                <div class="space-y-6">
                  <!-- Informations de base -->
                  <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label
                        for="name"
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Nom du service *
                      </label>
                      <input
                        id="name"
                        v-model="formData.name"
                        type="text"
                        required
                        class="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                      />
                    </div>

                    <div>
                      <label
                        for="category_id"
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Catégorie
                      </label>
                      <select
                        id="category_id"
                        v-model="formData.category_id"
                        class="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                      >
                        <option value="">Aucune catégorie</option>
                        <option
                          v-for="category in categories"
                          :key="category.id"
                          :value="category.id"
                        >
                          {{ category.name }}
                        </option>
                      </select>
                    </div>
                  </div>

                  <!-- Description -->
                  <div>
                    <label
                      for="description"
                      class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Description
                    </label>
                    <textarea
                      id="description"
                      v-model="formData.description"
                      rows="3"
                      class="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                      placeholder="Description détaillée du service..."
                    ></textarea>
                  </div>

                  <!-- Prix et unité -->
                  <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    <div>
                      <label
                        for="unit"
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Unité *
                      </label>
                      <select
                        id="unit"
                        v-model="formData.unit"
                        required
                        class="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                      >
                        <option value="m²">m²</option>
                        <option value="m">m</option>
                        <option value="m³">m³</option>
                        <option value="h">heure</option>
                        <option value="jour">jour</option>
                        <option value="unité">unité</option>
                        <option value="forfait">forfait</option>
                      </select>
                    </div>

                    <div>
                      <label
                        for="price_ht"
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Prix HT (€) *
                      </label>
                      <input
                        id="price_ht"
                        v-model.number="formData.price_ht"
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        @input="calculateTTC"
                        class="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                      />
                    </div>

                    <div>
                      <label
                        for="vat_rate"
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        TVA (%)
                      </label>
                      <input
                        id="vat_rate"
                        v-model.number="formData.vat_rate"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        @input="calculateTTC"
                        class="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                      />
                    </div>
                  </div>

                  <!-- Prix TTC calculé -->
                  <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                    <div class="flex justify-between items-center">
                      <span
                        class="text-sm font-medium text-gray-700 dark:text-gray-300"
                        >Prix TTC :</span
                      >
                      <span
                        class="text-lg font-bold text-gray-900 dark:text-white"
                      >
                        {{ formatCurrency(formData.price_ttc) }}
                      </span>
                    </div>
                  </div>

                  <!-- Statut -->
                  <div>
                    <div class="flex items-center">
                      <input
                        id="is_active"
                        v-model="formData.is_active"
                        type="checkbox"
                        class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        for="is_active"
                        class="ml-2 block text-sm text-gray-900 dark:text-gray-300"
                      >
                        Service actif
                      </label>
                    </div>
                    <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Les services inactifs n'apparaîtront pas dans les devis et
                      factures
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div
            class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse"
          >
            <button
              type="submit"
              :disabled="loading"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                v-if="loading"
                class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
              {{ isEdit ? 'Mettre à jour' : 'Créer' }}
            </button>
            <button
              type="button"
              @click="closeModal"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'

const props = defineProps({
  service: {
    type: Object,
    default: null,
  },
  categories: {
    type: Array,
    default: () => [],
  },
  isEdit: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close', 'save'])

const loading = ref(false)

// Données du formulaire
const formData = reactive({
  name: '',
  description: '',
  unit: 'm²',
  price_ht: 0,
  price_ttc: 0,
  vat_rate: 20.0,
  category_id: '',
  is_active: true,
})

// Initialiser le formulaire
const initForm = () => {
  if (props.service) {
    Object.assign(formData, {
      name: props.service.name || '',
      description: props.service.description || '',
      unit: props.service.unit || 'm²',
      price_ht: parseFloat(props.service.price_ht) || 0,
      price_ttc: parseFloat(props.service.price_ttc) || 0,
      vat_rate: parseFloat(props.service.vat_rate) || 20.0,
      category_id: props.service.category_id || '',
      is_active: props.service.is_active !== false,
    })
  } else {
    // Réinitialiser le formulaire
    Object.assign(formData, {
      name: '',
      description: '',
      unit: 'm²',
      price_ht: 0,
      price_ttc: 0,
      vat_rate: 20.0,
      category_id: '',
      is_active: true,
    })
  }
}

// Calculer le prix TTC
const calculateTTC = () => {
  const ht = parseFloat(formData.price_ht) || 0
  const vat = parseFloat(formData.vat_rate) || 0
  formData.price_ttc = ht * (1 + vat / 100)
}

// Watcher pour réinitialiser le formulaire quand le service change
watch(
  () => props.service,
  () => {
    initForm()
  },
  { immediate: true }
)

// Gestion de la soumission
const handleSubmit = async () => {
  loading.value = true

  try {
    // Validation basique
    if (!formData.name || !formData.price_ht || !formData.price_ttc) {
      throw new Error('Les champs nom, prix HT et prix TTC sont obligatoires')
    }

    // Préparer les données à envoyer
    const serviceData = { ...formData }

    // Nettoyer les champs vides
    if (serviceData.category_id === '') {
      serviceData.category_id = null
    }
    if (serviceData.description === '') {
      serviceData.description = null
    }

    emit('save', serviceData)
  } catch (error) {
    console.error('Erreur lors de la validation:', error)
    // L'erreur sera gérée par le composant parent
  } finally {
    loading.value = false
  }
}

// Fermer le modal
const closeModal = () => {
  emit('close')
}

// Utilitaires
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount || 0)
}
</script>
