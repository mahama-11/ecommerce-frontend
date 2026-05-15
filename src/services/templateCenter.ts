import { request } from '@/services/http'

// ─── Template Center Types ────────────────────────────────

export interface CatalogFacetBucket {
  key: string
  label: string
  count: number
}

export interface TemplateCatalogFacets {
  modalities: CatalogFacetBucket[]
  platforms: CatalogFacetBucket[]
  series: CatalogFacetBucket[]
  capabilities: CatalogFacetBucket[]
}

export interface TemplateListItem {
  id: string
  name: string
  summary: string
  coverAssetUrl?: string
  platformTags?: string[]
  industryTags?: string[]
  scenarioTags?: string[]
  useCount?: number
  favoriteCount?: number
  successRateHint?: string
  isFeatured?: boolean
  executorType?: string
  modality?: string
  series?: string
  capabilityType?: string
  interactionMode?: string
}

export interface TemplateDetailLocale {
  scenarioDescription?: string
  description?: string
  inputDescription?: string
  outputDescription?: string
}

export interface TemplateDetailVersion {
  versionLabel?: string
  sourceAssetRef?: string
}

export interface TemplateDetailSchema {
  inputSchema?: {
    fields?: Array<Record<string, unknown>>
  }
  executionSchema?: {
    route?: string
    toolSlug?: string
    supportsAsyncJob?: boolean
    supportsBatch?: boolean
    [key: string]: unknown
  }
  outputSchema?: {
    primaryOutput?: string
    image?: Record<string, unknown>
    [key: string]: unknown
  }
  [key: string]: unknown
}

export interface TemplateDetail {
  id: string
  name: string
  schema?: TemplateDetailSchema
  examples?: Array<Record<string, unknown>>
  locale?: TemplateDetailLocale
  version?: TemplateDetailVersion
}

export interface UseTemplatePayload {
  targetRoute?: string
  executorType: string
  preloadedTemplatePayload?: {
    templateName?: string
    executorType?: string
    modality?: string
    defaultVariables?: Record<string, unknown>
    promptLayers?: {
      l3?: { defaultContent?: string }
    }
  }
}

export interface ListCatalogParams {
  locale?: string
  page?: number
  pageSize?: number
  keyword?: string
  modality?: string
  platform?: string
  series?: string
  capability?: string
  query?: string
  sortBy?: string
}

export interface ListCatalogFacetsParams {
  locale?: string
  keyword?: string
  query?: string
  modality?: string
  series?: string
  capability?: string
  platform?: string
}

// ─── Template Center Service ──────────────────────────────

const PAYLOAD_KEY = 'ecommerce_use_template_payload'

export async function addFavoriteTemplate(templateId: string): Promise<unknown> {
  return request('/api/v1/template-center/favorites', {
    method: 'POST',
    body: JSON.stringify({ templateId }),
  })
}

export async function removeFavoriteTemplate(templateId: string): Promise<unknown> {
  return request(`/api/v1/template-center/favorites/${templateId}`, { method: 'DELETE' })
}

export async function copyTemplateToMyTemplates(templateId: string): Promise<unknown> {
  return request('/api/v1/template-center/my-templates', {
    method: 'POST',
    body: JSON.stringify({ templateId }),
  })
}

export async function getTemplateDetail(templateId: string, locale: string): Promise<TemplateDetail> {
  return request(`/api/v1/template-center/templates/${templateId}?locale=${locale}`, { method: 'GET' })
}

export async function listCatalog(params: ListCatalogParams): Promise<TemplateListItem[]> {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])).toString()
  return request(`/api/v1/template-center/catalog?${qs}`, { method: 'GET' })
}

export async function listCatalogFacets(params: ListCatalogFacetsParams): Promise<TemplateCatalogFacets> {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])).toString()
  return request(`/api/v1/template-center/catalog/facets?${qs}`, { method: 'GET' })
}

export async function listFavoriteTemplates(locale: string): Promise<TemplateListItem[]> {
  return request(`/api/v1/template-center/favorites?locale=${locale}`, { method: 'GET' })
}

export async function listRecommendations(locale: string): Promise<TemplateListItem[]> {
  return request(`/api/v1/template-center/recommendations?locale=${locale}`, { method: 'GET' })
}

export function saveUseTemplatePayload(payload: UseTemplatePayload): void {
  localStorage.setItem(PAYLOAD_KEY, JSON.stringify(payload))
}

export function clearUseTemplatePayload(): void {
  localStorage.removeItem(PAYLOAD_KEY)
}

export function loadUseTemplatePayload(): UseTemplatePayload | null {
  try {
    const raw = localStorage.getItem(PAYLOAD_KEY)
    return raw ? (JSON.parse(raw) as UseTemplatePayload) : null
  } catch {
    return null
  }
}

export async function useTemplateNow(templateId: string): Promise<UseTemplatePayload> {
  return request(`/api/v1/template-center/templates/${templateId}/use`, { method: 'POST' })
}
