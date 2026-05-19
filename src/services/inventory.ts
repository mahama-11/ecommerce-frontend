// ============================================================
// 库存管理服务层 (Inventory Service)
// 预留 apiBase 调用格式 + mock fallback
// 后端 inventory API 就绪后替换 mock 逻辑即可
// ============================================================

import type {
  InventoryStats,
  InventoryProduct,
  InventoryFilter,
  PaginatedResult,
  ReplenishmentCalc,
  InboundRecord,
  InventoryAlert,
  SalesAnalysis,
  InventorySettings,
  CsvParseResult,
} from '@/types/inventory'
import { request } from './http'

// ---------- Mock 数据 ----------

const MOCK_STATS: InventoryStats = {
  totalQuantity: 18642,
  totalQuantityTrend: 8.4,
  skuCount: 326,
  skuCountNew: 12,
  lowStockCount: 17,
  lowStockTrend: 'danger',
  stockDays: 28,
  stockDaysChange: -3,
  inTransitCount: 2430,
  outboundOrders: 89,
  pendingInbound: 5,
}

const MOCK_PRODUCTS: InventoryProduct[] = [
  {
    id: '1', sku: 'SKU-001', title: 'Wireless Bluetooth Earbuds Pro',
    platform: 'amazon', fbaStock: 342, fbmStock: 56, inTransit: 120,
    reserved: 20, available: 322, sales30d: 890, sales7d: 267,
    avgDailySales: 29.7, stockDays: 11, replenishmentQty: 180,
    lastInboundDate: '2026-04-28', status: 'low_stock', alertLevel: 'warning',
    alertMessage: '库存低于 15 天，建议补货', imageUrl: '',
  },
  {
    id: '2', sku: 'SKU-002', title: 'Smart Watch Series 5',
    platform: 'amazon', fbaStock: 1200, fbmStock: 230, inTransit: 0,
    reserved: 50, available: 1150, sales30d: 420, sales7d: 98,
    avgDailySales: 14, stockDays: 85, replenishmentQty: 0,
    lastInboundDate: '2026-05-10', status: 'in_stock', alertLevel: 'info',
    alertMessage: '', imageUrl: '',
  },
  {
    id: '3', sku: 'SKU-003', title: 'USB-C Fast Charger 65W',
    platform: 'amazon', fbaStock: 0, fbmStock: 12, inTransit: 500,
    reserved: 10, available: 0, sales30d: 1560, sales7d: 520,
    avgDailySales: 52, stockDays: 0, replenishmentQty: 520,
    lastInboundDate: '', status: 'out_of_stock', alertLevel: 'danger',
    alertMessage: '缺货！紧急补货', imageUrl: '',
  },
  {
    id: '4', sku: 'SKU-004', title: 'Portable Power Bank 20000mAh',
    platform: 'shopee', fbaStock: 580, fbmStock: 88, inTransit: 200,
    reserved: 30, available: 550, sales30d: 620, sales7d: 186,
    avgDailySales: 20.7, stockDays: 28, replenishmentQty: 80,
    lastInboundDate: '2026-05-01', status: 'in_stock', alertLevel: 'info',
    alertMessage: '', imageUrl: '',
  },
  {
    id: '5', sku: 'SKU-005', title: 'Mechanical Keyboard RGB',
    platform: 'amazon', fbaStock: 45, fbmStock: 30, inTransit: 0,
    reserved: 10, available: 35, sales30d: 280, sales7d: 72,
    avgDailySales: 9.3, stockDays: 5, replenishmentQty: 150,
    lastInboundDate: '2026-04-20', status: 'low_stock', alertLevel: 'danger',
    alertMessage: '库存低于 7 天，紧急补货', imageUrl: '',
  },
  {
    id: '6', sku: 'SKU-006', title: 'Laptop Stand Aluminum',
    platform: 'lazada', fbaStock: 890, fbmStock: 120, inTransit: 0,
    reserved: 40, available: 850, sales30d: 310, sales7d: 88,
    avgDailySales: 10.3, stockDays: 86, replenishmentQty: 0,
    lastInboundDate: '2026-05-08', status: 'in_stock', alertLevel: 'info',
    alertMessage: '', imageUrl: '',
  },
]

const MOCK_ALERTS: InventoryAlert[] = [
  {
    id: 'a1', sku: 'SKU-003', title: 'USB-C Fast Charger 65W',
    alertLevel: 'danger', message: '库存为 0，建议立即补货 520 件',
    currentStock: 0, suggestedAction: '紧急补货 520 件，预计 7 天到货',
    createdAt: '2026-05-18T09:30:00Z', read: false,
  },
  {
    id: 'a2', sku: 'SKU-005', title: 'Mechanical Keyboard RGB',
    alertLevel: 'warning', message: '库存仅剩 5 天，建议补货 150 件',
    currentStock: 45, suggestedAction: '补货 150 件，预计交期 10 天',
    createdAt: '2026-05-17T14:20:00Z', read: false,
  },
  {
    id: 'a3', sku: 'SKU-001', title: 'Wireless Bluetooth Earbuds Pro',
    alertLevel: 'warning', message: '库存低于 15 天，建议补货',
    currentStock: 342, suggestedAction: '补货 180 件，预计交期 5 天',
    createdAt: '2026-05-16T11:00:00Z', read: true,
  },
]

const MOCK_INBOUND: InboundRecord[] = [
  {
    id: 'i1', shipmentId: 'SHP-2026-0501', sku: 'SKU-001',
    title: 'Wireless Bluetooth Earbuds Pro',
    inboundDate: '2026-05-01', quantity: 500, warehouse: 'Amazon US-West',
    status: 'received', notes: '正常入库',
  },
  {
    id: 'i2', shipmentId: 'SHP-2026-0510', sku: 'SKU-002',
    title: 'Smart Watch Series 5',
    inboundDate: '2026-05-10', quantity: 300, warehouse: 'Amazon US-East',
    status: 'in_transit', notes: '运输中，预计 5-20 到货',
  },
  {
    id: 'i3', shipmentId: 'SHP-2026-0515', sku: 'SKU-003',
    title: 'USB-C Fast Charger 65W',
    inboundDate: '2026-05-15', quantity: 500, warehouse: 'Amazon US-West',
    status: 'pending', notes: '等待发货',
  },
]

const MOCK_SALES: SalesAnalysis = {
  period: '30d',
  totalSales: 3880,
  totalRevenue: 186420,
  totalOrders: 1240,
  avgOrderValue: 150.3,
  returnRate: 2.1,
  topSku: 'SKU-003',
  topSkuSales: 1560,
  dataPoints: [
    { date: '2026-04-19', sales: 120, revenue: 5760, orders: 38, returnRate: 1.5 },
    { date: '2026-04-20', sales: 135, revenue: 6480, orders: 42, returnRate: 0.8 },
    { date: '2026-04-21', sales: 98, revenue: 4704, orders: 31, returnRate: 2.2 },
    { date: '2026-04-22', sales: 156, revenue: 7488, orders: 50, returnRate: 1.0 },
    { date: '2026-04-23', sales: 142, revenue: 6816, orders: 45, returnRate: 1.8 },
    { date: '2026-04-24', sales: 168, revenue: 8064, orders: 53, returnRate: 0.5 },
    { date: '2026-04-25', sales: 175, revenue: 8400, orders: 55, returnRate: 2.0 },
  ],
}

const MOCK_SETTINGS: InventorySettings = {
  defaultSafeStockDays: 14,
  defaultReplenishFactor: 1.0,
  defaultLeadDays: 7,
  alertEnabled: true,
  alertEmail: 'wang@example.com',
  currency: 'USD',
  autoRefreshInterval: 30,
}

// ---------- API 服务函数 ----------

/**
 * 获取库存仪表盘统计
 */
export async function getInventoryStats(): Promise<InventoryStats> {
  try {
    return await request<InventoryStats>('/api/v1/ecommerce/inventory/stats')
  } catch {
    return MOCK_STATS
  }
}

/**
 * 获取库存商品列表（支持分页、筛选）
 */
export async function getInventoryList(
  filter: InventoryFilter
): Promise<PaginatedResult<InventoryProduct>> {
  try {
    return await request<PaginatedResult<InventoryProduct>>('/api/v1/ecommerce/inventory/products', {
      method: 'POST',
      body: JSON.stringify(filter),
    })
  } catch {
    const filtered = MOCK_PRODUCTS.filter(p => {
      if (filter.search && !p.sku.toLowerCase().includes(filter.search.toLowerCase()) &&
          !p.title.toLowerCase().includes(filter.search.toLowerCase())) return false
      if (filter.platform !== 'all' && p.platform !== filter.platform) return false
      if (filter.status !== 'all' && p.status !== filter.status) return false
      if (filter.alertLevel !== 'all' && p.alertLevel !== filter.alertLevel) return false
      return true
    })
    const pageSize = filter.pageSize || 20
    const page = filter.page || 1
    const start = (page - 1) * pageSize
    return {
      items: filtered.slice(start, start + pageSize),
      total: filtered.length,
      page,
      pageSize,
      totalPages: Math.ceil(filtered.length / pageSize),
    }
  }
}

/**
 * 获取补货计算记录列表
 */
export async function getReplenishmentCalcs(): Promise<ReplenishmentCalc[]> {
  try {
    return await request<ReplenishmentCalc[]>('/api/v1/ecommerce/inventory/replenishment')
  } catch {
    return []
  }
}

/**
 * 执行补货计算
 */
export async function calculateReplenishment(
  safeStockDays: number,
  replenishFactor: number,
  period: '7d' | '30d' | '90d' = '30d'
): Promise<ReplenishmentCalc> {
  try {
    return await request<ReplenishmentCalc>('/api/v1/ecommerce/inventory/replenishment/calculate', {
      method: 'POST',
      body: JSON.stringify({ safeStockDays, replenishFactor, period }),
    })
  } catch {
    // Mock 计算逻辑
    const rows = MOCK_PRODUCTS.map(p => {
      const avgDaily = period === '7d' ? p.sales7d / 7 : period === '30d' ? p.sales30d / 30 : p.sales30d / 90
      const safeQty = Math.ceil(avgDaily * safeStockDays)
      const suggestedQty = Math.max(0, Math.ceil(safeQty * replenishFactor - p.available))
      return {
        sku: p.sku,
        title: p.title,
        currentStock: p.fbaStock + p.fbmStock,
        inTransit: p.inTransit,
        availableStock: p.available,
        sales7d: p.sales7d,
        sales30d: p.sales30d,
        avgDailySales: avgDaily,
        stockDays: p.stockDays,
        safeStockDays,
        replenishFactor,
        suggestedQty,
        leadDays: 7,
      }
    })
    return {
      id: `calc-${Date.now()}`,
      uploadedAt: new Date().toISOString(),
      safeStockDays,
      replenishFactor,
      analysisPeriod: period,
      rows,
      totalSuggested: rows.reduce((sum, r) => sum + r.suggestedQty, 0),
      totalCost: rows.reduce((sum, r) => sum + r.suggestedQty * 12, 0), // 假设单价 $12
      estimatedFreight: rows.reduce((sum, r) => sum + r.suggestedQty, 0) * 0.5,
    }
  }
}

/**
 * 保存补货计算结果（本地持久化）
 */
export function saveReplenishmentCalc(calc: ReplenishmentCalc): void {
  const existing = getStoredCalcs()
  const updated = [calc, ...existing].slice(0, 20) // 最多保留 20 条
  localStorage.setItem('inventory_calcs', JSON.stringify(updated))
}

/**
 * 获取历史补货计算记录（本地）
 */
export function getStoredCalcs(): ReplenishmentCalc[] {
  try {
    const raw = localStorage.getItem('inventory_calcs')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/**
 * 解析 CSV 数据
 */
export async function parseCsv(text: string): Promise<CsvParseResult> {
  try {
    return await request<CsvParseResult>('/api/v1/ecommerce/inventory/csv/parse', {
      method: 'POST',
      body: JSON.stringify({ csv: text }),
    })
  } catch {
    const lines = text.trim().split('\n')
    const headers = lines[0]?.split(',').map(h => h.trim().toLowerCase()) ?? []
    const errors: string[] = []
    const data: Partial<InventoryProduct>[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      if (values.length < headers.length) {
        errors.push(`行 ${i + 1}: 列数不匹配`)
        continue
      }
      const row: Partial<InventoryProduct> = {}
      headers.forEach((h, idx) => {
        const val = values[idx]
        if (h === 'sku') row.sku = val
        else if (h === 'title' || h === 'name') row.title = val
        else if (h === 'fba_stock' || h === 'fbaStock') row.fbaStock = Number(val) || 0
        else if (h === 'fbm_stock' || h === 'fbmStock') row.fbmStock = Number(val) || 0
        else if (h === 'in_transit' || h === 'inTransit') row.inTransit = Number(val) || 0
        else if (h === 'reserved') row.reserved = Number(val) || 0
        else if (h === 'sales_7d' || h === 'sales7d') row.sales7d = Number(val) || 0
        else if (h === 'sales_30d' || h === 'sales30d') row.sales30d = Number(val) || 0
      })
      if (row.sku) data.push(row)
      else errors.push(`行 ${i + 1}: 缺少 SKU`)
    }

    return { success: errors.length === 0, rows: data.length, errors, data }
  }
}

/**
 * 导出补货计算结果为 CSV
 */
export function exportReplenishmentCsv(calc: ReplenishmentCalc): void {
  const header = 'SKU,商品名称,当前库存,在途,可用库存,7日销量,30日销量,日均销量,库存天数,安全库存天数,补货系数,建议补货量,交期天数\n'
  const rows = calc.rows.map(r =>
    `${r.sku},${r.title},${r.currentStock},${r.inTransit},${r.availableStock},${r.sales7d},${r.sales30d},${r.avgDailySales.toFixed(1)},${r.stockDays},${r.safeStockDays},${r.replenishFactor},${r.suggestedQty},${r.leadDays}`
  ).join('\n')
  downloadCsv(header + rows, `replenishment_${calc.uploadedAt.slice(0, 10)}.csv`)
}

function downloadCsv(content: string, filename: string): void {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/**
 * 下载补货模板 CSV
 */
export function downloadTemplateCsv(): void {
  const template = 'sku,title,fba_stock,fbm_stock,in_transit,reserved,sales_7d,sales_30d\nSKU-001,示例商品,100,20,0,10,50,200'
  downloadCsv(template, 'replenishment_template.csv')
}

/**
 * 获取 FBA 入库记录
 */
export async function getInboundRecords(): Promise<InboundRecord[]> {
  try {
    return await request<InboundRecord[]>('/api/v1/ecommerce/inventory/inbound')
  } catch {
    return MOCK_INBOUND
  }
}

/**
 * 获取补货预警列表
 */
export async function getAlerts(): Promise<InventoryAlert[]> {
  try {
    return await request<InventoryAlert[]>('/api/v1/ecommerce/inventory/alerts')
  } catch {
    return MOCK_ALERTS
  }
}

/**
 * 标记预警已读
 */
export async function markAlertRead(alertId: string): Promise<void> {
  try {
    await request(`/api/v1/ecommerce/inventory/alerts/${alertId}/read`, { method: 'PATCH' })
  } catch {
    const alerts = MOCK_ALERTS.map(a => a.id === alertId ? { ...a, read: true } : a)
    localStorage.setItem('inventory_alerts', JSON.stringify(alerts))
  }
}

/**
 * 获取销售分析数据
 */
export async function getSalesAnalysis(
  period: '7d' | '30d' | '90d' = '30d'
): Promise<SalesAnalysis> {
  try {
    return await request<SalesAnalysis>(`/api/v1/ecommerce/inventory/sales?period=${period}`)
  } catch {
    return { ...MOCK_SALES, period }
  }
}

/**
 * 获取系统设置
 */
export async function getInventorySettings(): Promise<InventorySettings> {
  try {
    return await request<InventorySettings>('/api/v1/ecommerce/inventory/settings')
  } catch {
    try {
      const raw = localStorage.getItem('inventory_settings')
      return raw ? JSON.parse(raw) : MOCK_SETTINGS
    } catch {
      return MOCK_SETTINGS
    }
  }
}

/**
 * 保存系统设置
 */
export async function saveInventorySettings(settings: InventorySettings): Promise<void> {
  try {
    await request('/api/v1/ecommerce/inventory/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    })
  } catch {
    localStorage.setItem('inventory_settings', JSON.stringify(settings))
  }
}