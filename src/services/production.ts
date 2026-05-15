import { request } from '@/services/http'
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
  readiness?: string
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
  metadata?: Record<string, unknown>
  created_at?: string
}

type StageViewDTO = VisualSession & {
  session_id?: string
  source_reference?: SourceReferenceDTO
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

function normalizeStatus(status?: string): 'idle' | 'parsing' | 'succeeded' | 'failed' {
  switch ((status ?? '').toLowerCase()) {
    case 'running':
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

function elementToAttribute(element: DeconstructionElementDTO): ParsedAttribute {
  const value = element.value?.value ?? element.value?.text ?? element.value?.label ?? element.label ?? element.element_key ?? element.id
  return {
    key: element.element_key || element.id,
    label: element.label || element.element_key || element.element_type,
    value: Array.isArray(value) || typeof value === 'number' || typeof value === 'string' ? value : JSON.stringify(value),
    confidence: element.confidence ?? 0,
    editable: true,
    source: 'third_party',
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
  const steps = elements.slice(0, 6).map((element, idx) => ({
    id: element.id,
    stepNumber: idx + 1,
    title: element.label || element.element_key || element.element_type,
    description: element.value ? JSON.stringify(element.value) : undefined,
    options: [
      { id: `${element.id}:use`, label: '使用', confidence: element.confidence },
      { id: `${element.id}:skip`, label: '跳过' },
    ],
    selectedOptionId: element.selected ? `${element.id}:use` : undefined,
    status: (element.confirmed ? 'completed' : idx === 0 ? 'active' : 'pending') as 'pending' | 'active' | 'completed',
  }))
  return {
    status: blockers.length > 0 ? 'failed' : (selections.length > 0 || elements.length > 0 ? 'succeeded' : 'idle'),
    steps,
    recommendedActions: blockers.length > 0 ? blockers.map(b => b.message) : ['确认商品视觉元素', '进入意图编排', '生成生产资产'],
    overallConfidence: elements.length ? Math.round(elements.reduce((sum, e) => sum + (e.confidence ?? 0), 0) / elements.length * 100) : 0,
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
  const source: ParsingSource = {
    id: asset.id,
    type: sourceType,
    url: `/api/v1/ecommerce/assets/${asset.id}/content`,
    thumbnailUrl: `/api/v1/ecommerce/assets/${asset.id}/content`,
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


export async function startParsing(req: StartParsingRequest): Promise<StartParsingResponse> {
  if (isDevMode()) {
    await delay(400)
    return { parsingJobId: `job-${uid()}`, status: 'parsing' }
  }
  const session = await ensureVisualSession(req.productId)
  const localSources = getLocalSources(req.productId)
  const selectedSource = localSources.find(s => req.sourceIds.includes(s.id)) ?? localSources[0]
  const source = await request<SourceReferenceDTO>(`${VWF}/${session.id}/source-references`, {
    method: 'POST',
    body: JSON.stringify({
      source_kind: selectedSource?.type === 'url' ? 'url' : selectedSource?.assetId ? 'product_asset' : 'upload',
      source_ref: selectedSource?.assetId || selectedSource?.url || selectedSource?.name || req.sourceIds[0] || req.productId,
      asset_id: selectedSource?.assetId,
      asset_relation_id: selectedSource?.assetRelationId,
      mime_type: selectedSource?.mimeType || (selectedSource?.type === 'url' ? undefined : 'image/*'),
      metadata: { frontend_source_ids: req.sourceIds, frontend_tracks: req.tracks, source_role: selectedSource?.sourceRole || selectedSource?.type },
    }),
  })
  const job = await request<DeconstructionJobDTO>(`${VWF}/${session.id}/deconstruction-jobs`, {
    method: 'POST',
    body: JSON.stringify({
      source_reference_id: source.id,
      idempotency_key: `deconstruct:${session.id}:${source.id}`,
      requested_elements: ['product_geometry', 'material', 'style', 'scene', 'brand_constraints'],
      metadata: { frontend_entrypoint: 'production-prep' },
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
  const decisions = (stage.deconstruction_elements ?? []).map(element => ({
    element_id: element.id,
    decision: 'keep',
    rationale: 'frontend decision tree default selection',
    confidence: element.confidence,
  }))
  if (decisions.length > 0) {
    await request(`${VWF}/${session.id}/attention-tree`, {
      method: 'POST',
      body: JSON.stringify({ decisions, drift_controls: { source: req.provider ?? 'internal' } }),
    })
  }
  return stageToDecisionTree(await getStageView(req.productId))
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

function normalizeIntentType(input: string): IntentType {
  const allowed: IntentType[] = ['background_replace', 'model_swap', 'pose_control', 'style_transfer', 'scene_generation', 'image_enhancement', 'batch_variant']
  return allowed.includes(input as IntentType) ? input as IntentType : 'scene_generation'
}

function stageToIntents(stage: StageViewDTO, productId: string): CompiledIntent[] {
  const stored = getStored<CompiledIntent[]>(intentKey(productId), [])
  const selections = stage.intent_spec?.selections ?? []
  const fromStage = selections.map((selection, idx) => ({
    id: selection.element_id || `${stage.id}-intent-${idx}`,
    type: normalizeIntentType(String(stage.intent_spec?.requirements?.type ?? 'scene_generation')),
    description: selection.label || selection.element_key || selection.decision || '视觉生产意图',
    prompt: JSON.stringify(selection.value ?? selection),
    priority: 'medium' as const,
    params: selection.value ?? {},
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


export async function executeIntents(productId: string, intentIds: string[], config?: ExecutionConfig): Promise<{ jobId: string }> {
  if (isDevMode()) {
    await delay(2000)
    return { jobId: `exec-${uid()}` }
  }
  const session = await ensureVisualSession(productId)
  const stage = await getStageView(productId)
  const selectedElementIds = (stage.deconstruction_elements ?? []).filter(e => e.selected || e.confirmed).map(e => e.id)
  const response = await request<{ runtime_job_id?: string; status: string }>(`${VWF}/${session.id}/intent-planner-jobs`, {
    method: 'POST',
    body: JSON.stringify({
      element_ids: selectedElementIds,
      marketplace: 'generic',
      locale: 'zh-CN',
      idempotency_key: `intent-plan:${session.id}:${intentIds.join(',')}`,
      metadata: { frontend_intent_ids: intentIds, config },
    }),
  })
  if (!response.runtime_job_id) {
    contractNeeded(`Intent planner accepted the request but no runtime job was created; status=${response.status}.`)
  }
  return { jobId: response.runtime_job_id }
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

export async function listVariants(productId: string): Promise<AssetVariant[]> {
  if (isDevMode()) {
    await delay(400)
    return MOCK_VARIANTS
  }
  const stage = await getStageView(productId)
  return (stage.generation_versions ?? []).flatMap(version => (version.result_assets ?? []).map(asset => ({
    id: `${version.version_id}:${asset.asset_id}`,
    intentId: version.prompt_id || version.version_id,
    assetUrl: asset.asset_content_url || '',
    thumbnailUrl: asset.asset_content_url || '',
    width: Number(asset.metadata?.width ?? 1024),
    height: Number(asset.metadata?.height ?? 1024),
    status: asset.selected || asset.asset_id === version.selected_result_asset_id ? 'selected' : (version.status === 'completed' ? 'ready' : 'generating'),
    metadata: { ...asset.metadata, version_id: version.version_id, asset_id: asset.asset_id, stage: version.stage, progress: version.progress },
    createdAt: version.created_at || new Date().toISOString(),
  })))
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
      body: JSON.stringify({ asset_id: assetId, asset_role: req.assetRoles[variantId] ?? 'generated', idempotency_key: `writeback:${session.id}:${versionId}:${assetId}` }),
    })
    assetIds.push(result.asset_relation.asset_id)
  }
  return { assetIds }
}
