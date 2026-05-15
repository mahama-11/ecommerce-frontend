import { create } from 'zustand'
import type {
  ParsingSource,
  DualTrackParsing,
  LlmDecisionTreeResult,
  CompiledIntent,
  ExecutionConfig,
  TaskQuota,
  AssetVariant,
  InpaintTask,
  RefinementSession,
  StrategySummary,
  AssetTask,
  AdvancedParams,
  CreditBreakdown,
  VersionNode,
  WeightParams,
} from '@/types/production'

// ─── Prep Hub Store ─────────────────────────────────────────

interface PrepState {
  productId: string | null
  sources: ParsingSource[]
  parsing: DualTrackParsing | null
  decisionTree: LlmDecisionTreeResult | null
  isDirty: boolean
  globalDriftBias: number // 0~100, applies to all attributes without per-attribute override

  // Actions
  setProductId: (id: string) => void
  addSource: (source: ParsingSource) => void
  removeSource: (id: string) => void
  setSources: (sources: ParsingSource[]) => void
  setParsing: (parsing: DualTrackParsing | null) => void
  setDecisionTree: (tree: LlmDecisionTreeResult | null) => void
  updateAttributeBias: (key: string, bias: number) => void
  setGlobalDriftBias: (bias: number) => void
  markDirty: () => void
  reset: () => void
}

export const usePrepStore = create<PrepState>((set) => ({
  productId: null,
  sources: [],
  parsing: null,
  decisionTree: null,
  isDirty: false,
  globalDriftBias: 50,

  setProductId: (id) => set({ productId: id }),
  addSource: (source) =>
    set((s) => ({ sources: [...s.sources, source], isDirty: true })),
  removeSource: (id) =>
    set((s) => ({
      sources: s.sources.filter((src) => src.id !== id),
      isDirty: true,
    })),
  setSources: (sources) => set({ sources, isDirty: true }),
  setParsing: (parsing) => set({ parsing }),
  setDecisionTree: (tree) => set({ decisionTree: tree }),
  updateAttributeBias: (key, bias) =>
    set((s) => {
      if (!s.parsing?.mergedAttributes) return s
      return {
        parsing: {
          ...s.parsing,
          mergedAttributes: s.parsing.mergedAttributes.map((a) =>
            a.key === key ? { ...a, driftBias: bias } : a,
          ),
        },
        isDirty: true,
      }
    }),
  setGlobalDriftBias: (bias) => set({ globalDriftBias: bias, isDirty: true }),
  markDirty: () => set({ isDirty: true }),
  reset: () =>
    set({
      productId: null,
      sources: [],
      parsing: null,
      decisionTree: null,
      isDirty: false,
      globalDriftBias: 50,
    }),
}))

// ─── Sandbox Store ──────────────────────────────────────────

const defaultAdvancedParams: AdvancedParams = {
  seed: -1,
  negativePrompt: '',
  sampling: 'DPM++ 2M Karras',
  cfgScale: 6.5,
  steps: 30,
  highResFix: false,
}

interface SandboxState {
  productId: string | null
  intents: CompiledIntent[]
  executionConfig: ExecutionConfig | null
  quota: TaskQuota | null
  isRunning: boolean
  startedAt: string | null

  // V2 Strategy Configuration
  strategySummary: StrategySummary | null
  diyPrompt: string
  recognizedKeywords: string[]
  assetTasks: AssetTask[]
  imageCount: number
  selectedModel: string
  selectedResolution: string
  advancedParams: AdvancedParams
  advancedExpanded: boolean

  // Actions
  setProductId: (id: string) => void
  addIntent: (intent: CompiledIntent) => void
  updateIntent: (id: string, patch: Partial<CompiledIntent>) => void
  removeIntent: (id: string) => void
  setIntents: (intents: CompiledIntent[]) => void
  setExecutionConfig: (config: ExecutionConfig | null) => void
  setQuota: (quota: TaskQuota | null) => void
  setIsRunning: (running: boolean) => void
  setStartedAt: (date: string | null) => void
  setStrategySummary: (summary: StrategySummary | null) => void
  setDiyPrompt: (prompt: string) => void
  setRecognizedKeywords: (keywords: string[]) => void
  setAssetTasks: (tasks: AssetTask[]) => void
  addAssetTask: (task: AssetTask) => void
  removeAssetTask: (id: string) => void
  updateAssetTask: (id: string, patch: Partial<AssetTask>) => void
  setImageCount: (count: number) => void
  setSelectedModel: (model: string) => void
  setSelectedResolution: (res: string) => void
  setAdvancedParams: (params: Partial<AdvancedParams>) => void
  setAdvancedExpanded: (expanded: boolean) => void
  reset: () => void
}

const defaultExecutionConfig: ExecutionConfig = {
  provider: 'comfyui',
  maxConcurrency: 3,
  retryOnFailure: true,
  maxRetries: 2,
  timeoutSeconds: 300,
}

export const useSandboxStore = create<SandboxState>((set) => ({
  productId: null,
  intents: [],
  executionConfig: defaultExecutionConfig,
  quota: null,
  isRunning: false,
  startedAt: null,

  // V2 defaults
  strategySummary: null,
  diyPrompt: '',
  recognizedKeywords: [],
  assetTasks: [
    { id: 'asset-1', name: 'Asset 01（主图）', sceneTag: '主图', templateId: 'amazon-hero' },
    { id: 'asset-2', name: 'Asset 02（营销海报）', sceneTag: '海报', templateId: 'industrial-poster' },
    { id: 'asset-3', name: 'Asset 03（使用场景图）', sceneTag: '使用图', templateId: 'lifestyle-scene' },
  ],
  imageCount: 3,
  selectedModel: 'pro-v6',
  selectedResolution: '2k-ultra',
  advancedParams: defaultAdvancedParams,
  advancedExpanded: false,

  setProductId: (id) => set({ productId: id }),
  addIntent: (intent) =>
    set((s) => ({ intents: [...s.intents, intent] })),
  updateIntent: (id, patch) =>
    set((s) => ({
      intents: s.intents.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    })),
  removeIntent: (id) =>
    set((s) => ({
      intents: s.intents.filter((i) => i.id !== id),
    })),
  setIntents: (intents) => set({ intents }),
  setExecutionConfig: (config) => set({ executionConfig: config }),
  setQuota: (quota) => set({ quota }),
  setIsRunning: (running) => set({ isRunning: running }),
  setStartedAt: (date) => set({ startedAt: date }),
  setStrategySummary: (summary) => set({ strategySummary: summary }),
  setDiyPrompt: (prompt) => set({ diyPrompt: prompt }),
  setRecognizedKeywords: (keywords) => set({ recognizedKeywords: keywords }),
  setAssetTasks: (tasks) => set({ assetTasks: tasks }),
  addAssetTask: (task) =>
    set((s) => ({ assetTasks: [...s.assetTasks, task] })),
  removeAssetTask: (id) =>
    set((s) => ({
      assetTasks: s.assetTasks.filter((t) => t.id !== id),
    })),
  updateAssetTask: (id, patch) =>
    set((s) => ({
      assetTasks: s.assetTasks.map((t) =>
        t.id === id ? { ...t, ...patch } : t,
      ),
    })),
  setImageCount: (count) => set({ imageCount: Math.max(1, Math.min(10, count)) }),
  setSelectedModel: (model) => set({ selectedModel: model }),
  setSelectedResolution: (res) => set({ selectedResolution: res }),
  setAdvancedParams: (params) =>
    set((s) => ({
      advancedParams: { ...s.advancedParams, ...params },
    })),
  setAdvancedExpanded: (expanded) => set({ advancedExpanded: expanded }),
  reset: () =>
    set({
      productId: null,
      intents: [],
      executionConfig: defaultExecutionConfig,
      quota: null,
      isRunning: false,
      startedAt: null,
      strategySummary: null,
      diyPrompt: '',
      recognizedKeywords: [],
      assetTasks: [
        { id: 'asset-1', name: 'Asset 01（主图）', sceneTag: '主图', templateId: 'amazon-hero' },
        { id: 'asset-2', name: 'Asset 02（营销海报）', sceneTag: '海报', templateId: 'industrial-poster' },
        { id: 'asset-3', name: 'Asset 03（使用场景图）', sceneTag: '使用图', templateId: 'lifestyle-scene' },
      ],
      imageCount: 3,
      selectedModel: 'pro-v6',
      selectedResolution: '2k-ultra',
      advancedParams: defaultAdvancedParams,
      advancedExpanded: false,
    }),
}))

// ─── Workshop Store ─────────────────────────────────────────

const defaultWeightParams: WeightParams = {
  skuBias: 50,
  styleStrength: 0.6,
  identityConsistency: 0.4,
  creativeFreedom: 0.5,
}

// Mock version nodes for demo
const MOCK_VERSION_NODES: VersionNode[] = [
  {
    id: 'v-init',
    version: '初始意图',
    label: '初始意图',
    description: '工业车间，暖色逆光，低角度特写',
    skuBias: 70,
    refBias: 30,
    timestamp: '2026-05-11T10:20:00Z',
    strategySnapshot: '初始策略：暖色逆光 + 工业车间',
    isCurrent: false,
    childrenIds: ['v-1.0'],
    weightParams: { ...defaultWeightParams, skuBias: 70 },
  },
  {
    id: 'v-1.0',
    version: 'V1.0',
    label: '版本 V1.0',
    description: '增加环境纹理，提升金属质感',
    skuBias: 60,
    refBias: 40,
    timestamp: '2026-05-11T10:25:00Z',
    strategySnapshot: 'V1.0：增加环境纹理',
    isCurrent: false,
    parentId: 'v-init',
    childrenIds: ['v-1.1'],
    weightParams: { ...defaultWeightParams, skuBias: 60 },
  },
  {
    id: 'v-1.1',
    version: 'V1.1',
    label: '版本 V1.1',
    description: '背景更暗，突出主体',
    skuBias: 50,
    refBias: 50,
    timestamp: '2026-05-11T10:27:00Z',
    strategySnapshot: 'V1.1：背景更暗，突出主体',
    isCurrent: false,
    parentId: 'v-1.0',
    childrenIds: ['v-1.2'],
    weightParams: { ...defaultWeightParams, skuBias: 50 },
  },
  {
    id: 'v-1.2',
    version: 'V1.2',
    label: '版本 V1.2（当前）',
    description: '增强高光，强化螺纹细节',
    skuBias: 40,
    refBias: 60,
    timestamp: '2026-05-11T10:30:00Z',
    strategySnapshot: 'V1.2：增强高光，强化螺纹细节',
    isCurrent: true,
    parentId: 'v-1.1',
    childrenIds: ['v-1.3'],
    weightParams: { ...defaultWeightParams, skuBias: 40 },
  },
  {
    id: 'v-1.3',
    version: 'V1.3',
    label: '版本 V1.3',
    description: '降低环境光，添加颗粒感',
    skuBias: 30,
    refBias: 70,
    timestamp: '2026-05-11T10:32:00Z',
    strategySnapshot: 'V1.3：降低环境光，添加颗粒感',
    isCurrent: false,
    parentId: 'v-1.2',
    childrenIds: [],
    weightParams: { ...defaultWeightParams, skuBias: 30 },
  },
]

interface WorkshopState {
  productId: string | null
  variants: AssetVariant[]
  selectedVariantIds: string[]
  inpaintTasks: InpaintTask[]
  activeRefinement: RefinementSession | null
  activeInpaintVariantId: string | null

  // V2 Workshop
  versionNodes: VersionNode[]
  activeVersionId: string | null
  weightParams: WeightParams
  advancedTuningExpanded: boolean
  aiAssistantInput: string
  isComparing: boolean
  compareVersionIds: string[]

  // Actions
  setProductId: (id: string) => void
  setVariants: (variants: AssetVariant[]) => void
  addVariant: (variant: AssetVariant) => void
  updateVariant: (id: string, patch: Partial<AssetVariant>) => void
  toggleVariantSelection: (id: string) => void
  setSelectedVariantIds: (ids: string[]) => void
  setInpaintTasks: (tasks: InpaintTask[]) => void
  addInpaintTask: (task: InpaintTask) => void
  updateInpaintTask: (id: string, patch: Partial<InpaintTask>) => void
  setActiveRefinement: (session: RefinementSession | null) => void
  appendRefinementMessage: (msg: RefinementSession['messages'][number]) => void
  setActiveInpaintVariantId: (id: string | null) => void
  setVersionNodes: (nodes: VersionNode[]) => void
  setActiveVersionId: (id: string | null) => void
  setWeightParams: (params: Partial<WeightParams>) => void
  setAdvancedTuningExpanded: (expanded: boolean) => void
  setAiAssistantInput: (input: string) => void
  setIsComparing: (comparing: boolean) => void
  setCompareVersionIds: (ids: string[]) => void
  reset: () => void
}

export const useWorkshopStore = create<WorkshopState>((set) => ({
  productId: null,
  variants: [],
  selectedVariantIds: [],
  inpaintTasks: [],
  activeRefinement: null,
  activeInpaintVariantId: null,

  // V2 defaults
  versionNodes: MOCK_VERSION_NODES,
  activeVersionId: 'v-1.2',
  weightParams: defaultWeightParams,
  advancedTuningExpanded: false,
  aiAssistantInput: '',
  isComparing: false,
  compareVersionIds: [],

  setProductId: (id) => set({ productId: id }),
  setVariants: (variants) => set({ variants }),
  addVariant: (variant) =>
    set((s) => ({ variants: [...s.variants, variant] })),
  updateVariant: (id, patch) =>
    set((s) => ({
      variants: s.variants.map((v) => (v.id === id ? { ...v, ...patch } : v)),
    })),
  toggleVariantSelection: (id) =>
    set((s) => ({
      selectedVariantIds: s.selectedVariantIds.includes(id)
        ? s.selectedVariantIds.filter((vid) => vid !== id)
        : [...s.selectedVariantIds, id],
    })),
  setSelectedVariantIds: (ids) => set({ selectedVariantIds: ids }),
  setInpaintTasks: (tasks) => set({ inpaintTasks: tasks }),
  addInpaintTask: (task) =>
    set((s) => ({ inpaintTasks: [...s.inpaintTasks, task] })),
  updateInpaintTask: (id, patch) =>
    set((s) => ({
      inpaintTasks: s.inpaintTasks.map((t) =>
        t.id === id ? { ...t, ...patch } : t,
      ),
    })),
  setActiveRefinement: (session) => set({ activeRefinement: session }),
  appendRefinementMessage: (msg) =>
    set((s) => ({
      activeRefinement: s.activeRefinement
        ? { ...s.activeRefinement, messages: [...s.activeRefinement.messages, msg] }
        : null,
    })),
  setActiveInpaintVariantId: (id) => set({ activeInpaintVariantId: id }),
  setVersionNodes: (nodes) => set({ versionNodes: nodes }),
  setActiveVersionId: (id) => set({ activeVersionId: id }),
  setWeightParams: (params) =>
    set((s) => ({
      weightParams: { ...s.weightParams, ...params },
    })),
  setAdvancedTuningExpanded: (expanded) => set({ advancedTuningExpanded: expanded }),
  setAiAssistantInput: (input) => set({ aiAssistantInput: input }),
  setIsComparing: (comparing) => set({ isComparing: comparing }),
  setCompareVersionIds: (ids) => set({ compareVersionIds: ids }),
  reset: () =>
    set({
      productId: null,
      variants: [],
      selectedVariantIds: [],
      inpaintTasks: [],
      activeRefinement: null,
      activeInpaintVariantId: null,
      versionNodes: MOCK_VERSION_NODES,
      activeVersionId: 'v-1.2',
      weightParams: defaultWeightParams,
      advancedTuningExpanded: false,
      aiAssistantInput: '',
      isComparing: false,
      compareVersionIds: [],
    }),
}))
