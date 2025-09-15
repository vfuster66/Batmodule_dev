import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CompanySettingsView from '../../views/CompanySettingsView.vue'

// Mock du composant Layout
vi.mock('../../components/Layout.vue', () => ({
  default: {
    name: 'Layout',
    template: '<div class="layout"><slot /></div>',
  },
}))

describe('CompanySettingsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render company settings view', () => {
    const wrapper = mount(CompanySettingsView)

    expect(wrapper.find('div').exists()).toBe(true)
  })

  it('should have correct CSS classes', () => {
    const wrapper = mount(CompanySettingsView)

    expect(wrapper.find('.space-y-6').exists()).toBe(true)
  })
})
