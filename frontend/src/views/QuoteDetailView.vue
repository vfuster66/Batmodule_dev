<template>
  <Layout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Devis {{ quote?.quoteNumber || '' }}
          </h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Détails du devis et lignes
          </p>
        </div>
        <div class="flex items-center gap-2">
          <select
            v-if="quote"
            :value="quote.status"
            @change="changeStatus($event)"
            class="px-3 py-2 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="draft">Brouillon</option>
            <option value="sent">Envoyé</option>
            <option value="accepted">Accepté</option>
            <option value="rejected">Refusé</option>
          </select>
          <button
            v-if="quote && quote.status !== 'accepted'"
            @click="editQuote"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
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
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Modifier
          </button>
          <button
            v-if="quote"
            @click="downloadPdf"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            PDF
          </button>
          <button
            v-if="quote"
            @click="openSendModal = true"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            Envoyer par e‑mail
          </button>
          <button
            @click="$router.back()"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Retour
          </button>
        </div>
      </div>

      <!-- Loading / Error -->
      <div
        v-if="loading"
        class="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center"
      >
        Chargement…
      </div>
      <div
        v-else-if="!quote"
        class="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center"
      >
        Devis introuvable
      </div>

      <div v-else class="space-y-6">
        <!-- Info blocks -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
            <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Client
            </div>
            <div class="text-gray-900 dark:text-white">
              <div class="font-medium">
                {{ quote.client?.firstName }} {{ quote.client?.lastName }}
              </div>
              <div
                v-if="quote.client?.companyName"
                class="text-sm text-gray-600 dark:text-gray-300"
              >
                {{ quote.client.companyName }}
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-300">
                {{ quote.client?.addressLine1 }}
                <template v-if="quote.client?.addressLine2"
                  ><br />{{ quote.client.addressLine2 }}</template
                >
                <br />
                {{ quote.client?.postalCode }} {{ quote.client?.city }}
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
            <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Adresse de chantier
            </div>
            <div class="text-gray-900 dark:text-white">
              <div class="font-medium">
                {{ quote.client?.firstName }} {{ quote.client?.lastName }}
              </div>
              <div
                v-if="quote.client?.companyName"
                class="text-sm text-gray-600 dark:text-gray-300"
              >
                {{ quote.client.companyName }}
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-300">
                <template v-if="quote.siteAddress?.sameAsBilling">
                  {{ quote.client?.addressLine1 }}
                  <template v-if="quote.client?.addressLine2"
                    ><br />{{ quote.client.addressLine2 }}</template
                  >
                  <br />
                  {{ quote.client?.postalCode }} {{ quote.client?.city }}
                </template>
                <template v-else>
                  {{ quote.siteAddress?.addressLine1 || '—' }}
                  <template v-if="quote.siteAddress?.addressLine2"
                    ><br />{{ quote.siteAddress.addressLine2 }}</template
                  >
                  <br />
                  {{ quote.siteAddress?.postalCode || '' }}
                  {{ quote.siteAddress?.city || '' }}
                </template>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
            <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Informations
            </div>
            <div class="text-gray-900 dark:text-white text-sm space-y-1">
              <div>
                <span class="text-gray-500 dark:text-gray-400">Titre:</span>
                {{ quote.title }}
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">Créé le:</span>
                {{ formatDate(quote.createdAt) }}
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400"
                  >Valide jusqu'au:</span
                >
                {{ formatDate(quote.validUntil) }}
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
            <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Totaux
            </div>
            <div class="text-gray-900 dark:text-white text-sm space-y-1">
              <div>Sous-total HT: {{ formatCurrency(quote.subtotalHt) }}</div>
              <div>TVA: {{ formatCurrency(quote.totalVat) }}</div>
              <div class="font-semibold">
                Total TTC: {{ formatCurrency(quote.totalTtc) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Description -->
        <div
          v-if="quote.description"
          class="bg-white dark:bg-gray-800 shadow rounded-lg p-4"
        >
          <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Description
          </div>
          <div class="text-gray-900 dark:text-white text-sm">
            {{ quote.description }}
          </div>
        </div>

        <!-- Items -->
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
          <div class="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Lignes
          </div>
          <template v-if="(quote.sections?.length || 0) > 0">
            <div v-for="sec in quote.sections" :key="sec.id" class="mb-6">
              <div class="font-semibold text-gray-900 dark:text-white">
                {{ sec.title }}
              </div>
              <div
                v-if="sec.description"
                class="text-sm text-gray-600 dark:text-gray-300 mb-2"
              >
                {{ sec.description }}
              </div>
              <table class="min-w-full text-sm">
                <thead>
                  <tr class="text-left text-gray-500 dark:text-gray-400">
                    <th class="py-2">Description</th>
                    <th class="py-2 text-right">Qté</th>
                    <th class="py-2 text-right">PU HT</th>
                    <th class="py-2 text-right">TVA</th>
                    <th class="py-2 text-right">Total HT</th>
                    <th class="py-2 text-right">Total TTC</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="it in quote.items.filter(
                      (i) => i.sectionId === sec.id
                    )"
                    :key="it.id"
                    class="border-t border-gray-200 dark:border-gray-700"
                  >
                    <td class="py-2">{{ it.description }}</td>
                    <td class="py-2 text-right">{{ it.quantity }}</td>
                    <td class="py-2 text-right">
                      {{ formatCurrency(it.unitPriceHt) }}
                    </td>
                    <td class="py-2 text-right">{{ it.vatRate }}%</td>
                    <td class="py-2 text-right">
                      {{ formatCurrency(it.totalHt) }}
                    </td>
                    <td class="py-2 text-right">
                      {{ formatCurrency(it.totalTtc) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
          <template v-else>
            <table class="min-w-full text-sm">
              <thead>
                <tr class="text-left text-gray-500 dark:text-gray-400">
                  <th class="py-2">Description</th>
                  <th class="py-2 text-right">Qté</th>
                  <th class="py-2 text-right">PU HT</th>
                  <th class="py-2 text-right">TVA</th>
                  <th class="py-2 text-right">Total HT</th>
                  <th class="py-2 text-right">Total TTC</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="it in quote.items"
                  :key="it.id"
                  class="border-t border-gray-200 dark:border-gray-700"
                >
                  <td class="py-2">{{ it.description }}</td>
                  <td class="py-2 text-right">{{ it.quantity }}</td>
                  <td class="py-2 text-right">
                    {{ formatCurrency(it.unitPriceHt) }}
                  </td>
                  <td class="py-2 text-right">{{ it.vatRate }}%</td>
                  <td class="py-2 text-right">
                    {{ formatCurrency(it.totalHt) }}
                  </td>
                  <td class="py-2 text-right">
                    {{ formatCurrency(it.totalTtc) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </template>
        </div>
      </div>
    </div>
  </Layout>

  <!-- Modal envoi par e‑mail -->
  <div
    v-if="openSendModal"
    class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
  >
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg overflow-hidden"
    >
      <div
        class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between"
      >
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Envoyer le devis par e‑mail
        </h3>
        <button
          @click="openSendModal = false"
          class="text-gray-500 hover:text-gray-700 dark:text-gray-300"
        >
          ✕
        </button>
      </div>
      <div class="p-6 space-y-4">
        <div>
          <label class="block text-sm text-gray-700 dark:text-gray-300 mb-1"
            >Destinataire</label
          >
          <input
            v-model="sendForm.to"
            type="email"
            placeholder="client@example.com"
            class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        <div>
          <label class="block text-sm text-gray-700 dark:text-gray-300 mb-1"
            >Sujet</label
          >
          <input
            v-model="sendForm.subject"
            type="text"
            :placeholder="defaultSubject"
            class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        <div>
          <label class="block text-sm text-gray-700 dark:text-gray-300 mb-1"
            >Message</label
          >
          <textarea
            v-model="sendForm.message"
            rows="4"
            class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600"
            placeholder="Bonjour, veuillez trouver votre devis en pièce jointe."
          ></textarea>
        </div>
      </div>
      <div
        class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-2"
      >
        <button
          @click="openSendModal = false"
          class="px-4 py-2 rounded-md border dark:border-gray-600"
        >
          Annuler
        </button>
        <button
          @click="sendEmail"
          :disabled="quotesStore.loading || !isValidEmail(sendForm.to)"
          class="px-4 py-2 rounded-md bg-green-600 text-white"
        >
          Envoyer
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Layout from '@/components/Layout.vue'
import { useQuotesStore } from '@/stores/quotes'

const route = useRoute()
const router = useRouter()
const quotesStore = useQuotesStore()

const id = computed(() => route.params.id)
const loading = computed(() => quotesStore.loading)
const quote = computed(() => quotesStore.currentQuote)

const openSendModal = ref(false)
const sendForm = ref({ to: '', subject: '', message: '' })
const defaultSubject = computed(() =>
  `Votre devis ${quote.value?.quoteNumber || ''}`.trim()
)
const isValidEmail = (e) => /[^@\s]+@[^@\s]+\.[^@\s]+/.test(e || '')

const formatCurrency = (amount) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
    Number(amount || 0)
  )
const formatDate = (d) => {
  if (!d) return '—'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return '—'
  return dt.toLocaleDateString('fr-FR')
}

onMounted(async () => {
  try {
    await quotesStore.fetchQuote(id.value)
  } catch (_) {
    /* handled by store */
  }
})

const changeStatus = async (evt) => {
  const newStatus = evt?.target?.value
  if (!newStatus) return
  try {
    await quotesStore.updateStatus(id.value, newStatus)
  } catch (_) {}
}

const downloadPdf = async () => {
  try {
    const num = quote.value?.quoteNumber || id.value
    await quotesStore.downloadPdf(id.value, `devis-${num}.pdf`)
  } catch (_) {}
}

const editQuote = () => {
  router.push(`/quotes/${id.value}/edit`)
}

const sendEmail = async () => {
  try {
    const payload = {
      to: sendForm.value.to,
      subject: sendForm.value.subject || defaultSubject.value,
      message: sendForm.value.message || '',
    }
    const resp = await quotesStore.sendByEmail(id.value, payload)
    openSendModal.value = false
  } catch (_) {}
}
</script>
