import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import LegalMentions from '../../components/LegalMentions.vue'

// Mock du store
const mockCompanyStore = {
  settings: {
    company_name: 'Test Company',
    legal_name: 'Test Company Legal',
    forme_juridique: 'SARL',
    capital_social: 10000,
    siret: '12345678901234',
    vat_number: 'FR12345678901',
    rcs_number: 'RCS123456',
    address_line1: '123 Test St',
    postal_code: '75001',
    city: 'Paris',
    country: 'France',
    phone: '0123456789',
    email: 'test@example.com',
    website: 'https://test.com',
    displayName: 'Test Company Display',
  },
}

vi.mock('../../stores/company', () => ({
  useCompanyStore: () => mockCompanyStore,
}))

describe('LegalMentions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render legal mentions title', () => {
    const wrapper = mount(LegalMentions)

    expect(wrapper.text()).toContain('Mentions légales')
  })

  it('should render company name', () => {
    const wrapper = mount(LegalMentions)

    expect(wrapper.text()).toContain('Test Company Display')
  })

  it('should render legal information', () => {
    const wrapper = mount(LegalMentions)

    expect(wrapper.text()).toContain('Forme juridique :')
    expect(wrapper.text()).toContain('SARL')
    expect(wrapper.text()).toContain('SIRET :')
    expect(wrapper.text()).toContain('12345678901234')
    expect(wrapper.text()).toContain('N° TVA :')
    expect(wrapper.text()).toContain('FR12345678901')
  })

  it('should render contact information', () => {
    const wrapper = mount(LegalMentions)

    expect(wrapper.text()).toContain('0123456789')
    expect(wrapper.text()).toContain('test@example.com')
    expect(wrapper.text()).toContain('https://test.com')
  })
})
