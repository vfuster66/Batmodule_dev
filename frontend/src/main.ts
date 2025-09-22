import { createApp } from "vue";
import { createPinia } from "pinia";
import Toast from "vue-toastification";
import App from "./App.vue";
import router from "./router/index.js";
import "./style.css";

// Import CSS pour les toasts
import "vue-toastification/dist/index.css";

// Import des stores pour l'initialisation
import { useAuthStore } from "./stores/auth";
import { useCompanyStore } from "./stores/company";

const app = createApp(App);
const pinia = createPinia();

// Configuration des toasts
const toastOptions = {
  position: "top-right",
  timeout: 3000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: "button",
  icon: true,
  rtl: false,
};

app.use(pinia);
app.use(router);
app.use(Toast, toastOptions);

// Initialiser les stores après le montage de Pinia
const authStore = useAuthStore();
const companyStore = useCompanyStore();

// Initialiser l'authentification
authStore.initializeAuth().then(() => {
  // Charger les paramètres d'entreprise si l'utilisateur est connecté
  if (authStore.isAuthenticated) {
    companyStore.fetchSettings().catch(console.error);
  }
});

app.mount("#app");
