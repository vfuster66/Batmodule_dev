import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import SetupRequiredAlert from '../../components/SetupRequiredAlert.vue'

// Mock du router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('SetupRequiredAlert', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render alert message', () => {
    const wrapper = mount(SetupRequiredAlert)

    expect(wrapper.text()).toContain('Configuration requise')
    expect(wrapper.text()).toContain(
      "Pour utiliser l'application, vous devez d'abord compléter la configuration de votre entreprise."
    )
  })

  it('should render required fields list', () => {
    const wrapper = mount(SetupRequiredAlert)

    expect(wrapper.text()).toContain('Champs obligatoires :')
    expect(wrapper.text()).toContain("Nom de l'entreprise")
    expect(wrapper.text()).toContain('SIRET')
    expect(wrapper.text()).toContain('Forme juridique')
    expect(wrapper.text()).toContain('Adresse')
    expect(wrapper.text()).toContain('Code postal')
    expect(wrapper.text()).toContain('Ville')
    expect(wrapper.text()).toContain('Téléphone')
    expect(wrapper.text()).toContain('Email')
  })

  it('should have correct CSS classes', () => {
    const wrapper = mount(SetupRequiredAlert)

    expect(wrapper.find('.bg-yellow-50').exists()).toBe(true)
    expect(wrapper.find('.border-yellow-200').exists()).toBe(true)
    expect(wrapper.find('.rounded-lg').exists()).toBe(true)
    expect(wrapper.find('.p-6').exists()).toBe(true)
    expect(wrapper.find('.mb-6').exists()).toBe(true)
  })

  it('should have configure button', () => {
    const wrapper = mount(SetupRequiredAlert)

    const button = wrapper.find('button')
    expect(button.exists()).toBe(true)
    expect(button.text()).toContain('Configurer maintenant')
    expect(button.classes()).toContain('bg-yellow-100')
    expect(button.classes()).toContain('hover:bg-yellow-200')
    expect(button.classes()).toContain('text-yellow-800')
  })

  it('should navigate to settings when button clicked', async () => {
    const wrapper = mount(SetupRequiredAlert)

    const button = wrapper.find('button')
    await button.trigger('click')

    expect(mockPush).toHaveBeenCalledWith('/company-settings')
  })

  it('should have warning icon', () => {
    const wrapper = mount(SetupRequiredAlert)

    const icon = wrapper.find('svg')
    expect(icon.exists()).toBe(true)
    expect(icon.classes()).toContain('h-5')
    expect(icon.classes()).toContain('w-5')
    expect(icon.classes()).toContain('text-yellow-400')
  })
})
