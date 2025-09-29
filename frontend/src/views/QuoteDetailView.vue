<template>
  <Layout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Devis {{ quote?.quoteNumber || "" }}
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
            @click="sendEmail"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            Envoyer par e‑mail
          </button>
          <button
            v-if="
              quote &&
              quote.status === 'accepted' &&
              quote.depositAmount > 0 &&
              !quote.depositPaid
            "
            @click="markDepositPaid"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Acompte encaissé
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
                  {{ quote.siteAddress?.addressLine1 || "—" }}
                  <template v-if="quote.siteAddress?.addressLine2"
                    ><br />{{ quote.siteAddress.addressLine2 }}</template
                  >
                  <br />
                  {{ quote.siteAddress?.postalCode || "" }}
                  {{ quote.siteAddress?.city || "" }}
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

          <!-- Section Acompte -->
          <div
            v-if="quote.depositAmount > 0"
            class="bg-white dark:bg-gray-800 shadow rounded-lg p-4"
          >
            <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Acompte
            </div>
            <div class="text-gray-900 dark:text-white text-sm space-y-2">
              <div class="flex items-center justify-between">
                <span>Montant d'acompte:</span>
                <span class="font-semibold">{{
                  formatCurrency(quote.depositAmount)
                }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span>État:</span>
                <span
                  :class="
                    quote.depositPaid
                      ? 'text-green-600 font-semibold'
                      : 'text-orange-600 font-semibold'
                  "
                  class="inline-flex items-center"
                >
                  <svg
                    v-if="quote.depositPaid"
                    class="h-4 w-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <svg
                    v-else
                    class="h-4 w-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {{ quote.depositPaid ? "Encaissé" : "En attente" }}
                </span>
              </div>
              <div
                v-if="!quote.depositPaid"
                class="text-xs text-gray-500 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded"
              >
                💡 L'acompte doit être encaissé avant de commencer les travaux
                (Code de commerce art. L441-10)
              </div>
              <div
                v-else
                class="text-xs text-gray-500 bg-green-50 dark:bg-green-900/20 p-2 rounded"
              >
                ✅ Acompte encaissé - Les travaux peuvent débuter
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
                      (i) => i.sectionId === sec.id,
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
</template>

<script setup>
import { onMounted, computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import Layout from "@/components/Layout.vue";
import { useQuotesStore } from "@/stores/quotes";
import { useToast } from "vue-toastification";

const route = useRoute();
const router = useRouter();
const quotesStore = useQuotesStore();
const toast = useToast();

const id = computed(() => route.params.id);
const loading = computed(() => quotesStore.loading);
const quote = computed(() => quotesStore.currentQuote);

const formatCurrency = (amount) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    Number(amount || 0),
  );
const formatDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("fr-FR");
};

onMounted(async () => {
  try {
    await quotesStore.fetchQuote(id.value);
  } catch (_) {
    /* handled by store */
  }
});

const changeStatus = async (evt) => {
  const newStatus = evt?.target?.value;
  if (!newStatus) return;
  try {
    await quotesStore.updateStatus(id.value, newStatus);
  } catch (_) {}
};

const downloadPdf = async () => {
  try {
    const num = quote.value?.quoteNumber || id.value;
    await quotesStore.downloadPdf(id.value, `devis-${num}.pdf`);
  } catch (_) {}
};

const editQuote = () => {
  router.push(`/quotes/${id.value}/edit`);
};

const markDepositPaid = async () => {
  if (!quote.value) return;

  try {
    // Appeler l'API pour marquer l'acompte comme payé
    const response = await fetch(`/api/quotes/${id.value}/deposit-paid`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (response.ok) {
      toast.success(
        "Acompte marqué comme encaissé ! Les travaux peuvent maintenant débuter.",
      );
      // Recharger les données du devis
      await quotesStore.fetchQuote(id.value);
    } else {
      const error = await response.json();
      toast.error(error.error || "Erreur lors de la mise à jour");
    }
  } catch (error) {
    console.error("Erreur lors du marquage de l'acompte:", error);
    toast.error("Erreur lors de la mise à jour");
  }
};

const sendEmail = async () => {
  try {
    // Vérifier que le client a un email
    const clientEmail = quote.value?.client?.email;
    if (!clientEmail) {
      toast.error("Aucun email trouvé pour ce client");
      return;
    }

    // Demander confirmation
    const confirmed = confirm(
      `Envoyer le devis ${quote.value?.quoteNumber || ""} par email à ${clientEmail} ?`,
    );
    if (!confirmed) return;

    // Appeler l'API pour envoyer l'email avec les mêmes paramètres que dans QuotesView
    await quotesStore.sendByEmail(id.value, {
      to: clientEmail,
      subject: `Devis ${quote.value?.quoteNumber || ""} - ${quote.value?.client?.companyName || quote.value?.client?.firstName + " " + quote.value?.client?.lastName || "Client"}`,
      message: `Bonjour,\n\nVeuillez trouver ci-joint le devis ${quote.value?.quoteNumber || ""}.\n\nCordialement,\nL'équipe`,
    });
    openSendModal.value = false;
  } catch (error) {
    console.error("Erreur envoi email:", error);
    // L'erreur est déjà gérée par le store avec un toast
  }
};
</script>
