import { fetchAuthenticatedObjectUrl, request } from '@/services/http'
import { getProduct } from '@/services/product'
import type {
  StartParsingRequest,
  StartParsingResponse,
  EvaluateDecisionTreeRequest,
  CompileIntentRequest,
  CompiledIntent,
  ExecutionConfig,
  TaskQuota,
  AssetVariant,
  CreateInpaintTaskRequest,
  InpaintTask,
  RefinementSession,
  RefinementMessage,
  SendRefinementMessageRequest,
  FinalizeAssetsRequest,
  DualTrackParsing,
  LlmDecisionTreeResult,
  ParsingSource,
  ParsedAttribute,
  IntentType,
  VersionNode,
} from '@/types/production'
import {
  isDevMode,
  delay,
  uid,
  mockDualTrackParsing,
  mockDecisionTree,
  MOCK_INTENTS,
  MOCK_EXECUTION_CONFIG,
  MOCK_QUOTA,
  MOCK_VARIANTS,
  mockInpaintTask,
  mockRefinementSession,
  mockRefinementReply,
} from '@/mocks/productionDemo'

const VWF = '/api/v1/ecommerce/v2/visual-workflows'
const PRODUCT_VWF = '/api/v1/ecommerce/products'

let devIntentCounter = 4

type VisualSession = {
  id: string
  product_id: string
  sku_code: string
  current_stage: string
  status: string
  intent_spec?: IntentSpecDTO
  prompt_plan?: PromptPlanDTO
  generation_versions?: GenerationVersionDTO[]
}

type SourceReferenceDTO = {
  id: string
  source_kind: string
  source_ref?: string
  asset_id?: string
  asset_relation_id?: string
  asset_content_url?: string
  mime_type?: string
  status: string
  metadata?: Record<string, unknown>
}

type DeconstructionJobDTO = {
  job_id: string
  runtime_job_id?: string
  status: string
  stage?: string
  progress?: number
  unavailable_reason?: string
  error_code?: string
  error_message?: string
}

type DeconstructionElementDTO = {
  id: string
  element_type: string
  element_key?: string
  label?: string
  confidence?: number
  value?: Record<string, unknown>
  selected?: boolean
  confirmed?: boolean
  decision?: 'keep' | 'replace' | 'drop' | string
  readiness?: string
  source_role?: 'sku' | 'reference' | string
  source_reference_id?: string
  source_asset_id?: string
}


type IntentSpecDTO = {
  schema_version?: string
  scene_type?: string
  tool_slug?: string
  product_id?: string
  sku_code?: string
  selections?: Array<{
    element_id?: string
    element_type?: string
    decision?: string
    element_key?: string
    label?: string
    value?: Record<string, unknown>
  }>
  requirements?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

type PromptPlanDTO = {
  schema_version?: string
  status?: string
  prompt_id?: string
  scene_type?: string
  template_id?: string
  variables?: Record<string, unknown>
  source_assets?: Array<Record<string, unknown>>
  metadata?: Record<string, unknown>
  blockers?: Array<{ code: string; message: string; target?: string }>
}

type ResultAssetDTO = {
  asset_id: string
  asset_content_url?: string
  role?: string
  selected?: boolean
  metadata?: Record<string, unknown>
}

type GenerationVersionDTO = {
  version_id: string
  prompt_id?: string
  status: string
  stage?: string
  progress?: number
  runtime_job_id?: string
  selected_result_asset_id?: string
  result_assets?: ResultAssetDTO[]
  parent_version_id?: string
  prompt_plan_status?: string
  metadata?: Record<string, unknown>
  created_at?: string
}

type StageViewDTO = VisualSession & {
  session_id?: string
  source_reference?: SourceReferenceDTO
  source_references?: SourceReferenceDTO[]
  deconstruction_job?: DeconstructionJobDTO
  deconstruction_elements: DeconstructionElementDTO[]
  readiness?: {
    overall?: string
    deconstruction?: string
    prompt?: string
    generation?: string
    blockers?: Array<{ code: string; message: string; target?: string }>
  }
  runtime_capabilities?: Array<{ task_type: string; status: string; available: boolean; unavailable_reason?: string }>
  runtime_capability_error?: { code: string; message: string }
  updated_at?: string
}

const sessionKey = (productId: string) => `ecommerce.production.visualSession.${productId}`
const sourceKey = (productId: string) => `ecommerce.production.sources.${productId}`
const intentKey = (productId: string) => `ecommerce.production.intents.${productId}`

function getStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : fallback
  } catch {
    return fallback
  }
}

function setStored<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

function clearStored(key: string) {
  localStorage.removeItem(key)
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

function contractNeeded(message: string): never {
  const error = new Error(message)
  error.name = 'CONTRACT_NEEDED'
  throw error
}

async function getSkuCode(productId: string): Promise<string> {
  try {
    const detail = await getProduct(productId)
    const sku = detail.product.skuCode?.trim()
    return sku || productId
  } catch {
    return productId
  }
}

async function ensureVisualSession(productId: string): Promise<VisualSession> {
  const cached = getStored<VisualSession | null>(sessionKey(productId), null)
  if (cached?.id) {
    try {
      const current = await request<VisualSession>(`${VWF}/${cached.id}`, { method: 'GET', silent: true })
      if (current.product_id === productId) {
        setStored(sessionKey(productId), current)
        return current
      }
    } catch {
      clearStored(sessionKey(productId))
    }
  }

  const listed = await request<{ items: VisualSession[] }>(`${VWF}/sessions?product_id=${encodeURIComponent(productId)}&limit=1`, { method: 'GET', silent: true })
  const existing = listed.items?.[0]
  if (existing?.id) {
    setStored(sessionKey(productId), existing)
    return existing
  }

  const skuCode = await getSkuCode(productId)
  const created = await request<VisualSession>(`${PRODUCT_VWF}/${productId}/v2/visual-sessions`, {
    method: 'POST',
    body: JSON.stringify({
      sku_code: skuCode,
      tool_slug: 'production-pipeline',
      idempotency_key: `production-pipeline:${productId}:${skuCode}`,
    }),
  })
  setStored(sessionKey(productId), created)
  return created
}

async function getStageView(productId: string): Promise<StageViewDTO> {
  const session = await ensureVisualSession(productId)
  return request<StageViewDTO>(`${VWF}/${session.id}/stage-view`, { method: 'GET' })
}

export type PromptDiffSummary = {
  added: string[]
  removed: string[]
  changed: string[]
  status?: string
}

export type PromptPlanSummary = {
  status: string
  source: string
  promptId?: string
  sceneType?: string
  variables: Record<string, unknown>
  metadata: Record<string, unknown>
  diff: PromptDiffSummary
}

function compactDiffValue(value: unknown): string {
  if (value == null) return '空'
  if (typeof value === 'boolean') return value ? '是' : '否'
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (Array.isArray(value)) return `${value.length} 项`
  if (typeof value === 'object') return '已更新'
  return String(value)
}

function humanizeDiffPath(path: unknown): string {
  const raw = String(path ?? 'change')
  const tail = raw.split('.').filter(Boolean).pop() ?? raw
  const labels: Record<string, string> = {
    prompt_id: '提示词计划 ID',
    scene_type: '场景类型',
    tool_slug: '生产工具',
    locale: '语言',
    marketplace: '平台',
    sku_code: 'SKU',
    product_id: '商品',
    status: '状态',
    execution_contract: '执行合同',
    prompt_diff: '变化说明',
    source: '来源',
    variant: '版本',
    decision: '取舍决策',
    qa: 'QA 标记',
  }
  return labels[tail] ?? raw.replace(/_/g, ' ')
}

function stringifyDiffItem(item: unknown): string {
  if (typeof item === 'string') return item
  if (item && typeof item === 'object') {
    const obj = item as Record<string, unknown>
    if (obj.field || obj.from || obj.to) return `${humanizeDiffPath(obj.field)}：${compactDiffValue(obj.from)} → ${compactDiffValue(obj.to)}`
    if (obj.path && 'value' in obj) return `${humanizeDiffPath(obj.path)}：${compactDiffValue(obj.value)}`
    if (obj.path && ('previous' in obj || 'current' in obj)) return `${humanizeDiffPath(obj.path)}：${compactDiffValue(obj.previous)} → ${compactDiffValue(obj.current)}`
  }
  return compactDiffValue(item)
}

function promptPlanSummary(stage: StageViewDTO): PromptPlanSummary {
  const plan = stage.prompt_plan ?? {}
  const metadata = plan.metadata ?? {}
  const rawDiff = (metadata.prompt_diff ?? metadata.diff ?? {}) as Record<string, unknown>
  const toStrings = (value: unknown) => Array.isArray(value) ? value.map(stringifyDiffItem) : []
  return {
    status: String(plan.status ?? 'unknown'),
    source: String(metadata.source ?? 'backend_intent_fusion'),
    promptId: plan.prompt_id,
    sceneType: plan.scene_type,
    variables: plan.variables ?? {},
    metadata,
    diff: {
      added: toStrings(rawDiff.added),
      removed: toStrings(rawDiff.removed),
      changed: toStrings(rawDiff.changed),
      status: typeof rawDiff.status === 'string' ? rawDiff.status : undefined,
    },
  }
}

export async function getPromptPlanSummary(productId: string): Promise<PromptPlanSummary> {
  return promptPlanSummary(await getStageView(productId))
}

export async function requestPromptPlanner(productId: string, opts?: { marketplace?: string; locale?: string; promptVariables?: Record<string, unknown> }): Promise<{ runtimeJobId?: string; status: string }> {
  const session = await ensureVisualSession(productId)
  const response = await request<{ runtime_job_id?: string; status: string }>(`${VWF}/${session.id}/prompt-planner-jobs`, {
    method: 'POST',
    body: JSON.stringify({
      marketplace: opts?.marketplace ?? 'amazon',
      locale: opts?.locale ?? 'zh-CN',
      prompt_variables: { ...(opts?.promptVariables ?? {}), prompt_diff: true },
      idempotency_key: `prompt-plan:${session.id}:${Date.now()}`,
    }),
  })
  return { runtimeJobId: response.runtime_job_id, status: response.status }
}

function normalizeStatus(status?: string): 'idle' | 'parsing' | 'succeeded' | 'failed' {
  switch ((status ?? '').toLowerCase()) {
    case 'running':
    case 'processing':
    case 'dispatching':
    case 'queued':
    case 'pending':
    case 'created':
      return 'parsing'
    case 'completed':
    case 'succeeded':
    case 'ready':
      return 'succeeded'
    case 'failed':
    case 'cancelled':
    case 'contract_needed':
      return 'failed'
    default:
      return 'idle'
  }
}

function normalizeConfidence(value?: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0
  return Math.max(0, Math.min(1, value > 1 ? value / 100 : value))
}


function userFacingText(input: unknown): string {
  const raw = Array.isArray(input) ? input.join('，') : String(input ?? '')
  return raw
    .replace(/Manifest-declared SKU visual asset; geometry analysis pending runtime image bytes/gi, '已识别为当前商品图片；系统会在生成时以实物图为准。')
    .replace(/Manifest-declared SKU asset; geometry not extractable without image bytes\.?/gi, '已识别为当前商品图片；系统会在生成时以实物图为准。')
    .replace(/Requested element:\s*product geometry analysis pending visual byte ingestion for asset_[A-Za-z0-9_-]+/gi, '当前图片可以作为商品主体，但外形细节还需要在生成前再次确认。')
    .replace(/Requested element:\s*material analysis pending visual byte ingestion for asset_[A-Za-z0-9_-]+/gi, '当前图片可以作为材质参考，但具体材质还需要确认。')
    .replace(/Reference asset available:\s*asset_[A-Za-z0-9_-]+\s*\([^)]*\)\s*for comparative visual analysis/gi, '参考图已就绪，可用于对比风格、场景和构图。')
    .replace(/All visual facts unverified:.*$/gi, '当前还有部分视觉细节无法自动确认，请以你上传的商品图为准。')
    .replace(/geometry not extractable without image bytes\.?/gi, '图片细节不足，建议确认商品外形。')
    .replace(/backend/gi, '系统')
    .replace(/runtime/gi, '生成服务')
    .replace(/contract[-_ ]needed/gi, '暂不可用')
    .replace(/prompt[_ ]plan/gi, '生成方案')
    .replace(/provider/gi, '生成服务')
    .replace(/manifest/gi, '图片信息')
    .replace(/SKU asset/gi, '商品图片')
    .replace(/image bytes/gi, '图片内容')
    .replace(/product_geometry/gi, '商品形态')
    .replace(/brand_constraints/gi, '品牌约束')
    .replace(/material/gi, '材质')
    .replace(/style/gi, '风格')
    .replace(/scene/gi, '场景')
}

function elementLabel(element: DeconstructionElementDTO): string {
  const raw = element.label || element.element_key || element.element_type
  const key = String(raw ?? '').toLowerCase().replace(/\s+/g, '_')
  const labels: Record<string, string> = {
    product_geometry: '商品形态',
    geometry: '商品形态',
    material: '材质质感',
    style: '视觉风格',
    scene: '使用场景',
    brand_constraints: '品牌约束',
    reference_composition: '参考图构图',
    scene_reference: '参考图场景',
    analysis_limitation: '识别提醒',
    unverified_visual_claim: '待确认视觉点',
    lighting: '光线氛围',
    composition: '画面构图',
    background: '背景环境',
  }
  return labels[key] ?? userFacingText(raw)
}

function elementToAttribute(element: DeconstructionElementDTO): ParsedAttribute {
  const value = element.value?.value ?? element.value?.text ?? element.value?.label ?? element.label ?? element.element_key ?? element.id
  const sourceRole = element.source_role === 'sku' || element.source_role === 'reference' ? element.source_role : undefined
  return {
    key: element.element_key || element.id,
    label: elementLabel(element),
    value: Array.isArray(value) || typeof value === 'number' || typeof value === 'string' ? userFacingText(value) : userFacingText(JSON.stringify(value)),
    confidence: normalizeConfidence(element.confidence),
    editable: true,
    source: 'third_party',
    sourceRole,
    sourceReferenceId: element.source_reference_id,
    driftFromOriginal: element.readiness === 'confirmed' ? 0 : undefined,
  }
}

function stageToParsing(stage: StageViewDTO): DualTrackParsing {
  const status = normalizeStatus(stage.deconstruction_job?.status ?? stage.status)
  const attributes = (stage.deconstruction_elements ?? []).map(elementToAttribute)
  const result = {
    track: 'third_party' as const,
    status,
    attributes,
    parsedAt: stage.updated_at,
    error: stage.deconstruction_job?.error_message || stage.runtime_capability_error?.message,
  }
  return {
    status,
    primaryTrack: 'third_party',
    thirdPartyResult: result,
    mergedAttributes: attributes,
    conflicts: [],
  }
}

function stageToDecisionTree(stage: StageViewDTO): LlmDecisionTreeResult {
  const blockers = stage.readiness?.blockers ?? stage.prompt_plan?.blockers ?? []
  const selections = stage.intent_spec?.selections ?? []
  const elements = stage.deconstruction_elements ?? []
  const visibleElements = elements.slice(0, 6)
  const activeIndex = Math.max(0, visibleElements.findIndex((element) => !element.confirmed))
  const steps = visibleElements.map((element, idx) => ({
    id: element.id,
    stepNumber: idx + 1,
    title: elementLabel(element),
    description: element.value ? userFacingText(element.value.text ?? element.value.label ?? element.value.value ?? element.value) : undefined,
    options: [
      { id: `${element.id}:keep`, label: '保留参考图效果', description: '沿用参考图里的场景、光线或氛围', confidence: normalizeConfidence(element.confidence) },
      { id: `${element.id}:replace`, label: '换成我的商品', description: '以当前商品图为主体，参考图只作风格参考' },
      { id: `${element.id}:drop`, label: '不采用这一项', description: '这项不进入后续生成要求' },
    ],
    selectedOptionId: element.decision ? `${element.id}:${element.decision}` : (element.selected ? `${element.id}:keep` : undefined),
    status: (element.confirmed ? 'completed' : idx === activeIndex ? 'active' : 'pending') as 'pending' | 'active' | 'completed',
  }))
  return {
    status: blockers.length > 0 ? 'failed' : (selections.length > 0 || elements.length > 0 ? 'succeeded' : 'idle'),
    steps,
    recommendedActions: blockers.length > 0 ? blockers.map(b => userFacingText(b.message)) : ['确认要保留哪些参考效果', '补充生成要求', '进入策略配置'],
    overallConfidence: elements.length ? elements.reduce((sum, e) => sum + normalizeConfidence(e.confidence), 0) / elements.length : 0,
    provider: 'internal',
    evaluatedAt: stage.updated_at,
  }
}

function getLocalSources(productId: string): ParsingSource[] {
  return getStored<ParsingSource[]>(sourceKey(productId), [])
}

function saveLocalSources(productId: string, sources: ParsingSource[]) {
  setStored(sourceKey(productId), sources)
}

export async function listParsingSources(productId: string): Promise<ParsingSource[]> {
  const localSources = getLocalSources(productId)
  if (isDevMode()) return localSources

  try {
    const stage = await getStageView(productId)
    const sourceRefs = stage.source_references?.length ? stage.source_references : stage.source_reference ? [stage.source_reference] : []
    if (sourceRefs.length === 0) return localSources

    const backendSources = await Promise.all(sourceRefs.map(async (sourceRef) => {
      const sourceRole = sourceRef.metadata?.source_role === 'reference' || sourceRef.source_kind === 'url' ? 'reference' : 'sku'
      const assetContentPath = sourceRef.asset_content_url || (sourceRef.asset_id ? `/api/v1/ecommerce/assets/${sourceRef.asset_id}/content` : '')
      const displayUrl = assetContentPath ? await fetchAuthenticatedObjectUrl(assetContentPath) : ''
      return {
        id: sourceRef.asset_id || sourceRef.id,
        type: sourceRole === 'reference' ? 'reference_image' : 'sku_image',
        url: displayUrl,
        thumbnailUrl: displayUrl,
        name: String(sourceRef.metadata?.file_name || sourceRef.source_ref || sourceRef.asset_id || sourceRef.id),
        uploadedAt: stage.updated_at || new Date().toISOString(),
        assetId: sourceRef.asset_id,
        assetRelationId: sourceRef.asset_relation_id,
        sourceReferenceId: sourceRef.id,
        sourceRole,
        mimeType: sourceRef.mime_type || 'image/*',
      } satisfies ParsingSource
    }))
    const backendIds = new Set(backendSources.flatMap((item) => [item.id, item.assetId].filter(Boolean) as string[]))
    const merged = [...localSources.filter((item) => !backendIds.has(item.id) && (!item.assetId || !backendIds.has(item.assetId))), ...backendSources]
    saveLocalSources(productId, merged)
    return merged
  } catch {
    return localSources
  }
}

export async function uploadParsingSource(productId: string, file: File, sourceType: ParsingSource['type'] = 'sku_image'): Promise<ParsingSource> {
  if (isDevMode()) {
    await delay(600)
    const source: ParsingSource = {
      id: `local-src-${uid()}`,
      type: sourceType,
      url: URL.createObjectURL(file),
      thumbnailUrl: URL.createObjectURL(file),
      name: file.name,
      mimeType: file.type || 'application/octet-stream',
      sourceRole: sourceType === 'reference_image' ? 'reference' : 'sku',
      uploadedAt: new Date().toISOString(),
    }
    const sources = getLocalSources(productId)
    saveLocalSources(productId, [...sources, source])
    return source
  }

  const skuCode = await getSkuCode(productId)
  const payload = await readFileAsDataURL(file)
  const asset = await request<{ id: string; mime_type: string; file_name?: string }>(`/api/v1/ecommerce/assets/source`, {
    method: 'POST',
    body: JSON.stringify({
      product_id: productId,
      sku_code: skuCode,
      file_name: file.name,
      mime_type: file.type || 'application/octet-stream',
      payload,
      metadata: { frontend_entrypoint: 'pre_generation_hub', source_role: sourceType === 'reference_image' ? 'reference' : 'sku' },
    }),
  })
  const relation = await request<{ id: string }>(`/api/v1/ecommerce/products/${productId}/assets`, {
    method: 'POST',
    body: JSON.stringify({
      asset_id: asset.id,
      relation_type: 'source',
      asset_role: sourceType === 'reference_image' ? 'scene_shot' : 'hero',
      is_primary: sourceType !== 'reference_image',
    }),
  })
  const localPreviewUrl = URL.createObjectURL(file)
  const source: ParsingSource = {
    id: asset.id,
    type: sourceType,
    url: localPreviewUrl,
    thumbnailUrl: localPreviewUrl,
    name: file.name,
    uploadedAt: new Date().toISOString(),
    assetId: asset.id,
    assetRelationId: relation.id,
    sourceRole: sourceType === 'reference_image' ? 'reference' : 'sku',
    mimeType: asset.mime_type || file.type || 'application/octet-stream',
  }
  const sources = getLocalSources(productId).filter((item) => item.assetId !== asset.id && item.id !== asset.id)
  saveLocalSources(productId, [...sources, source])
  return source
}


async function ensureSourceReference(sessionId: string, productId: string, source: ParsingSource): Promise<SourceReferenceDTO> {
  if (source.sourceReferenceId) {
    return {
      id: source.sourceReferenceId,
      source_kind: source.type === 'url' ? 'url' : 'product_asset',
      source_ref: source.assetId || source.url || source.name || source.id,
      asset_id: source.assetId,
      asset_relation_id: source.assetRelationId,
      mime_type: source.mimeType,
      status: 'ready',
      metadata: { source_role: source.sourceRole },
    }
  }

  const sourceRole = source.sourceRole ?? (source.type === 'reference_image' || source.type === 'url' ? 'reference' : 'sku')
  return request<SourceReferenceDTO>(`${VWF}/${sessionId}/source-references`, {
    method: 'POST',
    body: JSON.stringify({
      source_kind: source.type === 'url' ? 'url' : source.assetId ? 'product_asset' : 'upload',
      source_ref: source.assetId || source.url || source.name || source.id || productId,
      asset_id: source.assetId,
      asset_relation_id: source.assetRelationId,
      mime_type: source.mimeType || (source.type === 'url' ? undefined : 'image/*'),
      metadata: {
        frontend_source_id: source.id,
        source_role: sourceRole,
        file_name: source.name,
      },
    }),
  })
}

export async function startParsing(req: StartParsingRequest): Promise<StartParsingResponse> {
  if (isDevMode()) {
    await delay(400)
    return { parsingJobId: `job-${uid()}`, status: 'parsing' }
  }
  const session = await ensureVisualSession(req.productId)
  const localSources = getLocalSources(req.productId)
  const selectedSources = localSources.filter(s => req.sourceIds.includes(s.id) || (s.assetId && req.sourceIds.includes(s.assetId)))
  const skuSources = selectedSources.filter(s => (s.sourceRole ?? (s.type === 'reference_image' ? 'reference' : 'sku')) === 'sku')
  const referenceSources = selectedSources.filter(s => (s.sourceRole ?? (s.type === 'reference_image' ? 'reference' : 'sku')) === 'reference')
  if (skuSources.length === 0 || referenceSources.length === 0) {
    contractNeeded('Dual-track parsing requires at least one SKU source and one reference source before runtime execution.')
  }

  const sourceRefs = [] as SourceReferenceDTO[]
  const updatedSources = [...localSources]
  for (const source of selectedSources) {
    const sourceRef = await ensureSourceReference(session.id, req.productId, source)
    sourceRefs.push(sourceRef)
    const idx = updatedSources.findIndex(item => item.id === source.id || item.assetId === source.assetId)
    if (idx >= 0) {
      updatedSources[idx] = { ...updatedSources[idx], sourceReferenceId: sourceRef.id }
    }
  }
  saveLocalSources(req.productId, updatedSources)

  const sourceRefIds = sourceRefs.map(item => item.id).sort()
  const primarySource = sourceRefs.find(item => item.metadata?.source_role === 'sku') ?? sourceRefs[0]
  const job = await request<DeconstructionJobDTO>(`${VWF}/${session.id}/deconstruction-jobs`, {
    method: 'POST',
    body: JSON.stringify({
      source_reference_id: primarySource?.id,
      idempotency_key: `deconstruct:${session.id}:${sourceRefIds.join('+')}`,
      requested_elements: ['product_geometry', 'material', 'style', 'scene', 'brand_constraints'],
      metadata: {
        frontend_entrypoint: 'production-prep',
        frontend_source_ids: req.sourceIds,
        frontend_tracks: req.tracks,
        source_reference_ids: sourceRefIds,
      },
    }),
  })
  return { parsingJobId: job.job_id, status: normalizeStatus(job.status) }
}

export async function getParsingResult(productId: string): Promise<DualTrackParsing> {
  if (isDevMode()) {
    await delay(1200)
    return mockDualTrackParsing()
  }
  return stageToParsing(await getStageView(productId))
}

export async function evaluateDecisionTree(req: EvaluateDecisionTreeRequest): Promise<LlmDecisionTreeResult> {
  if (isDevMode()) {
    await delay(800)
    return mockDecisionTree()
  }
  const session = await ensureVisualSession(req.productId)
  const stage = await getStageView(req.productId)
  void session
  return stageToDecisionTree(stage)
}

export async function getDecisionTree(productId: string): Promise<LlmDecisionTreeResult> {
  if (isDevMode()) {
    await delay(600)
    return mockDecisionTree()
  }
  return stageToDecisionTree(await getStageView(productId))
}

export async function updateParsedAttribute(productId: string, key: string, value: unknown): Promise<void> {
  if (isDevMode()) {
    await delay(300)
    return
  }
  const stage = await getStageView(productId)
  const target = (stage.deconstruction_elements ?? []).find(e => e.element_key === key || e.id === key)
  if (!target) return
  await request(`${VWF}/${stage.session_id || stage.id}/deconstruction-elements/${target.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ value: { value }, metadata: { updated_from: 'prep-attribute-editor' } }),
  })
}

export async function updateAttentionDecision(productId: string, elementId: string, decision: 'keep' | 'replace' | 'drop', targetAssetId?: string): Promise<void> {
  if (isDevMode()) {
    await delay(200)
    return
  }
  const stage = await getStageView(productId)
  await request(`${VWF}/${stage.session_id || stage.id}/deconstruction-elements/${elementId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      selected: decision !== 'drop',
      decision,
      target_asset_id: decision === 'replace' ? targetAssetId : undefined,
      rationale: decision === 'replace'
        ? '以当前商品图为主体，参考图只作风格参考'
        : decision === 'keep'
          ? '保留参考图中的视觉效果'
          : '不采用这一项参考元素',
      metadata: { updated_from: 'prep-attention-tree' },
    }),
  })
}

export async function updateDriftControl(productId: string, referenceBias: number): Promise<void> {
  const normalized = Math.max(0, Math.min(100, Math.round(referenceBias)))
  if (isDevMode()) {
    await delay(150)
    return
  }
  const session = await ensureVisualSession(productId)
  const stage = await getStageView(productId)
  await request<VisualSession>(`${VWF}/${session.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      current_stage: 'prompt',
      intent_spec: {
        ...(stage.intent_spec ?? {}),
        schema_version: stage.intent_spec?.schema_version ?? 'v1',
        product_id: productId,
        requirements: {
          ...(stage.intent_spec?.requirements ?? {}),
          attribute_drift: {
            reference_bias: normalized,
            sku_bias: 100 - normalized,
            mode: normalized > 65 ? 'focus_reference' : normalized < 35 ? 'focus_sku' : 'balanced',
          },
        },
        metadata: {
          ...(stage.intent_spec?.metadata ?? {}),
          updated_from: 'prep-attribute-drift-slider',
        },
      },
    }),
  })
}

function normalizeIntentType(input: string): IntentType {
  const allowed: IntentType[] = ['background_replace', 'model_swap', 'pose_control', 'style_transfer', 'scene_generation', 'image_enhancement', 'batch_variant']
  return allowed.includes(input as IntentType) ? input as IntentType : 'scene_generation'
}

function selectionLabel(selection: NonNullable<IntentSpecDTO['selections']>[number]): string {
  return userFacingText(selection.label || selection.element_key || selection.element_type || '视觉元素')
}

function selectionDecisionLabel(decision?: string): string {
  switch ((decision ?? '').toLowerCase()) {
    case 'keep':
      return '纳入 Prompt：保留参考效果'
    case 'replace':
      return '纳入 Prompt：主体替换为当前 SKU'
    case 'drop':
      return '不进入 Prompt：已排除'
    default:
      return '待确认'
  }
}

function selectionDescription(selection: NonNullable<IntentSpecDTO['selections']>[number]): string {
  const label = selectionLabel(selection)
  const decision = selectionDecisionLabel(selection.decision)
  const value = selection.value ? userFacingText(selection.value.text ?? selection.value.label ?? selection.value.value ?? '') : ''
  return value ? `${label}｜${decision}｜${value}` : `${label}｜${decision}`
}

function stageToIntents(stage: StageViewDTO, productId: string): CompiledIntent[] {
  const stored = getStored<CompiledIntent[]>(intentKey(productId), [])
  const selections = stage.intent_spec?.selections ?? []
  const effectiveSelections = selections.filter(selection => selection.decision !== 'drop')
  const fromStage = effectiveSelections.map((selection, idx) => ({
    id: selection.element_id || `${stage.id}-intent-${idx}`,
    type: normalizeIntentType(String(stage.intent_spec?.requirements?.type ?? 'scene_generation')),
    description: selectionDescription(selection),
    prompt: JSON.stringify(selection.value ?? selection),
    priority: 'medium' as const,
    params: { ...(selection.value ?? {}), decision: selection.decision, element_key: selection.element_key, label: selection.label },
    status: 'compiled' as const,
    createdAt: stage.updated_at || new Date().toISOString(),
  }))
  return fromStage.length ? fromStage : stored
}

export async function compileIntent(req: CompileIntentRequest): Promise<CompiledIntent> {
  if (isDevMode()) {
    await delay(500)
    const id = `intent-dev-${devIntentCounter++}`
    return { id, type: req.type, description: req.description, prompt: req.description, priority: req.priority ?? 'medium', params: req.params ?? {}, status: 'compiled', createdAt: new Date().toISOString() }
  }
  const session = await ensureVisualSession(req.productId)
  const existing = getStored<CompiledIntent[]>(intentKey(req.productId), [])
  const nextIntent: CompiledIntent = {
    id: `manual-${existing.length + 1}`,
    type: req.type,
    description: req.description,
    prompt: req.description,
    priority: req.priority ?? 'medium',
    params: req.params ?? {},
    status: 'compiled',
    createdAt: new Date().toISOString(),
  }
  const intents = [...existing, nextIntent]
  const updated = await request<VisualSession>(`${VWF}/${session.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      current_stage: 'prompt',
      intent_spec: {
        schema_version: 'v1',
        scene_type: req.type,
        tool_slug: 'production-pipeline',
        product_id: req.productId,
        selections: intents.map((item, index) => ({ element_id: `manual-${index + 1}`, decision: 'keep', label: item.description, value: item.params })),
        requirements: { prompt: req.description, priority: req.priority ?? 'medium' },
      },
    }),
  })
  const materialized = stageToIntents(updated as StageViewDTO, req.productId)
  setStored(intentKey(req.productId), materialized)
  return materialized[materialized.length - 1] ?? nextIntent
}


export async function listIntents(productId: string): Promise<CompiledIntent[]> {
  if (isDevMode()) {
    await delay(300)
    return MOCK_INTENTS
  }
  return stageToIntents(await getStageView(productId), productId)
}

async function persistIntents(productId: string, intents: CompiledIntent[]): Promise<CompiledIntent[]> {
  const session = await ensureVisualSession(productId)
  const updated = await request<VisualSession>(`${VWF}/${session.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      intent_spec: {
        schema_version: 'v1',
        tool_slug: 'production-pipeline',
        product_id: productId,
        selections: intents.map((item, index) => ({ element_id: `manual-${index + 1}`, decision: 'keep', label: item.description, value: item.params })),
        requirements: { frontend_intent_count: intents.length },
      },
    }),
  })
  const materialized = stageToIntents(updated as StageViewDTO, productId)
  setStored(intentKey(productId), materialized)
  return materialized
}

export async function updateIntent(productId: string, intentId: string, patch: Partial<CompiledIntent>): Promise<CompiledIntent> {
  if (isDevMode()) {
    await delay(300)
    const existing = MOCK_INTENTS.find((i) => i.id === intentId)
    return { ...(existing ?? MOCK_INTENTS[0]), ...patch }
  }
  const intents = getStored<CompiledIntent[]>(intentKey(productId), [])
  const next = intents.map(i => i.id === intentId ? { ...i, ...patch } : i)
  const persisted = await persistIntents(productId, next)
  return persisted.find(i => i.id === intentId) ?? persisted[0]
}

export async function deleteIntent(productId: string, intentId: string): Promise<void> {
  if (isDevMode()) {
    await delay(300)
    return
  }
  const next = getStored<CompiledIntent[]>(intentKey(productId), []).filter(i => i.id !== intentId)
  await persistIntents(productId, next)
}


function buildSafeGenerationMetadata(intentIds: string[], config?: ExecutionConfig, source = 'sandbox_start_generation'): Record<string, unknown> {
  return {
    frontend_intent_ids: intentIds,
    source,
    ui_execution_config: config ? {
      requested_engine: config.provider,
      max_concurrency: config.maxConcurrency,
      retry_on_failure: config.retryOnFailure,
      max_retries: config.maxRetries,
      timeout_seconds: config.timeoutSeconds,
    } : undefined,
  }
}

export type GenerationExecutionStatus = {
  versionId: string
  status: string
  stage?: string
  progress: number
  resultAssetCount: number
  runtimeJobId?: string
  terminal: boolean
  successful: boolean
  message: string
}

function generationExecutionStatus(version: GenerationVersionDTO): GenerationExecutionStatus {
  const status = String(version.status || 'queued').toLowerCase()
  const stage = version.stage
  const progress = Math.max(0, Math.min(100, Math.round(Number(version.progress ?? 0))))
  const resultAssetCount = version.result_assets?.length ?? 0
  const successful = (status === 'completed' || status === 'succeeded' || stage === 'completed') && resultAssetCount > 0
  const failed = ['failed', 'cancelled', 'contract_needed', 'blocked'].includes(status) || ['failed', 'cancelled', 'contract_needed', 'blocked'].includes(String(stage ?? '').toLowerCase())
  const terminal = successful || failed
  const message = successful
    ? `已生成 ${resultAssetCount} 张真实结果图，可以进入工坊查看。`
    : failed
      ? '本次生产没有成功完成，系统没有展示占位图。请检查生成方案或稍后重试。'
      : progress > 0
        ? `正在出图，当前进度约 ${progress}%。请保持本页打开，结果返回后会自动进入工坊。`
        : '生产任务已提交，正在等待生成服务返回进度。请保持本页打开。'
  return {
    versionId: version.version_id,
    status,
    stage,
    progress,
    resultAssetCount,
    runtimeJobId: version.runtime_job_id,
    terminal,
    successful,
    message,
  }
}

export async function getGenerationExecutionStatus(productId: string, versionId: string): Promise<GenerationExecutionStatus> {
  if (isDevMode()) {
    await delay(700)
    return { versionId, status: 'completed', stage: 'completed', progress: 100, resultAssetCount: 1, terminal: true, successful: true, message: '已生成 1 张演示结果图。' }
  }
  const stage = await getStageView(productId)
  const version = (stage.generation_versions ?? []).find(item => item.version_id === versionId)
  if (!version) {
    return { versionId, status: 'queued', stage: 'queued', progress: 0, resultAssetCount: 0, terminal: false, successful: false, message: '生产任务已提交，正在等待生成服务返回进度。请保持本页打开。' }
  }
  return generationExecutionStatus(version)
}

export async function executeIntents(productId: string, intentIds: string[], config?: ExecutionConfig): Promise<{ jobId: string; versionId: string; status: string; runtimeJobId?: string }> {
  if (isDevMode()) {
    await delay(2000)
    return { jobId: `exec-${uid()}`, versionId: `gv-${uid()}`, status: 'queued' }
  }
  const session = await ensureVisualSession(productId)
  const stage = await getStageView(productId)
  const promptPlan = stage.prompt_plan
  if (!promptPlan || promptPlan.status !== 'ready' || !promptPlan.prompt_id) {
    contractNeeded('生成方案还没准备好。请先点击左侧「生成出图方案」，确认后再开始生产。')
  }
  const response = await request<GenerationVersionDTO>(`${VWF}/${session.id}/generation-versions`, {
    method: 'POST',
    body: JSON.stringify({
      prompt_id: promptPlan.prompt_id,
      status: 'queued',
      stage: 'queued',
      progress: 0,
      idempotency_key: `generation:${session.id}:${promptPlan.prompt_id}:${intentIds.join(',')}`,
      metadata: buildSafeGenerationMetadata(intentIds, config),
    }),
  })
  if (response.status === 'contract_needed' || !response.runtime_job_id) {
    contractNeeded('当前生成服务还没有返回可生产的任务。为避免展示占位图，系统已停在本页，请稍后重试或检查生成服务配置。')
  }
  return {
    jobId: response.runtime_job_id || response.version_id,
    versionId: response.version_id,
    status: response.status,
    runtimeJobId: response.runtime_job_id,
  }
}



export async function createBranchGenerationVersion(
  productId: string,
  parentVersionId: string,
  weights: Record<string, unknown>,
  refinementInstruction?: string,
): Promise<{ jobId: string; versionId: string; status: string; runtimeJobId?: string }> {
  if (isDevMode()) {
    await delay(1200)
    return { jobId: `branch-${uid()}`, versionId: `gv-${uid()}`, status: 'queued' }
  }
  const session = await ensureVisualSession(productId)
  const stage = await getStageView(productId)
  const promptPlan = stage.prompt_plan
  if (!promptPlan || promptPlan.status !== 'ready' || !promptPlan.prompt_id) {
    contractNeeded('Prompt plan is not ready; branch generation cannot start without a backend prompt snapshot.')
  }
  const response = await request<GenerationVersionDTO>(`${VWF}/${session.id}/generation-versions`, {
    method: 'POST',
    body: JSON.stringify({
      prompt_id: promptPlan.prompt_id,
      parent_version_id: parentVersionId,
      source_version_id: parentVersionId,
      refinement_instruction: refinementInstruction || 'Workshop branch regeneration',
      status: 'queued',
      stage: 'queued',
      progress: 0,
      idempotency_key: `branch:${session.id}:${parentVersionId}:${Date.now()}`,
      metadata: {
        source: 'workshop_branch_generation',
        parent_version_id: parentVersionId,
        source_version_id: parentVersionId,
        ui_refinement_weights: weights,
      },
    }),
  })
  if (response.status === 'contract_needed') {
    contractNeeded('Branch generation is not available yet; no production runtime job was created.')
  }
  if (!response.runtime_job_id) {
    contractNeeded(`Branch generation version was created but no runtime job was returned; status=${response.status}.`)
  }
  return {
    jobId: response.runtime_job_id || response.version_id,
    versionId: response.version_id,
    status: response.status,
    runtimeJobId: response.runtime_job_id,
  }
}

export async function getTaskQuota(productId: string): Promise<TaskQuota> {
  if (isDevMode()) {
    await delay(200)
    return MOCK_QUOTA
  }
  const stage = await getStageView(productId)
  return { totalSlots: 1, usedSlots: stage.status === 'running' ? 1 : 0, reservedSlots: 0 }
}

export async function getExecutionConfig(productId: string): Promise<ExecutionConfig> {
  if (isDevMode()) {
    await delay(200)
    return MOCK_EXECUTION_CONFIG
  }
  await getStageView(productId)
  return MOCK_EXECUTION_CONFIG
}

export async function updateExecutionConfig(productId: string, config: ExecutionConfig): Promise<ExecutionConfig> {
  if (isDevMode()) {
    await delay(300)
    return config
  }
  await getStageView(productId)
  return config
}

function generationVersionLabel(index: number): string {
  return `V${index + 1}.0`
}

function versionWeightParams(version: GenerationVersionDTO) {
  const config = (version.metadata?.config ?? {}) as Record<string, unknown>
  const skuBias = Number(config.skuBias ?? config.sku_bias ?? 70)
  return {
    skuBias: Number.isFinite(skuBias) ? Math.max(0, Math.min(100, skuBias)) : 70,
    styleStrength: Number(config.styleStrength ?? config.style_strength ?? 0.6),
    identityConsistency: Number(config.identityConsistency ?? config.identity_consistency ?? 0.8),
    creativeFreedom: Number(config.creativeFreedom ?? config.creative_freedom ?? 0.4),
  }
}

export async function listGenerationVersions(productId: string): Promise<VersionNode[]> {
  if (isDevMode()) {
    await delay(300)
    return []
  }
  const stage = await getStageView(productId)
  const versions = [...(stage.generation_versions ?? [])].sort((a, b) => String(a.created_at ?? '').localeCompare(String(b.created_at ?? '')))
  return versions.map((version, index) => {
    const label = generationVersionLabel(index)
    const weights = versionWeightParams(version)
    const current = version.version_id === versions.at(-1)?.version_id
    return {
      id: version.version_id,
      version: label,
      label,
      description: `${version.status}${version.stage ? ` · ${version.stage}` : ''}`,
      skuBias: weights.skuBias,
      refBias: 100 - weights.skuBias,
      timestamp: version.created_at || new Date().toISOString(),
      strategySnapshot: String(version.metadata?.source ?? version.prompt_plan_status ?? 'backend_generation_version'),
      isCurrent: current,
      parentId: version.parent_version_id,
      childrenIds: [],
      prompt: version.prompt_id,
      negativePrompt: undefined,
      weightParams: weights,
    }
  })
}

export async function listVariants(productId: string): Promise<AssetVariant[]> {
  if (isDevMode()) {
    await delay(400)
    return MOCK_VARIANTS
  }
  const stage = await getStageView(productId)
  const variants = (stage.generation_versions ?? []).flatMap(version => (version.result_assets ?? []).map(asset => ({
    version,
    asset,
  })))
  return Promise.all(variants.map(async ({ version, asset }) => {
    const assetContentPath = asset.asset_content_url || ''
    const authenticatedUrl = assetContentPath ? await fetchAuthenticatedObjectUrl(assetContentPath) : ''
    return {
      id: `${version.version_id}:${asset.asset_id}`,
      intentId: version.prompt_id || version.version_id,
      assetUrl: authenticatedUrl,
      thumbnailUrl: authenticatedUrl,
      width: Number(asset.metadata?.width ?? 1024),
      height: Number(asset.metadata?.height ?? 1024),
      status: asset.selected || asset.asset_id === version.selected_result_asset_id ? 'selected' : (version.status === 'completed' ? 'ready' : 'generating'),
      metadata: { ...asset.metadata, version_id: version.version_id, asset_id: asset.asset_id, asset_content_url: assetContentPath, stage: version.stage, progress: version.progress, status: version.status },
      createdAt: version.created_at || new Date().toISOString(),
    }
  }))
}

export async function createInpaintTask(_productId: string, req: CreateInpaintTaskRequest): Promise<InpaintTask> {
  if (isDevMode()) {
    await delay(1500)
    return mockInpaintTask(req.variantId, req.regions, req.prompt)
  }
  contractNeeded('In-painting backend contract is not enabled yet; no production task was created.')
}

export async function getInpaintTask(productId: string, taskId: string): Promise<InpaintTask> {
  if (isDevMode()) {
    await delay(300)
    return mockInpaintTask('var-1', [{ x: 100, y: 100, width: 200, height: 150 }], 'demo inpaint')
  }
  contractNeeded(`In-painting backend contract is not enabled yet; no production task was loaded for ${productId}/${taskId}.`)
}

export async function getOrCreateRefinementSession(_productId: string, variantId: string): Promise<RefinementSession> {
  if (isDevMode()) {
    await delay(600)
    return mockRefinementSession(variantId)
  }
  contractNeeded('Refinement backend contract is not enabled yet; no production session was created.')
}

export async function sendRefinementMessage(_productId: string, _sessionId: string, req: SendRefinementMessageRequest): Promise<RefinementMessage> {
  if (isDevMode()) {
    await delay(1200)
    return mockRefinementReply(req.content)
  }
  contractNeeded('Refinement backend contract is not enabled yet; no production message was created.')
}



export async function saveVariantAsTemplate(productId: string, variantId: string, title?: string): Promise<{ templateId: string; savedTemplates: number }> {
  if (isDevMode()) {
    await delay(500)
    return { templateId: `tpl-${uid()}`, savedTemplates: 1 }
  }
  const session = await ensureVisualSession(productId)
  const [versionId, assetId] = variantId.split(':')
  if (!versionId || !assetId) {
    contractNeeded('Save as template requires a backend generation version asset id.')
  }
  const result = await request<{ template: { id: string }; saved_templates?: unknown[] }>(`${VWF}/${session.id}/generation-versions/${versionId}/save-as-template`, {
    method: 'POST',
    body: JSON.stringify({
      asset_id: assetId,
      title: title || 'Workshop generated visual template',
      platform: 'ecommerce',
      tags: ['workshop', 'generated-result'],
      idempotency_key: `save-template:${session.id}:${versionId}:${assetId}`,
    }),
  })
  return { templateId: result.template.id, savedTemplates: result.saved_templates?.length ?? 0 }
}

export async function finalizeAssets(req: FinalizeAssetsRequest): Promise<{ assetIds: string[] }> {
  if (isDevMode()) {
    await delay(800)
    return { assetIds: req.variantIds.map((id) => `finalized-${id}`) }
  }
  const session = await ensureVisualSession(req.productId)
  const assetIds: string[] = []
  for (const variantId of req.variantIds) {
    const [versionId, assetId] = variantId.split(':')
    if (!versionId || !assetId) continue
    await request(`${VWF}/${session.id}/generation-versions/${versionId}/select`, {
      method: 'POST',
      body: JSON.stringify({ selected_result_asset_id: assetId, metadata: { frontend_variant_id: variantId } }),
    })
    const result = await request<{ asset_relation: { asset_id: string } }>(`${VWF}/${session.id}/generation-versions/${versionId}/writeback-selected-asset`, {
      method: 'POST',
      body: JSON.stringify({ asset_id: assetId, asset_role: req.assetRoles[variantId] ?? 'hero', idempotency_key: `writeback:${session.id}:${versionId}:${assetId}` }),
    })
    assetIds.push(result.asset_relation.asset_id)
  }
  return { assetIds }
}
