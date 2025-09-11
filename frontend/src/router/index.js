import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { setupNavigationGuards } from './guards'

// Vues
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import DashboardView from '@/views/DashboardView.vue'
import AnalyticsView from '@/views/AnalyticsView.vue'
import ClientsView from '@/views/ClientsView.vue'
import ClientDetailView from '@/views/ClientDetailView.vue'
import ServicesView from '@/views/ServicesView.vue'
import ServiceDetailView from '@/views/ServiceDetailView.vue'
import QuotesView from '@/views/QuotesView.vue'
import QuoteDetailView from '@/views/QuoteDetailView.vue'
import QuoteEditView from '@/views/QuoteEditView.vue'
import InvoicesView from '@/views/InvoicesView.vue'
import InvoiceDetailView from '@/views/InvoiceDetailView.vue'
import ProfileView from '@/views/ProfileView.vue'
import PublicQuoteView from '@/views/PublicQuoteView.vue'
import CompanySettingsView from '@/views/CompanySettingsView.vue'
import PublicLegalMentions from '@/views/PublicLegalMentions.vue'
import PublicCGV from '@/views/PublicCGV.vue'
import PublicPrivacyPolicy from '@/views/PublicPrivacyPolicy.vue'

const routes = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { requiresGuest: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterView,
    meta: { requiresGuest: true },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardView,
    meta: { requiresAuth: true },
  },
  {
    path: '/clients',
    name: 'Clients',
    component: ClientsView,
    meta: { requiresAuth: true },
  },
  {
    path: '/clients/:id',
    name: 'ClientDetail',
    component: ClientDetailView,
    meta: { requiresAuth: true },
  },
  {
    path: '/services',
    name: 'Services',
    component: ServicesView,
    meta: { requiresAuth: true },
  },
  {
    path: '/services/:id',
    name: 'ServiceDetail',
    component: ServiceDetailView,
    meta: { requiresAuth: true },
  },
  {
    path: '/quotes',
    name: 'Quotes',
    component: QuotesView,
    meta: { requiresAuth: true },
  },
  {
    path: '/quotes/:id',
    name: 'QuoteDetail',
    component: QuoteDetailView,
    meta: { requiresAuth: true },
  },
  {
    path: '/quotes/:id/edit',
    name: 'QuoteEdit',
    component: QuoteEditView,
    meta: { requiresAuth: true },
  },
  {
    path: '/invoices',
    name: 'Invoices',
    component: InvoicesView,
    meta: { requiresAuth: true },
  },
  {
    path: '/invoices/:id',
    name: 'InvoiceDetail',
    component: InvoiceDetailView,
    meta: { requiresAuth: true },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: CompanySettingsView,
    meta: { requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: ProfileView,
    meta: { requiresAuth: true },
  },
  {
    path: '/legal',
    name: 'Legal',
    redirect: '/settings',
  },
  {
    path: '/company-settings',
    name: 'CompanySettings',
    redirect: '/settings',
  },
  // Page publique de consultation/acceptation de devis (sans authentification)
  {
    path: '/quotes/:id/public',
    name: 'PublicQuote',
    component: PublicQuoteView,
    meta: { requiresAuth: false },
  },

  // Pages publiques légales (sans authentification)
  {
    path: '/mentions-legales',
    name: 'PublicLegalMentions',
    component: PublicLegalMentions,
    meta: { requiresAuth: false },
  },
  {
    path: '/cgv',
    name: 'PublicCGV',
    component: PublicCGV,
    meta: { requiresAuth: false },
  },
  {
    path: '/politique-confidentialite',
    name: 'PublicPrivacyPolicy',
    component: PublicPrivacyPolicy,
    meta: { requiresAuth: false },
  },
  {
    path: '/analytics',
    name: 'Analytics',
    component: AnalyticsView,
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Garde de navigation
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Si on a un token mais pas d'utilisateur, essayer de récupérer le profil
  if (authStore.token && !authStore.user) {
    try {
      await authStore.fetchProfile()
    } catch (error) {
      // Token invalide, continuer avec la vérification normale
    }
  }

  // Vérifier si l'utilisateur est authentifié
  const isAuthenticated = authStore.isAuthenticated

  // Pages qui nécessitent une authentification
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
    return
  }

  // Pages qui nécessitent d'être non authentifié (login, register)
  if (to.meta.requiresGuest && isAuthenticated) {
    next('/dashboard')
    return
  }

  next()
})

// Configurer les gardes de navigation pour la configuration d'entreprise
setupNavigationGuards(router)

export default router
