import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CompanySettingsView from '../../views/CompanySettingsView.vue'

// Mock du composant Layout
vi.mock('../../components/Layout.vue', () => ({
  default: {
    name: 'Layout',
    template: '<div class="layout"><slot /></div>',
  },
}))

// Mock du store companySettings
vi.mock('../../stores/companySettings', () => ({
  useCompanySettingsStore: () => ({
    settings: {},
    loading: false,
    error: null,
    validation: {},
    isConfigured: false,
    complianceScore: 0,
    isCompliant: false,
    missingFields: [],
    recommendations: [],
    fetchSettings: vi.fn(),
    updateSettings: vi.fn(),
    validateSettings: vi.fn(),
    resetSettings: vi.fn(),
  }),
}))

describe('CompanySettingsView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
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
