// ============================================================
// 库存模块类型定义 (Inventory Module Types)
// 对应 库存管理.html 的 8 个页面功能
// ============================================================

// ---------- 基础枚举 ----------

export type InventoryPlatform = 'amazon' | 'shopee' | 'lazada' | 'all'
export type FbaStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'in_transit'
export type AlertLevel = 'info' | 'warning' | 'danger'

// ---------- 库存仪表盘 ----------

export type InventoryStats = {
  totalQuantity: number
  totalQuantityTrend: number // 较上周百分比
  skuCount: number
  skuCountNew: number
  lowStockCount: number
  lowStockTrend: 'danger' | 'normal'
  stockDays: number // 周转天数
  stockDaysChange: number
  inTransitCount: number
  outboundOrders: number
  pendingInbound: number
}

// ---------- 库存商品 ----------

export type InventoryProduct = {
  id: string
  sku: string
  title: string
  platform: InventoryPlatform
  fbaStock: number // FBA 库存
  fbmStock: number // FBM 库存
  inTransit: number // 在途
  reserved: number // 预留
  available: number // 可用
  sales30d: number // 近30天销量
  sales7d: number // 近7天销量
  avgDailySales: number
  stockDays: number // 库存天数
  replenishmentQty: number // 建议补货量
  lastInboundDate: string
  status: FbaStatus
  alertLevel: AlertLevel
  alertMessage: string
  imageUrl?: string
}

// ---------- 补货计算 ----------

export type ReplenishmentRow = {
  sku: string
  title: string
  currentStock: number
  inTransit: number
  availableStock: number
  sales7d: number
  sales30d: number
  avgDailySales: number
  stockDays: number
  safeStockDays: number // 安全库存天数
  replenishFactor: number // 补货系数
  suggestedQty: number // 建议补货量
  leadDays: number // 交期天数
}

export type ReplenishmentCalc = {
  id: string
  uploadedAt: string
  safeStockDays: number
  replenishFactor: number
  analysisPeriod: '7d' | '30d' | '90d'
  rows: ReplenishmentRow[]
  totalSuggested: number
  totalCost: number
  estimatedFreight: number
}

export type ReplenishmentCalcInput = {
  safeStockDays: number
  replenishFactor: number
  analysisPeriod: '7d' | '30d' | '90d'
  rows: ReplenishmentRow[]
}

// ---------- FBA 入库 ----------

export type InboundRecord = {
  id: string
  shipmentId: string
  sku: string
  title: string
  inboundDate: string
  quantity: number
  warehouse: string
  status: 'pending' | 'in_transit' | 'received' | 'damaged'
  notes?: string
}

// ---------- 补货预警 ----------

export type AlertRule = {
  id: string
  name: string
  skuPattern: string // 支持通配符，如 "ABC-*"
  thresholdType: 'days' | 'quantity' | 'percentage'
  thresholdValue: number
  alertLevel: AlertLevel
  enabled: boolean
}

export type InventoryAlert = {
  id: string
  sku: string
  title: string
  alertLevel: AlertLevel
  message: string
  currentStock: number
  suggestedAction: string
  createdAt: string
  read: boolean
}

// ---------- 销售分析 ----------

export type SalesDataPoint = {
  date: string
  sales: number
  revenue: number
  orders: number
  returnRate: number
}

export type SalesAnalysis = {
  period: '7d' | '30d' | '90d'
  totalSales: number
  totalRevenue: number
  totalOrders: number
  avgOrderValue: number
  returnRate: number
  topSku: string
  topSkuSales: number
  dataPoints: SalesDataPoint[]
}

// ---------- 系统设置 ----------

export type InventorySettings = {
  defaultSafeStockDays: number
  defaultReplenishFactor: number
  defaultLeadDays: number
  alertEnabled: boolean
  alertEmail: string
  currency: 'CNY' | 'USD'
  autoRefreshInterval: number // 分钟，0=不自动刷新
}

// ---------- 筛选 & 列表 ----------

export type InventoryFilter = {
  search: string
  platform: InventoryPlatform | 'all'
  status: FbaStatus | 'all'
  alertLevel: AlertLevel | 'all'
  sortBy: 'sku' | 'stock' | 'sales' | 'updated'
  sortOrder: 'asc' | 'desc'
  page: number
  pageSize: number
}

export type PaginatedResult<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ---------- CSV 导入/导出 ----------

export type CsvParseResult = {
  success: boolean
  rows: number
  errors: string[]
  data: Partial<ReplenishmentRow>[]
}

export type ExportFormat = 'csv' | 'xlsx'