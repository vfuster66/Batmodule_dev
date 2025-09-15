import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LoadingSpinner from '../../components/LoadingSpinner.vue'

describe('LoadingSpinner', () => {
  it('should render with default message', () => {
    const wrapper = mount(LoadingSpinner)

    expect(wrapper.text()).toContain('Chargement...')
    expect(wrapper.find('.animate-spin').exists()).toBe(true)
  })

  it('should render with custom message', () => {
    const wrapper = mount(LoadingSpinner, {
      props: {
        message: 'Loading data...',
      },
    })

    expect(wrapper.text()).toContain('Loading data...')
  })

  it('should have correct CSS classes', () => {
    const wrapper = mount(LoadingSpinner)

    expect(wrapper.find('.fixed').exists()).toBe(true)
    expect(wrapper.find('.bg-gray-500').exists()).toBe(true)
    expect(wrapper.find('.bg-opacity-75').exists()).toBe(true)
    expect(wrapper.find('.flex').exists()).toBe(true)
    expect(wrapper.find('.items-center').exists()).toBe(true)
    expect(wrapper.find('.justify-center').exists()).toBe(true)
    expect(wrapper.find('.z-50').exists()).toBe(true)
  })

  it('should have spinner element', () => {
    const wrapper = mount(LoadingSpinner)

    const spinner = wrapper.find('.animate-spin')
    expect(spinner.exists()).toBe(true)
    expect(spinner.classes()).toContain('rounded-full')
    expect(spinner.classes()).toContain('h-8')
    expect(spinner.classes()).toContain('w-8')
    expect(spinner.classes()).toContain('border-b-2')
    expect(spinner.classes()).toContain('border-blue-cobalt')
  })

  it('should have message element', () => {
    const wrapper = mount(LoadingSpinner)

    const messageElement = wrapper.find('span')
    expect(messageElement.exists()).toBe(true)
    expect(messageElement.classes()).toContain('text-gray-900')
    expect(messageElement.classes()).toContain('dark:text-white')
    expect(messageElement.classes()).toContain('font-medium')
  })
})
