import { API_BASE_URL } from '@/services/apiBase'
import { buildHeaders, handleUnauthorized, request } from '@/services/http'
import { useToastStore } from '@/store/toastStore'
import type { ToolInputMode } from '@/types/tool'

export type SourceAssetInput = {
  slot: string
  role: string
  asset_id: string
  label?: string
  required?: boolean
}

export type SourceAssetSummary = {
  id: string
  asset_type: string
  source_type: string
  storage_key: string
  mime_type: string
  width: number
  height: number
  file_name: string
  metadata?: Record<string, unknown>
}

export type ImageJobSummary = {
  job_id: string
  organization_id: string
  user_id: string
  scene_type: string
  input_mode: string
  source_asset_id: string
  source_assets?: SourceAssetInput[]
  runtime_job_id: string
  status: string
  stage: string
  stage_message: string
  progress: number
  provider_job_id?: string
  selected_result_asset_id?: string
  last_error_code?: string
  last_error_message?: string
  metadata?: Record<string, unknown>
}

export async function registerSourceAsset(input: {
  productId: string
  skuCode: string
  fileName: string
  mimeType: string
  payload: string
  width?: number
  height?: number
  metadata?: Record<string, unknown>
}) {
  return request<SourceAssetSummary>('/api/v1/ecommerce/assets/source', {
    method: 'POST',
    body: JSON.stringify({
      product_id: input.productId,
      sku_code: input.skuCode,
      file_name: input.fileName,
      mime_type: input.mimeType,
      payload: input.payload,
      width: input.width,
      height: input.height,
      metadata: input.metadata,
    }),
  })
}

export async function createImageJob(input: {
  productId: string
  skuCode: string
  sceneType: string
  inputMode: ToolInputMode
  sourceAssetID?: string
  sourceAssets?: SourceAssetInput[]
  prompt: string
  negativePrompt?: string
  objective?: 'quality' | 'speed' | 'cost' | 'balanced'
  requestedVariants?: number
  width?: number
  height?: number
  templateCode?: string
}) {
  return request<ImageJobSummary>('/api/v1/ecommerce/image-jobs', {
    method: 'POST',
    body: JSON.stringify({
      product_id: input.productId,
      sku_code: input.skuCode,
      scene_type: input.sceneType,
      input_mode: input.inputMode,
      source_asset_id: input.sourceAssetID,
      source_assets: input.sourceAssets,
      prompt: input.prompt,
      negative_prompt: input.negativePrompt,
      objective: input.objective,
      requested_variants: input.requestedVariants,
      width: input.width,
      height: input.height,
      template_code: input.templateCode,
    }),
  })
}

export async function getImageJob(jobID: string) {
  return request<ImageJobSummary>(`/api/v1/ecommerce/image-jobs/${jobID}`)
}

export async function cancelImageJob(jobID: string) {
  return request<ImageJobSummary>(`/api/v1/ecommerce/image-jobs/${jobID}/cancel`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
}

export async function listImageJobs(params: { sceneType?: string; productId?: string; limit?: number } = {}) {
  const query = new URLSearchParams()
  if (params.sceneType) query.set('sceneType', params.sceneType)
  if (params.productId) query.set('productID', params.productId)
  if (typeof params.limit === 'number') query.set('limit', String(params.limit))
  const suffix = query.toString() ? `?${query.toString()}` : ''
  return request<ImageJobSummary[]>(`/api/v1/ecommerce/image-jobs${suffix}`)
}

export async function fetchAssetObjectURL(assetID: string) {
  const response = await fetch(`${API_BASE_URL}/api/v1/ecommerce/assets/${assetID}/content`, {
    headers: buildHeaders(),
  })
  if (!response.ok) {
    let errorMsg = `Failed to load asset content: ${response.status}`
    try {
      const payload = (await response.clone().json()) as { code?: number; error?: string; error_code?: string; error_hint?: string; message?: string }
      errorMsg = payload.error_hint || payload.error || payload.message || errorMsg
      handleUnauthorized(response.status, payload.code, payload.error_code)
    } catch {
      handleUnauthorized(response.status)
    }
    useToastStore.getState().showToast(errorMsg, 'error')
    throw new Error(errorMsg)
  }
  const blob = await response.blob()
  return URL.createObjectURL(blob)
}
