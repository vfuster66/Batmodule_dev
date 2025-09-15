import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ComplianceReport from '../../components/ComplianceReport.vue'

describe('ComplianceReport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render compliance report', () => {
    const wrapper = mount(ComplianceReport)

    expect(wrapper.text()).toContain('Rapport de conformité')
  })

  it('should render report sections', () => {
    const wrapper = mount(ComplianceReport)

    expect(wrapper.text()).toContain('Score de conformité')
    expect(wrapper.text()).toContain('À améliorer')
  })

  it('should have correct CSS classes', () => {
    const wrapper = mount(ComplianceReport)

    expect(wrapper.find('.bg-white').exists()).toBe(true)
    expect(wrapper.find('.shadow').exists()).toBe(true)
    expect(wrapper.find('.rounded-lg').exists()).toBe(true)
  })

  it('should render report content', () => {
    const wrapper = mount(ComplianceReport)

    expect(wrapper.find('div').exists()).toBe(true)
  })
})
