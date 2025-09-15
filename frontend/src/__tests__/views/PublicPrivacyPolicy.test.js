import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import PublicPrivacyPolicy from '../../views/PublicPrivacyPolicy.vue'

describe('PublicPrivacyPolicy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render privacy policy title', () => {
    const wrapper = mount(PublicPrivacyPolicy)

    expect(wrapper.text()).toContain('Politique de Confidentialité')
    expect(wrapper.text()).toContain(
      'Protection des données personnelles - RGPD'
    )
  })

  it('should render introduction section', () => {
    const wrapper = mount(PublicPrivacyPolicy)

    expect(wrapper.text()).toContain('1. Introduction')
    expect(wrapper.text()).toContain('Fuster Peinture')
    expect(wrapper.text()).toContain('RGPD')
  })

  it('should render data controller section', () => {
    const wrapper = mount(PublicPrivacyPolicy)

    expect(wrapper.text()).toContain('2. Responsable du traitement')
  })

  it('should render data collection section', () => {
    const wrapper = mount(PublicPrivacyPolicy)

    expect(wrapper.text()).toContain('3. Données personnelles collectées')
  })

  it('should render data usage section', () => {
    const wrapper = mount(PublicPrivacyPolicy)

    expect(wrapper.text()).toContain('4. Finalités du traitement')
  })

  it('should render data sharing section', () => {
    const wrapper = mount(PublicPrivacyPolicy)

    expect(wrapper.text()).toContain('5. Base légale du traitement')
  })

  it('should render data retention section', () => {
    const wrapper = mount(PublicPrivacyPolicy)

    expect(wrapper.text()).toContain('6. Durée de conservation')
  })

  it('should render user rights section', () => {
    const wrapper = mount(PublicPrivacyPolicy)

    expect(wrapper.text()).toContain('8. Vos droits')
  })

  it('should render contact section', () => {
    const wrapper = mount(PublicPrivacyPolicy)

    expect(wrapper.text()).toContain(
      'Contact - Délégué à la Protection des Données'
    )
  })

  it('should render last update date', () => {
    const wrapper = mount(PublicPrivacyPolicy)

    expect(wrapper.text()).toContain('Dernière mise à jour')
  })

  it('should have correct CSS classes', () => {
    const wrapper = mount(PublicPrivacyPolicy)

    expect(wrapper.find('.min-h-screen').exists()).toBe(true)
    expect(wrapper.find('.bg-gray-50').exists()).toBe(true)
    expect(wrapper.find('.bg-white').exists()).toBe(true)
    expect(wrapper.find('.shadow-sm').exists()).toBe(true)
    expect(wrapper.find('.border-b').exists()).toBe(true)
  })

  it('should render header structure', () => {
    const wrapper = mount(PublicPrivacyPolicy)

    expect(wrapper.find('header').exists()).toBe(true)
    expect(wrapper.find('main').exists()).toBe(true)
    expect(wrapper.find('section').exists()).toBe(true)
  })

  it('should render main content', () => {
    const wrapper = mount(PublicPrivacyPolicy)

    expect(wrapper.find('.max-w-4xl').exists()).toBe(true)
    expect(wrapper.find('.mx-auto').exists()).toBe(true)
    expect(wrapper.find('.px-6').exists()).toBe(true)
    expect(wrapper.find('.py-8').exists()).toBe(true)
  })

  it('should render content sections', () => {
    const wrapper = mount(PublicPrivacyPolicy)

    expect(wrapper.find('.space-y-8').exists()).toBe(true)
    expect(wrapper.find('.space-y-3').exists()).toBe(true)
    expect(wrapper.find('.rounded-lg').exists()).toBe(true)
    expect(wrapper.find('.border').exists()).toBe(true)
    expect(wrapper.find('.p-6').exists()).toBe(true)
  })
})
