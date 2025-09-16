import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import DashboardView from '../../views/DashboardView.vue'

// Mock du composant Layout
vi.mock('../../components/Layout.vue', () => ({
  default: {
    name: 'Layout',
    template: '<div class="layout"><slot /></div>',
  },
}))

// Mock des stores
vi.mock('../../stores/invoices', () => ({
  useInvoicesStore: () => ({
    invoices: [],
    loading: false,
    error: null,
    pagination: { page: 1, limit: 10, total: 0, pages: 0 },
    fetchInvoices: vi.fn(),
  }),
}))

vi.mock('../../stores/quotes', () => ({
  useQuotesStore: () => ({
    quotes: [],
    loading: false,
    error: null,
    pagination: { page: 1, limit: 10, total: 0, pages: 0 },
    fetchQuotes: vi.fn(),
  }),
}))

vi.mock('../../stores/clients', () => ({
  useClientsStore: () => ({
    clients: [],
    loading: false,
    error: null,
    pagination: { page: 1, limit: 10, total: 0, pages: 0 },
    fetchClients: vi.fn(),
  }),
}))

describe('DashboardView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should render dashboard view', () => {
    const wrapper = mount(DashboardView)

    expect(wrapper.find('div').exists()).toBe(true)
  })

  it('should have correct CSS classes', () => {
    const wrapper = mount(DashboardView)

    expect(wrapper.find('.bg-white').exists()).toBe(true)
  })
})
