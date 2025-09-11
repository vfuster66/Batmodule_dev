<template>
  <Layout>
    <div class="space-y-6">
      <!-- En-tête -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Modifier le devis {{ quote?.quoteNumber || '' }}
          </h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Modifiez les détails de votre devis
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="saveQuote"
            :disabled="loading"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            <svg
              v-if="loading"
              class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
            <svg
              v-else
              class="h-4 w-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            {{ loading ? 'Sauvegarde...' : 'Sauvegarder' }}
          </button>
          <button
            @click="cancelEdit"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Annuler
          </button>
        </div>
      </div>

      <!-- Loading / Error -->
      <div
        v-if="loading && !quote"
        class="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center"
      >
        <div
          class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"
        ></div>
        <p class="mt-2 text-gray-500 dark:text-gray-400">
          Chargement du devis...
        </p>
      </div>
      <div
        v-else-if="!quote"
        class="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center"
      >
        <p class="text-gray-500 dark:text-gray-400">Devis introuvable</p>
      </div>

      <div v-else class="space-y-6">
        <!-- Informations générales -->
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Informations générales
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Titre du devis
              </label>
              <input
                v-model="form.title"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Validité jusqu'au
              </label>
              <input
                v-model="form.validUntil"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div class="mt-4">
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Description
            </label>
            <textarea
              v-model="form.description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
            ></textarea>
          </div>
          <div class="mt-4">
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Notes
            </label>
            <textarea
              v-model="form.notes"
              rows="2"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
            ></textarea>
          </div>
        </div>

        <!-- Client & Adresses -->
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Client & adresses
          </h3>

          <!-- Client (lecture seule) -->
          <div class="mb-6">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-md font-medium text-gray-900 dark:text-white">
                Client
              </h4>
              <div class="flex items-center gap-3">
                <router-link
                  v-if="quote?.client"
                  :to="`/clients/${quote.client.id}`"
                  class="text-sm text-blue-600"
                  >Voir la fiche client →</router-link
                >
                <button
                  @click="showClientModal = true"
                  class="text-sm px-3 py-1 rounded-md bg-indigo-600 text-white"
                >
                  Modifier
                </button>
              </div>
            </div>
            <div
              v-if="quote?.client"
              class="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm"
            >
              <div>
                <div class="text-gray-500">Prénom</div>
                <div class="text-gray-900 dark:text-white">
                  {{ quote.client.firstName || '-' }}
                </div>
              </div>
              <div>
                <div class="text-gray-500">Nom</div>
                <div class="text-gray-900 dark:text-white">
                  {{ quote.client.lastName || '-' }}
                </div>
              </div>
              <div>
                <div class="text-gray-500">Entreprise</div>
                <div class="text-gray-900 dark:text-white">
                  {{ quote.client.companyName || '-' }}
                </div>
              </div>
              <div>
                <div class="text-gray-500">Email</div>
                <div class="text-gray-900 dark:text-white">
                  {{ quote.client.email || '-' }}
                </div>
              </div>
              <div>
                <div class="text-gray-500">Téléphone</div>
                <div class="text-gray-900 dark:text-white">
                  {{ quote.client.phone || '-' }}
                </div>
              </div>
              <div class="md:col-span-2">
                <div class="text-gray-500">Adresse ligne 1</div>
                <div class="text-gray-900 dark:text-white">
                  {{ quote.client.addressLine1 || '-' }}
                </div>
              </div>
              <div class="md:col-span-2">
                <div class="text-gray-500">Adresse ligne 2</div>
                <div class="text-gray-900 dark:text-white">
                  {{ quote.client.addressLine2 || '-' }}
                </div>
              </div>
              <div>
                <div class="text-gray-500">Code postal</div>
                <div class="text-gray-900 dark:text-white">
                  {{ quote.client.postalCode || '-' }}
                </div>
              </div>
              <div>
                <div class="text-gray-500">Ville</div>
                <div class="text-gray-900 dark:text-white">
                  {{ quote.client.city || '-' }}
                </div>
              </div>
              <div>
                <div class="text-gray-500">Pays</div>
                <div class="text-gray-900 dark:text-white">
                  {{ quote.client.country || '-' }}
                </div>
              </div>
            </div>
            <div v-else class="text-sm text-gray-600 dark:text-gray-300">
              Aucun client associé.
            </div>
          </div>

          <!-- Adresse de chantier -->
          <div>
            <h4 class="text-md font-medium text-gray-900 dark:text-white mb-2">
              Adresse de chantier
            </h4>
            <div class="flex items-center mb-3">
              <input
                v-model="form.siteSameAsBilling"
                type="checkbox"
                id="siteSameAsBilling"
                class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label
                for="siteSameAsBilling"
                class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Même adresse que la facturation
              </label>
            </div>

            <div
              v-if="!form.siteSameAsBilling"
              class="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <label
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Adresse ligne 1
                </label>
                <input
                  v-model="form.siteAddressLine1"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Adresse ligne 2
                </label>
                <input
                  v-model="form.siteAddressLine2"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Code postal
                </label>
                <input
                  v-model="form.sitePostalCode"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Ville
                </label>
                <input
                  v-model="form.siteCity"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div v-else class="text-sm text-gray-600 dark:text-gray-300">
              L'adresse de chantier sera identique à l'adresse de facturation.
            </div>
          </div>
        </div>

        <!-- Sections et articles -->
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              Sections et articles
            </h3>
            <button
              @click="addSection"
              class="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              <svg
                class="h-4 w-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Ajouter une section
            </button>
          </div>

          <div
            v-for="(section, sectionIndex) in form.sections"
            :key="sectionIndex"
            class="mb-6 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
          >
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-md font-medium text-gray-900 dark:text-white">
                Section {{ sectionIndex + 1 }}
              </h4>
              <button
                @click="removeSection(sectionIndex)"
                v-if="form.sections.length > 1"
                class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
              >
                <svg
                  class="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Titre de la section
                </label>
                <input
                  v-model="section.title"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Description
                </label>
                <input
                  v-model="section.description"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <!-- Ajouter depuis le catalogue -->
            <div class="flex items-center gap-2 mb-3">
              <select
                v-model="selectedServiceIdPerSection[sectionIndex]"
                class="flex-1 px-3 py-1 rounded-md border dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">— Ajouter depuis le catalogue —</option>
                <option v-for="s in services" :key="s.id" :value="s.id">
                  {{ s.name }} ({{ s.unit }}) —
                  {{ formatCurrency(s.priceHt) }} HT
                </option>
              </select>
              <button
                @click="addFromCatalogToSection(sectionIndex)"
                :disabled="!selectedServiceIdPerSection[sectionIndex]"
                class="text-sm px-3 py-1 rounded-md bg-green-600 text-white"
              >
                Ajouter
              </button>
            </div>

            <!-- Articles de la section -->
            <div class="space-y-3">
              <div
                v-for="(item, itemIndex) in section.items"
                :key="itemIndex"
                class="grid grid-cols-12 gap-2 items-end"
              >
                <div class="col-span-4">
                  <label
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Description
                  </label>
                  <input
                    v-model="item.description"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div class="col-span-1">
                  <label
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Unité
                  </label>
                  <input
                    v-model="item.unit"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div class="col-span-1">
                  <label
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Qté
                  </label>
                  <input
                    v-model.number="item.quantity"
                    type="number"
                    step="0.01"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div class="col-span-2">
                  <label
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Prix HT
                  </label>
                  <input
                    v-model.number="item.unitPriceHt"
                    type="number"
                    step="0.01"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div class="col-span-1">
                  <label
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    TVA %
                  </label>
                  <input
                    v-model.number="item.vatRate"
                    type="number"
                    step="0.01"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div class="col-span-2">
                  <label
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Total TTC
                  </label>
                  <div
                    class="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white"
                  >
                    {{ formatCurrency(calculateItemTotal(item)) }}
                  </div>
                </div>
                <div class="col-span-1">
                  <button
                    @click="removeItem(sectionIndex, itemIndex)"
                    class="w-full px-3 py-2 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 border border-red-300 dark:border-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <svg
                      class="h-4 w-4 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <button
                @click="addItem(sectionIndex)"
                class="w-full px-3 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <svg
                  class="h-4 w-4 inline mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Ajouter un article
              </button>
            </div>
          </div>
        </div>

        <!-- Totaux -->
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Totaux
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="text-center">
              <div class="text-sm text-gray-500 dark:text-gray-400">
                Sous-total HT
              </div>
              <div class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ formatCurrency(totals.subtotalHt) }}
              </div>
            </div>
            <div class="text-center">
              <div class="text-sm text-gray-500 dark:text-gray-400">
                Total TVA
              </div>
              <div class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ formatCurrency(totals.totalVat) }}
              </div>
            </div>
            <div class="text-center">
              <div class="text-sm text-gray-500 dark:text-gray-400">
                Total TTC
              </div>
              <div class="text-xl font-bold text-green-600 dark:text-green-400">
                {{ formatCurrency(totals.totalTtc) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <ClientModal
      :show="showClientModal"
      :client="quote?.client"
      @close="showClientModal = false"
      @saved="handleClientSaved"
    />
  </Layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuotesStore } from '@/stores/quotes'
import { useServicesStore } from '@/stores/services'
import { useToast } from 'vue-toastification'
import Layout from '@/components/Layout.vue'
import ClientModal from '@/components/ClientModal.vue'

const route = useRoute()
const router = useRouter()
const quotesStore = useQuotesStore()
const servicesStore = useServicesStore()
const services = computed(() => servicesStore.services)
const selectedServiceIdPerSection = ref({})
const showClientModal = ref(false)
const toast = useToast()

const id = computed(() => route.params.id)
const loading = ref(false)
const quote = ref(null)

// Formulaire d'édition
const form = ref({
  title: '',
  description: '',
  notes: '',
  validUntil: '',
  sections: [],
})

// Fonctions utilitaires
const formatCurrency = (amount) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
    Number(amount || 0)
  )

const calculateItemTotal = (item) => {
  const qty = Number(item.quantity || 0)
  const pu = Number(item.unitPriceHt || 0)
  const vat = Number(item.vatRate || 0) / 100
  const ht = qty * pu
  const ttc = ht * (1 + vat)
  return ttc
}

const calculateTotals = () => {
  const allItems = form.value.sections.flatMap((s) => s.items || [])
  const subtotalHt = allItems.reduce((sum, item) => {
    if (!item) return sum
    const qty = Number(item.quantity || 0)
    const pu = Number(item.unitPriceHt || 0)
    return sum + qty * pu
  }, 0)
  const totalVat = allItems.reduce((sum, item) => {
    if (!item) return sum
    const qty = Number(item.quantity || 0)
    const pu = Number(item.unitPriceHt || 0)
    const vat = Number(item.vatRate || 0) / 100
    return sum + qty * pu * vat
  }, 0)
  const totalTtc = subtotalHt + totalVat
  return { subtotalHt, totalVat, totalTtc }
}

const totals = computed(() => calculateTotals())

// Gestion des sections
const addSection = () => {
  form.value.sections.push({
    title: '',
    description: '',
    items: [
      {
        description: '',
        unit: 'm²',
        quantity: 1,
        unitPriceHt: 0,
        vatRate: 20,
      },
    ],
  })
}

const removeSection = (index) => {
  if (form.value.sections.length > 1) {
    form.value.sections.splice(index, 1)
  }
}

const addItem = (sectionIndex) => {
  form.value.sections[sectionIndex].items.push({
    description: '',
    unit: 'm²',
    quantity: 1,
    unitPriceHt: 0,
    vatRate: 20,
  })
}

const removeItem = (sectionIndex, itemIndex) => {
  form.value.sections[sectionIndex].items.splice(itemIndex, 1)
}

// Chargement du devis
const loadQuote = async () => {
  loading.value = true
  try {
    await quotesStore.fetchQuote(id.value)
    const currentQuote = quotesStore.currentQuote

    if (currentQuote) {
      quote.value = currentQuote
      const sections = currentQuote.sections || []
      // Formater la date de validité pour l'input date
      const formatDateForInput = (dateString) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        return date.toISOString().split('T')[0]
      }

      // Construire les sections avec leurs items à partir de currentQuote.items (liste plate)
      const items = Array.isArray(currentQuote.items) ? currentQuote.items : []

      form.value = {
        title: currentQuote.title || '',
        description: currentQuote.description || '',
        notes: currentQuote.notes || '',
        validUntil: formatDateForInput(currentQuote.validUntil),
        // Adresses
        siteSameAsBilling: currentQuote.siteAddress?.sameAsBilling || false,
        siteAddressLine1: currentQuote.siteAddress?.addressLine1 || '',
        siteAddressLine2: currentQuote.siteAddress?.addressLine2 || '',
        sitePostalCode: currentQuote.siteAddress?.postalCode || '',
        siteCity: currentQuote.siteAddress?.city || '',
        siteCountry: currentQuote.siteAddress?.country || '',
        sections:
          sections.length > 0
            ? sections.map((section) => ({
                id: section.id,
                title: section.title || '',
                description: section.description || '',
                items: items
                  .filter((it) => it.sectionId === section.id)
                  .map((it) => ({
                    description: it.description || '',
                    unit: it.unit || 'm²',
                    quantity: Number(it.quantity || 1),
                    unitPriceHt: Number(it.unitPriceHt || 0),
                    vatRate: Number(it.vatRate || 20),
                  })),
              }))
            : [
                {
                  title: 'Général',
                  description: '',
                  items:
                    items.length > 0
                      ? items.map((it) => ({
                          description: it.description || '',
                          unit: it.unit || 'm²',
                          quantity: Number(it.quantity || 1),
                          unitPriceHt: Number(it.unitPriceHt || 0),
                          vatRate: Number(it.vatRate || 20),
                        }))
                      : [
                          {
                            description: '',
                            unit: 'm²',
                            quantity: 1,
                            unitPriceHt: 0,
                            vatRate: 20,
                          },
                        ],
                },
              ],
      }

      // Client affiché en lecture seule via quote.client
    }
  } catch (error) {
    toast.error('Erreur lors du chargement du devis')
    console.error('Erreur:', error)
  } finally {
    loading.value = false
  }
}

// Sauvegarde
const saveQuote = async () => {
  loading.value = true
  try {
    const payload = {
      title: form.value.title,
      description: form.value.description,
      notes: form.value.notes,
      validUntil: form.value.validUntil,
      siteSameAsBilling: form.value.siteSameAsBilling,
      siteAddressLine1: form.value.siteAddressLine1,
      siteAddressLine2: form.value.siteAddressLine2,
      sitePostalCode: form.value.sitePostalCode,
      siteCity: form.value.siteCity,
      siteCountry: form.value.siteCountry,
      sections: form.value.sections,
    }

    await quotesStore.updateQuote(id.value, payload)
    toast.success('Devis mis à jour avec succès')
    router.push(`/quotes/${id.value}`)
  } catch (error) {
    toast.error('Erreur lors de la sauvegarde du devis')
    console.error('Erreur:', error)
  } finally {
    loading.value = false
  }
}

// Annulation
const cancelEdit = () => {
  router.push(`/quotes/${id.value}`)
}

// Initialisation
onMounted(() => {
  loadQuote()
  servicesStore.fetchServices({ limit: 100 })
})

// Gestion du modal client
const handleClientSaved = async () => {
  showClientModal.value = false
  await loadQuote()
}

// Ajouter un service du catalogue à une section
const addFromCatalogToSection = (sectionIndex) => {
  const id = selectedServiceIdPerSection.value[sectionIndex]
  if (!id) return
  const s = services.value.find((x) => x.id === id)
  if (!s) return
  form.value.sections[sectionIndex].items.push({
    description: s.name,
    unit: s.unit || '',
    quantity: 1,
    unitPriceHt: Number(s.priceHt || 0),
    vatRate: Number(s.vatRate || 20),
  })
  selectedServiceIdPerSection.value[sectionIndex] = ''
}
</script>
