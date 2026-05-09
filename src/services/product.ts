import type {
  Product,
  ProductActivity,
  ProductAssetItem,
  ProductListItem,
  ListingVersion,
  ProfitSnapshot,
  ExportTask,
  DownloadRecord,
  BatchListingMutationResult,
  ProductParsedInfo,
  ProductPrompt,
  GenerateProductPromptInput,
  CreateProductPromptInput,
  JsonObject,
} from '@/types/product'
import { ApiRequestError, downloadBinary, request } from './http'

type RawRecord = Record<string, any>

function normalizeAssetManifest(items: any[] | undefined) {
  return (items ?? []).map(item => ({
    relationId: item.relation_id ?? item.relationId ?? '',
    assetId: item.asset_id ?? item.assetId ?? '',
    assetRole: item.asset_role ?? item.assetRole ?? '',
    isPrimary: item.is_primary ?? item.isPrimary ?? false,
    assetType: item.asset_type ?? item.assetType,
    fileName: item.file_name ?? item.fileName,
    mimeType: item.mime_type ?? item.mimeType,
    contentUrl: item.content_url ?? item.contentUrl,
  }))
}

function normalizeProduct(raw: RawRecord): Product {
  return {
    ...raw,
    id: raw.id ?? '',
    title: raw.title ?? '',
    status: raw.status ?? 'draft',
    organizationId: raw.organization_id ?? raw.organizationId ?? '',
    skuCode: raw.sku_code ?? raw.skuCode ?? '',
    spuId: raw.spu_id ?? raw.spuId,
    categoryId: raw.category_id ?? raw.categoryId,
    brandId: raw.brand_id ?? raw.brandId,
    specJson: raw.spec_json ?? raw.specJson,
    costJson: raw.cost_json ?? raw.costJson,
    costCurrency: raw.cost_currency ?? raw.costCurrency ?? 'USD',
    assetStatus: raw.asset_status ?? raw.assetStatus ?? 'missing',
    listingStatus: raw.listing_status ?? raw.listingStatus ?? 'missing',
    exportStatus: raw.export_status ?? raw.exportStatus ?? 'pending',
    assetsCount: raw.assets_count ?? raw.assetsCount ?? 0,
    listingVersionsCount: raw.listing_versions_count ?? raw.listingVersionsCount ?? 0,
    hasPrimaryAsset: raw.has_primary_asset ?? raw.hasPrimaryAsset ?? false,
    createdAt: raw.created_at ?? raw.createdAt ?? '',
    updatedAt: raw.updated_at ?? raw.updatedAt ?? '',
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    assets: Array.isArray(raw.assets) ? raw.assets : [],
    listingVersions: Array.isArray(raw.listing_versions) ? raw.listing_versions.map(normalizeListingVersion) : (raw.listingVersions ?? []),
    exportTasks: Array.isArray(raw.export_tasks) ? raw.export_tasks.map(normalizeExportTask) : (raw.exportTasks ?? []),
    profitSnapshots: Array.isArray(raw.profit_snapshots) ? raw.profit_snapshots.map(normalizeProfitSnapshot) : (raw.profitSnapshots ?? []),
    activities: Array.isArray(raw.activities) ? raw.activities.map(normalizeActivity) : (raw.activities ?? []),
  } as Product
}

function normalizeListingVersion(raw: RawRecord): ListingVersion {
  return {
    ...raw,
    versionNo: raw.version_no ?? raw.versionNo ?? 0,
    versionLabel: raw.version_label ?? raw.versionLabel ?? '',
    bulletPoints: raw.bullet_points ?? raw.bulletPoints ?? [],
    createdAt: raw.created_at ?? raw.createdAt ?? '',
    createdBy: raw.created_by ?? raw.createdBy ?? '',
  } as ListingVersion
}

function normalizeProfitSnapshot(raw: RawRecord): ProfitSnapshot {
  return {
    ...raw,
    costPrice: raw.cost_price ?? raw.costPrice ?? 0,
    listingPrice: raw.listing_price ?? raw.listingPrice ?? 0,
    logisticsCost: raw.logistics_cost ?? raw.logisticsCost ?? 0,
    platformFee: raw.platform_fee ?? raw.platformFee ?? 0,
    otherFee: raw.other_fee ?? raw.otherFee ?? 0,
    grossProfit: raw.gross_profit ?? raw.grossProfit ?? 0,
    netProfit: raw.net_profit ?? raw.netProfit ?? 0,
    grossMargin: raw.gross_margin ?? raw.grossMargin ?? 0,
    netMargin: raw.net_margin ?? raw.netMargin ?? 0,
    breakevenPrice: raw.breakeven_price ?? raw.breakevenPrice ?? 0,
    createdAt: raw.created_at ?? raw.createdAt ?? '',
  } as ProfitSnapshot
}

function normalizeExportTask(raw: RawRecord): ExportTask {
  return {
    ...raw,
    productId: raw.product_id ?? raw.productId ?? '',
    listingVersionId: raw.listing_version_id ?? raw.listingVersionId,
    listingVersionLabel: raw.listing_version_label ?? raw.listingVersionLabel,
    primaryAssetRole: raw.primary_asset_role ?? raw.primaryAssetRole,
    assetCount: raw.asset_count ?? raw.assetCount,
    assetManifest: normalizeAssetManifest(raw.asset_manifest ?? raw.assetManifest),
    storageKey: raw.storage_key ?? raw.storageKey,
    packageUrl: raw.package_url ?? raw.packageUrl,
    fileSize: raw.file_size ?? raw.fileSize,
    createdAt: raw.created_at ?? raw.createdAt ?? '',
    createdBy: raw.created_by ?? raw.createdBy,
  } as ExportTask
}

function normalizeProductAsset(item: RawRecord): ProductAssetItem {
  const relation = item.relation ?? item
  const asset = item.asset ?? null
  return {
    relation: {
      ...relation,
      organizationId: relation.organization_id ?? relation.organizationId ?? '',
      assetId: relation.asset_id ?? relation.assetId ?? '',
      ownerType: relation.owner_type ?? relation.ownerType ?? '',
      ownerId: relation.owner_id ?? relation.ownerId ?? '',
      relationType: relation.relation_type ?? relation.relationType ?? '',
      assetRole: relation.asset_role ?? relation.assetRole ?? '',
      isPrimary: relation.is_primary ?? relation.isPrimary ?? false,
      platformCode: relation.platform_code ?? relation.platformCode,
      siteCode: relation.site_code ?? relation.siteCode,
      localeCode: relation.locale_code ?? relation.localeCode,
      sortOrder: relation.sort_order ?? relation.sortOrder ?? 0,
      createdAt: relation.created_at ?? relation.createdAt ?? '',
    },
    asset: asset ? {
      ...asset,
      organizationId: asset.organization_id ?? asset.organizationId ?? '',
      userId: asset.user_id ?? asset.userId,
      assetType: asset.asset_type ?? asset.assetType ?? '',
      sourceType: asset.source_type ?? asset.sourceType,
      storageKey: asset.storage_key ?? asset.storageKey,
      thumbnailUrl: asset.thumbnail_url ?? asset.thumbnailUrl,
      originalUrl: asset.original_url ?? asset.originalUrl,
      mimeType: asset.mime_type ?? asset.mimeType,
      fileName: asset.file_name ?? asset.fileName,
      createdAt: asset.created_at ?? asset.createdAt,
    } : null,
  }
}

function normalizeActivity(raw: RawRecord): ProductActivity {
  return { ...raw, createdAt: raw.created_at ?? raw.createdAt ?? '' } as ProductActivity
}

function normalizeDownload(raw: RawRecord): DownloadRecord {
  return {
    ...raw,
    sourceType: raw.source_type ?? raw.sourceType ?? 'product_export',
    productId: raw.product_id ?? raw.productId ?? '',
    productTitle: raw.product_title ?? raw.productTitle ?? '',
    productSKU: raw.product_sku ?? raw.productSKU ?? raw.sku_code ?? '',
    productStatus: raw.product_status ?? raw.productStatus ?? 'draft',
    productPath: raw.product_path ?? raw.productPath ?? '',
    fileSize: raw.file_size ?? raw.fileSize,
    packageUrl: raw.package_url ?? raw.packageUrl,
    listingVersionId: raw.listing_version_id ?? raw.listingVersionId,
    listingVersionLabel: raw.listing_version_label ?? raw.listingVersionLabel,
    downloadFileName: raw.download_file_name ?? raw.downloadFileName ?? '',
    assetCount: raw.asset_count ?? raw.assetCount ?? 0,
    primaryAssetRole: raw.primary_asset_role ?? raw.primaryAssetRole,
    assets: normalizeAssetManifest(raw.assets),
    createdAt: raw.created_at ?? raw.createdAt ?? '',
  } as DownloadRecord
}

function productPayload(data: Partial<{
  skuCode: string
  title: string
  spuId: string
  categoryId: string
  brandId: string
  specJson: string
  costJson: string
  costCurrency: string
  tags: string[]
}>) {
  const payload: RawRecord = {}
  if ('skuCode' in data) payload.sku_code = data.skuCode
  if ('title' in data) payload.title = data.title
  if ('spuId' in data) payload.spu_id = data.spuId
  if ('categoryId' in data) payload.category_id = data.categoryId
  if ('brandId' in data) payload.brand_id = data.brandId
  if ('specJson' in data) payload.spec_json = data.specJson
  if ('costJson' in data) payload.cost_json = data.costJson
  if ('costCurrency' in data) payload.cost_currency = data.costCurrency
  if ('tags' in data) payload.tags = data.tags
  return payload
}

export async function listProducts() {
  const result = await request<RawRecord[]>('/api/v1/ecommerce/products', { method: 'GET' })
  return result.map(normalizeProduct) as ProductListItem[]
}

export function createProduct(data: {
  skuCode: string
  title: string
  spuId?: string
  categoryId?: string
  brandId?: string
  specJson?: string
  costJson?: string
  costCurrency?: string
  tags?: string[]
}) {
  return request<RawRecord>('/api/v1/ecommerce/products', {
    method: 'POST',
    body: JSON.stringify(productPayload(data)),
  }).then(normalizeProduct)
}

export async function getProduct(productId: string) {
  const result = await request<{
    product: RawRecord
    assets: RawRecord[]
    listing_versions?: RawRecord[]
    listingVersions?: RawRecord[]
    profit_snapshots?: RawRecord[]
    profitSnapshots?: RawRecord[]
    export_tasks?: RawRecord[]
    exportTasks?: RawRecord[]
    activities: RawRecord[]
  }>(`/api/v1/ecommerce/products/${productId}`, { method: 'GET' })
  return {
    product: normalizeProduct(result.product),
    assets: (result.assets ?? []).map(normalizeProductAsset),
    listingVersions: (result.listing_versions ?? result.listingVersions ?? []).map(normalizeListingVersion),
    profitSnapshots: (result.profit_snapshots ?? result.profitSnapshots ?? []).map(normalizeProfitSnapshot),
    exportTasks: (result.export_tasks ?? result.exportTasks ?? []).map(normalizeExportTask),
    activities: (result.activities ?? []).map(normalizeActivity),
  }
}

type JsonStringOrObject = string | JsonObject | null | undefined

type ParsedInfoDTO = {
  id?: string
  product_id?: string
  productId?: string
  status?: ProductParsedInfo['status']
  category_guess?: string
  categoryGuess?: string
  platform_fit?: string | string[]
  platformFit?: string | string[]
  image_type_suggestions?: string[]
  imageTypeSuggestions?: string[]
  visual_features?: JsonStringOrObject
  visualFeatures?: JsonStringOrObject
  usage_scenarios?: string[]
  usageScenarios?: string[]
  confidence?: number
  parser_version?: string
  parserVersion?: string
  source_asset_ids?: string[]
  sourceAssetIds?: string[]
  error_message?: string
  errorMessage?: string
  created_at?: string
  createdAt?: string
  updated_at?: string
  updatedAt?: string
}

type PromptDTO = {
  id: string
  product_id?: string
  productId?: string
  version_no?: number
  versionNo?: number
  status?: ProductPrompt['status']
  generation_type?: string
  generationType?: string
  module?: string
  template_ids?: string[]
  templateIds?: string[]
  schema_json?: JsonStringOrObject
  schemaJson?: JsonStringOrObject
  source_map_json?: JsonStringOrObject
  sourceMapJson?: JsonStringOrObject
  content?: string
  created_at?: string
  createdAt?: string
}

function parseJsonObject(value: JsonStringOrObject): JsonObject {
  if (!value) return {}
  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as JsonObject : {}
    } catch {
      return {}
    }
  }
  return value
}

function normalizeStringList(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value.filter(Boolean)
  if (!value) return []
  return value.split(',').map(item => item.trim()).filter(Boolean)
}

function isOptionalMissing(error: unknown) {
  if (!(error instanceof ApiRequestError)) return false
  const message = error.message.toLowerCase()
  return error.status === 404 || error.errorCode === 'NOT_FOUND' || message.includes('not found') || message.includes('record not found')
}

function normalizeParsedInfo(input: ParsedInfoDTO | null | undefined, productId: string): ProductParsedInfo | null {
  if (!input) return null
  return {
    id: input.id,
    productId: input.productId ?? input.product_id ?? productId,
    status: input.status ?? 'pending',
    categoryGuess: input.categoryGuess ?? input.category_guess,
    platformFit: normalizeStringList(input.platformFit ?? input.platform_fit),
    imageTypeSuggestions: input.imageTypeSuggestions ?? input.image_type_suggestions ?? [],
    visualFeatures: parseJsonObject(input.visualFeatures ?? input.visual_features),
    usageScenarios: input.usageScenarios ?? input.usage_scenarios ?? [],
    confidence: input.confidence,
    parserVersion: input.parserVersion ?? input.parser_version,
    sourceAssetIds: input.sourceAssetIds ?? input.source_asset_ids ?? [],
    errorMessage: input.errorMessage ?? input.error_message,
    createdAt: input.createdAt ?? input.created_at,
    updatedAt: input.updatedAt ?? input.updated_at,
  }
}

function normalizePrompt(input: PromptDTO, productId: string): ProductPrompt {
  return {
    id: input.id,
    productId: input.productId ?? input.product_id ?? productId,
    versionNo: input.versionNo ?? input.version_no ?? 1,
    status: input.status ?? 'draft',
    generationType: input.generationType ?? input.generation_type ?? 'image',
    module: input.module ?? 'image',
    templateIds: input.templateIds ?? input.template_ids ?? [],
    schemaJson: parseJsonObject(input.schemaJson ?? input.schema_json),
    sourceMapJson: parseJsonObject(input.sourceMapJson ?? input.source_map_json),
    content: input.content ?? '',
    createdAt: input.createdAt ?? input.created_at ?? '',
  }
}

export async function getProductParsedInfo(productId: string) {
  try {
    const result = await request<ParsedInfoDTO | null>(`/api/v1/ecommerce/products/${productId}/parsed-info`, { method: 'GET', silent: true })
    return normalizeParsedInfo(result, productId)
  } catch (error) {
    if (isOptionalMissing(error)) return null
    throw error
  }
}

export async function listProductPrompts(productId: string) {
  try {
    const result = await request<PromptDTO[]>(`/api/v1/ecommerce/products/${productId}/prompts`, { method: 'GET', silent: true })
    return result.map(item => normalizePrompt(item, productId)).sort((left, right) => right.versionNo - left.versionNo)
  } catch (error) {
    if (isOptionalMissing(error)) return []
    throw error
  }
}

export async function generateProductPrompt(productId: string, input: GenerateProductPromptInput = {}) {
  const result = await request<PromptDTO>(`/api/v1/ecommerce/products/${productId}/prompts/generate`, {
    method: 'POST',
    body: JSON.stringify({
      generation_type: input.generationType ?? 'image',
      module: input.module ?? 'image',
      template_ids: input.templateIds ?? [],
      source_map: input.sourceMap,
      content: input.content,
    }),
  })
  return normalizePrompt(result, productId)
}

export async function createProductPrompt(productId: string, input: CreateProductPromptInput) {
  const result = await request<PromptDTO>(`/api/v1/ecommerce/products/${productId}/prompts`, {
    method: 'POST',
    body: JSON.stringify({
      generation_type: input.generationType ?? 'image',
      module: input.module ?? 'image',
      template_ids: input.templateIds ?? [],
      schema_json: JSON.stringify(input.schemaJson),
      source_map_json: JSON.stringify(input.sourceMapJson),
      content: input.content,
    }),
  })
  return normalizePrompt(result, productId)
}

export function updateProduct(
  productId: string,
  data: Partial<{
    skuCode: string
    title: string
    spuId: string
    categoryId: string
    brandId: string
    specJson: string
    costJson: string
    costCurrency: string
    tags: string[]
  }>,
) {
  return request<RawRecord>(`/api/v1/ecommerce/products/${productId}`, {
    method: 'PATCH',
    body: JSON.stringify(productPayload(data)),
  }).then(normalizeProduct)
}

export function updateProductStatus(productId: string, status: string) {
  return request<RawRecord>(`/api/v1/ecommerce/products/${productId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }).then(normalizeProduct)
}

export function listProductAssets(productId: string) {
  return request<RawRecord[]>(`/api/v1/ecommerce/products/${productId}/assets`, { method: 'GET' }).then(items => items.map(normalizeProductAsset))
}

export function addProductAsset(productId: string, data: {
  assetId: string
  relationType: string
  assetRole: string
  isPrimary?: boolean
  platformCode?: string
  siteCode?: string
  localeCode?: string
  sortOrder?: number
}) {
  return request<RawRecord>(`/api/v1/ecommerce/products/${productId}/assets`, {
    method: 'POST',
    body: JSON.stringify({
      asset_id: data.assetId,
      relation_type: data.relationType,
      asset_role: data.assetRole,
      is_primary: data.isPrimary,
      platform_code: data.platformCode,
      site_code: data.siteCode,
      locale_code: data.localeCode,
      sort_order: data.sortOrder,
    }),
  }).then(raw => normalizeProductAsset(raw).relation)
}

export function updateProductAssetRelation(
  productId: string,
  assetRelationId: string,
  data: Partial<{
    relationType: string
    assetRole: string
    isPrimary: boolean
    platformCode: string
    siteCode: string
    localeCode: string
    sortOrder: number
  }>,
) {
  const payload: Record<string, unknown> = {}
  if ('relationType' in data) payload.relation_type = data.relationType
  if ('assetRole' in data) payload.asset_role = data.assetRole
  if ('isPrimary' in data) payload.is_primary = data.isPrimary
  if ('platformCode' in data) payload.platform_code = data.platformCode
  if ('siteCode' in data) payload.site_code = data.siteCode
  if ('localeCode' in data) payload.locale_code = data.localeCode
  if ('sortOrder' in data) payload.sort_order = data.sortOrder

  return request<RawRecord>(`/api/v1/ecommerce/products/${productId}/assets/${assetRelationId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }).then(raw => normalizeProductAsset(raw).relation)
}

export function deleteProductAsset(productId: string, assetRelationId: string) {
  return request<{ success: boolean }>(`/api/v1/ecommerce/products/${productId}/assets/${assetRelationId}`, {
    method: 'DELETE',
  })
}

export function listListingVersions(productId: string) {
  return request<RawRecord[]>(`/api/v1/ecommerce/products/${productId}/listing-versions`, { method: 'GET' }).then(items => items.map(normalizeListingVersion))
}

export function createListingVersion(productId: string, data: {
  versionLabel: string
  title: string
  description?: string
  bulletPoints?: string[]
  keywords?: string[]
  platform: string
  site: string
  locale: string
}) {
  return request<RawRecord>(`/api/v1/ecommerce/products/${productId}/listing-versions`, {
    method: 'POST',
    body: JSON.stringify({
      version_label: data.versionLabel,
      title: data.title,
      description: data.description,
      bullet_points: data.bulletPoints ?? [],
      keywords: data.keywords ?? [],
      platform: data.platform,
      site: data.site,
      locale: data.locale,
    }),
  }).then(normalizeListingVersion)
}

export async function batchCreateListingVersions(data: {
  items: Array<{
    productId: string
    versionLabel: string
    title: string
    description?: string
    bulletPoints?: string[]
    keywords?: string[]
    platform: string
    site: string
    locale: string
  }>
}) {
  const result = await request<{
    total: number
    succeeded: number
    failed: number
    items: Array<{
      product_id: string
      sku_code?: string
      product_title?: string
      version_id?: string
      version_label?: string
      success: boolean
      message?: string
      listing?: ListingVersion
    }>
  }>('/api/v1/ecommerce/products/listing-versions/batch', {
    method: 'POST',
    body: JSON.stringify({
      items: data.items.map(item => ({
        product_id: item.productId,
        version_label: item.versionLabel,
        title: item.title,
        description: item.description,
        bullet_points: item.bulletPoints ?? [],
        keywords: item.keywords ?? [],
        platform: item.platform,
        site: item.site,
        locale: item.locale,
      })),
    }),
  })

  return {
    total: result.total,
    succeeded: result.succeeded,
    failed: result.failed,
    items: result.items.map(item => ({
      productId: item.product_id,
      skuCode: item.sku_code,
      productTitle: item.product_title,
      versionId: item.version_id,
      versionLabel: item.version_label,
      success: item.success,
      message: item.message,
      listing: item.listing ? normalizeListingVersion(item.listing as RawRecord) : undefined,
    })),
  } satisfies BatchListingMutationResult
}

export function adoptListingVersion(productId: string, versionId: string) {
  return request<unknown>(`/api/v1/ecommerce/products/${productId}/listing-versions/adopt`, {
    method: 'POST',
    body: JSON.stringify({ version_id: versionId }),
  })
}

export async function batchAdoptListingVersions(data: {
  items: Array<{
    productId: string
    versionId: string
  }>
}) {
  const result = await request<{
    total: number
    succeeded: number
    failed: number
    items: Array<{
      product_id: string
      sku_code?: string
      product_title?: string
      version_id?: string
      version_label?: string
      success: boolean
      message?: string
      listing?: ListingVersion
    }>
  }>('/api/v1/ecommerce/products/listing-versions/batch-adopt', {
    method: 'POST',
    body: JSON.stringify({
      items: data.items.map(item => ({
        product_id: item.productId,
        version_id: item.versionId,
      })),
    }),
  })

  return {
    total: result.total,
    succeeded: result.succeeded,
    failed: result.failed,
    items: result.items.map(item => ({
      productId: item.product_id,
      skuCode: item.sku_code,
      productTitle: item.product_title,
      versionId: item.version_id,
      versionLabel: item.version_label,
      success: item.success,
      message: item.message,
      listing: item.listing ? normalizeListingVersion(item.listing as RawRecord) : undefined,
    })),
  } satisfies BatchListingMutationResult
}

export function deleteListingVersion(productId: string, versionId: string) {
  return request<{ success: boolean }>(`/api/v1/ecommerce/products/${productId}/listing-versions/${versionId}`, {
    method: 'DELETE',
  })
}

export function updateListingVersion(
  productId: string,
  versionId: string,
  data: Partial<{
    versionLabel: string
    title: string
    description: string
    bulletPoints: string[]
    keywords: string[]
    platform: string
    site: string
    locale: string
  }>,
) {
  const payload: Record<string, unknown> = {}
  if ('versionLabel' in data) payload.version_label = data.versionLabel
  if ('title' in data) payload.title = data.title
  if ('description' in data) payload.description = data.description
  if ('bulletPoints' in data) payload.bullet_points = data.bulletPoints
  if ('keywords' in data) payload.keywords = data.keywords
  if ('platform' in data) payload.platform = data.platform
  if ('site' in data) payload.site = data.site
  if ('locale' in data) payload.locale = data.locale

  return request<RawRecord>(`/api/v1/ecommerce/products/${productId}/listing-versions/${versionId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }).then(normalizeListingVersion)
}

export function listProfitSnapshots(productId: string) {
  return request<RawRecord[]>(`/api/v1/ecommerce/products/${productId}/profit-snapshots`, { method: 'GET' }).then(items => items.map(normalizeProfitSnapshot))
}

export function calculateProfit(productId: string, data: {
  platform: string
  site: string
  costPrice: number
  listingPrice: number
  logisticsCost?: number
  platformFee?: number
  otherFee?: number
}) {
  return request<RawRecord>(`/api/v1/ecommerce/products/${productId}/profit-snapshots/calculate`, {
    method: 'POST',
    body: JSON.stringify({
      platform: data.platform,
      site: data.site,
      cost_price: data.costPrice,
      listing_price: data.listingPrice,
      logistics_cost: data.logisticsCost,
      platform_fee: data.platformFee,
      other_fee: data.otherFee,
    }),
  }).then(normalizeProfitSnapshot)
}

export function listExportTasks(productId: string) {
  return request<RawRecord[]>(`/api/v1/ecommerce/products/${productId}/export-tasks`, { method: 'GET' }).then(items => items.map(normalizeExportTask))
}

export function createExportTask(productId: string, data: {
  platform: string
  site: string
  locale: string
  format: string
  assetRelationIds?: string[]
}) {
  return request<RawRecord>(`/api/v1/ecommerce/products/${productId}/export-tasks`, {
    method: 'POST',
    body: JSON.stringify({
      platform: data.platform,
      site: data.site,
      locale: data.locale,
      format: data.format,
      asset_relation_ids: data.assetRelationIds,
    }),
  }).then(normalizeExportTask)
}

export type ExportPackagePayload = {
  productIds: string[]
  platform: string
  site: string
  locale: string
  format: string
  listingVersionIds?: string[]
  assetRelationIds?: string[]
}

export function createExportPackage(data: ExportPackagePayload) {
  return request<RawRecord>('/api/v1/ecommerce/export-packages', {
    method: 'POST',
    body: JSON.stringify({
      product_ids: data.productIds,
      platform: data.platform,
      site: data.site,
      locale: data.locale,
      format: data.format,
      listing_version_ids: data.listingVersionIds,
      asset_relation_ids: data.assetRelationIds,
    }),
  }).then(normalizeExportTask)
}

export function listExportPackages(params?: { productIds?: string[]; status?: string }) {
  const query = new URLSearchParams()
  if (params?.productIds?.length) query.set('product_ids', params.productIds.join(','))
  if (params?.status) query.set('status', params.status)
  const suffix = query.toString() ? `?${query.toString()}` : ''
  return request<RawRecord[]>(`/api/v1/ecommerce/export-packages${suffix}`, { method: 'GET' }).then(items => items.map(normalizeExportTask))
}

export function getExportPackage(packageId: string) {
  return request<RawRecord>(`/api/v1/ecommerce/export-packages/${packageId}`, { method: 'GET' }).then(normalizeExportTask)
}

export function retryExportPackage(packageId: string) {
  return request<RawRecord>(`/api/v1/ecommerce/export-packages/${packageId}/retry`, { method: 'POST' }).then(normalizeExportTask)
}

export function listAssetLibrary(params?: { assetType?: string; sourceType?: string; search?: string }) {
  const query = new URLSearchParams()
  if (params?.assetType) query.set('asset_type', params.assetType)
  if (params?.sourceType) query.set('source_type', params.sourceType)
  if (params?.search) query.set('search', params.search)
  const suffix = query.toString() ? `?${query.toString()}` : ''
  return request<RawRecord[]>(`/api/v1/ecommerce/asset-library${suffix}`, { method: 'GET' }).then(items => items.map(item => normalizeProductAsset({ relation: item.relation ?? item, asset: item.asset ?? item })))
}

export function getAssetLibraryItem(assetId: string) {
  return request<RawRecord>(`/api/v1/ecommerce/asset-library/${assetId}`, { method: 'GET' }).then(item => normalizeProductAsset({ relation: item.relation ?? item, asset: item.asset ?? item }))
}

export function getPromptCenterTemplate(templateKey: string) {
  return request<RawRecord>(`/api/v1/ecommerce/prompt-center/${encodeURIComponent(templateKey)}`, { method: 'GET' })
}

export function previewPromptCenterTemplate(data: { templateKey: string; variables: Record<string, unknown> }) {
  return request<RawRecord>('/api/v1/ecommerce/prompt-center/preview', {
    method: 'POST',
    body: JSON.stringify({ template_key: data.templateKey, variables: data.variables }),
  })
}

export function validatePromptCenterTemplate(data: { templateKey: string; content?: string; variables?: Record<string, unknown> }) {
  return request<RawRecord>('/api/v1/ecommerce/prompt-center/validate', {
    method: 'POST',
    body: JSON.stringify({ template_key: data.templateKey, content: data.content, variables: data.variables }),
  })
}

export function updateExportTaskStatus(
	productId: string,
	data: {
		taskId: string
		status: string
		storageKey?: string
		packageUrl?: string
		fileSize?: string
	},
) {
	return request<RawRecord>(`/api/v1/ecommerce/products/${productId}/export-tasks/status`, {
		method: 'PATCH',
		body: JSON.stringify({
      task_id: data.taskId,
      status: data.status,
      storage_key: data.storageKey,
      package_url: data.packageUrl,
      file_size: data.fileSize,
    }),
	}).then(normalizeExportTask)
}

export function deleteProduct(productId: string) {
	return request<{ success: boolean }>(`/api/v1/ecommerce/products/${productId}`, {
		method: 'DELETE',
	})
}

export function listDownloads() {
  return request<RawRecord[]>('/api/v1/ecommerce/downloads', { method: 'GET' }).then(items => items.map(normalizeDownload))
}

export async function downloadExport(record: Pick<DownloadRecord, 'id' | 'packageUrl' | 'downloadFileName'>) {
  if (record.packageUrl) {
    window.open(record.packageUrl, '_blank', 'noopener,noreferrer')
    return
  }
  await downloadBinary(`/api/v1/ecommerce/downloads/${record.id}/content`, record.downloadFileName)
}

export async function downloadExportTask(task: Pick<ExportTask, 'id' | 'packageUrl' | 'format'>, fallbackFileName?: string) {
  if (task.packageUrl) {
    window.open(task.packageUrl, '_blank', 'noopener,noreferrer')
    return
  }
  await downloadBinary(`/api/v1/ecommerce/downloads/${task.id}/content`, fallbackFileName || `export.${task.format}`)
}
