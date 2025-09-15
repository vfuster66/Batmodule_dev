<template>
  <Layout>
    <div class="space-y-6">
      <!-- En-tête -->
      <div class="flex items-center justify-between">
        <div></div>
        <button
          @click="openCreateModal"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
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
              placeholder="Rechercher un devis..."
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <select
              v-model="statusFilter"
              @change="handleStatusFilter"
              class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Tous les statuts</option>
              <option value="draft">Brouillon</option>
              <option value="sent">Envoyé</option>
              <option value="accepted">Accepté</option>
              <option value="rejected">Refusé</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Liste des devis -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div v-if="quotesStore.loading" class="p-8 text-center">
          <div
            class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"
          ></div>
          <p class="mt-2 text-gray-500 dark:text-gray-400">Chargement...</p>
        </div>

        <div
          v-else-if="quotesStore.quotes.length === 0"
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Aucun devis
            </h3>
            <p class="text-gray-500 dark:text-gray-400 mb-6">
              Commencez par créer votre premier devis
            </p>
            <button
              @click="openCreateModal"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
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
              Créer un devis
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
                  N° Devis
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Client
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
                v-for="quote in quotesStore.quotes"
                :key="quote.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white"
                >
                  {{ quote.quoteNumber }}
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300"
                >
                  {{ quote.clientCompany || quote.clientName || '—' }}
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300"
                >
                  {{ formatCurrency(quote.totalTtc) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="relative inline-block">
                    <select
                      :value="quote.status"
                      @change="onChangeStatus(quote, $event)"
                      :class="getStatusBadgeClass(quote.status)"
                      class="px-3 py-1 text-xs font-medium rounded-full border-0 cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 pr-6"
                    >
                      <option value="draft">Brouillon</option>
                      <option value="sent">Envoyé</option>
                      <option value="accepted">Accepté</option>
                      <option value="rejected">Refusé</option>
                      <option value="converted" disabled>Facturé</option>
                    </select>
                    <div
                      class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none"
                    >
                      <svg
                        class="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clip-rule="evenodd"
                        ></path>
                      </svg>
                    </div>
                  </div>
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300"
                >
                  {{ formatDate(quote.createdAt) }}
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                >
                  <div class="flex items-center justify-end space-x-2">
                    <button
                      @click="downloadPdf(quote.id, quote.quoteNumber)"
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
                      @click="sendQuoteByEmail(quote)"
                      class="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                      title="Envoyer par email"
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
                          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                    <button
                      v-if="quote.status === 'accepted'"
                      @click="convertToInvoice(quote.id)"
                      class="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                      title="Convertir en facture"
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
                          d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                    <button
                      v-if="quote.status === 'accepted'"
                      @click="openAdvanceModal(quote)"
                      class="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                      title="Créer une facture d'acompte"
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
                          d="M12 8c-1.657 0-3 1.343-3 3v6a3 3 0 106 0v-6a3 3 0 00-3-3z"
                        />
                      </svg>
                    </button>
                    <button
                      v-if="quote.status !== 'accepted'"
                      @click="editQuote(quote.id)"
                      class="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300"
                      title="Modifier"
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
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      @click="viewQuote(quote.id)"
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
                      @click="deleteQuote(quote.id, quote.quoteNumber)"
                      class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      title="Supprimer"
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
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </Layout>
  <!-- Modal facture d'acompte -->
  <div v-if="showAdvanceModal" class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Créer une facture d'acompte</h3>
        <button @click="closeAdvanceModal" class="text-gray-500 hover:text-gray-700 dark:text-gray-300">✕</button>
      </div>
      <div class="p-6 space-y-4">
        <div>
          <label class="block text-sm text-gray-700 dark:text-gray-300 mb-1">Titre</label>
          <input v-model="advanceForm.title" type="text" class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600" />
        </div>
        <div>
          <label class="block text-sm text-gray-700 dark:text-gray-300 mb-1">Montant d'acompte (€)</label>
          <input v-model.number="advanceForm.advanceAmount" type="number" min="0.01" step="0.01" class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600" />
        </div>
        <div>
          <label class="block text-sm text-gray-700 dark:text-gray-300 mb-1">Montant total (€)</label>
          <input v-model.number="advanceForm.totalAmount" type="number" min="0.01" step="0.01" class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600" />
        </div>
        <div>
          <label class="block text-sm text-gray-700 dark:text-gray-300 mb-1">Échéance</label>
          <input v-model="advanceForm.dueDate" type="date" class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600" />
        </div>
        <div>
          <label class="block text-sm text-gray-700 dark:text-gray-300 mb-1">N° Bon de commande (optionnel)</label>
          <input v-model="advanceForm.purchaseOrderNumber" type="text" class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600" />
        </div>
        <div>
          <label class="block text-sm text-gray-700 dark:text-gray-300 mb-1">Notes (optionnel)</label>
          <textarea v-model="advanceForm.notes" rows="2" class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600"></textarea>
        </div>
      </div>
      <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
        <button @click="closeAdvanceModal" class="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100">Annuler</button>
        <button @click="submitAdvance" :disabled="!canSubmitAdvance" class="px-4 py-2 rounded-md bg-purple-600 text-white disabled:opacity-50">Créer</button>
      </div>
    </div>
  </div>
  <!-- Modal création devis -->
  <div
    v-if="showCreateModal"
    class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
  >
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
    >
      <div
        class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between"
      >
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Nouveau devis
          </h3>
          <div class="mt-1 flex items-center gap-2 text-xs">
            <span :class="stepClass(1)">1. Client</span>
            <span class="text-gray-400">›</span>
            <span :class="stepClass(2)">2. Détails</span>
            <span class="text-gray-400">›</span>
            <span :class="stepClass(3)">3. Sections</span>
            <span class="text-gray-400">›</span>
            <span :class="stepClass(4)">4. Aperçu</span>
          </div>
        </div>
        <button
          @click="closeCreateModal"
          class="text-gray-500 hover:text-gray-700 dark:text-gray-300"
        >
          ✕
        </button>
      </div>
      <div class="p-6 space-y-4 overflow-y-auto">
        <!-- Mode simple -->
        <div v-if="simpleMode" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm text-gray-700 dark:text-gray-300 mb-1"
                >Client</label
              >
              <select
                v-model="form.clientId"
                class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600"
              >
                <option disabled value="">— Sélectionner un client —</option>
                <option
                  v-for="c in clientsStore.clients"
                  :key="c.id"
                  :value="c.id"
                >
                  {{ c.firstName }} {{ c.lastName
                  }}<span v-if="c.companyName"> — {{ c.companyName }}</span>
                </option>
              </select>
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
                >Valide jusqu'au</label
              >
              <input
                v-model="form.validUntil"
                type="date"
                class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>
          <!-- Fiche client (lecture seule) -->
          <div
            v-if="selectedClient"
            class="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-md text-sm grid grid-cols-1 md:grid-cols-3 gap-2"
          >
            <div>
              <div class="text-gray-500 dark:text-gray-400">Nom</div>
              <div class="text-gray-900 dark:text-white">
                {{ selectedClient.firstName }} {{ selectedClient.lastName }}
              </div>
            </div>
            <div>
              <div class="text-gray-500 dark:text-gray-400">Entreprise</div>
              <div class="text-gray-900 dark:text-white">
                {{ selectedClient.companyName || '—' }}
              </div>
            </div>
            <div>
              <div class="text-gray-500 dark:text-gray-400">Email</div>
              <div class="text-gray-900 dark:text-white">
                {{ selectedClient.email || '—' }}
              </div>
            </div>
            <div>
              <div class="text-gray-500 dark:text-gray-400">Téléphone</div>
              <div class="text-gray-900 dark:text-white">
                {{ selectedClient.phone || '—' }}
              </div>
            </div>
            <div class="md:col-span-2">
              <div class="text-gray-500 dark:text-gray-400">Adresse</div>
              <div class="text-gray-900 dark:text-white">
                {{ selectedClient.addressLine1 || '—'
                }}<span v-if="selectedClient.addressLine2"
                  >, {{ selectedClient.addressLine2 }}</span
                >
                <span v-if="selectedClient.postalCode || selectedClient.city">
                  — {{ selectedClient.postalCode }}
                  {{ selectedClient.city }}</span
                >
                <span v-if="selectedClient.country">
                  — {{ selectedClient.country }}</span
                >
              </div>
            </div>
            <div>
              <div class="text-gray-500 dark:text-gray-400">SIRET</div>
              <div class="text-gray-900 dark:text-white">
                {{ selectedClient.siret || '—' }}
              </div>
            </div>
            <div>
              <div class="text-gray-500 dark:text-gray-400">TVA</div>
              <div class="text-gray-900 dark:text-white">
                {{ selectedClient.vatNumber || '—' }}
              </div>
            </div>
            <div>
              <div class="text-gray-500 dark:text-gray-400">RCS</div>
              <div class="text-gray-900 dark:text-white">
                {{ selectedClient.rcsNumber || '—' }}
              </div>
            </div>
            <div>
              <div class="text-gray-500 dark:text-gray-400">Code APE</div>
              <div class="text-gray-900 dark:text-white">
                {{ selectedClient.apeCode || '—' }}
              </div>
            </div>
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

          <!-- Acompte -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm text-gray-700 dark:text-gray-300 mb-1"
                >Pourcentage d'acompte (%)</label
              >
              <input
                v-model.number="form.depositPercent"
                type="number"
                min="0"
                max="100"
                step="0.1"
                class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label class="block text-sm text-gray-700 dark:text-gray-300 mb-1"
                >Montant d'acompte (€)</label
              >
              <input
                v-model.number="form.depositAmount"
                type="number"
                min="0"
                step="0.01"
                class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>

          <!-- Ajout depuis catalogue + lignes -->
          <div class="border rounded-md p-3 dark:border-gray-700">
            <div class="flex items-center gap-2 mb-2">
              <select
                v-model="selectedServiceIdPerSection[0]"
                class="flex-1 px-3 py-1 rounded-md border dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">— Ajouter depuis le catalogue —</option>
                <option v-for="s in services" :key="s.id" :value="s.id">
                  {{ s.name }} ({{ s.unit }}) —
                  {{ formatCurrency(s.price_ht) }} HT
                </option>
              </select>
              <button
                @click="addFromCatalogToSection(0)"
                :disabled="!selectedServiceIdPerSection[0]"
                class="text-sm px-3 py-1 rounded-md bg-green-600 text-white"
              >
                Ajouter
              </button>
              <button
                @click="addItemToSection(0)"
                class="text-sm px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100"
              >
                + Ligne vide
              </button>
            </div>

            <!-- En-têtes colonnes -->
            <div
              class="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300 px-1 mt-1"
            >
              <div class="col-span-3">Description</div>
              <div class="col-span-2">Unité</div>
              <div class="col-span-1 text-right">Qté</div>
              <div class="col-span-2 text-right">PU HT</div>
              <div class="col-span-1 text-right">TVA %</div>
              <div class="col-span-1 text-right">Remise %</div>
              <div class="col-span-1 text-right">Maj. %</div>
              <div class="col-span-1 text-right">Total TTC</div>
            </div>

            <div
              class="grid grid-cols-12 gap-2 items-start"
              v-for="(it, idx) in form.sections[0].items"
              :key="'simple-' + idx"
            >
              <input
                v-model="it.description"
                placeholder="Description"
                class="col-span-3 px-2 py-1 rounded-md border dark:bg-gray-700 dark:border-gray-600"
              />
              <select
                v-model="it.unit"
                class="col-span-2 px-2 py-1 rounded-md border dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="m²">m²</option>
                <option value="unité">unité</option>
                <option value="forfait">forfait</option>
                <option value="ml">ml</option>
              </select>
              <input
                v-model.number="it.quantity"
                type="number"
                min="0.001"
                step="0.001"
                placeholder="Qté"
                class="col-span-1 px-2 py-1 rounded-md border dark:bg-gray-700 dark:border-gray-600 text-right"
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
          </div>
        </div>

        <!-- Step 1: Client selection / creation -->
        <div v-else-if="currentStep === 1" class="space-y-4">
          <div class="flex items-center justify-between">
            <label class="block text-sm text-gray-700 dark:text-gray-300"
              >Sélectionner un client</label
            >
            <button @click="toggleCreateClient" class="text-sm text-blue-600">
              {{ showCreateClient ? 'Annuler la création' : 'Nouveau client' }}
            </button>
          </div>
          <div
            v-if="!showCreateClient"
            class="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <select
                v-model="form.clientId"
                class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600"
              >
                <option disabled value="">— Sélectionner un client —</option>
                <option
                  v-for="c in clientsStore.clients"
                  :key="c.id"
                  :value="c.id"
                >
                  {{ c.firstName }} {{ c.lastName
                  }}<span v-if="c.companyName"> — {{ c.companyName }}</span>
                </option>
              </select>
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              Astuce: utilisez la création rapide si le client n'existe pas
              encore.
            </div>
          </div>
          <!-- Fiche client (lecture seule) -->
          <div
            v-if="!showCreateClient && selectedClient"
            class="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-md text-sm grid grid-cols-1 md:grid-cols-3 gap-2"
          >
            <div>
              <div class="text-gray-500 dark:text-gray-400">Nom</div>
              <div class="text-gray-900 dark:text-white">
                {{ selectedClient.firstName }} {{ selectedClient.lastName }}
              </div>
            </div>
            <div>
              <div class="text-gray-500 dark:text-gray-400">Entreprise</div>
              <div class="text-gray-900 dark:text-white">
                {{ selectedClient.companyName || '—' }}
              </div>
            </div>
            <div>
              <div class="text-gray-500 dark:text-gray-400">Email</div>
              <div class="text-gray-900 dark:text-white">
                {{ selectedClient.email || '—' }}
              </div>
            </div>
            <div>
              <div class="text-gray-500 dark:text-gray-400">Téléphone</div>
              <div class="text-gray-900 dark:text-white">
                {{ selectedClient.phone || '—' }}
              </div>
            </div>
            <div class="md:col-span-2">
              <div class="text-gray-500 dark:text-gray-400">Adresse</div>
              <div class="text-gray-900 dark:text-white">
                {{ selectedClient.addressLine1 || '—'
                }}<span v-if="selectedClient.addressLine2"
                  >, {{ selectedClient.addressLine2 }}</span
                >
                <span v-if="selectedClient.postalCode || selectedClient.city">
                  — {{ selectedClient.postalCode }}
                  {{ selectedClient.city }}</span
                >
                <span v-if="selectedClient.country">
                  — {{ selectedClient.country }}</span
                >
              </div>
            </div>
            <div>
              <div class="text-gray-500 dark:text-gray-400">SIRET</div>
              <div class="text-gray-900 dark:text-white">
                {{ selectedClient.siret || '—' }}
              </div>
            </div>
            <div>
              <div class="text-gray-500 dark:text-gray-400">TVA</div>
              <div class="text-gray-900 dark:text-white">
                {{ selectedClient.vatNumber || '—' }}
              </div>
            </div>
            <div>
              <div class="text-gray-500 dark:text-gray-400">RCS</div>
              <div class="text-gray-900 dark:text-white">
                {{ selectedClient.rcsNumber || '—' }}
              </div>
            </div>
            <div>
              <div class="text-gray-500 dark:text-gray-400">Code APE</div>
              <div class="text-gray-900 dark:text-white">
                {{ selectedClient.apeCode || '—' }}
              </div>
            </div>
          </div>
          <div
            v-else
            class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-md"
          >
            <div>
              <label class="block text-sm mb-1">Prénom</label>
              <input
                v-model="newClient.firstName"
                class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label class="block text-sm mb-1">Nom</label>
              <input
                v-model="newClient.lastName"
                class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label class="block text-sm mb-1">Entreprise (optionnel)</label>
              <input
                v-model="newClient.companyName"
                class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label class="block text-sm mb-1">Email (optionnel)</label>
              <input
                v-model="newClient.email"
                type="email"
                class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div class="md:col-span-2 flex justify-end gap-2">
              <button
                @click="createClient"
                :disabled="
                  clientsStore.loading ||
                  !newClient.firstName ||
                  !newClient.lastName
                "
                class="px-3 py-2 rounded-md bg-blue-600 text-white"
              >
                {{ clientsStore.loading ? 'Création…' : 'Créer le client' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Step 2: Quote details -->
        <div v-if="currentStep === 2" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                >Client</label
              >
              <select
                v-model="form.clientId"
                class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600"
              >
                <option disabled value="">— Sélectionner un client —</option>
                <option
                  v-for="c in clientsStore.clients"
                  :key="c.id"
                  :value="c.id"
                >
                  {{ c.firstName }} {{ c.lastName
                  }}<span v-if="c.companyName"> — {{ c.companyName }}</span>
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm text-gray-700 dark:text-gray-300 mb-1"
                >Valide jusqu'au</label
              >
              <input
                v-model="form.validUntil"
                type="date"
                class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>
          <!-- Adresse de chantier -->
          <div class="border rounded-md p-3 dark:border-gray-700 space-y-3">
            <div class="flex items-center justify-between">
              <label class="block text-sm text-gray-700 dark:text-gray-300"
                >Adresse de chantier</label
              >
              <label class="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  v-model="form.siteSameAsBilling"
                  class="rounded border-gray-300"
                />
                <span class="text-gray-600 dark:text-gray-300"
                  >Identique à l'adresse client</span
                >
              </label>
            </div>
            <div
              v-if="!form.siteSameAsBilling"
              class="grid grid-cols-1 md:grid-cols-2 gap-3"
            >
              <div>
                <label class="block text-sm mb-1">Adresse (ligne 1)</label>
                <input
                  v-model="form.siteAddressLine1"
                  class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label class="block text-sm mb-1">Adresse (ligne 2)</label>
                <input
                  v-model="form.siteAddressLine2"
                  class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label class="block text-sm mb-1">Code postal</label>
                <input
                  v-model="form.sitePostalCode"
                  class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label class="block text-sm mb-1">Ville</label>
                <input
                  v-model="form.siteCity"
                  class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm mb-1">Pays</label>
                <input
                  v-model="form.siteCountry"
                  class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>
          </div>
          <div>
            <label class="block text-sm text-gray-700 dark:text-gray-300 mb-1"
              >Description globale</label
            >
            <textarea
              v-model="form.description"
              class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600"
            ></textarea>
          </div>
        </div>

        <!-- Step 3: Sections -->
        <div v-if="currentStep === 3" class="space-y-4">
          <div class="flex items-center justify-between">
            <label class="block text-sm text-gray-700 dark:text-gray-300"
              >Sections</label
            >
            <button @click="addSection" class="text-sm text-green-600">
              + Ajouter une section
            </button>
          </div>
          <div
            v-for="(sec, sidx) in form.sections"
            :key="sidx"
            class="border rounded-md p-3 dark:border-gray-700"
          >
            <div class="grid grid-cols-12 gap-2 items-center mb-2">
              <input
                v-model="sec.title"
                placeholder="Titre de section (ex: Salon, Chambre 1)"
                class="col-span-5 px-2 py-1 rounded-md border dark:bg-gray-700 dark:border-gray-600"
              />
              <input
                v-model="sec.description"
                placeholder="Description de la demande client"
                class="col-span-6 px-2 py-1 rounded-md border dark:bg-gray-700 dark:border-gray-600"
              />
              <button
                @click="removeSection(sidx)"
                class="col-span-1 text-red-600"
              >
                ✕
              </button>
            </div>

            <div class="flex items-center gap-2 mb-2">
              <select
                v-model="selectedServiceIdPerSection[sidx]"
                class="flex-1 px-3 py-1 rounded-md border dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">— Ajouter depuis le catalogue —</option>
                <option v-for="s in services" :key="s.id" :value="s.id">
                  {{ s.name }} ({{ s.unit }}) —
                  {{ formatCurrency(s.price_ht) }} HT
                </option>
              </select>
              <button
                @click="addFromCatalogToSection(sidx)"
                :disabled="!selectedServiceIdPerSection[sidx]"
                class="text-sm px-3 py-1 rounded-md bg-green-600 text-white"
              >
                Ajouter
              </button>
            </div>

            <!-- En-têtes des colonnes -->
            <div
              class="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300 px-1 mt-1"
            >
              <div class="col-span-3">Description</div>
              <div class="col-span-2">Unité</div>
              <div class="col-span-1 text-right">Qté</div>
              <div class="col-span-2 text-right">PU HT</div>
              <div class="col-span-1 text-right">TVA %</div>
              <div class="col-span-1 text-right">Remise %</div>
              <div class="col-span-1 text-right">Maj. %</div>
              <div class="col-span-1 text-right">Total TTC</div>
            </div>

            <div
              class="grid grid-cols-12 gap-2 items-start"
              v-for="(it, idx) in sec.items"
              :key="idx"
            >
              <input
                v-model="it.description"
                placeholder="Description"
                class="col-span-3 px-2 py-1 rounded-md border dark:bg-gray-700 dark:border-gray-600"
              />
              <select
                v-model="it.unit"
                class="col-span-2 px-2 py-1 rounded-md border dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="m²">m²</option>
                <option value="unité">unité</option>
                <option value="forfait">forfait</option>
                <option value="ml">ml</option>
              </select>
              <input
                v-model.number="it.quantity"
                type="number"
                min="0.001"
                step="0.001"
                placeholder="Qté"
                class="col-span-1 px-2 py-1 rounded-md border dark:bg-gray-700 dark:border-gray-600 text-right"
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
              <div class="col-span-12 flex justify-end gap-2">
                <button
                  @click="saveItemToCatalog(it)"
                  :disabled="it._saving"
                  class="text-xs text-blue-700 disabled:text-blue-300"
                >
                  {{
                    it._saving
                      ? 'Enregistrement…'
                      : 'Enregistrer dans le catalogue'
                  }}
                </button>
                <button
                  @click="removeItem(sidx, idx)"
                  class="text-xs text-red-600"
                >
                  Supprimer la ligne
                </button>
              </div>
            </div>
            <button
              @click="addItemToSection(sidx)"
              class="text-sm text-green-600"
            >
              + Ajouter une ligne
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
        </div>

        <!-- Step 4: Preview -->
        <div v-if="currentStep === 4" class="space-y-4">
          <div class="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-md">
            <h4 class="font-semibold mb-2 text-gray-900 dark:text-white">
              Aperçu
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div class="text-gray-500 dark:text-gray-400">Client</div>
                <div class="text-gray-900 dark:text-white">
                  {{ previewClientName }}
                </div>
              </div>
              <div>
                <div class="text-gray-500 dark:text-gray-400">Titre</div>
                <div class="text-gray-900 dark:text-white">
                  {{ form.title }}
                </div>
              </div>
              <div>
                <div class="text-gray-500 dark:text-gray-400">Validité</div>
                <div class="text-gray-900 dark:text-white">
                  {{ form.validUntil ? formatDate(form.validUntil) : '—' }}
                </div>
              </div>
            </div>
            <div
              class="mt-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line"
            >
              {{ form.description }}
            </div>
          </div>
          <div
            v-for="(sec, sidx) in form.sections"
            :key="'pv-' + sidx"
            class="border rounded-md p-3 dark:border-gray-700"
          >
            <div class="font-semibold text-gray-900 dark:text-white">
              {{ sec.title }}
            </div>
            <div
              v-if="sec.description"
              class="text-sm text-gray-600 dark:text-gray-400 mb-2"
            >
              {{ sec.description }}
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full text-sm">
                <thead class="text-left text-gray-600 dark:text-gray-300">
                  <tr>
                    <th class="py-1 pr-2">Description</th>
                    <th class="py-1 pr-2 text-right">Qté</th>
                    <th class="py-1 pr-2 text-right">PU HT net</th>
                    <th class="py-1 pr-2 text-right">TVA</th>
                    <th class="py-1 pr-2 text-right">Total HT</th>
                    <th class="py-1 pr-2 text-right">Total TTC</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(it, idx) in sec.items"
                    :key="'pvi-' + idx"
                    class="border-t dark:border-gray-700"
                  >
                    <td class="py-1 pr-2">
                      {{ it.description
                      }}<span v-if="it.unit" class="text-gray-500">
                        ({{ it.unit }})</span
                      >
                    </td>
                    <td class="py-1 pr-2 text-right">
                      {{ Number(it.quantity || 0) }}
                    </td>
                    <td class="py-1 pr-2 text-right">
                      {{
                        formatCurrency(
                          Number(it.unitPriceHt || 0) *
                            (1 - Number(it.discountPercent || 0) / 100) *
                            (1 + Number(it.surchargePercent || 0) / 100)
                        )
                      }}
                    </td>
                    <td class="py-1 pr-2 text-right">
                      {{ Number(it.vatRate || 0) }}%
                    </td>
                    <td class="py-1 pr-2 text-right">
                      {{
                        formatCurrency(
                          Number(it.quantity || 0) *
                            Number(it.unitPriceHt || 0) *
                            (1 - Number(it.discountPercent || 0) / 100) *
                            (1 + Number(it.surchargePercent || 0) / 100)
                        )
                      }}
                    </td>
                    <td class="py-1 pr-2 text-right">
                      {{ formatCurrency(lineTotalTtc(it)) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
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
        </div>
      </div>
      <div
        class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-2"
      >
        <div
          class="text-xs text-gray-500 dark:text-gray-400"
          v-if="!simpleMode"
        >
          Étape {{ currentStep }} / 4
        </div>
        <div class="flex gap-2">
          <template v-if="simpleMode">
            <button
              @click="saveQuote"
              :disabled="quotesStore.loading"
              class="px-4 py-2 rounded-md bg-green-600 text-white"
            >
              Créer le devis
            </button>
            <button
              @click="closeCreateModal"
              class="px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            >
              Annuler
            </button>
          </template>
          <template v-else>
            <button
              v-if="currentStep > 1"
              @click="prevStep"
              class="px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            >
              Retour
            </button>
            <button
              v-if="currentStep < 3"
              @click="nextStep"
              :disabled="!canGoNext(currentStep)"
              class="px-4 py-2 rounded-md bg-blue-600 text-white"
            >
              Suivant
            </button>
            <button
              v-if="currentStep === 3"
              @click="goPreview"
              :disabled="!canGoNext(3)"
              class="px-4 py-2 rounded-md bg-indigo-600 text-white"
            >
              Terminer (Aperçu)
            </button>
            <button
              v-if="currentStep === 4"
              @click="saveQuote"
              :disabled="quotesStore.loading"
              class="px-4 py-2 rounded-md bg-green-600 text-white"
            >
              Créer le devis
            </button>
            <button
              @click="closeCreateModal"
              class="px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            >
              Annuler
            </button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import Layout from '@/components/Layout.vue'
import { useQuotesStore } from '@/stores/quotes'
import { useInvoicesStore } from '@/stores/invoices'
import { useClientsStore } from '@/stores/clients'
import { useCompanyStore } from '@/stores/company'
import api from '@/utils/api'
import { useToast } from 'vue-toastification'

const router = useRouter()
const quotesStore = useQuotesStore()
const invoicesStore = useInvoicesStore()
const clientsStore = useClientsStore()
const companyStore = useCompanyStore()
const toast = useToast()
// Par défaut: flux en étapes (Client → Détails → Sections)
const simpleMode = ref(false)

// Acompte
const showAdvanceModal = ref(false)
const selectedQuote = ref(null)
const advanceForm = ref({
  clientId: '',
  quoteId: '',
  title: '',
  advanceAmount: 0,
  totalAmount: 0,
  dueDate: '',
  notes: '',
  purchaseOrderNumber: '',
})

const searchTerm = ref('')
const statusFilter = ref('')
const services = ref([])
const selectedServiceIdPerSection = ref({})

const handleSearch = () => {
  quotesStore.fetchQuotes({ search: searchTerm.value, page: 1 })
}

const handleStatusFilter = () => {
  quotesStore.fetchQuotes({ status: statusFilter.value, page: 1 })
}

const showCreateModal = ref(false)
const form = ref({
  clientId: '',
  title: '',
  description: '',
  validUntil: '',
  depositPercent: 30,
  depositAmount: 0,
  sections: [defaultSection()],
  siteSameAsBilling: true,
  siteAddressLine1: '',
  siteAddressLine2: '',
  sitePostalCode: '',
  siteCity: '',
  siteCountry: '',
})
// Initialiser selectedServiceIdPerSection pour la première section
selectedServiceIdPerSection.value[0] = ''
const currentStep = ref(1)
const showCreateClient = ref(false)
const newClient = ref({
  firstName: '',
  lastName: '',
  companyName: '',
  email: '',
})

function defaultItem() {
  return {
    description: '',
    unit: 'm²',
    quantity: 1,
    unitPriceHt: 0,
    vatRate: 20,
    discountPercent: 0,
    surchargePercent: 0,
  }
}
function defaultSection() {
  // Pas de ligne par défaut; titre par défaut pour compat backend
  return { title: 'Section 1', description: '', items: [] }
}

const openCreateModal = () => {
  if (!form.value.validUntil) {
    form.value.validUntil = defaultValidityDate()
  }
  showCreateModal.value = true
}
const closeCreateModal = () => {
  showCreateModal.value = false
  currentStep.value = 1
  showCreateClient.value = false
}
const nextStep = () => {
  if (currentStep.value < 4) currentStep.value++
}
const prevStep = () => {
  if (currentStep.value > 1) currentStep.value--
}
const goPreview = () => {
  currentStep.value = 4
}
const toggleCreateClient = () => {
  showCreateClient.value = !showCreateClient.value
}

const canGoNext = (step) => {
  if (step === 1)
    return (
      !!form.value.clientId ||
      (newClient.value.firstName && newClient.value.lastName)
    )
  if (step === 2) return !!form.value.clientId && !!form.value.title
  if (step === 3)
    return (
      form.value.sections.length > 0 &&
      !form.value.sections.some((s) => !s.title || s.items.length === 0)
    )
  return true
}

const stepClass = (step) => {
  return step <= currentStep.value
    ? 'px-1.5 py-0.5 rounded bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100'
    : 'px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
}

const createClient = async () => {
  if (!newClient.value.firstName || !newClient.value.lastName) return
  try {
    // N'envoyer que les champs non vides
    const payload = {
      firstName: newClient.value.firstName.trim(),
      lastName: newClient.value.lastName.trim(),
    }
    if (newClient.value.companyName && newClient.value.companyName.trim())
      payload.companyName = newClient.value.companyName.trim()
    if (newClient.value.email && newClient.value.email.trim())
      payload.email = newClient.value.email.trim()

    const created = await clientsStore.createClient(payload)
    await clientsStore.fetchClients({ limit: 100 })
    form.value.clientId = created.id
    showCreateClient.value = false
  } catch (_) {
    /* toast handled in store */
  }
}
const addSection = () => {
  const newSectionIndex = form.value.sections.length
  form.value.sections.push(defaultSection())
  // Initialiser selectedServiceIdPerSection pour la nouvelle section
  selectedServiceIdPerSection.value[newSectionIndex] = ''
}
const removeSection = (sidx) => {
  form.value.sections.splice(sidx, 1)
}
const addItemToSection = (sidx) => {
  form.value.sections[sidx].items.push(defaultItem())
}
const removeItem = (sidx, idx) => {
  form.value.sections[sidx].items.splice(idx, 1)
}
const saveQuote = async () => {
  // Validation côté client avant envoi
  const errors = []
  if (!form.value.clientId) errors.push('Client requis')
  if (!form.value.title || form.value.title.trim().length < 2)
    errors.push('Titre requis (min. 2 caractères)')
  if (!Array.isArray(form.value.sections) || form.value.sections.length === 0)
    errors.push('Au moins une section est requise')
  else {
    form.value.sections.forEach((sec, si) => {
      if (!sec.title || sec.title.trim().length < 2)
        errors.push(`Section ${si + 1}: titre requis`)
      if (!Array.isArray(sec.items) || sec.items.length === 0)
        errors.push(`Section ${si + 1}: au moins une ligne`)
      else {
        sec.items.forEach((it, ii) => {
          if (!it.description || it.description.trim().length < 2)
            errors.push(
              `Section ${si + 1}, ligne ${ii + 1}: description requise`
            )
          if (!(Number(it.quantity) > 0))
            errors.push(`Section ${si + 1}, ligne ${ii + 1}: quantité > 0`)
          if (Number(it.unitPriceHt) < 0)
            errors.push(
              `Section ${si + 1}, ligne ${ii + 1}: PU HT doit être ≥ 0`
            )
          if (Number(it.vatRate) < 0 || Number(it.vatRate) > 100)
            errors.push(
              `Section ${si + 1}, ligne ${ii + 1}: TVA % entre 0 et 100`
            )
          if (
            it.discountPercent !== undefined &&
            (Number(it.discountPercent) < 0 || Number(it.discountPercent) > 100)
          )
            errors.push(
              `Section ${si + 1}, ligne ${ii + 1}: Remise % entre 0 et 100`
            )
          if (
            it.surchargePercent !== undefined &&
            (Number(it.surchargePercent) < 0 ||
              Number(it.surchargePercent) > 100)
          )
            errors.push(
              `Section ${si + 1}, ligne ${ii + 1}: Maj. % entre 0 et 100`
            )
        })
      }
    })
  }

  if (errors.length) {
    errors.forEach((e) => toast.error(e))
    return
  }

  try {
    // Adapter les clés pour l'API (markupPercent attendu, pas surchargePercent)
    const transformedSections = form.value.sections.map((sec) => ({
      title: sec.title,
      description: sec.description,
      items: (sec.items || []).map((it) => {
        const out = { ...it }
        if (
          out.surchargePercent !== undefined &&
          out.markupPercent === undefined
        ) {
          out.markupPercent = Number(out.surchargePercent)
        }
        delete out.surchargePercent
        return out
      }),
    }))

    const created = await quotesStore.createQuote({
      clientId: form.value.clientId,
      title: form.value.title.trim(),
      description: form.value.description || '',
      validUntil: form.value.validUntil || null,
      depositPercent: form.value.depositPercent || 0,
      depositAmount: form.value.depositAmount || 0,
      siteSameAsBilling: !!form.value.siteSameAsBilling,
      siteAddressLine1: form.value.siteAddressLine1 || '',
      siteAddressLine2: form.value.siteAddressLine2 || '',
      sitePostalCode: form.value.sitePostalCode || '',
      siteCity: form.value.siteCity || '',
      siteCountry: form.value.siteCountry || '',
      sections: transformedSections,
    })
    await quotesStore.fetchQuotes()
    closeCreateModal()
    toast.success('Devis créé avec succès')
    if (created?.id) router.push(`/quotes/${created.id}`)
  } catch (error) {
    // Les toasts d'erreur détaillés sont gérés par l'intercepteur API
  }
}

const addFromCatalogToSection = (sidx) => {
  console.log('addFromCatalogToSection called with sidx:', sidx)
  console.log(
    'selectedServiceIdPerSection.value:',
    selectedServiceIdPerSection.value
  )
  const selectedId = selectedServiceIdPerSection.value[sidx]
  console.log('selectedId:', selectedId)
  console.log('services.value:', services.value)
  const s = services.value.find((x) => x.id === selectedId)
  console.log('found service:', s)
  if (!s) {
    console.log('No service found, returning')
    return
  }
  const newItem = {
    description:
      s.description && s.description.trim()
        ? `${s.name} — ${s.description.trim()}`
        : s.name,
    unit: s.unit || 'unité',
    quantity: 1,
    unitPriceHt: Number(s.priceHt ?? 0),
    vatRate: Number(s.vatRate ?? 20),
    discountPercent: 0,
    surchargePercent: 0,
  }
  form.value.sections[sidx].items.push(newItem)
  selectedServiceIdPerSection.value[sidx] = ''
  // Item added
}

const lineTotalTtc = (it) => {
  const qty = Number(it.quantity || 0)
  const pu = Number(it.unitPriceHt || 0)
  const vat = Number(it.vatRate || 0) / 100
  const discount = Number(it.discountPercent || 0) / 100
  const surcharge = Number(it.surchargePercent || 0) / 100
  const puNet = pu * (1 - discount) * (1 + surcharge)
  const ht = qty * puNet
  const ttc = ht * (1 + vat)
  return ttc
}

const computeTotals = () => {
  const allItems = form.value.sections.flatMap((s) => s.items)
  const subtotalHt = allItems.reduce((sum, it) => {
    const qty = Number(it.quantity || 0)
    const pu = Number(it.unitPriceHt || 0)
    const discount = Number(it.discountPercent || 0) / 100
    const surcharge = Number(it.surchargePercent || 0) / 100
    const puNet = pu * (1 - discount) * (1 + surcharge)
    return sum + qty * puNet
  }, 0)
  const totalVat = allItems.reduce((sum, it) => {
    const qty = Number(it.quantity || 0)
    const pu = Number(it.unitPriceHt || 0)
    const vat = Number(it.vatRate || 0) / 100
    const discount = Number(it.discountPercent || 0) / 100
    const surcharge = Number(it.surchargePercent || 0) / 100
    const puNet = pu * (1 - discount) * (1 + surcharge)
    return sum + qty * puNet * vat
  }, 0)
  const totalTtc = subtotalHt + totalVat
  return { subtotalHt, totalVat, totalTtc }
}

const previewClientName = computed(() => {
  const id = form.value.clientId
  const c = clientsStore.clients.find((x) => x.id === id)
  if (!c) return '—'
  return `${c.firstName} ${c.lastName}${c.companyName ? ' — ' + c.companyName : ''}`
})

const selectedClient = computed(() => {
  const id = form.value.clientId
  const c = clientsStore.clients.find((x) => x.id === id)
  if (!c) return null
  // Normaliser clés pour affichage
  return {
    ...c,
    addressLine1: c.addressLine1 || c.address_line1,
    addressLine2: c.addressLine2 || c.address_line2,
    postalCode: c.postalCode || c.postal_code,
    vatNumber: c.vatNumber || c.vat_number,
    legalForm: c.legalForm || c.legal_form,
    rcsNumber: c.rcsNumber || c.rcs_number,
    apeCode: c.apeCode || c.ape_code,
    capitalSocial: c.capitalSocial || c.capital_social,
    isCompany: c.isCompany ?? c.is_company,
  }
})

const totals = ref({ subtotalHt: 0, totalVat: 0, totalTtc: 0 })

watch(
  () => form.value.sections,
  () => {
    totals.value = computeTotals()
  },
  { deep: true }
)

function defaultValidityDate() {
  const days = Number(companyStore.settings?.payment_terms || 30)
  const d = new Date()
  d.setDate(d.getDate() + (isNaN(days) ? 30 : days))
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

onMounted(async () => {
  quotesStore.fetchQuotes()
  try {
    await companyStore.fetchSettings()
  } catch (_) {}
  try {
    await clientsStore.fetchClients({ limit: 100 })
  } catch (_) {}
  try {
    const { data } = await api.get('/services')
    services.value = data.services || []
  } catch (_) {}
})

const viewQuote = (id) => {
  router.push(`/quotes/${id}`)
}

const editQuote = (id) => {
  router.push(`/quotes/${id}/edit`)
}

const deleteQuote = async (id, quoteNumber) => {
  try {
    const confirmed = confirm(
      `Êtes-vous sûr de vouloir supprimer le devis ${quoteNumber} ?`
    )
    if (!confirmed) return

    await quotesStore.deleteQuote(id)
    await quotesStore.fetchQuotes()
    toast.success('Devis supprimé avec succès')
  } catch (error) {
    console.error('Erreur suppression devis:', error)
    toast.error('Erreur lors de la suppression du devis')
  }
}

const downloadPdf = async (id, number) => {
  try {
    await quotesStore.downloadPdf(id, `devis-${number || id}.pdf`)
  } catch (error) {
    console.error('Erreur téléchargement PDF:', error)
  }
}

const sendQuoteByEmail = async (quote) => {
  try {
    // Vérifier que le client a un email
    const clientEmail = quote.clientEmail
    if (!clientEmail) {
      toast.error('Aucun email trouvé pour ce client')
      return
    }

    // Demander confirmation
    const confirmed = confirm(
      `Envoyer le devis ${quote.quoteNumber} par email à ${clientEmail} ?`
    )
    if (!confirmed) return

    // Appeler l'API pour envoyer l'email
    await quotesStore.sendByEmail(quote.id, {
      to: clientEmail,
      subject: `Devis ${quote.quoteNumber} - ${quote.clientCompany || quote.clientName || 'Client'}`,
      message: `Bonjour,\n\nVeuillez trouver ci-joint le devis ${quote.quoteNumber}.\n\nCordialement,\nL'équipe`,
    })
  } catch (error) {
    console.error('Erreur envoi email:', error)
    // L'erreur est déjà gérée par le store avec un toast
  }
}

const onChangeStatus = async (quote, evt) => {
  const newStatus = evt?.target?.value
  if (!newStatus || newStatus === quote.status) return
  try {
    await quotesStore.updateStatus(quote.id, newStatus)
  } catch (e) {
    // revert UI select by refetching list if error
    try {
      await quotesStore.fetchQuotes()
    } catch (_) {}
  }
}

const convertToInvoice = async (quoteId) => {
  try {
    const invoice = await invoicesStore.createFromQuote(quoteId)
    // Recharger la liste des devis pour mettre à jour le statut
    await quotesStore.fetchQuotes()
    // Optionnel : rediriger vers la facture créée
    router.push(`/invoices/${invoice.id}`)
  } catch (error) {
    console.error('Erreur conversion devis → facture:', error)
  }
}

function openAdvanceModal(quote) {
  selectedQuote.value = quote
  const today = new Date()
  const due = new Date(today)
  due.setDate(today.getDate() + 30)
  advanceForm.value = {
    clientId: quote.clientId,
    quoteId: quote.id,
    title: `Acompte – ${quote.title || quote.quoteNumber}`,
    advanceAmount: Number(((quote.totalTtc || 0) * 0.3).toFixed(2)),
    totalAmount: Number(quote.totalTtc || 0),
    dueDate: due.toISOString().slice(0, 10),
    notes: `Acompte pour le devis ${quote.quoteNumber}`,
    purchaseOrderNumber: '',
  }
  showAdvanceModal.value = true
}
function closeAdvanceModal() {
  showAdvanceModal.value = false
}
const canSubmitAdvance = computed(() => {
  const f = advanceForm.value
  return (
    !!f.clientId && !!f.title && f.advanceAmount > 0 && f.totalAmount > 0 && !!f.dueDate
  )
})
async function submitAdvance() {
  try {
    const created = await invoicesStore.createAdvanceInvoice({ ...advanceForm.value })
    closeAdvanceModal()
    await quotesStore.fetchQuotes()
    if (created?.id) router.push(`/invoices/${created.id}`)
  } catch (_) {}
}

const saveItemToCatalog = async (it) => {
  if (!it.description || it.description.trim().length < 2) {
    toast.error('Veuillez saisir une description (min. 2 caractères)')
    return
  }
  it._saving = true
  try {
    const payload = {
      name: it.description.trim(),
      description: it.description.trim(),
      unit: it.unit || 'unité',
      price_ht: Number(it.unitPriceHt || 0),
      price_ttc:
        Number(it.unitPriceHt || 0) * (1 + Number(it.vatRate || 0) / 100),
      vat_rate: Number(it.vatRate || 0),
      is_active: true,
    }
    const { data } = await api.post('/services', payload)
    // Ajouter au catalogue local si renvoyé
    if (data?.service) {
      services.value.unshift(data.service)
    }
    toast.success('Service enregistré dans le catalogue')
  } catch (e) {
    console.error('Erreur enregistrement service:', e)
    toast.error('Impossible d’enregistrer le service')
  } finally {
    it._saving = false
  }
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount || 0)
}

const getStatusBadgeClass = (status) => {
  const classes = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    accepted:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    converted:
      'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  }
  return (
    classes[status] ||
    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  )
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('fr-FR')
}

const getStatusLabel = (status) => {
  const labels = {
    draft: 'Brouillon',
    sent: 'Envoyé',
    accepted: 'Accepté',
    rejected: 'Refusé',
    converted: 'Facturé',
  }
  return labels[status] || status
}

const getStatusClass = (status) => {
  const classes = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200',
    sent: 'bg-blue-100 text-blue-800 dark:bg-blue-600 dark:text-blue-200',
    accepted:
      'bg-green-100 text-green-800 dark:bg-green-600 dark:text-green-200',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-600 dark:text-red-200',
    converted:
      'bg-purple-100 text-purple-800 dark:bg-purple-600 dark:text-purple-200',
  }
  return (
    classes[status] ||
    'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
  )
}

onMounted(() => {
  quotesStore.fetchQuotes()
})
</script>
