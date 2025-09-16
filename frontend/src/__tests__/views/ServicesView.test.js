import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ServicesView from '../../views/ServicesView.vue'

// Mock du composant Layout
vi.mock('../../components/Layout.vue', () => ({
  default: {
    name: 'Layout',
    template: '<div class="layout"><slot /></div>',
  },
}))

// Mock du store services
vi.mock('../../stores/services', () => ({
  useServicesStore: () => ({
    services: [],
    categories: [],
    loading: false,
    error: null,
    pagination: { page: 1, limit: 10, total: 0, pages: 0 },
    filters: {
      search: '',
      category_id: '',
      sortBy: 'created_at',
      sortOrder: 'desc',
    },
    fetchServices: vi.fn(),
    fetchCategories: vi.fn(),
    createService: vi.fn(),
    updateService: vi.fn(),
    deleteService: vi.fn(),
  }),
}))

describe('ServicesView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should render services view', () => {
    const wrapper = mount(ServicesView)

    expect(wrapper.find('div').exists()).toBe(true)
  })

  it('should have correct CSS classes', () => {
    const wrapper = mount(ServicesView)

    expect(wrapper.find('.bg-white').exists()).toBe(true)
  })
})
