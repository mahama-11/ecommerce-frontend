// ─── V2 Production Demo Mock Data ────────────────────────────
// Used when ?dev=1 is in the URL (dev bypass mode).
// Returns realistic mock data so the full Prep → Sandbox → Workshop flow
// can be tested end-to-end without a real backend.

import type {
  ParsingSource,
  DualTrackParsing,
  LlmDecisionTreeResult,
  ParsedAttribute,
  CompiledIntent,
  ExecutionConfig,
  TaskQuota,
  AssetVariant,
  InpaintTask,
  RefinementSession,
  RefinementMessage,
} from '@/types/production'

// ─── Helpers ────────────────────────────────────────────────

export const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))
export const uid = () => Math.random().toString(36).slice(2, 10)

// Placeholder images via picsum.photos
const IMG = (seed: number, w = 800, h = 800) =>
  `https://picsum.photos/seed/agent${seed}/${w}/${h}.jpg`
const THUMB = (seed: number) => IMG(seed, 200, 200)

// ─── Prep Hub Mocks ─────────────────────────────────────────

export const MOCK_SOURCES: ParsingSource[] = [
  { id: 'src-1', type: 'sku_image', url: IMG(101), thumbnailUrl: THUMB(101), name: 'white-tshirt-front.jpg', uploadedAt: new Date().toISOString() },
  { id: 'src-2', type: 'sku_image', url: IMG(102), thumbnailUrl: THUMB(102), name: 'white-tshirt-side.jpg', uploadedAt: new Date().toISOString() },
  { id: 'src-3', type: 'reference_image', url: IMG(103), thumbnailUrl: THUMB(103), name: 'studio-bg-ref.jpg', uploadedAt: new Date().toISOString() },
]

export const MOCK_PARSED_ATTRIBUTES: ParsedAttribute[] = [
  { key: 'product_type', label: 'Product Type', value: 'T-Shirt', confidence: 0.95, editable: true, source: 'comfyui', driftFromOriginal: 0.02, driftBias: 50 },
  { key: 'color', label: 'Color', value: 'White', confidence: 0.92, editable: true, source: 'comfyui', driftFromOriginal: 0, driftBias: 50 },
  { key: 'material', label: 'Material', value: 'Cotton', confidence: 0.78, editable: true, source: 'third_party', driftFromOriginal: 0.05, driftBias: 50 },
  { key: 'style', label: 'Style', value: 'Casual', confidence: 0.88, editable: true, source: 'comfyui', driftFromOriginal: 0.03, driftBias: 50 },
  { key: 'target_audience', label: 'Target Audience', value: ['Men', 'Women'], confidence: 0.85, editable: true, source: 'comfyui', driftFromOriginal: 0.08, driftBias: 50 },
  { key: 'season', label: 'Season', value: 'Summer', confidence: 0.72, editable: true, source: 'third_party', driftFromOriginal: 0.15, driftBias: 50 },
  { key: 'brand_tone', label: 'Brand Tone', value: 'Minimalist', confidence: 0.91, editable: true, source: 'comfyui', driftFromOriginal: 0, driftBias: 50 },
  { key: 'price_range', label: 'Price Range', value: 'Mid-range ($15-$35)', confidence: 0.68, editable: true, source: 'third_party', driftFromOriginal: 0.2, driftBias: 50 },
]

export function mockDualTrackParsing(): DualTrackParsing {
  return {
    status: 'succeeded',
    primaryTrack: 'comfyui',
    comfyuiResult: {
      track: 'comfyui',
      status: 'succeeded',
      attributes: MOCK_PARSED_ATTRIBUTES.filter((a) => a.source === 'comfyui'),
      parsedAt: new Date().toISOString(),
    },
    thirdPartyResult: {
      track: 'third_party',
      status: 'succeeded',
      attributes: MOCK_PARSED_ATTRIBUTES.filter((a) => a.source === 'third_party'),
      parsedAt: new Date().toISOString(),
    },
    mergedAttributes: MOCK_PARSED_ATTRIBUTES,
    conflicts: [
      { key: 'material', comfyuiValue: 'Cotton Blend', thirdPartyValue: '100% Cotton', resolvedValue: 'Cotton' },
    ],
  }
}

export function mockDecisionTree(): LlmDecisionTreeResult {
  return {
    status: 'succeeded',
    root: {
      id: 'q1',
      question: 'Is this a clothing product requiring model shots?',
      answer: 'Yes — T-Shirt identified',
      confidence: 0.95,
      children: [
        {
          id: 'q2',
          question: 'Should we generate lifestyle scene compositions?',
          answer: 'Yes — summer casual tone detected',
          confidence: 0.88,
          children: [
            {
              id: 'q2a',
              question: 'Recommended: background_replace with outdoor scenes',
              confidence: 0.92,
            },
            {
              id: 'q2b',
              question: 'Optional: scene_generation for brand-specific backgrounds',
              confidence: 0.76,
            },
          ],
        },
        {
          id: 'q3',
          question: 'Batch variant generation recommended?',
          answer: 'Yes — multiple SKUs detected',
          confidence: 0.82,
          children: [
            {
              id: 'q3a',
              question: 'Recommended: batch_variant for A+ content',
              confidence: 0.85,
            },
          ],
        },
      ],
    },
    steps: [
      {
        id: 'step-1',
        stepNumber: 1,
        title: '核心环境',
        description: '系统已识别并推荐最匹配的场景类型',
        options: [
          { id: 'env-1', label: '工业车间', description: 'Industrial Workshop', confidence: 0.92 },
          { id: 'env-2', label: '高科技工厂', description: 'High-Tech Factory', confidence: 0.78 },
          { id: 'env-3', label: '空旷仓库', description: 'Empty Warehouse', confidence: 0.65 },
          { id: 'env-4', label: '工具台区', description: 'Tooling Bench', confidence: 0.58 },
        ],
        selectedOptionId: 'env-1',
        status: 'completed',
      },
      {
        id: 'step-2',
        stepNumber: 2,
        title: '光线氛围',
        description: '基于参考图与 SKU 材质推荐',
        options: [
          { id: 'light-1', label: '冷色硬光', description: 'Cool Hard Light', confidence: 0.70 },
          { id: 'light-2', label: '暖色逆光', description: 'Warm Backlit', confidence: 0.88 },
          { id: 'light-3', label: '侧逆光', description: 'Rim Light', confidence: 0.75 },
          { id: 'light-4', label: '柔光均匀', description: 'Soft Even', confidence: 0.82 },
          { id: 'light-5', label: '戏剧光影', description: 'Dramatic', confidence: 0.60 },
        ],
        selectedOptionId: 'light-2',
        status: 'completed',
      },
      {
        id: 'step-3',
        stepNumber: 3,
        title: '构图方式',
        description: '结合平台主图规范与参考构图',
        options: [
          { id: 'comp-1', label: '中心特写', description: 'Center Close-up', confidence: 0.90 },
          { id: 'comp-2', label: '三分法构图', description: 'Rule of Thirds', confidence: 0.72 },
          { id: 'comp-3', label: '低角度仰拍', description: 'Low Angle', confidence: 0.68 },
          { id: 'comp-4', label: '俯拍平视', description: 'Top-down Flat', confidence: 0.55 },
          { id: 'comp-5', label: '对角线构图', description: 'Diagonal', confidence: 0.62 },
        ],
        selectedOptionId: 'comp-1',
        status: 'active',
      },
      {
        id: 'step-4',
        stepNumber: 4,
        title: '道具元素',
        description: '正在分析 SKU 与参考图，确认后生成选项...',
        options: [],
        status: 'pending',
      },
    ],
    recommendedActions: [
      'Generate model-on-white background shots (2 variants)',
      'Create lifestyle scene compositions (3 variants)',
      'Produce batch A+ content layouts (2 variants)',
    ],
    overallConfidence: 0.88,
    provider: 'internal',
    evaluatedAt: new Date().toISOString(),
  }
}

// ─── Sandbox Mocks ──────────────────────────────────────────

export const MOCK_INTENTS: CompiledIntent[] = [
  {
    id: 'intent-1',
    type: 'background_replace',
    description: 'Replace white background with outdoor lifestyle scene',
    prompt: 'professional model wearing white t-shirt, standing in a modern minimalist outdoor cafe setting, golden hour lighting, shallow depth of field, commercial photography style',
    negativePrompt: 'blurry, low quality, watermark, text, distorted',
    priority: 'high',
    params: { scene_style: 'lifestyle', lighting: 'golden_hour' },
    estimatedCost: 0.05,
    status: 'compiled',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'intent-2',
    type: 'scene_generation',
    description: 'Generate brand-specific studio background',
    prompt: 'clean minimalist product photography studio, soft gradient background from light gray to white, professional lighting setup, e-commerce style',
    negativePrompt: 'cluttered, noisy, colorful, busy',
    priority: 'medium',
    params: { style: 'studio_clean', bg_color: '#f5f5f5' },
    estimatedCost: 0.03,
    status: 'compiled',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'intent-3',
    type: 'batch_variant',
    description: 'Generate multiple angle variants for A+ content',
    prompt: 'white t-shirt product photo, multiple angles — front view, side view, back view, flat lay, and folded — consistent lighting and background across all views',
    negativePrompt: 'inconsistent lighting, different backgrounds, low quality',
    priority: 'high',
    params: { angles: ['front', 'side', 'back', 'flat_lay', 'folded'], count: 5 },
    estimatedCost: 0.12,
    dependsOn: ['intent-1'],
    status: 'compiled',
    createdAt: new Date().toISOString(),
  },
]

export const MOCK_EXECUTION_CONFIG: ExecutionConfig = {
  provider: 'comfyui_bridge',
  maxConcurrency: 3,
  retryOnFailure: false,
  maxRetries: 0,
  timeoutSeconds: 300,
}

export const MOCK_QUOTA: TaskQuota = {
  totalSlots: 10,
  usedSlots: 0,
  reservedSlots: 3,
  estimatedTimeRemaining: 45,
}

// ─── Workshop Mocks ─────────────────────────────────────────

export const MOCK_VARIANTS: AssetVariant[] = [
  { id: 'var-1', intentId: 'intent-1', assetUrl: IMG(201), thumbnailUrl: THUMB(201), width: 1200, height: 1200, status: 'ready', score: 92, metadata: { angle: 'front', scene: 'cafe' }, createdAt: new Date().toISOString() },
  { id: 'var-2', intentId: 'intent-1', assetUrl: IMG(202), thumbnailUrl: THUMB(202), width: 1200, height: 1200, status: 'ready', score: 88, metadata: { angle: 'front', scene: 'park' }, createdAt: new Date().toISOString() },
  { id: 'var-3', intentId: 'intent-1', assetUrl: IMG(203), thumbnailUrl: THUMB(203), width: 1200, height: 1200, status: 'ready', score: 85, metadata: { angle: 'side', scene: 'cafe' }, createdAt: new Date().toISOString() },
  { id: 'var-4', intentId: 'intent-2', assetUrl: IMG(204), thumbnailUrl: THUMB(204), width: 1200, height: 1200, status: 'ready', score: 90, metadata: { style: 'studio_clean' }, createdAt: new Date().toISOString() },
  { id: 'var-5', intentId: 'intent-3', assetUrl: IMG(205), thumbnailUrl: THUMB(205), width: 1200, height: 1200, status: 'ready', score: 87, metadata: { angle: 'flat_lay' }, createdAt: new Date().toISOString() },
  { id: 'var-6', intentId: 'intent-3', assetUrl: IMG(206), thumbnailUrl: THUMB(206), width: 1200, height: 1200, status: 'ready', score: 83, metadata: { angle: 'folded' }, createdAt: new Date().toISOString() },
]

export function mockInpaintTask(variantId: string, regions: Array<{ x: number; y: number; width: number; height: number }>, prompt: string): InpaintTask {
  return {
    id: `inpaint-${uid()}`,
    variantId,
    regions: regions.map((r, i) => ({ id: `reg-${i}`, ...r })),
    prompt,
    status: 'succeeded',
    resultAssetId: `asset-${uid()}`,
    createdAt: new Date().toISOString(),
  }
}

export const MOCK_REFINEMENT_MESSAGES: RefinementMessage[] = [
  { id: 'msg-1', role: 'assistant', content: 'I can see this variant has good composition but the lighting could be warmer. Would you like me to adjust the color temperature?', createdAt: new Date().toISOString() },
  { id: 'msg-2', role: 'user', content: 'Yes, make it warmer and add a subtle golden tone.', createdAt: new Date().toISOString() },
  { id: 'msg-3', role: 'assistant', content: 'Done! I\'ve adjusted the color temperature to ~4200K with a subtle golden gradient. The product now has a more inviting, premium feel. Would you like any further adjustments?', createdAt: new Date().toISOString() },
]

export function mockRefinementSession(variantId: string): RefinementSession {
  return {
    id: `session-${uid()}`,
    variantId,
    messages: MOCK_REFINEMENT_MESSAGES,
    isTyping: false,
    createdAt: new Date().toISOString(),
  }
}

export function mockRefinementReply(content: string): RefinementMessage {
  const replies = [
    `Understood! Applying: "${content}". This should enhance the visual quality. Let me process that for you.`,
    'Adjustment applied. The variant now reflects your requested changes. Anything else you\'d like to refine?',
    `Processing your request: ${content}. I'll optimize the output while maintaining brand consistency.`,
  ]
  return {
    id: `msg-${uid()}`,
    role: 'assistant',
    content: replies[Math.floor(Math.random() * replies.length)],
    createdAt: new Date().toISOString(),
  }
}

// ─── Dev check ──────────────────────────────────────────────

export function isDevMode(): boolean {
  return !!(import.meta.env.DEV && window.location.search.includes('dev=1'))
}
