import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import App from '../App.vue'

// Mock des dépendances
vi.mock('../stores/auth', () => ({
  useAuthStore: () => ({
    initializeAuth: vi.fn().mockResolvedValue(),
  }),
}))

vi.mock('../components/LoadingSpinner.vue', () => ({
  default: {
    name: 'LoadingSpinner',
    template: '<div class="loading-spinner">Loading...</div>',
    props: ['message'],
  },
}))

describe('App', () => {
  let router

  beforeEach(() => {
    vi.clearAllMocks()

    router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/', component: { template: '<div>Home</div>' } }],
    })
  })

  it('should render loading spinner initially', () => {
    const wrapper = mount(App, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.find('.loading-spinner').exists()).toBe(true)
  })

  it('should have correct app structure', () => {
    const wrapper = mount(App, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.find('#app').exists()).toBe(true)
  })
})
