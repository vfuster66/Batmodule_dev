import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ClientsView from '../../views/ClientsView.vue'

// Mock du composant Layout
vi.mock('../../components/Layout.vue', () => ({
  default: {
    name: 'Layout',
    template: '<div class="layout"><slot /></div>',
  },
}))

describe('ClientsView', () => {
  beforeEach(() => {
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
