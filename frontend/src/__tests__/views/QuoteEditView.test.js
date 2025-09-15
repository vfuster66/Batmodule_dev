import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import QuoteEditView from '../../views/QuoteEditView.vue'

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
vi.mock('../../stores/quotes', () => ({
  useQuotesStore: () => ({
    fetchQuote: vi.fn().mockResolvedValue({}),
    updateQuote: vi.fn().mockResolvedValue({}),
    quote: { value: null },
    loading: false,
    error: null,
  }),
}))

vi.mock('../../stores/clients', () => ({
  useClientsStore: () => ({
    clients: { value: [] },
    loading: false,
    error: null,
  }),
}))

describe('QuoteEditView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render quote edit view', () => {
    const wrapper = mount(QuoteEditView)

    expect(wrapper.find('div').exists()).toBe(true)
  })

  it('should have correct CSS classes', () => {
    const wrapper = mount(QuoteEditView)

    expect(wrapper.find('.bg-white').exists()).toBe(true)
  })
})
