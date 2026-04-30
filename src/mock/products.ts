import type { ProductListItem, ProductStatus, Product, ListingVersion, ProfitSnapshot, ExportTask } from '@/types/product'

const NOW = new Date().toISOString()

const MOCK_ASSETS_BASE = 'https://picsum.photos'

function randomAsset(id: string, role: string, primary = false) {
  const width = Math.floor(Math.random() * 400) + 800
  const height = Math.floor(Math.random() * 400) + 800
  return {
    id: `asset-${id}`,
    assetId: `asset-${id}`,
    assetType: 'image' as const,
    assetRole: role as any,
    isPrimary: primary,
    thumbnailUrl: `${MOCK_ASSETS_BASE}/200/200?random=${id}`,
    originalUrl: `${MOCK_ASSETS_BASE}/${width}/${height}?random=${id}`,
    mimeType: 'image/jpeg',
    width,
    height,
    createdAt: NOW,
    sourceJobId: `job-${id}`,
    isFavorited: Math.random() > 0.6,
  }
}

const PRODUCT_LIST_ITEMS: ProductListItem[] = [
  {
    id: 'prod-001',
    organizationId: 'org-default',
    skuCode: 'SKU-2025-TSHIRT-001',
    spuId: 'SPU-2025-TSHIRT',
    title: 'Cotton Crew Neck T-Shirt, White',
    categoryId: 'cat-apparel-men-tops',
    brandId: 'brand-generic',
    specJson: '{"Size":"M","Color":"White","Material":"100% Cotton"}',
    costJson: '{"price":12.5}',
    costCurrency: 'USD',
    tags: ['Best Seller', 'Summer', 'Cotton'],
    status: 'export_ready',
    assetStatus: 'ready',
    listingStatus: 'ready',
    exportStatus: 'done',
    assetsCount: 6,
    listingVersionsCount: 2,
    hasPrimaryAsset: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'prod-002',
    organizationId: 'org-default',
    skuCode: 'SKU-2025-HAT-001',
    spuId: 'SPU-2025-HAT',
    title: 'Baseball Cap, Black',
    categoryId: 'cat-apparel-accessories',
    brandId: 'brand-generic',
    specJson: '{"Size":"Adjustable","Color":"Black","Material":"Cotton Twill"}',
    costJson: '{"price":5.5}',
    costCurrency: 'USD',
    tags: ['New', 'Accessories'],
    status: 'listing_ready',
    assetStatus: 'ready',
    listingStatus: 'ready',
    exportStatus: 'pending',
    assetsCount: 3,
    listingVersionsCount: 0,
    hasPrimaryAsset: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'prod-003',
    organizationId: 'org-default',
    skuCode: 'SKU-2025-SHOES-001',
    spuId: 'SPU-2025-SHOES',
    title: 'Running Shoes, Gray',
    categoryId: 'cat-shoes-running',
    brandId: 'brand-generic',
    specJson: '{"Size":"42","Color":"Gray","Material":"Mesh"}',
    costJson: '{"price":32.0}',
    costCurrency: 'USD',
    tags: ['Draft'],
    status: 'draft',
    assetStatus: 'partial',
    listingStatus: 'missing',
    exportStatus: 'pending',
    assetsCount: 1,
    listingVersionsCount: 0,
    hasPrimaryAsset: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
]

const LISTING_VERSIONS: ListingVersion[] = [
  {
    id: 'listing-v2',
    versionNo: 2,
    versionLabel: 'Adopted for Amazon US',
    status: 'adopted',
    title: 'White Cotton Crew Neck T-Shirt, Men, 100% Cotton',
    bulletPoints: [
      'Premium 100% cotton material',
      'Comfortable crew neck design',
      'Breathable and lightweight',
      'Suitable for casual and formal wear',
      'Available in multiple sizes',
    ],
    description: 'High-quality cotton t-shirt with classic crew neck design. Perfect for everyday wear.',
    keywords: ['tshirt', 'cotton', 'crew neck', 'men', 'white'],
    platform: 'amazon',
    site: 'US',
    locale: 'en_US',
    createdAt: NOW,
    createdBy: 'demo-user',
  },
  {
    id: 'listing-v1',
    versionNo: 1,
    versionLabel: 'First Draft',
    status: 'draft',
    title: 'White T-Shirt',
    bulletPoints: ['White color', 'Cotton', 'T-shirt'],
    description: 'White cotton t-shirt.',
    keywords: ['tshirt', 'white'],
    platform: 'amazon',
    site: 'US',
    locale: 'en_US',
    createdAt: NOW,
    createdBy: 'demo-user',
  },
]

const EXPORT_TASKS: ExportTask[] = [
  {
    id: 'exp-001',
    productId: 'prod-001',
    status: 'succeeded',
    platform: 'amazon',
    site: 'US',
    locale: 'en_US',
    format: 'csv',
    packageUrl: '#',
    fileSize: '1.2 MB',
    createdAt: NOW,
    createdBy: 'demo-user',
  },
]

const PROFIT_SNAPSHOTS: ProfitSnapshot[] = [
  {
    id: 'profit-001',
    platform: 'amazon',
    site: 'US',
    costPrice: 12.5,
    listingPrice: 29.99,
    logisticsCost: 3.5,
    platformFee: 4.5,
    otherFee: 1.0,
    grossProfit: 8.49,
    netProfit: 4.49,
    grossMargin: 0.283,
    netMargin: 0.15,
    breakevenPrice: 21.5,
    createdAt: NOW,
  },
]

export function listProductsMock(params: {
  keyword?: string
  status?: ProductStatus
  limit?: number
  offset?: number
}) {
  let filtered = [...PRODUCT_LIST_ITEMS]
  if (params.keyword) {
    const kw = params.keyword.toLowerCase()
    filtered = filtered.filter(p =>
      p.title.toLowerCase().includes(kw) ||
      p.skuCode.toLowerCase().includes(kw) ||
      p.tags.some(t => t.toLowerCase().includes(kw))
    )
  }
  if (params.status) {
    filtered = filtered.filter(p => p.status === params.status)
  }
  const limit = params.limit ?? 20
  const offset = params.offset ?? 0
  return {
    total: filtered.length,
    items: filtered.slice(offset, offset + limit),
  }
}

export function getProductMock(id: string): {
  product: Product
  assets: any[]
  listingVersions: ListingVersion[]
  profitSnapshots: ProfitSnapshot[]
  exportTasks: ExportTask[]
  activities: any[]
} | null {
  const listItem = PRODUCT_LIST_ITEMS.find(p => p.id === id)
  if (!listItem) return null
  const product: Product = {
    ...listItem,
    primaryAsset: listItem.hasPrimaryAsset ? randomAsset(`${id}-hero`, 'hero', true) : undefined,
    assets: [],
    listingVersions: id === 'prod-001' ? LISTING_VERSIONS : [],
    exportTasks: id === 'prod-001' ? EXPORT_TASKS : [],
    profitSnapshots: id === 'prod-001' ? PROFIT_SNAPSHOTS : [],
    activities: [],
  }
  return {
    product,
    assets: [],
    listingVersions: product.listingVersions,
    profitSnapshots: product.profitSnapshots,
    exportTasks: product.exportTasks,
    activities: [],
  }
}
