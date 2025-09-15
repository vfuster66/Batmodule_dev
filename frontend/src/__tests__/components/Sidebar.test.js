import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import Sidebar from '../../components/Sidebar.vue'

// Mock des stores
vi.mock('../../stores/company', () => ({
  useCompanyStore: vi.fn(),
}))

vi.mock('../../stores/auth', () => ({
  useAuthStore: vi.fn(),
}))

// Mock de vue-toastification
vi.mock('vue-toastification', () => ({
  useToast: () => ({
    success: vi.fn(),
  }),
}))

describe('Sidebar', () => {
  let wrapper
  let mockCompanyStore
  let mockAuthStore
  let router

  beforeEach(async () => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    // Créer un router réel pour éviter les problèmes avec $route
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/dashboard', component: { template: '<div>Dashboard</div>' } },
        { path: '/clients', component: { template: '<div>Clients</div>' } },
      ],
    })

    mockCompanyStore = {
      settings: {
        company_name: 'Test Company',
        logo_url: null,
        logo_base64: null,
      },
    }

    mockAuthStore = {
      logout: vi.fn(),
    }

    const { useCompanyStore } = await import('../../stores/company')
    const { useAuthStore } = await import('../../stores/auth')
    useCompanyStore.mockReturnValue(mockCompanyStore)
    useAuthStore.mockReturnValue(mockAuthStore)
  })

  it('should render the sidebar structure', async () => {
    await router.push('/dashboard')
    wrapper = mount(Sidebar, {
      props: {
        sidebarOpen: true,
      },
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.find('div').classes()).toContain('fixed')
    expect(wrapper.find('div').classes()).toContain('inset-y-0')
    expect(wrapper.find('div').classes()).toContain('left-0')
    expect(wrapper.find('div').classes()).toContain('z-50')
    expect(wrapper.find('div').classes()).toContain('w-64')
  })

  it('should show company logo when logo_url is available', async () => {
    await router.push('/dashboard')
    mockCompanyStore.settings.logo_url = 'https://example.com/logo.png'

    wrapper = mount(Sidebar, {
      props: {
        sidebarOpen: true,
      },
      global: {
        plugins: [router],
      },
    })

    const logoImg = wrapper.find('img[alt="Logo entreprise"]')
    expect(logoImg.exists()).toBe(true)
    expect(logoImg.attributes('src')).toBe('https://example.com/logo.png')
  })

  it('should show company initial when no logo is available', async () => {
    await router.push('/dashboard')
    wrapper = mount(Sidebar, {
      props: {
        sidebarOpen: true,
      },
      global: {
        plugins: [router],
      },
    })

    const initialDiv = wrapper.find('div.bg-blue-cobalt')
    expect(initialDiv.exists()).toBe(true)
    expect(initialDiv.text()).toBe('T') // First letter of "Test Company"
  })

  it('should emit toggle when close button is clicked', async () => {
    await router.push('/dashboard')
    wrapper = mount(Sidebar, {
      props: {
        sidebarOpen: true,
      },
      global: {
        plugins: [router],
      },
    })

    const closeButton = wrapper.find('button[class*="lg:hidden"]')
    await closeButton.trigger('click')

    expect(wrapper.emitted('toggle')).toBeTruthy()
  })

  it('should render navigation items', async () => {
    await router.push('/dashboard')
    wrapper = mount(Sidebar, {
      props: {
        sidebarOpen: true,
      },
      global: {
        plugins: [router],
      },
    })

    // Vérifier que les éléments de navigation sont présents
    expect(wrapper.text()).toContain('Tableau de bord')
    expect(wrapper.text()).toContain('Clients')
    expect(wrapper.text()).toContain('Services')
    expect(wrapper.text()).toContain('Devis')
    expect(wrapper.text()).toContain('Factures')
    expect(wrapper.text()).toContain('Statistiques')
  })
})
