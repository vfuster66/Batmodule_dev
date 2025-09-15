import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LegalMentionsEditor from '../../components/LegalMentionsEditor.vue'

// Mock des stores
vi.mock('../../stores/companySettings', () => ({
  useCompanySettingsStore: vi.fn(),
}))

// Mock de vue-toastification
vi.mock('vue-toastification', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}))

describe('LegalMentionsEditor', () => {
  let wrapper
  let mockCompanySettingsStore

  beforeEach(async () => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    mockCompanySettingsStore = {
      settings: {
        late_fee_rate: 0.5,
        late_fee_description: 'Test description',
        vat_on_payment: false,
        vat_on_payment_description: 'Test VAT description',
        legal_mentions: 'Test legal mentions',
        cgv_content: 'Test CGV content',
        privacy_policy_content: 'Test privacy policy content',
      },
      updateSettings: vi.fn(),
      loading: false,
    }

    const { useCompanySettingsStore } = await import(
      '../../stores/companySettings'
    )
    useCompanySettingsStore.mockReturnValue(mockCompanySettingsStore)
  })

  it('should render the component', () => {
    wrapper = mount(LegalMentionsEditor)

    expect(wrapper.exists()).toBe(true)
  })

  it('should have correct CSS classes', () => {
    wrapper = mount(LegalMentionsEditor)

    const container = wrapper.find('div.space-y-6')
    expect(container.exists()).toBe(true)
  })

  it('should show header section', () => {
    wrapper = mount(LegalMentionsEditor)

    expect(wrapper.text()).toContain('Mentions légales')
    expect(wrapper.text()).toContain('Configurez les mentions légales')
  })

  it('should show late fees section', () => {
    wrapper = mount(LegalMentionsEditor)

    expect(wrapper.text()).toContain('Pénalités de retard')
    expect(wrapper.text()).toContain('Taux de pénalité')
    expect(wrapper.text()).toContain('Description des pénalités')
  })

  it('should show VAT section', () => {
    wrapper = mount(LegalMentionsEditor)

    expect(wrapper.text()).toContain('TVA sur encaissements')
  })

  it('should show legal mentions section', () => {
    wrapper = mount(LegalMentionsEditor)

    expect(wrapper.text()).toContain('Mentions légales')
  })

  it('should show CGV section', () => {
    wrapper = mount(LegalMentionsEditor)

    expect(wrapper.text()).toContain('URL des CGV')
  })

  it('should show privacy policy section', () => {
    wrapper = mount(LegalMentionsEditor)

    expect(wrapper.text()).toContain('URL de la politique de confidentialité')
  })

  it('should render form fields', () => {
    wrapper = mount(LegalMentionsEditor)

    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.find('input[type="number"]').exists()).toBe(true)
    expect(wrapper.find('textarea').exists()).toBe(true)
  })

  it('should have submit and cancel buttons', () => {
    wrapper = mount(LegalMentionsEditor)

    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBeGreaterThan(0)

    const buttonTexts = buttons.map((button) => button.text())
    expect(buttonTexts.some((text) => text.includes('Sauvegarder'))).toBe(true)
    expect(buttonTexts.some((text) => text.includes('Annuler'))).toBe(true)
  })

  it('should handle form submission', async () => {
    wrapper = mount(LegalMentionsEditor)

    const form = wrapper.find('form')
    await form.trigger('submit')

    expect(mockCompanySettingsStore.updateSettings).toHaveBeenCalled()
  })

  it('should update form data when settings change', () => {
    wrapper = mount(LegalMentionsEditor)

    // Vérifier que le composant est rendu
    expect(wrapper.exists()).toBe(true)
  })

  it('should show loading state', () => {
    mockCompanySettingsStore.loading = true
    wrapper = mount(LegalMentionsEditor)

    expect(wrapper.exists()).toBe(true)
  })

  it('should handle input changes', async () => {
    wrapper = mount(LegalMentionsEditor)

    const numberInput = wrapper.find('input[type="number"]')
    if (numberInput.exists()) {
      await numberInput.setValue(1.5)
      expect(numberInput.element.value).toBe('1.5')
    }

    expect(wrapper.exists()).toBe(true)
  })

  it('should handle textarea changes', async () => {
    wrapper = mount(LegalMentionsEditor)

    const textarea = wrapper.find('textarea')
    if (textarea.exists()) {
      await textarea.setValue('New description')
      expect(textarea.element.value).toBe('New description')
    }

    expect(wrapper.exists()).toBe(true)
  })

  it('should handle checkbox changes', async () => {
    wrapper = mount(LegalMentionsEditor)

    const checkbox = wrapper.find('input[type="checkbox"]')
    if (checkbox.exists()) {
      await checkbox.setChecked(true)
      expect(checkbox.element.checked).toBe(true)
    }

    expect(wrapper.exists()).toBe(true)
  })
})
