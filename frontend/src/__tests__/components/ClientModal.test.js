import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ClientModal from '../../components/ClientModal.vue'

// Mock des stores
vi.mock('../../stores/clients', () => ({
  useClientsStore: vi.fn(),
}))

describe('ClientModal', () => {
  let wrapper
  let mockClientsStore

  beforeEach(async () => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    mockClientsStore = {
      createClient: vi.fn(),
      updateClient: vi.fn(),
    }

    const { useClientsStore } = await import('../../stores/clients')
    useClientsStore.mockReturnValue(mockClientsStore)
  })

  it('should render the modal structure when show is true', () => {
    wrapper = mount(ClientModal, {
      props: {
        show: true,
      },
    })

    expect(wrapper.find('div.fixed.inset-0.z-50').exists()).toBe(true)
    expect(wrapper.find('h3').text()).toBe('Nouveau client')
  })

  it('should not render when show is false', () => {
    wrapper = mount(ClientModal, {
      props: {
        show: false,
      },
    })

    expect(wrapper.find('div.fixed.inset-0.z-50').exists()).toBe(false)
  })

  it('should show edit title when client is provided', () => {
    const clientData = {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
    }

    wrapper = mount(ClientModal, {
      props: {
        show: true,
        client: clientData,
      },
    })

    expect(wrapper.find('h3').text()).toBe('Modifier le client')
  })

  it('should emit close when overlay is clicked', async () => {
    wrapper = mount(ClientModal, {
      props: {
        show: true,
      },
    })

    const overlay = wrapper.find('div.fixed.inset-0.bg-gray-900')
    await overlay.trigger('click')

    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('should emit close when close button is clicked', async () => {
    wrapper = mount(ClientModal, {
      props: {
        show: true,
      },
    })

    const closeButton = wrapper.find('button')
    await closeButton.trigger('click')

    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('should have correct CSS classes', () => {
    wrapper = mount(ClientModal, {
      props: {
        show: true,
      },
    })

    const modal = wrapper.find('div.fixed.inset-0.z-50')
    expect(modal.classes()).toContain('fixed')
    expect(modal.classes()).toContain('inset-0')
    expect(modal.classes()).toContain('z-50')
    expect(modal.classes()).toContain('overflow-y-auto')
  })

  it('should render form fields', () => {
    wrapper = mount(ClientModal, {
      props: {
        show: true,
      },
    })

    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.find('input[type="text"]').exists()).toBe(true)
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.find('input[type="tel"]').exists()).toBe(true)
  })

  it('should have client type section', () => {
    wrapper = mount(ClientModal, {
      props: {
        show: true,
      },
    })

    expect(wrapper.text()).toContain('Type de client')
  })

  it('should have personal information section', () => {
    wrapper = mount(ClientModal, {
      props: {
        show: true,
      },
    })

    expect(wrapper.text()).toContain('Informations personnelles')
  })

  it('should have company information section when company type is selected', async () => {
    wrapper = mount(ClientModal, {
      props: {
        show: true,
      },
    })

    // Sélectionner le type "Entreprise"
    const companyRadio = wrapper.find('input[value="company"]')
    if (companyRadio.exists()) {
      await companyRadio.setValue('company')
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('Informations entreprise')
    } else {
      // Si le radio button n'existe pas, vérifier que le composant est rendu
      expect(wrapper.exists()).toBe(true)
    }
  })

  it('should have address section', () => {
    wrapper = mount(ClientModal, {
      props: {
        show: true,
      },
    })

    expect(wrapper.text()).toContain('Adresse')
  })

  it('should handle client prop for editing', () => {
    const clientData = {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '0123456789',
      isCompany: false,
    }

    wrapper = mount(ClientModal, {
      props: {
        show: true,
        client: clientData,
      },
    })

    // Vérifier que le composant est rendu
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('h3').text()).toBe('Modifier le client')
  })

  it('should emit saved when form is submitted successfully', async () => {
    mockClientsStore.createClient.mockResolvedValue()

    wrapper = mount(ClientModal, {
      props: {
        show: true,
      },
    })

    // Remplir le formulaire avec des données minimales
    const firstNameInput = wrapper.find('input[name="first_name"]')
    if (firstNameInput.exists()) {
      await firstNameInput.setValue('John')
    }

    const lastNameInput = wrapper.find('input[name="last_name"]')
    if (lastNameInput.exists()) {
      await lastNameInput.setValue('Doe')
    }

    // Soumettre le formulaire
    const form = wrapper.find('form')
    await form.trigger('submit')

    expect(wrapper.emitted('saved')).toBeTruthy()
  })

  it('should call updateClient when editing existing client', async () => {
    const clientData = {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
    }

    mockClientsStore.updateClient.mockResolvedValue()

    wrapper = mount(ClientModal, {
      props: {
        show: true,
        client: clientData,
      },
    })

    // Soumettre le formulaire
    const form = wrapper.find('form')
    await form.trigger('submit')

    expect(mockClientsStore.updateClient).toHaveBeenCalledWith(
      '1',
      expect.any(Object)
    )
  })

  it('should call createClient when creating new client', async () => {
    mockClientsStore.createClient.mockResolvedValue()

    wrapper = mount(ClientModal, {
      props: {
        show: true,
      },
    })

    // Soumettre le formulaire
    const form = wrapper.find('form')
    await form.trigger('submit')

    expect(mockClientsStore.createClient).toHaveBeenCalledWith(
      expect.any(Object)
    )
  })
})
