// ============================================================
// 库存管理 Zustand Store
// 管理库存模块全局状态
// ============================================================

import { create } from 'zustand'
import type {
  InventoryProduct,
  InventoryStats,
  InventoryFilter,
  ReplenishmentCalc,
  InboundRecord,
  InventoryAlert,
  SalesAnalysis,
  InventorySettings,
} from '@/types/inventory'
import * as inventoryService from '@/services/inventory'

type InventoryState = {
  // 数据
  stats: InventoryStats | null
  products: InventoryProduct[]
  totalProducts: number
  alerts: InventoryAlert[]
  inboundRecords: InboundRecord[]
  salesAnalysis: SalesAnalysis | null
  settings: InventorySettings | null
  calcHistory: ReplenishmentCalc[]
  currentCalc: ReplenishmentCalc | null

  // 筛选
  filter: InventoryFilter

  // 状态标志
  loadingStats: boolean
  loadingProducts: boolean
  loadingAlerts: boolean
  loadingInbound: boolean
  loadingSales: boolean
  loadingSettings: boolean
  calculating: boolean

  // 操作
  setFilter: (partial: Partial<InventoryFilter>) => void
  resetFilter: () => void

  loadStats: () => Promise<void>
  loadProducts: () => Promise<void>
  loadAlerts: () => Promise<void>
  loadInbound: () => Promise<void>
  loadSales: (period?: '7d' | '30d' | '90d') => Promise<void>
  loadSettings: () => Promise<void>
  loadCalcHistory: () => void

  calculateReplenishment: (
    safeStockDays: number,
    replenishFactor: number,
    period: '7d' | '30d' | '90d'
  ) => Promise<ReplenishmentCalc>
  saveCurrentCalc: () => void
  clearCurrentCalc: () => void

  markAlertRead: (alertId: string) => Promise<void>
  saveSettings: (settings: InventorySettings) => Promise<void>
}

const DEFAULT_FILTER: InventoryFilter = {
  search: '',
  platform: 'all',
  status: 'all',
  alertLevel: 'all',
  sortBy: 'sku',
  sortOrder: 'asc',
  page: 1,
  pageSize: 20,
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  // 初始状态
  stats: null,
  products: [],
  totalProducts: 0,
  alerts: [],
  inboundRecords: [],
  salesAnalysis: null,
  settings: null,
  calcHistory: [],
  currentCalc: null,

  filter: { ...DEFAULT_FILTER },

  // 筛选操作
  setFilter: (partial) => {
    set(state => ({
      filter: { ...state.filter, ...partial, page: partial.page ?? 1 },
    }))
  },

  resetFilter: () => set({ filter: { ...DEFAULT_FILTER } }),

  // 加载仪表盘统计
  loadStats: async () => {
    set({ loadingStats: true })
    try {
      const stats = await inventoryService.getInventoryStats()
      set({ stats })
    } finally {
      set({ loadingStats: false })
    }
  },

  // 加载库存列表
  loadProducts: async () => {
    set({ loadingProducts: true })
    try {
      const { filter } = get()
      const result = await inventoryService.getInventoryList(filter)
      set({ products: result.items, totalProducts: result.total })
    } finally {
      set({ loadingProducts: false })
    }
  },

  // 加载预警列表
  loadAlerts: async () => {
    set({ loadingAlerts: true })
    try {
      const alerts = await inventoryService.getAlerts()
      set({ alerts })
    } finally {
      set({ loadingAlerts: false })
    }
  },

  // 加载入库记录
  loadInbound: async () => {
    set({ loadingInbound: true })
    try {
      const inboundRecords = await inventoryService.getInboundRecords()
      set({ inboundRecords })
    } finally {
      set({ loadingInbound: false })
    }
  },

  // 加载销售分析
  loadSales: async (period = '30d') => {
    set({ loadingSales: true })
    try {
      const salesAnalysis = await inventoryService.getSalesAnalysis(period)
      set({ salesAnalysis })
    } finally {
      set({ loadingSales: false })
    }
  },

  // 加载系统设置
  loadSettings: async () => {
    set({ loadingSettings: true })
    try {
      const settings = await inventoryService.getInventorySettings()
      set({ settings })
    } finally {
      set({ loadingSettings: false })
    }
  },

  // 加载计算历史（本地）
  loadCalcHistory: () => {
    const calcHistory = inventoryService.getStoredCalcs()
    set({ calcHistory })
  },

  // 执行补货计算
  calculateReplenishment: async (safeStockDays, replenishFactor, period) => {
    set({ calculating: true })
    try {
      const calc = await inventoryService.calculateReplenishment(safeStockDays, replenishFactor, period)
      set({ currentCalc: calc })
      return calc
    } finally {
      set({ calculating: false })
    }
  },

  // 保存当前计算结果
  saveCurrentCalc: () => {
    const { currentCalc } = get()
    if (!currentCalc) return
    inventoryService.saveReplenishmentCalc(currentCalc)
    const calcHistory = inventoryService.getStoredCalcs()
    set({ calcHistory })
  },

  // 清除当前计算
  clearCurrentCalc: () => set({ currentCalc: null }),

  // 标记预警已读
  markAlertRead: async (alertId) => {
    await inventoryService.markAlertRead(alertId)
    set(state => ({
      alerts: state.alerts.map(a => a.id === alertId ? { ...a, read: true } : a),
    }))
  },

  // 保存设置
  saveSettings: async (settings) => {
    await inventoryService.saveInventorySettings(settings)
    set({ settings })
  },
}))