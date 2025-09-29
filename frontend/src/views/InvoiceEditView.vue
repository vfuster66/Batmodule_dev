<template>
  <Layout>
    <div class="space-y-6">
      <!-- En-tête -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Modifier la facture {{ invoice?.invoiceNumber }}
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Modifiez les détails de la facture
          </p>
        </div>
        <div class="flex space-x-3">
          <button
            @click="goBack"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
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

      <!-- Formulaire de modification -->
      <div v-if="invoice" class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <form @submit.prevent="updateInvoice" class="p-6 space-y-6">
          <!-- Informations générales -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Titre de la facture
              </label>
              <input
                v-model="form.title"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:text-white"
                placeholder="Titre de la facture"
              />
            </div>
            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Date d'échéance *
              </label>
              <input
                v-model="form.dueDate"
                type="date"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Description
            </label>
            <textarea
              v-model="form.description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:text-white"
              placeholder="Description de la facture"
            ></textarea>
          </div>

          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Notes
            </label>
            <textarea
              v-model="form.notes"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:text-white"
              placeholder="Notes additionnelles"
            ></textarea>
          </div>

          <!-- Détail des prestations -->
          <div>
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                Détail des prestations
              </h3>
              <button
                type="button"
                @click="addItem"
                class="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
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
                Ajouter une prestation
              </button>
            </div>

            <div class="space-y-4">
              <div
                v-for="(item, index) in form.items"
                :key="index"
                class="grid grid-cols-12 gap-4 items-end p-4 border border-gray-200 dark:border-gray-600 rounded-lg"
              >
                <div class="col-span-5">
                  <label
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Description
                  </label>
                  <input
                    v-model="item.description"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Description de la prestation"
                  />
                </div>
                <div class="col-span-2">
                  <label
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Quantité
                  </label>
                  <input
                    v-model.number="item.quantity"
                    type="number"
                    step="0.01"
                    min="0"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div class="col-span-2">
                  <label
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Unité
                  </label>
                  <input
                    v-model="item.unit"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:text-white"
                    placeholder="m², h, etc."
                  />
                </div>
                <div class="col-span-2">
                  <label
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Prix unitaire HT
                  </label>
                  <input
                    v-model.number="item.unitPriceHt"
                    type="number"
                    step="0.01"
                    min="0"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div class="col-span-1">
                  <button
                    type="button"
                    @click="removeItem(index)"
                    class="w-full inline-flex items-center justify-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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
              </div>
            </div>
          </div>

          <!-- Totaux -->
          <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <span
                  class="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >Sous-total HT :</span
                >
                <span
                  class="ml-2 text-lg font-semibold text-gray-900 dark:text-white"
                >
                  {{ formatCurrency(calculatedTotals.subtotalHt) }}
                </span>
              </div>
              <div>
                <span
                  class="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >TVA :</span
                >
                <span
                  class="ml-2 text-lg font-semibold text-gray-900 dark:text-white"
                >
                  {{ formatCurrency(calculatedTotals.totalVat) }}
                </span>
              </div>
              <div class="col-span-2">
                <span
                  class="text-lg font-medium text-gray-700 dark:text-gray-300"
                  >Total TTC :</span
                >
                <span
                  class="ml-2 text-xl font-bold text-gray-900 dark:text-white"
                >
                  {{ formatCurrency(calculatedTotals.totalTtc) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Boutons d'action -->
          <div
            class="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-600"
          >
            <button
              type="button"
              @click="goBack"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              Annuler
            </button>
            <button
              type="submit"
              :disabled="isLoading"
              class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isLoading ? "Mise à jour..." : "Mettre à jour la facture" }}
            </button>
          </div>
        </form>
      </div>

      <!-- Chargement -->
      <div v-else class="flex items-center justify-center py-12">
        <div
          class="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"
        ></div>
        <span class="ml-3 text-gray-600 dark:text-gray-400">Chargement...</span>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import Layout from "@/components/Layout.vue";
import { useInvoicesStore } from "@/stores/invoices";
import api from "@/utils/api";
import { useToast } from "vue-toastification";

const route = useRoute();
const router = useRouter();
const invoicesStore = useInvoicesStore();
const toast = useToast();

const invoice = ref(null);
const isLoading = ref(false);

const form = ref({
  title: "",
  description: "",
  dueDate: "",
  notes: "",
  items: [],
});

// Calculer les totaux
const calculatedTotals = computed(() => {
  let subtotalHt = 0;
  let totalVat = 0;

  form.value.items.forEach((item) => {
    const itemTotal = (item.quantity || 0) * (item.unitPriceHt || 0);
    subtotalHt += itemTotal;
    totalVat += itemTotal * ((item.vatRate || 20) / 100);
  });

  return {
    subtotalHt,
    totalVat,
    totalTtc: subtotalHt + totalVat,
  };
});

// Charger la facture
const loadInvoice = async () => {
  try {
    isLoading.value = true;
    const response = await api.get(`/invoices/${route.params.id}`);
    invoice.value = response.data;

    // Remplir le formulaire
    form.value = {
      title: invoice.value.title || "",
      description: invoice.value.description || "",
      dueDate: invoice.value.dueDate ? invoice.value.dueDate.split("T")[0] : "",
      notes: invoice.value.notes || "",
      items:
        invoice.value.items?.map((item) => ({
          id: item.id,
          description: item.description || "",
          quantity: item.quantity || 0,
          unit: item.unit || "m²",
          unitPriceHt: item.unitPriceHt || 0,
          vatRate: item.vatRate || 20,
          totalHt: item.totalHt || 0,
          totalTtc: item.totalTtc || 0,
        })) || [],
    };
  } catch (error) {
    console.error("Erreur lors du chargement de la facture:", error);
    toast.error("Erreur lors du chargement de la facture");
    router.push("/invoices");
  } finally {
    isLoading.value = false;
  }
};

// Ajouter une prestation
const addItem = () => {
  form.value.items.push({
    description: "",
    quantity: 1,
    unit: "m²",
    unitPriceHt: 0,
    vatRate: 20,
    totalHt: 0,
    totalTtc: 0,
  });
};

// Supprimer une prestation
const removeItem = (index) => {
  form.value.items.splice(index, 1);
};

// Mettre à jour la facture
const updateInvoice = async () => {
  try {
    // Validation des champs obligatoires
    if (!form.value.dueDate) {
      toast.error("La date d'échéance est obligatoire");
      return;
    }

    isLoading.value = true;

    // Calculer les totaux pour chaque item
    const itemsWithTotals = form.value.items.map((item) => {
      const totalHt = (item.quantity || 0) * (item.unitPriceHt || 0);
      const vatAmount = totalHt * ((item.vatRate || 20) / 100);
      return {
        ...item,
        totalHt,
        totalTtc: totalHt + vatAmount,
      };
    });

    const payload = {
      title: form.value.title,
      description: form.value.description,
      dueDate: form.value.dueDate,
      notes: form.value.notes,
      items: itemsWithTotals,
      subtotalHt: calculatedTotals.value.subtotalHt,
      totalVat: calculatedTotals.value.totalVat,
      totalTtc: calculatedTotals.value.totalTtc,
    };

    await api.put(`/invoices/${route.params.id}`, payload);

    toast.success("Facture mise à jour avec succès");
    router.push(`/invoices/${route.params.id}`);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la facture:", error);
    toast.error("Erreur lors de la mise à jour de la facture");
  } finally {
    isLoading.value = false;
  }
};

// Retour
const goBack = () => {
  router.push(`/invoices/${route.params.id}`);
};

// Formater la monnaie
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount || 0);
};

onMounted(() => {
  loadInvoice();
});
</script>
