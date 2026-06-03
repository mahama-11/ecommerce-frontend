import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams, Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useToastStore } from '@/store/toastStore'
import { ArrowLeft, Loader2, Sparkles, Upload, X } from 'lucide-react'
import { TOOLS, getLocalizedTool } from '@/mock/data'
import type { ToolDef, ToolInputMode } from '@/types/tool'
import { productWorkspaceRepository } from '@/repositories/productWorkspace'
import { cancelImageJob,
  createImageJob, fetchAssetObjectURL,
  getImageJob, listImageJobs,
  registerSourceAsset, type ImageJobSummary,
  type SourceAssetInput,
  type SourceAssetSummary, } from '@/services/imageRuntime'
import { clearUseTemplatePayload,
  listCatalog, loadUseTemplatePayload,
  type TemplateUseResponse, useTemplateNow as executeTemplateNow,
} from '@/services/templateCenter'
import { getProduct } from '@/services/product'
import type { Product } from '@/types/product'
import { ToolNotFoundView } from './tool-page/components/ToolNotFoundView'
import type { ActiveTemplateState, AssetRequirement, GeneratedResult, Locale, ToolTemplateOption } from './tool-page/types'
import { copy,
  assetAccept,
  defaultAssetGuide, fileToDataURL,
  formatRequirementConstraints,
  getImageDimensions, isTerminalStatus,
  isFileAccepted,
  mapJobStatus, normalizeAssetRequirements,
  normalizeToolAssetRequirements,
  toolToSceneType, formatAssetLabel,
} from './tool-page/utils'
import { Button } from '@/components/ui/Button'
import { ToolPromptBar } from './tool-page/components/ToolPromptBar'
import { ToolTemplatePicker } from './tool-page/components/ToolTemplatePicker'
import { ToolTemplateGallery } from './tool-page/components/ToolTemplateGallery'
import { ToolAssetSlotPanel } from './tool-page/components/ToolAssetSlotPanel'
type ToolPageLocationState = { templateUsePayload?: TemplateUseResponse
}
type ToolContentProps = { tool: ToolDef
  productId: string }
function buildHistorySourceAsset(sourceAssetID: string): SourceAssetSummary {
  return { id: sourceAssetID,
    asset_type: 'image', source_type: 'history',
    storage_key: '', mime_type: 'image/png',
    width: 0, height: 0,
    file_name: 'history-source', }
}
function readFirstString(record: Record<string, unknown> | undefined, keys: string[]): string {
  if (!record) return ''
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}
function normalizeInputMode(value: unknown, fallback: ToolInputMode): ToolInputMode {
  if (value === 'text_to_image' || value === 'image_to_image' || value === 'multi_image') {
    return value
  }
  return fallback
}
function providerCapabilityForInputMode(inputMode: ToolInputMode): string { return inputMode }
function selectLegacySourceAsset(
  sourceAssets: Record<string, { asset: SourceAssetSummary; previewUrl: string }>,
  requirements: AssetRequirement[],
) {
  const compatibleSlot = requirements.find(item => item.role === 'primary' || item.role === 'product' || item.slot === 'primary')
    ?? requirements.find(item => item.required)
    ?? requirements[0]
  if (compatibleSlot && sourceAssets[compatibleSlot.slot]) return sourceAssets[compatibleSlot.slot]
  const compatibleEntry = Object.entries(sourceAssets).find(([slot, entry]) => {
    const requirement = requirements.find(item => item.slot === slot)
    return requirement?.role === 'primary' || requirement?.role === 'product' || entry.asset.metadata?.role === 'primary' || entry.asset.metadata?.role === 'product'
  })
  return compatibleEntry?.[1] ?? Object.values(sourceAssets)[0]
}
function ToolContent({ tool, productId }: ToolContentProps) {
  const { i18n } = useTranslation()
  const { showToast } = useToastStore()
  const locale: Locale = (i18n.resolvedLanguage ?? i18n.language).startsWith('en') ? 'en' : 'zh'
  const location = useLocation()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const pendingUploadSlotRef = useRef<string>('primary')
  const [pendingUploadSlot, setPendingUploadSlot] = useState('primary')
  const resultObjectURLsRef = useRef<string[]>([])
  const resultPreviewByAssetIDRef = useRef<Record<string, string>>({})
  const notifiedJobIDsRef = useRef<Set<string>>(new Set())
  const consumedTemplatePayloadKeyRef = useRef<string | null>(null)
  const templateOptionsRequestKeyRef = useRef<string>('')
  const templateOptionsLoadingRef = useRef(false)
  const [creatingJob, setCreatingJob] = useState(false)
  const [cancelingJob, setCancelingJob] = useState(false)
  const [uploadingSource, setUploadingSource] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [activeTemplate, setActiveTemplate] = useState<ActiveTemplateState | null>(null)
  const [templateOptions, setTemplateOptions] = useState<ToolTemplateOption[]>([])
  const [templateOptionsLoading, setTemplateOptionsLoading] = useState(false)
  const [templateOptionsLoaded, setTemplateOptionsLoaded] = useState(false)
  const [templateOptionsError, setTemplateOptionsError] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [templateSearchTerm, setTemplateSearchTerm] = useState('')
  const [selectingTemplateID, setSelectingTemplateID] = useState<string | null>(null)
  const [productLoading, setProductLoading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState<string | null>(null)
  const [sourceAsset, setSourceAsset] = useState<SourceAssetSummary | null>(null)
  const [slotAssets, setSlotAssets] = useState<Record<string, { asset: SourceAssetSummary; previewUrl: string }>>({})
  const [missingSlotKeys, setMissingSlotKeys] = useState<string[]>([])
  const [results, setResults] = useState<GeneratedResult[]>([])
  const [activeJobID, setActiveJobID] = useState<string | null>(null)
  const [pollingJobID, setPollingJobID] = useState<string | null>(null)
  const localizedTool = getLocalizedTool(tool, i18n.resolvedLanguage ?? i18n.language)
  const resetJobState = useCallback(() => { setActiveJobID(null)
    setPollingJobID(null) }, [setActiveJobID, setPollingJobID])
  const resetSourceState = useCallback((options?: { clearPrompt?: boolean; clearFileInput?: boolean; clearResults?: boolean }) => { setSourcePreviewUrl(null)
    setSourceAsset(null)
    setSlotAssets({})
    setMissingSlotKeys([])
    resetJobState()
    if (options?.clearPrompt) { setPrompt('')
    }
    if (options?.clearResults) { setResults([])
    }
    if (options?.clearFileInput && fileInputRef.current) { fileInputRef.current.value = ''
    } }, [resetJobState, setMissingSlotKeys, setPrompt, setResults, setSlotAssets, setSourceAsset, setSourcePreviewUrl])
  const activeInputMode = activeTemplate?.inputMode ?? tool.inputMode
  const activeAssetRequirements = activeInputMode === 'text_to_image'
    ? []
    : activeTemplate?.assetRequirements.length
      ? activeTemplate.assetRequirements.filter(item => item.fieldType.includes('image'))
      : normalizeToolAssetRequirements(tool.requiredAssets)
  const sourceGuide = (() => {
    const fallback = defaultAssetGuide(locale, tool.slug)
    if (activeInputMode === 'text_to_image') {
      return {
        title: copy(locale, '用文字描述生成场景', 'Generate from description'),
        helper: copy(locale, '这个工具不需要上传图片，填写清晰的画面描述即可开始生成。', 'No upload is required for this tool. Describe the scene clearly to generate.'),
        requirements: [] as AssetRequirement[],
        warning: undefined,
      }
    }
    const imageRequirements = activeAssetRequirements
    const primaryRequirement = imageRequirements.find(item => item.required) ?? imageRequirements[0]
    return { title: primaryRequirement
        ? copy( locale,
            `上传${formatAssetLabel(locale, primaryRequirement.label)}`, `Upload ${formatAssetLabel(locale, primaryRequirement.label)}`,
          ) : fallback.title,
      helper: imageRequirements.length > 0 ? copy(
            locale, `按素材槽上传: ${imageRequirements.map(item => formatAssetLabel(locale, item.label)).join(' / ')}`,
            `Upload by slot: ${imageRequirements.map(item => formatAssetLabel(locale, item.label)).join(' / ')}`, )
        : fallback.helper, requirements: imageRequirements,
      warning: activeTemplate?.sourceWarning, }
  })()
  useEffect(() => { resultObjectURLsRef.current.forEach(url => URL.revokeObjectURL(url))
    resultObjectURLsRef.current = []
    resultPreviewByAssetIDRef.current = {}
    notifiedJobIDsRef.current.clear()
    resetSourceState({ clearPrompt: true, clearResults: true })
    setNegativePrompt('')
    setActiveTemplate(null)
    setTemplateOptions([])
    setSelectingTemplateID(null) }, [resetSourceState, tool.slug])
  useEffect(() => {
    let canceled = false
    const loadCurrentProduct = async () => { setProductLoading(true)
      try {
        const detail = await getProduct(productId)
        if (!canceled) { setSelectedProduct(detail.product)
        } } catch {
        if (!canceled) { setSelectedProduct(null)
        } } finally {
        if (!canceled) { setProductLoading(false)
        } }
    }
    void loadCurrentProduct()
    return () => { canceled = true
    } }, [productId])
  const applyTemplatePayload = useCallback((payload: TemplateUseResponse, options?: { replacePrompt?: boolean; fallbackId?: string }) => {
    const replacePrompt = options?.replacePrompt ?? false
    const templateID = typeof payload.preloadedTemplatePayload?.templateId === 'string'
        ? payload.preloadedTemplatePayload.templateId : (options?.fallbackId || '')
    const externalCode = typeof payload.preloadedTemplatePayload?.externalCode === 'string'
        ? payload.preloadedTemplatePayload.externalCode : ''
    const templateName = typeof payload.preloadedTemplatePayload?.templateName === 'string'
        ? payload.preloadedTemplatePayload.templateName : (options?.fallbackId || '')
    const defaultVariablesRaw = payload.preloadedTemplatePayload?.defaultVariables
    const defaultVariablesRecord = defaultVariablesRaw && typeof defaultVariablesRaw === 'object'
        ? (defaultVariablesRaw as Record<string, unknown>) : undefined
    const defaultVariables = defaultVariablesRecord
        ? Object.entries(defaultVariablesRaw as Record<string, unknown>).map( ([key, value]) => [key, String(value)] as [string, string],
          ) : []
    const inputSchema = payload.prefilledInputSchema && typeof payload.prefilledInputSchema === 'object'
        ? (payload.prefilledInputSchema as Record<string, unknown>) : undefined
    const assetRequirements = payload.requiredAssets?.length ? normalizeToolAssetRequirements(payload.requiredAssets) : normalizeAssetRequirements(inputSchema, defaultVariablesRecord)
    const templateInputMode = normalizeInputMode(
      payload.inputMode
      || inputSchema?.input_mode
      || inputSchema?.inputMode
      || payload.applicability?.inputMode,
      tool.inputMode,
    )
    if (templateName) { setActiveTemplate({
        id: templateID, templateCode: externalCode || templateID || templateName,
        name: templateName, executorType:
          typeof payload.preloadedTemplatePayload?.executorType === 'string' ? payload.preloadedTemplatePayload.executorType
            : payload.executorType, modality:
          typeof payload.preloadedTemplatePayload?.modality === 'string' ? payload.preloadedTemplatePayload.modality
            : 'image', inputMode: templateInputMode, defaultVariables,
        assetRequirements, sourceWarning: undefined, })
    }
    const injectedNegativePrompt = readFirstString(defaultVariablesRecord, ['negativePrompt', 'negative_prompt'])
    const injectedPrompt = readFirstString(defaultVariablesRecord, [
      'prompt', 'positivePrompt', 'positive_prompt', 'generationPrompt', 'generation_prompt',
      'composed_prompt_text', 'creative_brief', 'stylePrompt', 'style_prompt',
    ]) || readFirstString(payload.preloadedTemplatePayload as Record<string, unknown> | undefined, [
      'prompt', 'promptText', 'prompt_text', 'positivePrompt', 'positive_prompt', 'generationPrompt', 'generation_prompt',
    ]) || (templateName ? copy(locale,
      `按「${templateName}」的模特、姿态和画面风格，为当前商品生成一张完整清晰的商品图。`,
      `Generate a complete, clear product image using the model, pose, and visual style of ${templateName}.`,
    ) : '')
    setPrompt(current => {
      if (replacePrompt) {
        return injectedPrompt || '' }
      if (!current.trim() && injectedPrompt) {
        return injectedPrompt }
      return current })
    setNegativePrompt(current => {
      if (replacePrompt) {
        return injectedNegativePrompt || '' }
      if (!current.trim() && injectedNegativePrompt) {
        return injectedNegativePrompt }
      return current })
  }, [locale, setActiveTemplate, setNegativePrompt, setPrompt, tool.inputMode])
  const loadTemplateOptions = useCallback(async (force: boolean = false) => {
    const providerCapability = providerCapabilityForInputMode(tool.inputMode)
    const requestKey = JSON.stringify({ locale, toolSlug: tool.slug, inputMode: tool.inputMode,
      productCategory: selectedProduct?.categoryId ?? '',
      platform: selectedProduct?.listingVersions?.[0]?.platform ?? '', providerCapability })
    if (templateOptionsLoadingRef.current) return
    if (!force && templateOptionsRequestKeyRef.current === requestKey && templateOptionsLoaded && !templateOptionsError) return
    templateOptionsLoadingRef.current = true
    setTemplateOptionsLoading(true)
    setTemplateOptionsError('')
    try {
      const items = await listCatalog({ locale,
        toolSlug: tool.slug, inputMode: tool.inputMode,
        productCategory: selectedProduct?.categoryId,
        platform: selectedProduct?.listingVersions?.[0]?.platform,
        providerCapability: providerCapabilityForInputMode(tool.inputMode),
        sortBy: 'recommended',
      })
      const matched = items .sort((left, right) => right.recommendScore - left.recommendScore)
        .map(item => ({ id: item.id,
          slug: item.slug, toolSlug: item.toolSlug,
          name: item.name, summary: item.summary,
          externalCode: item.externalCode, recommendScore: item.recommendScore,
          coverAssetUrl: item.coverAssetUrl, }))
      setTemplateOptions(matched)
      setTemplateOptionsLoaded(true)
      templateOptionsRequestKeyRef.current = requestKey
      setActiveTemplate(prev => {
        if (prev && prev.name === prev.id) {
          const found = matched.find(m => m.id === prev.id)
          if (found) {
            return { ...prev, name: found.name, templateCode: found.externalCode || prev.templateCode } }
        }
        return prev })
    } catch { setTemplateOptions([])
      setTemplateOptionsLoaded(true)
      setTemplateOptionsError(copy(locale, '模板加载失败，请重试', 'Failed to load templates. Please retry.')) } finally {
      templateOptionsLoadingRef.current = false
      setTemplateOptionsLoading(false) }
  }, [locale, selectedProduct, setActiveTemplate, setTemplateOptions, setTemplateOptionsError, setTemplateOptionsLoaded, setTemplateOptionsLoading, templateOptionsError, templateOptionsLoaded, tool.inputMode, tool.slug])
  useEffect(() => {
    const payloadFromLocation = (location.state as ToolPageLocationState | null)?.templateUsePayload
    const payload = payloadFromLocation ?? loadUseTemplatePayload()
    if (!payload) return
    const route = typeof payload.targetRoute === 'string' ? payload.targetRoute : ''
    const slug = typeof payload.toolSlug === 'string' ? payload.toolSlug : ''
    if (!route.includes(tool.slug) && slug !== tool.slug) return
    const payloadKey = JSON.stringify({ route,
      slug, templateId: payload.preloadedTemplatePayload?.templateId ?? '',
      externalCode: payload.preloadedTemplatePayload?.externalCode ?? '', templateName: payload.preloadedTemplatePayload?.templateName ?? '',
    })
    if (consumedTemplatePayloadKeyRef.current === payloadKey) { return
    }
    applyTemplatePayload(payload, { replacePrompt: true,
      fallbackId: payload.prefilledInputSchema?.templateId as string | undefined, })
    consumedTemplatePayloadKeyRef.current = payloadKey
    clearUseTemplatePayload()
    if (payloadFromLocation) { navigate(`${location.pathname}${location.search}`, { replace: true, state: null })
    } }, [applyTemplatePayload, location.pathname, location.search, location.state, navigate, tool.slug])
  useEffect(() => { templateOptionsRequestKeyRef.current = ''
    setTemplateOptions([])
    setTemplateOptionsLoaded(false)
    setTemplateOptionsError('')
    void loadTemplateOptions(true) }, [loadTemplateOptions])
  useEffect(() => {
    if (!pickerOpen) return
    if (!templateOptionsLoaded || templateOptions.length === 0 || templateOptionsError) { void loadTemplateOptions(true)
    } }, [loadTemplateOptions, pickerOpen, templateOptions.length, templateOptionsError, templateOptionsLoaded])
  useEffect(() => {
    return () => { resultObjectURLsRef.current.forEach(url => URL.revokeObjectURL(url))
    } }, [])
  const saveWorkflowEvent = useCallback((titleZh: string, titleEn: string, detailZh: string, detailEn: string) => {
    const createdAt = new Date().toISOString()
    void productWorkspaceRepository.saveWorkflowEvent({ id: `tool-runtime-${Date.now()}`,
      module: 'design', title: { zh: titleZh, en: titleEn },
      detail: { zh: detailZh, en: detailEn }, createdAt,
    }) }, [])
  const upsertResult = useCallback((job: ImageJobSummary, previewUrl?: string) => {
    const status = mapJobStatus(job.status)
    const title = copy( locale,
      `${localizedTool.name} 任务 ${job.job_id.slice(-4)}`, `${localizedTool.name} Job ${job.job_id.slice(-4)}`,
    )
    const nextItem: GeneratedResult = { id: job.job_id,
      title, status,
      hint: job.stage_message || copy(locale, '任务已创建，等待处理', 'Job created and waiting for processing'), progress: job.progress ?? 0,
      assetId: job.selected_result_asset_id, previewUrl,
    }
    setResults(prev => {
      const current = prev.find(item => item.id === job.job_id)
      const merged: GeneratedResult = current ? {
            ...current, ...nextItem,
            sourceAssetId: job.source_asset_id || current.sourceAssetId, previewUrl: previewUrl ?? current.previewUrl,
          } : {
            ...nextItem, sourceAssetId: job.source_asset_id,
          }
      const remaining = prev.filter(item => item.id !== job.job_id)
      return [merged, ...remaining].slice(0, 6) })
  }, [locale, localizedTool.name])
  const applyJobSummary = useCallback(async (job: ImageJobSummary) => { upsertResult(job)
    if (job.selected_result_asset_id) {
      const cachedPreviewUrl = resultPreviewByAssetIDRef.current[job.selected_result_asset_id]
      if (cachedPreviewUrl) { upsertResult(job, cachedPreviewUrl)
        return
      }
      try {
        const previewUrl = await fetchAssetObjectURL(job.selected_result_asset_id)
        resultObjectURLsRef.current.push(previewUrl)
        resultPreviewByAssetIDRef.current[job.selected_result_asset_id] = previewUrl
        upsertResult(job, previewUrl) } catch {
        // Keep status and metadata visible even if the preview content cannot be loaded yet.
      } }
  }, [upsertResult])
  useEffect(() => {
    let canceled = false
    const loadHistory = async () => {
      if (!productId) { setResults([])
        resetJobState()
        return
      }
      try {
        const jobs = await listImageJobs({ sceneType: toolToSceneType(tool.slug), productId, limit: 6 })
        if (canceled) return
        setResults([])
        for (const job of jobs) {
           
          await applyJobSummary(job) }
        const activeJob = jobs.find(job => !isTerminalStatus(job.status)) || jobs[0]
        if (activeJob) { setActiveJobID(activeJob.job_id)
          if (!isTerminalStatus(activeJob.status)) { setPollingJobID(activeJob.job_id)
          } else { setPollingJobID(null)
          } }
      } catch {
        // Keep the tool usable even if history loading fails.
      } }
    void loadHistory()
    return () => { canceled = true
    } }, [applyJobSummary, productId, resetJobState, tool.slug])
  useEffect(() => {
    if (!pollingJobID) return
    let canceled = false
    const poll = async () => {
      try {
        const job = await getImageJob(pollingJobID)
        if (canceled) return
        await applyJobSummary(job)
        if (isTerminalStatus(job.status)) { setPollingJobID(current => (current === job.job_id ? null : current))
          if (!notifiedJobIDsRef.current.has(job.job_id)) { notifiedJobIDsRef.current.add(job.job_id)
            if (job.status === 'completed') { saveWorkflowEvent(
                `${localizedTool.name} 已完成生成`, `${localizedTool.name} generation completed`,
                `任务 ${job.job_id.slice(-6)} 已完成，可继续送往设计器或下载中心`, `Job ${job.job_id.slice(-6)} is ready for designer or download-center flows`,
              ) } else {
              saveWorkflowEvent( `${localizedTool.name} 生成失败`,
                `${localizedTool.name} generation failed`, job.last_error_message || '请检查提示词、源图或稍后重试',
                job.last_error_message || 'Check the prompt, source image, or try again later', )
            } }
        } } catch {
        if (!canceled) {
          // Toast will be shown globally
        } }
    }
    void poll()
    const timer = window.setInterval(() => { void poll()
    }, 2500)
    return () => { canceled = true
      window.clearInterval(timer) }
  }, [pollingJobID, applyJobSummary, locale, localizedTool.name, saveWorkflowEvent])
  const currentResult = activeJobID ? results.find(item => item.id === activeJobID) ?? null
    : null
  const primarySlot = activeAssetRequirements.find(item => item.role === 'primary' || item.slot === 'primary') ?? activeAssetRequirements.find(item => item.required) ?? activeAssetRequirements[0]
  const pendingUploadRequirement = activeAssetRequirements.find(item => item.slot === pendingUploadSlot) ?? primarySlot
  const legacySource = selectLegacySourceAsset(slotAssets, activeAssetRequirements)
  const currentSourceAsset = legacySource?.asset ?? (currentResult?.sourceAssetId ? buildHistorySourceAsset(currentResult.sourceAssetId) : null)
  const currentSlotPreview = legacySource?.previewUrl
  const currentSourcePreviewUrl = currentSlotPreview ?? (currentSourceAsset?.id === sourceAsset?.id ? sourcePreviewUrl : null)
  const isProcessing = creatingJob || uploadingSource || currentResult?.status === 'running' || currentResult?.status === 'queued'
  const hasValidCanvas = activeInputMode === 'text_to_image' || currentSourcePreviewUrl || currentResult?.previewUrl || isProcessing
  const handleSelectFile = (slot = activeAssetRequirements[0]?.slot ?? 'primary') => {
    if (activeInputMode === 'text_to_image') return
    if (!selectedProduct) { showToast(copy(locale, '请先选择一个商品，再上传素材。', 'Select a product before uploading an asset.'), 'error')
      return
    }
    pendingUploadSlotRef.current = slot
    setPendingUploadSlot(slot)
    if (fileInputRef.current) fileInputRef.current.accept = assetAccept(activeAssetRequirements.find(item => item.slot === slot) ?? activeAssetRequirements[0])
    fileInputRef.current?.click() }
  const handleClearSource = () => { resetSourceState({ clearPrompt: true, clearFileInput: true })
  }
  const handleClearSlot = (slot: string) => {
    setSlotAssets(current => {
      const next = { ...current }
      delete next[slot]
      const first = Object.values(next)[0]
      setSourceAsset(first?.asset ?? null)
      setSourcePreviewUrl(first?.previewUrl ?? null)
      return next
    })
    setMissingSlotKeys(current => current.filter(item => item !== slot))
    resetJobState()
  }
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (activeInputMode === 'text_to_image') return
    if (!selectedProduct) { showToast(copy(locale, '请先选择一个商品，再上传源图。', 'Select a product before uploading a source image.'), 'error')
      return
    }
    const slot = pendingUploadSlotRef.current || activeAssetRequirements[0]?.slot || 'primary'
    const requirement = activeAssetRequirements.find(item => item.slot === slot) ?? activeAssetRequirements[0]
    if (!isFileAccepted(file, requirement)) {
      showToast(copy(locale, `文件类型不符合 ${formatAssetLabel(locale, requirement?.label ?? slot)} 要求: ${requirement?.acceptedTypes.join(', ') || 'image/png,image/jpeg,image/webp'}`, `File type is not allowed for ${formatAssetLabel(locale, requirement?.label ?? slot)}: ${requirement?.acceptedTypes.join(', ') || 'image/png,image/jpeg,image/webp'}`), 'error')
      return
    }
    if (requirement?.maxSizeMB && file.size > requirement.maxSizeMB * 1024 * 1024) {
      showToast(copy(locale, `文件超过 ${requirement.maxSizeMB}MB 限制。`, `File exceeds the ${requirement.maxSizeMB}MB limit.`), 'error')
      return
    }
    setUploadingSource(true)
    resetJobState()
    const localPreviewUrl = await fileToDataURL(file)
    setSourcePreviewUrl(localPreviewUrl)
    try {
      const dimensions = await getImageDimensions(file)
      const payload = await fileToDataURL(file)
      const registered = await registerSourceAsset({ productId,
        skuCode: selectedProduct.skuCode, fileName: file.name,
        mimeType: file.type || 'image/png', payload,
        width: dimensions.width, height: dimensions.height,
        metadata: {
          tool_slug: tool.slug,
          input_mode: activeInputMode,
          slot,
          role: requirement?.role,
          label: requirement?.label,
          template_id: activeTemplate?.id,
          template_code: activeTemplate?.templateCode,
          template_name: activeTemplate?.name,
        }, })
      setSourceAsset(registered)
      setSlotAssets(current => ({ ...current, [slot]: { asset: registered, previewUrl: localPreviewUrl } }))
      setMissingSlotKeys(current => current.filter(item => item !== slot))
      saveWorkflowEvent( '源图已完成登记',
        'Source image registered', `${file.name} 已同步到业务资产层，可直接发起生成任务`,
        `${file.name} is registered and ready for generation`, )
    } catch {
      // Global toast handles API errors
      setSourceAsset(null) } finally {
      setUploadingSource(false) }
  }
  const handleGenerate = async () => {
    if (creatingJob || uploadingSource) return
    const requiredMissing = activeAssetRequirements.filter(item => item.required && !slotAssets[item.slot]?.asset)
    if (requiredMissing.length > 0) {
      setMissingSlotKeys(requiredMissing.map(item => item.slot))
      showToast(copy(locale, `请先补齐必需素材: ${requiredMissing.map(item => formatAssetLabel(locale, item.label)).join('、')}`, `Add required assets first: ${requiredMissing.map(item => formatAssetLabel(locale, item.label)).join(', ')}`), 'error')
      return
    }
    if (activeInputMode !== 'text_to_image' && !currentSourceAsset) { showToast(copy(locale, '请先上传必需素材，再开始生成。', 'Upload required assets before starting generation.'), 'error')
      return
    }
    if (!prompt.trim()) { showToast(copy(locale, '请先填写生成描述。', 'Enter a prompt before starting generation.'), 'error')
      return
    }
    if (!selectedProduct) { showToast(copy(locale, '请先绑定一个商品，再发起生成。', 'Bind a product before starting generation.'), 'error')
      return
    }
    setCreatingJob(true)
    const sourceAssets: SourceAssetInput[] = activeAssetRequirements.reduce<SourceAssetInput[]>((items, requirement) => {
      const slotAsset = slotAssets[requirement.slot]?.asset
      if (slotAsset) {
        items.push({ slot: requirement.slot, role: requirement.role, asset_id: slotAsset.id, label: requirement.label, required: requirement.required })
      }
      return items
    }, [])
    const compatibleSourceAsset = sourceAssets.find(item => item.slot === 'primary' || item.role === 'primary' || item.role === 'product') ?? sourceAssets[0]
    try {
      const job = await createImageJob({ productId,
        skuCode: selectedProduct.skuCode, sceneType: toolToSceneType(tool.slug),
        inputMode: activeInputMode, sourceAssetID: activeInputMode === 'text_to_image' ? undefined : (compatibleSourceAsset?.asset_id ?? currentSourceAsset?.id),
        sourceAssets, prompt,
        negativePrompt, objective: 'quality',
        requestedVariants: 1, width: activeInputMode === 'text_to_image' ? undefined : (currentSourceAsset?.width || undefined),
        height: activeInputMode === 'text_to_image' ? undefined : (currentSourceAsset?.height || undefined), templateCode: activeTemplate?.templateCode,
      })
      await applyJobSummary(job)
      setActiveJobID(job.job_id)
      setPollingJobID(job.job_id)
      saveWorkflowEvent( `${localizedTool.name} 任务已创建`,
        `${localizedTool.name} job created`, `任务 ${job.job_id.slice(-6)} 已提交到生成队列，正在排队处理`,
        `Job ${job.job_id.slice(-6)} has been queued for generation`, )
    } catch {
      // Global toast handles API errors
    } finally { setCreatingJob(false)
    } }
  const handleCancelJob = async () => {
    if (!pollingJobID || cancelingJob) return
    setCancelingJob(true)
    try {
      const job = await cancelImageJob(pollingJobID)
      await applyJobSummary(job)
      setPollingJobID(null)
      setActiveJobID(job.job_id)
      saveWorkflowEvent( `${localizedTool.name} 任务已取消`,
        `${localizedTool.name} job canceled`, `任务 ${job.job_id.slice(-6)} 已取消，不再阻塞当前工作区`,
        `Job ${job.job_id.slice(-6)} has been canceled and no longer blocks the workspace`, )
      showToast(copy(locale, '任务已取消', 'Job canceled'), 'success') } catch {
      // Global toast handles API errors
    } finally { setCancelingJob(false)
    } }
  const handleSelectTemplatePlan = async (template: ToolTemplateOption) => {
    if (selectingTemplateID) return
    setSelectingTemplateID(template.id)
    try {
      const payload = await executeTemplateNow(template.id)
      applyTemplatePayload(payload, { replacePrompt: true }) } catch {
      // API error toast
    } finally { setSelectingTemplateID(null)
    } }
  const filteredTemplateOptions = templateOptions.filter(item =>
    item.name.toLowerCase().includes(templateSearchTerm.toLowerCase()) ||
    item.summary.toLowerCase().includes(templateSearchTerm.toLowerCase())
  )
  return ( <div className="min-h-screen bg-[var(--ecom-surface)] flex flex-col relative overflow-x-hidden">
      <input
        ref={fileInputRef}
        type="file"
        accept={assetAccept(pendingUploadRequirement)}
        disabled={activeInputMode === 'text_to_image'}
        className="hidden"
        onChange={event => { void handleFileChange(event)
        }}
      />
      {/* Header */}
      <header className="absolute top-0 w-full z-40 p-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <Link
            to={selectedProduct ? `/products/${selectedProduct.id}` : '/products/workbench/visual-tools'}
            className="glass-strong rounded-xl p-2.5 text-white/60 hover:text-white transition-colors border border-white/10 hover:border-white/20"
          >
            <ArrowLeft size={18} /> </Link>
          <div className="glass-strong rounded-2xl px-4 py-2 flex items-center gap-3 border border-white/10 shadow-lg">
            <span className="text-xl drop-shadow-md">{localizedTool.icon}</span>
            <span className="font-bold text-white/90 text-sm tracking-wide">{localizedTool.name}</span>
            <div className="h-4 w-px bg-white/20"></div>
            <span className="text-xs font-medium text-white/50">{localizedTool.desc}</span> </div>
        </div> </header>
      {/* Main Canvas Area */}
      <main className="relative z-10 flex min-h-screen w-full flex-col items-center justify-center px-4 pb-36 pt-24">
        {/* Ambient Glow */}
        <div className="pointer-events-none absolute -right-40 top-0 h-[600px] w-[600px] rounded-full bg-brand-500/10 blur-[120px]" />
        <div className="pointer-events-none absolute -left-40 bottom-0 h-[600px] w-[600px] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="w-full max-w-4xl mx-auto mb-6 z-20">
          <div className="glass-strong rounded-3xl border border-white/10 px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-white">
                {copy(locale, '商品上下文 AI 工作区', 'Product-scoped AI workspace')} </div>
              <div className="mt-1 text-xs text-white/45">
                {selectedProduct ? copy(locale, `当前绑定 ${selectedProduct.skuCode} · ${selectedProduct.title}`, `Bound to ${selectedProduct.skuCode} · ${selectedProduct.title}`)
                  : copy(locale, '所有源图和生成结果都会自动沉淀到这个商品素材区。', 'Source images and generated results are archived into this product.')} </div>
            </div>
            <div className="rounded-2xl border border-brand-500/20 bg-brand-500/10 px-4 py-3 text-sm text-brand-200">
              {productLoading ? copy(locale, '正在加载商品上下文...', 'Loading product context...')
                : selectedProduct ? copy(locale, '商品上下文由商品工作台注入，AI 结果会直接归档到该商品。', 'Product context is injected by the workbench and results are archived into this product.')
                  : copy(locale, '未找到商品上下文，请返回商品工作台重新进入。', 'Missing product context. Return to the product workbench.')} </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              to="/products"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              {copy(locale, '商品首页', 'Product home')} </Link>
            <Link
              to="/products/workbench/visual-tools"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              {copy(locale, '返回工具选择', 'Back to tool picker')} </Link>
            <Link
              to="/products/workbench/downloads"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              {copy(locale, '下载中心', 'Download center')} </Link>
            {selectedProduct ? ( <Link
                to={`/products/${selectedProduct.id}`}
                className="rounded-xl border border-brand-500/20 bg-brand-500/10 px-3 py-2 text-sm text-brand-200 transition hover:bg-brand-500/20"
              >
                {copy(locale, '查看当前商品', 'Open current product')} </Link>
            ) : null} </div>
        </div>
        <ToolAssetSlotPanel
          locale={locale}
          requirements={activeAssetRequirements}
          slotAssets={slotAssets}
          missingSlotKeys={missingSlotKeys}
          uploadingSource={uploadingSource}
          onSelectFile={handleSelectFile}
          onClearSlot={handleClearSlot}
        />
        {!hasValidCanvas ? ( <div className="w-full max-w-4xl mx-auto flex flex-col items-center z-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* Upload Dropzone */}
            <Button
              onClick={() => handleSelectFile()}
              disabled={uploadingSource}
              className={`relative h-auto min-h-[270px] whitespace-normal w-full max-w-2xl aspect-[16/9] rounded-[32px] border-2 border-dashed transition-colors duration-500 group flex flex-col items-center justify-center backdrop-blur-xl overflow-hidden ${ uploadingSource
                  ? 'border-brand-500/50 bg-brand-500/5 cursor-wait' : 'border-white/10 hover:border-brand-500/40 hover:bg-brand-500/5 hover:shadow-[0_0_40px_rgba(var(--brand-500),0.15)] bg-white/[0.02]'
              }`}
            >
              {/* Magical Ambient Grid Background */}
              <div
                className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(rgba(255, 255, 255, 1) 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}
              />
              {/* Dynamic Glow Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
              <div className="relative z-10 flex flex-col items-center">
                {uploadingSource ? ( <div className="flex flex-col items-center gap-4">
                    <Loader2 size={48} className="text-brand-400 animate-spin" />
                    <h3 className="text-xl font-bold text-white tracking-wide">{copy(locale, '正在解析源图...', 'Analyzing source...')}</h3> </div>
                ) : ( <>
                    <div className="w-24 h-24 rounded-[24px] bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-brand-500/20 group-hover:border-brand-500/30 group-hover:text-brand-300 transition-colors duration-500 shadow-2xl relative">
                      <div className="absolute inset-0 bg-brand-400/20 rounded-[24px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <Upload className="text-white/50 group-hover:text-brand-400 transition-colors relative z-10" size={40} strokeWidth={1.5} /> </div>
                    <h3 className="text-2xl font-black text-white/90 mb-3 tracking-tight">{sourceGuide.title}</h3>
                    <p className="text-sm font-medium text-white/40 max-w-sm text-center leading-relaxed">
                      {sourceGuide.helper} </p>
                    <div className="mt-8 flex gap-3">
                      {sourceGuide.requirements.map(item => ( <span key={item.slot} className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-semibold text-white/60 backdrop-blur-md" title={formatRequirementConstraints(locale, item)}>
                          {item.label} {item.required ? '*' : ''}{item.maxSizeMB ? ` · ≤${item.maxSizeMB}MB` : ''} </span>
                      ))} </div>
                  </> )}
              </div> </Button>
            <ToolTemplateGallery
              locale={locale}
              templateOptions={templateOptions}
              activeTemplateID={activeTemplate?.id}
              onSelect={(item) => { void handleSelectTemplatePlan(item) }}
            />
          </div>
        ) : ( <div className="relative z-20 flex w-full max-w-[min(1120px,calc(100vw-2rem))] items-center justify-center animate-in zoom-in-95 duration-500">
            {/* The Main Canvas */}
            <div data-testid="ai-product-canvas" className="relative flex w-full max-h-[min(70vh,720px)] min-h-[360px] items-center justify-center overflow-hidden rounded-[32px] border border-white/10 bg-black/60 shadow-2xl glass-strong">
              {/* Display Source Image if Result is not yet complete */}
              {activeInputMode === 'text_to_image' && !currentResult?.previewUrl && !isProcessing ? (
                <div className="px-8 text-center text-white/55">
                  <Sparkles className="mx-auto mb-4 text-brand-300" size={40} />
                  <div className="text-lg font-bold text-white">{copy(locale, '填写描述后即可生成', 'Describe the scene to generate')}</div>
                  <div className="mt-2 text-sm">{copy(locale, '无需上传图片素材，适合场景背景和概念图生成。', 'No image upload is needed for scene backgrounds and concept visuals.')}</div>
                </div>
              ) : null}
              {/* Display Source Image if Result is not yet complete */}
              {currentSourcePreviewUrl && !currentResult?.previewUrl && ( <div className="relative w-full h-full flex items-center justify-center group/source">
                  <img
                    data-testid="source-preview-image"
                    src={currentSourcePreviewUrl}
                    alt="Source"
                    className={`max-w-full max-h-full object-contain transition-colors duration-1000 ${isProcessing ? 'opacity-40 blur-md' : 'opacity-100'}`}
                  />
                  {!isProcessing && ( <Button
                      onClick={handleClearSource}
                      className="absolute top-4 right-4 bg-black/60 text-white/80 hover:text-white hover:bg-rose-500/80 hover:shadow-[0_0_20px_rgba(244,63,94,0.5)] border border-white/10 backdrop-blur-md rounded-full p-2.5 opacity-0 group-hover/source:opacity-100 transition-colors duration-300 z-50 transform hover:scale-110"
                      title={copy(locale, '清除当前图片', 'Clear image')}
                    >
                      <X size={18} strokeWidth={2.5} /> </Button>
                  )} </div>
              )}
              {/* Display Result Image */}
              {currentResult?.previewUrl && ( <div className="relative w-full h-full flex items-center justify-center group/result">
                  <img
                    data-testid="result-preview-image"
                    src={currentResult.previewUrl}
                    alt="Result"
                    className="max-w-full max-h-full object-contain animate-in fade-in duration-1000"
                  />
                  {!isProcessing && ( <Button
                      onClick={handleClearSource}
                      className="absolute top-4 right-4 bg-black/60 text-white/80 hover:text-white hover:bg-rose-500/80 hover:shadow-[0_0_20px_rgba(244,63,94,0.5)] border border-white/10 backdrop-blur-md rounded-full p-2.5 opacity-0 group-hover/result:opacity-100 transition-colors duration-300 z-50 transform hover:scale-110"
                      title={copy(locale, '清除当前图片', 'Clear image')}
                    >
                      <X size={18} strokeWidth={2.5} /> </Button>
                  )} </div>
              )}
              {/* Immersive Processing Overlay */}
              {isProcessing && ( <div className="absolute inset-0 z-30 flex flex-col items-center justify-center">
                  <div className="absolute inset-0 bg-brand-500/10 animate-pulse pointer-events-none" />
                  {/* Scanning Line */}
                  <div className="absolute left-0 w-full h-32 bg-gradient-to-b from-transparent via-brand-500/20 to-transparent animate-scan pointer-events-none" style={{ animationDuration: '3s' }} />
                  <div className="glass-strong rounded-3xl px-8 py-6 flex flex-col items-center gap-4 shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 backdrop-blur-2xl">
                    <div className="relative flex items-center justify-center w-16 h-16">
                      <div className="absolute inset-0 rounded-full border-4 border-brand-500/20"></div>
                      <div className="absolute inset-0 rounded-full border-4 border-brand-500 border-t-transparent animate-spin"></div>
                      <Sparkles className="text-brand-400 animate-pulse" size={24} /> </div>
                    <div className="text-center">
                      <p className="text-base font-bold text-white tracking-wide">
                        {currentResult?.hint || copy(locale, 'AI 正在施展魔法...', 'AI is working its magic...')} </p>
                      <p className="text-xs font-medium text-white/40 mt-1 uppercase tracking-widest">
                        {copy(locale, '请耐心等待，见证奇迹', 'Please wait, witnessing magic')} </p>
                    </div> </div>
                </div> )}
            </div> </div>
        )} </main>
      <ToolPromptBar
        locale={locale}
        activeInputMode={activeInputMode}
        activeTemplateName={activeTemplate?.name}
        currentSourceAsset={currentSourceAsset}
        prompt={prompt}
        setPrompt={setPrompt}
        creatingJob={creatingJob}
        uploadingSource={uploadingSource}
        selectedProduct={selectedProduct}
        productLoading={productLoading}
        pollingJobID={pollingJobID}
        cancelingJob={cancelingJob}
        onSelectFile={() => handleSelectFile()}
        onOpenTemplates={() => { setPickerOpen(true); void loadTemplateOptions(!templateOptionsLoaded || templateOptions.length === 0) }}
        onGenerate={() => { void handleGenerate() }}
        onCancelJob={() => { void handleCancelJob() }}
      />
      {/* History Drawer (Right Side Filmstrip) */}
      {results.filter(r => r.status !== 'failed').length > 0 ? ( <div className="absolute top-1/2 right-6 -translate-y-1/2 z-40 transition-colors duration-700">
        <div className="glass-strong rounded-[24px] p-3 border border-white/10 flex flex-col gap-3 shadow-2xl backdrop-blur-2xl">
           <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] text-center pb-2 border-b border-white/5">
             {copy(locale, '历史记录', 'History')} </div>
           <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto scrollbar-hide pt-1 pb-1">
             {results.filter(r => r.status !== 'failed').map(res => ( <Button
                  key={res.id}
                  onClick={() => { resetSourceState()
                    setActiveJobID(res.id) }}
                  className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors duration-300 ${ res.id === currentResult?.id
                      ? 'border-brand-400 scale-110 shadow-[0_0_20px_rgba(var(--brand-500),0.5)] z-10' : 'border-white/10 hover:border-white/30 opacity-50 hover:opacity-100'
                  }`}
                >
                  {res.previewUrl ? ( <img src={res.previewUrl} className="w-full h-full object-cover" alt="History" />
                  ) : ( <div className="w-full h-full flex items-center justify-center bg-white/5">
                        <Loader2 size={16} className="text-brand-400 animate-spin" /> </div>
                  )} </Button>
             ))} </div>
        </div> </div> ) : null}
      <ToolTemplatePicker
        open={pickerOpen}
        locale={locale}
        templateSearchTerm={templateSearchTerm}
        setTemplateSearchTerm={setTemplateSearchTerm}
        templateOptionsLoading={templateOptionsLoading}
        templateOptionsError={templateOptionsError}
        filteredTemplateOptions={filteredTemplateOptions}
        activeTemplateID={activeTemplate?.id}
        selectingTemplateID={selectingTemplateID}
        onClose={() => setPickerOpen(false)}
        onRetry={() => { void loadTemplateOptions(true) }}
        onSelect={(item) => { void handleSelectTemplatePlan(item); setPickerOpen(false) }}
      />
    </div>
  ) }
export default function ToolPage() {
  const { toolSlug } = useParams()
  if (!toolSlug) return <ToolNotFoundView />
  return <Navigate to={`/products/workbench/visual-tools/${toolSlug}`} replace /> }
export function ProductScopedToolPage() {
  const { toolSlug, productId } = useParams()
  const tool = TOOLS.find((t) => t.slug === toolSlug)
  if (!tool || !productId) return <ToolNotFoundView />
  return <ToolContent tool={tool} productId={productId} /> }
