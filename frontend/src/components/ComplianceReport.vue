<template>
  <div class="space-y-6">
    <!-- En-tête du rapport -->
    <div class="bg-white shadow rounded-lg p-6">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-gray-900">Rapport de conformité</h2>
        <button
          @click="refreshReport"
          :disabled="loading"
          class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <svg
            class="w-4 h-4 mr-2"
            :class="{ 'animate-spin': loading }"
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
          Actualiser
        </button>
      </div>
    </div>

    <!-- Score de conformité -->
    <div class="bg-white shadow rounded-lg p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">
        Score de conformité
      </h3>
      <div class="flex items-center space-x-6">
        <div class="flex-shrink-0">
          <div class="w-24 h-24 relative">
            <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                class="text-gray-200"
                stroke="currentColor"
                stroke-width="3"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                :class="scoreColor"
                stroke="currentColor"
                stroke-width="3"
                fill="none"
                :stroke-dasharray="`${complianceScore}, 100`"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="text-2xl font-bold" :class="scoreTextColor"
                >{{ complianceScore }}%</span
              >
            </div>
          </div>
        </div>
        <div class="flex-1">
          <div class="space-y-2">
            <div class="flex items-center">
              <div class="w-3 h-3 rounded-full mr-3" :class="scoreColor"></div>
              <span class="text-sm font-medium text-gray-900">{{
                scoreLabel
              }}</span>
            </div>
            <p class="text-sm text-gray-600">{{ scoreDescription }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Détails de conformité -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Champs obligatoires -->
      <div class="bg-white shadow rounded-lg p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">
          Champs obligatoires
        </h3>
        <div class="space-y-3">
          <div
            v-for="field in requiredFields"
            :key="field.key"
            class="flex items-center justify-between"
          >
            <span class="text-sm text-gray-700">{{ field.label }}</span>
            <div class="flex items-center">
              <svg
                v-if="field.completed"
                class="w-5 h-5 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                />
              </svg>
              <svg
                v-else
                class="w-5 h-5 text-red-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Champs légaux -->
      <div class="bg-white shadow rounded-lg p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Champs légaux</h3>
        <div class="space-y-3">
          <div
            v-for="field in legalFields"
            :key="field.key"
            class="flex items-center justify-between"
          >
            <span class="text-sm text-gray-700">{{ field.label }}</span>
            <div class="flex items-center">
              <svg
                v-if="field.completed"
                class="w-5 h-5 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                />
              </svg>
              <svg
                v-else
                class="w-5 h-5 text-yellow-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recommandations -->
    <div
      v-if="recommendations.length > 0"
      class="bg-white shadow rounded-lg p-6"
    >
      <h3 class="text-lg font-medium text-gray-900 mb-4">Recommandations</h3>
      <div class="space-y-3">
        <div
          v-for="(recommendation, index) in recommendations"
          :key="index"
          class="flex items-start"
        >
          <div class="flex-shrink-0">
            <svg
              class="w-5 h-5 text-blue-500 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-gray-700">{{ recommendation }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="bg-white shadow rounded-lg p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Actions</h3>
      <div class="flex space-x-4">
        <button
          @click="exportReport"
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
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Exporter le rapport
        </button>

        <button
          @click="printReport"
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
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
          Imprimer
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCompanySettingsStore } from '../stores/companySettings'
import { useToast } from 'vue-toastification'

const store = useCompanySettingsStore()
const toast = useToast()

const loading = ref(false)
const report = ref(null)

// Getters
const complianceScore = computed(() => store.complianceScore)
const isCompliant = computed(() => store.isCompliant)
const recommendations = computed(() => store.recommendations)

// Classes CSS pour le score
const scoreColor = computed(() => {
  if (complianceScore.value >= 80) return 'text-green-500'
  if (complianceScore.value >= 60) return 'text-yellow-500'
  return 'text-red-500'
})

const scoreTextColor = computed(() => {
  if (complianceScore.value >= 80) return 'text-green-600'
  if (complianceScore.value >= 60) return 'text-yellow-600'
  return 'text-red-600'
})

const scoreLabel = computed(() => {
  if (complianceScore.value >= 80) return 'Excellent'
  if (complianceScore.value >= 60) return 'Bon'
  return 'À améliorer'
})

const scoreDescription = computed(() => {
  if (complianceScore.value >= 80)
    return 'Votre configuration est conforme aux exigences légales'
  if (complianceScore.value >= 60) return 'Quelques améliorations recommandées'
  return 'Configuration incomplète, action requise'
})

// Champs obligatoires
const requiredFields = computed(() => [
  {
    key: 'company_name',
    label: "Nom de l'entreprise",
    completed: !!store.settings.company_name,
  },
  { key: 'siret', label: 'SIRET', completed: !!store.settings.siret },
  {
    key: 'forme_juridique',
    label: 'Forme juridique',
    completed: !!store.settings.forme_juridique,
  },
  {
    key: 'address_line1',
    label: 'Adresse',
    completed: !!store.settings.address_line1,
  },
  {
    key: 'postal_code',
    label: 'Code postal',
    completed: !!store.settings.postal_code,
  },
  { key: 'city', label: 'Ville', completed: !!store.settings.city },
  { key: 'phone', label: 'Téléphone', completed: !!store.settings.phone },
  { key: 'email', label: 'Email', completed: !!store.settings.email },
])

// Champs légaux
const legalFields = computed(() => [
  {
    key: 'rcs_number',
    label: 'Numéro RCS',
    completed: !!store.settings.rcs_number,
  },
  {
    key: 'tribunal_commercial',
    label: 'Tribunal de commerce',
    completed: !!store.settings.tribunal_commercial,
  },
  {
    key: 'tva_intracommunautaire',
    label: 'TVA intracommunautaire',
    completed: !!store.settings.tva_intracommunautaire,
  },
  { key: 'ape_code', label: 'Code APE', completed: !!store.settings.ape_code },
  {
    key: 'insurance_company',
    label: "Compagnie d'assurance",
    completed: !!store.settings.insurance_company,
  },
  {
    key: 'insurance_policy_number',
    label: 'Numéro de police',
    completed: !!store.settings.insurance_policy_number,
  },
])

// Méthodes
const refreshReport = async () => {
  loading.value = true
  try {
    await store.validateSettings()
    toast.success('Rapport actualisé')
  } catch (error) {
    toast.error("Erreur lors de l'actualisation")
  } finally {
    loading.value = false
  }
}

const exportReport = () => {
  const data = {
    score: complianceScore.value,
    isCompliant: isCompliant.value,
    requiredFields: requiredFields.value,
    legalFields: legalFields.value,
    recommendations: recommendations.value,
    timestamp: new Date().toISOString(),
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `rapport-conformite-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  toast.success('Rapport exporté')
}

const printReport = () => {
  window.print()
}

onMounted(async () => {
  try {
    await store.validateSettings()
  } catch (error) {
    console.error('Erreur lors du chargement du rapport:', error)
  }
})
</script>
