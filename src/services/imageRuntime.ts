import { API_BASE_URL } from '@/services/apiBase'
import { getAccessToken } from '@/services/auth'
import { useToastStore } from '@/store/toastStore'

type ApiEnvelope<T> = {
  code: number
  message: string
  data: T
  error?: string
  error_code?: string
  error_hint?: string
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
  fileName: string
  mimeType: string
  payload: string
  width?: number
  height?: number
  metadata?: Record<string, unknown>
}) {
  return requestJSON<SourceAssetSummary>('/api/v1/ecommerce/assets/source', {
    method: 'POST',
    body: JSON.stringify({
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
  sceneType: string
  sourceAssetID: string
  prompt: string
  negativePrompt?: string
  objective?: 'quality' | 'speed' | 'cost' | 'balanced'
  requestedVariants?: number
  width?: number
  height?: number
  templateCode?: string
}) {
  return requestJSON<ImageJobSummary>('/api/v1/ecommerce/image-jobs', {
    method: 'POST',
    body: JSON.stringify({
      scene_type: input.sceneType,
      input_mode: 'image_to_image',
      source_asset_id: input.sourceAssetID,
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
  return requestJSON<ImageJobSummary>(`/api/v1/ecommerce/image-jobs/${jobID}`)
}

export async function listImageJobs(params: { sceneType?: string; limit?: number } = {}) {
  const query = new URLSearchParams()
  if (params.sceneType) query.set('sceneType', params.sceneType)
  if (typeof params.limit === 'number') query.set('limit', String(params.limit))
  const suffix = query.toString() ? `?${query.toString()}` : ''
  return requestJSON<ImageJobSummary[]>(`/api/v1/ecommerce/image-jobs${suffix}`)
}

export async function fetchAssetObjectURL(assetID: string) {
  const token = getAccessToken()
  const response = await fetch(`${API_BASE_URL}/api/v1/ecommerce/assets/${assetID}/content`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  if (!response.ok) {
    const errorMsg = `Failed to load asset content: ${response.status}`
    useToastStore.getState().showToast(errorMsg, 'error')
    throw new Error(errorMsg)
  }
  const blob = await response.blob()
  return URL.createObjectURL(blob)
}

async function requestJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  const payload = (await response.json()) as ApiEnvelope<T>
  if (!response.ok || payload.code !== 0) {
    const errorMsg = payload.error_hint || payload.error || payload.message || `Request failed with status ${response.status}`
    useToastStore.getState().showToast(errorMsg, 'error')
    throw new Error(errorMsg)
  }

  return payload.data
}
