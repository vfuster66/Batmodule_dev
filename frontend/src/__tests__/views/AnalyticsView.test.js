import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AnalyticsView from '../../views/AnalyticsView.vue'
import api from '../../utils/api'

// Mock du composant Layout
vi.mock('../../components/Layout.vue', () => ({
  default: {
    name: 'Layout',
    template: '<div class="layout"><slot /></div>',
  },
}))

// Mock de l'API
vi.mock('../../utils/api', () => ({
  default: {
    get: vi.fn(),
  },
}))

// Mock de ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

describe('AnalyticsView', () => {
  const mockAnalyticsData = {
    revenueByMonth: [
      { label: '2024-01', value: 1500 },
      { label: '2024-02', value: 2200 },
      { label: '2024-03', value: 1800 },
    ],
    quotesMonthly: [
      { label: '2024-01', accepted: 2, sent: 5 },
      { label: '2024-02', accepted: 3, sent: 4 },
      { label: '2024-03', accepted: 1, sent: 6 },
    ],
    pipelineSentByMonth: [
      { label: '2024-01', value: 3000 },
      { label: '2024-02', value: 2500 },
      { label: '2024-03', value: 4000 },
    ],
    topClients90: [
      { id: 1, name: 'Client A', company: 'Company A', total: 5000 },
      { id: 2, name: 'Client B', company: 'Company B', total: 3000 },
    ],
    outstandingAging: {
      o0_30: 1000,
      o31_60: 500,
      o61_90: 200,
      o90_plus: 100,
      dueSoon: 800,
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockResolvedValue({ data: mockAnalyticsData })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should render analytics view with all sections', async () => {
    const wrapper = mount(AnalyticsView)
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('CA des 12 derniers mois')
    expect(wrapper.text()).toContain('Devis par mois')
    expect(wrapper.text()).toContain('Top clients (90 jours)')
    expect(wrapper.text()).toContain('Aging encours')
    expect(wrapper.text()).toContain('Pipeline devis (envoyés)')
  })

  it('should call API on mount', async () => {
    mount(AnalyticsView)
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(api.get).toHaveBeenCalledWith('/dashboard/analytics')
  })

  it('should render revenue chart with SVG', async () => {
    const wrapper = mount(AnalyticsView)
    await wrapper.vm.$nextTick()

    const svgs = wrapper.findAll('svg')
    expect(svgs.length).toBeGreaterThan(0)
    expect(svgs[0].exists()).toBe(true)
  })

  it('should format currency correctly', async () => {
    const wrapper = mount(AnalyticsView)
    await wrapper.vm.$nextTick()

    // Test de la fonction formatCurrency
    const result = wrapper.vm.formatCurrency(1500)
    expect(result).toMatch(/1[\s\u202f]500,00\s€/)
  })

  it('should format short numbers correctly', async () => {
    const wrapper = mount(AnalyticsView)
    await wrapper.vm.$nextTick()

    // Test de la fonction formatShort avec arrondi inférieur
    expect(wrapper.vm.formatShort(1500)).toBe('1k')
    expect(wrapper.vm.formatShort(1999)).toBe('1k') // Arrondi inférieur
    expect(wrapper.vm.formatShort(2000)).toBe('2k')
    expect(wrapper.vm.formatShort(1500000)).toBe('1.5M')
  })

  it('should format month labels correctly', async () => {
    const wrapper = mount(AnalyticsView)
    await wrapper.vm.$nextTick()

    // Test de la fonction shortMonth
    expect(wrapper.vm.shortMonth('2024-06')).toBe('juin')
    expect(wrapper.vm.shortMonth('2024-07')).toBe('juil')
    expect(wrapper.vm.shortMonth('2024-01')).toBe('jan')
    expect(wrapper.vm.shortMonth('2024-12')).toBe('déc')
  })

  it('should handle empty data gracefully', async () => {
    api.get.mockResolvedValue({ data: {} })
    const wrapper = mount(AnalyticsView)
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Aucune donnée')
  })

  it('should handle API errors gracefully', async () => {
    api.get.mockRejectedValue(new Error('API Error'))
    const wrapper = mount(AnalyticsView)
    await wrapper.vm.$nextTick()

    // Le composant ne devrait pas planter
    expect(wrapper.exists()).toBe(true)
  })

  it('should display top clients data', async () => {
    const wrapper = mount(AnalyticsView)
    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(wrapper.text()).toContain('Company A')
    expect(wrapper.text()).toContain('Company B')
  })

  it('should display aging data', async () => {
    const wrapper = mount(AnalyticsView)
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('0–30j retard')
    expect(wrapper.text()).toContain('31–60j retard')
    expect(wrapper.text()).toContain('61–90j retard')
    expect(wrapper.text()).toContain('> 90j retard')
  })

  it('should have responsive chart dimensions', async () => {
    const wrapper = mount(AnalyticsView)
    await wrapper.vm.$nextTick()

    // Vérifier que les dimensions sont réactives
    expect(wrapper.vm.width).toBeDefined()
    expect(wrapper.vm.innerW).toBeDefined()
    expect(wrapper.vm.innerH).toBeDefined()
  })

  it('should calculate chart bars correctly', async () => {
    const wrapper = mount(AnalyticsView)
    await wrapper.vm.$nextTick()

    const revenueBars = wrapper.vm.revenueBars
    expect(revenueBars).toBeDefined()
    expect(Array.isArray(revenueBars)).toBe(true)
  })

  it('should calculate line points correctly', async () => {
    const wrapper = mount(AnalyticsView)
    await wrapper.vm.$nextTick()

    const acceptedSeries = wrapper.vm.acceptedSeries
    const linePoints = wrapper.vm.linePoints(acceptedSeries)
    expect(linePoints).toBeDefined()
    expect(typeof linePoints).toBe('string')
  })
})
