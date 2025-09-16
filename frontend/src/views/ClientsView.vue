<template>
  <Layout>
    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <!-- En-tête page -->
      <div class="flex items-center justify-between mb-6">
        <div></div>
        <div class="flex space-x-3">
          <button @click="handleExport"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">
              </path>
            </svg>
            Exporter
          </button>
          <button @click="showImportModal = true"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
            </svg>
            Importer
          </button>
          <button @click="showCreateModal = true"
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6">
              </path>
            </svg>
            Nouveau client
          </button>
        </div>
      </div>

      <!-- Statistiques -->
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z">
                  </path>
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total clients
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ clientsStore.pagination?.total || 0 }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4">
                  </path>
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Entreprises
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ companyClientsCount }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Particuliers
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ individualClientsCount }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Barre de recherche et filtres -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
        <div class="px-4 py-5 sm:p-6">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div class="flex-1 max-w-lg">
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
                <input v-model="searchTerm" @input="debouncedSearch" type="text" placeholder="Rechercher un client..."
                  class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
            </div>
            <div class="flex items-center space-x-4">
              <select v-model="sortBy" @change="handleSortChange"
                class="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white">
                <option value="created_at">Date de création</option>
                <option value="first_name">Prénom</option>
                <option value="last_name">Nom</option>
                <option value="company_name">Entreprise</option>
                <option value="email">Email</option>
              </select>
              <button @click="toggleSortOrder"
                class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <svg v-if="sortOrder === 'asc'" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
                </svg>
                <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Liste des clients -->
      <div class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        <div v-if="loading" class="p-6 text-center">
          <div class="inline-flex items-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
              </path>
            </svg>
            Chargement des clients...
          </div>
        </div>

        <div v-else-if="clients.length === 0" class="p-6 text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z">
            </path>
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Aucun client
          </h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Commencez par créer votre premier client.
          </p>
          <div class="mt-6">
            <button @click="showCreateModal = true"
              class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6">
                </path>
              </svg>
              Nouveau client
            </button>
          </div>
        </div>

        <ul v-else class="divide-y divide-gray-200 dark:divide-gray-700">
          <li v-for="client in clients" :key="client.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
            <div class="px-6 py-4 flex items-center justify-between">
              <div class="flex items-center flex-1 min-w-0">
                <!-- Icône de type de client -->
                <div class="flex-shrink-0 mr-4">
                  <div v-if="client.isCompany"
                    class="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <svg class="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4">
                      </path>
                    </svg>
                  </div>
                  <div v-else
                    class="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <svg class="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                  </div>
                </div>

                <!-- Informations du client -->
                <div class="flex-1 min-w-0">
                  <!-- Nom du client -->
                  <div class="flex items-center mb-1">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {{ client.firstName }} {{ client.lastName }}
                    </h3>
                    <span v-if="client.isCompany"
                      class="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      Entreprise
                    </span>
                    <span v-else
                      class="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Particulier
                    </span>
                  </div>

                  <!-- Nom de l'entreprise (si applicable) -->
                  <p v-if="client.companyName" class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ client.companyName }}
                  </p>

                  <!-- Contact info -->
                  <div class="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
                    <!-- Email -->
                    <div v-if="client.email" class="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <svg class="h-4 w-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z">
                        </path>
                      </svg>
                      <a :href="`mailto:${client.email}`"
                        class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        {{ client.email }}
                      </a>
                    </div>

                    <!-- Téléphone -->
                    <div v-if="client.phone" class="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <svg class="h-4 w-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z">
                        </path>
                      </svg>
                      <a :href="`tel:${client.phone}`"
                        class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        {{ client.phone }}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Actions et statistiques -->
              <div class="flex items-center space-x-6">
                <!-- Statistiques -->
                <div class="text-right">
                  <div class="text-sm text-gray-900 dark:text-white font-medium">
                    {{ client.quotes_count || 0 }} devis
                  </div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    {{ client.invoices_count || 0 }} factures
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex items-center space-x-2">
                  <button @click="viewClient(client)"
                    class="p-2 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Voir les détails">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z">
                      </path>
                    </svg>
                  </button>
                  <button @click="editClient(client)"
                    class="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Modifier">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z">
                      </path>
                    </svg>
                  </button>
                  <button @click="deleteClient(client)"
                    class="p-2 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Supprimer">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16">
                      </path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.pages > 1"
        class="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6 mt-6 rounded-lg shadow">
        <div class="flex-1 flex justify-between sm:hidden">
          <button @click="changePage(pagination.page - 1)" :disabled="pagination.page <= 1"
            class="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
            Précédent
          </button>
          <button @click="changePage(pagination.page + 1)" :disabled="pagination.page >= pagination.pages"
            class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
            Suivant
          </button>
        </div>
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700 dark:text-gray-300">
              Affichage de
              <span class="font-medium">{{
                (pagination.page - 1) * pagination.limit + 1
              }}</span>
              à
              <span class="font-medium">{{
                Math.min(pagination.page * pagination.limit, pagination.total)
              }}</span>
              sur
              <span class="font-medium">{{ pagination.total }}</span>
              résultats
            </p>
          </div>
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button @click="changePage(pagination.page - 1)" :disabled="pagination.page <= 1"
                class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd"
                    d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                    clip-rule="evenodd" />
                </svg>
              </button>
              <button v-for="page in visiblePages" :key="page" @click="changePage(page)" :class="[
                page === pagination.page
                  ? 'z-10 bg-blue-50 dark:bg-blue-900 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600',
                'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
              ]">
                {{ page }}
              </button>
              <button @click="changePage(pagination.page + 1)" :disabled="pagination.page >= pagination.pages"
                class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clip-rule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de création/édition de client -->
    <ClientModal :show="showCreateModal || showEditModal" :client="editingClient" @close="closeModal"
      @saved="handleSaveClient" />

    <!-- Modal d'import -->
    <div v-if="showImportModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div
        class="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div class="mt-3">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              Importer des clients
            </h3>
            <button @click="closeImportModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fichier CSV
            </label>
            <input type="file" @change="handleFileSelect" accept=".csv"
              class="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-gray-300" />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Format attendu: Prénom, Nom, Entreprise, Email, Téléphone, Adresse
              1, Adresse 2, Code postal, Ville, Pays, Est une entreprise, SIRET,
              N° TVA, Forme juridique, RCS, Code APE, Capital social, Notes
            </p>
          </div>

          <div v-if="importResults" class="mb-4">
            <div
              class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4 mb-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clip-rule="evenodd"></path>
                  </svg>
                </div>
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-green-800 dark:text-green-200">
                    Import terminé
                  </h3>
                  <div class="mt-2 text-sm text-green-700 dark:text-green-300">
                    <p>
                      {{ importResults.success.length }} clients importés avec
                      succès
                    </p>
                    <p v-if="importResults.errors.length > 0">
                      {{ importResults.errors.length }} erreurs
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="importResults.errors.length > 0"
              class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
              <h4 class="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                Erreurs d'import :
              </h4>
              <div class="text-sm text-red-700 dark:text-red-300 max-h-32 overflow-y-auto">
                <div v-for="error in importResults.errors" :key="error.index" class="mb-1">
                  Ligne {{ error.index }}: {{ error.error }}
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-end space-x-3">
            <button @click="closeImportModal"
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md">
              Fermer
            </button>
            <button @click="handleImport" :disabled="!selectedFile || clientsStore.loading"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md">
              {{ clientsStore.loading ? 'Import...' : 'Importer' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useClientsStore } from '@/stores/clients'
import { useToast } from 'vue-toastification'
import Layout from '@/components/Layout.vue'
import ClientModal from '@/components/ClientModal.vue'

const router = useRouter()
const clientsStore = useClientsStore()
const toast = useToast()

// État local
const searchTerm = ref('')
const sortBy = ref('created_at')
const sortOrder = ref('desc')
const showCreateModal = ref(false)
const showEditModal = ref(false)
const editingClient = ref(null)
const showImportModal = ref(false)
const selectedFile = ref(null)
const importResults = ref(null)

// Getters du store
const clients = computed(() => clientsStore.clients)
const loading = computed(() => clientsStore.loading)
const pagination = computed(() => clientsStore.pagination)

const companyClientsCount = computed(() => {
  return clientsStore.clients.filter((client) => client.isCompany).length
})

const individualClientsCount = computed(() => {
  return clientsStore.clients.filter((client) => !client.isCompany).length
})

// Pages visibles pour la pagination
const visiblePages = computed(() => {
  const current = pagination.value.page
  const total = pagination.value.pages
  const delta = 2

  let start = Math.max(1, current - delta)
  let end = Math.min(total, current + delta)

  if (end - start < 2 * delta) {
    if (start === 1) {
      end = Math.min(total, start + 2 * delta)
    } else {
      start = Math.max(1, end - 2 * delta)
    }
  }

  const pages = []
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

// Recherche avec debounce
let searchTimeout = null
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    clientsStore.searchClients(searchTerm.value)
  }, 300)
}

// Gestion du tri
const handleSortChange = () => {
  clientsStore.sortClients(sortBy.value, sortOrder.value)
}

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  clientsStore.sortClients(sortBy.value, sortOrder.value)
}

// Gestion de la pagination
const changePage = (page) => {
  if (page >= 1 && page <= pagination.value.pages) {
    clientsStore.changePage(page)
  }
}

// Actions sur les clients
const viewClient = (client) => {
  router.push(`/clients/${client.id}`)
}

const editClient = (client) => {
  editingClient.value = { ...client }
  showEditModal.value = true
}

const deleteClient = async (client) => {
  if (
    confirm(
      `Êtes-vous sûr de vouloir supprimer le client ${client.firstName} ${client.lastName} ?`
    )
  ) {
    try {
      await clientsStore.deleteClient(client.id)
    } catch (error) {
      // L'erreur est déjà gérée dans le store
    }
  }
}

// Gestion du modal
const closeModal = () => {
  showCreateModal.value = false
  showEditModal.value = false
  editingClient.value = null
}

// Le modal effectue déjà la création/mise à jour et émet 'saved'.
// Ici, on se contente de fermer et rafraîchir la liste pour éviter les doublons.
const handleSaveClient = async () => {
  try {
    closeModal()
    await clientsStore.fetchClients()
  } catch (error) {
    // Erreur déjà gérée dans le store
  }
}

// Méthodes d'import/export
const handleExport = async () => {
  try {
    await clientsStore.exportClients()
  } catch (error) {
    // L'erreur est déjà gérée dans le store
  }
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file && file.type === 'text/csv') {
    selectedFile.value = file
    importResults.value = null
  } else {
    toast.error('Veuillez sélectionner un fichier CSV valide')
    selectedFile.value = null
  }
}

const handleImport = async () => {
  if (!selectedFile.value) return

  try {
    const text = await selectedFile.value.text()
    const lines = text.split('\n').filter((line) => line.trim())

    if (lines.length < 2) {
      toast.error(
        'Le fichier CSV doit contenir au moins un en-tête et une ligne de données'
      )
      return
    }

    // Parser le CSV (version simple)
    const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''))
    const clientsData = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim().replace(/"/g, ''))
      if (values.length >= 2) {
        // Au minimum prénom et nom
        clientsData.push({
          firstName: values[0] || '',
          lastName: values[1] || '',
          companyName: values[2] || '',
          email: values[3] || '',
          phone: values[4] || '',
          addressLine1: values[5] || '',
          addressLine2: values[6] || '',
          postalCode: values[7] || '',
          city: values[8] || '',
          country: values[9] || 'France',
          isCompany:
            values[10]?.toLowerCase() === 'oui' ||
            values[10]?.toLowerCase() === 'true',
          siret: values[11] || '',
          vatNumber: values[12] || '',
          legalForm: values[13] || '',
          rcsNumber: values[14] || '',
          apeCode: values[15] || '',
          capitalSocial: values[16] ? parseFloat(values[16]) : null,
          notes: values[17] || '',
        })
      }
    }

    if (clientsData.length === 0) {
      toast.error('Aucune donnée client valide trouvée dans le fichier')
      return
    }

    const results = await clientsStore.importClients(clientsData)
    importResults.value = results
  } catch (error) {
    toast.error('Erreur lors de la lecture du fichier CSV')
    console.error('Import error:', error)
  }
}

const closeImportModal = () => {
  showImportModal.value = false
  selectedFile.value = null
  importResults.value = null
}

// Utilitaires
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount || 0)
}

// Initialisation
onMounted(() => {
  clientsStore.fetchClients()
})

// Watchers
watch(
  () => clientsStore.filters,
  (newFilters) => {
    sortBy.value = newFilters.sortBy
    sortOrder.value = newFilters.sortOrder
  },
  { deep: true }
)
</script>
