import { SIZE_OPTIONS } from './config'
import type { AssetRequirement, GeneratedResult, Locale } from './types'
import type { ToolRequiredAsset } from '@/types/tool'

export function copy(locale: Locale, zh: string, en: string) {
  return locale === 'zh' ? zh : en
}

export function sizeToDimensions(size: (typeof SIZE_OPTIONS)[number]['value']) {
  switch (size) {
    case '4:3':
      return { width: 1365, height: 1024 }
    case '3:4':
      return { width: 1024, height: 1365 }
    case '16:9':
      return { width: 1536, height: 864 }
    default:
      return { width: 1024, height: 1024 }
  }
}

export function toolToSceneType(slug: string) {
  return slug.replace(/-/g, '_')
}

export function resolveObjective(modelVersion: 'V1.0' | 'V2.0') {
  return modelVersion === 'V2.0' ? 'quality' : 'speed'
}

export function resolveModelVersionFromObjective(objective?: string) {
  return objective === 'speed' ? 'V1.0' : 'V2.0'
}

export function mapJobStatus(status: string): GeneratedResult['status'] {
  switch (status) {
    case 'completed':
      return 'done'
    case 'failed':
    case 'canceled':
      return 'failed'
    case 'processing':
      return 'running'
    default:
      return 'queued'
  }
}

export function isTerminalStatus(status: string) {
  return status === 'completed' || status === 'failed' || status === 'canceled'
}

export function resultStatusLabel(locale: Locale, status: GeneratedResult['status']) {
  switch (status) {
    case 'done':
      return copy(locale, '已完成', 'Done')
    case 'failed':
      return copy(locale, '失败', 'Failed')
    case 'running':
      return copy(locale, '处理中', 'Running')
    default:
      return copy(locale, '排队中', 'Queued')
  }
}

export function normalizeToolAssetRequirements(requiredAssets: ToolRequiredAsset[]): AssetRequirement[] {
  return requiredAssets.map(item => ({
    slot: item.slot,
    role: item.role,
    label: item.label,
    helper: item.helper,
    required: item.required,
    fieldType: 'image',
    acceptedTypes: item.constraints?.acceptedTypes ?? ['image/png', 'image/jpeg', 'image/webp'],
    maxSizeMB: item.constraints?.maxSizeMB,
    aspectRatio: item.constraints?.aspectRatio,
    minCount: item.constraints?.minCount,
    maxCount: item.constraints?.maxCount,
  }))
}

function readOptionalNumber(record: Record<string, unknown> | undefined, key: string): number | undefined {
  const value = record?.[key]
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value)
  return undefined
}

function normalizeRawAssetRequirements(items: Array<Record<string, unknown>>): AssetRequirement[] {
  return items.map(item => ({
    slot: typeof item.slot === 'string' ? item.slot : typeof item.key === 'string' ? item.key : 'asset',
    role: typeof item.role === 'string' ? item.role : typeof item.slot === 'string' ? item.slot : 'reference',
    label:
      typeof item.label === 'string'
        ? item.label
        : typeof item.name === 'string'
          ? item.name
          : typeof item.slot === 'string'
            ? item.slot
            : 'asset',
    helper: typeof item.helper === 'string' ? item.helper : typeof item.description === 'string' ? item.description : undefined,
    required: item.required !== false,
    fieldType: typeof item.fieldType === 'string' ? item.fieldType : typeof item.type === 'string' ? item.type : 'image',
    acceptedTypes: Array.isArray(item.acceptedTypes)
      ? item.acceptedTypes.filter((value): value is string => typeof value === 'string')
      : Array.isArray((item.constraints as Record<string, unknown> | undefined)?.acceptedTypes)
        ? ((item.constraints as Record<string, unknown>).acceptedTypes as unknown[]).filter((value): value is string => typeof value === 'string')
        : ['image/png', 'image/jpeg', 'image/webp'],
    maxSizeMB: readOptionalNumber(item, 'maxSizeMB') ?? readOptionalNumber(item.constraints as Record<string, unknown> | undefined, 'maxSizeMB'),
    aspectRatio: typeof item.aspectRatio === 'string' ? item.aspectRatio : typeof (item.constraints as Record<string, unknown> | undefined)?.aspectRatio === 'string' ? ((item.constraints as Record<string, unknown>).aspectRatio as string) : undefined,
    minCount: readOptionalNumber(item, 'minCount') ?? readOptionalNumber(item.constraints as Record<string, unknown> | undefined, 'minCount'),
    maxCount: readOptionalNumber(item, 'maxCount') ?? readOptionalNumber(item.constraints as Record<string, unknown> | undefined, 'maxCount'),
  }))
}

export function normalizeAssetRequirements(
  inputSchema: Record<string, unknown> | undefined,
  defaultVariablesRecord: Record<string, unknown> | undefined,
): AssetRequirement[] {
  const schemaRequiredAssets = Array.isArray(inputSchema?.required_assets)
    ? (inputSchema.required_assets as Array<Record<string, unknown>>)
    : Array.isArray(inputSchema?.requiredAssets)
      ? (inputSchema.requiredAssets as Array<Record<string, unknown>>)
      : []
  if (schemaRequiredAssets.length > 0) return normalizeRawAssetRequirements(schemaRequiredAssets)

  const fromDefaultVariables = Array.isArray(defaultVariablesRecord?.assetRequirements)
    ? (defaultVariablesRecord?.assetRequirements as Array<Record<string, unknown>>)
    : Array.isArray(defaultVariablesRecord?.required_assets)
      ? (defaultVariablesRecord?.required_assets as Array<Record<string, unknown>>)
      : []
  if (fromDefaultVariables.length > 0) return normalizeRawAssetRequirements(fromDefaultVariables)

  const fields = Array.isArray(inputSchema?.fields)
    ? (inputSchema.fields as Array<Record<string, unknown>>)
    : []
  return fields
    .filter(field => typeof field.type === 'string' && field.type.includes('image'))
    .map(field => ({
      slot: typeof field.key === 'string' ? field.key : 'asset',
      role: typeof field.role === 'string' ? field.role : 'reference',
      label:
        typeof field.label === 'string'
          ? field.label
          : typeof field.role === 'string'
            ? field.role
            : typeof field.key === 'string'
              ? field.key
              : 'asset',
      helper: typeof field.helper === 'string' ? field.helper : undefined,
      required: field.required !== false,
      fieldType: typeof field.type === 'string' ? field.type : 'image',
      acceptedTypes: Array.isArray(field.acceptedTypes)
        ? field.acceptedTypes.filter((value): value is string => typeof value === 'string')
        : Array.isArray((field.constraints as Record<string, unknown> | undefined)?.acceptedTypes)
          ? ((field.constraints as Record<string, unknown>).acceptedTypes as unknown[]).filter((value): value is string => typeof value === 'string')
          : ['image/png', 'image/jpeg', 'image/webp'],
      maxSizeMB: readOptionalNumber(field, 'maxSizeMB') ?? readOptionalNumber(field.constraints as Record<string, unknown> | undefined, 'maxSizeMB'),
      aspectRatio: typeof field.aspectRatio === 'string' ? field.aspectRatio : typeof (field.constraints as Record<string, unknown> | undefined)?.aspectRatio === 'string' ? ((field.constraints as Record<string, unknown>).aspectRatio as string) : undefined,
      minCount: readOptionalNumber(field, 'minCount') ?? readOptionalNumber(field.constraints as Record<string, unknown> | undefined, 'minCount'),
      maxCount: readOptionalNumber(field, 'maxCount') ?? readOptionalNumber(field.constraints as Record<string, unknown> | undefined, 'maxCount'),
    }))
}

export function assetAccept(requirement: AssetRequirement | undefined) {
  return (requirement?.acceptedTypes?.length ? requirement.acceptedTypes : ['image/png', 'image/jpeg', 'image/webp']).join(',')
}

export function isFileAccepted(file: File, requirement: AssetRequirement | undefined) {
  const acceptedTypes = requirement?.acceptedTypes?.length ? requirement.acceptedTypes : ['image/png', 'image/jpeg', 'image/webp']
  const fileType = file.type.toLowerCase()
  const fileName = file.name.toLowerCase()
  return acceptedTypes.some(type => {
    const normalized = type.toLowerCase().trim()
    if (!normalized) return false
    if (normalized.endsWith('/*')) return fileType.startsWith(normalized.slice(0, -1))
    if (normalized.startsWith('.')) return fileName.endsWith(normalized)
    return fileType === normalized
  })
}

export function formatRequirementConstraints(locale: Locale, requirement: AssetRequirement) {
  const parts: string[] = []
  if (requirement.acceptedTypes.length) parts.push(requirement.acceptedTypes.join(', '))
  if (requirement.maxSizeMB) parts.push(copy(locale, `最大 ${requirement.maxSizeMB}MB`, `Max ${requirement.maxSizeMB}MB`))
  if (requirement.aspectRatio) parts.push(copy(locale, `比例 ${requirement.aspectRatio}`, `Ratio ${requirement.aspectRatio}`))
  if (requirement.minCount || requirement.maxCount) parts.push(copy(locale, `数量 ${requirement.minCount ?? 1}-${requirement.maxCount ?? '∞'}`, `Count ${requirement.minCount ?? 1}-${requirement.maxCount ?? '∞'}`))
  return parts.join(' · ')
}

export function formatAssetLabel(locale: Locale, value: string) {
  const normalized = value.replace(/[_-]+/g, ' ').trim()
  if (!normalized) return copy(locale, '素材图', 'Asset')
  if (locale === 'en') return normalized
  return normalized
}

export function defaultAssetGuide(locale: Locale, toolSlug: string) {
  const guides: Record<string, { title: string; helper: string }> = {
    'changing-model': {
      title: copy(locale, '上传真人试穿图', 'Upload Real Try-On Image'),
      helper: copy(locale, '建议使用真人上身图，服装主体完整、肩线和下摆清晰。', 'Use a real try-on image with clear garment silhouette, shoulder seams, and hem details.'),
    },
    'changing-mannequin': {
      title: copy(locale, '上传人台服装图', 'Upload Mannequin Garment Image'),
      helper: copy(locale, '建议使用正面或 3/4 角度的人台服装图，方便还原版型与垂感。', 'Use a front or 3/4 mannequin garment image to restore fit and drape more accurately.'),
    },
    'changing-bg': {
      title: copy(locale, '上传模特图', 'Upload Model Image'),
      helper: copy(locale, '建议使用主体完整、边缘清晰的棚拍或真人模特图。', 'Use a clean model image with complete subject edges and stable studio lighting.'),
    },
    'ai-dressing': {
      title: copy(locale, '上传服装主图', 'Upload Garment Image'),
      helper: copy(locale, '当前阶段优先使用正面平铺服装图作为主素材，细节越完整越好。', 'At this stage, use a front-facing flat-lay garment image as the main source, with clear details.'),
    },
    'ai-wearable': {
      title: copy(locale, '上传配饰商品图', 'Upload Wearable Product Image'),
      helper: copy(locale, '建议使用配饰商品的清晰正面图，突出材质、LOGO 和关键结构。', 'Use a clean accessory product image that clearly shows material, logo, and key details.'),
    },
    'ai-posture': {
      title: copy(locale, '上传模特姿势图', 'Upload Model Pose Image'),
      helper: copy(locale, '建议使用全身或半身模特图，人物身份和服装细节要清晰。', 'Use a full-body or half-body model image with clear identity and garment details.'),
    },
    'ai-product': {
      title: copy(locale, '上传商品图', 'Upload Product Image'),
      helper: copy(locale, '建议使用白底、透明底或抠干净的商品图，方便做场景融合。', 'Use a white-background, transparent-background, or well-cut product image for scene composition.'),
    },
    'product-replacement': {
      title: copy(locale, '上传场景参考图', 'Upload Scene Reference Image'),
      helper: copy(locale, '当前阶段先上传场景参考图作为主素材，后续再补多素材替换工作台。', 'For now, upload the reference scene image as the primary asset before we add the multi-asset replacement flow.'),
    },
    'image-fission': {
      title: copy(locale, '上传场景参考图', 'Upload Scene Reference Image'),
      helper: copy(locale, '建议使用构图完整、风格明确的场景参考图，便于做系列裂变。', 'Use a strong reference scene with clear composition and style to create better variations.'),
    },
    'scene-image': {
      title: copy(locale, '上传场景参考素材', 'Upload Scene Reference Asset'),
      helper: copy(locale, '当前页仍以单图工作流为主，建议上传风格参考图辅助生成场景方向。', 'This page still follows a single-image workflow, so upload a style reference image to guide the scene direction.'),
    },
    'handheld-goods': {
      title: copy(locale, '上传商品图', 'Upload Product Image'),
      helper: copy(locale, '建议使用商品正面或 3/4 角度图，保留尺寸感和品牌细节。', 'Use a front or 3/4 product image to preserve scale and branding details.'),
    },
    'clothing-image-suite': {
      title: copy(locale, '上传服装主图', 'Upload Garment Key Image'),
      helper: copy(locale, '当前页先支持选择一张最核心的服装素材作为套图起始图。', 'This page currently starts from one key garment asset as the suite entry image.'),
    },
    'product-image-suite': {
      title: copy(locale, '上传商品主图', 'Upload Product Key Image'),
      helper: copy(locale, '当前页先支持选择一张最核心的商品素材作为套图起始图。', 'This page currently starts from one key product asset as the suite entry image.'),
    },
    'product-refine': {
      title: copy(locale, '上传商品原图', 'Upload Original Product Image'),
      helper: copy(locale, '建议上传未经压缩的原始商品图，方便进行颜色与细节精修。', 'Use the highest-quality original product image for better color and detail refinement.'),
    },
  }
  return (
    guides[toolSlug] ?? {
      title: copy(locale, '上传主素材图', 'Upload Primary Source Image'),
      helper: copy(locale, '建议上传主体完整、清晰度高的图片作为本次生成主素材。', 'Upload a clear image with the full subject visible as the primary source asset.'),
    }
  )
}

export async function fileToDataURL(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export async function getImageDimensions(file: File) {
  return await new Promise<{ width: number; height: number }>((resolve) => {
    const url = URL.createObjectURL(file)
    const image = new window.Image()
    image.onload = () => {
      resolve({ width: image.naturalWidth || 0, height: image.naturalHeight || 0 })
      URL.revokeObjectURL(url)
    }
    image.onerror = () => {
      resolve({ width: 0, height: 0 })
      URL.revokeObjectURL(url)
    }
    image.src = url
  })
}
