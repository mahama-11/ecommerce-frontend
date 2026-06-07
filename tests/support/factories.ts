export type FactoryOverrides<T> = Partial<T>

export type ProductFactoryRecord = {
  id: string
  product_id: string
  sku_code: string
  skuCode: string
  title: string
  status: string
  asset_status: string
  listing_status: string
  export_status: string
  created_at: string
  updated_at: string
}

export function productFactory(overrides: FactoryOverrides<ProductFactoryRecord> = {}): ProductFactoryRecord {
  const now = new Date().toISOString()
  return {
    id: 'test-product-1',
    product_id: 'test-product-1',
    sku_code: 'TEST-SKU-001',
    skuCode: 'TEST-SKU-001',
    title: 'Test Product',
    status: 'ready',
    asset_status: 'ready',
    listing_status: 'ready',
    export_status: 'ready',
    created_at: now,
    updated_at: now,
    ...overrides,
  }
}

export type ListingVersionFactoryRecord = {
  id: string
  version_no: number
  version_label: string
  status: string
  title: string
  description: string
  platform: string
  site: string
  locale: string
  created_at: string
}

export function listingVersionFactory(overrides: FactoryOverrides<ListingVersionFactoryRecord> = {}): ListingVersionFactoryRecord {
  return {
    id: 'test-listing-1',
    version_no: 1,
    version_label: 'v1',
    status: 'draft',
    title: 'Test listing draft',
    description: 'Test listing description',
    platform: 'amazon',
    site: 'US',
    locale: 'en_US',
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

export type InventoryProductFactoryRecord = {
  id: string
  sku: string
  title: string
  platform: string
  fbaStock: number
  fbmStock: number
  inTransit: number
  reserved: number
  available: number
  sales7d: number
  sales30d: number
  avgDailySales: number
  stockDays: number
  replenishmentQty: number
  lastInboundDate: string
  status: string
  alertLevel: string
  alertMessage: string
  imageUrl: string
}

export function inventoryProductFactory(overrides: FactoryOverrides<InventoryProductFactoryRecord> = {}): InventoryProductFactoryRecord {
  return {
    id: 'inv-1',
    sku: 'INV-001',
    title: 'Inventory Product',
    platform: 'amazon',
    fbaStock: 100,
    fbmStock: 10,
    inTransit: 20,
    reserved: 5,
    available: 80,
    sales7d: 15,
    sales30d: 60,
    avgDailySales: 2,
    stockDays: 40,
    replenishmentQty: 0,
    lastInboundDate: '2026-05-01',
    status: 'in_stock',
    alertLevel: 'info',
    alertMessage: '',
    imageUrl: '',
    ...overrides,
  }
}
