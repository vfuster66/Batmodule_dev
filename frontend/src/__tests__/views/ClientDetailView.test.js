import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ClientDetailView from '../../views/ClientDetailView.vue'

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

describe('ClientDetailView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render client detail view', () => {
    const wrapper = mount(ClientDetailView)

    expect(wrapper.find('div').exists()).toBe(true)
  })

  it('should have correct CSS classes', () => {
    const wrapper = mount(ClientDetailView)

    expect(wrapper.find('.bg-white').exists()).toBe(true)
  })
})
