import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import PublicQuoteView from '../../views/PublicQuoteView.vue'

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

describe('PublicQuoteView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render public quote view', () => {
    const wrapper = mount(PublicQuoteView)

    expect(wrapper.find('div').exists()).toBe(true)
  })

  it('should have correct CSS classes', () => {
    const wrapper = mount(PublicQuoteView)

    expect(wrapper.find('.bg-white').exists()).toBe(true)
  })
})
