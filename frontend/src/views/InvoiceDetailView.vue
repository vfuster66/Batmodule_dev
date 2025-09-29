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
        <div class="flex items-center space-x-3 mr-4">
          <button
            @click="$router.back()"
            class="inline-flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-cobalt w-32 h-10"
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
            @click="editInvoice"
            :disabled="invoice.invoice_number && invoice.invoice_number !== ''"
            class="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 w-32 h-10 disabled:opacity-50 disabled:cursor-not-allowed"
            :title="editButtonTitle"
          >
            Modifier
          </button>
          <button
            @click="createCreditNote"
            class="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 w-32 h-10"
          >
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
                  invoice.client?.firstName + " " + invoice.client?.lastName
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
            <div class="space-y-6">
              <template v-if="hasSections">
                <div
                  v-for="sec in orderedSections"
                  :key="sec.id"
                  class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                >
                  <div
                    class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40"
                  >
                    <div
                      class="text-base font-semibold text-gray-900 dark:text-white"
                    >
                      {{ sec.title || "Section" }}
                    </div>
                    <p
                      v-if="sec.description"
                      class="mt-1 text-sm text-gray-600 dark:text-gray-300"
                    >
                      {{ sec.description }}
                    </p>
                  </div>
                  <div class="overflow-x-auto">
                    <table
                      class="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
                    >
                      <thead class="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th
                            class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-80"
                          >
                            Description
                          </th>
                          <th
                            class="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-20"
                          >
                            Qté
                          </th>
                          <th
                            class="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-24"
                          >
                            PU HT
                          </th>
                          <th
                            class="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-20"
                          >
                            TVA %
                          </th>
                          <th
                            class="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-28"
                          >
                            Total HT
                          </th>
                          <th
                            class="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-28"
                          >
                            Total TTC
                          </th>
                        </tr>
                      </thead>
                      <tbody
                        class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
                      >
                        <tr v-for="it in getSectionItems(sec.id)" :key="it.id">
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
                            {{ it.vatRate }}%
                          </td>
                          <td
                            class="px-4 py-2 text-sm text-right text-gray-700 dark:text-gray-300"
                          >
                            {{ formatCurrency(it.totalHt) }}
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

                <div
                  v-if="sectionlessItems.length"
                  class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                >
                  <div
                    class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 text-base font-semibold text-gray-900 dark:text-white"
                  >
                    Autres prestations
                  </div>
                  <div class="overflow-x-auto">
                    <table
                      class="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
                    >
                      <thead class="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th
                            class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-80"
                          >
                            Description
                          </th>
                          <th
                            class="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-20"
                          >
                            Qté
                          </th>
                          <th
                            class="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-24"
                          >
                            PU HT
                          </th>
                          <th
                            class="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-20"
                          >
                            TVA %
                          </th>
                          <th
                            class="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-28"
                          >
                            Total HT
                          </th>
                          <th
                            class="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-28"
                          >
                            Total TTC
                          </th>
                        </tr>
                      </thead>
                      <tbody
                        class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
                      >
                        <tr v-for="it in sectionlessItems" :key="it.id">
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
                            {{ it.vatRate }}%
                          </td>
                          <td
                            class="px-4 py-2 text-sm text-right text-gray-700 dark:text-gray-300"
                          >
                            {{ formatCurrency(it.totalHt) }}
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
              </template>
              <template v-else>
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
                          Total HT
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
                      <tr v-for="it in itemsSorted" :key="it.id">
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
                          {{ it.vatRate }}%
                        </td>
                        <td
                          class="px-4 py-2 text-sm text-right text-gray-700 dark:text-gray-300"
                        >
                          {{ formatCurrency(it.totalHt) }}
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
              </template>
            </div>
          </div>

          <!-- Section des totaux professionnelle -->
          <div
            class="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600"
          >
            <h3
              class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center"
            >
              <svg
                class="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                ></path>
              </svg>
              Récapitulatif financier
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Colonne gauche - Totaux de base -->
              <div class="space-y-3">
                <div
                  class="flex justify-between items-center py-2 px-3 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-600"
                >
                  <span
                    class="text-sm font-medium text-gray-600 dark:text-gray-400"
                    >Montant total HT</span
                  >
                  <span
                    class="text-sm font-semibold text-gray-900 dark:text-white"
                  >
                    {{
                      formatCurrency(invoice.originalTotals?.subtotalHt || 0)
                    }}
                  </span>
                </div>
                <div
                  class="flex justify-between items-center py-2 px-3 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-600"
                >
                  <span
                    class="text-sm font-medium text-gray-600 dark:text-gray-400"
                    >TVA</span
                  >
                  <span
                    class="text-sm font-semibold text-gray-900 dark:text-white"
                  >
                    {{ formatCurrency(invoice.originalTotals?.totalVat || 0) }}
                  </span>
                </div>
                <div
                  class="flex justify-between items-center py-3 px-4 bg-blue-50 dark:bg-blue-900/20 rounded-md border-2 border-blue-200 dark:border-blue-700"
                >
                  <span
                    class="text-base font-semibold text-blue-900 dark:text-blue-100"
                    >Total TTC</span
                  >
                  <span
                    class="text-lg font-bold text-blue-900 dark:text-blue-100"
                  >
                    {{ formatCurrency(invoice.originalTotals?.totalTtc || 0) }}
                  </span>
                </div>
              </div>

              <!-- Colonne droite - État de l'acompte -->
              <div class="space-y-3">
                <div
                  class="flex justify-between items-center py-2 px-3 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-600"
                >
                  <span
                    class="text-sm font-medium text-gray-600 dark:text-gray-400"
                    >Acompte HT</span
                  >
                  <span
                    class="text-sm font-semibold text-gray-900 dark:text-white"
                  >
                    {{ formatCurrency(invoice.subtotalHt || 0) }}
                  </span>
                </div>
                <div
                  class="flex justify-between items-center py-2 px-3 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-600"
                >
                  <span
                    class="text-sm font-medium text-gray-600 dark:text-gray-400"
                    >Acompte TTC</span
                  >
                  <span
                    class="text-sm font-semibold text-gray-900 dark:text-white"
                  >
                    {{ formatCurrency(invoice.totalTtc || 0) }}
                  </span>
                </div>
                <div
                  class="flex justify-between items-center py-3 px-4 rounded-md border-2"
                  :class="
                    remainingBalance > 0
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                      : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                  "
                >
                  <span
                    class="text-base font-semibold"
                    :class="
                      remainingBalance > 0
                        ? 'text-red-900 dark:text-red-100'
                        : 'text-green-900 dark:text-green-100'
                    "
                  >
                    Solde à régler
                  </span>
                  <span
                    class="text-lg font-bold"
                    :class="
                      remainingBalance > 0
                        ? 'text-red-900 dark:text-red-100'
                        : 'text-green-900 dark:text-green-100'
                    "
                  >
                    {{ formatCurrency(remainingBalance) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Boutons d'action -->
          <div class="flex items-center space-x-3">
            <!-- Actions principales -->
            <button
              @click="downloadPdf"
              class="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md text-white bg-gray-700 hover:bg-gray-800 w-40 h-20"
            >
              Télécharger PDF
            </button>
            <button
              @click="sendByEmail"
              class="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 w-40 h-20"
            >
              Envoyer par email
            </button>
            <button
              v-if="invoice.status !== 'paid'"
              @click="showAddPaymentModal = true"
              class="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 w-40 h-20"
            >
              Ajouter un paiement
            </button>

            <!-- Menu secondaire -->
            <div class="relative">
              <button
                @click="showSecondaryMenu = !showSecondaryMenu"
                class="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md text-white bg-gray-500 hover:bg-gray-600 w-12 h-20"
                title="Plus d'actions"
              >
                ⋯
              </button>

              <!-- Menu déroulant -->
              <div
                v-if="showSecondaryMenu"
                class="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700"
              >
                <div class="py-1">
                  <button
                    v-if="canCreateFinal"
                    @click="
                      openFinalModal();
                      showSecondaryMenu = false;
                    "
                    class="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Créer facture de solde
                  </button>
                  <button
                    @click="
                      archive();
                      showSecondaryMenu = false;
                    "
                    class="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Archiver
                  </button>
                  <button
                    @click="
                      verify();
                      showSecondaryMenu = false;
                    "
                    class="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Vérifier l'intégrité
                  </button>
                  <button
                    @click="
                      exportPaymentsCsv();
                      showSecondaryMenu = false;
                    "
                    class="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Exporter paiements (CSV)
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Historique des actions -->
          <div class="mt-6">
            <h3
              class="text-lg font-semibold text-gray-900 dark:text-white mb-4"
            >
              Historique des actions
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
                      Date
                    </th>
                    <th
                      class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                    >
                      Action
                    </th>
                    <th
                      class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                    >
                      Détails
                    </th>
                    <th
                      class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                    >
                      Utilisateur
                    </th>
                    <th
                      class="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                    >
                      Montant
                    </th>
                  </tr>
                </thead>
                <tbody
                  class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
                >
                  <template
                    v-for="entry in historyEntries"
                    :key="`${entry.type}-${entry.sortKey}`"
                  >
                    <!-- Paiement -->
                    <tr
                      v-if="entry.type === 'payment'"
                      class="bg-green-50 dark:bg-green-900/20"
                    >
                      <td class="px-4 py-2 text-sm">
                        {{ formatDate(entry.date) }}
                      </td>
                      <td
                        class="px-4 py-2 text-sm font-medium text-green-700 dark:text-green-300"
                      >
                        💰 Paiement
                      </td>
                      <td class="px-4 py-2 text-sm">
                        <span class="capitalize">{{
                          entry.data.paymentMethod
                        }}</span>
                        <span v-if="entry.data.reference" class="text-gray-500">
                          - {{ entry.data.reference }}</span
                        >
                        <span
                          v-if="entry.data.notes"
                          class="block text-xs text-gray-500 mt-1"
                          >{{ entry.data.notes }}</span
                        >
                      </td>
                      <td class="px-4 py-2 text-sm text-gray-500">
                        {{ entry.data.createdBy || "Système" }}
                      </td>
                      <td
                        class="px-4 py-2 text-sm text-right font-medium text-green-700 dark:text-green-300"
                      >
                        +{{ formatCurrency(entry.data.amount) }}
                      </td>
                    </tr>

                    <!-- Création de facture -->
                    <tr
                      v-else-if="entry.type === 'creation'"
                      class="bg-blue-50 dark:bg-blue-900/20"
                    >
                      <td class="px-4 py-2 text-sm">
                        {{ formatDate(entry.date) }}
                      </td>
                      <td
                        class="px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300"
                      >
                        📄 Facture créée
                      </td>
                      <td class="px-4 py-2 text-sm">
                        {{
                          entry.data.invoice_type === "acompte"
                            ? "Facture d'acompte"
                            : entry.data.invoice_type === "solde"
                              ? "Facture de solde"
                              : "Facture standard"
                        }}
                      </td>
                      <td class="px-4 py-2 text-sm text-gray-500">
                        {{ entry.data.createdBy || "Utilisateur" }}
                      </td>
                      <td class="px-4 py-2 text-sm text-right">
                        {{ formatCurrency(entry.data.totalTtc) }}
                      </td>
                    </tr>

                    <!-- Email envoyé -->
                    <tr
                      v-else-if="entry.type === 'email'"
                      class="bg-orange-50 dark:bg-orange-900/20"
                    >
                      <td class="px-4 py-2 text-sm">
                        {{ formatDate(entry.date) }}
                      </td>
                      <td
                        class="px-4 py-2 text-sm font-medium text-orange-700 dark:text-orange-300"
                      >
                        📧 Email envoyé
                      </td>
                      <td class="px-4 py-2 text-sm">
                        {{ entry.data.subject || "Facture envoyée par email" }}
                      </td>
                      <td class="px-4 py-2 text-sm text-gray-500">Système</td>
                      <td class="px-4 py-2 text-sm text-right">—</td>
                    </tr>

                    <!-- Modification -->
                    <tr
                      v-else-if="entry.type === 'modification'"
                      class="bg-yellow-50 dark:bg-yellow-900/20"
                    >
                      <td class="px-4 py-2 text-sm">
                        {{ formatDate(entry.date) }}
                      </td>
                      <td
                        class="px-4 py-2 text-sm font-medium text-yellow-700 dark:text-yellow-300"
                      >
                        ✏️ Modifiée
                      </td>
                      <td class="px-4 py-2 text-sm">Dernière modification</td>
                      <td class="px-4 py-2 text-sm text-gray-500">
                        {{ entry.data.updatedBy || "Utilisateur" }}
                      </td>
                      <td class="px-4 py-2 text-sm text-right">—</td>
                    </tr>
                  </template>

                  <!-- Message si aucun historique -->
                  <tr
                    v-if="historyEntries.length === 0"
                    class="bg-gray-50 dark:bg-gray-800"
                  >
                    <td
                      colspan="5"
                      class="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      Aucun historique d'actions disponible.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Résultat vérification -->
          <div
            v-if="lastVerification"
            class="mt-4 p-3 rounded-md bg-gray-50 dark:bg-gray-700/40"
          >
            <div class="text-sm text-gray-700 dark:text-gray-200">
              <strong>Vérification:</strong>
              <span
                v-if="lastVerification.verification?.valid"
                class="text-green-600"
                >OK</span
              >
              <span v-else class="text-red-600">Non valide</span>
            </div>
            <pre
              class="mt-2 text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap"
              >{{
                JSON.stringify(
                  lastVerification.verification || lastVerification,
                  null,
                  2,
                )
              }}</pre
            >
          </div>
        </div>
      </div>
    </div>
  </Layout>
  <!-- Modal Facture de solde -->
  <div
    v-if="showFinalModal"
    class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
  >
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
      <div
        class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between"
      >
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Créer la facture de solde
        </h3>
        <button
          @click="closeFinalModal"
          class="text-gray-500 hover:text-gray-700 dark:text-gray-300"
        >
          ✕
        </button>
      </div>
      <div class="p-6 space-y-4">
        <div>
          <label class="block text-sm text-gray-700 dark:text-gray-300 mb-1"
            >Titre</label
          >
          <input
            v-model="finalForm.title"
            type="text"
            class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        <div>
          <label class="block text-sm text-gray-700 dark:text-gray-300 mb-1"
            >Échéance</label
          >
          <input
            v-model="finalForm.dueDate"
            type="date"
            class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-300">
          Montant total du devis:
          <strong>{{ formatCurrency(quoteTotalTtc) }}</strong
          ><br />
          Acompte: <strong>{{ formatCurrency(advanceAmount) }}</strong
          ><br />
          Solde calculé:
          <strong>{{
            formatCurrency(Math.max(quoteTotalTtc - advanceAmount, 0))
          }}</strong>
        </div>
      </div>
      <div
        class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2"
      >
        <button
          @click="closeFinalModal"
          class="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
        >
          Annuler
        </button>
        <button
          @click="submitFinal"
          :disabled="!canSubmitFinal"
          class="px-4 py-2 rounded-md bg-yellow-600 text-white disabled:opacity-50"
        >
          Créer
        </button>
      </div>
    </div>
  </div>
  <!-- Modal Paiement -->
  <div
    v-if="showPaymentModal"
    class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
  >
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
      <div
        class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between"
      >
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Ajouter un paiement
        </h3>
        <button
          @click="closePaymentModal"
          class="text-gray-500 hover:text-gray-700 dark:text-gray-300"
        >
          ✕
        </button>
      </div>
      <div class="p-6 space-y-4">
        <div>
          <label class="block text-sm text-gray-700 dark:text-gray-300 mb-1"
            >Montant (€)</label
          >
          <input
            v-model.number="paymentForm.amount"
            type="number"
            min="0.01"
            step="0.01"
            class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600"
          />
          <p class="text-xs text-gray-500 mt-1">
            Reste à payer: {{ formatCurrency(remainingAmount) }}
          </p>
        </div>
        <div>
          <label class="block text-sm text-gray-700 dark:text-gray-300 mb-1"
            >Méthode</label
          >
          <select
            v-model="paymentForm.paymentMethod"
            class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="cash">Espèces</option>
            <option value="check">Chèque</option>
            <option value="transfer">Virement</option>
            <option value="card">Carte</option>
          </select>
        </div>
        <div>
          <label class="block text-sm text-gray-700 dark:text-gray-300 mb-1"
            >Date</label
          >
          <input
            v-model="paymentForm.paymentDate"
            type="date"
            class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        <div>
          <label class="block text-sm text-gray-700 dark:text-gray-300 mb-1"
            >Référence (optionnel)</label
          >
          <input
            v-model="paymentForm.reference"
            type="text"
            class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        <div>
          <label class="block text-sm text-gray-700 dark:text-gray-300 mb-1"
            >Notes (optionnel)</label
          >
          <textarea
            v-model="paymentForm.notes"
            rows="2"
            class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600"
          ></textarea>
        </div>
      </div>
      <div
        class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2"
      >
        <button
          @click="closePaymentModal"
          class="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
        >
          Annuler
        </button>
        <button
          @click="submitPayment"
          :disabled="!canSubmitPayment"
          class="px-4 py-2 rounded-md bg-green-600 text-white disabled:opacity-50"
        >
          Enregistrer
        </button>
      </div>
    </div>

    <!-- Modal d'ajout de paiement -->
    <div
      v-if="showAddPaymentModal"
      class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md"
      >
        <div
          class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between"
        >
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Ajouter un paiement
          </h3>
          <button
            @click="showAddPaymentModal = false"
            class="text-gray-500 hover:text-gray-700 dark:text-gray-300"
          >
            ✕
          </button>
        </div>

        <form @submit.prevent="addPayment" class="p-6 space-y-4">
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Montant *
            </label>
            <input
              v-model="paymentForm.amount"
              type="number"
              step="0.01"
              min="0.01"
              :max="remainingAmount"
              required
              class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600"
              placeholder="0.00"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Reste à payer : {{ formatCurrency(remainingAmount) }}
            </p>
          </div>

          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Date de paiement *
            </label>
            <input
              v-model="paymentForm.paymentDate"
              type="date"
              required
              class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Méthode de paiement *
            </label>
            <select
              v-model="paymentForm.paymentMethod"
              required
              class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="">-- Sélectionner --</option>
              <option value="cash">Espèces</option>
              <option value="check">Chèque</option>
              <option value="transfer">Virement</option>
              <option value="card">Carte bancaire</option>
            </select>
          </div>

          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Référence
            </label>
            <input
              v-model="paymentForm.reference"
              type="text"
              class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600"
              placeholder="N° de chèque, référence virement..."
            />
          </div>

          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Notes
            </label>
            <textarea
              v-model="paymentForm.notes"
              rows="3"
              class="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600"
              placeholder="Informations complémentaires..."
            ></textarea>
          </div>

          <div class="flex justify-end gap-3 pt-4">
            <button
              type="button"
              @click="showAddPaymentModal = false"
              class="px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Annuler
            </button>
            <button
              type="submit"
              :disabled="isAddingPayment"
              class="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            >
              {{ isAddingPayment ? "Ajout..." : "Ajouter le paiement" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import Layout from "@/components/Layout.vue";
import api from "@/utils/api";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { ref, onMounted, computed } from "vue";
import { useInvoicesStore } from "@/stores/invoices";

const route = useRoute();
const router = useRouter();
const toast = useToast();
const store = useInvoicesStore();
const invoice = ref(null);
const showPaymentModal = ref(false);
const showAddPaymentModal = ref(false);
const isAddingPayment = ref(false);
const paymentForm = ref({
  amount: 0,
  paymentMethod: "transfer",
  paymentDate: "",
  reference: "",
  notes: "",
});
const lastVerification = ref(null);
const showFinalModal = ref(false);
const finalForm = ref({ title: "", dueDate: "" });
const showSecondaryMenu = ref(false);
const related = ref(null);
const quoteTotalTtc = ref(0);
const advanceAmount = ref(0);
const canCreateFinal = computed(() => {
  if (!related.value) return false;
  return !!related.value.advance && !related.value.final;
});

const toAmount = (value) => {
  const numeric =
    typeof value === "string" ? Number(value) : Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
};

const itemsSorted = computed(() => {
  const items = invoice.value?.items || [];
  return [...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
});

const itemsBySection = computed(() => {
  const buckets = {};
  for (const item of itemsSorted.value) {
    if (!item.sectionId) continue;
    const key = item.sectionId;
    if (!buckets[key]) buckets[key] = [];
    buckets[key].push(item);
  }
  return buckets;
});

const sectionlessItems = computed(() =>
  itemsSorted.value.filter((item) => !item.sectionId),
);

const orderedSections = computed(() => {
  const sections = invoice.value?.sections || [];
  return [...sections].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
});

const hasSections = computed(() => orderedSections.value.length > 0);

function getSectionItems(sectionId) {
  return itemsBySection.value[sectionId] || [];
}

const createCreditNote = async () => {
  try {
    const id = route.params.id;
    const { data } = await api.post(`/credits/from-invoice/${id}`);
    toast.success("Avoir créé: " + data.credit.creditNumber);
  } catch (e) {
    toast.error("Erreur lors de la création de l'avoir");
  }
};

const fetch = async () => {
  const id = route.params.id;
  const data = await store.fetchInvoice(id);
  invoice.value = data;
  quoteTotalTtc.value = toAmount(
    data?.quoteTotalTtc ??
      data?.originalTotals?.totalTtc ??
      quoteTotalTtc.value,
  );
  advanceAmount.value = toAmount(data?.totalTtc);
};

const downloadPdf = async () => {
  await store.downloadPdf(route.params.id);
};

const addPayment = async () => {
  if (!invoice.value) return;

  isAddingPayment.value = true;
  try {
    const { data } = await api.post(`/invoices/${invoice.value.id}/payments`, {
      amount: parseFloat(paymentForm.value.amount),
      paymentMethod: paymentForm.value.paymentMethod,
      paymentDate: paymentForm.value.paymentDate,
      reference: paymentForm.value.reference || null,
      notes: paymentForm.value.notes || null,
    });

    toast.success("Paiement ajouté avec succès");

    // Réinitialiser le formulaire
    paymentForm.value = {
      amount: 0,
      paymentMethod: "transfer",
      paymentDate: "",
      reference: "",
      notes: "",
    };

    showAddPaymentModal.value = false;

    // Recharger les données de la facture
    await fetch();
  } catch (error) {
    console.error("Erreur lors de l'ajout du paiement:", error);
    toast.error("Erreur lors de l'ajout du paiement");
  } finally {
    isAddingPayment.value = false;
  }
};

const remainingAmount = computed(() => {
  if (!invoice.value) return 0;
  return (
    Number(invoice.value.totalTtc || 0) - Number(invoice.value.paidAmount || 0)
  );
});

const remainingBalance = computed(() => {
  if (!invoice.value) return 0;
  const originalTotal = Number(invoice.value.originalTotals?.totalTtc || 0);
  const advanceTotal = Number(invoice.value.totalTtc || 0);
  return Math.max(originalTotal - advanceTotal, 0);
});

const historyEntries = computed(() => {
  if (!invoice.value) return [];

  const entries = [];

  // Ajouter les paiements
  if (invoice.value.payments && invoice.value.payments.length > 0) {
    invoice.value.payments.forEach((payment) => {
      entries.push({
        date: new Date(payment.paymentDate || payment.createdAt),
        type: "payment",
        data: payment,
        sortKey: new Date(payment.paymentDate || payment.createdAt).getTime(),
      });
    });
  }

  // Ajouter la création de facture
  if (invoice.value.createdAt) {
    entries.push({
      date: new Date(invoice.value.createdAt),
      type: "creation",
      data: invoice.value,
      sortKey: new Date(invoice.value.createdAt).getTime(),
    });
  }

  // Ajouter les emails envoyés
  if (invoice.value.lastEmailSent) {
    entries.push({
      date: new Date(invoice.value.lastEmailSent),
      type: "email",
      data: { subject: invoice.value.emailSubject },
      sortKey: new Date(invoice.value.lastEmailSent).getTime(),
    });
  }

  // Ajouter les modifications
  if (
    invoice.value.updatedAt &&
    invoice.value.updatedAt !== invoice.value.createdAt
  ) {
    entries.push({
      date: new Date(invoice.value.updatedAt),
      type: "modification",
      data: invoice.value,
      sortKey: new Date(invoice.value.updatedAt).getTime(),
    });
  }

  // Trier par date décroissante (plus récent en premier)
  return entries.sort((a, b) => b.sortKey - a.sortKey);
});

function openPaymentModal() {
  showPaymentModal.value = true;
  // Pré-remplir: montant restant et date du jour
  paymentForm.value.amount = Number(remainingAmount.value.toFixed(2));
  paymentForm.value.paymentDate = new Date().toISOString().slice(0, 10);
}
function closePaymentModal() {
  showPaymentModal.value = false;
}
const canSubmitPayment = computed(() => {
  const a = Number(paymentForm.value.amount);
  return a > 0 && paymentForm.value.paymentDate;
});
async function submitPayment() {
  try {
    await store.addPayment(route.params.id, { ...paymentForm.value });
    await fetch();
    closePaymentModal();
    toast.success("Paiement ajouté");
  } catch (e) {
    // handled in store
  }
}

const markPaid = async () => {
  // Ajoute un paiement couvrant le solde restant
  const amt = Number(remainingAmount.value.toFixed(2));
  if (amt <= 0) return;
  await store.addPayment(route.params.id, {
    amount: amt,
    paymentMethod: "transfer",
    paymentDate: new Date().toISOString().slice(0, 10),
    reference: "Solde",
  });
  await fetch();
  toast.success("Facture marquée comme payée");
};

async function archive() {
  try {
    const data = await store.archiveInvoice(route.params.id);
    toast.success("Facture archivée");
  } catch (_) {}
}

async function verify() {
  try {
    const data = await store.verifyInvoice(route.params.id);
    lastVerification.value = data;
  } catch (_) {}
}

async function sendByEmail() {
  try {
    await store.sendByEmail(route.params.id);
    toast.success("Facture envoyée par email");
  } catch (error) {
    console.error("Erreur envoi email:", error);
    toast.error("Erreur lors de l'envoi de l'email");
  }
}

function exportPaymentsCsv() {
  const rows = invoice.value?.payments || [];
  const header = ["Date", "Méthode", "Référence", "Montant"];
  const lines = [header.join(",")];
  for (const p of rows) {
    const d = p.paymentDate || p.createdAt || "";
    const method = p.paymentMethod || "";
    const ref = (p.reference || "").replaceAll('"', '""');
    const amt = Number(p.amount || 0).toFixed(2);
    lines.push([d, method, `"${ref}"`, amt].join(","));
  }
  const blob = new Blob(["\ufeff" + lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = `paiements-${invoice.value?.invoiceNumber || route.params.id}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const formatCurrency = (amount) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    amount || 0,
  );
const formatDate = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : "");

onMounted(() => {
  // Initialiser la date par défaut pour les paiements
  paymentForm.value.paymentDate = new Date().toISOString().slice(0, 10);
  fetch();
});

// Charger factures liées et totaux pour permettre la facture de solde
onMounted(async () => {
  try {
    const { data } = await api.get(`/invoices/${route.params.id}/related`);
    related.value = data;
  } catch (_) {}
  try {
    const qid = related.value?.advance?.quote_id;
    if (qid) {
      const { data } = await api.get(`/quotes/${qid}`);
      quoteTotalTtc.value = Number(data?.quote?.totalTtc || 0);
    }
  } catch (_) {}
});

const editInvoice = () => {
  // Vérifier si la facture a déjà un numéro
  if (invoice.value.invoice_number && invoice.value.invoice_number !== "") {
    toast.error(
      "Cette facture ne peut plus être modifiée car elle a déjà un numéro. Pour toute correction, veuillez créer un avoir.",
    );
    return;
  }
  router.push(`/invoices/${route.params.id}/edit`);
};

function openFinalModal() {
  finalForm.value.title = `Solde – ${invoice.value?.title || invoice.value?.invoiceNumber}`;
  finalForm.value.dueDate = new Date(Date.now() + 30 * 86400000)
    .toISOString()
    .slice(0, 10);
  showFinalModal.value = true;
}
function closeFinalModal() {
  showFinalModal.value = false;
}
const canSubmitFinal = computed(
  () =>
    !!finalForm.value.title &&
    !!finalForm.value.dueDate &&
    quoteTotalTtc.value > 0,
);

const editButtonTitle = computed(() => {
  if (invoice.value?.invoice_number && invoice.value.invoice_number !== "") {
    return 'Cette facture ne peut plus être modifiée car elle a déjà un numéro. Utilisez "Créer un avoir" pour toute correction.';
  }
  return "";
});
async function submitFinal() {
  try {
    const quoteId = related.value?.advance?.quote_id;
    let items = [];
    if (quoteId) {
      const { data } = await api.get(`/quotes/${quoteId}`);
      const qi = data?.quote?.items || [];
      items = qi.map((it) => ({
        description: it.description,
        quantity: it.quantity,
        unitPriceHt: it.unitPriceHt,
        vatRate: it.vatRate,
      }));
    }
    const payload = {
      clientId: invoice.value.client?.id || invoice.value.clientId,
      quoteId: quoteId || undefined,
      parentInvoiceId: invoice.value.id,
      title: finalForm.value.title,
      description: `Solde basé sur ${invoice.value.invoiceNumber}`,
      items,
      dueDate: finalForm.value.dueDate,
      notes: "",
    };
    const res = await store.createFinalInvoice(payload);
    closeFinalModal();
    if (res?.invoice?.id) {
      window.location.href = `/invoices/${res.invoice.id}`;
    }
  } catch (_) {}
}
</script>
