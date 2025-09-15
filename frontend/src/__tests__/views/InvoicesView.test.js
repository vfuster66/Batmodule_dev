import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import InvoicesView from '../../views/InvoicesView.vue'

// Mock du composant Layout
vi.mock('../../components/Layout.vue', () => ({
  default: {
    name: 'Layout',
    template: '<div class="layout"><slot /></div>',
  },
}))

describe('InvoicesView', () => {
  beforeEach(() => {
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
