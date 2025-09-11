<template>
  <div
    class="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-white py-8"
  >
    <div class="max-w-4xl mx-auto px-4">
      <!-- Header avec logo entreprise -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              Devis {{ quote?.quoteNumber || '' }}
            </h1>
            <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Consultation et acceptation en ligne
            </p>
          </div>
          <div v-if="quote?.company?.logoBase64" class="flex-shrink-0">
            <img
              :src="quote.company.logoBase64"
              :alt="quote.company.companyName || 'Logo'"
              class="h-16 w-auto object-contain"
            />
          </div>
        </div>

        <!-- Informations entreprise -->
        <div
          v-if="quote?.company"
          class="bg-white dark:bg-gray-800 shadow rounded-lg p-4 mb-6"
        >
          <div class="text-sm text-gray-500 dark:text-gray-400 mb-2">
            Entreprise
          </div>
          <div class="text-gray-900 dark:text-white">
            <div class="font-semibold text-lg">
              {{ quote.company.companyName }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {{ quote.company.addressLine1 }}
              <template v-if="quote.company.addressLine2"
                ><br />{{ quote.company.addressLine2 }}</template
              >
              <br />{{ quote.company.postalCode }} {{ quote.company.city }}
              <template v-if="quote.company.phone"
                ><br />Tél: {{ quote.company.phone }}</template
              >
              <template v-if="quote.company.email"
                ><br />Email: {{ quote.company.email }}</template
              >
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="loading"
        class="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center"
      >
        Chargement…
      </div>
      <div
        v-else-if="error"
        class="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-red-600"
      >
        {{ error }}
      </div>
      <div
        v-else-if="!quote"
        class="bg-white dark:bg-gray-800 shadow rounded-lg p-6"
      >
        Devis introuvable
      </div>
      <div v-else class="space-y-6">
        <!-- Informations client et devis -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Client -->
          <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
            <div class="text-sm text-gray-500 dark:text-gray-400 mb-2">
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
              <div class="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {{ quote.client?.addressLine1 }}
                <template v-if="quote.client?.addressLine2"
                  ><br />{{ quote.client.addressLine2 }}</template
                >
                <br />{{ quote.client?.postalCode }} {{ quote.client?.city }}
                <template v-if="quote.client?.phone"
                  ><br />Tél: {{ quote.client.phone }}</template
                >
                <template v-if="quote.client?.email"
                  ><br />Email: {{ quote.client.email }}</template
                >
              </div>
            </div>
          </div>

          <!-- Informations devis -->
          <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
            <div class="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Informations du devis
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
              <div>
                <span class="text-gray-500 dark:text-gray-400">Statut:</span>
                <span class="capitalize">{{
                  getStatusLabel(quote.status)
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Description -->
        <div
          v-if="quote.description"
          class="bg-white dark:bg-gray-800 shadow rounded-lg p-4"
        >
          <div class="text-sm text-gray-500 dark:text-gray-400 mb-2">
            Description
          </div>
          <div
            class="text-gray-900 dark:text-white text-sm whitespace-pre-wrap"
          >
            {{ quote.description }}
          </div>
        </div>

        <!-- Détail des lignes -->
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
          <div class="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Détail des prestations
          </div>

          <!-- Avec sections -->
          <template v-if="(quote.sections?.length || 0) > 0">
            <div
              v-for="section in quote.sections"
              :key="section.id"
              class="mb-6"
            >
              <div
                class="font-semibold text-gray-900 dark:text-white text-lg mb-2"
              >
                {{ section.title }}
              </div>
              <div
                v-if="section.description"
                class="text-sm text-gray-600 dark:text-gray-300 mb-3"
              >
                {{ section.description }}
              </div>

              <div class="overflow-x-auto">
                <table class="min-w-full text-sm">
                  <thead>
                    <tr
                      class="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700"
                    >
                      <th class="py-3 px-2">Description</th>
                      <th class="py-3 px-2 text-right">Qté</th>
                      <th class="py-3 px-2 text-right">Unité</th>
                      <th class="py-3 px-2 text-right">PU HT</th>
                      <th class="py-3 px-2 text-right">TVA</th>
                      <th class="py-3 px-2 text-right">Total HT</th>
                      <th class="py-3 px-2 text-right">Total TTC</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="item in getItemsForSection(section.id)"
                      :key="item.id"
                      class="border-b border-gray-100 dark:border-gray-700"
                    >
                      <td class="py-3 px-2">{{ item.description }}</td>
                      <td class="py-3 px-2 text-right">{{ item.quantity }}</td>
                      <td class="py-3 px-2 text-right">
                        {{ item.unit || '—' }}
                      </td>
                      <td class="py-3 px-2 text-right">
                        {{ formatCurrency(item.unitPriceHt) }}
                      </td>
                      <td class="py-3 px-2 text-right">{{ item.vatRate }}%</td>
                      <td class="py-3 px-2 text-right">
                        {{ formatCurrency(item.totalHt) }}
                      </td>
                      <td class="py-3 px-2 text-right font-medium">
                        {{ formatCurrency(item.totalTtc) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </template>

          <!-- Sans sections -->
          <template v-else>
            <div class="overflow-x-auto">
              <table class="min-w-full text-sm">
                <thead>
                  <tr
                    class="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700"
                  >
                    <th class="py-3 px-2">Description</th>
                    <th class="py-3 px-2 text-right">Qté</th>
                    <th class="py-3 px-2 text-right">Unité</th>
                    <th class="py-3 px-2 text-right">PU HT</th>
                    <th class="py-3 px-2 text-right">TVA</th>
                    <th class="py-3 px-2 text-right">Total HT</th>
                    <th class="py-3 px-2 text-right">Total TTC</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in quote.items"
                    :key="item.id"
                    class="border-b border-gray-100 dark:border-gray-700"
                  >
                    <td class="py-3 px-2">{{ item.description }}</td>
                    <td class="py-3 px-2 text-right">{{ item.quantity }}</td>
                    <td class="py-3 px-2 text-right">{{ item.unit || '—' }}</td>
                    <td class="py-3 px-2 text-right">
                      {{ formatCurrency(item.unitPriceHt) }}
                    </td>
                    <td class="py-3 px-2 text-right">{{ item.vatRate }}%</td>
                    <td class="py-3 px-2 text-right">
                      {{ formatCurrency(item.totalHt) }}
                    </td>
                    <td class="py-3 px-2 text-right font-medium">
                      {{ formatCurrency(item.totalTtc) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </div>

        <!-- Totaux -->
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
          <div class="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Récapitulatif
          </div>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-300"
                >Sous-total HT:</span
              >
              <span class="text-gray-900 dark:text-white">{{
                formatCurrency(quote.subtotalHt)
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-300">TVA:</span>
              <span class="text-gray-900 dark:text-white">{{
                formatCurrency(quote.totalVat)
              }}</span>
            </div>
            <div
              class="flex justify-between text-lg font-semibold border-t border-gray-200 dark:border-gray-700 pt-2"
            >
              <span class="text-gray-900 dark:text-white">Total TTC:</span>
              <span class="text-gray-900 dark:text-white">{{
                formatCurrency(quote.totalTtc)
              }}</span>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div
          v-if="quote.notes"
          class="bg-white dark:bg-gray-800 shadow rounded-lg p-4"
        >
          <div class="text-sm text-gray-500 dark:text-gray-400 mb-2">Notes</div>
          <div
            class="text-gray-900 dark:text-white text-sm whitespace-pre-wrap"
          >
            {{ quote.notes }}
          </div>
        </div>

        <!-- Actions d'acceptation/refus -->
        <div v-if="quote.status === 'sent'" class="space-y-4">
          <!-- Demande de code OTP -->
          <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
            <div class="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Pour accepter ce devis, recevez un code de validation par e‑mail.
            </div>
            <div class="flex items-center gap-2">
              <button
                @click="requestOtp"
                :disabled="otpSending"
                class="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Recevoir un code
              </button>
              <span v-if="otpSent" class="text-sm text-green-600"
                >Code envoyé. Consultez votre e‑mail.</span
              >
            </div>
          </div>

          <!-- Saisie du code OTP -->
          <div
            v-if="otpSent"
            class="bg-white dark:bg-gray-800 shadow rounded-lg p-4"
          >
            <div class="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Saisir le code reçu par e‑mail
            </div>
            <input
              v-model="otp"
              maxlength="6"
              placeholder="123456"
              class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600 mb-3"
            />
            <div>
              <button
                @click="acceptQuote"
                :disabled="!isValidOtp || accepting"
                class="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              >
                Accepter le devis
              </button>
            </div>
          </div>

          <!-- Refus du devis -->
          <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
            <div class="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Refuser le devis (optionnel: indiquez une raison)
            </div>
            <textarea
              v-model="rejectReason"
              rows="3"
              class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600 mb-3"
              placeholder="Raison du refus"
            ></textarea>
            <div>
              <button
                @click="rejectQuote"
                :disabled="rejecting"
                class="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                Refuser le devis
              </button>
            </div>
          </div>
        </div>

        <!-- Statut du devis -->
        <div v-else class="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
          <div class="text-center">
            <div class="text-lg font-semibold mb-2">
              <span v-if="quote.status === 'accepted'" class="text-green-600"
                >✅ Devis accepté</span
              >
              <span v-else-if="quote.status === 'rejected'" class="text-red-600"
                >❌ Devis refusé</span
              >
              <span v-else class="text-gray-600">{{
                getStatusLabel(quote.status)
              }}</span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-300">
              <span v-if="quote.status === 'accepted'"
                >Merci d'avoir accepté ce devis. Un accusé de réception vous a
                été envoyé.</span
              >
              <span v-else-if="quote.status === 'rejected'"
                >Ce devis a été refusé.</span
              >
              <span v-else
                >Ce devis n'est pas encore disponible pour acceptation.</span
              >
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/utils/api'
import { useRoute } from 'vue-router'

const route = useRoute()
const id = computed(() => route.params.id)
const token = computed(() => route.query.token)

const loading = ref(true)
const error = ref('')
const quote = ref(null)

const otp = ref('')
const otpSent = ref(false)
const otpSending = ref(false)
const accepting = ref(false)
const rejecting = ref(false)
const rejectReason = ref('')

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
const isValidOtp = computed(() => /^\d{6}$/.test(otp.value || ''))

const getStatusLabel = (status) => {
  const labels = {
    draft: 'Brouillon',
    sent: 'Envoyé',
    accepted: 'Accepté',
    rejected: 'Refusé',
  }
  return labels[status] || status
}

const getItemsForSection = (sectionId) => {
  if (!quote.value?.items) return []
  return quote.value.items.filter((item) => item.sectionId === sectionId)
}

onMounted(async () => {
  try {
    const { data } = await api.get(`/quotes/${id.value}/public.json`, {
      params: { token: token.value },
    })
    quote.value = data.quote
  } catch (e) {
    error.value = e?.response?.data?.error || 'Erreur de chargement'
  } finally {
    loading.value = false
  }
})

async function requestOtp() {
  otpSending.value = true
  try {
    await api.post(`/quotes/${id.value}/otp`, { token: token.value })
    otpSent.value = true
  } catch (e) {
    error.value = e?.response?.data || 'Envoi du code impossible'
  } finally {
    otpSending.value = false
  }
}

async function acceptQuote() {
  if (!isValidOtp.value) return
  accepting.value = true
  try {
    await api.post(`/quotes/${id.value}/accept`, {
      token: token.value,
      otp: otp.value,
    })
    // Recharger l'état pour montrer accepté
    const { data } = await api.get(`/quotes/${id.value}/public.json`, {
      params: { token: token.value },
    })
    quote.value = data.quote
    alert('Merci, devis accepté. Un accusé de réception vous a été envoyé.')
  } catch (e) {
    alert(e?.response?.data || 'Échec de l’acceptation')
  } finally {
    accepting.value = false
  }
}

async function rejectQuote() {
  rejecting.value = true
  try {
    await api.post(`/quotes/${id.value}/reject`, {
      token: token.value,
      reason: rejectReason.value || undefined,
    })
    const { data } = await api.get(`/quotes/${id.value}/public.json`, {
      params: { token: token.value },
    })
    quote.value = data.quote
    alert('Votre refus a été enregistré.')
  } catch (e) {
    alert(e?.response?.data || 'Échec du refus')
  } finally {
    rejecting.value = false
  }
}
</script>

<style scoped></style>
