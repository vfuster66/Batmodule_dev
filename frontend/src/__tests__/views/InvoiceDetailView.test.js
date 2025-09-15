import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import InvoiceDetailView from '../../views/InvoiceDetailView.vue'

// Mock du composant Layout
vi.mock('../../components/Layout.vue', () => ({
  default: {
    name: 'Layout',
    template: '<div class="layout"><slot /></div>',
  },
}))

// Mock de vue-router
vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: { id: 'test-id' },
  }),
  useRouter: () => ({
    push: vi.fn(),
    go: vi.fn(),
  }),
}))

// Mock des stores
vi.mock('../../stores/invoices', () => ({
  useInvoicesStore: () => ({
    fetchInvoice: vi.fn().mockResolvedValue({}),
    invoice: { value: null },
    loading: false,
    error: null,
  }),
}))

describe('InvoiceDetailView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render invoice detail view', () => {
    const wrapper = mount(InvoiceDetailView)

    expect(wrapper.find('div').exists()).toBe(true)
  })

  it('should have correct CSS classes', () => {
    const wrapper = mount(InvoiceDetailView)

    expect(wrapper.find('.bg-white').exists()).toBe(true)
  })
})
