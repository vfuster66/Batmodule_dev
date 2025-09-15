import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Layout from '../../components/Layout.vue'

// Mock des composants
vi.mock('../../components/Sidebar.vue', () => ({
  default: {
    name: 'Sidebar',
    template: '<div class="sidebar">Sidebar</div>',
    props: ['sidebarOpen'],
    emits: ['toggle'],
  },
}))

vi.mock('../../components/Navbar.vue', () => ({
  default: {
    name: 'Navbar',
    template: '<div class="navbar">Navbar</div>',
    props: ['pageTitle', 'notificationCount'],
    emits: ['toggle-sidebar'],
  },
}))

// Mock du router
vi.mock('vue-router', () => ({
  useRoute: () => ({
    meta: { title: 'Test Page' },
  }),
}))

describe('Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render sidebar', () => {
    const wrapper = mount(Layout)

    expect(wrapper.findComponent({ name: 'Sidebar' }).exists()).toBe(true)
  })

  it('should render navbar', () => {
    const wrapper = mount(Layout)

    expect(wrapper.findComponent({ name: 'Navbar' }).exists()).toBe(true)
  })

  it('should render main content area', () => {
    const wrapper = mount(Layout)

    expect(wrapper.find('main').exists()).toBe(true)
  })

  it('should render slot content', () => {
    const wrapper = mount(Layout, {
      slots: {
        default: '<div class="test-content">Test Content</div>',
      },
    })

    expect(wrapper.find('.test-content').exists()).toBe(true)
    expect(wrapper.text()).toContain('Test Content')
  })
})
