import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CompanySettingsForm from '../../components/CompanySettingsForm.vue'

// Mock des stores
vi.mock('../../stores/companySettings', () => ({
  useCompanySettingsStore: () => ({
    settings: {
      name: 'Test Company',
      siret: '12345678901234',
      address: '123 Test St',
      city: 'Test City',
      postalCode: '12345',
      phone: '0123456789',
      email: 'test@test.com',
      website: 'https://test.com',
    },
    loading: false,
    error: null,
    complianceScore: 85,
    isCompliant: true,
    missingFields: [],
    recommendations: [],
    fetchSettings: vi.fn().mockResolvedValue({}),
    updateSettings: vi.fn().mockResolvedValue({}),
    validateSettings: vi.fn().mockResolvedValue({}),
    validateSIRET: vi.fn().mockReturnValue(true),
    formatPhone: vi.fn().mockReturnValue('01 23 45 67 89'),
    validateEmail: vi.fn().mockReturnValue(true),
    validateWebsite: vi.fn().mockReturnValue(true),
  }),
}))

// Mock de vue-toastification
vi.mock('vue-toastification', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}))

describe('CompanySettingsForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render company settings form', () => {
    const wrapper = mount(CompanySettingsForm)

    expect(wrapper.find('form').exists()).toBe(true)
  })

  it('should have correct CSS classes', () => {
    const wrapper = mount(CompanySettingsForm)

    expect(wrapper.find('.bg-white').exists()).toBe(true)
  })

  it('should display company information', () => {
    const wrapper = mount(CompanySettingsForm)

    expect(wrapper.text()).toContain("Paramètres de l'entreprise")
  })

  it('should have form fields', () => {
    const wrapper = mount(CompanySettingsForm)

    expect(wrapper.find('input[type="text"]').exists()).toBe(true)
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
  })
})
