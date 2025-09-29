<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 overflow-y-auto"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true"
  >
    <div
      class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
    >
      <div
        class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        aria-hidden="true"
      ></div>
      <span
        class="hidden sm:inline-block sm:align-middle sm:h-screen"
        aria-hidden="true"
        >&#8203;</span
      >
      <div
        class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full"
      >
        <form @submit.prevent="handleSubmit">
          <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3
                  class="text-lg leading-6 font-medium text-gray-900 dark:text-white"
                  id="modal-title"
                >
                  Nouvelle facture
                </h3>
                <div class="mt-4 space-y-6">
                  <!-- Étape 1: Sélection du client -->
                  <div v-if="currentStep === 1">
                    <label
                      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Client *
                    </label>
                    <select
                      v-model="form.clientId"
                      required
                      class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Sélectionner un client</option>
                      <option
                        v-for="client in clients"
                        :key="client.id"
                        :value="client.id"
                      >
                        {{
                          client.isCompany
                            ? client.companyName
                            : `${client.firstName} ${client.lastName}`
                        }}
                      </option>
                    </select>
                  </div>

                  <!-- Étape 2: Détails de la facture -->
                  <div v-if="currentStep === 2">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                        >
                          Titre de la facture *
                        </label>
                        <input
                          v-model="form.title"
                          type="text"
                          required
                          class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Ex: Rénovation salle de bain"
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
                          class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                    <div class="mt-4">
                      <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Notes (optionnel)
                      </label>
                      <textarea
                        v-model="form.notes"
                        rows="3"
                        class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Notes additionnelles..."
                      ></textarea>
                    </div>
                  </div>

                  <!-- Étape 3: Services -->
                  <div v-if="currentStep === 3">
                    <div class="flex justify-between items-center mb-4">
                      <h4
                        class="text-md font-medium text-gray-900 dark:text-white"
                      >
                        Services
                      </h4>
                      <button
                        type="button"
                        @click="addService"
                        class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <svg
                          class="w-4 h-4 mr-1"
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
                        Ajouter un service
                      </button>
                    </div>

                    <div
                      v-for="(service, index) in form.services"
                      :key="index"
                      class="border border-gray-200 dark:border-gray-600 rounded-lg p-4 mb-4"
                    >
                      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label
                            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          >
                            Service
                          </label>
                          <select
                            v-model="service.serviceId"
                            @change="updateServiceDetails(index)"
                            class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          >
                            <option value="">Sélectionner un service</option>
                            <option
                              v-for="s in services"
                              :key="s.id"
                              :value="s.id"
                            >
                              {{ s.name }}
                            </option>
                          </select>
                        </div>
                        <div>
                          <label
                            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          >
                            Quantité
                          </label>
                          <input
                            v-model.number="service.quantity"
                            type="number"
                            min="1"
                            step="1"
                            @input="calculateServiceTotal(index)"
                            class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <label
                            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          >
                            Prix unitaire (€)
                          </label>
                          <input
                            v-model.number="service.unitPrice"
                            type="number"
                            min="0"
                            step="0.01"
                            @input="calculateServiceTotal(index)"
                            class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      </div>
                      <div class="mt-2 flex justify-between items-center">
                        <div class="text-sm text-gray-600 dark:text-gray-400">
                          Total: {{ formatCurrency(service.total) }}
                        </div>
                        <button
                          type="button"
                          @click="removeService(index)"
                          class="text-red-600 hover:text-red-800 text-sm"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Étape 4: Récapitulatif -->
                  <div v-if="currentStep === 4">
                    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4
                        class="text-md font-medium text-gray-900 dark:text-white mb-4"
                      >
                        Récapitulatif
                      </h4>
                      <div class="space-y-2">
                        <div class="flex justify-between">
                          <span class="text-sm text-gray-600 dark:text-gray-400"
                            >Client:</span
                          >
                          <span class="text-sm font-medium">{{
                            getClientName()
                          }}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-sm text-gray-600 dark:text-gray-400"
                            >Titre:</span
                          >
                          <span class="text-sm font-medium">{{
                            form.title
                          }}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-sm text-gray-600 dark:text-gray-400"
                            >Échéance:</span
                          >
                          <span class="text-sm font-medium">{{
                            formatDate(form.dueDate)
                          }}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-sm text-gray-600 dark:text-gray-400"
                            >Services:</span
                          >
                          <span class="text-sm font-medium">{{
                            form.services.length
                          }}</span>
                        </div>
                        <div
                          class="flex justify-between border-t border-gray-200 dark:border-gray-600 pt-2"
                        >
                          <span
                            class="text-lg font-medium text-gray-900 dark:text-white"
                            >Total HT:</span
                          >
                          <span
                            class="text-lg font-medium text-gray-900 dark:text-white"
                            >{{ formatCurrency(totalHT) }}</span
                          >
                        </div>
                        <div class="flex justify-between">
                          <span class="text-sm text-gray-600 dark:text-gray-400"
                            >TVA (20%):</span
                          >
                          <span class="text-sm font-medium">{{
                            formatCurrency(totalTVA)
                          }}</span>
                        </div>
                        <div
                          class="flex justify-between border-t border-gray-200 dark:border-gray-600 pt-2"
                        >
                          <span
                            class="text-xl font-bold text-gray-900 dark:text-white"
                            >Total TTC:</span
                          >
                          <span
                            class="text-xl font-bold text-gray-900 dark:text-white"
                            >{{ formatCurrency(totalTTC) }}</span
                          >
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse"
          >
            <button
              v-if="currentStep < 4"
              type="button"
              @click="nextStep"
              :disabled="!canProceed"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ currentStep === 3 ? "Récapitulatif" : "Suivant" }}
            </button>
            <button
              v-if="currentStep === 4"
              type="submit"
              :disabled="loading"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ loading ? "Création..." : "Créer la facture" }}
            </button>
            <button
              v-if="currentStep > 1"
              type="button"
              @click="prevStep"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Précédent
            </button>
            <button
              type="button"
              @click="closeModal"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useInvoicesStore } from "@/stores/invoices";
import { useClientsStore } from "@/stores/clients";
import { useToast } from "vue-toastification";
import api from "@/utils/api";

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close", "saved"]);

const invoicesStore = useInvoicesStore();
const clientsStore = useClientsStore();
const toast = useToast();

// État local
const currentStep = ref(1);
const loading = ref(false);
const services = ref([]);
const clients = ref([]);

// Formulaire
const form = ref({
  clientId: "",
  title: "",
  dueDate: "",
  notes: "",
  services: [],
});

// Computed
const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1:
      return form.value.clientId !== "";
    case 2:
      return form.value.title !== "" && form.value.dueDate !== "";
    case 3:
      return form.value.services.length > 0;
    default:
      return true;
  }
});

const totalHT = computed(() => {
  return form.value.services.reduce(
    (sum, service) => sum + (service.total || 0),
    0,
  );
});

const totalTVA = computed(() => {
  return totalHT.value * 0.2;
});

const totalTTC = computed(() => {
  return totalHT.value + totalTVA.value;
});

// Méthodes
const getClientName = () => {
  const client = clients.value.find((c) => c.id === form.value.clientId);
  return client
    ? client.isCompany
      ? client.companyName
      : `${client.firstName} ${client.lastName}`
    : "";
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount || 0);
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("fr-FR");
};

const nextStep = () => {
  if (canProceed.value && currentStep.value < 4) {
    currentStep.value++;
  }
};

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

const addService = () => {
  form.value.services.push({
    serviceId: "",
    quantity: 1,
    unitPrice: 0,
    total: 0,
  });
};

const removeService = (index) => {
  form.value.services.splice(index, 1);
};

const updateServiceDetails = (index) => {
  const service = form.value.services[index];
  const selectedService = services.value.find(
    (s) => s.id === service.serviceId,
  );
  if (selectedService) {
    service.unitPrice = selectedService.price;
    calculateServiceTotal(index);
  }
};

const calculateServiceTotal = (index) => {
  const service = form.value.services[index];
  service.total = (service.quantity || 0) * (service.unitPrice || 0);
};

const resetForm = () => {
  form.value = {
    clientId: "",
    title: "",
    dueDate: "",
    notes: "",
    services: [],
  };
  currentStep.value = 1;
};

const closeModal = () => {
  resetForm();
  emit("close");
};

const handleSubmit = async () => {
  if (loading.value) return;

  try {
    loading.value = true;

    const invoiceData = {
      clientId: form.value.clientId,
      title: form.value.title,
      dueDate: form.value.dueDate,
      notes: form.value.notes,
      services: form.value.services.map((service) => ({
        serviceId: service.serviceId,
        quantity: service.quantity,
        unitPrice: service.unitPrice,
      })),
    };

    await invoicesStore.createInvoice(invoiceData);
    toast.success("Facture créée avec succès");
    emit("saved");
    closeModal();
  } catch (error) {
    console.error("Erreur lors de la création de la facture:", error);
    toast.error("Erreur lors de la création de la facture");
  } finally {
    loading.value = false;
  }
};

// Charger les données
const loadData = async () => {
  try {
    const [clientsRes, servicesRes] = await Promise.all([
      clientsStore.fetchClients({ limit: 100 }),
      api.get("/services"),
    ]);

    clients.value = clientsStore.clients;
    services.value = servicesRes.data.services || [];
  } catch (error) {
    console.error("Erreur lors du chargement des données:", error);
  }
};

// Initialiser la date d'échéance (30 jours)
const initDueDate = () => {
  const today = new Date();
  const dueDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  form.value.dueDate = dueDate.toISOString().split("T")[0];
};

// Watchers
watch(
  () => props.show,
  (newValue) => {
    if (newValue) {
      loadData();
      initDueDate();
    }
  },
);
</script>
