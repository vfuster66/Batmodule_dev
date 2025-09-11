<template>
  <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto">
    <!-- Overlay avec animation -->
    <div
      class="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity duration-300"
      @click="close"
    ></div>

    <!-- Modal avec animation -->
    <div class="flex min-h-full items-center justify-center p-4 text-center">
      <div
        class="relative transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-2xl transition-all duration-300 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <!-- En-tête du modal -->
        <div class="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-semibold text-white">
              {{ client ? 'Modifier le client' : 'Nouveau client' }}
            </h3>
            <button
              @click="close"
              class="text-white hover:text-gray-200 transition-colors"
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
        </div>

        <!-- Contenu du modal -->
        <div class="px-6 py-6">
          <form @submit.prevent="saveClient" class="space-y-8">
            <!-- Type de client -->
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4
                class="text-lg font-medium text-gray-900 dark:text-white mb-4"
              >
                Type de client
              </h4>
              <div class="flex space-x-6">
                <label class="flex items-center cursor-pointer">
                  <input
                    id="is_individual"
                    name="client_type"
                    type="radio"
                    :value="false"
                    v-model="formData.is_company"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span
                    class="ml-3 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Particulier
                  </span>
                </label>
                <label class="flex items-center cursor-pointer">
                  <input
                    id="is_company"
                    name="client_type"
                    type="radio"
                    :value="true"
                    v-model="formData.is_company"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span
                    class="ml-3 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Entreprise
                  </span>
                </label>
              </div>
            </div>

            <!-- Informations personnelles -->
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4
                class="text-lg font-medium text-gray-900 dark:text-white mb-4"
              >
                Informations personnelles
              </h4>
              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label
                    for="first_name"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Prénom *
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    v-model="formData.first_name"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white transition-colors"
                  />
                </div>
                <div>
                  <label
                    for="last_name"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Nom *
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    v-model="formData.last_name"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white transition-colors"
                  />
                </div>
                <div class="sm:col-span-2">
                  <label
                    for="email"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    v-model="formData.email"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white transition-colors"
                  />
                </div>
                <div class="sm:col-span-2">
                  <label
                    for="phone"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    v-model="formData.phone"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white transition-colors"
                  />
                </div>
              </div>
            </div>

            <!-- Informations entreprise (si entreprise) -->
            <div
              v-if="formData.is_company"
              class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800"
            >
              <h4
                class="text-lg font-medium text-gray-900 dark:text-white mb-4"
              >
                Informations entreprise
              </h4>
              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div class="sm:col-span-2">
                  <label
                    for="company_name"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Nom de l'entreprise *
                  </label>
                  <input
                    type="text"
                    id="company_name"
                    v-model="formData.company_name"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white transition-colors"
                  />
                </div>
                <div>
                  <label
                    for="siret"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    SIRET
                  </label>
                  <input
                    type="text"
                    id="siret"
                    v-model="formData.siret"
                    placeholder="12345678901234"
                    maxlength="14"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white transition-colors"
                  />
                </div>
                <div>
                  <label
                    for="vat_number"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    N° TVA intracommunautaire
                  </label>
                  <input
                    type="text"
                    id="vat_number"
                    v-model="formData.vat_number"
                    placeholder="FR12345678901"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white transition-colors"
                  />
                </div>
                <div>
                  <label
                    for="legal_form"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Forme juridique
                  </label>
                  <select
                    id="legal_form"
                    v-model="formData.legal_form"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white transition-colors"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="SARL">SARL</option>
                    <option value="SAS">SAS</option>
                    <option value="EURL">EURL</option>
                    <option value="SASU">SASU</option>
                    <option value="Auto-entrepreneur">Auto-entrepreneur</option>
                    <option value="Micro-entreprise">Micro-entreprise</option>
                    <option value="EIRL">EIRL</option>
                    <option value="SNC">SNC</option>
                    <option value="SCI">SCI</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                <div>
                  <label
                    for="rcs_number"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    N° RCS
                  </label>
                  <input
                    type="text"
                    id="rcs_number"
                    v-model="formData.rcs_number"
                    placeholder="RCS Paris 123 456 789"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white transition-colors"
                  />
                </div>
                <div>
                  <label
                    for="ape_code"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Code APE/NAF
                  </label>
                  <input
                    type="text"
                    id="ape_code"
                    v-model="formData.ape_code"
                    placeholder="6201Z"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white transition-colors"
                  />
                </div>
                <div>
                  <label
                    for="capital_social"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Capital social (€)
                  </label>
                  <input
                    type="number"
                    id="capital_social"
                    v-model="formData.capital_social"
                    min="0"
                    step="0.01"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white transition-colors"
                  />
                </div>
              </div>
            </div>

            <!-- Adresse -->
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4
                class="text-lg font-medium text-gray-900 dark:text-white mb-4"
              >
                Adresse
              </h4>
              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div class="sm:col-span-2">
                  <label
                    for="address_line1"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Adresse ligne 1
                  </label>
                  <input
                    type="text"
                    id="address_line1"
                    v-model="formData.address_line1"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white transition-colors"
                  />
                </div>
                <div class="sm:col-span-2">
                  <label
                    for="address_line2"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Adresse ligne 2
                  </label>
                  <input
                    type="text"
                    id="address_line2"
                    v-model="formData.address_line2"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white transition-colors"
                  />
                </div>
                <div>
                  <label
                    for="postal_code"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Code postal
                  </label>
                  <input
                    type="text"
                    id="postal_code"
                    v-model="formData.postal_code"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white transition-colors"
                  />
                </div>
                <div>
                  <label
                    for="city"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Ville
                  </label>
                  <input
                    type="text"
                    id="city"
                    v-model="formData.city"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white transition-colors"
                  />
                </div>
                <div class="sm:col-span-2">
                  <label
                    for="country"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Pays
                  </label>
                  <input
                    type="text"
                    id="country"
                    v-model="formData.country"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white transition-colors"
                  />
                </div>
              </div>
            </div>

            <!-- Notes -->
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4
                class="text-lg font-medium text-gray-900 dark:text-white mb-4"
              >
                Notes
              </h4>
              <div>
                <label
                  for="notes"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Notes et commentaires
                </label>
                <textarea
                  id="notes"
                  v-model="formData.notes"
                  rows="4"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white transition-colors resize-none"
                  placeholder="Ajoutez des notes sur ce client..."
                ></textarea>
              </div>
            </div>

            <!-- Boutons d'action -->
            <div
              class="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-600"
            >
              <button
                type="button"
                @click="close"
                class="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                :disabled="clientsStore.loading"
                class="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                {{ clientsStore.loading ? 'Sauvegarde...' : 'Sauvegarder' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useClientsStore } from '@/stores/clients'

const props = defineProps({
  show: Boolean,
  client: Object,
})

const emit = defineEmits(['close', 'saved'])

const clientsStore = useClientsStore()

const defaultFormData = {
  first_name: '',
  last_name: '',
  company_name: '',
  email: '',
  phone: '',
  address_line1: '',
  address_line2: '',
  postal_code: '',
  city: '',
  country: 'France',
  notes: '',
  is_company: false,
  // Champs légaux pour les entreprises
  siret: '',
  vat_number: '',
  legal_form: '',
  rcs_number: '',
  ape_code: '',
  capital_social: null,
}

const formData = ref({ ...defaultFormData })

watch(
  () => props.client,
  (newClient) => {
    if (newClient) {
      // Mapper les données du backend (camelCase) vers le frontend (snake_case)
      formData.value = {
        ...defaultFormData,
        first_name: newClient.firstName || '',
        last_name: newClient.lastName || '',
        company_name: newClient.companyName || '',
        email: newClient.email || '',
        phone: newClient.phone || '',
        address_line1: newClient.addressLine1 || '',
        address_line2: newClient.addressLine2 || '',
        postal_code: newClient.postalCode || '',
        city: newClient.city || '',
        country: newClient.country || 'France',
        notes: newClient.notes || '',
        is_company: newClient.isCompany || false,
        siret: newClient.siret || '',
        vat_number: newClient.vatNumber || '',
        legal_form: newClient.legalForm || '',
        rcs_number: newClient.rcsNumber || '',
        ape_code: newClient.apeCode || '',
        capital_social: newClient.capitalSocial || null,
      }
    } else {
      formData.value = { ...defaultFormData }
    }
  },
  { immediate: true }
)

const saveClient = async () => {
  try {
    if (props.client) {
      await clientsStore.updateClient(props.client.id, formData.value)
    } else {
      await clientsStore.createClient(formData.value)
    }
    emit('saved')
  } catch (error) {
    // Error handled by store, just prevent modal from closing
  }
}

const close = () => {
  emit('close')
}
</script>
