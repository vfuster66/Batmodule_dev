<template>
  <Layout>
    <div class="space-y-6">
      <!-- Alertes globales -->
      <div v-if="store.error" class="mb-6">
        <div class="bg-red-50 border border-red-200 rounded-md p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg
                class="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">Erreur</h3>
              <div class="mt-2 text-sm text-red-700">
                <p>{{ store.error }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Indicateur de chargement -->
      <div v-if="store.loading" class="mb-6">
        <div class="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg
                class="animate-spin h-5 w-5 text-blue-400"
                xmlns="http://www.w3.org/2000/svg"
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
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-blue-800">Chargement...</h3>
              <div class="mt-2 text-sm text-blue-700">
                <p>Récupération des paramètres de l'entreprise...</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Contenu principal -->
      <div v-else>
        <!-- Onglets de navigation -->
        <div class="mb-8">
          <nav class="flex space-x-8" aria-label="Tabs">
            <button
              @click="activeTab = 'settings'"
              :class="[
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm',
              ]"
            >
              Paramètres
            </button>
            <button
              @click="activeTab = 'compliance'"
              :class="[
                activeTab === 'compliance'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm',
              ]"
            >
              Conformité
            </button>
            <button
              @click="activeTab = 'legal'"
              :class="[
                activeTab === 'legal'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm',
              ]"
            >
              Mentions légales
            </button>
          </nav>
        </div>

        <!-- Onglet Paramètres -->
        <div v-if="activeTab === 'settings'">
          <CompanySettingsForm />
        </div>

        <!-- Onglet Conformité -->
        <div v-if="activeTab === 'compliance'">
          <ComplianceReport />
        </div>

        <!-- Onglet Mentions légales -->
        <div v-if="activeTab === 'legal'">
          <LegalMentionsEditor />
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useCompanySettingsStore } from '../stores/companySettings'
import Layout from '../components/Layout.vue'
import CompanySettingsForm from '../components/CompanySettingsForm.vue'
import ComplianceReport from '../components/ComplianceReport.vue'
import LegalMentionsEditor from '../components/LegalMentionsEditor.vue'

const store = useCompanySettingsStore()

// Champs obligatoires pour la configuration de base
const requiredFields = [
  'company_name',
  'siret',
  'forme_juridique',
  'address_line1',
  'postal_code',
  'city',
  'phone',
  'email',
]

// Vérifier si la configuration est complète
const isSetupComplete = computed(() => {
  if (!store.settings || Object.keys(store.settings).length === 0) {
    return false
  }

  return requiredFields.every((field) => {
    const value = store.settings[field]
    return value && value.toString().trim() !== ''
  })
})

// État de chargement pour éviter les appels multiples
const isLoadingSettings = ref(false)

const activeTab = ref('settings')

onMounted(async () => {
  // Éviter les appels multiples
  if (isLoadingSettings.value) return

  isLoadingSettings.value = true

  try {
    // Ne charger que si les paramètres ne sont pas déjà chargés
    if (Object.keys(store.settings).length === 0) {
      await store.fetchSettings()
    }
  } catch (error) {
    console.error('Erreur lors du chargement des paramètres:', error)
  } finally {
    isLoadingSettings.value = false
  }
})
</script>
