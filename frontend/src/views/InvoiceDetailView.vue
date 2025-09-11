<template>
  <Layout>
    <div class="space-y-6">
      <!-- En-tête -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Détail de la facture
          </h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Informations détaillées de la facture
          </p>
        </div>
        <div class="flex items-center space-x-3">
          <button
            @click="$router.back()"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-cobalt"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Retour
          </button>
          <button
            @click="createCreditNote"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
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
            Créer un avoir
          </button>
        </div>
      </div>

      <!-- Contenu -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6 space-y-6" v-if="invoice">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3
                class="text-lg font-semibold text-gray-900 dark:text-white mb-2"
              >
                Informations
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-300">
                Numéro:
                <span class="font-medium">{{ invoice.invoiceNumber }}</span>
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-300">
                Titre: <span class="font-medium">{{ invoice.title }}</span>
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-300">
                Statut:
                <span class="font-medium capitalize">{{ invoice.status }}</span>
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-300">
                Échéance:
                <span class="font-medium">{{
                  formatDate(invoice.dueDate)
                }}</span>
              </p>
            </div>
            <div>
              <h3
                class="text-lg font-semibold text-gray-900 dark:text-white mb-2"
              >
                Client
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-300">
                {{
                  invoice.client?.companyName ||
                  invoice.client?.firstName + ' ' + invoice.client?.lastName
                }}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-300">
                {{ invoice.client?.addressLine1 }}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-300">
                {{ invoice.client?.postalCode }} {{ invoice.client?.city }}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-300">
                {{ invoice.client?.country }}
              </p>
            </div>
          </div>

          <div>
            <h3
              class="text-lg font-semibold text-gray-900 dark:text-white mb-2"
            >
              Lignes
            </h3>
            <div class="overflow-x-auto">
              <table
                class="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
              >
                <thead class="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th
                      class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                    >
                      Description
                    </th>
                    <th
                      class="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                    >
                      Qté
                    </th>
                    <th
                      class="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                    >
                      PU HT
                    </th>
                    <th
                      class="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                    >
                      TVA %
                    </th>
                    <th
                      class="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                    >
                      Total TTC
                    </th>
                  </tr>
                </thead>
                <tbody
                  class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
                >
                  <tr v-for="it in invoice.items" :key="it.id">
                    <td
                      class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300"
                    >
                      {{ it.description }}
                    </td>
                    <td
                      class="px-4 py-2 text-sm text-right text-gray-700 dark:text-gray-300"
                    >
                      {{ it.quantity }}
                    </td>
                    <td
                      class="px-4 py-2 text-sm text-right text-gray-700 dark:text-gray-300"
                    >
                      {{ formatCurrency(it.unitPriceHt) }}
                    </td>
                    <td
                      class="px-4 py-2 text-sm text-right text-gray-700 dark:text-gray-300"
                    >
                      {{ it.vatRate }}
                    </td>
                    <td
                      class="px-4 py-2 text-sm text-right text-gray-700 dark:text-gray-300"
                    >
                      {{ formatCurrency(it.totalTtc) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="flex justify-end space-x-8">
            <div class="text-right">
              <p class="text-sm text-gray-600 dark:text-gray-300">
                Sous-total HT:
                <span class="font-medium">{{
                  formatCurrency(invoice.subtotalHt)
                }}</span>
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-300">
                TVA:
                <span class="font-medium">{{
                  formatCurrency(invoice.totalVat)
                }}</span>
              </p>
              <p class="text-base text-gray-900 dark:text-white font-semibold">
                Total TTC:
                <span class="font-bold">{{
                  formatCurrency(invoice.totalTtc)
                }}</span>
              </p>
            </div>
          </div>

          <div class="flex items-center space-x-3">
            <button
              @click="downloadPdf"
              class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-gray-700 hover:bg-gray-800"
            >
              Télécharger PDF
            </button>
            <button
              v-if="invoice.status !== 'paid'"
              @click="markPaid"
              class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              Marquer comme payée
            </button>
          </div>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import Layout from '@/components/Layout.vue'
import api from '@/utils/api'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import { ref, onMounted } from 'vue'
import { useInvoicesStore } from '@/stores/invoices'

const route = useRoute()
const toast = useToast()
const store = useInvoicesStore()
const invoice = ref(null)

const createCreditNote = async () => {
  try {
    const id = route.params.id
    const { data } = await api.post(`/credits/from-invoice/${id}`)
    toast.success('Avoir créé: ' + data.credit.creditNumber)
  } catch (e) {
    toast.error("Erreur lors de la création de l'avoir")
  }
}

const fetch = async () => {
  const id = route.params.id
  const data = await store.fetchInvoice(id)
  invoice.value = data
}

const downloadPdf = async () => {
  await store.downloadPdf(route.params.id)
}

const markPaid = async () => {
  await store.updateStatus(route.params.id, 'paid')
  await fetch()
  toast.success('Facture marquée comme payée')
}

const formatCurrency = (amount) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
    amount || 0
  )
const formatDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '')

onMounted(fetch)
</script>
