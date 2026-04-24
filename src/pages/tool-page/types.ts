import type { TemplateListItem } from '@/services/templateCenter'

export type Locale = 'zh' | 'en'

export type GeneratedResult = {
  id: string
  title: string
  status: 'queued' | 'running' | 'done' | 'failed'
  hint: string
  progress: number
  assetId?: string
  previewUrl?: string
}

export type AssetRequirement = {
  slot: string
  label: string
  required: boolean
  fieldType: string
  acceptedTypes: string[]
}

export type ActiveTemplateState = {
  id: string
  templateCode: string
  name: string
  executorType: string
  modality: string
  defaultVariables: Array<[string, string]>
  assetRequirements: AssetRequirement[]
  sourceWarning?: string
}

export type ToolTemplateOption = Pick<
  TemplateListItem,
  'id' | 'slug' | 'name' | 'summary' | 'externalCode' | 'recommendScore'
>
