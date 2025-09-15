import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'

// Mock des dépendances
vi.mock('../../stores/auth', () => ({
  useAuthStore: () => ({
    isAuthenticated: false,
    user: null,
  }),
}))

vi.mock('./guards', () => ({
  setupNavigationGuards: vi.fn(),
}))

// Mock des vues
const mockViews = {
  LoginView: { template: '<div>Login</div>' },
  RegisterView: { template: '<div>Register</div>' },
  DashboardView: { template: '<div>Dashboard</div>' },
  AnalyticsView: { template: '<div>Analytics</div>' },
  ClientsView: { template: '<div>Clients</div>' },
  ClientDetailView: { template: '<div>Client Detail</div>' },
  ServicesView: { template: '<div>Services</div>' },
  ServiceDetailView: { template: '<div>Service Detail</div>' },
  QuotesView: { template: '<div>Quotes</div>' },
  QuoteDetailView: { template: '<div>Quote Detail</div>' },
  QuoteEditView: { template: '<div>Quote Edit</div>' },
  InvoicesView: { template: '<div>Invoices</div>' },
  InvoiceDetailView: { template: '<div>Invoice Detail</div>' },
  ProfileView: { template: '<div>Profile</div>' },
  PublicQuoteView: { template: '<div>Public Quote</div>' },
  CompanySettingsView: { template: '<div>Company Settings</div>' },
  PublicLegalMentions: { template: '<div>Legal Mentions</div>' },
  PublicCGV: { template: '<div>CGV</div>' },
  PublicPrivacyPolicy: { template: '<div>Privacy Policy</div>' },
}

vi.mock('../../views/LoginView.vue', () => ({ default: mockViews.LoginView }))
vi.mock('../../views/RegisterView.vue', () => ({
  default: mockViews.RegisterView,
}))
vi.mock('../../views/DashboardView.vue', () => ({
  default: mockViews.DashboardView,
}))
vi.mock('../../views/AnalyticsView.vue', () => ({
  default: mockViews.AnalyticsView,
}))
vi.mock('../../views/ClientsView.vue', () => ({
  default: mockViews.ClientsView,
}))
vi.mock('../../views/ClientDetailView.vue', () => ({
  default: mockViews.ClientDetailView,
}))
vi.mock('../../views/ServicesView.vue', () => ({
  default: mockViews.ServicesView,
}))
vi.mock('../../views/ServiceDetailView.vue', () => ({
  default: mockViews.ServiceDetailView,
}))
vi.mock('../../views/QuotesView.vue', () => ({ default: mockViews.QuotesView }))
vi.mock('../../views/QuoteDetailView.vue', () => ({
  default: mockViews.QuoteDetailView,
}))
vi.mock('../../views/QuoteEditView.vue', () => ({
  default: mockViews.QuoteEditView,
}))
vi.mock('../../views/InvoicesView.vue', () => ({
  default: mockViews.InvoicesView,
}))
vi.mock('../../views/InvoiceDetailView.vue', () => ({
  default: mockViews.InvoiceDetailView,
}))
vi.mock('../../views/ProfileView.vue', () => ({
  default: mockViews.ProfileView,
}))
vi.mock('../../views/PublicQuoteView.vue', () => ({
  default: mockViews.PublicQuoteView,
}))
vi.mock('../../views/CompanySettingsView.vue', () => ({
  default: mockViews.CompanySettingsView,
}))
vi.mock('../../views/PublicLegalMentions.vue', () => ({
  default: mockViews.PublicLegalMentions,
}))
vi.mock('../../views/PublicCGV.vue', () => ({ default: mockViews.PublicCGV }))
vi.mock('../../views/PublicPrivacyPolicy.vue', () => ({
  default: mockViews.PublicPrivacyPolicy,
}))

describe('Router Configuration', () => {
  let router

  beforeEach(() => {
    vi.clearAllMocks()

    // Import dynamique pour éviter l'exécution immédiate
    import('../../router/index.js').then((module) => {
      router = module.default
    })
  })

  it('should have all required routes', async () => {
    const routerModule = await import('../../router/index.js')
    const routerInstance = routerModule.default

    const routes = routerInstance.getRoutes()

    // Vérifier les routes principales
    expect(routes.some((route) => route.path === '/')).toBe(true)
    expect(routes.some((route) => route.path === '/login')).toBe(true)
    expect(routes.some((route) => route.path === '/register')).toBe(true)
    expect(routes.some((route) => route.path === '/dashboard')).toBe(true)
    expect(routes.some((route) => route.path === '/clients')).toBe(true)
    expect(routes.some((route) => route.path === '/services')).toBe(true)
    expect(routes.some((route) => route.path === '/quotes')).toBe(true)
    expect(routes.some((route) => route.path === '/invoices')).toBe(true)
  })

  it('should have dynamic routes', async () => {
    const routerModule = await import('../../router/index.js')
    const routerInstance = routerModule.default

    const routes = routerInstance.getRoutes()

    // Vérifier les routes dynamiques
    expect(routes.some((route) => route.path === '/clients/:id')).toBe(true)
    expect(routes.some((route) => route.path === '/services/:id')).toBe(true)
    expect(routes.some((route) => route.path === '/quotes/:id')).toBe(true)
    expect(routes.some((route) => route.path === '/invoices/:id')).toBe(true)
  })
})
