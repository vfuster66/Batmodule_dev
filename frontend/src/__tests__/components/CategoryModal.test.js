import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CategoryModal from '../../components/CategoryModal.vue'

// Mock du store
const mockServicesStore = {
  createCategory: vi.fn().mockResolvedValue({ id: 1, name: 'Test Category' }),
  updateCategory: vi
    .fn()
    .mockResolvedValue({ id: 1, name: 'Updated Category' }),
}

vi.mock('../../stores/services', () => ({
  useServicesStore: () => mockServicesStore,
}))

describe('CategoryModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render modal title', () => {
    const wrapper = mount(CategoryModal, {
      props: {
        show: true,
      },
    })

    expect(wrapper.text()).toContain('Nouvelle catégorie')
  })

  it('should render form fields', () => {
    const wrapper = mount(CategoryModal, {
      props: {
        show: true,
      },
    })

    expect(wrapper.find('input[type="text"]').exists()).toBe(true)
    expect(wrapper.find('textarea').exists()).toBe(true)
  })

  it('should render submit button', () => {
    const wrapper = mount(CategoryModal, {
      props: {
        show: true,
      },
    })

    const submitButton = wrapper.find('button[type="submit"]')
    expect(submitButton.exists()).toBe(true)
    expect(submitButton.text()).toContain('Créer')
  })

  it('should have correct CSS classes', () => {
    const wrapper = mount(CategoryModal, {
      props: {
        show: true,
      },
    })

    expect(wrapper.find('.fixed').exists()).toBe(true)
    expect(wrapper.find('.inset-0').exists()).toBe(true)
    expect(wrapper.find('.z-50').exists()).toBe(true)
  })

  it('should render modal overlay', () => {
    const wrapper = mount(CategoryModal, {
      props: {
        show: true,
      },
    })

    expect(wrapper.find('.bg-gray-500').exists()).toBe(true)
    expect(wrapper.find('.bg-opacity-75').exists()).toBe(true)
  })

  it('should render form inputs', () => {
    const wrapper = mount(CategoryModal, {
      props: {
        show: true,
      },
    })

    const nameInput = wrapper.find('input[type="text"]')
    const descriptionTextarea = wrapper.find('textarea')

    expect(nameInput.exists()).toBe(true)
    expect(descriptionTextarea.exists()).toBe(true)
  })
})
