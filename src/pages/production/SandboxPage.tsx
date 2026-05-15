import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Play,
  Minus,
  Plus,
  Settings,
  Loader2,
  AlertCircle,
  Trash2,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  Hexagon,
  Sun,
  Frame,
  Package,
  Palette,
  Scale,
  Info,
  Sparkles,
  Image,
  ChevronUp,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSandboxStore } from '@/store/productionStore'
import * as productionApi from '@/services/production'
import { useToastStore } from '@/store/toastStore'
import type {
  SceneTemplate,
  ModelOption,
  ResolutionOption,
  AssetTask,
  StrategySummary,
} from '@/types/production'

// ─── Static Data ─────────────────────────────────────────────

const MODEL_OPTIONS: ModelOption[] = [
  { id: 'pro-v6', name: 'Pro-v6', label: 'Pro-v6（推荐）', description: '更精细的细节，更稳定的风格还原能力', costPerImage: 10, recommended: true },
  { id: 'basic-v4', name: 'Basic-v4', label: 'Basic-v4', description: '更快的生成速度，适合批量预览', costPerImage: 4 },
  { id: 'sdxl-turbo', name: 'SDXL-Turbo', label: 'SDXL-Turbo', description: '极速生成，适合快速迭代', costPerImage: 2 },
]

const RESOLUTION_OPTIONS: ResolutionOption[] = [
  { id: '2k-ultra', label: '2K Ultra', dimensions: '2048×2048', costMultiplier: 1 },
  { id: '1080-hd', label: '1080 HD', dimensions: '1920×1080', costMultiplier: 0.5 },
  { id: '4k-ultra', label: '4K Ultra', dimensions: '4096×4096', costMultiplier: 2.5 },
  { id: '720-hd', label: '720 HD', dimensions: '1280×720', costMultiplier: 0.25 },
]

const TEMPLATES: SceneTemplate[] = [
  { id: 'amazon-hero', name: 'Amazon 平台主图模板', category: 'hero', aspectRatio: '1:1', description: '纯白背景，主体居中，符合 Amazon 主图规范', compositionRules: ['中心构图，突出主体', '纯色或渐变背景，无干扰', '符合平台主图规范'], platform: 'Amazon' },
  { id: 'industrial-poster', name: '工业风营销海报模板', category: 'poster', aspectRatio: '3:4', description: '深色工业风背景，强调产品质感与力量感', compositionRules: ['纵向构图，强调视觉冲击', '可容纳文案信息区', '适合活动 / 促销场景'], platform: '通用' },
  { id: 'lifestyle-scene', name: '场景使用图模板', category: 'lifestyle', aspectRatio: '16:9', description: '真实使用场景，展示产品在实际环境中的效果', compositionRules: ['场景化构图，增强真实感', '展示产品使用环境', '增强信任感与代入感'], platform: '通用' },
  { id: 'detail-closeup', name: '细节特写模板', category: 'detail', aspectRatio: '1:1', description: '局部放大，突出材质纹理与工艺细节', compositionRules: ['微距视角，强调细节', '浅景深效果', '突出材质与工艺'], platform: '通用' },
  { id: 'comparison-split', name: '对比图模板', category: 'comparison', aspectRatio: '16:9', description: '左右对比，突出产品优势与差异点', compositionRules: ['对称分割布局', '强调对比差异', '适合功能卖点展示'], platform: '通用' },
]

const SAMPLING_OPTIONS = ['DPM++ 2M Karras', 'Euler a', 'DPM++ SDE Karras', 'Euler', 'DDIM', 'UniPC']

const KEYWORD_PATTERNS = ['水珠效果', '背景更暗', '金属质感', '增加光影', '暖色调', '冷色调', '景深效果', '虚化背景', '高对比度', '柔和光线']

// ─── Mock Strategy Summary (will come from Prep Hub in real flow) ───

const MOCK_STRATEGY: StrategySummary = {
  overview: '基于上传的 SKU 与参考素材，AI 已提炼出核心视觉策略。工业车间环境，暖色逆光氛围，低角度构图；金属质感突出。主体替换为当前 SKU，输出多种电商场景模板。',
  attributes: [
    { key: 'environment', label: '核心环境', value: '工业车间 (Industrial Workshop)', icon: 'Hexagon' },
    { key: 'lighting', label: '光线氛围', value: '暖色逆光 (Backlit Orange)', icon: 'Sun' },
    { key: 'composition', label: '构图方式', value: '低角度近景 (Low Angle Close-up)', icon: 'Frame' },
    { key: 'props', label: '道具元素', value: '工具台 / 金属碎屑 / 油渍', icon: 'Package' },
    { key: 'colorTone', label: '色调风格', value: '暖色调 / 高对比 / 金属质感', icon: 'Palette' },
    { key: 'referenceRatio', label: '参考侧重', value: 'SKU 40% / 参考风格 60%', icon: 'Scale' },
  ],
}

// ─── Icon Map ────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Hexagon, Sun, Frame, Package, Palette, Scale,
}

// ─── Wireframe Preview Component ─────────────────────────────

function WireframePreview({ template, index }: { template: SceneTemplate; index: number }) {
  const aspectClasses: Record<string, string> = {
    '1:1': 'aspect-square',
    '3:4': 'aspect-[3/4]',
    '16:9': 'aspect-video',
    '4:3': 'aspect-[4/3]',
  }

  // Simple SVG wireframe based on template category
  const renderWireframe = () => {
    const w = 200
    const h = template.aspectRatio === '1:1' ? 200 : template.aspectRatio === '3:4' ? 267 : template.aspectRatio === '16:9' ? 112 : 150

    if (template.category === 'hero') {
      return (
        <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full">
          <rect x="0" y="0" width={w} height={h} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" rx="8" />
          <circle cx={w / 2} cy={h / 2} r="35" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeDasharray="4 2" />
          <rect x={w / 2 - 25} y={h / 2 - 25} width="50" height="50" rx="4" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
          <text x={w / 2} y={h / 2 + 55} textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="8">主体居中</text>
        </svg>
      )
    }
    if (template.category === 'poster') {
      return (
        <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full">
          <rect x="0" y="0" width={w} height={h} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" rx="8" />
          <rect x="20" y="30" width="80" height="120" rx="4" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
          <rect x="110" y="30" width="70" height="8" rx="2" fill="rgba(255,255,255,0.06)" />
          <rect x="110" y="45" width="50" height="6" rx="2" fill="rgba(255,255,255,0.04)" />
          <rect x="110" y="58" width="60" height="6" rx="2" fill="rgba(255,255,255,0.04)" />
        </svg>
      )
    }
    if (template.category === 'lifestyle') {
      return (
        <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full">
          <rect x="0" y="0" width={w} height={h} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" rx="8" />
          <rect x="20" y="15" width="160" height="82" rx="4" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <rect x="80" y="35" width="40" height="40" rx="4" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
          <circle cx="40" cy="55" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        </svg>
      )
    }
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full">
        <rect x="0" y="0" width={w} height={h} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" rx="8" />
        <rect x={w / 2 - 30} y={h / 2 - 30} width="60" height="60" rx="4" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
      </svg>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className={`relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] ${aspectClasses[template.aspectRatio] || 'aspect-square'}`}>
        {renderWireframe()}
        <div className="absolute left-2 top-2 rounded bg-black/40 px-1.5 py-0.5 text-[9px] text-white/50 backdrop-blur-sm">
          {template.aspectRatio}
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium text-white/60">
            {String(index + 1).padStart(2, '0')} {template.name}
          </span>
          {template.platform && (
            <span className="rounded bg-white/[0.04] px-1 py-0.5 text-[8px] text-white/30">
              {template.platform}
            </span>
          )}
        </div>
        <ul className="space-y-0.5">
          {template.compositionRules.map((rule, i) => (
            <li key={i} className="text-[9px] text-white/25">• {rule}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ─── Keyword Recognition ─────────────────────────────────────

function recognizeKeywords(text: string): string[] {
  const found: string[] = []
  KEYWORD_PATTERNS.forEach((kw) => {
    if (text.includes(kw)) found.push(kw)
  })
  return found
}

// ─── Section Card Wrapper ────────────────────────────────────

function SectionCard({
  title,
  subtitle,
  children,
  className = '',
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 ${className}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[11px] text-white/30">{subtitle}</p>}
        </div>
      </div>
      {children}
    </motion.section>
  )
}

// ─── Main Component ──────────────────────────────────────────

export default function SandboxPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const toast = useToastStore()

  const store = useSandboxStore()
  const {
    productId,
    assetTasks,
    imageCount,
    selectedModel,
    selectedResolution,
    advancedParams,
    advancedExpanded,
    diyPrompt,
    recognizedKeywords,
    strategySummary,
    setProductId,
    setAssetTasks,
    addAssetTask,
    removeAssetTask,
    updateAssetTask,
    setImageCount,
    setSelectedModel,
    setSelectedResolution,
    setAdvancedParams,
    setAdvancedExpanded,
    setDiyPrompt,
    setRecognizedKeywords,
    setStrategySummary,
    setIsRunning,
    reset,
  } = store

  const [executing, setExecuting] = useState(false)

  // Sync URL param → store
  useEffect(() => {
    if (id && id !== productId) {
      reset()
      setProductId(id)
    }
    return () => {}
  }, [id, productId, setProductId, reset])

  // Load mock strategy summary (in real flow, this comes from Prep Hub)
  useEffect(() => {
    if (productId && !strategySummary) {
      setStrategySummary(MOCK_STRATEGY)
    }
  }, [productId, strategySummary, setStrategySummary])

  // Recognize keywords when DIY prompt changes
  useEffect(() => {
    const keywords = recognizeKeywords(diyPrompt)
    if (JSON.stringify(keywords) !== JSON.stringify(recognizedKeywords)) {
      setRecognizedKeywords(keywords)
    }
  }, [diyPrompt, recognizedKeywords, setRecognizedKeywords])

  // Credit calculation
  const creditBreakdown = useMemo(() => {
    const model = MODEL_OPTIONS.find((m) => m.id === selectedModel)
    const resolution = RESOLUTION_OPTIONS.find((r) => r.id === selectedResolution)
    const modelCost = (model?.costPerImage ?? 10)
    const resCost = (resolution?.costMultiplier ?? 1)
    const imageCount_ = Math.min(imageCount, assetTasks.length || 1)
    return {
      modelCostPerImage: modelCost,
      resolutionCostPerImage: resCost,
      imageCount: imageCount_,
      total: Math.round(modelCost * resCost * imageCount_),
    }
  }, [selectedModel, selectedResolution, imageCount, assetTasks.length])

  // Template lookup helper
  const getTemplate = useCallback(
    (templateId: string) => TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0],
    [],
  )

  // Handlers
  const handleDiyChange = (value: string) => {
    setDiyPrompt(value)
  }

  const adjustImageCount = (delta: number) => {
    setImageCount(imageCount + delta)
  }

  const addNewAsset = () => {
    const idx = assetTasks.length + 1
    const newAsset: AssetTask = {
      id: `asset-${Date.now()}`,
      name: `Asset ${String(idx).padStart(2, '0')}（新任务）`,
      sceneTag: '主图',
      templateId: TEMPLATES[0].id,
    }
    addAssetTask(newAsset)
  }

  const executeProduction = async () => {
    if (!productId) return
    setExecuting(true)
    setIsRunning(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast.showToast('生产任务已加入队列', 'success')
      // Navigate to workshop after brief delay
      setTimeout(() => {
        navigate(`/products/${productId}/production/workshop`)
      }, 800)
    } catch (e) {
      toast.showToast(e instanceof Error ? e.message : '执行失败', 'error')
      setIsRunning(false)
    } finally {
      setExecuting(false)
    }
  }

  const goBack = () => {
    if (productId) navigate(`/products/${productId}/production/prep`)
  }

  const currentModel = MODEL_OPTIONS.find((m) => m.id === selectedModel)
  const currentResolution = RESOLUTION_OPTIONS.find((r) => r.id === selectedResolution)

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">
              {t('production.sandbox.title')}
            </h1>
            <p className="mt-1 text-sm text-white/50">
              {t('production.sandbox.subtitle')}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ─── 3-Column Layout ───────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* ─── Left Column (3 cols) ────────────────────────── */}
        <div className="space-y-5 lg:col-span-3">
          {/* 1. Strategy Summary */}
          <SectionCard title="策略摘要（Strategy Summary）" subtitle="只读">
            {strategySummary ? (
              <div className="space-y-4">
                {/* Overview */}
                <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-3">
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-amber-400/60" />
                    <span className="text-[10px] font-medium text-white/40">意图概览</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-white/50">
                    {strategySummary.overview}
                  </p>
                  <button
                    type="button"
                    className="mt-2 text-[10px] text-cyan-400/60 hover:text-cyan-400"
                  >
                    查看详情 →
                  </button>
                </div>

                {/* Attributes */}
                <div className="space-y-2">
                  {strategySummary.attributes.map((attr) => {
                    const IconComp = ICON_MAP[attr.icon]
                    return (
                      <div
                        key={attr.key}
                        className="flex items-center gap-2.5 rounded-lg border border-white/[0.03] bg-white/[0.01] px-3 py-2"
                      >
                        {IconComp && (
                          <IconComp className="h-3.5 w-3.5 shrink-0 text-white/25" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] text-white/25">{attr.label}</p>
                          <p className="truncate text-[11px] text-white/60">{attr.value}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="flex min-h-[160px] flex-col items-center justify-center text-center">
                <AlertCircle className="mb-2 h-6 w-6 text-white/15" />
                <p className="text-[11px] text-white/30">暂无策略摘要</p>
                <p className="mt-0.5 text-[10px] text-white/20">请先完成 Prep Hub 的解析与决策</p>
              </div>
            )}
          </SectionCard>

          {/* 2. DIY Extra Requirements */}
          <SectionCard title="DIY 额外要求（DIY Prompt）">
            <div className="space-y-3">
              <p className="text-[10px] leading-relaxed text-white/25">
                可输入对本次生成的额外要求，例如：增加水珠效果、背景更暗、突出产品重量感等...
              </p>
              <textarea
                value={diyPrompt}
                onChange={(e) => handleDiyChange(e.target.value)}
                rows={4}
                placeholder="输入额外要求..."
                className="w-full resize-none rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-[11px] text-white placeholder:text-white/15 outline-none transition focus:border-cyan-400/30"
              />
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-white/20">
                  {diyPrompt.length}/500
                </span>
                {recognizedKeywords.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { setDiyPrompt(''); setRecognizedKeywords([]) }}
                    className="text-[9px] text-white/20 hover:text-white/40"
                  >
                    清空
                  </button>
                )}
              </div>

              {/* Recognized Keywords */}
              {recognizedKeywords.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-1.5"
                >
                  <span className="text-[9px] text-white/30">已识别关键词：</span>
                  <div className="flex flex-wrap gap-1.5">
                    {recognizedKeywords.map((kw) => (
                      <span
                        key={kw}
                        className="rounded-md bg-cyan-400/8 px-2 py-0.5 text-[10px] text-cyan-400/70"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </SectionCard>
        </div>

        {/* ─── Center Column (6 cols) ──────────────────────── */}
        <div className="space-y-5 lg:col-span-6">
          {/* 3. Task Allocation */}
          <SectionCard title="任务配额管理（Task Allocation）">
            <div className="space-y-4">
              {/* Image Count */}
              <div className="flex items-center gap-4">
                <span className="text-[11px] text-white/50">生成图片数量</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => adjustImageCount(-1)}
                    disabled={imageCount <= 1}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/40 transition hover:border-white/15 hover:text-white disabled:opacity-30"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="min-w-[20px] text-center text-sm font-semibold text-white">
                    {imageCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => adjustImageCount(1)}
                    disabled={imageCount >= 10}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/40 transition hover:border-white/15 hover:text-white disabled:opacity-30"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <span className="text-[9px] text-white/20">最多支持 10 张</span>
              </div>

              {/* Asset Rows */}
              <div className="space-y-2">
                {assetTasks.map((asset, idx) => (
                  <motion.div
                    key={asset.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.015] px-3 py-2.5"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
                      <Image className="h-3.5 w-3.5 text-white/30" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-white/70">{asset.name}</span>
                        <span className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[9px] text-white/30">
                          {asset.sceneTag}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-white/20">模板</span>
                      <select
                        value={asset.templateId}
                        onChange={(e) =>
                          updateAssetTask(asset.id, { templateId: e.target.value })
                        }
                        className="min-w-[160px] rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1.5 text-[10px] text-white/60 outline-none focus:border-cyan-400/30"
                      >
                        {TEMPLATES.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAssetTask(asset.id)}
                      className="shrink-0 text-white/15 hover:text-red-400/80"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                ))}
              </div>

              {/* Add Asset */}
              {assetTasks.length < 10 && (
                <button
                  type="button"
                  onClick={addNewAsset}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/[0.06] bg-white/[0.01] py-2.5 text-[11px] text-white/30 transition hover:border-white/10 hover:text-white/50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  添加新任务
                </button>
              )}
            </div>
          </SectionCard>

          {/* 4. Template Preview */}
          <SectionCard title="模板预览（Template Preview）">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {assetTasks.slice(0, imageCount).map((asset, idx) => {
                const tpl = getTemplate(asset.templateId)
                return <WireframePreview key={asset.id} template={tpl} index={idx} />
              })}
            </div>
            <p className="mt-3 flex items-center gap-1 text-[9px] text-white/15">
              <Info className="h-3 w-3" />
              预览为构图示意，非最终效果。生成结果将根据您的策略与模型输出。
            </p>
          </SectionCard>
        </div>

        {/* ─── Right Column (3 cols) ───────────────────────── */}
        <div className="space-y-5 lg:col-span-3">
          {/* 5. Execution Settings */}
          <SectionCard title="场景执行设置（Execution Settings）">
            <div className="space-y-4">
              {/* Model Selection */}
              <div>
                <label className="mb-1.5 block text-[11px] text-white/40">模型选择</label>
                <div className="relative">
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-[11px] text-white outline-none transition focus:border-cyan-400/30"
                  >
                    {MODEL_OPTIONS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/20" />
                </div>
                {currentModel && (
                  <p className="mt-1 text-[9px] text-white/25">{currentModel.description}</p>
                )}
              </div>

              {/* Resolution Selection */}
              <div>
                <label className="mb-1.5 block text-[11px] text-white/40">分辨率 / 清晰度</label>
                <div className="relative">
                  <select
                    value={selectedResolution}
                    onChange={(e) => setSelectedResolution(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-[11px] text-white outline-none transition focus:border-cyan-400/30"
                  >
                    {RESOLUTION_OPTIONS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label} ({r.dimensions})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/20" />
                </div>
              </div>

              {/* Advanced Settings (Collapsible) */}
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.01]">
                <button
                  type="button"
                  onClick={() => setAdvancedExpanded(!advancedExpanded)}
                  className="flex w-full items-center justify-between px-3 py-2.5"
                >
                  <span className="text-[11px] text-white/40">高级设置（Advanced）</span>
                  {advancedExpanded ? (
                    <ChevronUp className="h-3.5 w-3.5 text-white/20" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-white/20" />
                  )}
                </button>

                <AnimatePresence>
                  {advancedExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3 border-t border-white/[0.03] px-3 py-3">
                        {/* Seed */}
                        <div>
                          <label className="mb-1 block text-[10px] text-white/30">Seed</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={advancedParams.seed}
                              onChange={(e) =>
                                setAdvancedParams({ seed: Number(e.target.value) })
                              }
                              className="flex-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-cyan-400/30"
                            />
                            <button
                              type="button"
                              onClick={() => setAdvancedParams({ seed: Math.floor(Math.random() * 999999999) })}
                              className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-1.5 text-white/30 hover:text-white/50"
                              title="Random seed"
                            >
                              <Settings className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        {/* Negative Prompt */}
                        <div>
                          <label className="mb-1 block text-[10px] text-white/30">Negative Prompt</label>
                          <input
                            type="text"
                            value={advancedParams.negativePrompt}
                            onChange={(e) =>
                              setAdvancedParams({ negativePrompt: e.target.value })
                            }
                            placeholder="可选，输入不希望出现的内容..."
                            className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-[11px] text-white placeholder:text-white/15 outline-none focus:border-cyan-400/30"
                          />
                        </div>

                        {/* Sampling */}
                        <div>
                          <label className="mb-1 block text-[10px] text-white/30">Sampling</label>
                          <div className="relative">
                            <select
                              value={advancedParams.sampling}
                              onChange={(e) =>
                                setAdvancedParams({ sampling: e.target.value })
                              }
                              className="w-full appearance-none rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-[11px] text-white outline-none"
                            >
                              {SAMPLING_OPTIONS.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-white/20" />
                          </div>
                        </div>

                        {/* CFG Scale */}
                        <div>
                          <div className="mb-1 flex items-center justify-between">
                            <label className="text-[10px] text-white/30">CFG Scale</label>
                            <span className="text-[10px] tabular-nums text-white/40">{advancedParams.cfgScale}</span>
                          </div>
                          <input
                            type="range"
                            min={1}
                            max={15}
                            step={0.5}
                            value={advancedParams.cfgScale}
                            onChange={(e) =>
                              setAdvancedParams({ cfgScale: Number(e.target.value) })
                            }
                            className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/[0.06] accent-cyan-400"
                          />
                        </div>

                        {/* Steps */}
                        <div>
                          <div className="mb-1 flex items-center justify-between">
                            <label className="text-[10px] text-white/30">Steps</label>
                            <span className="text-[10px] tabular-nums text-white/40">{advancedParams.steps}</span>
                          </div>
                          <input
                            type="range"
                            min={10}
                            max={50}
                            step={1}
                            value={advancedParams.steps}
                            onChange={(e) =>
                              setAdvancedParams({ steps: Number(e.target.value) })
                            }
                            className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/[0.06] accent-cyan-400"
                          />
                        </div>

                        {/* High Res Fix Toggle */}
                        <label className="flex items-center justify-between rounded-lg border border-white/[0.03] bg-white/[0.01] px-2.5 py-2">
                          <span className="text-[10px] text-white/30">高倍修复</span>
                          <button
                            type="button"
                            onClick={() => setAdvancedParams({ highResFix: !advancedParams.highResFix })}
                            className={`relative h-4 w-7 rounded-full transition-colors ${
                              advancedParams.highResFix ? 'bg-cyan-400/40' : 'bg-white/[0.08]'
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform ${
                                advancedParams.highResFix ? 'left-[14px]' : 'left-0.5'
                              }`}
                            />
                          </button>
                        </label>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </SectionCard>

          {/* 6. Credits Estimation */}
          <SectionCard title="消耗预估（Credits Estimation）">
            <div className="space-y-3">
              <div className="space-y-2 rounded-xl border border-white/[0.03] bg-white/[0.01] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/30">
                    模型消耗（{currentModel?.name ?? 'Pro-v6'}）
                  </span>
                  <span className="text-[10px] tabular-nums text-white/50">
                    {creditBreakdown.modelCostPerImage} Credits / 张
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/30">
                    分辨率（{currentResolution?.label ?? '2K Ultra'}）
                  </span>
                  <span className="text-[10px] tabular-nums text-white/50">
                    {creditBreakdown.resolutionCostPerImage > 1
                      ? `×${creditBreakdown.resolutionCostPerImage}`
                      : creditBreakdown.resolutionCostPerImage < 1
                        ? `×${creditBreakdown.resolutionCostPerImage}`
                        : '0 Credits / 张'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/30">图片数量</span>
                  <span className="text-[10px] tabular-nums text-white/50">
                    {creditBreakdown.imageCount} 张
                  </span>
                </div>
                <div className="border-t border-white/[0.03] pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-white/60">预估总消耗</span>
                    <span className="text-lg font-bold tabular-nums text-cyan-400">
                      {creditBreakdown.total} Credits
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* ─── Bottom Action Bar ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 flex items-center justify-between gap-4"
      >
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-3 text-xs text-white/50 transition hover:border-white/10 hover:text-white/70"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          返回上一步（调整策略）
        </button>

        <button
          type="button"
          onClick={() => void executeProduction()}
          disabled={executing || assetTasks.length === 0}
          className="group inline-flex flex-1 max-w-xl items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/10 transition hover:shadow-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {executing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          <span>
            {executing ? '正在加入队列...' : '开始策略化生产（INITIATE STRATEGIC GENERATION）'}
          </span>
        </button>
      </motion.div>

      {/* Summary Info Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-3 flex items-center justify-center gap-3 text-[10px] text-white/20"
      >
        <span>{creditBreakdown.imageCount} 张图片</span>
        <span>·</span>
        <span>{currentModel?.name ?? 'Pro-v6'} 模型</span>
        <span>·</span>
        <span>{currentResolution?.label ?? '2K Ultra'}</span>
        <span>·</span>
        <span>预计消耗 {creditBreakdown.total} Credits</span>
      </motion.div>

      <p className="mt-1 text-center text-[9px] text-white/15">
        温馨提示：生成任务将加入队列，您可在「历史记录」中查看进度与结果。
      </p>
    </div>
  )
}
