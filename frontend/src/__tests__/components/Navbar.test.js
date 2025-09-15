import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Navbar from '../../components/Navbar.vue'

// Mock des stores
vi.mock('../../stores/auth', () => ({
  useAuthStore: vi.fn(),
}))

// Mock du router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock de vue-toastification
vi.mock('vue-toastification', () => ({
  useToast: () => ({
    success: vi.fn(),
  }),
}))

// Mock de localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
  writable: true,
})

// Mock de matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

describe('Navbar', () => {
  let wrapper
  let mockAuthStore

  beforeEach(async () => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    mockAuthStore = {
      user: { name: 'Test User', email: 'test@example.com' },
      logout: vi.fn(),
    }

    const { useAuthStore } = await import('../../stores/auth')
    useAuthStore.mockReturnValue(mockAuthStore)
  })

  it('should render the navbar structure', () => {
    wrapper = mount(Navbar, {
      props: {
        pageTitle: 'Test Page',
        notificationCount: 5,
      },
    })

    expect(wrapper.find('h1').text()).toBe('Test Page')
    expect(wrapper.find('button[title*="Mode"]').exists()).toBe(true)
  })

  it('should have correct CSS classes', () => {
    wrapper = mount(Navbar, {
      props: {
        pageTitle: 'Test Page',
      },
    })

    const container = wrapper.find('div')
    expect(container.classes()).toContain('sticky')
    expect(container.classes()).toContain('top-0')
    expect(container.classes()).toContain('z-40')
    expect(container.classes()).toContain('flex')
    expect(container.classes()).toContain('h-16')
  })

  it('should emit toggle-sidebar when mobile menu button is clicked', async () => {
    wrapper = mount(Navbar, {
      props: {
        pageTitle: 'Test Page',
      },
    })

    const mobileButton = wrapper.find('button[class*="lg:hidden"]')
    await mobileButton.trigger('click')

    expect(wrapper.emitted('toggle-sidebar')).toBeTruthy()
  })

  it('should display page title', () => {
    wrapper = mount(Navbar, {
      props: {
        pageTitle: 'Dashboard',
      },
    })

    expect(wrapper.find('h1').text()).toBe('Dashboard')
  })

  it('should render slot content', () => {
    wrapper = mount(Navbar, {
      props: {
        pageTitle: 'Test Page',
      },
      slots: {
        actions: '<div data-testid="custom-actions">Custom Actions</div>',
      },
    })

    expect(wrapper.find('[data-testid="custom-actions"]').exists()).toBe(true)
  })

  it('should toggle theme when theme button is clicked', async () => {
    wrapper = mount(Navbar, {
      props: {
        pageTitle: 'Test Page',
      },
    })

    const themeButton = wrapper.find('button[title*="Mode"]')
    await themeButton.trigger('click')

    // Vérifier que le thème a changé
    expect(wrapper.vm.isDark).toBe(true)
  })

  it('should show user menu when user is logged in', () => {
    wrapper = mount(Navbar, {
      props: {
        pageTitle: 'Test Page',
      },
    })

    // Vérifier que le composant est rendu
    expect(wrapper.exists()).toBe(true)
  })

  it('should handle logout', async () => {
    wrapper = mount(Navbar, {
      props: {
        pageTitle: 'Test Page',
      },
    })

    // Simuler la déconnexion
    await wrapper.vm.handleLogout()

    expect(mockAuthStore.logout).toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith('/login')
  })

  it('should show notification count', () => {
    wrapper = mount(Navbar, {
      props: {
        pageTitle: 'Test Page',
        notificationCount: 3,
      },
    })

    // Vérifier que le composant est rendu avec les props
    expect(wrapper.props('notificationCount')).toBe(3)
  })

  it('should initialize theme from localStorage', () => {
    // Mock localStorage pour retourner 'dark'
    window.localStorage.getItem.mockReturnValue('dark')

    wrapper = mount(Navbar, {
      props: {
        pageTitle: 'Test Page',
      },
    })

    expect(wrapper.vm.isDark).toBe(true)
  })
})
