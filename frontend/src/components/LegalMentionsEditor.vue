<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <div class="bg-white shadow rounded-lg p-6">
      <h2 class="text-2xl font-bold text-gray-900">Mentions légales</h2>
      <p class="mt-2 text-sm text-gray-600">
        Configurez les mentions légales qui apparaîtront sur vos documents
        (devis, factures, CGV).
      </p>
    </div>

    <!-- Formulaire des mentions légales -->
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Pénalités de retard -->
      <div class="bg-white shadow rounded-lg p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">
          Pénalités de retard
        </h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Taux de pénalité (%)
            </label>
            <input
              v-model.number="form.late_fee_rate"
              type="number"
              min="0"
              max="100"
              step="0.01"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Description des pénalités
            </label>
            <textarea
              v-model="form.late_fee_description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="En cas de retard de paiement, des pénalités sont exigibles au taux légal en vigueur, ainsi qu'une indemnité forfaitaire pour frais de recouvrement de 40€ (art. L441‑10 C. com.)."
            ></textarea>
          </div>
        </div>
      </div>

      <!-- TVA sur encaissements -->
      <div class="bg-white shadow rounded-lg p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">
          TVA sur encaissements
        </h3>
        <div class="space-y-4">
          <div class="flex items-center">
            <input
              v-model="form.vat_on_payments"
              type="checkbox"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label class="ml-2 block text-sm text-gray-900">
              Activer la TVA sur les encaissements
            </label>
          </div>

          <div v-if="form.vat_on_payments">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Texte de mention TVA
            </label>
            <textarea
              v-model="form.vat_on_payments_text"
              rows="2"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="TVA sur les encaissements (art. 283-1 CGI)"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Droit de rétractation (B2C) -->
      <div v-if="form.is_b2c" class="bg-white shadow rounded-lg p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">
          Droit de rétractation (B2C)
        </h3>
        <div class="space-y-4">
          <div class="flex items-center">
            <input
              v-model="form.withdrawal_applicable"
              type="checkbox"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label class="ml-2 block text-sm text-gray-900">
              Droit de rétractation applicable
            </label>
          </div>

          <div v-if="form.withdrawal_applicable">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Délai de rétractation (jours)
              </label>
              <input
                v-model.number="form.withdrawal_period_days"
                type="number"
                min="1"
                max="30"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Texte de rétractation
              </label>
              <textarea
                v-model="form.withdrawal_text"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Vous disposez d'un délai de rétractation de 14 jours pour renoncer à votre commande. Ce délai court à compter du jour de la signature du devis ou de la réception de la facture."
              ></textarea>
            </div>
          </div>
        </div>
      </div>

      <!-- Mentions légales générales -->
      <div class="bg-white shadow rounded-lg p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">
          Mentions légales générales
        </h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Mentions légales
            </label>
            <textarea
              v-model="form.legal_mentions"
              rows="4"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Société immatriculée au RCS de [VILLE] sous le numéro [RCS], TVA intracommunautaire [TVA], Code APE [APE]. Siège social : [ADRESSE]."
            ></textarea>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                URL des CGV
              </label>
              <input
                v-model="form.cgv_url"
                type="url"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://www.example.com/cgv"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                URL de la politique de confidentialité
              </label>
              <input
                v-model="form.privacy_policy_url"
                type="url"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://www.example.com/privacy"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Modèles prédéfinis -->
      <div class="bg-white shadow rounded-lg p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">
          Modèles prédéfinis
        </h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Sélectionner un modèle
            </label>
            <select
              v-model="selectedTemplate"
              @change="applyTemplate"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner un modèle...</option>
              <option value="default">Modèle par défaut</option>
              <option value="btp">Modèle BTP</option>
              <option value="b2c">Modèle B2C</option>
              <option value="complete">Modèle complet</option>
            </select>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              type="button"
              @click="loadTemplates"
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg
                class="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Charger les modèles
            </button>

            <button
              type="button"
              @click="previewMentions"
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg
                class="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              Aperçu
            </button>

            <button
              type="button"
              @click="viewPublicPages"
              class="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg
                class="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              Voir les pages publiques
            </button>
          </div>
        </div>
      </div>

      <!-- Boutons d'action -->
      <div class="flex justify-end space-x-4">
        <button
          type="button"
          @click="resetForm"
          class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Annuler
        </button>

        <button
          type="submit"
          :disabled="loading"
          class="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {{ loading ? 'Sauvegarde...' : 'Sauvegarder' }}
        </button>
      </div>
    </form>

    <!-- Modal d'aperçu -->
    <div
      v-if="showPreview"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
    >
      <div
        class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white"
      >
        <div class="mt-3">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900">
              Aperçu des mentions légales
            </h3>
            <button
              @click="showPreview = false"
              class="text-gray-400 hover:text-gray-600"
            >
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div class="prose max-w-none">
            <div class="text-sm text-gray-600 space-y-2">
              <p v-if="form.late_fee_description">
                {{ form.late_fee_description }}
              </p>
              <p v-if="form.vat_on_payments && form.vat_on_payments_text">
                {{ form.vat_on_payments_text }}
              </p>
              <p v-if="form.withdrawal_applicable && form.withdrawal_text">
                {{ form.withdrawal_text }}
              </p>
              <p v-if="form.legal_mentions">{{ form.legal_mentions }}</p>
            </div>
          </div>

          <div class="mt-6 flex justify-end">
            <button
              @click="showPreview = false"
              class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useCompanySettingsStore } from '../stores/companySettings'
import { useToast } from 'vue-toastification'

const store = useCompanySettingsStore()
const toast = useToast()

// État local
const form = ref({})
const loading = ref(false)
const selectedTemplate = ref('')
const showPreview = ref(false)
const templates = ref({})

// Getters
const isB2C = computed(() => store.settings.is_b2c)

// Méthodes
const loadSettings = async () => {
  try {
    console.log('🔍 Chargement des paramètres dans LegalMentionsEditor...')
    await store.fetchSettings()
    form.value = { ...store.settings }
    console.log('🔍 Paramètres chargés:', form.value)
  } catch (error) {
    console.error('🔍 Erreur lors du chargement des paramètres:', error)
    toast.error('Erreur lors du chargement des paramètres')
  }
}

const loadTemplates = async () => {
  try {
    console.log('🔍 Chargement des modèles légaux...')
    const data = await store.getLegalTemplates()
    templates.value = data
    console.log('🔍 Modèles chargés:', data)
    toast.success('Modèles chargés')
  } catch (error) {
    console.error('🔍 Erreur lors du chargement des modèles:', error)
    toast.error('Erreur lors du chargement des modèles')
  }
}

const applyTemplate = () => {
  if (!selectedTemplate.value) return

  const template = templates.value[selectedTemplate.value]
  if (template) {
    Object.assign(form.value, template)
    toast.success('Modèle appliqué')
  }
}

const handleSubmit = async () => {
  loading.value = true
  try {
    await store.updateSettings(form.value)
    toast.success('Mentions légales sauvegardées')
  } catch (error) {
    toast.error('Erreur lors de la sauvegarde')
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  form.value = { ...store.settings }
}

const previewMentions = () => {
  showPreview.value = true
}

const viewPublicPages = () => {
  // Ouvrir les pages publiques dans de nouveaux onglets
  window.open('/mentions-legales', '_blank')
  window.open('/cgv', '_blank')
  window.open('/politique-confidentialite', '_blank')
}

// Lifecycle
onMounted(() => {
  console.log('🔍 LegalMentionsEditor monté')
  console.log('🔍 Store settings:', store.settings)
  console.log('🔍 Store settings keys:', Object.keys(store.settings))

  // Ne charger les paramètres que s'ils ne sont pas déjà chargés
  if (Object.keys(store.settings).length === 0) {
    console.log('🔍 Chargement des paramètres car store vide')
    loadSettings()
  } else {
    console.log('🔍 Utilisation des paramètres existants')
    form.value = { ...store.settings }
  }
  // Ne pas charger les templates automatiquement
})

// Watchers
watch(
  () => store.settings,
  (newSettings) => {
    if (newSettings && Object.keys(newSettings).length > 0) {
      form.value = { ...newSettings }
    }
  },
  { deep: true }
)
</script>
