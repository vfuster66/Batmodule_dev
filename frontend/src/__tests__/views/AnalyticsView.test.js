import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AnalyticsView from '../../views/AnalyticsView.vue'

// Mock du composant Layout
vi.mock('../../components/Layout.vue', () => ({
  default: {
    name: 'Layout',
    template: '<div class="layout"><slot /></div>',
  },
}))

// Mock des utilitaires
vi.mock('../../utils/currency', () => ({
  formatCurrency: vi.fn((value) => `${value.toFixed(2)} €`),
  formatShort: vi.fn((value) => `${value}K`),
}))

describe('AnalyticsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render analytics view', () => {
    const wrapper = mount(AnalyticsView)

    expect(wrapper.text()).toContain('CA des 12 derniers mois')
  })

  it('should render revenue chart', () => {
    const wrapper = mount(AnalyticsView)

    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('should render chart elements', () => {
    const wrapper = mount(AnalyticsView)

    expect(wrapper.find('g').exists()).toBe(true)
  })

  it('should have correct CSS classes', () => {
    const wrapper = mount(AnalyticsView)

    expect(wrapper.find('.space-y-6').exists()).toBe(true)
    expect(wrapper.find('.bg-white').exists()).toBe(true)
    expect(wrapper.find('.shadow').exists()).toBe(true)
    expect(wrapper.find('.rounded-lg').exists()).toBe(true)
    expect(wrapper.find('.p-4').exists()).toBe(true)
  })

  it('should render chart container', () => {
    const wrapper = mount(AnalyticsView)

    expect(wrapper.find('.flex').exists()).toBe(true)
    expect(wrapper.find('.items-center').exists()).toBe(true)
    expect(wrapper.find('.justify-between').exists()).toBe(true)
    expect(wrapper.find('.mb-2').exists()).toBe(true)
  })

  it('should render chart title', () => {
    const wrapper = mount(AnalyticsView)

    expect(wrapper.find('.text-lg').exists()).toBe(true)
    expect(wrapper.find('.font-medium').exists()).toBe(true)
    expect(wrapper.find('.text-gray-900').exists()).toBe(true)
  })

  it('should render chart total', () => {
    const wrapper = mount(AnalyticsView)

    expect(wrapper.find('.text-sm').exists()).toBe(true)
    expect(wrapper.find('.text-gray-500').exists()).toBe(true)
  })
})
