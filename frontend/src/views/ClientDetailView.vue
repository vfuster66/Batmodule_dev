<template>
  <Layout>
    <div class="space-y-6">
      <!-- En-tête -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{
              client
                ? `${client.firstName} ${client.lastName}`
                : "Détail du client"
            }}
          </h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{ client?.companyName || "Informations détaillées du client" }}
          </p>
        </div>
        <div class="flex space-x-3">
          <button
            @click="editClient"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
            @click="$router.back()"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
        </div>
      </div>

      <!-- Contenu -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-flex items-center">
          <svg
            class="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Chargement des informations...
        </div>
      </div>

      <div v-else-if="client" class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- Informations principales -->
        <div class="lg:col-span-2">
          <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <h3
                class="text-lg font-medium text-gray-900 dark:text-white mb-4"
              >
                Informations générales
              </h3>

              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <!-- Type de client -->
                <div class="sm:col-span-2">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 mr-3">
                      <div
                        v-if="client.isCompany"
                        class="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center"
                      >
                        <svg
                          class="h-5 w-5 text-blue-600 dark:text-blue-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                      </div>
                      <div
                        v-else
                        class="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center"
                      >
                        <svg
                          class="h-5 w-5 text-green-600 dark:text-green-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <p
                        class="text-sm font-medium text-gray-900 dark:text-white"
                      >
                        {{ client.isCompany ? "Entreprise" : "Particulier" }}
                      </p>
                      <p
                        v-if="client.companyName"
                        class="text-sm text-gray-500 dark:text-gray-400"
                      >
                        {{ client.companyName }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Contact -->
                <div v-if="client.email" class="flex items-center">
                  <svg
                    class="h-5 w-5 text-gray-400 mr-3"
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
                  <div>
                    <p
                      class="text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Email
                    </p>
                    <a
                      :href="`mailto:${client.email}`"
                      class="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {{ client.email }}
                    </a>
                  </div>
                </div>

                <div v-if="client.phone" class="flex items-center">
                  <svg
                    class="h-5 w-5 text-gray-400 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <div>
                    <p
                      class="text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Téléphone
                    </p>
                    <a
                      :href="`tel:${client.phone}`"
                      class="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {{ client.phone }}
                    </a>
                  </div>
                </div>

                <!-- Adresse -->
                <div
                  v-if="client.addressLine1 || client.city"
                  class="sm:col-span-2"
                >
                  <div class="flex items-start">
                    <svg
                      class="h-5 w-5 text-gray-400 mr-3 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <div>
                      <p
                        class="text-sm font-medium text-gray-900 dark:text-white"
                      >
                        Adresse
                      </p>
                      <div class="text-sm text-gray-500 dark:text-gray-400">
                        <p v-if="client.addressLine1">
                          {{ client.addressLine1 }}
                        </p>
                        <p v-if="client.addressLine2">
                          {{ client.addressLine2 }}
                        </p>
                        <p v-if="client.postalCode || client.city">
                          {{ client.postalCode }} {{ client.city }}
                        </p>
                        <p v-if="client.country">{{ client.country }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Informations légales (si entreprise) -->
          <div
            v-if="
              client.isCompany &&
              (client.siret || client.vatNumber || client.legalForm)
            "
            class="mt-6"
          >
            <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div class="px-4 py-5 sm:p-6">
                <h3
                  class="text-lg font-medium text-gray-900 dark:text-white mb-4"
                >
                  Informations légales
                </h3>

                <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div v-if="client.siret">
                    <p
                      class="text-sm font-medium text-gray-900 dark:text-white"
                    >
                      SIRET
                    </p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      {{ client.siret }}
                    </p>
                  </div>

                  <div v-if="client.vatNumber">
                    <p
                      class="text-sm font-medium text-gray-900 dark:text-white"
                    >
                      N° TVA
                    </p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      {{ client.vatNumber }}
                    </p>
                  </div>

                  <div v-if="client.legalForm">
                    <p
                      class="text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Forme juridique
                    </p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      {{ client.legalForm }}
                    </p>
                  </div>

                  <div v-if="client.rcsNumber">
                    <p
                      class="text-sm font-medium text-gray-900 dark:text-white"
                    >
                      RCS
                    </p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      {{ client.rcsNumber }}
                    </p>
                  </div>

                  <div v-if="client.apeCode">
                    <p
                      class="text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Code APE/NAF
                    </p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      {{ client.apeCode }}
                    </p>
                  </div>

                  <div v-if="client.capitalSocial">
                    <p
                      class="text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Capital social
                    </p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      {{ formatCurrency(client.capitalSocial) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div v-if="client.notes" class="mt-6">
            <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div class="px-4 py-5 sm:p-6">
                <h3
                  class="text-lg font-medium text-gray-900 dark:text-white mb-4"
                >
                  Notes
                </h3>
                <p
                  class="text-sm text-gray-500 dark:text-gray-400 whitespace-pre-wrap"
                >
                  {{ client.notes }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Statistiques -->
          <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <h3
                class="text-lg font-medium text-gray-900 dark:text-white mb-4"
              >
                Statistiques
              </h3>

              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center">
                    <svg
                      class="h-5 w-5 text-blue-600 mr-3"
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
                    <span
                      class="text-sm font-medium text-gray-900 dark:text-white"
                      >Devis</span
                    >
                  </div>
                  <span class="text-sm text-gray-500 dark:text-gray-400">{{
                    client.quotesCount || 0
                  }}</span>
                </div>

                <div class="flex items-center justify-between">
                  <div class="flex items-center">
                    <svg
                      class="h-5 w-5 text-green-600 mr-3"
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
                    <span
                      class="text-sm font-medium text-gray-900 dark:text-white"
                      >Factures</span
                    >
                  </div>
                  <span class="text-sm text-gray-500 dark:text-gray-400">{{
                    client.invoicesCount || 0
                  }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions rapides -->
          <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <h3
                class="text-lg font-medium text-gray-900 dark:text-white mb-4"
              >
                Actions rapides
              </h3>

              <div class="space-y-3">
                <button
                  @click="createQuote"
                  class="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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

                <button
                  @click="createInvoice"
                  class="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                      d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  Nouvelle facture
                </button>
              </div>
            </div>
          </div>

          <!-- Informations système -->
          <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <h3
                class="text-lg font-medium text-gray-900 dark:text-white mb-4"
              >
                Informations système
              </h3>

              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-gray-400">Créé le</span>
                  <span class="text-gray-900 dark:text-white">{{
                    formatDate(client.createdAt)
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-gray-400"
                    >Modifié le</span
                  >
                  <span class="text-gray-900 dark:text-white">{{
                    formatDate(client.updatedAt)
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-12">
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
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
          />
        </svg>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Client non trouvé
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mb-6">
          Le client demandé n'existe pas ou vous n'avez pas les droits pour le
          consulter.
        </p>
        <router-link
          to="/clients"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Retour aux clients
        </router-link>
      </div>
    </div>

    <!-- Modal d'édition -->
    <ClientModal
      :show="showEditModal"
      :client="editingClient"
      @close="closeEditModal"
      @saved="handleClientUpdated"
    />
  </Layout>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useClientsStore } from "@/stores/clients";
import { useToast } from "vue-toastification";
import Layout from "@/components/Layout.vue";
import ClientModal from "@/components/ClientModal.vue";

const route = useRoute();
const router = useRouter();
const clientsStore = useClientsStore();
const toast = useToast();

// État local
const client = ref(null);
const loading = ref(true);
const showEditModal = ref(false);
const editingClient = ref(null);

// Charger les données du client
const loadClient = async () => {
  try {
    loading.value = true;
    const clientId = route.params.id;
    const response = await clientsStore.getClient(clientId);
    client.value = response.client;
  } catch (error) {
    console.error("Erreur lors du chargement du client:", error);
    toast.error("Erreur lors du chargement des informations du client");
  } finally {
    loading.value = false;
  }
};

// Actions
const editClient = () => {
  editingClient.value = { ...client.value };
  showEditModal.value = true;
};

const closeEditModal = () => {
  showEditModal.value = false;
  editingClient.value = null;
};

const handleClientUpdated = async () => {
  closeEditModal();
  await loadClient(); // Recharger les données
  toast.success("Client mis à jour avec succès");
};

const createQuote = () => {
  router.push(`/quotes/new?clientId=${client.value.id}`);
};

const createInvoice = () => {
  router.push(`/invoices/new?clientId=${client.value.id}`);
};

// Utilitaires
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount || 0);
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Initialisation
onMounted(() => {
  loadClient();
});
</script>
