<template>
  <Layout>
    <div class="space-y-6">
      <!-- Métriques simplifiées -->
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <!-- 1. Nombre de clients -->
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
                    Nombre de clients
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ stats.clients }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Devis envoyés -->
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
                    Devis envoyés
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ stats.sentQuotes }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Devis acceptés -->
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt
                    class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate"
                  >
                    Devis acceptés
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ stats.acceptedQuotes }}
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
                  class="w-8 h-8 bg-purple-600 rounded-md flex items-center justify-center"
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

        <!-- 5. CA annuel -->
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
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
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

        <!-- 6. Factures envoyées -->
        <div
          class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
        >
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div
                  class="w-8 h-8 bg-yellow-600 rounded-md flex items-center justify-center"
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
                      d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt
                    class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate"
                  >
                    Factures envoyées
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ stats.sentInvoices }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <!-- 7. Factures payées -->
        <div
          class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
        >
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div
                  class="w-8 h-8 bg-emerald-600 rounded-md flex items-center justify-center"
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt
                    class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate"
                  >
                    Factures payées
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ stats.paidInvoices }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <!-- 8. Relances à effectuer -->
        <div
          class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
        >
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div
                  class="w-8 h-8 bg-orange-600 rounded-md flex items-center justify-center"
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
                      d="M15 17h5l-5 5v-5zM4.828 7l2.586 2.586a2 2 0 102.828 2.828L7.828 9.828a2 2 0 00-2.828-2.828L2.414 7a2 2 0 012.414-2.414L7.828 2.172a2 2 0 012.828 2.828L7.828 7z"
                    />
                  </svg>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt
                    class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate"
                  >
                    Relances à effectuer
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ stats.followUpsNeeded }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <!-- 9. Factures hors délai -->
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
                    Factures hors délai
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ stats.overdueInvoices }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions rapides -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3
            class="text-lg leading-6 font-medium text-gray-900 dark:text-white"
          >
            Actions rapides
          </h3>
          <div
            class="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            <router-link
              to="/clients"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-cobalt hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-cobalt transition-colors duration-200"
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
              Nouveau client
            </router-link>

            <router-link
              to="/quotes"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
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
              Nouveau devis
            </router-link>

            <router-link
              to="/invoices"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors duration-200"
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
            </router-link>

            <router-link
              to="/services"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
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
              Nouveau service
            </router-link>
          </div>
        </div>
      </div>

      <!-- Activité récente -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3
            class="text-lg leading-6 font-medium text-gray-900 dark:text-white"
          >
            Activité récente
          </h3>
          <div class="mt-5">
            <div class="flow-root">
              <ul class="-mb-8">
                <li v-for="(activity, index) in recentActivities" :key="index">
                  <div class="relative pb-8">
                    <span
                      v-if="index !== recentActivities.length - 1"
                      class="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"
                      aria-hidden="true"
                    />
                    <div class="relative flex space-x-3">
                      <div>
                        <span
                          :class="[
                            'h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-gray-800',
                            activity.iconBg,
                          ]"
                        >
                          <svg
                            :class="['h-5 w-5', activity.iconColor]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              :d="activity.iconPath"
                            />
                          </svg>
                        </span>
                      </div>
                      <div
                        class="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4"
                      >
                        <div>
                          <p class="text-sm text-gray-500 dark:text-gray-400">
                            {{ activity.content }}
                          </p>
                        </div>
                        <div
                          class="text-right text-sm whitespace-nowrap text-gray-500 dark:text-gray-400"
                        >
                          <time :datetime="activity.dateTime">{{
                            activity.time
                          }}</time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import Layout from '@/components/Layout.vue'
import api from '@/utils/api'

const authStore = useAuthStore()

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
})

const recentActivities = ref([
  {
    content: 'Nouveau client ajouté : Jean Dupont',
    time: '2h',
    dateTime: '2023-12-07T10:00:00Z',
    iconPath:
      'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
    iconBg: 'bg-blue-500',
    iconColor: 'text-white',
  },
  {
    content: 'Devis #DEV-2023-001 envoyé',
    time: '4h',
    dateTime: '2023-12-07T08:00:00Z',
    iconPath:
      'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    iconBg: 'bg-green-500',
    iconColor: 'text-white',
  },
  {
    content: 'Facture #FAC-2023-045 payée',
    time: '1j',
    dateTime: '2023-12-06T14:00:00Z',
    iconPath:
      'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
    iconBg: 'bg-yellow-500',
    iconColor: 'text-white',
  },
])

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

onMounted(async () => {
  try {
    const [statsRes, activityRes] = await Promise.all([
      api.get('/dashboard/stats'),
      api.get('/dashboard/recent-activity'),
    ])
    stats.value = statsRes.data
    recentActivities.value = (activityRes.data.activities || []).map((a) => ({
      content:
        a.type === 'client'
          ? `Nouveau client: ${a.label}`
          : a.type === 'quote'
            ? `Devis ${a.label} créé`
            : `Facture ${a.label} créée`,
      time: new Date(a.createdAt).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      dateTime: a.createdAt,
      iconPath:
        a.type === 'client'
          ? 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z'
          : a.type === 'quote'
            ? 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
            : 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
      iconBg:
        a.type === 'client'
          ? 'bg-blue-500'
          : a.type === 'quote'
            ? 'bg-green-500'
            : 'bg-yellow-500',
      iconColor: 'text-white',
    }))
  } catch (error) {
    console.error('Erreur chargement dashboard:', error)
  }
})
</script>
