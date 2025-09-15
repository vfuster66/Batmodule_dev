<template>
  <Layout>
    <div class="space-y-6">
      <!-- En-tête -->
      <div class="flex items-center justify-between">
        <div></div>
        <button
          @click="openCreateModal"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
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
          Nouvelle facture
        </button>
      </div>

      <!-- Filtres et recherche -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1">
            <input
              v-model="searchTerm"
              @input="handleSearch"
              type="text"
              placeholder="Rechercher une facture..."
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <select
              v-model="statusFilter"
              @change="handleStatusFilter"
              class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="paid">Payée</option>
              <option value="overdue">En retard</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Liste des factures -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div v-if="invoicesStore.loading" class="p-8 text-center">
          <div
            class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"
          ></div>
          <p class="mt-2 text-gray-500 dark:text-gray-400">Chargement...</p>
        </div>

        <div
          v-else-if="invoicesStore.invoices.length === 0"
          class="px-4 py-5 sm:p-6"
        >
          <div class="text-center py-12">
            <svg
              class="h-16 w-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Aucune facture
            </h3>
            <p class="text-gray-500 dark:text-gray-400 mb-6">
              Commencez par créer votre première facture
            </p>
            <button
              @click="openCreateModal"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
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
              Créer une facture
            </button>
          </div>
        </div>

        <div v-else class="overflow-hidden">
          <table
            class="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
          >
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  N° Facture
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Client
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Titre
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Total TTC
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Statut
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Date
                </th>
                <th
                  class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody
              class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
            >
              <tr
                v-for="invoice in invoicesStore.invoices"
                :key="invoice.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white"
                >
                  {{ invoice.invoiceNumber }}
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300"
                >
                  {{ invoice.clientCompany || invoice.clientName }}
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300"
                >
                  {{ invoice.title }}
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300"
                >
                  {{ formatCurrency(invoice.totalTtc) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="getStatusClass(invoice.status)"
                    class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                  >
                    {{ getStatusLabel(invoice.status) }}
                  </span>
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300"
                >
                  {{ formatDate(invoice.createdAt) }}
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                >
                  <div class="flex items-center justify-end space-x-2">
                    <button
                      @click="downloadPdf(invoice.id)"
                      class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      title="Télécharger PDF"
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
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </button>
                    <button
                      @click="viewInvoice(invoice.id)"
                      class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                      title="Voir"
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
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                    <button
                      @click="archiveInvoice(invoice.id)"
                      class="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                      title="Archiver"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7h18M5 7v10a2 2 0 002 2h10a2 2 0 002-2V7M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                    </button>
                    <button
                      @click="verifyInvoice(invoice.id)"
                      class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      title="Vérifier l'intégrité"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </Layout>
  <!-- Modal création facture -->
  <div
    v-if="showCreateModal"
    class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
  >
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl"
    >
      <div
        class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between"
      >
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Nouvelle facture
        </h3>
        <button
          @click="closeCreateModal"
          class="text-gray-500 hover:text-gray-700 dark:text-gray-300"
        >
          ✕
        </button>
      </div>
      <div class="p-6 space-y-4">
        <div class="bg-gray-50 dark:bg-gray-700/40 p-3 rounded-md">
          <label class="block text-sm text-gray-700 dark:text-gray-300 mb-1"
            >Ajouter une ligne depuis le catalogue</label
          >
          <div class="flex items-center gap-2">
            <select
              v-model="selectedServiceId"
              class="flex-1 px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="">-- Choisir un service --</option>
              <option v-for="s in services" :key="s.id" :value="s.id">
                {{ s.name }} ({{ formatCurrency(s.price_ht) }} HT)
              </option>
            </select>
            <button
              @click="addFromCatalog"
              :disabled="!selectedServiceId"
              class="px-3 py-2 rounded-md bg-yellow-600 text-white"
            >
              Ajouter
            </button>
          </div>
        </div>
        <!-- Sélection / création client -->
        <div class="bg-gray-50 dark:bg-gray-700/40 p-3 rounded-md space-y-2">
          <label class="block text-sm text-gray-700 dark:text-gray-300 mb-1"
            >Client</label
          >
          <div class="flex gap-2">
            <input
              v-model="clientSearch"
              @input="searchClients"
              placeholder="Rechercher un client (nom, email...)"
              class="flex-1 px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600"
            />
            <button
              @click="toggleCreateClient"
              class="px-3 py-2 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100"
            >
              Nouveau client
            </button>
          </div>
          <div
            v-if="clientResults.length"
            class="max-h-40 overflow-auto border dark:border-gray-600 rounded-md"
          >
            <div
              v-for="c in clientResults"
              :key="c.id"
              @click="selectClient(c)"
              class="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              {{ c.companyName || c.firstName + ' ' + c.lastName }} —
              {{ c.email || '' }}
            </div>
          </div>
          <div v-if="showCreateClient" class="grid grid-cols-2 gap-2">
            <input
              v-model="newClient.firstName"
              placeholder="Prénom*"
              class="px-2 py-1 rounded-md border dark:bg-gray-700 dark:border-gray-600"
            />
            <input
              v-model="newClient.lastName"
              placeholder="Nom*"
              class="px-2 py-1 rounded-md border dark:bg-gray-700 dark:border-gray-600"
            />
            <input
              v-model="newClient.companyName"
              placeholder="Entreprise"
              class="px-2 py-1 rounded-md border dark:bg-gray-700 dark:border-gray-600 col-span-2"
            />
            <input
              v-model="newClient.email"
              placeholder="Email"
              class="px-2 py-1 rounded-md border dark:bg-gray-700 dark:border-gray-600 col-span-2"
            />
            <button
              @click="createClient"
              class="col-span-2 px-3 py-2 rounded-md bg-yellow-600 text-white w-max"
            >
              Créer le client
            </button>
          </div>
        </div>
        <div>
          <label class="block text-sm text-gray-700 dark:text-gray-300 mb-1"
            >Titre</label
          >
          <input
            v-model="form.title"
            type="text"
            class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        <div>
          <label class="block text-sm text-gray-700 dark:text-gray-300 mb-1"
            >Description</label
          >
          <textarea
            v-model="form.description"
            class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600"
          ></textarea>
        </div>
        <div class="space-y-2">
          <label class="block text-sm text-gray-700 dark:text-gray-300"
            >Lignes</label
          >
          <div
            v-for="(it, idx) in form.items"
            :key="idx"
            class="grid grid-cols-12 gap-2 items-start"
          >
            <input
              v-model="it.description"
              placeholder="Description"
              class="col-span-4 px-2 py-1 rounded-md border dark:bg-gray-700 dark:border-gray-600"
            />
            <input
              v-model.number="it.quantity"
              type="number"
              min="0.001"
              step="0.001"
              placeholder="Qté"
              class="col-span-2 px-2 py-1 rounded-md border dark:bg-gray-700 dark:border-gray-600 text-right"
            />
            <input
              v-model.number="it.unitPriceHt"
              type="number"
              min="0"
              step="0.01"
              placeholder="PU HT"
              class="col-span-2 px-2 py-1 rounded-md border dark:bg-gray-700 dark:border-gray-600 text-right"
            />
            <input
              v-model.number="it.vatRate"
              type="number"
              min="0"
              step="0.01"
              placeholder="TVA %"
              class="col-span-1 px-2 py-1 rounded-md border dark:bg-gray-700 dark:border-gray-600 text-right"
            />
            <input
              v-model.number="it.discountPercent"
              type="number"
              min="0"
              step="0.01"
              placeholder="Remise %"
              class="col-span-1 px-2 py-1 rounded-md border dark:bg-gray-700 dark:border-gray-600 text-right"
            />
            <input
              v-model.number="it.surchargePercent"
              type="number"
              min="0"
              step="0.01"
              placeholder="Maj. %"
              class="col-span-1 px-2 py-1 rounded-md border dark:bg-gray-700 dark:border-gray-600 text-right"
            />
            <div
              class="col-span-1 text-right text-sm text-gray-900 dark:text-white px-1 py-2"
            >
              {{ formatCurrency(lineTotalTtc(it)) }}
            </div>
            <button @click="removeItem(idx)" class="col-span-1 text-red-600">
              ✕
            </button>
          </div>
          <div class="flex justify-end gap-6 mt-2 text-sm">
            <div class="text-gray-700 dark:text-gray-300">
              Sous-total HT:
              <span class="font-medium text-gray-900 dark:text-white">{{
                formatCurrency(totals.subtotalHt)
              }}</span>
            </div>
            <div class="text-gray-700 dark:text-gray-300">
              TVA:
              <span class="font-medium text-gray-900 dark:text-white">{{
                formatCurrency(totals.totalVat)
              }}</span>
            </div>
            <div class="text-gray-900 dark:text-white font-semibold">
              Total TTC: {{ formatCurrency(totals.totalTtc) }}
            </div>
          </div>
          <button @click="addItem" class="text-sm text-yellow-600">
            + Ajouter une ligne
          </button>
        </div>
      </div>
      <div
        class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2"
      >
        <button
          @click="closeCreateModal"
          class="px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
        >
          Annuler
        </button>
        <button
          @click="saveInvoice"
          :disabled="invoicesStore.loading"
          class="px-4 py-2 rounded-md bg-yellow-600 text-white"
        >
          Créer
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Layout from '@/components/Layout.vue'
import { useInvoicesStore } from '@/stores/invoices'
import api from '@/utils/api'
import { useToast } from 'vue-toastification'

const router = useRouter()
const invoicesStore = useInvoicesStore()
const toast = useToast()

const searchTerm = ref('')
const statusFilter = ref('')
const services = ref([])
const selectedServiceId = ref('')

const handleSearch = () => {
  invoicesStore.fetchInvoices({ search: searchTerm.value, page: 1 })
}

const handleStatusFilter = () => {
  invoicesStore.fetchInvoices({ status: statusFilter.value, page: 1 })
}

const showCreateModal = ref(false)
const form = ref({
  clientId: '',
  title: '',
  description: '',
  items: [{ description: '', quantity: 1, unitPriceHt: 0, vatRate: 20 }],
})

const openCreateModal = () => {
  showCreateModal.value = true
}
const closeCreateModal = () => {
  showCreateModal.value = false
}
const addItem = () => {
  form.value.items.push({
    description: '',
    quantity: 1,
    unitPriceHt: 0,
    vatRate: 20,
  })
}
const removeItem = (idx) => {
  form.value.items.splice(idx, 1)
}
const saveInvoice = async () => {
  await invoicesStore.createInvoice({
    clientId: form.value.clientId,
    title: form.value.title,
    description: form.value.description,
    items: form.value.items,
  })
  await invoicesStore.fetchInvoices()
  closeCreateModal()
}

const addFromCatalog = () => {
  const s = services.value.find((x) => x.id === selectedServiceId.value)
  if (!s) return
  form.value.items.push({
    description: s.name,
    quantity: 1,
    unitPriceHt: Number(s.price_ht),
    vatRate: Number(s.vat_rate || 20),
  })
  selectedServiceId.value = ''
}

onMounted(async () => {
  invoicesStore.fetchInvoices()
  try {
    const { data } = await api.get('/services')
    services.value = data.services || []
  } catch (_) {}
})

const viewInvoice = (id) => {
  router.push(`/invoices/${id}`)
}

const downloadPdf = async (id) => {
  try {
    await invoicesStore.downloadPdf(id)
  } catch (error) {
    console.error('Erreur téléchargement PDF:', error)
  }
}

const archiveInvoice = async (id) => {
  try {
    await invoicesStore.archiveInvoice(id)
    toast.success('Facture archivée')
  } catch (e) {
    // géré dans le store
  }
}

const verifyInvoice = async (id) => {
  try {
    const data = await invoicesStore.verifyInvoice(id)
    const ok = data?.verification?.valid
    toast[ok ? 'success' : 'error'](
      ok ? "Intégrité OK" : "Intégrité non valide"
    )
  } catch (e) {
    // géré dans le store
  }
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount || 0)
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('fr-FR')
}

const getStatusLabel = (status) => {
  const labels = {
    pending: 'En attente',
    paid: 'Payée',
    overdue: 'En retard',
    cancelled: 'Annulée',
  }
  return labels[status] || status
}

const getStatusClass = (status) => {
  const classes = {
    pending:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-600 dark:text-yellow-200',
    paid: 'bg-green-100 text-green-800 dark:bg-green-600 dark:text-green-200',
    overdue: 'bg-red-100 text-red-800 dark:bg-red-600 dark:text-red-200',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200',
  }
  return (
    classes[status] ||
    'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
  )
}

onMounted(() => {
  invoicesStore.fetchInvoices()
})
</script>
