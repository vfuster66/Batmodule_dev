import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ProfileView from '../../views/ProfileView.vue'

// Mock du composant Layout
vi.mock('../../components/Layout.vue', () => ({
  default: {
    name: 'Layout',
    template: '<div class="layout"><slot /></div>',
  },
}))

// Mock du store auth
const mockAuthStore = {
  user: {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
  },
  loading: false,
  error: null,
}

vi.mock('../../stores/auth', () => ({
  useAuthStore: () => mockAuthStore,
}))

describe('ProfileView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render profile form', () => {
    const wrapper = mount(ProfileView)

    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.find('input').exists()).toBe(true)
  })

  it('should render form fields', () => {
    const wrapper = mount(ProfileView)

    expect(wrapper.text()).toContain('Prénom')
    expect(wrapper.text()).toContain('Nom')
    expect(wrapper.text()).toContain('Email')
  })
})
