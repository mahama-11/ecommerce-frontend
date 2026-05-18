// ============================================================
// V2 Production Types — Intent-driven Visual Production Pipeline
// ============================================================

// ─── Prep Hub Types ─────────────────────────────────────────

export type ParsingTrack = 'comfyui' | 'third_party'

export type ParsingSource = {
  id: string
  type: 'sku_image' | 'reference_image' | 'url'
  url: string
  thumbnailUrl?: string
  name?: string
  uploadedAt: string
  assetId?: string
  assetRelationId?: string
  sourceReferenceId?: string
  mimeType?: string
  sourceRole?: 'sku' | 'reference'
}


export type ParsingStatus = 'idle' | 'parsing' | 'succeeded' | 'failed'

export type ParsedAttribute = {
  key: string
  label: string
  value: string | number | string[]
  confidence: number
  editable: boolean
  source: ParsingTrack
  sourceRole?: 'sku' | 'reference'
  sourceReferenceId?: string
  driftFromOriginal?: number // 0~1, 0 = no drift
  driftBias?: number // 0~100, 0 = Focus on SKU, 100 = Focus on Reference, default 50
}

export type ParsingResult = {
  track: ParsingTrack
  status: ParsingStatus
  attributes: ParsedAttribute[]
  rawOutput?: Record<string, unknown>
  error?: string
  parsedAt?: string
}

export type DualTrackParsing = {
  status: ParsingStatus
  primaryTrack: ParsingTrack
  comfyuiResult?: ParsingResult
  thirdPartyResult?: ParsingResult
  mergedAttributes: ParsedAttribute[]
  conflicts: Array<{
    key: string
    comfyuiValue: unknown
    thirdPartyValue: unknown
    resolvedValue?: unknown
  }>
}

export type LlmDecisionStatus = 'idle' | 'evaluating' | 'succeeded' | 'failed'

export type LlmDecisionNode = {
  id: string
  question: string
  answer?: string
  confidence: number
  selectedOptionId?: string
  options?: DecisionOption[]
  status?: 'pending' | 'active' | 'completed'
  children?: LlmDecisionNode[]
}

// ─── Interactive Decision Tree (Step-based) ────────────────

export type DecisionOption = {
  id: string
  label: string
  description?: string
  icon?: string // icon name or emoji
  confidence?: number
}

export type DecisionStep = {
  id: string
  stepNumber: number
  title: string
  description?: string
  options: DecisionOption[]
  selectedOptionId?: string
  status: 'pending' | 'active' | 'completed'
}

export type LlmDecisionTreeResult = {
  status: LlmDecisionStatus
  root?: LlmDecisionNode
  steps?: DecisionStep[] // interactive step-based mode
  recommendedActions: string[]
  overallConfidence: number
  provider: 'internal' | 'third_party' | 'comfyui'
  evaluatedAt?: string
}

export type PrepHubState = {
  productId: string
  sources: ParsingSource[]
  parsing: DualTrackParsing | null
  decisionTree: LlmDecisionTreeResult | null
  isDirty: boolean
}

// ─── Sandbox Types ──────────────────────────────────────────

export type IntentType =
  | 'background_replace'
  | 'model_swap'
  | 'pose_control'
  | 'style_transfer'
  | 'scene_generation'
  | 'image_enhancement'
  | 'batch_variant'

export type IntentPriority = 'high' | 'medium' | 'low'

export type CompiledIntent = {
  id: string
  type: IntentType
  description: string
  prompt: string
  negativePrompt?: string
  priority: IntentPriority
  params: Record<string, unknown>
  estimatedCost?: number
  dependsOn?: string[] // intent IDs
  status: 'draft' | 'compiled' | 'queued' | 'executing' | 'succeeded' | 'failed'
  resultAssetId?: string
  createdAt: string
}

export type ExecutionProvider = 'comfyui' | 'third_party_api'

export type ExecutionConfig = {
  provider: ExecutionProvider
  providerConfig?: Record<string, unknown>
  maxConcurrency: number
  retryOnFailure: boolean
  maxRetries: number
  timeoutSeconds: number
}

export type TaskQuota = {
  totalSlots: number
  usedSlots: number
  reservedSlots: number
  estimatedTimeRemaining?: number
}

// ─── Sandbox V2 Types ───────────────────────────────────────

export type SceneTemplate = {
  id: string
  name: string
  category: 'hero' | 'poster' | 'lifestyle' | 'detail' | 'comparison'
  aspectRatio: '1:1' | '3:4' | '16:9' | '4:3'
  description: string
  compositionRules: string[]
  platform?: string // e.g. 'Amazon', 'Tmall'
}

export type AssetTask = {
  id: string
  name: string
  sceneTag: string
  templateId: string
  templateName?: string
  sourceId?: string
  detailRequirement?: string
  negativeRequirement?: string
}

export type FanoutTaskStatus = 'pending' | 'queued' | 'executing' | 'succeeded' | 'failed'

export type ProductionFanoutTask = {
  id: string
  sourceId: string
  sourceName?: string
  sourceUrl?: string
  templateId: string
  templateName?: string
  slotIndex: number
  sceneTag?: string
  detailRequirement?: string
  negativeRequirement?: string
  promptId?: string
  versionId?: string
  runtimeJobId?: string
  status: FanoutTaskStatus
  progress: number
  resultAssetCount: number
  error?: string
  retryCount?: number
}

export type ProductionFanoutBatch = {
  batchId: string
  productId: string
  intentIds: string[]
  tasks: ProductionFanoutTask[]
  status: FanoutTaskStatus
  totalTasks: number
  completedTasks: number
  failedTasks: number
  createdAt: string
  maxConcurrency?: number
  retryOnFailure?: boolean
  maxRetries?: number
  waves?: number
}

export type ModelOption = {
  id: string
  name: string
  label: string
  description: string
  costPerImage: number
  recommended?: boolean
}

export type ResolutionOption = {
  id: string
  label: string
  dimensions: string
  costMultiplier: number
}

export type AdvancedParams = {
  seed: number
  negativePrompt: string
  sampling: string
  cfgScale: number
  steps: number
  highResFix: boolean
}

export type StrategyAttribute = {
  key: string
  label: string
  value: string
  icon: string // lucide icon name
}

export type StrategySummary = {
  overview: string
  attributes: StrategyAttribute[]
}

export type CreditBreakdown = {
  modelCostPerImage: number
  resolutionCostPerImage: number
  imageCount: number
  total: number
}

export type SandboxState = {
  productId: string
  intents: CompiledIntent[]
  executionConfig: ExecutionConfig
  quota: TaskQuota | null
  isRunning: boolean
  startedAt?: string
}

// ─── Workshop Types ─────────────────────────────────────────

export type VariantStatus =
  | 'generating'
  | 'ready'
  | 'selected'
  | 'rejected'
  | 'refining'

export type AssetVariant = {
  id: string
  intentId: string
  assetUrl: string
  thumbnailUrl: string
  width: number
  height: number
  status: VariantStatus
  score?: number // AI quality score 0~100
  selectedAt?: string
  metadata?: Record<string, unknown>
  createdAt: string
}

export type InpaintRegion = {
  id: string
  x: number
  y: number
  width: number
  height: number
  label?: string
}

export type InpaintTask = {
  id: string
  variantId: string
  regions: InpaintRegion[]
  prompt: string
  negativePrompt?: string
  status: 'pending' | 'processing' | 'succeeded' | 'failed'
  resultAssetId?: string
  createdAt: string
}

export type RefinementMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  attachmentAssetIds?: string[]
  createdAt: string
}

export type RefinementSession = {
  id: string
  variantId: string
  messages: RefinementMessage[]
  isTyping: boolean
  createdAt: string
}

// ─── Workshop V2 Types ──────────────────────────────────────

export type VersionNode = {
  id: string
  version: string // e.g. 'V1.0', 'V1.1'
  label: string
  description: string
  skuBias: number // 0-100
  refBias: number // 0-100
  timestamp: string
  strategySnapshot: string
  isCurrent: boolean
  parentId?: string
  childrenIds: string[]
  prompt?: string
  negativePrompt?: string
  weightParams: WeightParams
}

export type WeightParams = {
  skuBias: number // 0-100, global slider: left=SKU, right=Reference
  styleStrength: number // 0-1, style transfer intensity
  identityConsistency: number // 0-1, SKU geometry/material preservation
  creativeFreedom: number // 0-1, model divergence permission
}

export type WorkshopState = {
  productId: string
  variants: AssetVariant[]
  selectedVariantIds: string[]
  inpaintTasks: InpaintTask[]
  activeRefinement?: RefinementSession
  activeInpaintVariantId?: string

  // V2 Workshop
  versionNodes: VersionNode[]
  activeVersionId: string | null
  weightParams: WeightParams
  advancedTuningExpanded: boolean
  aiAssistantInput: string
  isComparing: boolean
  compareVersionIds: string[]
}

// ─── Shared / Cross-page Types ──────────────────────────────

export type ProductionPageStep = 'prep' | 'sandbox' | 'workshop'

export type ProductionProgress = {
  prep: 'pending' | 'in_progress' | 'done'
  sandbox: 'pending' | 'in_progress' | 'done'
  workshop: 'pending' | 'in_progress' | 'done'
}

// ─── API Request / Response Types ───────────────────────────

export type StartParsingRequest = {
  productId: string
  sourceIds: string[]
  tracks: ParsingTrack[]
}

export type StartParsingResponse = {
  parsingJobId: string
  status: ParsingStatus
}

export type EvaluateDecisionTreeRequest = {
  productId: string
  attributes: ParsedAttribute[]
  provider?: 'internal' | 'third_party'
}

export type CompileIntentRequest = {
  productId: string
  type: IntentType
  description: string
  params?: Record<string, unknown>
  priority?: IntentPriority
}

export type ExecuteIntentsRequest = {
  productId: string
  intentIds: string[]
  config?: ExecutionConfig
}

export type CreateInpaintTaskRequest = {
  variantId: string
  regions: Array<{
    x: number
    y: number
    width: number
    height: number
  }>
  prompt: string
  negativePrompt?: string
}

export type SendRefinementMessageRequest = {
  sessionId: string
  content: string
  attachmentAssetIds?: string[]
}

export type FinalizeAssetsRequest = {
  productId: string
  variantIds: string[]
  assetRoles: Record<string, string>
}
