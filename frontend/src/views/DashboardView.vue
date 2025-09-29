<template>
  <Layout>
    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <!-- En-tête avec actions rapides -->
      <div class="mb-8">
        <div
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between"
        >
          <div></div>

          <!-- Actions rapides -->
          <div class="mt-4 sm:mt-0 flex flex-wrap gap-3">
            <router-link
              to="/clients?action=create"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
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
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
              Nouveau client
            </router-link>

            <router-link
              to="/quotes?action=create"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Nouveau devis
            </router-link>

            <router-link
              to="/invoices?action=create"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Nouvelle facture
            </router-link>
          </div>
        </div>
      </div>

      <!-- Indicateur d'erreur -->
      <div
        v-if="dashboardError"
        class="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4"
      >
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
            <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
              Erreur de chargement
            </h3>
            <div class="mt-2 text-sm text-red-700 dark:text-red-300">
              <p>
                Le tableau de bord n'a pas pu être chargé correctement. Veuillez
                recharger la page.
              </p>
            </div>
            <div class="mt-4">
              <button
                @click="loadDashboardData()"
                class="bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200 dark:hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Recharger
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- KPI principaux (6 tuiles au lieu de 9) -->
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <!-- 1. Clients -->
        <div
          class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
        >
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div
                  class="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center"
                >
                  <svg
                    class="h-5 w-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                    />
                  </svg>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt
                    class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate"
                  >
                    Clients
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ stats.clients }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Devis (fusionné avec ratio) -->
        <div
          class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
        >
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div
                  class="w-8 h-8 bg-amber-600 rounded-md flex items-center justify-center"
                >
                  <svg
                    class="h-5 w-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt
                    class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate"
                  >
                    Devis ({{ stats.sentQuotes }} envoyés)
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ stats.acceptedQuotes }} acceptés
                    <span class="text-sm text-gray-500 dark:text-gray-400">
                      ({{
                        stats.sentQuotes > 0
                          ? Math.round(
                              (stats.acceptedQuotes / stats.sentQuotes) * 100,
                            )
                          : 0
                      }}%)
                    </span>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Factures (fusionné avec encours) -->
        <div
          class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
        >
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div
                  class="w-8 h-8 bg-green-600 rounded-md flex items-center justify-center"
                >
                  <svg
                    class="h-5 w-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt
                    class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate"
                  >
                    Factures ({{ stats.sentInvoices }} envoyées)
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ stats.paidInvoices }} payées
                    <span class="text-sm text-gray-500 dark:text-gray-400">
                      ({{ stats.sentInvoices - stats.paidInvoices }} en attente)
                    </span>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. CA mensuel -->
        <div
          class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
        >
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div
                  class="w-8 h-8 bg-green-600 rounded-md flex items-center justify-center"
                >
                  <svg
                    class="h-5 w-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt
                    class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate"
                  >
                    CA mensuel
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ formatCurrency(stats.monthlyRevenue) }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <!-- 5. Factures en retard -->
        <div
          class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
        >
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div
                  class="w-8 h-8 bg-red-600 rounded-md flex items-center justify-center"
                >
                  <svg
                    class="h-5 w-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt
                    class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate"
                  >
                    Factures en retard
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ stats.overdueInvoices }}
                    <span class="text-sm text-gray-500 dark:text-gray-400">
                      ({{ stats.followUpsNeeded }} à relancer)
                    </span>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <!-- 6. CA annuel -->
        <div
          class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
        >
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div
                  class="w-8 h-8 bg-indigo-600 rounded-md flex items-center justify-center"
                >
                  <svg
                    class="h-5 w-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt
                    class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate"
                  >
                    CA annuel
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ formatCurrency(stats.yearlyRevenue) }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Section "À faire" synthétique -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- Relances factures -->
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <h3
              class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4"
            >
              Relances factures
            </h3>
            <div v-if="urgentInvoices.length > 0" class="space-y-3">
              <div
                v-for="invoice in urgentInvoices.slice(0, 3)"
                :key="invoice.id"
                class="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-md"
              >
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ invoice.invoice_number }}
                  </p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ invoice.client_name }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-sm font-medium text-red-600 dark:text-red-400">
                    {{ formatCurrency(invoice.total_ttc) }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    Échéance: {{ formatDate(invoice.due_date) }}
                  </p>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-4">
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Aucune relance urgente
              </p>
            </div>
            <div v-if="urgentInvoices.length > 0" class="mt-4 text-center">
              <router-link
                to="/invoices?status=overdue"
                class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                Voir toutes les factures en retard →
              </router-link>
            </div>
          </div>
        </div>

        <!-- Devis à relancer -->
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <h3
              class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4"
            >
              Devis à relancer
            </h3>
            <div v-if="pendingQuotes.length > 0" class="space-y-3">
              <div
                v-for="quote in pendingQuotes.slice(0, 3)"
                :key="quote.id"
                class="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md"
              >
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ quote.quote_number }}
                  </p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ quote.client_name }}
                  </p>
                </div>
                <div class="text-right">
                  <p
                    class="text-sm font-medium text-amber-600 dark:text-amber-400"
                  >
                    {{ formatCurrency(quote.total_ttc) }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    Envoyé: {{ formatDate(quote.created_at) }}
                  </p>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-4">
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Aucun devis en attente
              </p>
            </div>
            <div v-if="pendingQuotes.length > 0" class="mt-4 text-center">
              <router-link
                to="/quotes?status=sent"
                class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                Voir tous les devis en attente →
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- Activité récente (sans mock) -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3
            class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4"
          >
            Activité récente
          </h3>
          <div v-if="recentActivities.length > 0" class="flow-root">
            <ul role="list" class="-mb-8">
              <li
                v-for="(activity, activityIdx) in recentActivities"
                :key="activity.id"
                class="relative pb-8"
              >
                <div
                  v-if="activityIdx !== recentActivities.length - 1"
                  class="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"
                  aria-hidden="true"
                />
                <div class="relative flex space-x-3">
                  <div>
                    <span
                      class="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white dark:ring-gray-800"
                    >
                      <svg
                        class="h-5 w-5 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path :d="activity.iconPath" />
                      </svg>
                    </span>
                  </div>
                  <div
                    class="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4"
                  >
                    <div>
                      <p class="text-sm text-gray-500 dark:text-gray-400">
                        {{ activity.description }}
                      </p>
                    </div>
                    <div
                      class="text-right text-sm whitespace-nowrap text-gray-500 dark:text-gray-400"
                    >
                      {{ activity.time }}
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>
          <div v-else class="text-center py-8">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Pas d'activité récente
            </p>
          </div>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useToast } from "vue-toastification";
import Layout from "@/components/Layout.vue";
import api from "@/utils/api";

const toast = useToast();

// État d'erreur pour le dashboard
const dashboardError = ref(false);

// Fonction pour formater les dates de manière relative
function formatRelativeTime(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return "À l'instant";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `Il y a ${minutes} min`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `Il y a ${hours}h`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `Il y a ${days} jour${days > 1 ? "s" : ""}`;
  } else {
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }
}

// Fonction pour formater les montants
function formatCurrency(amount) {
  const safeAmount = Number(amount ?? 0);
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(safeAmount);
}

// Fonction pour formater les dates
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("fr-FR");
}

const stats = ref({
  clients: 0,
  sentQuotes: 0,
  acceptedQuotes: 0,
  monthlyRevenue: 0,
  yearlyRevenue: 0,
  sentInvoices: 0,
  paidInvoices: 0,
  followUpsNeeded: 0,
  overdueInvoices: 0,
});

const recentActivities = ref([]);
const urgentInvoices = ref([]);
const pendingQuotes = ref([]);

// Charger les données du dashboard
async function loadDashboardData() {
  try {
    const [statsResponse, activitiesResponse] = await Promise.all([
      api.get("/dashboard/stats"),
      api.get("/dashboard/recent-activity"),
    ]);

    stats.value = statsResponse.data;
    const activities = Array.isArray(activitiesResponse.data?.activities)
      ? activitiesResponse.data.activities
      : Array.isArray(activitiesResponse.data)
        ? activitiesResponse.data
        : [];
    recentActivities.value = activities.map((a) => ({
      ...a,
      description:
        a.type === "client"
          ? `Nouveau client: ${a.label}`
          : a.type === "quote"
            ? `Devis ${a.label} créé`
            : `Facture ${a.label} créée`,
      time: formatRelativeTime(new Date(a.createdAt)),
      dateTime: a.createdAt,
      iconPath:
        a.type === "client"
          ? "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
          : a.type === "quote"
            ? "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            : "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    }));

    // Charger les factures urgentes et devis en attente
    await loadUrgentData();

    // Réinitialiser l'état d'erreur en cas de succès
    dashboardError.value = false;
  } catch (error) {
    console.error("Erreur lors du chargement du dashboard:", error);
    dashboardError.value = true;
    toast.error(
      "Erreur lors du chargement du tableau de bord. Veuillez recharger la page.",
    );
  }
}

// Charger les données urgentes
async function loadUrgentData() {
  try {
    // Essayer d'abord les nouveaux endpoints
    const [invoicesResponse, quotesResponse] = await Promise.all([
      api
        .get("/dashboard/urgent-invoices")
        .catch(() => ({ data: { invoices: [] } })),
      api
        .get("/dashboard/pending-quotes")
        .catch(() => ({ data: { quotes: [] } })),
    ]);

    urgentInvoices.value = Array.isArray(invoicesResponse.data?.invoices)
      ? invoicesResponse.data.invoices
      : [];
    pendingQuotes.value = Array.isArray(quotesResponse.data?.quotes)
      ? quotesResponse.data.quotes
      : [];
  } catch (error) {
    console.error("Erreur lors du chargement des données urgentes:", error);
    // En cas d'erreur, initialiser avec des tableaux vides
    urgentInvoices.value = [];
    pendingQuotes.value = [];
  }
}

onMounted(() => {
  loadDashboardData();
});
</script>
