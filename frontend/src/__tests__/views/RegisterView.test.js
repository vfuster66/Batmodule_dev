import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import RegisterView from '../../views/RegisterView.vue'

// Mock du store
const mockAuthStore = {
  register: vi.fn().mockResolvedValue({ success: true }),
}

vi.mock('../../stores/auth', () => ({
  useAuthStore: () => mockAuthStore,
}))

describe('RegisterView', () => {
  let router

  beforeEach(() => {
    vi.clearAllMocks()

    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/register', component: RegisterView },
        { path: '/login', component: { template: '<div>Login</div>' } },
      ],
    })
  })

  it('should render register form', () => {
    const wrapper = mount(RegisterView, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).toContain('Créer un compte BatModule')
    expect(wrapper.find('form').exists()).toBe(true)
  })

  it('should render logo', () => {
    const wrapper = mount(RegisterView, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.find('.bg-blue-cobalt').exists()).toBe(true)
    expect(wrapper.text()).toContain('B')
  })

  it('should render first name input', () => {
    const wrapper = mount(RegisterView, {
      global: {
        plugins: [router],
      },
    })

    const firstNameInput = wrapper.find('input[id="firstName"]')
    expect(firstNameInput.exists()).toBe(true)
    expect(firstNameInput.attributes('type')).toBe('text')
  })

  it('should render last name input', () => {
    const wrapper = mount(RegisterView, {
      global: {
        plugins: [router],
      },
    })

    const lastNameInput = wrapper.find('input[id="lastName"]')
    expect(lastNameInput.exists()).toBe(true)
    expect(lastNameInput.attributes('type')).toBe('text')
  })

  it('should render email input', () => {
    const wrapper = mount(RegisterView, {
      global: {
        plugins: [router],
      },
    })

    const emailInput = wrapper.find('input[type="email"]')
    expect(emailInput.exists()).toBe(true)
    expect(emailInput.attributes('id')).toBe('email')
  })

  it('should render password input', () => {
    const wrapper = mount(RegisterView, {
      global: {
        plugins: [router],
      },
    })

    const passwordInput = wrapper.find('input[type="password"]')
    expect(passwordInput.exists()).toBe(true)
    expect(passwordInput.attributes('id')).toBe('password')
  })

  it('should render confirm password input', () => {
    const wrapper = mount(RegisterView, {
      global: {
        plugins: [router],
      },
    })

    const confirmPasswordInput = wrapper.find('input[id="confirmPassword"]')
    expect(confirmPasswordInput.exists()).toBe(true)
    expect(confirmPasswordInput.attributes('type')).toBe('password')
  })

  it('should render register button', () => {
    const wrapper = mount(RegisterView, {
      global: {
        plugins: [router],
      },
    })

    const registerButton = wrapper.find('button[type="submit"]')
    expect(registerButton.exists()).toBe(true)
    expect(registerButton.text()).toContain('Créer mon compte')
  })

  it('should render form fields', () => {
    const wrapper = mount(RegisterView, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).toContain('Prénom')
    expect(wrapper.text()).toContain('Nom')
    expect(wrapper.text()).toContain('Adresse email')
    expect(wrapper.text()).toContain('Mot de passe')
    expect(wrapper.text()).toContain('Confirmer le mot de passe')
  })

  it('should render terms checkbox', () => {
    const wrapper = mount(RegisterView, {
      global: {
        plugins: [router],
      },
    })

    const checkbox = wrapper.find('input[type="checkbox"]')
    expect(checkbox.exists()).toBe(true)
    expect(wrapper.text()).toContain("J'accepte les")
  })
})
