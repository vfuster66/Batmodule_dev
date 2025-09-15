import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import PublicCGV from '../../views/PublicCGV.vue'

describe('PublicCGV', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render CGV title', () => {
    const wrapper = mount(PublicCGV)

    expect(wrapper.text()).toContain('Conditions Générales de Vente')
    expect(wrapper.text()).toContain('CGV - Fuster Peinture')
  })

  it('should render article 1', () => {
    const wrapper = mount(PublicCGV)

    expect(wrapper.text()).toContain('Article 1 - Objet')
    expect(wrapper.text()).toContain('Fuster Peinture')
  })

  it('should render article 2', () => {
    const wrapper = mount(PublicCGV)

    expect(wrapper.text()).toContain('Article 2 - Devis et commande')
  })

  it('should render article 3', () => {
    const wrapper = mount(PublicCGV)

    expect(wrapper.text()).toContain('Article 3 - Prix')
  })

  it('should render article 4', () => {
    const wrapper = mount(PublicCGV)

    expect(wrapper.text()).toContain('Article 4 - Modalités de paiement')
  })

  it('should render article 5', () => {
    const wrapper = mount(PublicCGV)

    expect(wrapper.text()).toContain('Article 5 - Exécution des travaux')
  })

  it('should render article 6', () => {
    const wrapper = mount(PublicCGV)

    expect(wrapper.text()).toContain('Article 6 - Réception des travaux')
  })

  it('should render article 7', () => {
    const wrapper = mount(PublicCGV)

    expect(wrapper.text()).toContain('Article 7 - Garantie')
  })

  it('should render last update date', () => {
    const wrapper = mount(PublicCGV)

    expect(wrapper.text()).toContain('Dernière mise à jour')
  })

  it('should have correct CSS classes', () => {
    const wrapper = mount(PublicCGV)

    expect(wrapper.find('.min-h-screen').exists()).toBe(true)
    expect(wrapper.find('.bg-gray-50').exists()).toBe(true)
    expect(wrapper.find('.bg-white').exists()).toBe(true)
    expect(wrapper.find('.shadow-sm').exists()).toBe(true)
    expect(wrapper.find('.border-b').exists()).toBe(true)
  })

  it('should render header structure', () => {
    const wrapper = mount(PublicCGV)

    expect(wrapper.find('header').exists()).toBe(true)
    expect(wrapper.find('main').exists()).toBe(true)
    expect(wrapper.find('section').exists()).toBe(true)
  })

  it('should render main content', () => {
    const wrapper = mount(PublicCGV)

    expect(wrapper.find('.max-w-4xl').exists()).toBe(true)
    expect(wrapper.find('.mx-auto').exists()).toBe(true)
    expect(wrapper.find('.px-6').exists()).toBe(true)
    expect(wrapper.find('.py-8').exists()).toBe(true)
  })

  it('should render content sections', () => {
    const wrapper = mount(PublicCGV)

    expect(wrapper.find('.space-y-8').exists()).toBe(true)
    expect(wrapper.find('.space-y-3').exists()).toBe(true)
    expect(wrapper.find('.rounded-lg').exists()).toBe(true)
    expect(wrapper.find('.border').exists()).toBe(true)
    expect(wrapper.find('.p-6').exists()).toBe(true)
  })
})
