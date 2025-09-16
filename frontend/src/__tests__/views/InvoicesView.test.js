import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import InvoicesView from '../../views/InvoicesView.vue'

// Mock du composant Layout
vi.mock('../../components/Layout.vue', () => ({
  default: {
    name: 'Layout',
    template: '<div class="layout"><slot /></div>',
  },
}))

// Mock du store invoices
vi.mock('../../stores/invoices', () => ({
  useInvoicesStore: () => ({
    invoices: [],
    loading: false,
    error: null,
    pagination: { page: 1, limit: 10, total: 0, pages: 0 },
    filters: {
      search: '',
      status: '',
      sortBy: 'created_at',
      sortOrder: 'desc',
    },
    fetchInvoices: vi.fn(),
    createInvoice: vi.fn(),
    updateInvoice: vi.fn(),
    deleteInvoice: vi.fn(),
  }),
}))

describe('InvoicesView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should render invoices view', () => {
    const wrapper = mount(InvoicesView)

    expect(wrapper.find('div').exists()).toBe(true)
  })

  it('should have correct CSS classes', () => {
    const wrapper = mount(InvoicesView)

    expect(wrapper.find('.bg-white').exists()).toBe(true)
  })
})
