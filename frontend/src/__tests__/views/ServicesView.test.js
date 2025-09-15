import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ServicesView from '../../views/ServicesView.vue'

// Mock du composant Layout
vi.mock('../../components/Layout.vue', () => ({
  default: {
    name: 'Layout',
    template: '<div class="layout"><slot /></div>',
  },
}))

describe('ServicesView', () => {
  beforeEach(() => {
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
