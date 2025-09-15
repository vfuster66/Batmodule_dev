import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import PublicLegalMentions from '../../views/PublicLegalMentions.vue'

describe('PublicLegalMentions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render legal mentions title', () => {
    const wrapper = mount(PublicLegalMentions)

    expect(wrapper.text()).toContain('Mentions Légales')
    expect(wrapper.text()).toContain('Informations légales obligatoires')
  })

  it('should render company information', () => {
    const wrapper = mount(PublicLegalMentions)

    expect(wrapper.text()).toContain("Informations sur l'entreprise")
    expect(wrapper.text()).toContain('FUSTER PEINTURE')
    expect(wrapper.text()).toContain('EURL')
    expect(wrapper.text()).toContain('42023890900022')
    expect(wrapper.text()).toContain('FR42420238909')
    expect(wrapper.text()).toContain('RCS Paris B 420 238 909')
  })

  it('should render address information', () => {
    const wrapper = mount(PublicLegalMentions)

    expect(wrapper.text()).toContain('Siège social')
    expect(wrapper.text()).toContain('27 rue Federico Garcia Lorca')
    expect(wrapper.text()).toContain('66330 Cabestany')
    expect(wrapper.text()).toContain('France')
  })

  it('should render contact information', () => {
    const wrapper = mount(PublicLegalMentions)

    expect(wrapper.text()).toContain('Téléphone')
    expect(wrapper.text()).toContain('06 61 94 55 73')
    expect(wrapper.text()).toContain('Email')
    expect(wrapper.text()).toContain('contact@fuster-peinture.fr')
    expect(wrapper.text()).toContain('Site web')
    expect(wrapper.text()).toContain('https://www.fuster-peinture.fr')
  })

  it('should render hosting information', () => {
    const wrapper = mount(PublicLegalMentions)

    expect(wrapper.text()).toContain('Hébergement')
    expect(wrapper.text()).toContain('OVH SAS')
  })

  it('should render last update date', () => {
    const wrapper = mount(PublicLegalMentions)

    expect(wrapper.text()).toContain('Dernière mise à jour')
  })

  it('should have correct CSS classes', () => {
    const wrapper = mount(PublicLegalMentions)

    expect(wrapper.find('.min-h-screen').exists()).toBe(true)
    expect(wrapper.find('.bg-gray-50').exists()).toBe(true)
    expect(wrapper.find('.bg-white').exists()).toBe(true)
    expect(wrapper.find('.shadow-sm').exists()).toBe(true)
    expect(wrapper.find('.border-b').exists()).toBe(true)
  })

  it('should render header structure', () => {
    const wrapper = mount(PublicLegalMentions)

    expect(wrapper.find('header').exists()).toBe(true)
    expect(wrapper.find('main').exists()).toBe(true)
    expect(wrapper.find('section').exists()).toBe(true)
  })

  it('should render main content', () => {
    const wrapper = mount(PublicLegalMentions)

    expect(wrapper.find('.max-w-4xl').exists()).toBe(true)
    expect(wrapper.find('.mx-auto').exists()).toBe(true)
    expect(wrapper.find('.px-6').exists()).toBe(true)
    expect(wrapper.find('.py-8').exists()).toBe(true)
  })

  it('should render content sections', () => {
    const wrapper = mount(PublicLegalMentions)

    expect(wrapper.find('.space-y-8').exists()).toBe(true)
    expect(wrapper.find('.grid').exists()).toBe(true)
    expect(wrapper.find('.grid-cols-1').exists()).toBe(true)
  })
})
