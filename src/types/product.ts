export type ProductStatus =
  | 'draft'
  | 'assets_ready'
  | 'listing_ready'
  | 'export_ready'
  | 'published'
  | 'archived'

export type AssetRole =
  | 'hero'
  | 'model_shot'
  | 'scene_shot'
  | 'detail_shot'
  | 'listing_attachment'

export type AssetRelationType =
  | 'source'
  | 'result'
  | 'primary'
  | 'package_item'

export type ProductAsset = {
  id: string
  assetId: string
  assetType: 'image' | 'video' | 'attachment'
  assetRole: AssetRole
  isPrimary: boolean
  thumbnailUrl: string
  originalUrl: string
  mimeType: string
  width: number
  height: number
  createdAt: string
  sourceJobId?: string
  isFavorited?: boolean
}

export type ProductAssetRelation = {
  id: string
  organizationId: string
  assetId: string
  ownerType: 'product' | 'listing' | 'export_task' | 'job' | string
  ownerId: string
  relationType: AssetRelationType | string
  assetRole: AssetRole | string
  isPrimary: boolean
  platformCode?: string
  siteCode?: string
  localeCode?: string
  sortOrder: number
  createdAt: string
}

export type ProductAssetDetail = {
  id: string
  organizationId: string
  userId?: string
  assetType: 'image' | 'video' | 'attachment' | string
  sourceType?: string
  storageKey?: string
  thumbnailUrl?: string
  originalUrl?: string
  mimeType?: string
  width?: number
  height?: number
  fileName?: string
  createdAt?: string
  metadata?: Record<string, unknown>
}

export type ProductAssetItem = {
  relation: ProductAssetRelation
  asset: ProductAssetDetail | null
}

export type ListingVersion = {
  id: string
  versionNo: number
  versionLabel: string
  status: 'draft' | 'ready' | 'adopted'
  title: string
  bulletPoints: string[]
  description: string
  keywords: string[]
  platform: 'amazon' | 'shopee' | 'lazada'
  site: string
  locale: string
  createdAt: string
  createdBy: string
}

export type BatchListingMutationResult = {
  total: number
  succeeded: number
  failed: number
  items: Array<{
    productId: string
    skuCode?: string
    productTitle?: string
    versionId?: string
    versionLabel?: string
    success: boolean
    message?: string
    listing?: ListingVersion
  }>
}

export type ExportTaskStatus = 'pending' | 'generating' | 'succeeded' | 'failed'

export type ExportTask = {
  id: string
  productId: string
  status: ExportTaskStatus
  platform: 'amazon' | 'shopee' | 'lazada'
  site: string
  locale: string
  format: 'csv' | 'xlsx'
  listingVersionId?: string
  listingVersionLabel?: string
  primaryAssetRole?: AssetRole | string
  assetCount?: number
  assetManifest?: Array<{
    relationId: string
    assetId: string
    assetRole: AssetRole | string
    isPrimary: boolean
    assetType?: 'image' | 'video' | 'attachment' | string
    fileName?: string
    mimeType?: string
    contentUrl?: string
  }>
  storageKey?: string
  packageUrl?: string
  fileSize?: string
  createdAt: string
  createdBy?: string
}

export type DownloadRecord = {
  id: string
  sourceType: 'product_export'
  productId: string
  productTitle: string
  productSKU: string
  productStatus: ProductStatus
  productPath: string
  platform: 'amazon' | 'shopee' | 'lazada' | 'shopify' | string
  site: string
  locale: string
  format: 'csv' | 'xlsx' | string
  status: ExportTaskStatus
  fileSize?: string
  packageUrl?: string
  listingVersionId?: string
  listingVersionLabel?: string
  downloadFileName: string
  downloadable: boolean
  assetCount: number
  primaryAssetRole?: AssetRole | string
  assets?: Array<{
    relationId: string
    assetId: string
    assetRole: AssetRole | string
    isPrimary: boolean
    assetType?: 'image' | 'video' | 'attachment' | string
    fileName?: string
    mimeType?: string
    contentUrl?: string
  }>
  createdAt: string
}

export type ProfitSnapshot = {
  id: string
  platform: 'amazon' | 'shopee' | 'lazada'
  site: string
  costPrice: number
  listingPrice: number
  logisticsCost: number
  platformFee: number
  otherFee: number
  grossProfit: number
  netProfit: number
  grossMargin: number
  netMargin: number
  breakevenPrice: number
  createdAt: string
}

export type ProductActivity = {
  id: string
  type: string
  title: string
  summary: string
  createdAt: string
}

export type ProductListItem = {
  id: string
  organizationId: string
  skuCode: string
  spuId?: string
  title: string
  categoryId?: string
  brandId?: string
  specJson?: string
  costJson?: string
  costCurrency: string
  tags: string[]
  status: ProductStatus
  assetStatus: 'missing' | 'partial' | 'ready'
  listingStatus: 'missing' | 'partial' | 'ready'
  exportStatus: 'pending' | 'ready' | 'done'
  assetsCount: number
  listingVersionsCount: number
  hasPrimaryAsset: boolean
  createdAt: string
  updatedAt: string
}

export type Product = ProductListItem & {
  primaryAsset?: ProductAsset
  assets: ProductAsset[]
  listingVersions: ListingVersion[]
  exportTasks: ExportTask[]
  profitSnapshots: ProfitSnapshot[]
  activities: ProductActivity[]
}
