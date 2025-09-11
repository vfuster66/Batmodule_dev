import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

describe('LoadingSpinner', () => {
  it('should render with default message', () => {
    const wrapper = mount(LoadingSpinner)

    expect(wrapper.text()).toContain('Chargement...')
    expect(wrapper.find('.animate-spin').exists()).toBe(true)
    expect(wrapper.find('.bg-white').exists()).toBe(true)
  })

  it('should render with custom message', () => {
    const customMessage = 'Sauvegarde en cours...'
    const wrapper = mount(LoadingSpinner, {
      props: {
        message: customMessage,
      },
    })

    expect(wrapper.text()).toContain(customMessage)
    expect(wrapper.text()).not.toContain('Chargement...')
  })

  it('should have correct CSS classes', () => {
    const wrapper = mount(LoadingSpinner)

    const container = wrapper.find('.fixed.inset-0')
    expect(container.exists()).toBe(true)
    expect(container.classes()).toContain('bg-gray-500')
    expect(container.classes()).toContain('bg-opacity-75')
    expect(container.classes()).toContain('flex')
    expect(container.classes()).toContain('items-center')
    expect(container.classes()).toContain('justify-center')
    expect(container.classes()).toContain('z-50')
  })

  it('should have spinning animation', () => {
    const wrapper = mount(LoadingSpinner)

    const spinner = wrapper.find('.animate-spin')
    expect(spinner.exists()).toBe(true)
    expect(spinner.classes()).toContain('rounded-full')
    expect(spinner.classes()).toContain('h-8')
    expect(spinner.classes()).toContain('w-8')
    expect(spinner.classes()).toContain('border-b-2')
    expect(spinner.classes()).toContain('border-blue-cobalt')
  })

  it('should have dark mode support', () => {
    const wrapper = mount(LoadingSpinner)

    const modal = wrapper.find('.bg-white.dark\\:bg-gray-800')
    expect(modal.exists()).toBe(true)

    const text = wrapper.find('.text-gray-900.dark\\:text-white')
    expect(text.exists()).toBe(true)
  })
})
