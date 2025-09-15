import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import DashboardView from '../../views/DashboardView.vue'

// Mock du composant Layout
vi.mock('../../components/Layout.vue', () => ({
  default: {
    name: 'Layout',
    template: '<div class="layout"><slot /></div>',
  },
}))

describe('DashboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render dashboard view', () => {
    const wrapper = mount(DashboardView)

    expect(wrapper.find('div').exists()).toBe(true)
  })

  it('should have correct CSS classes', () => {
    const wrapper = mount(DashboardView)

    expect(wrapper.find('.bg-white').exists()).toBe(true)
  })
})
