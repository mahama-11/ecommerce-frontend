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
  ProductionFanoutTask,
  ProductionFanoutBatch,
  DecisionOption,
  DecisionStep,
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
  template_id?: string
  template_version_id?: string
  intent_spec?: IntentSpecDTO
  prompt_plan?: PromptPlanDTO
  generation_versions?: GenerationVersionDTO[]
}

type ProductionTemplateListItem = {
  id: string
  modality?: string
  capabilityType?: string
  recommendScore?: number
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
  source_reference_id?: string
  runtime_job_id?: string
  status: string
  stage?: string
  stage_message?: string
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
    metadata?: Record<string, unknown>
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
  blockers?: Array<{ code: string; message: string; target?: string }>
  created_at?: string
}

type GenerationFanoutResponseDTO = {
  session_id: string
  product_id: string
  sku_code: string
  fanout_id: string
  items: Array<{
    fanout_task_id: string
    source_asset_id: string
    template_id: string
    template_version_id?: string
    slot_index: number
    scene_tag?: string
    detail_requirement?: string
    generation_version: GenerationVersionDTO
  }>
}

export type BusinessWorkflowNode = {
  node_id: string
  label: string
  owner: string
  status: string
  readiness?: string
  evidence?: Record<string, unknown>
  blockers?: Array<{ code: string; message: string; target?: string }>
}

export type BusinessWorkflowDAG = {
  schema_version: string
  flow_id: string
  status: string
  persistence?: string
  nodes: BusinessWorkflowNode[]
  edges: Array<{ from: string; to: string; dependency?: string }>
}

export type IntegrationVerdict = {
  schema_version: string
  status: 'pass' | 'partial_pass' | 'blocked' | 'fail' | string
  ready_count: number
  total_count: number
  gates: Array<{ gate_id: string; label: string; status: string; evidence?: Record<string, unknown> }>
  blockers?: Array<{ code: string; message: string; target?: string }>
}

export type RollbackSnapshot = {
  schema_version: string
  session_id: string
  status: string
  scopes: Array<{ scope_id: string; resource_type: string; resource_id?: string; action: string; safe: boolean; evidence?: Record<string, unknown> }>
  instructions?: string[]
  metadata?: Record<string, unknown>
}

export type ReleaseReadiness = {
  schema_version: string
  status: string
  gates: Array<{ gate_id: string; label: string; status: string; evidence?: Record<string, unknown> }>
  blockers?: Array<{ code: string; message: string; target?: string }>
}

type StageViewDTO = VisualSession & {
  session_id?: string
  source_reference?: SourceReferenceDTO
  source_references?: SourceReferenceDTO[]
  deconstruction_job?: DeconstructionJobDTO
  deconstruction_elements: DeconstructionElementDTO[]
  readiness?: {
    overall?: string
    source?: string
    deconstruction?: string
    prompt?: string
    generation?: string
    blockers?: Array<{ code: string; message: string; target?: string }>
  }
  business_flow?: BusinessWorkflowDAG
  integration_verdict?: IntegrationVerdict
  rollback_snapshot?: RollbackSnapshot
  release_readiness?: ReleaseReadiness
  runtime_capabilities?: Array<{ task_type: string; status: string; available: boolean; unavailable_reason?: string }>
  runtime_capability_error?: { code: string; message: string }
  updated_at?: string
}

const sessionKey = (productId: string) => `ecommerce.production.visualSession.${productId}`
const sourceKey = (productId: string) => `ecommerce.production.sources.${productId}`
const intentKey = (productId: string) => `ecommerce.production.intents.${productId}`
const ALLOWED_SOURCE_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
export const MAX_PARSING_SOURCE_IMAGE_BYTES = 10 * 1024 * 1024


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

function readImageDimensions(file: File): Promise<{ width?: number; height?: number }> {
  if (!file.type.startsWith('image/')) return Promise.resolve({})
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    const cleanup = () => URL.revokeObjectURL(url)
    image.onload = () => {
      cleanup()
      resolve({ width: image.naturalWidth || image.width, height: image.naturalHeight || image.height })
    }
    image.onerror = () => {
      cleanup()
      resolve({})
    }
    image.src = url
  })
}

export function validateParsingSourceFile(file: File): void {
  const type = file.type || 'application/octet-stream'
  if (!ALLOWED_SOURCE_IMAGE_TYPES.has(type)) {
    throw new Error(`${file.name} 格式暂不支持。请上传 JPG、PNG 或 WebP 图片。`)
  }
  if (file.size > MAX_PARSING_SOURCE_IMAGE_BYTES) {
    throw new Error(`${file.name} 太大（${(file.size / 1024 / 1024).toFixed(1)}MB）。请压缩到 10MB 以内，建议长边 2000px 内。`)
  }
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

async function resolveProductionPromptTemplateId(locale = 'zh-CN'): Promise<string> {
  const candidates = await request<ProductionTemplateListItem[]>(
    `/api/v1/ecommerce/template-center/catalog?locale=${encodeURIComponent(locale)}&modality=image&sortBy=recommended`,
    { method: 'GET' },
  )
  const selected = [...(candidates ?? [])]
    .filter(item => item.id)
    .sort((a, b) => Number(b.recommendScore ?? 0) - Number(a.recommendScore ?? 0))[0]
  if (!selected?.id) {
    contractNeeded('暂时没有可用的图片模板。请稍后重试，或先选择其他模板。')
  }
  return selected.id
}

async function ensureSessionPromptTemplate(session: VisualSession, locale = 'zh-CN'): Promise<string> {
  if (session.template_id) return session.template_id
  const templateId = await resolveProductionPromptTemplateId(locale)
  const updated = await request<VisualSession>(`${VWF}/${session.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ template_id: templateId }),
  })
  setStored(sessionKey(session.product_id), updated)
  return updated.template_id || templateId
}

async function getStageView(productId: string): Promise<StageViewDTO> {
  const session = await ensureVisualSession(productId)
  return request<StageViewDTO>(`${VWF}/${session.id}/stage-view`, { method: 'GET' })
}

export type ProductionArchitectureState = {
  businessFlow?: BusinessWorkflowDAG
  integrationVerdict?: IntegrationVerdict
  rollbackSnapshot?: RollbackSnapshot
  releaseReadiness?: ReleaseReadiness
  updatedAt?: string
}

export async function getProductionArchitectureState(productId: string): Promise<ProductionArchitectureState> {
  if (isDevMode()) {
    await delay(200)
    return {
      businessFlow: {
        schema_version: 'ecommerce_business_flow.v1',
        flow_id: productId,
        status: 'partial',
        persistence: 'demo',
        nodes: ['source', 'deconstruction', 'prompt_plan', 'generation', 'workshop', 'product_center_writeback', 'delivery_download', 'charge_metering'].map((node, idx) => ({
          node_id: node,
          label: node.replaceAll('_', ' '),
          owner: idx < 4 ? 'backend/runtime' : 'frontend/backend',
          status: idx < 4 ? 'ready' : 'missing',
        })),
        edges: [],
      },
      integrationVerdict: { schema_version: 'ecommerce_integration_verdict.v1', status: 'partial_pass', ready_count: 4, total_count: 8, gates: [] },
      rollbackSnapshot: { schema_version: 'ecommerce_rollback_snapshot.v1', session_id: productId, status: 'available', scopes: [] },
      releaseReadiness: { schema_version: 'ecommerce_release_readiness.v1', status: 'blocked', gates: [] },
      updatedAt: new Date().toISOString(),
    }
  }
  const stage = await getStageView(productId)
  return {
    businessFlow: stage.business_flow,
    integrationVerdict: stage.integration_verdict,
    rollbackSnapshot: stage.rollback_snapshot,
    releaseReadiness: stage.release_readiness,
    updatedAt: stage.updated_at,
  }
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
  readiness?: {
    overall?: string
    prompt?: string
    generation?: string
    blockers?: Array<{ code: string; message: string; target?: string }>
  }
  blockers: Array<{ code: string; message: string; target?: string }>
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
    prompt_id: '出图方案',
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
    if (obj.field && 'value' in obj) return `${humanizeDiffPath(obj.field)}：${compactDiffValue(obj.value)}`
    if (obj.field && ('previous_value' in obj || 'current_value' in obj)) return `${humanizeDiffPath(obj.field)}：${compactDiffValue(obj.previous_value)} → ${compactDiffValue(obj.current_value)}`
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
  const promptBlockers = [
    ...(Array.isArray(plan.blockers) ? plan.blockers : []),
    ...(Array.isArray(stage.readiness?.blockers) ? stage.readiness.blockers.filter(blocker => !blocker.target || ['prompt_plan', 'prompt_planner', 'source_references', 'deconstruction_job', 'runtime_capabilities'].includes(blocker.target)) : []),
  ]
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
    readiness: stage.readiness ? {
      overall: stage.readiness.overall,
      prompt: stage.readiness.prompt,
      generation: stage.readiness.generation,
      blockers: stage.readiness.blockers,
    } : undefined,
    blockers: promptBlockers,
  }
}

export async function getPromptPlanSummary(productId: string): Promise<PromptPlanSummary> {
  return promptPlanSummary(await getStageView(productId))
}

export async function requestPromptPlanner(productId: string, opts?: { marketplace?: string; locale?: string; templateId?: string; promptVariables?: Record<string, unknown> }): Promise<{ runtimeJobId?: string; status: string }> {
  const session = await ensureVisualSession(productId)
  const locale = opts?.locale ?? 'zh-CN'
  const templateId = opts?.templateId ?? await ensureSessionPromptTemplate(session, locale)
  const response = await request<{ runtime_job_id?: string; status: string }>(`${VWF}/${session.id}/prompt-planner-jobs`, {
    method: 'POST',
    body: JSON.stringify({
      marketplace: opts?.marketplace ?? 'amazon',
      locale,
      template_id: templateId,
      prompt_variables: { ...(opts?.promptVariables ?? {}), template_id: templateId, prompt_diff: true },
      idempotency_key: `prompt-plan:${session.id}:${Date.now()}`,
    }),
  })
  return { runtimeJobId: response.runtime_job_id, status: response.status }
}

export async function ensurePromptPlanReady(productId: string, opts?: { marketplace?: string; locale?: string; templateId?: string; promptVariables?: Record<string, unknown>; timeoutMs?: number }): Promise<PromptPlanSummary> {
  await requestPromptPlanner(productId, opts)
  const startedAt = Date.now()
  const timeoutMs = opts?.timeoutMs ?? 90_000
  let latest = await getPromptPlanSummary(productId)
  while (Date.now() - startedAt < timeoutMs) {
    latest = await getPromptPlanSummary(productId)
    if (latest.status === 'ready' && latest.promptId) return latest
    if (['blocked', 'failed', 'contract_needed'].includes(latest.status)) {
      contractNeeded('出图方案暂时不可用，请回到生产准备页确认图片解析和选择后再试。')
    }
    await delay(1500)
  }
  contractNeeded('出图方案整理超时，请稍后刷新重试。')
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
  const readableObjectText = (value: unknown, depth = 0): string => {
    if (value == null || depth > 2) return ''
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value)
    if (Array.isArray(value)) return value.map(item => readableObjectText(item, depth + 1)).filter(Boolean).join('，')
    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>
      for (const key of ['description', 'summary', 'text', 'label', 'title', 'value', 'style', 'shape', 'material', 'color', 'scene', 'background']) {
        const text = readableObjectText(obj[key], depth + 1)
        if (text) return text
      }
      const parts = Object.entries(obj)
        .filter(([key]) => !/^(id|asset_id|source_reference_id|source_asset_id|element_type|element_key|metadata|bbox|crop|region)$/i.test(key))
        .map(([, item]) => readableObjectText(item, depth + 1))
        .filter(Boolean)
      return parts.slice(0, 3).join('，')
    }
    return ''
  }
  const raw = readableObjectText(input)
  const withoutFence = raw.replace(/```json\s*/gi, '').replace(/```/g, '').trim()
  if (/deconstruction_elements|source_reference_id|element_type|element_key/.test(withoutFence)) {
    try {
      const parsed = JSON.parse(withoutFence)
      if (parsed && typeof parsed === 'object') {
        const elements = Array.isArray((parsed as Record<string, unknown>).deconstruction_elements)
          ? ((parsed as Record<string, unknown>).deconstruction_elements as unknown[])
          : []
        return elements.length > 0 ? `已返回 ${elements.length} 条图片解析结果` : '图片解析结果已返回，暂未提取到可展示元素'
      }
    } catch {
      return '图片解析结果已返回，暂不直接展示原始 JSON'
    }
  }
  if (/^[\[{]/.test(withoutFence)) {
    try {
      const parsed = JSON.parse(withoutFence)
      const readable = readableObjectText(parsed)
      if (readable) return userFacingText(readable)
      return '图片解析结果已返回，暂不直接展示原始 JSON'
    } catch {
      return '图片解析结果已返回，暂不直接展示原始 JSON'
    }
  }
  return withoutFence
    .replace(/Manifest-declared SKU visual asset; geometry analysis pending runtime image bytes/gi, '已识别为当前商品图片；系统会在生成时以实物图为准。')
    .replace(/Manifest-declared SKU asset; geometry not extractable without image bytes\.?/gi, '已识别为当前商品图片；系统会在生成时以实物图为准。')
    .replace(/Requested element:\s*product geometry analysis pending visual byte ingestion for asset_[A-Za-z0-9_-]+/gi, '当前图片可以作为商品主体，但外形细节还需要在生成前再次确认。')
    .replace(/Requested element:\s*material analysis pending visual byte ingestion for asset_[A-Za-z0-9_-]+/gi, '当前图片可以作为材质参考，但具体材质还需要确认。')
    .replace(/Reference asset available:\s*asset_[A-Za-z0-9_-]+\s*\([^)]*\)\s*for comparative visual analysis/gi, '参考图已就绪，可用于对比风格、场景和构图。')
    .replace(/Visual description/gi, '视觉描述')
    .replace(/Provider reference description/gi, '参考图解析描述')
    .replace(/reference_strategy/gi, '参考策略')
    .replace(/product_fact/gi, '商品事实')
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
    product_info: '图片中的产品信息',
    background_info: '图片中的背景信息',
    provider_reference_description: '参考素材解析结果',
    reference_style: '参考素材风格',
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
  const attributes = (stage.deconstruction_elements ?? []).map(elementToAttribute)
  const status = stage.deconstruction_job
    ? normalizeStatus(stage.deconstruction_job.status)
    : attributes.length > 0
      ? 'succeeded'
      : 'idle'
  const job = stage.deconstruction_job
  const failureText = userFacingParsingFailure(
    job?.error_message
      || (job?.error_code ? `图片识别失败：${job.error_code}` : undefined)
      || (status === 'failed' && job?.stage_message ? job.stage_message : undefined)
      || stage.runtime_capability_error?.message,
  )
  const result = {
    track: 'third_party' as const,
    status,
    attributes,
    parsedAt: stage.updated_at,
    error: failureText,
  }
  return {
    status,
    primaryTrack: 'third_party',
    thirdPartyResult: result,
    mergedAttributes: attributes,
    conflicts: [],
  }
}

function userFacingParsingFailure(message?: string): string | undefined {
  const text = String(message ?? '').trim()
  if (!text) return undefined
  const lower = text.toLowerCase()
  if (
    lower.includes('traceback')
    || lower.includes('name \'traceback\' is not defined')
    || lower.includes('provider_submit_failed')
    || lower.includes('comfyui bridge request failed')
    || lower.includes('gemini')
    || lower.includes('python')
  ) {
    return '图片识别服务暂时不可用，请稍后重试；系统不会用假结果继续下一步。'
  }
  return text
}

function stageToDecisionTree(stage: StageViewDTO): LlmDecisionTreeResult {
  const selections = stage.intent_spec?.selections ?? []
  const elements = stage.deconstruction_elements ?? []
  const blockers = elements.length > 0 ? (stage.readiness?.blockers ?? stage.prompt_plan?.blockers ?? []) : []
  const fixedSteps = fixedPromptQuestionSteps(elements, selections)
  const visibleElements = fixedSteps.length > 0 ? [] : elements.slice(0, 8)
  const activeIndex = Math.max(0, visibleElements.findIndex((element) => !element.confirmed))
  const dynamicSteps = visibleElements.map((element, idx) => {
    const dimension = visualDecisionDimension(element)
    const valueText = element.value ? userFacingText(element.value.text ?? element.value.label ?? element.value.description ?? element.value.value ?? element.value) : undefined
    const optionLabel = valueText ? valueText.slice(0, 42) : elementLabel(element)
    const options: DecisionOption[] = [
      { id: `${element.id}:keep`, label: `保留${dimension.shortLabel}`, description: `把“${optionLabel}”纳入下一步出图约束`, icon: dimension.icon, confidence: normalizeConfidence(element.confidence), semanticAction: 'keep', dimension: dimension.key },
      { id: `${element.id}:replace`, label: `调整${dimension.shortLabel}`, description: `以当前 SKU 为主体，替换或弱化该维度的参考效果`, icon: '⇄', semanticAction: 'replace', dimension: dimension.key },
      { id: `${element.id}:crop`, label: `裁剪/局部采用${dimension.shortLabel}`, description: `只采用该属性对应的局部区域或构图线索`, icon: '✂️', semanticAction: 'crop', dimension: dimension.key, cropHint: cropHintFromElement(element) },
      { id: `${element.id}:drop`, label: '不采用', description: '该属性不会进入本次出图要求', icon: '–', semanticAction: 'drop', dimension: dimension.key },
    ]
    return {
      id: element.id,
      stepNumber: idx + 1,
      title: `${dimension.label} · ${elementLabel(element)}`,
      description: valueText,
      options,
      selectedOptionId: element.decision ? `${element.id}:${element.decision}` : (element.selected ? `${element.id}:keep` : undefined),
      status: (element.confirmed ? 'completed' : idx === activeIndex ? 'active' : 'pending') as 'pending' | 'active' | 'completed',
    }
  })
  const steps = fixedSteps.length > 0 ? fixedSteps : dynamicSteps
  return {
    status: blockers.length > 0 ? 'failed' : (selections.length > 0 || elements.length > 0 ? 'succeeded' : 'idle'),
    root: {
      id: 'root',
      question: fixedSteps.length > 0 ? '本次出图四项选择' : '本轮视觉策略取舍',
      confidence: elements.length ? elements.reduce((sum, e) => sum + normalizeConfidence(e.confidence), 0) / elements.length : 0,
      status: steps.every(step => step.status === 'completed') ? 'completed' : 'active',
      children: steps.map((step) => ({
        id: step.id,
        question: step.title,
        answer: step.selectedOptionId,
        confidence: step.options[0]?.confidence ?? 0,
        selectedOptionId: step.selectedOptionId,
        options: step.options,
        status: step.status,
        children: [],
      })),
    },
    steps,
    recommendedActions: blockers.length > 0 ? blockers.map(b => userFacingText(b.message)) : fixedSteps.length > 0 ? ['按四个固定问题选择“要/不要”', '选择结果会转成自然语言并进入本次出图要求', '底部侧重比例会同步影响 SKU 与参考素材的权重'] : ['逐项确认光影/材质/背景/构图等关键属性', '需要局部保留时选择“调整/裁剪”', '已确认的选择会进入出图要求并驱动下一步生成'],
    overallConfidence: elements.length ? elements.reduce((sum, e) => sum + normalizeConfidence(e.confidence), 0) / elements.length : 0,
    provider: 'internal',
    evaluatedAt: stage.updated_at,
  }
}

function fixedPromptQuestionSteps(elements: DeconstructionElementDTO[], selections: NonNullable<IntentSpecDTO['selections']> = []): DecisionStep[] {
  const usedElementIds = new Set<string>()
  const productPattern = /product|geometry|subject|main|主体|商品|产品|外形|款式|材质|梳子/i
  const backgroundPattern = /background|scene|backdrop|environment|环境|背景|场景|氛围|光影|构图/i

  const scoreElement = (element: DeconstructionElementDTO, kind: 'product' | 'background') => {
    const haystack = `${element.element_type || ''} ${element.element_key || ''} ${element.label || ''} ${JSON.stringify(element.value || {})}`
    const productHit = productPattern.test(haystack)
    const backgroundHit = backgroundPattern.test(haystack)
    let score = normalizeConfidence(element.confidence)
    if (kind === 'product') {
      if (productHit) score += 2
      if (backgroundHit) score -= 1
    } else {
      if (backgroundHit) score += 2
      if (productHit) score -= 1
    }
    return score
  }

  const pick = (role: 'sku' | 'reference', kind: 'product' | 'background') => {
    const candidates = elements
      .filter((element) => element.source_role === role && !usedElementIds.has(element.id))
      .map((element) => ({ element, score: scoreElement(element, kind) }))
      .sort((a, b) => b.score - a.score)
    const best = candidates[0]?.element
    if (best) usedElementIds.add(best.id)
    return best
  }

  const roleFallback = (role: 'sku' | 'reference') => elements.find((element) => element.source_role === role)
  const selectedBySlot = (slot: NonNullable<DecisionOption['promptSlot']>) => selections.find((selection) => {
    const metadata = selection.metadata ?? {}
    return metadata.prompt_slot === slot || selection.element_id === `fixed:${slot}` || selection.element_key === slot
  })

  const configs: Array<{ slot: NonNullable<DecisionOption['promptSlot']>; title: string; keepLabel: string; dropLabel: string; fallbackLabel: string; element?: DeconstructionElementDTO; fallback?: DeconstructionElementDTO }> = [
    { slot: 'sku_product', title: '要不要保留 SKU 原图里的产品主体？', keepLabel: '要，保留 SKU 产品主体', dropLabel: '不要使用 SKU 产品主体', fallbackLabel: '以 SKU 原图整体识别结果为准', element: pick('sku', 'product'), fallback: roleFallback('sku') },
    { slot: 'sku_background', title: '要不要保留 SKU 原图里的背景？', keepLabel: '要，保留 SKU 背景', dropLabel: '不要，改换 SKU 背景', fallbackLabel: '以 SKU 原图整体识别结果为准', element: pick('sku', 'background'), fallback: roleFallback('sku') },
    { slot: 'reference_product', title: '要不要把参考素材里的产品元素带入画面？', keepLabel: '要，参考产品元素进入画面', dropLabel: '不要使用参考产品元素', fallbackLabel: '以参考素材整体识别结果为准', element: pick('reference', 'product'), fallback: roleFallback('reference') },
    { slot: 'reference_background', title: '要不要采用参考素材里的背景/场景？', keepLabel: '要，采用参考背景场景', dropLabel: '不要采用参考背景', fallbackLabel: '以参考素材整体识别结果为准', element: pick('reference', 'background'), fallback: roleFallback('reference') },
  ]

  if (!configs.some((item) => item.element || item.fallback)) return []
  const firstPending = configs.findIndex((item) => !selectedBySlot(item.slot))
  const activeIndex = firstPending >= 0 ? firstPending : 0

  return configs.map((item, idx) => {
    const element = item.element ?? item.fallback
    const stepId = `fixed:${item.slot}`
    const selection = selectedBySlot(item.slot)
    const selectedDecision = selection?.decision === 'drop' ? 'drop' : selection?.decision ? 'keep' : undefined
    const valueText = element?.value ? userFacingText(element.value.text ?? element.value.label ?? element.value.description ?? element.value.value ?? element.value) : (element ? elementLabel(element) : item.fallbackLabel)
    const selectedOptionId = selectedDecision ? `${stepId}:${selectedDecision}` : undefined
    const options: DecisionOption[] = [
      { id: `${stepId}:keep`, label: item.keepLabel, description: valueText, icon: '✓', semanticAction: 'keep', dimension: item.slot.includes('background') ? 'background' : 'product_fact', promptSlot: item.slot, fixedPromptQuestion: true, confidence: normalizeConfidence(element?.confidence) },
      { id: `${stepId}:drop`, label: item.dropLabel, description: valueText, icon: '–', semanticAction: 'drop', dimension: item.slot.includes('background') ? 'background' : 'product_fact', promptSlot: item.slot, fixedPromptQuestion: true, confidence: normalizeConfidence(element?.confidence) },
    ]
    return {
      id: stepId,
      stepNumber: idx + 1,
      title: item.title,
      description: valueText,
      options,
      selectedOptionId,
      status: (selectedOptionId ? 'completed' : idx === activeIndex ? 'active' : 'pending') as 'pending' | 'active' | 'completed',
    }
  })
}

function visualDecisionDimension(element: DeconstructionElementDTO): { key: NonNullable<DecisionOption['dimension']>; label: string; shortLabel: string; icon: string } {
  const raw = `${element.element_type || ''} ${element.element_key || ''} ${element.label || ''}`.toLowerCase()
  if (/light|lighting|shadow|highlight|光|影|明暗|高光/.test(raw)) return { key: 'lighting', label: '光影', shortLabel: '光影', icon: '💡' }
  if (/material|texture|fabric|metal|wood|leather|材质|纹理|质感/.test(raw)) return { key: 'material', label: '材质/质感', shortLabel: '材质', icon: '🧵' }
  if (/background|scene|backdrop|环境|背景|场景/.test(raw)) return { key: 'background', label: '背景/场景', shortLabel: '背景', icon: '🌄' }
  if (/composition|layout|angle|pose|framing|构图|角度|姿态|画面/.test(raw)) return { key: 'composition', label: '构图/角度', shortLabel: '构图', icon: '📐' }
  if (/color|palette|tone|颜色|色彩|色调/.test(raw)) return { key: 'color', label: '色彩', shortLabel: '色彩', icon: '🎨' }
  if (/effect|style|atmosphere|mood|效果|风格|氛围/.test(raw)) return { key: 'effect', label: '风格/效果', shortLabel: '效果', icon: '✨' }
  if (/crop|region|bbox|局部|裁剪/.test(raw)) return { key: 'crop', label: '局部/裁剪', shortLabel: '局部', icon: '✂️' }
  if (element.source_role === 'reference') return { key: 'reference_strategy', label: '参考效果', shortLabel: '参考效果', icon: '🖼️' }
  return { key: 'product_fact', label: '商品属性', shortLabel: '商品属性', icon: '🏷️' }
}

function cropHintFromElement(element: DeconstructionElementDTO): DecisionOption['cropHint'] | undefined {
  const raw = element.value?.bbox ?? element.value?.crop ?? element.value?.region
  if (!raw || typeof raw !== 'object') return undefined
  const value = raw as Record<string, unknown>
  const x = Number(value.x ?? 0)
  const y = Number(value.y ?? 0)
  const width = Number(value.width ?? value.w ?? 1)
  const height = Number(value.height ?? value.h ?? 1)
  if (![x, y, width, height].every(Number.isFinite)) return undefined
  return { x, y, width, height }
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
  validateParsingSourceFile(file)
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
  const [payload, dimensions] = await Promise.all([readFileAsDataURL(file), readImageDimensions(file)])
  const asset = await request<{ id: string; mime_type: string; file_name?: string }>(`/api/v1/ecommerce/assets/source`, {
    method: 'POST',
    body: JSON.stringify({
      product_id: productId,
      sku_code: skuCode,
      file_name: file.name,
      mime_type: file.type || 'application/octet-stream',
      payload,
      width: dimensions.width,
      height: dimensions.height,
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

export async function removeParsingSource(productId: string, source: ParsingSource): Promise<void> {
  const removeLocal = () => {
    const sources = getLocalSources(productId).filter((item) =>
      item.id !== source.id &&
      item.assetId !== source.assetId &&
      item.sourceReferenceId !== source.sourceReferenceId &&
      item.assetRelationId !== source.assetRelationId,
    )
    saveLocalSources(productId, sources)
  }
  if (isDevMode()) {
    removeLocal()
    return
  }
  const session = await ensureVisualSession(productId)
  const sourceReferenceId = source.sourceReferenceId
  const calls: Promise<unknown>[] = []
  if (sourceReferenceId) {
    calls.push(request(`${VWF}/${session.id}/source-references/${sourceReferenceId}`, { method: 'DELETE', silent: true }))
  }
  if (source.assetRelationId) {
    calls.push(request(`/api/v1/ecommerce/products/${productId}/assets/${source.assetRelationId}`, { method: 'DELETE', silent: true }))
  }
  if (calls.length > 0) {
    await Promise.allSettled(calls)
  }
  removeLocal()
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
    contractNeeded('请至少选择一张商品图和一张参考图，然后再开始图片解析。')
  }

  const sourceRefs = [] as SourceReferenceDTO[]
  const updatedSources = [...localSources]
  const providerCode = req.providerCode && req.providerCode !== 'comfyui_bridge' ? req.providerCode : undefined
  const providerKey = providerCode ?? 'comfyui_bridge'
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
  const jobs: DeconstructionJobDTO[] = []
  for (const sourceRef of sourceRefs) {
    const job = await request<DeconstructionJobDTO>(`${VWF}/${session.id}/deconstruction-jobs`, {
      method: 'POST',
      body: JSON.stringify({
        source_reference_id: sourceRef.id,
        idempotency_key: `deconstruct:${session.id}:${sourceRef.id}:${sourceRefIds.join('+')}:${providerKey}`,
        requested_elements: ['product_geometry', 'material', 'style', 'scene', 'brand_constraints'],
        metadata: {
          frontend_entrypoint: 'production-prep',
          frontend_source_ids: req.sourceIds,
          frontend_tracks: req.tracks,
          source_reference_ids: sourceRefIds,
          image_understanding_policy: 'single_image_per_runtime_job',
          provider_code: providerCode,
        },
      }),
    })
    jobs.push(job)
  }
  const primaryJob = jobs.find(item => item.source_reference_id === sourceRefs.find(ref => ref.metadata?.source_role === 'sku')?.id) ?? jobs[0]
  return { parsingJobId: primaryJob.job_id, status: normalizeStatus(primaryJob.status) }
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

export async function updateAttentionDecision(productId: string, elementId: string, decision: 'keep' | 'replace' | 'drop' | 'crop', targetAssetId?: string, option?: DecisionOption): Promise<void> {
  if (isDevMode()) {
    await delay(200)
    return
  }
  const stage = await getStageView(productId)
  if (elementId.startsWith('fixed:') && option?.promptSlot) {
    const slot = option.promptSlot
    const sourceRole = slot.includes('sku') ? 'sku' : 'reference'
    const element = (stage.deconstruction_elements ?? []).find((item) => item.source_role === sourceRole)
    const existing = stage.intent_spec?.selections ?? []
    const nextSelections = existing.filter((selection) => {
      const metadata = selection.metadata ?? {}
      return metadata.prompt_slot !== slot && selection.element_id !== elementId && selection.element_key !== slot
    })
    nextSelections.push({
      element_id: elementId,
      element_type: slot.includes('background') ? 'background' : 'product_fact',
      element_key: slot,
      decision,
      label: option.label,
      value: { description: option.description || option.label },
      metadata: {
        fixed_prompt_question: true,
        prompt_slot: slot,
        source_role: sourceRole,
        source_element_id: element?.id,
        semantic_action: option.semanticAction ?? decision,
      },
    })
    await request(`${VWF}/${stage.session_id || stage.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        intent_spec: {
          ...(stage.intent_spec ?? {}),
          schema_version: stage.intent_spec?.schema_version ?? 'v1',
          product_id: productId,
          selections: nextSelections,
          metadata: {
            ...(stage.intent_spec?.metadata ?? {}),
            updated_from: 'prep-fixed-four-questions',
          },
        },
      }),
    })
    return
  }
  await request(`${VWF}/${stage.session_id || stage.id}/deconstruction-elements/${elementId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      selected: decision !== 'drop',
      decision,
      target_asset_id: decision === 'replace' || decision === 'crop' ? targetAssetId : undefined,
      group_path: option?.dimension ? ['visual_attribute', option.dimension] : undefined,
      rationale: decision === 'replace'
        ? '以当前商品图为主体，参考图只作风格参考'
        : decision === 'keep'
          ? '保留参考图中的视觉效果'
          : decision === 'crop'
            ? '仅采用参考图中的局部区域或裁剪线索'
            : '不采用这一项参考元素',
      metadata: {
        updated_from: 'prep-attention-tree',
        dimension: option?.dimension,
        semantic_action: option?.semanticAction ?? decision,
        crop_hint: option?.cropHint,
        option_label: option?.label,
        fixed_prompt_question: option?.fixedPromptQuestion,
        prompt_slot: option?.promptSlot,
      },
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
      intent_spec: {
        ...(stage.intent_spec ?? {}),
        schema_version: stage.intent_spec?.schema_version ?? 'v1',
        product_id: productId,
        requirements: {
          ...(stage.intent_spec?.requirements ?? {}),
          attribute_drift: {
            reference_bias: normalized,
            sku_bias: 100 - normalized,
            reference_weight: normalized,
            sku_weight: 100 - normalized,
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
      return '纳入出图要求：保留参考效果'
    case 'replace':
      return '纳入出图要求：主体替换为当前 SKU'
    case 'drop':
      return '不进入出图要求：已排除'
    default:
      return '待确认'
  }
}

function selectionDescription(selection: NonNullable<IntentSpecDTO['selections']>[number]): string {
  const label = selectionLabel(selection)
  const decision = selectionDecisionLabel(selection.decision)
  const value = selection.value ? userFacingText(
    selection.value.text
      ?? selection.value.description
      ?? selection.value.provider_text
      ?? selection.value.label
      ?? selection.value.value
      ?? ''
  ) : ''
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
      generation_provider_code: typeof config.providerConfig?.generation_provider_code === 'string' ? config.providerConfig.generation_provider_code : config.provider,
      max_concurrency: config.maxConcurrency,
      retry_on_failure: config.retryOnFailure,
      max_retries: config.maxRetries,
      timeout_seconds: config.timeoutSeconds,
      provider_config: config.providerConfig,
    } : undefined,
  }
}

export type GenerationExecutionStatus = {
  versionId: string
  status: string
  stage?: string
  progress: number
  resultAssetCount: number
  resultAssetUrls?: string[]
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
  const blockerMessage = version.blockers?.map(blocker => blocker.message).filter(Boolean).join('；')
    || String((version.metadata?.runtime_result as Record<string, unknown> | undefined)?.error_message ?? '')
    || String((version.metadata?.runtime_update as Record<string, unknown> | undefined)?.error_message ?? '')
  const message = successful
    ? `已生成 ${resultAssetCount} 张结果图，可以进入工坊查看。`
    : failed
      ? (blockerMessage || '本次生产没有成功完成，系统没有展示占位图。请检查生成方案或稍后重试。')
      : progress > 0
        ? `正在出图，当前进度约 ${progress}%。请保持本页打开，结果返回后会自动进入工坊。`
        : '生产任务已提交，正在等待生成服务返回进度。请保持本页打开。'
  return {
    versionId: version.version_id,
    status,
    stage,
    progress,
    resultAssetCount,
    resultAssetUrls: version.result_assets?.map(asset => asset.asset_content_url).filter((url): url is string => Boolean(url)),
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

export async function waitForGenerationResult(productId: string, versionId: string, opts?: { timeoutMs?: number }): Promise<GenerationExecutionStatus> {
  const timeoutMs = opts?.timeoutMs ?? 180_000
  const startedAt = Date.now()
  let latest = await getGenerationExecutionStatus(productId, versionId)
  while (Date.now() - startedAt < timeoutMs) {
    latest = await getGenerationExecutionStatus(productId, versionId)
    if (latest.successful && latest.resultAssetCount > 0) return latest
    if (latest.terminal) {
      contractNeeded(latest.message || '本次出图已结束，但没有返回可展示结果。')
    }
    await delay(2500)
  }
  contractNeeded('出图等待超时：本次结果还没有返回，请稍后刷新或重试。')
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



export async function executeFanoutIntents(
  productId: string,
  intentIds: string[],
  tasks: ProductionFanoutTask[],
  config?: ExecutionConfig,
  opts?: { onProgress?: (batch: ProductionFanoutBatch) => void },
): Promise<ProductionFanoutBatch> {
  if (isDevMode()) {
    await delay(1200)
    const batchId = `fanout-${uid()}`
    const devBatch = {
      batchId,
      productId,
      intentIds,
      tasks: tasks.map((task) => ({ ...task, versionId: `gv-${uid()}`, runtimeJobId: `runtime-${uid()}`, status: 'queued' as const, progress: 5 })),
      status: 'queued' as const,
      totalTasks: tasks.length,
      completedTasks: 0,
      failedTasks: 0,
      createdAt: new Date().toISOString(),
      maxConcurrency: config?.maxConcurrency,
      retryOnFailure: config?.retryOnFailure,
      maxRetries: config?.maxRetries,
      waves: 1,
    }
    opts?.onProgress?.(devBatch)
    return devBatch
  }
  if (tasks.length === 0) {
    contractNeeded('没有可提交的出图槽位；请先在 Prep 上传至少一张 SKU 图片，并保留至少一个生产槽位。')
  }

  const session = await ensureVisualSession(productId)
  const stage = await getStageView(productId)
  const promptPlan = stage.prompt_plan
  if (!promptPlan || promptPlan.status !== 'ready' || !promptPlan.prompt_id) {
    contractNeeded('生成方案还没准备好。请先点击左侧「生成出图方案」，确认后再开始生产。')
  }

  const maxConcurrency = Math.max(1, Math.min(config?.maxConcurrency ?? tasks.length, tasks.length))
  const maxRetries = Math.max(0, Math.min(config?.maxRetries ?? 0, 5))
  const timeoutMs = Math.max(30, config?.timeoutSeconds ?? 300) * 1000
  const retryOnFailure = Boolean(config?.retryOnFailure)
  const batchId = `fanout:${session.id}:${promptPlan.prompt_id}:${intentIds.join(',')}:${tasks.map(t => t.id).join('|')}`
  const completed = new Map<string, ProductionFanoutTask>()
  const finalFailures = new Map<string, ProductionFanoutTask>()
  let pending: ProductionFanoutTask[] = tasks.map(task => ({ ...task, status: 'pending' as const, progress: 0, retryCount: task.retryCount ?? 0 }))
  opts?.onProgress?.(summarizeFanoutBatch(batchId, productId, intentIds, pending, { maxConcurrency, retryOnFailure, maxRetries, waves: 0 }))
  let waveCount = 0

  for (let attempt = 0; pending.length > 0; attempt += 1) {
    const nextFailures: ProductionFanoutTask[] = []
    for (let offset = 0; offset < pending.length; offset += maxConcurrency) {
      const wave = pending.slice(offset, offset + maxConcurrency)
      waveCount += 1
      const submitted = await submitFanoutWave(session.id, batchId, productId, intentIds, wave, config, attempt, waveCount)
      opts?.onProgress?.(summarizeFanoutBatch(batchId, productId, intentIds, mergeFanoutProgress(tasks, submitted.tasks), { maxConcurrency, retryOnFailure, maxRetries, waves: waveCount }))
      const settled = await waitForFanoutWave(productId, submitted.tasks, timeoutMs, (latest) => {
        opts?.onProgress?.(summarizeFanoutBatch(batchId, productId, intentIds, mergeFanoutProgress(tasks, latest.tasks), { maxConcurrency, retryOnFailure, maxRetries, waves: waveCount }))
      })
      for (const task of settled.tasks) {
        if (task.status === 'succeeded') {
          completed.set(task.id, task)
        } else if (task.status === 'failed') {
          nextFailures.push({ ...task, retryCount: attempt + 1 })
        } else {
          nextFailures.push({ ...task, status: 'failed', error: task.error || '任务超时，本轮没有返回可展示结果。', retryCount: attempt + 1 })
        }
      }
    }
    if (!retryOnFailure || attempt >= maxRetries || nextFailures.length === 0) {
      nextFailures.forEach(task => finalFailures.set(task.id, task))
      break
    }
    pending = nextFailures.map(task => ({ ...task, versionId: undefined, runtimeJobId: undefined, status: 'pending', progress: 0, resultAssetCount: 0 }))
  }

  const merged = tasks.map(task => completed.get(task.id) ?? finalFailures.get(task.id) ?? { ...task, status: 'failed' as const, error: '任务未被调度。' })
  const finalBatch = summarizeFanoutBatch(batchId, productId, intentIds, merged, { maxConcurrency, retryOnFailure, maxRetries, waves: waveCount })
  opts?.onProgress?.(finalBatch)
  return finalBatch
}

function mergeFanoutProgress(allTasks: ProductionFanoutTask[], updates: ProductionFanoutTask[]): ProductionFanoutTask[] {
  const byId = new Map(updates.map(task => [task.id, task]))
  return allTasks.map(task => byId.get(task.id) ?? task)
}

async function submitFanoutWave(sessionId: string, batchId: string, productId: string, intentIds: string[], tasks: ProductionFanoutTask[], config: ExecutionConfig | undefined, attempt: number, wave: number): Promise<ProductionFanoutBatch> {
  const response = await request<GenerationFanoutResponseDTO>(`${VWF}/${sessionId}/generation-version-fanouts`, {
    method: 'POST',
    body: JSON.stringify({
      idempotency_key: `${batchId}:attempt-${attempt}:wave-${wave}`,
      template_slots: tasks.map(task => ({
        source_asset_id: task.sourceId,
        template_id: task.templateId,
        scene_tag: task.sceneTag,
        detail_requirement: task.detailRequirement,
        negative_requirement: task.negativeRequirement,
      })),
      source_asset_ids: Array.from(new Set(tasks.map(task => task.sourceId).filter(Boolean))),
      template_ids: Array.from(new Set(tasks.map(task => task.templateId).filter(Boolean))),
      requested_variants: 1,
      max_concurrency: config?.maxConcurrency,
      retry_on_failure: config?.retryOnFailure,
      max_retries: config?.maxRetries,
      timeout_seconds: config?.timeoutSeconds,
      provider_config: config?.providerConfig,
      prompt_variables: {
        ...(typeof config?.providerConfig?.prompt_composer === 'object' && config.providerConfig.prompt_composer !== null ? { prompt_composer: config.providerConfig.prompt_composer } : {}),
        fanout_slot_prompts: tasks.map(task => ({
          slot_index: task.slotIndex,
          template_id: task.templateId,
          template_name: task.templateName,
          scene_tag: task.sceneTag,
          detail_requirement: task.detailRequirement,
          negative_requirement: task.negativeRequirement,
        })),
      },
      metadata: {
        ...buildSafeGenerationMetadata(intentIds, config, 'sandbox_generation_fanout'),
        fanout_batch_id: batchId,
        fanout_attempt: attempt,
        fanout_wave: wave,
      },
    }),
  })
  const byTaskKey = new Map(tasks.map(task => [`${task.sourceId}:${task.templateId}:${task.slotIndex}`, task]))
  const nextTasks = response.items.map((item, index) => {
    const original = tasks[index] ?? byTaskKey.get(`${item.source_asset_id}:${item.template_id}:${item.slot_index}`)
    const version = item.generation_version
    return {
      ...(original ?? {
        id: item.fanout_task_id,
        sourceId: item.source_asset_id,
        templateId: item.template_id,
        slotIndex: item.slot_index,
        sceneTag: item.scene_tag,
        detailRequirement: item.detail_requirement,
      }),
      id: original?.id ?? item.fanout_task_id,
      versionId: version.version_id,
      runtimeJobId: version.runtime_job_id,
      status: ['queued', 'processing'].includes(String(version.status).toLowerCase()) ? 'queued' : String(version.status).toLowerCase() === 'completed' ? 'succeeded' : 'failed',
      progress: Number(version.progress ?? 5),
      resultAssetCount: version.result_assets?.length ?? 0,
      resultAssetUrls: version.result_assets?.map(asset => asset.asset_content_url).filter((url): url is string => Boolean(url)),
      error: version.status === 'contract_needed' ? '生成服务暂时没有开始任务' : undefined,
      retryCount: original?.retryCount ?? attempt,
    } as ProductionFanoutTask
  })
  return summarizeFanoutBatch(response.fanout_id, productId, intentIds, nextTasks, {
    maxConcurrency: config?.maxConcurrency,
    retryOnFailure: config?.retryOnFailure,
    maxRetries: config?.maxRetries,
    waves: wave,
  })
}

async function waitForFanoutWave(productId: string, tasks: ProductionFanoutTask[], timeoutMs: number, onProgress?: (batch: ProductionFanoutBatch) => void): Promise<ProductionFanoutBatch> {
  let current = summarizeFanoutBatch(`wave-${Date.now()}`, productId, [], tasks)
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    current = await getFanoutBatchStatus(productId, current)
    onProgress?.(current)
    const terminal = current.tasks.every(task => task.status === 'succeeded' || task.status === 'failed')
    if (terminal) return current
    await delay(3000)
  }
  return summarizeFanoutBatch(current.batchId, productId, current.intentIds, current.tasks.map(task => (
    task.status === 'succeeded' || task.status === 'failed'
      ? task
      : { ...task, status: 'failed', error: '任务超时，未在配置的 timeoutSeconds 内完成。' }
  )))
}

function summarizeFanoutBatch(batchId: string, productId: string, intentIds: string[], tasks: ProductionFanoutTask[], options?: Partial<ProductionFanoutBatch>): ProductionFanoutBatch {
  const completedTasks = tasks.filter(task => task.status === 'succeeded').length
  const failedTasks = tasks.filter(task => task.status === 'failed').length
  const status: ProductionFanoutBatch['status'] = failedTasks > 0 && completedTasks + failedTasks === tasks.length
    ? 'failed'
    : completedTasks === tasks.length
      ? 'succeeded'
      : tasks.some(task => task.status === 'executing' || task.status === 'queued')
        ? 'executing'
        : 'pending'
  return { batchId, productId, intentIds, tasks, status, totalTasks: tasks.length, completedTasks, failedTasks, createdAt: new Date().toISOString(), ...options }
}

export async function getFanoutBatchStatus(productId: string, batch: ProductionFanoutBatch): Promise<ProductionFanoutBatch> {
  if (isDevMode()) {
    await delay(900)
    return summarizeFanoutBatch(batch.batchId, productId, batch.intentIds, batch.tasks.map(task => ({ ...task, status: 'succeeded', progress: 100, resultAssetCount: Math.max(1, task.resultAssetCount) })))
  }
  const nextTasks = await Promise.all(batch.tasks.map(async (task) => {
    if (!task.versionId) return task
    const latest = await getGenerationExecutionStatus(productId, task.versionId)
    return {
      ...task,
      runtimeJobId: latest.runtimeJobId ?? task.runtimeJobId,
      status: latest.successful ? 'succeeded' : latest.terminal ? 'failed' : latest.progress > 5 ? 'executing' : 'queued',
      progress: latest.progress,
      resultAssetCount: latest.resultAssetCount,
      resultAssetUrls: latest.resultAssetUrls,
      error: latest.terminal && !latest.successful ? latest.message : task.error,
    } as ProductionFanoutTask
  }))
  return summarizeFanoutBatch(batch.batchId, productId, batch.intentIds, nextTasks)
}

export async function createWorkshopGenerationVersion(
  productId: string,
  parentVersionId: string,
  weights: Record<string, unknown>,
  refinementInstruction: string,
  source: 'workshop_regenerate' | 'workshop_branch_generation' = 'workshop_branch_generation',
): Promise<{ jobId: string; versionId: string; status: string; runtimeJobId?: string }> {
  if (isDevMode()) {
    await delay(1200)
    return { jobId: `workshop-${uid()}`, versionId: `gv-${uid()}`, status: 'queued' }
  }
  const session = await ensureVisualSession(productId)
  const promptPlan = await ensurePromptPlanReady(productId, {
    promptVariables: {
      source,
      parent_version_id: parentVersionId,
      source_version_id: parentVersionId,
      refinement_instruction: refinementInstruction || 'Workshop regeneration',
      ui_refinement_weights: weights,
      prompt_diff: true,
    },
  })
  if (!promptPlan.promptId) {
    contractNeeded('出图方案还没准备好，请先生成或刷新方案后再试。')
  }
  const response = await request<GenerationVersionDTO>(`${VWF}/${session.id}/generation-versions`, {
    method: 'POST',
    body: JSON.stringify({
      prompt_id: promptPlan.promptId,
      parent_version_id: parentVersionId,
      source_version_id: parentVersionId,
      refinement_instruction: refinementInstruction || 'Workshop regeneration',
      status: 'queued',
      stage: 'queued',
      progress: 0,
      idempotency_key: `${source}:${session.id}:${parentVersionId}:${promptPlan.promptId}:${Date.now()}`,
      metadata: {
        source,
        parent_version_id: parentVersionId,
        source_version_id: parentVersionId,
        ui_refinement_weights: weights,
        prompt_id: promptPlan.promptId,
      },
    }),
  })
  if (response.status === 'contract_needed') {
    contractNeeded('本次生成没有成功开始。系统不会展示占位图，请稍后重试。')
  }
  if (!response.runtime_job_id) {
    contractNeeded(`本次生成还没有开始，当前状态：${response.status}。`)
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
  return createWorkshopGenerationVersion(productId, parentVersionId, weights, refinementInstruction || 'Workshop branch regeneration', 'workshop_branch_generation')
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

function generationGroupId(version: GenerationVersionDTO): string {
  const metadata = version.metadata ?? {}
  const fanoutBatchId = String(metadata.fanout_batch_id ?? '').trim()
  const fanoutRunId = String(metadata.fanout_run_id ?? '').trim()
  if (fanoutBatchId && fanoutRunId) return `fanout:${fanoutBatchId}:${fanoutRunId}`
  if (fanoutBatchId) return `fanout:${fanoutBatchId}`
  const promptId = String(version.prompt_id ?? '').trim()
  if (promptId) return `prompt:${promptId}`
  return version.version_id
}

function generationGroupDescription(versions: GenerationVersionDTO[]): string {
  const completed = versions.filter(v => ['completed', 'succeeded'].includes(String(v.status ?? '').toLowerCase()) || String(v.stage ?? '').toLowerCase() === 'result_available').length
  const totalAssets = versions.reduce((sum, version) => sum + (version.result_assets?.length ?? 0), 0)
  const pending = versions.length - completed
  const templates = Array.from(new Set(versions.map(v => String(v.metadata?.template_id ?? '')).filter(Boolean)))
  return `完成 ${completed}/${versions.length} 个任务 · ${totalAssets} 张结果${pending > 0 ? ` · ${pending} 个处理中` : ''}${templates.length > 0 ? ` · ${templates.join(' / ')}` : ''}`
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
  const groups = new Map<string, GenerationVersionDTO[]>()
  versions.forEach((version) => {
    const key = generationGroupId(version)
    groups.set(key, [...(groups.get(key) ?? []), version])
  })
  const grouped = Array.from(groups.entries()).map(([id, groupVersions]) => {
    const sortedGroup = groupVersions.sort((a, b) => String(a.created_at ?? '').localeCompare(String(b.created_at ?? '')))
    const representative = sortedGroup.slice().reverse().find(version => (version.result_assets?.length ?? 0) > 0) ?? sortedGroup.at(-1)!
    const latest = sortedGroup.at(-1)!
    return { id, versions: sortedGroup, representative, latest }
  }).sort((a, b) => String(a.latest.created_at ?? '').localeCompare(String(b.latest.created_at ?? '')))
  return grouped.map((group, index) => {
    const label = generationVersionLabel(index)
    const weights = versionWeightParams(group.representative)
    const current = group.id === grouped.at(-1)?.id
    return {
      id: group.id,
      version: label,
      label,
      description: generationGroupDescription(group.versions),
      skuBias: weights.skuBias,
      refBias: 100 - weights.skuBias,
      timestamp: group.latest.created_at || new Date().toISOString(),
      strategySnapshot: String(group.representative.metadata?.source ?? group.representative.prompt_plan_status ?? 'backend_generation_version'),
      isCurrent: current,
      parentId: undefined,
      childrenIds: [],
      prompt: group.representative.prompt_id,
      negativePrompt: undefined,
      weightParams: weights,
      sourceVersionId: group.representative.version_id,
      versionIds: group.versions.map(version => version.version_id),
      resultAssetCount: group.versions.reduce((sum, version) => sum + (version.result_assets?.length ?? 0), 0),
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
    const groupId = generationGroupId(version)
    const assetContentPath = asset.asset_content_url || (asset.asset_id ? `/api/v1/ecommerce/assets/${asset.asset_id}/content` : '')
    const authenticatedUrl = assetContentPath ? await fetchAuthenticatedObjectUrl(assetContentPath) : ''
    const done = ['completed', 'succeeded'].includes(String(version.status ?? '').toLowerCase()) || String(version.stage ?? '').toLowerCase() === 'completed'
    return {
      id: `${version.version_id}:${asset.asset_id}`,
      intentId: version.prompt_id || version.version_id,
      assetUrl: authenticatedUrl,
      thumbnailUrl: authenticatedUrl,
      width: Number(asset.metadata?.width ?? 1024),
      height: Number(asset.metadata?.height ?? 1024),
      status: asset.selected || asset.asset_id === version.selected_result_asset_id ? 'selected' : (done ? 'ready' : 'generating'),
      metadata: { ...version.metadata, ...asset.metadata, generation_group_id: groupId, version_id: version.version_id, asset_id: asset.asset_id, asset_content_url: assetContentPath, stage: version.stage, progress: version.progress, status: version.status },
      createdAt: version.created_at || new Date().toISOString(),
    }
  }))
}

export async function createInpaintTask(_productId: string, req: CreateInpaintTaskRequest): Promise<InpaintTask> {
  if (isDevMode()) {
    await delay(1500)
    return mockInpaintTask(req.variantId, req.regions, req.prompt)
  }
  contractNeeded('局部重绘功能暂未开放，本次没有创建生产任务。')
}

export async function getInpaintTask(_productId: string, _taskId: string): Promise<InpaintTask> {
  if (isDevMode()) {
    await delay(300)
    return mockInpaintTask('var-1', [{ x: 100, y: 100, width: 200, height: 150 }], 'demo inpaint')
  }
  contractNeeded('局部重绘功能暂未开放，暂时无法加载这条任务。')
}

export async function getOrCreateRefinementSession(_productId: string, variantId: string): Promise<RefinementSession> {
  if (isDevMode()) {
    await delay(600)
    return mockRefinementSession(variantId)
  }
  contractNeeded('图片再加工功能暂未开放，本次没有创建会话。')
}

export async function sendRefinementMessage(_productId: string, _sessionId: string, req: SendRefinementMessageRequest): Promise<RefinementMessage> {
  if (isDevMode()) {
    await delay(1200)
    return mockRefinementReply(req.content)
  }
  contractNeeded('图片再加工功能暂未开放，本次没有发送消息。')
}



export async function saveVariantAsTemplate(productId: string, variantId: string, title?: string): Promise<{ templateId: string; savedTemplates: number }> {
  if (isDevMode()) {
    await delay(500)
    return { templateId: `tpl-${uid()}`, savedTemplates: 1 }
  }
  const session = await ensureVisualSession(productId)
  const [versionId, assetId] = variantId.split(':')
  if (!versionId || !assetId) {
    contractNeeded('请先选择一张已生成的图片，再保存为模板。')
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

export async function finalizeAssets(req: FinalizeAssetsRequest): Promise<{ assetIds: string[]; assetRelationIds: string[] }> {
  if (isDevMode()) {
    await delay(800)
    return { assetIds: req.variantIds.map((id) => `finalized-${id}`), assetRelationIds: req.variantIds.map((id) => `relation-${id}`) }
  }
  const session = await ensureVisualSession(req.productId)
  const assetIds: string[] = []
  const assetRelationIds: string[] = []
  for (const variantId of req.variantIds) {
    const [versionId, assetId] = variantId.split(':')
    if (!versionId || !assetId) continue
    await request(`${VWF}/${session.id}/generation-versions/${versionId}/select`, {
      method: 'POST',
      body: JSON.stringify({ selected_result_asset_id: assetId, metadata: { frontend_variant_id: variantId } }),
    })
    const result = await request<{ asset_relation: { id?: string; asset_id: string } }>(`${VWF}/${session.id}/generation-versions/${versionId}/writeback-selected-asset`, {
      method: 'POST',
      body: JSON.stringify({ asset_id: assetId, asset_role: req.assetRoles[variantId] ?? 'hero', idempotency_key: `writeback:${session.id}:${versionId}:${assetId}` }),
    })
    assetIds.push(result.asset_relation.asset_id)
    if (result.asset_relation.id) assetRelationIds.push(result.asset_relation.id)
  }
  return { assetIds, assetRelationIds }
}
