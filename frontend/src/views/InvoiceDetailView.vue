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
              <p class="text-sm text-gray-600 dark:text-gray-300">
                Payé:
                <span class="font-medium">{{ formatCurrency(invoice.paidAmount || 0) }}</span>
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-300">
                Restant dû:
                <span class="font-medium">{{ formatCurrency(remainingAmount) }}</span>
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
              @click="openPaymentModal"
              class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Ajouter un paiement
            </button>
            <button
              v-if="invoice.status !== 'paid'"
              @click="markPaid"
              class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              Marquer comme payée
            </button>
            <button
              v-if="canCreateFinal"
              @click="openFinalModal"
              class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700"
            >
              Créer facture de solde
            </button>
            <button
              @click="archive"
              class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
            >
              Archiver
            </button>
            <button
              @click="verify"
              class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Vérifier l'intégrité
            </button>
            <button
              @click="exportPaymentsCsv"
              class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700"
            >
              Exporter paiements (CSV)
            </button>
          </div>

          <!-- Paiements -->
          <div class="mt-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Paiements
            </h3>
            <div
              v-if="invoice.payments && invoice.payments.length"
              class="overflow-x-auto"
            >
              <table
                class="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
              >
                <thead class="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Date
                    </th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Méthode
                    </th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Référence
                    </th>
                    <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Montant
                    </th>
                  </tr>
                </thead>
                <tbody
                  class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
                >
                  <tr v-for="p in invoice.payments" :key="p.id">
                    <td class="px-4 py-2 text-sm">
                      {{ formatDate(p.paymentDate || p.createdAt) }}
                    </td>
                    <td class="px-4 py-2 text-sm capitalize">
                      {{ p.paymentMethod }}
                    </td>
                    <td class="px-4 py-2 text-sm">{{ p.reference || '—' }}</td>
                    <td class="px-4 py-2 text-sm text-right">
                      {{ formatCurrency(p.amount) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="text-sm text-gray-500 dark:text-gray-400">
              Aucun paiement enregistré.
            </div>
          </div>

          <!-- Résultat vérification -->
          <div
            v-if="lastVerification"
            class="mt-4 p-3 rounded-md bg-gray-50 dark:bg-gray-700/40"
          >
            <div class="text-sm text-gray-700 dark:text-gray-200">
              <strong>Vérification:</strong>
              <span v-if="lastVerification.verification?.valid" class="text-green-600">OK</span>
              <span v-else class="text-red-600">Non valide</span>
            </div>
            <pre class="mt-2 text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{{
              JSON.stringify(lastVerification.verification || lastVerification, null, 2)
            }}</pre>
          </div>
        </div>
  </div>
  </div>
  </Layout>
  <!-- Modal Facture de solde -->
  <div v-if="showFinalModal" class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Créer la facture de solde</h3>
        <button @click="closeFinalModal" class="text-gray-500 hover:text-gray-700 dark:text-gray-300">✕</button>
      </div>
      <div class="p-6 space-y-4">
        <div>
          <label class="block text-sm text-gray-700 dark:text-gray-300 mb-1">Titre</label>
          <input v-model="finalForm.title" type="text" class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600" />
        </div>
        <div>
          <label class="block text-sm text-gray-700 dark:text-gray-300 mb-1">Échéance</label>
          <input v-model="finalForm.dueDate" type="date" class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600" />
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-300">
          Montant total du devis: <strong>{{ formatCurrency(quoteTotalTtc) }}</strong><br />
          Acompte: <strong>{{ formatCurrency(advanceAmount) }}</strong><br />
          Solde calculé: <strong>{{ formatCurrency(Math.max(quoteTotalTtc - advanceAmount, 0)) }}</strong>
        </div>
      </div>
      <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
        <button @click="closeFinalModal" class="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100">Annuler</button>
        <button @click="submitFinal" :disabled="!canSubmitFinal" class="px-4 py-2 rounded-md bg-yellow-600 text-white disabled:opacity-50">Créer</button>
      </div>
    </div>
  </div>
  <!-- Modal Paiement -->
  <div v-if="showPaymentModal" class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Ajouter un paiement</h3>
        <button @click="closePaymentModal" class="text-gray-500 hover:text-gray-700 dark:text-gray-300">✕</button>
      </div>
      <div class="p-6 space-y-4">
        <div>
          <label class="block text-sm text-gray-700 dark:text-gray-300 mb-1">Montant (€)</label>
          <input v-model.number="paymentForm.amount" type="number" min="0.01" step="0.01" class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600" />
          <p class="text-xs text-gray-500 mt-1">Reste à payer: {{ formatCurrency(remainingAmount) }}</p>
        </div>
        <div>
          <label class="block text-sm text-gray-700 dark:text-gray-300 mb-1">Méthode</label>
          <select v-model="paymentForm.paymentMethod" class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600">
            <option value="cash">Espèces</option>
            <option value="check">Chèque</option>
            <option value="transfer">Virement</option>
            <option value="card">Carte</option>
          </select>
        </div>
        <div>
          <label class="block text-sm text-gray-700 dark:text-gray-300 mb-1">Date</label>
          <input v-model="paymentForm.paymentDate" type="date" class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600" />
        </div>
        <div>
          <label class="block text-sm text-gray-700 dark:text-gray-300 mb-1">Référence (optionnel)</label>
          <input v-model="paymentForm.reference" type="text" class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600" />
        </div>
        <div>
          <label class="block text-sm text-gray-700 dark:text-gray-300 mb-1">Notes (optionnel)</label>
          <textarea v-model="paymentForm.notes" rows="2" class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600"></textarea>
        </div>
      </div>
      <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
        <button @click="closePaymentModal" class="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100">Annuler</button>
        <button @click="submitPayment" :disabled="!canSubmitPayment" class="px-4 py-2 rounded-md bg-green-600 text-white disabled:opacity-50">Enregistrer</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import Layout from '@/components/Layout.vue'
import api from '@/utils/api'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import { ref, onMounted, computed } from 'vue'
import { useInvoicesStore } from '@/stores/invoices'

const route = useRoute()
const toast = useToast()
const store = useInvoicesStore()
const invoice = ref(null)
const showPaymentModal = ref(false)
const paymentForm = ref({ amount: 0, paymentMethod: 'transfer', paymentDate: '', reference: '', notes: '' })
const lastVerification = ref(null)
const showFinalModal = ref(false)
const finalForm = ref({ title: '', dueDate: '' })
const related = ref(null)
const quoteTotalTtc = ref(0)
const advanceAmount = ref(0)
const canCreateFinal = computed(() => {
  if (!related.value) return false
  return !!related.value.advance && !related.value.final
})

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

const remainingAmount = computed(() => {
  if (!invoice.value) return 0
  return Number(invoice.value.totalTtc || 0) - Number(invoice.value.paidAmount || 0)
})

function openPaymentModal() {
  showPaymentModal.value = true
  // Pré-remplir: montant restant et date du jour
  paymentForm.value.amount = Number(remainingAmount.value.toFixed(2))
  paymentForm.value.paymentDate = new Date().toISOString().slice(0, 10)
}
function closePaymentModal() {
  showPaymentModal.value = false
}
const canSubmitPayment = computed(() => {
  const a = Number(paymentForm.value.amount)
  return a > 0 && paymentForm.value.paymentDate
})
async function submitPayment() {
  try {
    await store.addPayment(route.params.id, { ...paymentForm.value })
    await fetch()
    closePaymentModal()
    toast.success('Paiement ajouté')
  } catch (e) {
    // handled in store
  }
}

const markPaid = async () => {
  // Ajoute un paiement couvrant le solde restant
  const amt = Number(remainingAmount.value.toFixed(2))
  if (amt <= 0) return
  await store.addPayment(route.params.id, {
    amount: amt,
    paymentMethod: 'transfer',
    paymentDate: new Date().toISOString().slice(0, 10),
    reference: 'Solde',
  })
  await fetch()
  toast.success('Facture marquée comme payée')
}

async function archive() {
  try {
    const data = await store.archiveInvoice(route.params.id)
    toast.success('Facture archivée')
  } catch (_) {}
}

async function verify() {
  try {
    const data = await store.verifyInvoice(route.params.id)
    lastVerification.value = data
  } catch (_) {}
}

function exportPaymentsCsv() {
  const rows = invoice.value?.payments || []
  const header = ['Date', 'Méthode', 'Référence', 'Montant']
  const lines = [header.join(',')]
  for (const p of rows) {
    const d = p.paymentDate || p.createdAt || ''
    const method = p.paymentMethod || ''
    const ref = (p.reference || '').replaceAll('"', '""')
    const amt = Number(p.amount || 0).toFixed(2)
    lines.push([d, method, `"${ref}"`, amt].join(','))
  }
  const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.href = url
  link.download = `paiements-${invoice.value?.invoiceNumber || route.params.id}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const formatCurrency = (amount) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
    amount || 0
  )
const formatDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '')

onMounted(fetch)

// Charger factures liées et totaux pour permettre la facture de solde
onMounted(async () => {
  try {
    const { data } = await api.get(`/invoices/${route.params.id}/related`)
    related.value = data
  } catch (_) {}
  try {
    const qid = related.value?.advance?.quote_id
    if (qid) {
      const { data } = await api.get(`/quotes/${qid}`)
      quoteTotalTtc.value = Number(data?.quote?.totalTtc || 0)
    }
  } catch (_) {}
  advanceAmount.value = Number(invoice.value?.totalTtc || 0)
})

function openFinalModal() {
  finalForm.value.title = `Solde – ${invoice.value?.title || invoice.value?.invoiceNumber}`
  finalForm.value.dueDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  showFinalModal.value = true
}
function closeFinalModal() { showFinalModal.value = false }
const canSubmitFinal = computed(() => !!finalForm.value.title && !!finalForm.value.dueDate && quoteTotalTtc.value > 0)
async function submitFinal() {
  try {
    const quoteId = related.value?.advance?.quote_id
    let items = []
    if (quoteId) {
      const { data } = await api.get(`/quotes/${quoteId}`)
      const qi = data?.quote?.items || []
      items = qi.map((it) => ({ description: it.description, quantity: it.quantity, unitPriceHt: it.unitPriceHt, vatRate: it.vatRate }))
    }
    const payload = {
      clientId: invoice.value.client?.id || invoice.value.clientId,
      quoteId: quoteId || undefined,
      parentInvoiceId: invoice.value.id,
      title: finalForm.value.title,
      description: `Solde basé sur ${invoice.value.invoiceNumber}`,
      items,
      dueDate: finalForm.value.dueDate,
      notes: '',
    }
    const res = await store.createFinalInvoice(payload)
    closeFinalModal()
    if (res?.invoice?.id) {
      window.location.href = `/invoices/${res.invoice.id}`
    }
  } catch (_) {}
}
</script>
