import { useCallback, useEffect, useMemo, useState } from 'react'; import { useParams, useNavigate } from 'react-router-dom'; import { useTranslation } from 'react-i18next'; import { Play, Minus, Plus, Settings, Loader2, AlertCircle, Trash2, ChevronDown, ChevronLeft, Hexagon, Sun, Frame, Package, Palette, Scale, Info, Sparkles, Image, ChevronUp, } from 'lucide-react'; import { motion, AnimatePresence } from 'framer-motion'; import { useSandboxStore } from '@/store/productionStore'; import * as productionApi from '@/services/production'; import { useToastStore } from '@/store/toastStore'; import { isDevMode } from '@/mocks/productionDemo'; import type { SceneTemplate, ModelOption, ResolutionOption, AssetTask, StrategySummary, ParsingSource, ProductionFanoutTask, ImageGenerationProviderCode, } from '@/types/production'; import type { PromptPlanSummary } from '@/services/production'
import { Button } from '@/components/ui/Button'; import { EditablePromptCard, ProductionSectionCard } from '@/components/production/ProductionWorkflowComponents'; const MODEL_OPTIONS: ModelOption[] = [ { id: 'comfyui-bridge', name: '稳定生产模式', label: '默认稳定模式', description: '适合正式生产，出图质量和稳定性优先', costPerImage: 10, recommended: true, providerCode: 'comfyui_bridge' }, { id: 'minimax-image-01', name: 'MiniMax 图生图', label: 'MiniMax 图生图', description: '适合用当前商品/参考图做图生图，保持主体并生成电商成片', costPerImage: 10, providerCode: 'minimax_image_generation', modelId: 'image-01' }, { id: 'gemini-pro-image', name: '高质量创意模式', label: '高质量创意模式', description: '适合需要更强图片理解和编辑能力的场景', costPerImage: 10, providerCode: 'gemini_image_generation', modelId: 'gemini-3-pro-image-preview' }, { id: 'gemini-flash-image', name: '快速预览模式', label: '快速预览模式', description: '适合快速预览和批量草稿', costPerImage: 8, providerCode: 'gemini_image_generation', modelId: 'gemini-3.1-flash-image-preview-token' }, ]
const RESOLUTION_OPTIONS: ResolutionOption[] = [ { id: '1024-square', label: '标准方图', dimensions: '1024×1024', costMultiplier: 1 }, { id: '720-wide', label: '横版预览', dimensions: '1280×720', costMultiplier: 0.75 }, ]; const TEMPLATES: SceneTemplate[] = [ { id: 'amazon-hero', name: 'Amazon 平台主图模板', category: 'hero', aspectRatio: '1:1', description: '纯白背景，主体居中，符合 Amazon 主图规范', compositionRules: ['中心构图，突出主体', '纯色或渐变背景，无干扰', '符合平台主图规范'], platform: 'Amazon' }, { id: 'industrial-poster', name: '工业风营销海报模板', category: 'poster', aspectRatio: '3:4', description: '深色工业风背景，强调产品质感与力量感', compositionRules: ['纵向构图，强调视觉冲击', '可容纳文案信息区', '适合活动 / 促销场景'], platform: '通用' }, { id: 'lifestyle-scene', name: '场景使用图模板', category: 'lifestyle', aspectRatio: '16:9', description: '真实使用场景，展示产品在实际环境中的效果', compositionRules: ['场景化构图，增强真实感', '展示产品使用环境', '增强信任感与代入感'], platform: '通用' }, { id: 'detail-closeup', name: '细节特写模板', category: 'detail', aspectRatio: '1:1', description: '局部放大，突出材质纹理与工艺细节', compositionRules: ['微距视角，强调细节', '浅景深效果', '突出材质与工艺'], platform: '通用' }, { id: 'comparison-split', name: '对比图模板', category: 'comparison', aspectRatio: '16:9', description: '左右对比，突出产品优势与差异点', compositionRules: ['对称分割布局', '强调对比差异', '适合功能卖点展示'], platform: '通用' }, ]
const SAMPLING_OPTIONS = ['DPM++ 2M Karras', 'Euler a', 'DPM++ SDE Karras', 'Euler', 'DDIM', 'UniPC']
const SCENE_TAG_OPTIONS = ['主图', '海报', '使用图', '细节图', '对比图']
function defaultDetailRequirement(sceneTag: string): string { if (sceneTag.includes('主图') || sceneTag === 'hero') return '主体完整、边缘清晰、背景干净，符合电商主图规范'; if (sceneTag.includes('海报') || sceneTag === 'poster') return '突出卖点与质感，允许氛围光、层次背景和营销构图'; if (sceneTag.includes('使用') || sceneTag === 'lifestyle') return '展示真实使用场景，产品主体必须清晰可识别'; if (sceneTag.includes('细节') || sceneTag === 'detail') return '突出材质、纹理、接口或关键工艺，避免主体变形'; if (sceneTag.includes('对比') || sceneTag === 'comparison') return '左右/前后对比清晰，差异点明确，信息层级干净'; return '围绕当前槽位目标生成，保持 SKU 一致性和可商用画面质量' }
function templateDifferentiationRequirement(template: SceneTemplate, sceneTag?: string): string {
  const rules = template.compositionRules.length > 0 ? template.compositionRules.join('；') : '按模板构图规则执行'
  const platform = template.platform ? `平台：${template.platform}` : '平台：通用'
  return [ `模板：${template.name}`, `模板类别：${template.category} / ${sceneTag || template.category}`, `画幅：${template.aspectRatio}`, platform, `模板目标：${template.description}`, `构图规则：${rules}`, ].join('；') }
function templateHardDifferentiator(template: SceneTemplate, slotIndex: number): string {
  if (template.id === 'amazon-hero') {
    return '强制差异化执行：只做平台主图；纯白/浅灰干净背景；正面或 3/4 居中展示；禁止生活场景、海报光效、桌面道具、文字排版；主体占画面 80%-90%。' }
  if (template.id === 'industrial-poster') {
    return '强制差异化执行：只做纵向营销海报；深色工业背景、斜向硬光、金属/科技质感、低机位或英雄视角；允许抽象背景层次；不得使用纯白主图背景或生活桌面场景。' }
  if (template.id === 'lifestyle-scene') {
    return '强制差异化执行：只做横向真实使用场景；居家/办公/桌面环境、自然光或暖光、产品处于实际使用语境；不得使用纯白主图构图或纵向海报构图。' }
  if (template.id === 'detail-closeup') {
    return '强制差异化执行：只做微距细节特写；局部材质、接口、纹理或工艺占画面主体；浅景深；不得展示完整主图或海报式全景。' }
  if (template.id === 'comparison-split') {
    return '强制差异化执行：只做左右/前后对比图；分屏、标注信息区、差异点明确；不得做单一产品主图、生活场景或海报。' }
  return `强制差异化执行：当前是第 ${slotIndex + 1} 个槽位，必须在背景、画幅、镜头距离、光线方向、商品呈现方式上与其他槽位显著不同。` }
function buildSlotDetailRequirement(template: SceneTemplate, sceneTag?: string, slotDetail?: string, slotIndex = 0): string {
  const detail = (slotDetail || defaultDetailRequirement(sceneTag || template.category)).trim()
  return `${templateDifferentiationRequirement(template, sceneTag)}；${templateHardDifferentiator(template, slotIndex)}；槽位要求：${detail}；避免同质化：不要沿用其他槽位的背景、构图、镜头距离或光线氛围。` }
function userSummaryText(value: unknown): string {
  const raw = (() => {
    if (value == null) return ''
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value)
    if (Array.isArray(value)) return value.map(userSummaryText).filter(Boolean).join('，')
    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>
      for (const key of ['description', 'summary', 'text', 'label', 'title', 'value']) {
        const text = userSummaryText(obj[key])
        if (text) return text }
      return '已配置' }
    return String(value) })()
  return raw .replace(/Product Geometry/gi, '商品形态') .replace(/Reference Composition/gi, '参考图构图') .replace(/Analysis Limitation/gi, '识别提醒') .replace(/Scene Reference/gi, '参考图场景') .replace(/Unverified Visual Claim/gi, '待确认视觉点') .replace(/Brand Constraints/gi, '品牌约束') .replace(/Image Bytes Unavailable/gi, '图片细节待确认') .replace(/Material/gi, '材质质感') .replace(/Style/gi, '视觉风格') .replace(/scene_generation/gi, '场景生成') .replace(/background_replace/gi, '背景替换') .replace(/image_enhancement/gi, '图片增强') }
function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '' }
function readObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {} }
function stripMarkdownJsonFence(value: string): string {
  return value .replace(/```json\s*/gi, '') .replace(/```/g, '') .trim() }
function isRawDeconstructionPayload(value: string): boolean {
  const text = stripMarkdownJsonFence(value)
  if (!text) return false
  if (/deconstruction_elements|source_reference_id|element_type|element_key/.test(text)) return true
  try {
    const parsed = JSON.parse(text)
    return Boolean(parsed && typeof parsed === 'object' && ('deconstruction_elements' in parsed || 'source_reference_id' in parsed)) } catch {
    return false } }
function cleanPromptText(value: unknown): string {
  const text = readString(value)
  if (!text || isRawDeconstructionPayload(text)) return ''
  return stripMarkdownJsonFence(text) }
function displayPlanText(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') {
    if (isRawDeconstructionPayload(value)) return '图片解析结果已返回，但不是可直接展示的出图文案。'
    return value.trim() }
  if (Array.isArray(value)) {
    const parts = value.map(displayPlanText).filter(Boolean)
    return parts.join('、') }
  if (typeof value === 'object') {
    const obj = readObject(value)
    for (const key of ['generation_prompt', 'final_prompt', 'positive_prompt', 'creative_brief', 'prompt', 'summary', 'description']) {
      const text = displayPlanText(obj[key])
      if (text && !text.includes('不是可直接展示')) return text }
    if ('deconstruction_elements' in obj || 'source_reference_id' in obj) return '图片解析结果已返回，但不是可直接展示的出图文案。'
    const parts = Object.entries(obj) .filter(([key]) => !/deconstruction|source_reference|element_|runtime|生成服务/i.test(key)) .slice(0, 3) .map(([key, item]) => `${key}: ${typeof item === 'object' ? '已配置' : String(item)}`)
    return parts.join('；') }
  return String(value) }
function promptPlanGenerationPrompt(plan: PromptPlanSummary | null): string {
  const variables = readObject(plan?.variables)
  for (const key of ['composed_prompt_text', 'generation_prompt', 'final_prompt', 'positive_prompt', 'creative_brief', 'prompt']) {
    const text = cleanPromptText(variables[key])
    if (text) return text }
  return '' }
function promptPlanKeywords(plan: PromptPlanSummary | null): string[] {
  const variables = readObject(plan?.variables)
  const raw = variables.style_keywords
  return Array.isArray(raw) ? raw.map((item) => readString(item)).filter(Boolean) : [] }
function promptPlanFieldSummary(plan: PromptPlanSummary | null, key: string): string {
  const variables = readObject(plan?.variables)
  const value = variables[key]
  if (!value) return '未返回'
  const text = displayPlanText(value)
  return text || '已配置' }
function promptPlanBlockerText(plan: PromptPlanSummary | null): string {
  const blocker = plan?.blockers?.find(item => item.target === 'prompt_plan' || item.target === 'prompt_planner') ?? plan?.blockers?.find(item => item.target === 'deconstruction_job' || item.target === 'source_references') ?? plan?.blockers?.[0]
  if (!blocker) {
    if (plan?.status && !['ready', 'unknown'].includes(plan.status)) return '出图方案还在整理中。请稍等片刻，或点击「生成/刷新出图方案」重新确认。'
    return '还没有生成出图方案。请先点击「生成/刷新出图方案」；如果按钮不可点，请回到生产准备页，完成图片解析和选择。' }
  const code = String(blocker.code || '').toUpperCase()
  if (code.includes('SKU_ANALYSIS_QUALITY') || (code.includes('SKU') && code.includes('QUALITY'))) return 'SKU 图片识别结果不足。请回到生产准备页，重新解析或替换更清晰的商品图；确认商品主体信息可读后，再生成出图方案。'
  if (code.includes('REFERENCE') && code.includes('QUALITY')) return '参考图识别结果不足。请回到生产准备页，重新解析或替换更清晰的参考图；确认风格、场景或构图信息可读后，再生成出图方案。'
  if (code.includes('QUALITY')) return '图片识别结果太弱或为空。请回到生产准备页重新解析图片，确认能看到可读的商品/参考信息后再生成方案。'
  if (code.includes('ATTENTION_DECISION') || code.includes('CHOICE')) return '还差四问选择。请回到生产准备页，把 4 个“要/不要”都确认后再生成方案。'
  if (code.includes('SKU_FACTS')) return 'SKU 图片还没有可用识别结果。请回到生产准备页重新解析 SKU 图。'
  if (code.includes('REFERENCE_STRATEGIES')) return '参考素材还没有可用识别结果。请回到生产准备页重新解析参考图。'
  if (code.includes('DECONSTRUCTION') || blocker.target === 'deconstruction_job') return '图片还没有解析完成。请回到生产准备页，确认图片识别结果，并完成 4 个“要/不要”选择。'
  if (code.includes('INTENT_SPEC')) return '还没有形成清晰的出图方向。请先在生产准备页确认图片属性和 4 个选择。'
  if (code.includes('DUAL_TRACK_SOURCE')) return '素材还不完整。请在生产准备页至少上传商品图和参考图，并完成解析。'
  if (code.includes('CAPABILITY') || blocker.target === 'runtime_capabilities') return '图片生成服务暂时繁忙。请稍后再试。'
  if (code.includes('CONTRACT') || blocker.target === 'prompt_plan') return '出图方案还没准备好。请先点击「生成/刷新出图方案」，等待整理完成后再开始生产。'
  return '出图方案暂时不可用。请回到生产准备页检查图片识别结果和 4 个选择。' }
function promptPlannerErrorText(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? '')
  const normalized = raw.toUpperCase()
  if (normalized.includes('SKU_ANALYSIS_QUALITY') || (normalized.includes('SKU') && normalized.includes('LOW CONFIDENCE'))) {
    return 'SKU 图片识别结果不足。请回到生产准备页，重新解析或替换更清晰的商品图；确认商品主体信息可读后，再生成出图方案。' }
  if (normalized.includes('REFERENCE') && normalized.includes('LOW CONFIDENCE')) {
    return '参考图识别结果不足。请回到生产准备页，重新解析或替换更清晰的参考图；确认风格、场景或构图信息可读后，再生成出图方案。' }
  if (normalized.includes('QUALITY') || normalized.includes('IMAGE ANALYSIS')) {
    return '图片识别结果不足。请回到生产准备页重新解析图片，确认商品图和参考图信息可读后，再生成出图方案。' }
  return raw || '生成出图方案失败，请稍后重试。' }
function productionTaskStatusLabel(task: ProductionFanoutTask): string {
  if (task.status === 'succeeded') return '已完成'
  if (task.status === 'failed') return '失败'
  if (task.status === 'executing') return '生成中'
  if (task.status === 'queued') return '排队中'
  return '等待中' }
function productionTaskTitle(task: ProductionFanoutTask, index: number): string {
  return task.sceneTag || task.templateName || `第 ${index + 1} 张` }
function productionProgressNotice(batch: { completedTasks: number; failedTasks: number; totalTasks: number; tasks: ProductionFanoutTask[] }): string {
  const running = batch.tasks.filter(task => task.status === 'executing' || task.status === 'queued').length
  if (batch.completedTasks + batch.failedTasks >= batch.totalTasks) {
    const firstError = batch.tasks.find(task => task.status === 'failed')?.error
    return `本轮生成结束：${batch.completedTasks}/${batch.totalTasks} 张已完成${batch.failedTasks > 0 ? `，${batch.failedTasks} 张失败${firstError ? `：${firstError}` : ''}` : ''}。` }
  const latestDone = [...batch.tasks].reverse().find(task => task.status === 'succeeded')
  const doneText = latestDone ? `，刚完成「${productionTaskTitle(latestDone, batch.tasks.indexOf(latestDone))}」` : ''
  return `正在生成：${batch.completedTasks}/${batch.totalTasks} 张已完成，${running} 张进行中${doneText}。预计需要数分钟，请保持本页打开。` }
function preloadFanoutResultImages(tasks: ProductionFanoutTask[]): Promise<void> {
  const urls = tasks.flatMap(task => task.resultAssetUrls ?? []).filter((url): url is string => Boolean(url))
  if (urls.length === 0 || typeof window === 'undefined' || typeof document === 'undefined') return Promise.resolve()
  return Promise.all(urls.map(url => new Promise<void>((resolve) => {
    const image = document.createElement('img')
    const timer = window.setTimeout(resolve, 8000)
    image.onload = () => { window.clearTimeout(timer); resolve() }
    image.onerror = () => { window.clearTimeout(timer); resolve() }
    image.src = url }))).then(() => undefined) }
function promptPlanStatusText(plan: PromptPlanSummary | null): string {
  if (!plan) return '还没有生成出图方案。请先点击「生成/刷新出图方案」。'
  if (plan.status === 'ready' && plan.promptId) return '出图方案已准备好，可以开始生产。'
  if (['blocked', 'failed', 'contract_needed'].includes(plan.status)) return promptPlanBlockerText(plan)
  if (plan.status === 'processing' || plan.status === 'pending' || plan.status === 'created') return '正在整理出图方案，请稍等片刻。'
  return promptPlanBlockerText(plan) }
const MOCK_STRATEGY: StrategySummary = { overview: '基于上传的 SKU 与参考素材，AI 已提炼出核心视觉策略。工业车间环境，暖色逆光氛围，低角度构图；金属质感突出。主体替换为当前 SKU，输出多种电商场景模板。', attributes: [ { key: 'environment', label: '核心环境', value: '工业车间 (Industrial Workshop)', icon: 'Hexagon' }, { key: 'lighting', label: '光线氛围', value: '暖色逆光 (Backlit Orange)', icon: 'Sun' }, { key: 'composition', label: '构图方式', value: '低角度近景 (Low Angle Close-up)', icon: 'Frame' }, { key: 'props', label: '道具元素', value: '工具台 / 金属碎屑 / 油渍', icon: 'Package' }, { key: 'colorTone', label: '色调风格', value: '暖色调 / 高对比 / 金属质感', icon: 'Palette' }, { key: 'referenceRatio', label: '参考侧重', value: 'SKU 40% / 参考风格 60%', icon: 'Scale' }, ], }
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = { Hexagon, Sun, Frame, Package, Palette, Scale, }
function WireframePreview({ template, index }: { template: SceneTemplate; index: number }) {
  const aspectClasses: Record<string, string> = { '1:1': 'aspect-square', '3:4': 'aspect-[3/4]', '16:9': 'aspect-video', '4:3': 'aspect-[4/3]', }
  const renderWireframe = () => {
    const w = 200
    const h = template.aspectRatio === '1:1' ? 200 : template.aspectRatio === '3:4' ? 267 : template.aspectRatio === '16:9' ? 112 : 150
    if (template.category === 'hero') {
      return ( <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full">
          <rect x="0" y="0" width={w} height={h} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" rx="8" />
          <circle cx={w / 2} cy={h / 2} r="35" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeDasharray="4 2" />
          <rect x={w / 2 - 25} y={h / 2 - 25} width="50" height="50" rx="4" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
          <text x={w / 2} y={h / 2 + 55} textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="8">主体居中</text> </svg> ) }
    if (template.category === 'poster') {
      return ( <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full">
          <rect x="0" y="0" width={w} height={h} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" rx="8" />
          <rect x="20" y="30" width="80" height="120" rx="4" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
          <rect x="110" y="30" width="70" height="8" rx="2" fill="rgba(255,255,255,0.06)" />
          <rect x="110" y="45" width="50" height="6" rx="2" fill="rgba(255,255,255,0.04)" />
          <rect x="110" y="58" width="60" height="6" rx="2" fill="rgba(255,255,255,0.04)" /> </svg> ) }
    if (template.category === 'lifestyle') {
      return ( <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full">
          <rect x="0" y="0" width={w} height={h} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" rx="8" />
          <rect x="20" y="15" width="160" height="82" rx="4" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <rect x="80" y="35" width="40" height="40" rx="4" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
          <circle cx="40" cy="55" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" /> </svg> ) }
    return ( <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full">
        <rect x="0" y="0" width={w} height={h} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" rx="8" />
        <rect x={w / 2 - 30} y={h / 2 - 30} width="60" height="60" rx="4" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" /> </svg> ) }
  return ( <div className="flex flex-col gap-2">
      <div className={`relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] ${aspectClasses[template.aspectRatio] || 'aspect-square'}`}>
        {renderWireframe()}
        <div className="absolute left-2 top-2 rounded bg-black/40 px-1.5 py-0.5 text-[9px] text-white/50 backdrop-blur-sm">
          {template.aspectRatio} </div> </div>
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium text-white/60">
            {String(index + 1).padStart(2, '0')} {template.name} </span>
          {template.platform && ( <span className="rounded bg-white/[0.04] px-1 py-0.5 text-[8px] text-white/30">
              {template.platform} </span> )} </div>
        <ul className="space-y-0.5">
          {template.compositionRules.map((rule, i) => ( <li key={i} className="text-[9px] text-white/25">• {rule}</li> ))} </ul> </div> </div> ) }
export default function SandboxPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const toast = useToastStore()
  const store = useSandboxStore()
  const { productId, assetTasks, imageCount, selectedModel, selectedResolution, advancedParams, advancedExpanded, strategySummary, diyPrompt, setProductId, addAssetTask, removeAssetTask, updateAssetTask, setImageCount, setSelectedModel, setSelectedResolution, setAdvancedParams, setAdvancedExpanded, setStrategySummary, setIntents, setIsRunning, reset, } = store
  const [executing, setExecuting] = useState(false)
  const [promptPlanning, setPromptPlanning] = useState(false)
  const [promptPlan, setPromptPlan] = useState<PromptPlanSummary | null>(null)
  const [promptPlanNotice, setPromptPlanNotice] = useState<string | null>(null)
  const [promptPlanEditorText, setPromptPlanEditorText] = useState('')
  const [promptPlanEditorDirty, setPromptPlanEditorDirty] = useState(false)
  const [executionNotice, setExecutionNotice] = useState<string | null>(null)
  const [executionProgress, setExecutionProgress] = useState<number | null>(null)
  const [executionPhase, setExecutionPhase] = useState<'idle' | 'waiting' | 'ready' | 'failed'>('idle')
  const [sourceOptions, setSourceOptions] = useState<ParsingSource[]>([])
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([])
  const [fanoutTasksState, setFanoutTasksState] = useState<ProductionFanoutTask[]>([])
  useEffect(() => {
    if (id && id !== productId) { reset()
      setProductId(id) }
    return () => {} }, [id, productId, setProductId, reset])
  useEffect(() => {
    if (!RESOLUTION_OPTIONS.some((option) => option.id === selectedResolution)) { setSelectedResolution('1024-square') } }, [selectedResolution, setSelectedResolution])
  useEffect(() => {
    if (!productId) return
    let cancelled = false
    if (isDevMode()) { setStrategySummary(MOCK_STRATEGY)
      return () => { cancelled = true } }
    productionApi.getSandboxStrategyData(productId) .then(({ intents, promptPlan: plan }) => {
        if (cancelled) return
        setIntents(intents)
        setPromptPlan(plan)
        setStrategySummary({ overview: intents.length > 0 ? intents.map((intent) => userSummaryText(intent.description)).join('；') : '还没有可用于生成的策略输入。请先回到生产准备，完成图片解析和四个“要/不要”选择。', attributes: intents.map((intent) => ({ key: intent.id, label: userSummaryText(intent.type), value: userSummaryText(intent.description), icon: 'Sparkles', })), }) }) .catch(() => {
        if (cancelled) return
        setIntents([])
        setStrategySummary({ overview: '暂时没有读取到策略输入内容。请先回到生产准备，完成图片解析和四个“要/不要”选择。', attributes: [], }) })
    return () => { cancelled = true } }, [productId, setStrategySummary, setIntents])
  useEffect(() => {
    if (!productId) return
    let cancelled = false
    productionApi.listParsingSources(productId) .then((sources) => {
        if (cancelled) return
        const usable = sources.filter((source) => source.type === 'sku_image' || source.sourceRole === 'sku')
        const fallback = usable.length > 0 ? usable : sources
        setSourceOptions(sources)
        setSelectedSourceIds((current) => {
          const next = current.filter(id => sources.some(source => source.id === id))
          return next.length > 0 ? next : fallback.map(source => source.id) }) }) .catch(() => {
        if (!cancelled) { setSourceOptions([])
          setSelectedSourceIds([]) } })
    return () => { cancelled = true } }, [productId])
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (promptPlan?.status === 'ready' && promptPlan.promptId) { setPromptPlanEditorText(promptPlanGenerationPrompt(promptPlan) || ''); setPromptPlanEditorDirty(false); return }
    setPromptPlanEditorText(''); setPromptPlanEditorDirty(false) }, [promptPlan])
  const runPromptPlanner = async () => {
    if (!productId) return
    setPromptPlanning(true)
    setPromptPlanNotice('正在整理出图方案，完成后会在这里展示新的出图要求和关键参数。')
    try {
      const job = await productionApi.requestPromptPlanner(productId, { marketplace: 'amazon', locale: 'zh-CN', promptVariables: { source: 'sandbox-prompt-diff', }, })
      toast.showToast(job.runtimeJobId ? '已开始整理本次出图方案。' : '已刷新出图方案。', 'success')
      let latest: PromptPlanSummary | null = null
      const maxPromptPlanPolls = 90
      for (let i = 0; i < maxPromptPlanPolls; i += 1) {
        await new Promise(resolve => setTimeout(resolve, i === 0 ? 1000 : 1500))
        latest = await productionApi.getPromptPlanSummary(productId)
        setPromptPlan(latest)
        if (latest.status === 'ready' && latest.promptId) { setPromptPlanNotice('出图方案已更新。请查看下方“本次出图要求”和“变化说明”，确认图片和槽位后即可开始生产。')
          break }
        if (['blocked', 'failed', 'contract_needed'].includes(latest.status)) { setPromptPlanNotice(promptPlanStatusText(latest))
          break }
        const waitedSeconds = Math.round(i === 0 ? 1 : 1 + i * 1.5)
        setPromptPlanNotice(`正在整理出图方案… 已等待 ${waitedSeconds} 秒。完成前不会点亮生产按钮。`) }
      if (latest && !(latest.status === 'ready' && latest.promptId) && !['blocked', 'failed', 'contract_needed'].includes(latest.status)) {
        const finalLatest = await productionApi.getPromptPlanSummary(productId)
        setPromptPlan(finalLatest)
        if (finalLatest.status === 'ready' && finalLatest.promptId) { setPromptPlanNotice('出图方案已更新。请查看下方“本次出图要求”和“变化说明”，确认图片和槽位后即可开始生产。') } else { setPromptPlanNotice('出图方案还在整理中；可以稍后刷新，系统不会在结果不明确时点亮生产按钮。') } } } catch (e) {
      const message = promptPlannerErrorText(e)
      setPromptPlanNotice(message)
      toast.showToast(message, 'error') } finally { setPromptPlanning(false) } }
  const creditBreakdown = useMemo(() => {
    const model = MODEL_OPTIONS.find((m) => m.id === selectedModel)
    const resolution = RESOLUTION_OPTIONS.find((r) => r.id === selectedResolution)
    const modelCost = (model?.costPerImage ?? 10)
    const resCost = (resolution?.costMultiplier ?? 1)
    return { modelCostPerImage: modelCost, resolutionCostPerImage: resCost, imageCount: selectedSourceIds.length > 0 ? imageCount : 0, total: Math.round(modelCost * resCost * (selectedSourceIds.length > 0 ? imageCount : 0)), } }, [selectedModel, selectedResolution, imageCount, selectedSourceIds.length])
  const taskSlots = useMemo(() => {
    return Array.from({ length: imageCount }, (_, idx) => assetTasks[idx] ?? { id: `planned-${idx + 1}`, name: `任务 ${String(idx + 1).padStart(2, '0')}`, sceneTag: idx === 0 ? '主图' : idx % 2 === 0 ? '场景图' : '细节图', templateId: TEMPLATES[idx % TEMPLATES.length].id, detailRequirement: defaultDetailRequirement(idx === 0 ? '主图' : idx % 2 === 0 ? '场景图' : '细节图'), }) }, [assetTasks, imageCount])
  const selectedSources = useMemo(() => sourceOptions.filter(source => selectedSourceIds.includes(source.id)), [sourceOptions, selectedSourceIds])
  const fanoutTasks = useMemo<ProductionFanoutTask[]>(() => {
    const sources = selectedSources.length > 0 ? selectedSources : []
    if (sources.length === 0) return []
    return taskSlots.map((slot, slotIndex) => {
      const source = sources.find(item => item.id === slot.sourceId) ?? sources[slotIndex % sources.length]
      const template = TEMPLATES.find((item) => item.id === slot.templateId) ?? TEMPLATES[0]
      return { id: `${source.id}:${slot.templateId}:${slotIndex}`, sourceId: source.id, sourceName: source.name, sourceUrl: source.thumbnailUrl || source.url, templateId: slot.templateId, templateName: template.name, slotIndex, sceneTag: slot.sceneTag, detailRequirement: buildSlotDetailRequirement(template, slot.sceneTag, slot.detailRequirement, slotIndex), negativeRequirement: slot.negativeRequirement || advancedParams.negativePrompt, status: 'pending', progress: 0, resultAssetCount: 0, } }) }, [advancedParams.negativePrompt, selectedSources, taskSlots])
  const getTemplate = useCallback( (templateId: string) => TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0], [], )
  const adjustImageCount = (delta: number) => { setImageCount(Math.max(1, Math.min(10, imageCount + delta))) }
  const ensureTaskForSlot = (asset: AssetTask, patch: Partial<AssetTask>) => {
    if (asset.id.startsWith('planned-')) { addAssetTask({ ...asset, ...patch, id: `asset-${Date.now()}-${asset.id}` })
      return }
    updateAssetTask(asset.id, patch) }
  const handleRemoveTaskSlot = (asset: AssetTask) => { removeAssetTask(asset.id)
    setImageCount(Math.max(1, imageCount - 1)) }
  const addNewAsset = () => {
    if (imageCount >= 10) { toast.showToast('最多支持 10 个出图槽位。', 'info')
      return }
    const idx = Math.min(10, Math.max(imageCount + 1, assetTasks.length + 1))
    const newAsset: AssetTask = { id: `asset-${Date.now()}`, name: `任务 ${String(idx).padStart(2, '0')}（新增）`, sceneTag: idx === 1 ? '主图' : idx % 2 === 0 ? '细节图' : '场景图', templateId: TEMPLATES[(idx - 1) % TEMPLATES.length].id, detailRequirement: defaultDetailRequirement(idx === 1 ? '主图' : idx % 2 === 0 ? '细节图' : '场景图'), }
    addAssetTask(newAsset)
    setImageCount(Math.max(imageCount, idx)) }
  const executeProduction = async () => {
    if (!productId) return
    if (store.intents.length === 0) {
      const message = '还不能开始生产：卡在策略输入。请先回到生产准备，完成图片解析和四个“要/不要”选择。'
      toast.showToast(message, 'error')
      setExecutionNotice(message)
      setExecutionProgress(null)
      setExecutionPhase('failed')
      return }
    if (!promptPlan || promptPlan.status !== 'ready' || !promptPlan.promptId) {
      const message = `还不能开始生产：${promptPlanStatusText(promptPlan)}`
      toast.showToast(message, 'error')
      setExecutionNotice(message)
      setExecutionProgress(null)
      setExecutionPhase('failed')
      return }
    setExecutionNotice('正在提交生产任务，请稍候...')
    setExecutionProgress(0)
    setFanoutTasksState(fanoutTasks)
    setExecutionPhase('waiting')
    setExecuting(true)
    setIsRunning(true)
    try {
      const selectedIntentIds = store.intents.map((intent) => intent.id)
      if (fanoutTasks.length === 0) { toast.showToast('没有可提交的出图槽位。请先在 Prep 上传 SKU 图片并生成出图方案。', 'error')
        setExecutionPhase('failed')
        setIsRunning(false)
        return }
      const batch = await productionApi.executeFanoutIntents(productId, selectedIntentIds, fanoutTasks, { ...(store.executionConfig ?? { provider: 'comfyui_bridge' as const, maxConcurrency: 3, retryOnFailure: false, maxRetries: 0, timeoutSeconds: 300, }), providerConfig: { ...(store.executionConfig?.providerConfig ?? {}), generation_provider_code: (currentModel?.providerCode ?? 'comfyui_bridge') satisfies ImageGenerationProviderCode, model_id: currentModel?.modelId ?? selectedModel, ui_model_option_id: selectedModel, resolution_id: currentResolution?.id, dimensions: currentResolution?.dimensions, fanout_total: fanoutTasks.length, task_slots: fanoutTasks.map((task, index) => ({ index, asset_task_id: task.id, scene_tag: task.sceneTag, source_id: task.sourceId, template_id: task.templateId, template_name: task.templateName, detail_requirement: task.detailRequirement, negative_requirement: task.negativeRequirement || advancedParams.negativePrompt, })), prompt_composer: { diy_prompt_text: effectiveGenerationPromptText || diyPrompt, user_adjusted_prompt_text: effectiveGenerationPromptText, original_prompt_text: generationPromptText, prompt_text_changed_by_user: promptPlanChangedByUser, negative_prompt_text: advancedParams.negativePrompt, }, }, }, { onProgress: (latest) => { setFanoutTasksState(latest.tasks)
          setExecutionProgress(latest.totalTasks > 0 ? Math.round(((latest.completedTasks + latest.failedTasks) / latest.totalTasks) * 100) : 0)
          setExecutionNotice(productionProgressNotice(latest)) }, })
      setFanoutTasksState(batch.tasks)
      setExecutionProgress(batch.totalTasks > 0 ? Math.round(((batch.completedTasks + batch.failedTasks) / batch.totalTasks) * 100) : 0)
      setExecutionNotice(productionProgressNotice(batch))
      if (batch.completedTasks > 0 && batch.failedTasks === 0) { setExecutionPhase('ready')
        setIsRunning(false)
        setExecutionNotice('结果图已生成，正在加载图片，加载完成后进入工坊。')
        await preloadFanoutResultImages(batch.tasks)
        toast.showToast(`已有 ${batch.completedTasks} 个结果返回，正在进入工坊。`, 'success')
        navigate(`/products/${productId}/production/workshop`) } else if (batch.completedTasks > 0) {
        const failedReason = batch.tasks.find(task => task.status === 'failed')?.error || '部分槽位没有返回可展示结果。'
        setExecutionPhase('failed')
        setIsRunning(false)
        setExecutionNotice(`已生成 ${batch.completedTasks}/${batch.totalTasks} 张；${batch.failedTasks} 张失败：${failedReason}`)
        toast.showToast(`已生成 ${batch.completedTasks}/${batch.totalTasks} 张，部分失败：${failedReason}`, 'error') } else { setExecutionPhase('failed')
        setIsRunning(false)
        toast.showToast('本次批量任务没有成功结果，系统未展示占位图。', 'error') }
      return } catch (e) {
      const message = e instanceof Error ? e.message : '提交失败，请稍后重试。'
      toast.showToast(message, 'error')
      setExecutionNotice(message)
      setExecutionProgress(null)
      setExecutionPhase('failed')
      setIsRunning(false) } finally { setExecuting(false) } }
  const goBack = () => { if (productId) navigate(`/products/${productId}/production/prep`) }
  const currentModel = MODEL_OPTIONS.find((m) => m.id === selectedModel); const currentResolution = RESOLUTION_OPTIONS.find((r) => r.id === selectedResolution); const hasRunnableIntents = store.intents.length > 0
  const promptPlanReady = promptPlan?.status === 'ready' && Boolean(promptPlan.promptId); const canStartProduction = hasRunnableIntents && promptPlanReady && fanoutTasks.length > 0 && !executing; const promptPlanBlocker = promptPlanStatusText(promptPlan)
  const startProductionBlocker = !hasRunnableIntents ? '先回到生产准备，完成图片解析结果确认和取舍选择。' : !promptPlanReady ? promptPlanBlocker : fanoutTasks.length === 0 ? '请先在 Prep 上传至少一张 SKU 图片。' : '可以开始生产。'
  const promptPlanSourceLabel = promptPlan?.source === 'llm_prompt_planner' ? '已按你的选择整理' : promptPlan?.source ? '基础方案' : '准备中'; const promptPlanStatusLabel = promptPlan?.status === 'ready' ? '可用于生产' : promptPlan?.status === 'blocked' ? '需要先完成准备' : promptPlan?.status ? '整理中' : '未知'
  const generationPromptText = promptPlanGenerationPrompt(promptPlan); const effectiveGenerationPromptText = promptPlanEditorText.trim() || generationPromptText; const promptPlanChangedByUser = promptPlanEditorDirty && promptPlanEditorText.trim() !== generationPromptText.trim(); const promptKeywords = promptPlanKeywords(promptPlan)
  const productionReadinessItems = [ { label: '策略输入', ok: hasRunnableIntents, detail: hasRunnableIntents ? `${store.intents.length} 条已确认` : '还没有可生成的选择' }, { label: '出图方案', ok: promptPlanReady, detail: promptPlanReady ? '已准备好' : promptPlanBlocker }, { label: '出图槽位', ok: fanoutTasks.length > 0, detail: fanoutTasks.length > 0 ? `${fanoutTasks.length} 个任务` : '等待 Prep 图片' }, ]
  return ( <div className="mx-auto max-w-[1440px] px-5 py-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">
              {t('production.sandbox.title')} </h1>
            <p className="mt-1 text-sm text-white/50">
              {t('production.sandbox.subtitle')} </p> </div> </div> </motion.div>
      {/* ─── 3-Column Layout ───────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* ─── Left Column (3 cols) ────────────────────────── */}
        <div className="space-y-5 lg:col-span-3">
          {/* 1. Strategy Summary */}
          <ProductionSectionCard title="策略输入摘要" subtitle="来自生产准备页的图片解析与四个“要/不要”选择">
            {strategySummary ? ( <div className="space-y-4">
                {/* Overview */}
                <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-3">
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-amber-400/60" />
                    <span className="text-[10px] font-medium text-white/40">出图要求概览</span> </div>
                  <p className="text-[11px] leading-relaxed text-white/50">
                    {strategySummary.overview} </p>
                  <Button
                    type="button"
                    className="mt-2 text-[10px] text-cyan-400/60 hover:text-cyan-400"
                  >
                    查看详情 → </Button> </div>
                {/* Attributes */}
                <div className="space-y-2">
                  {strategySummary.attributes.map((attr) => {
                    const IconComp = ICON_MAP[attr.icon]
                    return ( <div
                        key={attr.key}
                        className="flex items-center gap-2.5 rounded-lg border border-white/[0.03] bg-white/[0.01] px-3 py-2"
                      >
                        {IconComp && ( <IconComp className="h-3.5 w-3.5 shrink-0 text-white/25" /> )}
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] text-white/35">{attr.label}</p>
                          <p className="line-clamp-2 break-words text-xs leading-5 text-white/65">{attr.value}</p> </div> </div> ) })} </div> </div> ) : ( <div className="flex min-h-[160px] flex-col items-center justify-center text-center">
                <AlertCircle className="mb-2 h-6 w-6 text-white/15" />
                <p className="text-[11px] text-white/30">暂无策略摘要</p>
                <p className="mt-0.5 text-[10px] text-white/20">请先完成生产准备页的解析与选择</p> </div> )} </ProductionSectionCard>
          <ProductionSectionCard title="出图方案 / 变化说明" subtitle="把你的选择整理成后续出图要求">
            <div className="space-y-3">
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-3 text-xs leading-5 text-white/50">
                <p className="mb-3 leading-6 text-white/45">点击后，系统会把生产准备里的图片识别结果和你的选择整理成一份出图方案；准备好后，上方展示最终出图要求，下方只展示新增、移除或调整的变化。</p>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>方案来源</span>
                  <span className={promptPlan?.source === 'llm_prompt_planner' ? 'text-emerald-300/80' : 'text-amber-300/80'}>
                    {promptPlanSourceLabel} </span> </div>
                <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                  <span>准备状态</span>
                  <span>{promptPlanStatusLabel}</span> </div>
                {!promptPlanReady && ( <div className="mt-2 rounded-md border border-amber-300/10 bg-amber-300/[0.04] px-2 py-1.5 leading-relaxed text-amber-100/75">
                    下一步：{promptPlanBlocker} </div> )}
                {promptPlan?.promptId && ( <div className="mt-2 rounded-md bg-white/[0.035] px-2 py-1 text-white/40">方案已保存，可用于本次生产</div> )} </div>
              {promptPlanNotice && ( <div className="rounded-lg border border-cyan-300/15 bg-cyan-300/[0.055] px-3 py-2 text-[10px] leading-relaxed text-cyan-100/75" aria-live="polite">
                  {promptPlanNotice} </div> )}
              {promptPlanReady && ( <EditablePromptCard
                  value={promptPlanEditorText}
                  dirty={promptPlanChangedByUser}
                  onChange={(value) => { setPromptPlanEditorText(value); setPromptPlanEditorDirty(true) }}
                  onRestore={() => { setPromptPlanEditorText(generationPromptText); setPromptPlanEditorDirty(false) }}
                  keywords={promptKeywords}
                  details={[
                    { label: '背景', value: promptPlanFieldSummary(promptPlan, 'background') },
                    { label: '光线', value: promptPlanFieldSummary(promptPlan, 'lighting') },
                    { label: '构图', value: promptPlanFieldSummary(promptPlan, 'composition') },
                  ]}
                /> )}
              <Button
                type="button"
                onClick={runPromptPlanner}
                disabled={promptPlanning || !hasRunnableIntents}
                className="!h-auto min-h-10 w-full !whitespace-normal rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-semibold leading-5 text-cyan-200 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {promptPlanning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                {promptPlanning ? '正在整理出图方案...' : hasRunnableIntents ? '生成/刷新出图方案' : '先完成 Prep 后生成方案'} </Button>
              {!hasRunnableIntents && ( <div className="rounded-lg border border-amber-300/15 bg-amber-300/[0.055] px-3 py-2 text-[10px] leading-relaxed text-amber-100/75">
                  生成方案按钮不可用：请先回到生产准备页，完成图片解析并确认至少一条选择。 </div> )}
              {!promptPlanReady && ( <div className="rounded-lg border border-amber-300/15 bg-amber-300/[0.055] px-3 py-2 text-[10px] leading-relaxed text-amber-100/75">
                  {promptPlanBlocker} </div> )}
              <div className="space-y-2 rounded-lg border border-white/[0.04] bg-black/20 p-3">
                <p className="text-[10px] font-medium text-white/45">变化说明</p>
                {promptPlan && (promptPlan.diff.added.length || promptPlan.diff.removed.length || promptPlan.diff.changed.length) ? ( <div className="space-y-1 text-[10px] leading-relaxed">
                    {promptPlan.diff.added.map((item, idx) => <p key={`add-${idx}`} className="text-emerald-300/70">+ {item}</p>)}
                    {promptPlan.diff.removed.map((item, idx) => <p key={`remove-${idx}`} className="text-rose-300/70">- {item}</p>)}
                    {promptPlan.diff.changed.map((item, idx) => <p key={`change-${idx}`} className="text-amber-300/70">~ {item}</p>)} </div> ) : ( <p className="text-[10px] text-white/25">
                    {promptPlan?.diff.status === 'not_returned' ? '没有返回变化清单；请以上方“本次出图要求”为准。' : '完成生产准备里的选择后，点击上方按钮，系统会整理本次出图要求并展示变化。'} </p> )} </div> </div> </ProductionSectionCard> </div>
        {/* ─── Center Column (6 cols) ──────────────────────── */}
        <div className="space-y-5 lg:col-span-6">
          {/* 3. Task Allocation */}
          <ProductionSectionCard title="任务配额与出图槽位" subtitle="任务配额=槽位数；源图沿用 Prep 中已解析的 SKU 图片">
            <div className="space-y-4">
              {/* Image Count */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[11px] text-white/50">生成图片数量</span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => adjustImageCount(-1)}
                    disabled={imageCount <= 1}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/40 transition hover:border-white/15 hover:text-white disabled:opacity-30"
                  >
                    <Minus className="h-3 w-3" /> </Button>
                  <span className="min-w-[20px] text-center text-sm font-semibold text-white">
                    {imageCount} </span>
                  <Button
                    type="button"
                    onClick={() => adjustImageCount(1)}
                    disabled={imageCount >= 10}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/40 transition hover:border-white/15 hover:text-white disabled:opacity-30"
                  >
                    <Plus className="h-3 w-3" /> </Button> </div>
                <span className="text-[10px] leading-5 text-white/30">最多支持 10 个槽位；1 个槽位 = 1 张待生成图片</span> </div>
              {/* Asset Rows */}
              <div className="space-y-2">
                {taskSlots.map((asset, idx) => {
                  const template = getTemplate(asset.templateId)
                  return ( <motion.div
                    key={asset.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex flex-wrap items-start gap-3 rounded-xl border border-white/[0.04] bg-white/[0.015] px-3 py-3"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
                      <Image className="h-3.5 w-3.5 text-white/30" /> </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] text-white/70">{asset.name}</span>
                        <span className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[9px] text-white/30">
                          槽位 {idx + 1} / {imageCount} </span>
                        <span className="rounded bg-cyan-400/10 px-1.5 py-0.5 text-[9px] text-cyan-100/60">
                          {fanoutTasks[idx]?.sourceName ? '使用 Prep SKU 图' : '等待 Prep 图片'} </span> </div>
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        <label className="space-y-1">
                          <span className="text-[9px] text-white/25">图类型</span>
                          <select
                            value={asset.sceneTag}
                            onChange={(e) => ensureTaskForSlot(asset, { sceneTag: e.target.value, detailRequirement: asset.detailRequirement || defaultDetailRequirement(e.target.value) }) }
                            className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1.5 text-[10px] text-white/60 outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 focus-visible:ring-offset-0 focus:border-cyan-400/30"
                          >
                            {SCENE_TAG_OPTIONS.map((tag) => <option key={tag} value={tag}>{tag}</option>)} </select> </label>
                        <label className="space-y-1">
                          <span className="text-[9px] text-white/25">模板</span>
                          <select
                            value={asset.templateId}
                            onChange={(e) => ensureTaskForSlot(asset, { templateId: e.target.value })}
                            className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1.5 text-[10px] text-white/60 outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 focus-visible:ring-offset-0 focus:border-cyan-400/30"
                          >
                            {TEMPLATES.map((t) => ( <option key={t.id} value={t.id}>
                                {t.name} </option> ))} </select> </label> </div>
                      <div className="rounded-lg border border-cyan-300/10 bg-cyan-300/[0.04] px-2.5 py-2 text-[9px] leading-relaxed text-cyan-100/65">
                        已注入默认模板配置：{template.description}；{template.compositionRules.join('；')}；画幅 {template.aspectRatio}。 </div>
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        <input
                          type="text"
                          value={asset.detailRequirement || ''}
                          onChange={(e) => ensureTaskForSlot(asset, { detailRequirement: e.target.value })}
                          placeholder="本槽位细节要求，例如：突出材质纹理 / 主体完整 / 更强场景氛围"
                          className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-[10px] text-white placeholder:text-white/15 outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 focus-visible:ring-offset-0 focus:border-cyan-400/30"
                        />
                        <input
                          type="text"
                          value={asset.negativeRequirement || ''}
                          onChange={(e) => ensureTaskForSlot(asset, { negativeRequirement: e.target.value })}
                          placeholder="本槽位不希望出现的内容，可选"
                          className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-[10px] text-white placeholder:text-white/15 outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 focus-visible:ring-offset-0 focus:border-cyan-400/30"
                        /> </div> </div>
                    {!asset.id.startsWith('planned-') && ( <Button
                        type="button"
                        onClick={() => handleRemoveTaskSlot(asset)}
                        aria-label={`删除${asset.name}，并减少一个出图槽位`}
                        title="删除该槽位"
                        className="shrink-0 text-white/15 hover:text-red-400/80"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> </Button> )} </motion.div> ) })} </div>
              {/* Add Asset */}
              {imageCount < 10 && ( <Button
                  type="button"
                  onClick={addNewAsset}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/[0.06] bg-white/[0.01] py-2.5 text-[11px] text-white/30 transition hover:border-white/10 hover:text-white/50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  添加新任务 </Button> )} </div> </ProductionSectionCard>
          {/* 4. Template Preview */}
          <ProductionSectionCard title={`模板参考（${imageCount} 个槽位）`}>
            <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${imageCount >= 5 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
              {taskSlots.map((asset, idx) => {
                const tpl = getTemplate(asset.templateId)
                return <WireframePreview key={asset.id} template={tpl} index={idx} /> })} </div>
            <p className="mt-3 flex items-center gap-1 text-[9px] text-white/15">
              <Info className="h-3 w-3" />
              本次会按「任务配额槽位」创建独立生成任务；源图沿用生产准备中的商品图，每个槽位只配置图类型、模板和细节要求。 </p> </ProductionSectionCard> </div>
        {/* ─── Right Column (3 cols) ───────────────────────── */}
        <div className="space-y-5 lg:col-span-3">
          {/* 5. Execution Settings */}
          <ProductionSectionCard title="生产设置">
            <div className="space-y-4">
              {/* Model Selection */}
              <div>
                <label htmlFor="sandbox-model-select" className="mb-1.5 block text-[11px] text-white/40">模型选择</label>
                <div className="relative">
                  <select
                    id="sandbox-model-select"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-[11px] text-white outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 focus-visible:ring-offset-0 transition focus:border-cyan-400/30"
                  >
                    {MODEL_OPTIONS.map((m) => ( <option key={m.id} value={m.id}>
                        {m.label} </option> ))} </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/20" /> </div>
                {currentModel && ( <p className="mt-1 text-[9px] text-white/25">{currentModel.description}</p> )} </div>
              {/* Advanced Settings (Collapsible) */}
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.01]">
                <Button
                  type="button"
                  onClick={() => setAdvancedExpanded(!advancedExpanded)}
                  className="flex w-full items-center justify-between px-3 py-2.5"
                >
                  <span className="text-[11px] text-white/40">高级设置</span>
                  {advancedExpanded ? ( <ChevronUp className="h-3.5 w-3.5 text-white/20" /> ) : ( <ChevronDown className="h-3.5 w-3.5 text-white/20" /> )} </Button>
                <AnimatePresence>
                  {advancedExpanded && ( <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3 border-t border-white/[0.03] px-3 py-3">
                        {/* Seed */}
                        <div>
                          <label htmlFor="sandbox-seed-input" className="mb-1 block text-[10px] text-white/30">Seed</label>
                          <div className="flex items-center gap-2">
                            <input
                              id="sandbox-seed-input"
                              type="number"
                              value={advancedParams.seed}
                              onChange={(e) => setAdvancedParams({ seed: Number(e.target.value) }) }
                              className="flex-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-[11px] text-white outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 focus-visible:ring-offset-0 focus:border-cyan-400/30"
                            />
                            <Button
                              type="button"
                              onClick={() => setAdvancedParams({ seed: Math.floor(Math.random() * 999999999) })}
                              className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-1.5 text-white/30 hover:text-white/50"
                              title="Random seed"
                            >
                              <Settings className="h-3 w-3" /> </Button> </div> </div>
                        {/* 不希望出现的内容 */}
                        <div>
                          <label htmlFor="sandbox-negative-prompt" className="mb-1 block text-[10px] text-white/30">不希望出现的内容</label>
                          <input
                            id="sandbox-negative-prompt"
                            type="text"
                            value={advancedParams.negativePrompt}
                            onChange={(e) => setAdvancedParams({ negativePrompt: e.target.value }) }
                            placeholder="可选，输入不希望出现的内容..."
                            className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-[11px] text-white placeholder:text-white/15 outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 focus-visible:ring-offset-0 focus:border-cyan-400/30"
                          /> </div>
                        {/* 采样方式 */}
                        <div>
                          <label htmlFor="sandbox-sampling-select" className="mb-1 block text-[10px] text-white/30">采样方式</label>
                          <div className="relative">
                            <select
                              id="sandbox-sampling-select"
                              value={advancedParams.sampling}
                              onChange={(e) => setAdvancedParams({ sampling: e.target.value }) }
                              className="w-full appearance-none rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-[11px] text-white outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 focus-visible:ring-offset-0"
                            >
                              {SAMPLING_OPTIONS.map((s) => ( <option key={s} value={s}>{s}</option> ))} </select>
                            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-white/20" /> </div> </div>
                        {/* 画面贴合强度 */}
                        <div>
                          <div className="mb-1 flex items-center justify-between">
                            <label htmlFor="sandbox-cfg-scale" className="text-[10px] text-white/30">画面贴合强度</label>
                            <span className="text-[10px] tabular-nums text-white/40">{advancedParams.cfgScale}</span> </div>
                          <input
                            id="sandbox-cfg-scale"
                            type="range"
                            min={1}
                            max={15}
                            step={0.5}
                            value={advancedParams.cfgScale}
                            onChange={(e) => setAdvancedParams({ cfgScale: Number(e.target.value) }) }
                            className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/[0.06] accent-cyan-400"
                          /> </div>
                        {/* 生成精细度 */}
                        <div>
                          <div className="mb-1 flex items-center justify-between">
                            <label htmlFor="sandbox-steps" className="text-[10px] text-white/30">生成精细度</label>
                            <span className="text-[10px] tabular-nums text-white/40">{advancedParams.steps}</span> </div>
                          <input
                            id="sandbox-steps"
                            type="range"
                            min={10}
                            max={50}
                            step={1}
                            value={advancedParams.steps}
                            onChange={(e) => setAdvancedParams({ steps: Number(e.target.value) }) }
                            className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/[0.06] accent-cyan-400"
                          /> </div>
                        {/* High Res Fix Toggle */}
                        <div className="flex items-center justify-between rounded-lg border border-white/[0.03] bg-white/[0.01] px-2.5 py-2">
                          <span className="text-[10px] text-white/30">高倍修复</span>
                          <Button
                            type="button"
                            onClick={() => setAdvancedParams({ highResFix: !advancedParams.highResFix })}
                            className={`relative h-4 w-7 rounded-full transition-colors ${ advancedParams.highResFix ? 'bg-cyan-400/40' : 'bg-white/[0.08]' }`}
                          >
                            <span
                              className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform ${ advancedParams.highResFix ? 'left-[14px]' : 'left-0.5' }`}
                            /> </Button> </div> </div> </motion.div> )} </AnimatePresence> </div> </div> </ProductionSectionCard>
          {/* 6. Credits Estimation */}
          <ProductionSectionCard title="消耗预估">
            <div className="space-y-3">
              <div className="space-y-2 rounded-xl border border-white/[0.03] bg-white/[0.01] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/30">
                    模型消耗（{currentModel?.name ?? 'Pro-v6'}） </span>
                  <span className="text-[10px] tabular-nums text-white/50">
                    {creditBreakdown.modelCostPerImage} Credits / 张 </span> </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/30">
                    分辨率（{currentResolution?.label ?? '2K Ultra'}） </span>
                  <span className="text-[10px] tabular-nums text-white/50">
                    {creditBreakdown.resolutionCostPerImage > 1 ? `×${creditBreakdown.resolutionCostPerImage}` : creditBreakdown.resolutionCostPerImage < 1 ? `×${creditBreakdown.resolutionCostPerImage}` : '0 Credits / 张'} </span> </div>
                <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/30">预计生成数量</span>
              <span className="text-[10px] tabular-nums text-white/50">
                {creditBreakdown.imageCount} 张图片 </span> </div>
                <div className="border-t border-white/[0.03] pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-white/60">预估总消耗</span>
                    <span className="text-lg font-bold tabular-nums text-cyan-400">
                      {creditBreakdown.total} Credits </span> </div> </div> </div>
              <div className={`rounded-xl border px-3 py-2.5 text-[10px] leading-relaxed ${ canStartProduction ? 'border-emerald-300/15 bg-emerald-300/[0.05] text-emerald-100/75' : 'border-amber-300/15 bg-amber-300/[0.055] text-amber-100/75' }`}>
                {canStartProduction ? '出图方案已准备好。点击下方按钮开始生成，结果返回后自动进入工坊。' : `开始生产前还需要：${startProductionBlocker}`} </div>
              <div className="space-y-1 rounded-xl border border-white/[0.04] bg-white/[0.015] p-3">
                <p className="text-[10px] font-medium text-white/45">开始生产检查</p>
                {productionReadinessItems.map((item) => ( <div key={item.label} className="grid grid-cols-[72px_1fr] gap-2 text-[10px]">
                    <span className={item.ok ? 'text-emerald-200/75' : 'text-amber-100/70'}>{item.ok ? '✓' : '•'} {item.label}</span>
                    <span className="text-right leading-relaxed text-white/42">{item.detail}</span> </div> ))} </div>
              <Button
                type="button"
                onClick={() => {
                  if (!canStartProduction) { setExecutionPhase('idle')
                    setExecutionProgress(null)
                    setExecutionNotice(`开始生产前还需要：${startProductionBlocker}`)
                    return }
                  void executeProduction() }}
                disabled={executing}
                aria-disabled={!canStartProduction}
                title={startProductionBlocker}
                className={`group inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg transition ${canStartProduction ? 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-cyan-500/10 hover:shadow-cyan-500/20' : 'border border-amber-300/20 bg-amber-300/10 text-amber-100/85 shadow-amber-500/5 hover:bg-amber-300/15'} disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {executing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                <span>{executing ? '正在出图...' : canStartProduction ? '开始生产' : '补齐生成条件'}</span> </Button>
              {!canStartProduction && !executing && ( <p className="text-center text-[9px] leading-relaxed text-amber-100/55">
                  当前按钮不会提交生产任务；只有策略输入、出图方案、出图槽位全部通过后才会变成“开始生产”。 </p> )}
              {executionNotice && ( <div className={`rounded-xl border px-3 py-2.5 text-[10px] leading-relaxed ${ executionPhase === 'ready' ? 'border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-100/80' : executionPhase === 'failed' ? 'border-rose-400/20 bg-rose-400/[0.06] text-rose-100/80' : 'border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-100/80' }`} aria-live="polite">
                  <div className="flex items-center gap-2">
                    {executionPhase === 'waiting' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>{executionNotice}</span> </div>
                  {executionProgress != null && executionPhase === 'waiting' && ( <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                      <div
                        className="h-full rounded-full bg-cyan-300/70 transition-colors duration-500"
                        style={{ width: `${Math.max(8, executionProgress)}%` }}
                      /> </div> )}
                  {fanoutTasksState.length > 0 && ( <div className="mt-3 space-y-2">
                      <div className="text-[10px] text-white/45">
                        批量任务：{fanoutTasksState.filter(task => task.status === 'succeeded').length}/{fanoutTasksState.length} 已返回结果 </div>
                      <div className="space-y-1.5">
                        {fanoutTasksState.map((task, index) => {
                          const done = task.status === 'succeeded'
                          const failed = task.status === 'failed'
                          return ( <div key={task.id} className="rounded-lg border border-white/[0.06] bg-black/10 px-2 py-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className="truncate text-[10px] text-white/70">第 {index + 1} 张 · {productionTaskTitle(task, index)}</span>
                                <span className={done ? 'text-[10px] text-emerald-200/80' : failed ? 'text-[10px] text-rose-200/80' : 'text-[10px] text-cyan-200/75'}>
                                  {productionTaskStatusLabel(task)} {Math.max(0, Math.min(100, Math.round(task.progress || 0)))}% </span> </div>
                              <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/[0.08]">
                                <div
                                  className={done ? 'h-full rounded-full bg-emerald-300/75 transition-colors duration-500' : failed ? 'h-full rounded-full bg-rose-300/75 transition-colors duration-500' : 'h-full rounded-full bg-cyan-300/70 transition-colors duration-500'}
                                  style={{ width: `${done ? 100 : Math.max(8, Math.min(100, Math.round(task.progress || 0)))}%` }}
                                /> </div>
                              {task.error && <div className="mt-1 text-[9px] text-rose-100/65">{task.error}</div>} </div> ) })} </div> </div> )} </div> )} </div> </ProductionSectionCard> </div> </div>
      {/* ─── Bottom Action Bar ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 flex items-center justify-between gap-4"
      >
        <Button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-3 text-xs text-white/50 transition hover:border-white/10 hover:text-white/70"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          返回上一步 </Button> </motion.div>
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
        <span>预计消耗 {creditBreakdown.total} Credits</span> </motion.div>
      <p className="mt-1 text-center text-[9px] text-white/15">
        {hasRunnableIntents ? promptPlanReady ? '提交后会在本页显示进度；生成完成后再进入工坊查看结果。' : '请先点击「生成/刷新出图方案」。方案整理好后，就可以开始生产。' : '请先回到生产准备，完成图片解析并确认保留、替换或排除的选择。'} </p> </div> ) }
