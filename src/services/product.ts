import type {
  Product,
  ProductActivity,
  ProductAssetItem,
  ProductAssetRelation,
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

export function listProducts() {
  return request<ProductListItem[]>('/api/v1/ecommerce/products', { method: 'GET' })
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
  return request<Product>('/api/v1/ecommerce/products', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function getProduct(productId: string) {
  return request<{
    product: Product
    assets: ProductAssetItem[]
    listingVersions: ListingVersion[]
    profitSnapshots: ProfitSnapshot[]
    exportTasks: ExportTask[]
    activities: ProductActivity[]
  }>(`/api/v1/ecommerce/products/${productId}`, { method: 'GET' })
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
  return request<Product>(`/api/v1/ecommerce/products/${productId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function updateProductStatus(productId: string, status: string) {
  return request<Product>(`/api/v1/ecommerce/products/${productId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function listProductAssets(productId: string) {
  return request<ProductAssetItem[]>(`/api/v1/ecommerce/products/${productId}/assets`, { method: 'GET' })
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
  return request<ProductAssetRelation>(`/api/v1/ecommerce/products/${productId}/assets`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
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

  return request<ProductAssetRelation>(`/api/v1/ecommerce/products/${productId}/assets/${assetRelationId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteProductAsset(productId: string, assetRelationId: string) {
  return request<{ success: boolean }>(`/api/v1/ecommerce/products/${productId}/assets/${assetRelationId}`, {
    method: 'DELETE',
  })
}

export function listListingVersions(productId: string) {
  return request<ListingVersion[]>(`/api/v1/ecommerce/products/${productId}/listing-versions`, { method: 'GET' })
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
  return request<ListingVersion>(`/api/v1/ecommerce/products/${productId}/listing-versions`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
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
      listing: item.listing,
    })),
  } satisfies BatchListingMutationResult
}

export function adoptListingVersion(productId: string, versionId: string) {
  return request<unknown>(`/api/v1/ecommerce/products/${productId}/listing-versions/adopt`, {
    method: 'POST',
    body: JSON.stringify({ versionId }),
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
      listing: item.listing,
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

  return request<ListingVersion>(`/api/v1/ecommerce/products/${productId}/listing-versions/${versionId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function listProfitSnapshots(productId: string) {
  return request<ProfitSnapshot[]>(`/api/v1/ecommerce/products/${productId}/profit-snapshots`, { method: 'GET' })
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
  return request<ProfitSnapshot>(`/api/v1/ecommerce/products/${productId}/profit-snapshots/calculate`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function listExportTasks(productId: string) {
  return request<ExportTask[]>(`/api/v1/ecommerce/products/${productId}/export-tasks`, { method: 'GET' })
}

export function createExportTask(productId: string, data: {
  platform: string
  site: string
  locale: string
  format: string
  assetRelationIds?: string[]
}) {
  return request<ExportTask>(`/api/v1/ecommerce/products/${productId}/export-tasks`, {
    method: 'POST',
    body: JSON.stringify({
      platform: data.platform,
      site: data.site,
      locale: data.locale,
      format: data.format,
      asset_relation_ids: data.assetRelationIds,
    }),
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
	return request<ExportTask>(`/api/v1/ecommerce/products/${productId}/export-tasks/status`, {
		method: 'PATCH',
		body: JSON.stringify(data),
	})
}

export function deleteProduct(productId: string) {
	return request<{ success: boolean }>(`/api/v1/ecommerce/products/${productId}`, {
		method: 'DELETE',
	})
}

export function listDownloads() {
  return request<DownloadRecord[]>('/api/v1/ecommerce/downloads', { method: 'GET' })
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
