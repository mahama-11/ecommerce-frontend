import type { TemplateListItem } from '@/services/templateCenter'
import type { ToolInputMode } from '@/types/tool'

export type Locale = 'zh' | 'en'

export type GeneratedResult = {
  id: string
  title: string
  status: 'queued' | 'running' | 'done' | 'failed'
  hint: string
  progress: number
  assetId?: string
  sourceAssetId?: string
  previewUrl?: string
}

export type AssetRequirement = {
  slot: string
  role: string
  label: string
  helper?: string
  required: boolean
  fieldType: string
  acceptedTypes: string[]
  maxSizeMB?: number
  aspectRatio?: string
  minCount?: number
  maxCount?: number
}

export type ActiveTemplateState = {
  id: string
  templateCode: string
  name: string
  executorType: string
  modality: string
  inputMode?: ToolInputMode
  defaultVariables: Array<[string, string]>
  assetRequirements: AssetRequirement[]
  sourceWarning?: string
}

export type ToolTemplateOption = Pick<
  TemplateListItem,
  'id' | 'slug' | 'toolSlug' | 'name' | 'summary' | 'externalCode' | 'recommendScore' | 'coverAssetUrl'
>
