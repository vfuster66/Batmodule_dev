import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import QuotesView from '../../views/QuotesView.vue'

// Mock du composant Layout
vi.mock('../../components/Layout.vue', () => ({
  default: {
    name: 'Layout',
    template: '<div class="layout"><slot /></div>',
  },
}))

// Mock du store quotes
vi.mock('../../stores/quotes', () => ({
  useQuotesStore: () => ({
    quotes: [],
    loading: false,
    error: null,
    pagination: { page: 1, limit: 10, total: 0, pages: 0 },
    filters: {
      search: '',
      status: '',
      sortBy: 'created_at',
      sortOrder: 'desc',
    },
    fetchQuotes: vi.fn(),
    createQuote: vi.fn(),
    updateQuote: vi.fn(),
    deleteQuote: vi.fn(),
  }),
}))

describe('QuotesView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should render quotes view', () => {
    const wrapper = mount(QuotesView)

    expect(wrapper.find('div').exists()).toBe(true)
  })

  it('should have correct CSS classes', () => {
    const wrapper = mount(QuotesView)

    expect(wrapper.find('.bg-white').exists()).toBe(true)
  })
})
