<template>
  <Layout>
    <div class="space-y-6">
      <!-- En-tête -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Conformité RGPD
          </h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gestion des données personnelles et conformité
          </p>
        </div>
      </div>

      <!-- Indicateurs de conformité -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
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
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                Conformité
              </p>
              <p class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ complianceScore }}%
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
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
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                Données stockées
              </p>
              <p class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ dataSummary.totalRecords }}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
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
                    d="M8 7V3a4 4 0 118 0v4m-4 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                  />
                </svg>
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                Factures payées
              </p>
              <p class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ dataSummary.paidDocuments }}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                Rétention
              </p>
              <p class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ dataSummary.expiredRecords }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Information sur le score -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Score de conformité
        </h2>
        <div
          class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4"
        >
          <div class="flex">
            <div class="flex-shrink-0">
              <svg
                class="h-5 w-5 text-blue-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-blue-800 dark:text-blue-200">
                Score basé sur la conformité légale
              </h3>
              <div class="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <p>
                  Ce score provient directement de vos paramètres d'entreprise
                  (Configuration > Informations société > Onglet "Conformité").
                </p>
                <p class="mt-1">
                  Pour améliorer votre score, complétez les champs manquants
                  dans les paramètres d'entreprise.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions RGPD -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Actions RGPD
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
          >
            <h3 class="text-md font-medium text-gray-900 dark:text-white mb-2">
              Export des données
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Téléchargez toutes vos données personnelles au format JSON
            </p>
            <button
              @click="exportData"
              :disabled="isExporting"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              <svg
                v-if="isExporting"
                class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
              <svg
                v-else
                class="h-4 w-4 mr-2"
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
              {{ isExporting ? "Export en cours..." : "Exporter mes données" }}
            </button>
          </div>

          <div
            class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
          >
            <h3 class="text-md font-medium text-gray-900 dark:text-white mb-2">
              Suppression des données
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Supprimez définitivement votre compte et toutes vos données
            </p>
            <button
              @click="showDeleteModal = true"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Supprimer mon compte
            </button>
          </div>
        </div>
      </div>

      <!-- Politique de rétention -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Politique de rétention des données
        </h2>
        <div class="space-y-4">
          <div class="border-l-4 border-blue-500 pl-4">
            <h3 class="text-sm font-medium text-gray-900 dark:text-white">
              Factures et devis
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Conservation obligatoire pendant 10 ans (Code de commerce art.
              L123-22)
            </p>
          </div>
          <div class="border-l-4 border-green-500 pl-4">
            <h3 class="text-sm font-medium text-gray-900 dark:text-white">
              Données clients
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Conservation pendant 3 ans après la fin de la relation
              contractuelle
            </p>
          </div>
          <div class="border-l-4 border-purple-500 pl-4">
            <h3 class="text-sm font-medium text-gray-900 dark:text-white">
              Données de connexion
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Conservation pendant 12 mois maximum (Loi pour la confiance dans
              l'économie numérique)
            </p>
          </div>
        </div>
      </div>

      <!-- Audit des données -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Audit des données stockées
        </h2>
        <div class="overflow-x-auto">
          <table
            class="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
          >
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Type de données
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Nombre d'enregistrements
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Dernière modification
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Durée de rétention
                </th>
              </tr>
            </thead>
            <tbody
              class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
            >
              <tr v-for="dataType in dataTypes" :key="dataType.type">
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white"
                >
                  {{ dataType.name }}
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
                >
                  {{ dataType.count }}
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
                >
                  {{ formatDate(dataType.lastModified) }}
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
                >
                  {{ dataType.retention }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal de suppression -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md"
      >
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Suppression définitive du compte
          </h3>
        </div>

        <div class="px-6 py-4">
          <div
            class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-4"
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
                  Attention : Action irréversible
                </h3>
                <div class="mt-2 text-sm text-red-700 dark:text-red-300">
                  <p>Cette action supprimera définitivement :</p>
                  <ul class="list-disc list-inside mt-1">
                    <li>Votre compte utilisateur</li>
                    <li>Toutes vos données personnelles</li>
                    <li>Tous vos clients, devis et factures</li>
                    <li>Tous les fichiers et documents</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div class="mb-4">
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Tapez "SUPPRIMER" pour confirmer
            </label>
            <input
              v-model="deleteConfirmation"
              type="text"
              placeholder="SUPPRIMER"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <div
          class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3"
        >
          <button
            @click="showDeleteModal = false"
            class="px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Annuler
          </button>
          <button
            @click="deleteAccount"
            :disabled="deleteConfirmation !== 'SUPPRIMER' || isDeleting"
            class="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {{ isDeleting ? "Suppression..." : "Supprimer définitivement" }}
          </button>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import Layout from "@/components/Layout.vue";
import { useToast } from "vue-toastification";
import api from "@/utils/api";

const router = useRouter();
const toast = useToast();

// État réactif
const complianceScore = ref(85);
const dataSummary = ref({
  totalRecords: 0,
  paidDocuments: 0,
  expiredRecords: 0,
});
const dataTypes = ref([]);
const isExporting = ref(false);
const isDeleting = ref(false);
const showDeleteModal = ref(false);
const deleteConfirmation = ref("");

// Méthodes
const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR");
};

const exportData = async () => {
  try {
    isExporting.value = true;
    const response = await api.get("/rgpd/export");

    if (response.data.downloadUrl) {
      // Télécharger le fichier
      const downloadResponse = await api.get(response.data.downloadUrl, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([downloadResponse.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `export-donnees-${new Date().toISOString().split("T")[0]}.json`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Export des données généré avec succès");
    }
  } catch (error) {
    console.error("Erreur lors de l'export:", error);
    toast.error("Erreur lors de l'export des données");
  } finally {
    isExporting.value = false;
  }
};

const deleteAccount = async () => {
  try {
    isDeleting.value = true;
    await api.delete("/rgpd/delete-account");

    toast.success("Compte supprimé avec succès");

    // Rediriger vers la page de connexion
    localStorage.removeItem("token");
    router.push("/login");
  } catch (error) {
    console.error("Erreur lors de la suppression:", error);
    toast.error("Erreur lors de la suppression du compte");
  } finally {
    isDeleting.value = false;
    showDeleteModal.value = false;
  }
};

const loadDataSummary = async () => {
  try {
    const response = await api.get("/rgpd/data-summary");
    dataSummary.value = response.data.summary;
    dataTypes.value = response.data.dataTypes;
    complianceScore.value = response.data.complianceScore;
  } catch (error) {
    console.error("Erreur lors du chargement des données:", error);
  }
};

onMounted(() => {
  loadDataSummary();
});
</script>
