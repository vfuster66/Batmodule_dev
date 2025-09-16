import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ClientsView from '../../views/ClientsView.vue'

// Mock du composant Layout
vi.mock('../../components/Layout.vue', () => ({
  default: {
    name: 'Layout',
    template: '<div class="layout"><slot /></div>',
  },
}))

// Mock du store clients
vi.mock('../../stores/clients', () => ({
  useClientsStore: () => ({
    clients: [],
    loading: false,
    error: null,
    pagination: { page: 1, limit: 10, total: 0, pages: 0 },
    filters: { search: '', sortBy: 'created_at', sortOrder: 'desc' },
    fetchClients: vi.fn(),
    createClient: vi.fn(),
    updateClient: vi.fn(),
    deleteClient: vi.fn(),
  }),
}))

describe('ClientsView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should render clients view', () => {
    const wrapper = mount(ClientsView)

    expect(wrapper.find('div').exists()).toBe(true)
  })

  it('should have correct CSS classes', () => {
    const wrapper = mount(ClientsView)

    expect(wrapper.find('.bg-white').exists()).toBe(true)
  })
})
