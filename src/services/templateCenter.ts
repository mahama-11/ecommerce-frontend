import { API_BASE_URL } from '@/services/apiBase'
import { getAccessToken } from '@/services/auth'

type Envelope<T> = {
  code: number
  message: string
  data: T
  error?: string
  error_code?: string
  error_hint?: string
}

export type TemplateListItem = {
  id: string
  slug: string
  externalCode?: string
  name: string
  summary: string
  modality: 'text' | 'image' | 'video' | 'workflow'
  executorType: 'chat' | 'image_tool' | 'video_tool' | 'batch_pipeline' | 'hybrid_workflow'
  series: string
  capabilityType: string
  interactionMode: string
  coverAssetUrl?: string
  platformTags: string[]
  industryTags: string[]
  scenarioTags: string[]
  isFeatured: boolean
  recommendScore: number
  isFavorited: boolean
  favoriteCount: number
  useCount: number
  successRateHint: number
}

export type TemplateDetail = {
  catalog: TemplateListItem
  locale: {
    description: string
    scenarioDescription?: string
    inputDescription?: string
    outputDescription?: string
  }
  version: {
    id: string
    versionNo: number
    versionLabel: string
    status: string
    sourceAssetRef?: string
  }
  schema: {
    inputSchema: Record<string, unknown>
    outputSchema: Record<string, unknown>
    executionSchema: Record<string, unknown>
    promptLayers: Record<string, unknown>
    policySchema?: Record<string, unknown>
    defaultVariables: Record<string, unknown>
    toolBinding: Record<string, unknown>
  }
  examples: Array<{
    id: string
    exampleType: string
    title?: string
    description?: string
    inputAssetUrl?: string
    outputAssetUrl?: string
    previewAssetUrl?: string
    videoPosterUrl?: string
  }>
}

export type TemplateUseResponse = {
  targetRoute: string
  executorType: string
  toolSlug?: string
  prefilledInputSchema: Record<string, unknown>
  preloadedTemplatePayload: Record<string, unknown>
  supportsAsyncJob: boolean
  supportsBatch: boolean
}

export type CatalogFacetBucket = {
  key: string
  label: string
  count: number
}

export type TemplateCatalogFacets = {
  platforms: CatalogFacetBucket[]
  modalities: CatalogFacetBucket[]
  series: CatalogFacetBucket[]
  capabilities: CatalogFacetBucket[]
}

export type TemplateInstanceItem = {
  id: string
  presetTemplateId?: string
  title: string
  summary: string
  scenario: string
  modality: string
  executorType: string
  series: string
  capabilityType: string
  platformTags: string[]
  industryTags: string[]
  sourceType: string
  sourceLabel?: string
  status: string
  isFavorite: boolean
  savedAt: string
  updatedAt: string
  editableSchema: Record<string, unknown>
  promptLayers: Record<string, unknown>
}

export const TEMPLATE_USE_PAYLOAD_KEY = 'ae_template_center_use_payload'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  const payload = (await response.json()) as Envelope<T>
  if (!response.ok || payload.code !== 0) {
    throw new Error(payload.error_hint || payload.error || payload.message || 'Request failed')
  }

  return payload.data
}

function toQuery(params: Record<string, string | number | boolean | undefined>) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '' || value === false) return
    query.set(key, String(value))
  })
  const stringified = query.toString()
  return stringified ? `?${stringified}` : ''
}

export async function listCatalog(params: {
  locale: string
  keyword?: string
  modality?: string
  series?: string
  capability?: string
  platform?: string
  sortBy?: 'recommended' | 'newest' | 'most_used' | 'most_favorited' | 'alphabetical'
}) {
  return request<TemplateListItem[]>(
    `/api/v1/ecommerce/template-center/catalog${toQuery({
      locale: params.locale,
      keyword: params.keyword,
      modality: params.modality,
      series: params.series,
      capability: params.capability,
      platform: params.platform,
      sortBy: params.sortBy,
    })}`,
  )
}

export async function listCatalogFacets(params: {
  locale: string
  keyword?: string
  modality?: string
  series?: string
  capability?: string
  platform?: string
}) {
  return request<TemplateCatalogFacets>(
    `/api/v1/ecommerce/template-center/catalog/facets${toQuery({
      locale: params.locale,
      keyword: params.keyword,
      modality: params.modality,
      series: params.series,
      capability: params.capability,
      platform: params.platform,
    })}`,
  )
}

export async function listRecommendations(locale: string) {
  return request<TemplateListItem[]>(
    `/api/v1/ecommerce/template-center/catalog/recommendations${toQuery({ locale })}`,
  )
}

export async function getTemplateDetail(templateId: string, locale: string) {
  return request<TemplateDetail>(
    `/api/v1/ecommerce/template-center/catalog/${templateId}${toQuery({ locale })}`,
  )
}

export async function listFavoriteTemplates(locale: string) {
  return request<TemplateListItem[]>(
    `/api/v1/ecommerce/template-center/favorites${toQuery({ locale })}`,
  )
}

export async function listTemplateInstances(locale: string) {
  return request<TemplateInstanceItem[]>(
    `/api/v1/ecommerce/template-center/instances${toQuery({ locale })}`,
  )
}

export async function addFavoriteTemplate(templateId: string) {
  return request<{ templateId: string; favorited: boolean }>(
    `/api/v1/ecommerce/template-center/catalog/${templateId}/favorite`,
    { method: 'POST' },
  )
}

export async function removeFavoriteTemplate(templateId: string) {
  return request<{ templateId: string; favorited: boolean }>(
    `/api/v1/ecommerce/template-center/catalog/${templateId}/favorite`,
    { method: 'DELETE' },
  )
}

export async function copyTemplateToMyTemplates(templateId: string) {
  return request<{ templateInstanceId: string; templateId: string }>(
    `/api/v1/ecommerce/template-center/catalog/${templateId}/copy`,
    { method: 'POST' },
  )
}

export async function useTemplateNow(templateId: string) {
  return request<TemplateUseResponse>(
    `/api/v1/ecommerce/template-center/catalog/${templateId}/use`,
    { method: 'POST' },
  )
}

export function saveUseTemplatePayload(payload: TemplateUseResponse) {
  sessionStorage.setItem(TEMPLATE_USE_PAYLOAD_KEY, JSON.stringify(payload))
}

export function loadUseTemplatePayload(): TemplateUseResponse | null {
  const raw = sessionStorage.getItem(TEMPLATE_USE_PAYLOAD_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as TemplateUseResponse
  } catch {
    return null
  }
}

export function clearUseTemplatePayload() {
  sessionStorage.removeItem(TEMPLATE_USE_PAYLOAD_KEY)
}
