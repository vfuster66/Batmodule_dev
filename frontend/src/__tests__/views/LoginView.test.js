import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../../views/LoginView.vue'

// Mock du store
const mockAuthStore = {
  login: vi.fn().mockResolvedValue({ success: true }),
}

vi.mock('../../stores/auth', () => ({
  useAuthStore: () => mockAuthStore,
}))

describe('LoginView', () => {
  let router

  beforeEach(() => {
    vi.clearAllMocks()

    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/login', component: LoginView },
        { path: '/register', component: { template: '<div>Register</div>' } },
      ],
    })
  })

  it('should render login form', () => {
    const wrapper = mount(LoginView, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).toContain('Connexion à BatModule')
    expect(wrapper.find('form').exists()).toBe(true)
  })

  it('should render logo', () => {
    const wrapper = mount(LoginView, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.find('.bg-blue-cobalt').exists()).toBe(true)
    expect(wrapper.text()).toContain('B')
  })

  it('should render email input', () => {
    const wrapper = mount(LoginView, {
      global: {
        plugins: [router],
      },
    })

    const emailInput = wrapper.find('input[type="email"]')
    expect(emailInput.exists()).toBe(true)
    expect(emailInput.attributes('id')).toBe('email')
  })

  it('should render password input', () => {
    const wrapper = mount(LoginView, {
      global: {
        plugins: [router],
      },
    })

    const passwordInput = wrapper.find('input[type="password"]')
    expect(passwordInput.exists()).toBe(true)
    expect(passwordInput.attributes('id')).toBe('password')
  })

  it('should render login button', () => {
    const wrapper = mount(LoginView, {
      global: {
        plugins: [router],
      },
    })

    const loginButton = wrapper.find('button[type="submit"]')
    expect(loginButton.exists()).toBe(true)
    expect(loginButton.text()).toContain('Se connecter')
  })

  it('should render form fields', () => {
    const wrapper = mount(LoginView, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).toContain('Adresse email')
    expect(wrapper.text()).toContain('Mot de passe')
  })
})
