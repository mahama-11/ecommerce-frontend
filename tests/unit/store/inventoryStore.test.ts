import { beforeEach, describe, expect, it, vi } from 'vitest'

const service = vi.hoisted(() => ({
  getInventoryStats: vi.fn(),
  getInventoryList: vi.fn(),
  getAlerts: vi.fn(),
  getInboundRecords: vi.fn(),
  getSalesAnalysis: vi.fn(),
  getInventorySettings: vi.fn(),
  getStoredCalcs: vi.fn(),
  calculateReplenishment: vi.fn(),
  saveReplenishmentCalc: vi.fn(),
  markAlertRead: vi.fn(),
  saveInventorySettings: vi.fn(),
}))

vi.mock('@/services/inventory', () => service)

import { useInventoryStore } from '@/store/inventoryStore'

const defaultFilter = {
  search: '',
  platform: 'all',
  status: 'all',
  alertLevel: 'all',
  sortBy: 'sku',
  sortOrder: 'asc',
  page: 1,
  pageSize: 20,
}

function resetInventoryStore() {
  useInventoryStore.setState({
    stats: null,
    products: [],
    totalProducts: 0,
    alerts: [],
    inboundRecords: [],
    salesAnalysis: null,
    settings: null,
    calcHistory: [],
    currentCalc: null,
    filter: { ...defaultFilter },
    loadingStats: false,
    loadingProducts: false,
    loadingAlerts: false,
    loadingInbound: false,
    loadingSales: false,
    loadingSettings: false,
    calculating: false,
  })
}

describe('inventoryStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetInventoryStore()
  })

  it('starts with default filter and empty data', () => {
    const state = useInventoryStore.getState()
    expect(state.filter).toEqual(defaultFilter)
    expect(state.products).toEqual([])
    expect(state.totalProducts).toBe(0)
  })

  it('setFilter merges partial filter and resets page by default', () => {
    useInventoryStore.getState().setFilter({ page: 3 })
    useInventoryStore.getState().setFilter({ search: 'sku' })
    expect(useInventoryStore.getState().filter).toMatchObject({ search: 'sku', page: 1 })
  })

  it('setFilter preserves explicit page when provided', () => {
    useInventoryStore.getState().setFilter({ search: 'sku', page: 4 })
    expect(useInventoryStore.getState().filter.page).toBe(4)
  })

  it('resetFilter restores default filter', () => {
    useInventoryStore.getState().setFilter({ search: 'abc', page: 9, platform: 'amazon' })
    useInventoryStore.getState().resetFilter()
    expect(useInventoryStore.getState().filter).toEqual(defaultFilter)
  })

  it('loadStats stores stats and clears loading flag', async () => {
    service.getInventoryStats.mockResolvedValue({ totalQuantity: 1, skuCount: 2 })
    await useInventoryStore.getState().loadStats()
    expect(useInventoryStore.getState().stats).toEqual({ totalQuantity: 1, skuCount: 2 })
    expect(useInventoryStore.getState().loadingStats).toBe(false)
  })

  it('loadStats clears loading flag after failure', async () => {
    service.getInventoryStats.mockRejectedValue(new Error('fail'))
    await expect(useInventoryStore.getState().loadStats()).rejects.toThrow('fail')
    expect(useInventoryStore.getState().loadingStats).toBe(false)
  })

  it('loadProducts sends current filter and stores paginated result', async () => {
    service.getInventoryList.mockResolvedValue({ items: [{ sku: 'SKU-1' }], total: 1 })
    useInventoryStore.getState().setFilter({ search: 'SKU-1' })
    await useInventoryStore.getState().loadProducts()
    expect(service.getInventoryList).toHaveBeenCalledWith(expect.objectContaining({ search: 'SKU-1' }))
    expect(useInventoryStore.getState().products).toEqual([{ sku: 'SKU-1' }])
    expect(useInventoryStore.getState().totalProducts).toBe(1)
    expect(useInventoryStore.getState().loadingProducts).toBe(false)
  })

  it('loadAlerts stores alerts', async () => {
    service.getAlerts.mockResolvedValue([{ id: 'a1', read: false }])
    await useInventoryStore.getState().loadAlerts()
    expect(useInventoryStore.getState().alerts).toEqual([{ id: 'a1', read: false }])
  })

  it('loadInbound stores inbound records', async () => {
    service.getInboundRecords.mockResolvedValue([{ id: 'in-1' }])
    await useInventoryStore.getState().loadInbound()
    expect(useInventoryStore.getState().inboundRecords).toEqual([{ id: 'in-1' }])
  })

  it('loadSales uses default 30d period', async () => {
    service.getSalesAnalysis.mockResolvedValue({ period: '30d' })
    await useInventoryStore.getState().loadSales()
    expect(service.getSalesAnalysis).toHaveBeenCalledWith('30d')
    expect(useInventoryStore.getState().salesAnalysis).toEqual({ period: '30d' })
  })

  it('loadSales accepts custom period', async () => {
    service.getSalesAnalysis.mockResolvedValue({ period: '7d' })
    await useInventoryStore.getState().loadSales('7d')
    expect(service.getSalesAnalysis).toHaveBeenCalledWith('7d')
  })

  it('loadSettings stores settings', async () => {
    service.getInventorySettings.mockResolvedValue({ currency: 'USD' })
    await useInventoryStore.getState().loadSettings()
    expect(useInventoryStore.getState().settings).toEqual({ currency: 'USD' })
  })

  it('loadCalcHistory reads stored calculations', () => {
    service.getStoredCalcs.mockReturnValue([{ id: 'calc-1' }])
    useInventoryStore.getState().loadCalcHistory()
    expect(useInventoryStore.getState().calcHistory).toEqual([{ id: 'calc-1' }])
  })

  it('calculateReplenishment stores current calc and clears loading', async () => {
    service.calculateReplenishment.mockResolvedValue({ id: 'calc-1', rows: [] })
    const result = await useInventoryStore.getState().calculateReplenishment(14, 1.2, '30d')
    expect(service.calculateReplenishment).toHaveBeenCalledWith(14, 1.2, '30d')
    expect(result).toEqual({ id: 'calc-1', rows: [] })
    expect(useInventoryStore.getState().currentCalc).toEqual({ id: 'calc-1', rows: [] })
    expect(useInventoryStore.getState().calculating).toBe(false)
  })

  it('calculateReplenishment clears calculating flag after failure', async () => {
    service.calculateReplenishment.mockRejectedValue(new Error('calc fail'))
    await expect(useInventoryStore.getState().calculateReplenishment(14, 1, '7d')).rejects.toThrow('calc fail')
    expect(useInventoryStore.getState().calculating).toBe(false)
  })

  it('saveCurrentCalc is a no-op when no current calc exists', () => {
    useInventoryStore.getState().saveCurrentCalc()
    expect(service.saveReplenishmentCalc).not.toHaveBeenCalled()
  })

  it('saveCurrentCalc persists current calc and refreshes history', () => {
    useInventoryStore.setState({ currentCalc: { id: 'calc-1' } as never })
    service.getStoredCalcs.mockReturnValue([{ id: 'calc-1' }])
    useInventoryStore.getState().saveCurrentCalc()
    expect(service.saveReplenishmentCalc).toHaveBeenCalledWith({ id: 'calc-1' })
    expect(useInventoryStore.getState().calcHistory).toEqual([{ id: 'calc-1' }])
  })

  it('clearCurrentCalc removes current calc', () => {
    useInventoryStore.setState({ currentCalc: { id: 'calc-1' } as never })
    useInventoryStore.getState().clearCurrentCalc()
    expect(useInventoryStore.getState().currentCalc).toBeNull()
  })

  it('markAlertRead calls service and marks target alert read', async () => {
    useInventoryStore.setState({ alerts: [{ id: 'a1', read: false }, { id: 'a2', read: false }] as never })
    service.markAlertRead.mockResolvedValue(undefined)
    await useInventoryStore.getState().markAlertRead('a1')
    expect(service.markAlertRead).toHaveBeenCalledWith('a1')
    expect(useInventoryStore.getState().alerts).toEqual([{ id: 'a1', read: true }, { id: 'a2', read: false }])
  })

  it('saveSettings calls service and stores settings', async () => {
    service.saveInventorySettings.mockResolvedValue(undefined)
    await useInventoryStore.getState().saveSettings({ currency: 'USD' } as never)
    expect(service.saveInventorySettings).toHaveBeenCalledWith({ currency: 'USD' })
    expect(useInventoryStore.getState().settings).toEqual({ currency: 'USD' })
  })
})
