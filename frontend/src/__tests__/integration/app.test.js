import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import App from '../../App.vue'

// Mock du router
const mockRouter = {
  push: () => {},
  replace: () => {},
  go: () => {},
  back: () => {},
  forward: () => {},
  currentRoute: {
    value: {
      path: '/',
      name: 'home',
    },
  },
}

// Mock du store auth
vi.mock('../../stores/auth', () => ({
  useAuthStore: () => ({
    initializeAuth: vi.fn().mockResolvedValue(),
  }),
}))

describe('Integration Tests - App Component', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should render the main app component', () => {
    const wrapper = mount(App, {
      global: {
        provide: {
          router: mockRouter,
        },
        plugins: [createPinia()],
      },
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('should have loading spinner during initialization', () => {
    const wrapper = mount(App, {
      global: {
        provide: {
          router: mockRouter,
        },
        plugins: [createPinia()],
      },
    })

    // Pendant l'initialisation, le LoadingSpinner devrait être présent
    expect(wrapper.findComponent({ name: 'LoadingSpinner' }).exists()).toBe(
      true
    )
  })
})
