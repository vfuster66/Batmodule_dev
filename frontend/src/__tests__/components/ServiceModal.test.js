import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ServiceModal from '../../components/ServiceModal.vue'

describe('ServiceModal', () => {
  let wrapper

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the modal structure', () => {
    wrapper = mount(ServiceModal, {
      props: {
        isOpen: true,
      },
    })

    expect(wrapper.find('div[role="dialog"]').exists()).toBe(true)
    expect(wrapper.find('div[aria-modal="true"]').exists()).toBe(true)
    expect(wrapper.find('h3[id="modal-title"]').text()).toBe('Nouveau service')
  })

  it('should show edit title when isEdit is true', () => {
    wrapper = mount(ServiceModal, {
      props: {
        isOpen: true,
        isEdit: true,
      },
    })

    expect(wrapper.find('h3[id="modal-title"]').text()).toBe(
      'Modifier le service'
    )
  })

  it('should emit close when overlay is clicked', async () => {
    wrapper = mount(ServiceModal, {
      props: {
        isOpen: true,
      },
    })

    const overlay = wrapper.find('div[aria-hidden="true"]')
    await overlay.trigger('click')

    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('should emit close when close button is clicked', async () => {
    wrapper = mount(ServiceModal, {
      props: {
        isOpen: true,
      },
    })

    const closeButton = wrapper.find('button[type="button"]')
    await closeButton.trigger('click')

    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('should have correct CSS classes', () => {
    wrapper = mount(ServiceModal, {
      props: {
        isOpen: true,
      },
    })

    const modal = wrapper.find('div[role="dialog"]')
    expect(modal.classes()).toContain('fixed')
    expect(modal.classes()).toContain('inset-0')
    expect(modal.classes()).toContain('z-50')
    expect(modal.classes()).toContain('overflow-y-auto')
  })

  it('should render form fields', () => {
    wrapper = mount(ServiceModal, {
      props: {
        isOpen: true,
      },
    })

    expect(wrapper.find('input[type="text"]').exists()).toBe(true)
    expect(wrapper.find('textarea').exists()).toBe(true)
    expect(wrapper.find('input[type="number"]').exists()).toBe(true)
  })

  it('should have submit and cancel buttons', () => {
    wrapper = mount(ServiceModal, {
      props: {
        isOpen: true,
      },
    })

    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBeGreaterThanOrEqual(2)

    // Vérifier qu'il y a un bouton de soumission et un bouton d'annulation
    const buttonTexts = buttons.map((button) => button.text())
    expect(
      buttonTexts.some(
        (text) => text.includes('Créer') || text.includes('Sauvegarder')
      )
    ).toBe(true)
    expect(buttonTexts.some((text) => text.includes('Annuler'))).toBe(true)
  })

  it('should emit save when form is submitted with valid data', async () => {
    wrapper = mount(ServiceModal, {
      props: {
        isOpen: true,
      },
    })

    // Remplir le formulaire
    const nameInput = wrapper.find('input[type="text"]')
    await nameInput.setValue('Test Service')

    const priceInputs = wrapper.findAll('input[type="number"]')
    if (priceInputs.length >= 2) {
      await priceInputs[0].setValue(100) // Prix HT
      await priceInputs[1].setValue(120) // Prix TTC
    }

    // Soumettre le formulaire
    const form = wrapper.find('form')
    await form.trigger('submit')

    expect(wrapper.emitted('save')).toBeTruthy()
    expect(wrapper.emitted('save')[0][0]).toMatchObject({
      name: 'Test Service',
    })
  })

  it('should validate required fields', async () => {
    wrapper = mount(ServiceModal, {
      props: {
        isOpen: true,
      },
    })

    // Essayer de soumettre sans données
    const form = wrapper.find('form')
    await form.trigger('submit')

    // Le formulaire ne devrait pas être soumis si les champs requis sont vides
    expect(wrapper.emitted('save')).toBeFalsy()
  })

  it('should handle service prop for editing', () => {
    const serviceData = {
      id: '1',
      name: 'Existing Service',
      description: 'Test description',
      price_ht: 100,
      price_ttc: 120,
    }

    wrapper = mount(ServiceModal, {
      props: {
        isOpen: true,
        service: serviceData,
        isEdit: true,
      },
    })

    // Vérifier que le composant est rendu
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('h3[id="modal-title"]').text()).toBe(
      'Modifier le service'
    )
  })

  it('should format currency correctly', () => {
    wrapper = mount(ServiceModal, {
      props: {
        isOpen: true,
      },
    })

    // Tester la fonction formatCurrency
    const formatted = wrapper.vm.formatCurrency(100)
    expect(formatted).toContain('100')
    expect(formatted).toContain('€')
  })

  it('should handle categories prop', () => {
    const categories = [
      { id: '1', name: 'Category 1' },
      { id: '2', name: 'Category 2' },
    ]

    wrapper = mount(ServiceModal, {
      props: {
        isOpen: true,
        categories: categories,
      },
    })

    // Vérifier que le composant est rendu avec les catégories
    expect(wrapper.exists()).toBe(true)
  })
})
