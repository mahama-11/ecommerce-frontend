import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams, Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useToastStore } from '@/store/toastStore'
import { ArrowLeft, Loader2, Sparkles, Upload, Image as ImageIcon, Wand2, X, ChevronRight, Play, Search } from 'lucide-react'
import { TOOLS, getLocalizedTool } from '@/mock/data'
import type { ToolDef } from '@/types/tool'
import { productWorkspaceRepository } from '@/repositories/productWorkspace'
import {
  cancelImageJob,
  createImageJob,
  fetchAssetObjectURL,
  getImageJob,
  listImageJobs,
  registerSourceAsset,
  type ImageJobSummary,
  type SourceAssetSummary,
} from '@/services/imageRuntime'
import {
  clearUseTemplatePayload,
  listCatalog,
  loadUseTemplatePayload,
  type TemplateUseResponse,
  useTemplateNow,
} from '@/services/templateCenter'
import { getProduct } from '@/services/product'
import type { Product } from '@/types/product'
import { ToolNotFoundView } from './tool-page/components/ToolNotFoundView'
import type { ActiveTemplateState, AssetRequirement, GeneratedResult, Locale, ToolTemplateOption } from './tool-page/types'
import {
  copy,
  defaultAssetGuide,
  fileToDataURL,
  getImageDimensions,
  isTerminalStatus,
  mapJobStatus,
  normalizeAssetRequirements,
  toolToSceneType,
  formatAssetLabel,
} from './tool-page/utils'
import { Z_INDEX } from '@/styles/zIndex'

type ToolPageLocationState = {
  templateUsePayload?: TemplateUseResponse
}

type ToolContentProps = {
  tool: ToolDef
  productId: string
}

function buildHistorySourceAsset(sourceAssetID: string): SourceAssetSummary {
  return {
    id: sourceAssetID,
    asset_type: 'image',
    source_type: 'history',
    storage_key: '',
    mime_type: 'image/png',
    width: 0,
    height: 0,
    file_name: 'history-source',
  }
}

function ToolContent({ tool, productId }: ToolContentProps) {
  const { i18n } = useTranslation()
  const { showToast } = useToastStore()
  const locale: Locale = (i18n.resolvedLanguage ?? i18n.language).startsWith('en') ? 'en' : 'zh'
  const location = useLocation()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
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
  const [results, setResults] = useState<GeneratedResult[]>([])
  const [activeJobID, setActiveJobID] = useState<string | null>(null)
  const [pollingJobID, setPollingJobID] = useState<string | null>(null)
  const localizedTool = getLocalizedTool(tool, i18n.resolvedLanguage ?? i18n.language)
  const resetJobState = useCallback(() => {
    setActiveJobID(null)
    setPollingJobID(null)
  }, [])
  const resetSourceState = useCallback((options?: { clearPrompt?: boolean; clearFileInput?: boolean; clearResults?: boolean }) => {
    setSourcePreviewUrl(null)
    setSourceAsset(null)
    resetJobState()
    if (options?.clearPrompt) {
      setPrompt('')
    }
    if (options?.clearResults) {
      setResults([])
    }
    if (options?.clearFileInput && fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [resetJobState])
  const sourceGuide = (() => {
    const fallback = defaultAssetGuide(locale, tool.slug)
    if (!activeTemplate) return { ...fallback, requirements: [] as AssetRequirement[] }
    const imageRequirements = activeTemplate.assetRequirements.filter(item => item.fieldType.includes('image'))
    const primaryRequirement = imageRequirements.find(item => item.required) ?? imageRequirements[0]
    return {
      title: primaryRequirement
        ? copy(
            locale,
            `上传${formatAssetLabel(locale, primaryRequirement.label)}`,
            `Upload ${formatAssetLabel(locale, primaryRequirement.label)}`,
          )
        : fallback.title,
      helper: imageRequirements.length > 0
        ? copy(
            locale,
            `模板建议素材: ${imageRequirements.map(item => formatAssetLabel(locale, item.label)).join(' / ')}`,
            `Recommended assets: ${imageRequirements.map(item => formatAssetLabel(locale, item.label)).join(' / ')}`,
          )
        : fallback.helper,
      requirements: imageRequirements,
      warning: activeTemplate.sourceWarning,
    }
  })()

  useEffect(() => {
    resultObjectURLsRef.current.forEach(url => URL.revokeObjectURL(url))
    resultObjectURLsRef.current = []
    resultPreviewByAssetIDRef.current = {}
    notifiedJobIDsRef.current.clear()
    resetSourceState({ clearPrompt: true, clearResults: true })
    setNegativePrompt('')
    setActiveTemplate(null)
    setTemplateOptions([])
    setSelectingTemplateID(null)
  }, [resetSourceState, tool.slug])

  useEffect(() => {
    let canceled = false
    const loadCurrentProduct = async () => {
      setProductLoading(true)
      try {
        const detail = await getProduct(productId)
        if (!canceled) {
          setSelectedProduct(detail.product)
        }
      } catch {
        if (!canceled) {
          setSelectedProduct(null)
        }
      } finally {
        if (!canceled) {
          setProductLoading(false)
        }
      }
    }
    void loadCurrentProduct()
    return () => {
      canceled = true
    }
  }, [productId])

  const applyTemplatePayload = useCallback((payload: TemplateUseResponse, options?: { replacePrompt?: boolean; fallbackId?: string }) => {
    const replacePrompt = options?.replacePrompt ?? false
    const templateID =
      typeof payload.preloadedTemplatePayload?.templateId === 'string'
        ? payload.preloadedTemplatePayload.templateId
        : (options?.fallbackId || '')
    const externalCode =
      typeof payload.preloadedTemplatePayload?.externalCode === 'string'
        ? payload.preloadedTemplatePayload.externalCode
        : ''
    const templateName =
      typeof payload.preloadedTemplatePayload?.templateName === 'string'
        ? payload.preloadedTemplatePayload.templateName
        : (options?.fallbackId || '')
    const defaultVariablesRaw = payload.preloadedTemplatePayload?.defaultVariables
    const defaultVariablesRecord =
      defaultVariablesRaw && typeof defaultVariablesRaw === 'object'
        ? (defaultVariablesRaw as Record<string, unknown>)
        : undefined
    const defaultVariables =
      defaultVariablesRecord
        ? Object.entries(defaultVariablesRaw as Record<string, unknown>).map(
            ([key, value]) => [key, String(value)] as [string, string],
          )
        : []
    const inputSchema =
      payload.prefilledInputSchema && typeof payload.prefilledInputSchema === 'object'
        ? (payload.prefilledInputSchema as Record<string, unknown>)
        : undefined
    const assetRequirements = normalizeAssetRequirements(inputSchema, defaultVariablesRecord)
    const imageRequirementCount = assetRequirements.filter(item => item.fieldType.includes('image')).length
    if (templateName) {
      setActiveTemplate({
        id: templateID,
        templateCode: externalCode || templateID || templateName,
        name: templateName,
        executorType:
          typeof payload.preloadedTemplatePayload?.executorType === 'string'
            ? payload.preloadedTemplatePayload.executorType
            : payload.executorType,
        modality:
          typeof payload.preloadedTemplatePayload?.modality === 'string'
            ? payload.preloadedTemplatePayload.modality
            : 'image',
        defaultVariables,
        assetRequirements,
        sourceWarning:
          imageRequirementCount > 1
            ? copy(
                locale,
                `当前模板标准输入包含 ${imageRequirementCount} 份图片素材，这一版工具页先支持选择 1 张主素材，其余多素材编排会在后续补齐。`,
                `This template normally uses ${imageRequirementCount} image assets. This page currently starts with one primary asset, and full multi-asset orchestration will come next.`,
              )
            : undefined,
      })
    }
    const injectedNegativePrompt =
      typeof defaultVariablesRecord?.negativePrompt === 'string'
        ? defaultVariablesRecord.negativePrompt
        : typeof defaultVariablesRecord?.negative_prompt === 'string'
          ? defaultVariablesRecord.negative_prompt
          : ''
    setNegativePrompt(current => {
      if (replacePrompt) {
        return injectedNegativePrompt || ''
      }
      if (!current.trim() && injectedNegativePrompt) {
        return injectedNegativePrompt
      }
      return current
    })
  }, [locale])

  const loadTemplateOptions = useCallback(async (force: boolean = false) => {
    const requestKey = `${locale}:${tool.slug}`
    if (templateOptionsLoadingRef.current) return
    if (!force && templateOptionsRequestKeyRef.current === requestKey && templateOptionsLoaded && !templateOptionsError) return
    templateOptionsLoadingRef.current = true
    setTemplateOptionsLoading(true)
    setTemplateOptionsError('')
    try {
      const items = await listCatalog({
        locale,
        toolSlug: tool.slug,
        sortBy: 'recommended',
      })
      const matched = items
        .sort((left, right) => right.recommendScore - left.recommendScore)
        .map(item => ({
          id: item.id,
          slug: item.slug,
          toolSlug: item.toolSlug,
          name: item.name,
          summary: item.summary,
          externalCode: item.externalCode,
          recommendScore: item.recommendScore,
          coverAssetUrl: item.coverAssetUrl,
        }))
      setTemplateOptions(matched)
      setTemplateOptionsLoaded(true)
      templateOptionsRequestKeyRef.current = requestKey
      setActiveTemplate(prev => {
        if (prev && prev.name === prev.id) {
          const found = matched.find(m => m.id === prev.id)
          if (found) {
            return { ...prev, name: found.name, templateCode: found.externalCode || prev.templateCode }
          }
        }
        return prev
      })
    } catch {
      setTemplateOptions([])
      setTemplateOptionsLoaded(true)
      setTemplateOptionsError(copy(locale, '模板加载失败，请重试', 'Failed to load templates. Please retry.'))
    } finally {
      templateOptionsLoadingRef.current = false
      setTemplateOptionsLoading(false)
    }
  }, [locale, tool.slug])

  useEffect(() => {
    const payloadFromLocation = (location.state as ToolPageLocationState | null)?.templateUsePayload
    const payload = payloadFromLocation ?? loadUseTemplatePayload()
    if (!payload) return

    const route = typeof payload.targetRoute === 'string' ? payload.targetRoute : ''
    const slug = typeof payload.toolSlug === 'string' ? payload.toolSlug : ''
    if (!route.includes(tool.slug) && slug !== tool.slug) return

    const payloadKey = JSON.stringify({
      route,
      slug,
      templateId: payload.preloadedTemplatePayload?.templateId ?? '',
      externalCode: payload.preloadedTemplatePayload?.externalCode ?? '',
      templateName: payload.preloadedTemplatePayload?.templateName ?? '',
    })
    if (consumedTemplatePayloadKeyRef.current === payloadKey) {
      return
    }

    applyTemplatePayload(payload, {
      replacePrompt: true,
      fallbackId: payload.prefilledInputSchema?.templateId as string | undefined,
    })
    consumedTemplatePayloadKeyRef.current = payloadKey
    clearUseTemplatePayload()
    if (payloadFromLocation) {
      navigate(`${location.pathname}${location.search}`, { replace: true, state: null })
    }
  }, [applyTemplatePayload, location.pathname, location.search, location.state, navigate, tool.slug])

  useEffect(() => {
    templateOptionsRequestKeyRef.current = ''
    setTemplateOptions([])
    setTemplateOptionsLoaded(false)
    setTemplateOptionsError('')
    void loadTemplateOptions(true)
  }, [loadTemplateOptions])

  useEffect(() => {
    if (!pickerOpen) return
    if (!templateOptionsLoaded || templateOptions.length === 0 || templateOptionsError) {
      void loadTemplateOptions(true)
    }
  }, [loadTemplateOptions, pickerOpen, templateOptions.length, templateOptionsError, templateOptionsLoaded])

  useEffect(() => {
    return () => {
      resultObjectURLsRef.current.forEach(url => URL.revokeObjectURL(url))
    }
  }, [])

  const saveWorkflowEvent = useCallback((titleZh: string, titleEn: string, detailZh: string, detailEn: string) => {
    const createdAt = new Date().toISOString()
    void productWorkspaceRepository.saveWorkflowEvent({
      id: `tool-runtime-${Date.now()}`,
      module: 'design',
      title: { zh: titleZh, en: titleEn },
      detail: { zh: detailZh, en: detailEn },
      createdAt,
    })
  }, [])

  const upsertResult = useCallback((job: ImageJobSummary, previewUrl?: string) => {
    const status = mapJobStatus(job.status)
    const title = copy(
      locale,
      `${localizedTool.name} 任务 ${job.job_id.slice(-4)}`,
      `${localizedTool.name} Job ${job.job_id.slice(-4)}`,
    )
    const nextItem: GeneratedResult = {
      id: job.job_id,
      title,
      status,
      hint: job.stage_message || copy(locale, '任务已创建，等待处理', 'Job created and waiting for processing'),
      progress: job.progress ?? 0,
      assetId: job.selected_result_asset_id,
      previewUrl,
    }
    setResults(prev => {
      const current = prev.find(item => item.id === job.job_id)
      const merged: GeneratedResult = current
        ? {
            ...current,
            ...nextItem,
            sourceAssetId: job.source_asset_id || current.sourceAssetId,
            previewUrl: previewUrl ?? current.previewUrl,
          }
        : {
            ...nextItem,
            sourceAssetId: job.source_asset_id,
          }
      const remaining = prev.filter(item => item.id !== job.job_id)
      return [merged, ...remaining].slice(0, 6)
    })
  }, [locale, localizedTool.name])

  const applyJobSummary = useCallback(async (job: ImageJobSummary) => {
    upsertResult(job)
    if (job.selected_result_asset_id) {
      const cachedPreviewUrl = resultPreviewByAssetIDRef.current[job.selected_result_asset_id]
      if (cachedPreviewUrl) {
        upsertResult(job, cachedPreviewUrl)
        return
      }
      try {
        const previewUrl = await fetchAssetObjectURL(job.selected_result_asset_id)
        resultObjectURLsRef.current.push(previewUrl)
        resultPreviewByAssetIDRef.current[job.selected_result_asset_id] = previewUrl
        upsertResult(job, previewUrl)
      } catch {
        // Keep status and metadata visible even if the preview content cannot be loaded yet.
      }
    }
  }, [upsertResult])

  useEffect(() => {
    let canceled = false
    const loadHistory = async () => {
      if (!productId) {
        setResults([])
        resetJobState()
        return
      }
      try {
        const jobs = await listImageJobs({ sceneType: toolToSceneType(tool.slug), productId, limit: 6 })
        if (canceled) return
        setResults([])
        for (const job of jobs) {
          // eslint-disable-next-line no-await-in-loop
          await applyJobSummary(job)
        }
        const activeJob = jobs.find(job => !isTerminalStatus(job.status)) || jobs[0]
        if (activeJob) {
          setActiveJobID(activeJob.job_id)
          if (!isTerminalStatus(activeJob.status)) {
            setPollingJobID(activeJob.job_id)
          } else {
            setPollingJobID(null)
          }
        }
      } catch {
        // Keep the tool usable even if history loading fails.
      }
    }
    void loadHistory()
    return () => {
      canceled = true
    }
  }, [applyJobSummary, productId, resetJobState, tool.slug])

  useEffect(() => {
    if (!pollingJobID) return
    let canceled = false
    const poll = async () => {
      try {
        const job = await getImageJob(pollingJobID)
        if (canceled) return
        await applyJobSummary(job)
        if (isTerminalStatus(job.status)) {
          setPollingJobID(current => (current === job.job_id ? null : current))
          if (!notifiedJobIDsRef.current.has(job.job_id)) {
            notifiedJobIDsRef.current.add(job.job_id)
            if (job.status === 'completed') {
              saveWorkflowEvent(
                `${localizedTool.name} 已完成生成`,
                `${localizedTool.name} generation completed`,
                `任务 ${job.job_id.slice(-6)} 已完成，可继续送往设计器或下载中心`,
                `Job ${job.job_id.slice(-6)} is ready for designer or download-center flows`,
              )
            } else {
              saveWorkflowEvent(
                `${localizedTool.name} 生成失败`,
                `${localizedTool.name} generation failed`,
                job.last_error_message || '请检查提示词、源图或稍后重试',
                job.last_error_message || 'Check the prompt, source image, or try again later',
              )
            }
          }
        }
      } catch (error) {
        if (!canceled) {
          // Toast will be shown globally
        }
      }
    }

    void poll()
    const timer = window.setInterval(() => {
      void poll()
    }, 2500)
    return () => {
      canceled = true
      window.clearInterval(timer)
    }
  }, [pollingJobID, applyJobSummary, locale, localizedTool.name, saveWorkflowEvent])

  const currentResult = activeJobID
    ? results.find(item => item.id === activeJobID) ?? null
    : null
  const currentSourceAsset = sourceAsset ?? (currentResult?.sourceAssetId ? buildHistorySourceAsset(currentResult.sourceAssetId) : null)
  const isProcessing =
    creatingJob || uploadingSource || currentResult?.status === 'running' || currentResult?.status === 'queued'

  const hasValidCanvas = sourcePreviewUrl || currentResult?.previewUrl || isProcessing

  const handleSelectFile = () => {
    if (!selectedProduct) {
      showToast(copy(locale, '请先选择一个商品，再上传源图。', 'Select a product before uploading a source image.'), 'error')
      return
    }
    fileInputRef.current?.click()
  }

  const handleClearSource = () => {
    resetSourceState({ clearPrompt: true, clearFileInput: true })
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!selectedProduct) {
      showToast(copy(locale, '请先选择一个商品，再上传源图。', 'Select a product before uploading a source image.'), 'error')
      return
    }

    setUploadingSource(true)
    resetJobState()
    const localPreviewUrl = await fileToDataURL(file)
    setSourcePreviewUrl(localPreviewUrl)

    try {
      const dimensions = await getImageDimensions(file)
      const payload = await fileToDataURL(file)
      const registered = await registerSourceAsset({
        productId,
        skuCode: selectedProduct.skuCode,
        fileName: file.name,
        mimeType: file.type || 'image/png',
        payload,
        width: dimensions.width,
        height: dimensions.height,
        metadata: { tool_slug: tool.slug },
      })
      setSourceAsset(registered)
      saveWorkflowEvent(
        '源图已完成登记',
        'Source image registered',
        `${file.name} 已同步到业务资产层，可直接发起生成任务`,
        `${file.name} is registered and ready for generation`,
      )
    } catch (error) {
      // Global toast handles API errors
      setSourceAsset(null)
    } finally {
      setUploadingSource(false)
    }
  }

  const handleGenerate = async () => {
    if (creatingJob || uploadingSource) return
    if (!currentSourceAsset) {
      showToast(copy(locale, '请先上传一张源图，再开始生成。', 'Upload a source image before starting generation.'), 'error')
      return
    }
    if (!prompt.trim()) {
      showToast(copy(locale, '请先填写生成描述。', 'Enter a prompt before starting generation.'), 'error')
      return
    }
    if (!selectedProduct) {
      showToast(copy(locale, '请先绑定一个商品，再发起生成。', 'Bind a product before starting generation.'), 'error')
      return
    }

    setCreatingJob(true)
    try {
      const job = await createImageJob({
        productId,
        skuCode: selectedProduct.skuCode,
        sceneType: toolToSceneType(tool.slug),
        sourceAssetID: currentSourceAsset.id,
        prompt,
        negativePrompt,
        objective: 'quality',
        requestedVariants: 1,
        width: currentSourceAsset.width || undefined,
        height: currentSourceAsset.height || undefined,
        templateCode: activeTemplate?.templateCode,
      })
      await applyJobSummary(job)
      setActiveJobID(job.job_id)
      setPollingJobID(job.job_id)
      saveWorkflowEvent(
        `${localizedTool.name} 任务已创建`,
        `${localizedTool.name} job created`,
        `任务 ${job.job_id.slice(-6)} 已提交到平台 runtime，正在排队处理`,
        `Job ${job.job_id.slice(-6)} has been queued in platform runtime`,
      )
    } catch (error) {
      // Global toast handles API errors
    } finally {
      setCreatingJob(false)
    }
  }

  const handleCancelJob = async () => {
    if (!pollingJobID || cancelingJob) return
    setCancelingJob(true)
    try {
      const job = await cancelImageJob(pollingJobID)
      await applyJobSummary(job)
      setPollingJobID(null)
      setActiveJobID(job.job_id)
      saveWorkflowEvent(
        `${localizedTool.name} 任务已取消`,
        `${localizedTool.name} job canceled`,
        `任务 ${job.job_id.slice(-6)} 已取消，不再阻塞当前工作区`,
        `Job ${job.job_id.slice(-6)} has been canceled and no longer blocks the workspace`,
      )
      showToast(copy(locale, '任务已取消', 'Job canceled'), 'success')
    } catch {
      // Global toast handles API errors
    } finally {
      setCancelingJob(false)
    }
  }

  const handleSelectTemplatePlan = async (template: ToolTemplateOption) => {
    if (selectingTemplateID) return
    setSelectingTemplateID(template.id)
    try {
      const payload = await useTemplateNow(template.id)
      applyTemplatePayload(payload, { replacePrompt: true })
    } catch (error) {
      // API error toast
    } finally {
      setSelectingTemplateID(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#060608] flex flex-col relative overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={event => {
          void handleFileChange(event)
        }}
      />
      {/* Header */}
      <header className="absolute top-0 w-full z-40 p-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <Link
            to={selectedProduct ? `/products/${selectedProduct.id}` : '/products/workbench/visual-tools'}
            className="glass-strong rounded-xl p-2.5 text-white/60 hover:text-white transition-colors border border-white/10 hover:border-white/20"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="glass-strong rounded-2xl px-4 py-2 flex items-center gap-3 border border-white/10 shadow-lg">
            <span className="text-xl drop-shadow-md">{localizedTool.icon}</span>
            <span className="font-bold text-white/90 text-sm tracking-wide">{localizedTool.name}</span>
            <div className="h-4 w-px bg-white/20"></div>
            <span className="text-xs font-medium text-white/50">{localizedTool.desc}</span>
          </div>
        </div>
      </header>

      {/* Main Canvas Area */}
      <main className="flex-1 flex flex-col items-center justify-center relative w-full h-full pt-20 pb-32 px-4 z-10">
        {/* Ambient Glow */}
        <div className="pointer-events-none absolute -right-40 top-0 h-[600px] w-[600px] rounded-full bg-brand-500/10 blur-[120px]" />
        <div className="pointer-events-none absolute -left-40 bottom-0 h-[600px] w-[600px] rounded-full bg-indigo-500/10 blur-[120px]" />

        <div className="w-full max-w-4xl mx-auto mb-6 z-20">
          <div className="glass-strong rounded-3xl border border-white/10 px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-white">
                {copy(locale, '商品上下文 AI 工作区', 'Product-scoped AI workspace')}
              </div>
              <div className="mt-1 text-xs text-white/45">
                {selectedProduct
                  ? copy(locale, `当前绑定 ${selectedProduct.skuCode} · ${selectedProduct.title}`, `Bound to ${selectedProduct.skuCode} · ${selectedProduct.title}`)
                  : copy(locale, '所有源图和生成结果都会自动沉淀到这个商品素材区。', 'Source images and generated results are archived into this product.')}
              </div>
            </div>
            <div className="rounded-2xl border border-brand-500/20 bg-brand-500/10 px-4 py-3 text-sm text-brand-200">
              {productLoading
                ? copy(locale, '正在加载商品上下文...', 'Loading product context...')
                : selectedProduct
                  ? copy(locale, '商品上下文由商品工作台注入，AI 结果会直接归档到该商品。', 'Product context is injected by the workbench and results are archived into this product.')
                  : copy(locale, '未找到商品上下文，请返回商品工作台重新进入。', 'Missing product context. Return to the product workbench.')}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              to="/products"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              {copy(locale, '商品首页', 'Product home')}
            </Link>
            <Link
              to="/products/workbench/visual-tools"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              {copy(locale, '返回工具选择', 'Back to tool picker')}
            </Link>
            <Link
              to="/products/workbench/downloads"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              {copy(locale, '下载中心', 'Download center')}
            </Link>
            {selectedProduct ? (
              <Link
                to={`/products/${selectedProduct.id}`}
                className="rounded-xl border border-brand-500/20 bg-brand-500/10 px-3 py-2 text-sm text-brand-200 transition hover:bg-brand-500/20"
              >
                {copy(locale, '查看当前商品', 'Open current product')}
              </Link>
            ) : null}
          </div>
        </div>

        {!hasValidCanvas ? (
          <div className="w-full max-w-4xl mx-auto flex flex-col items-center z-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* Upload Dropzone */}
            <button
              onClick={handleSelectFile}
              disabled={uploadingSource}
              className={`relative w-full max-w-2xl aspect-[16/9] rounded-[32px] border-2 border-dashed transition-all duration-500 group flex flex-col items-center justify-center backdrop-blur-xl overflow-hidden ${
                uploadingSource 
                  ? 'border-brand-500/50 bg-brand-500/5 cursor-wait' 
                  : 'border-white/10 hover:border-brand-500/40 hover:bg-brand-500/5 hover:shadow-[0_0_40px_rgba(var(--brand-500),0.15)] bg-white/[0.02]'
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
                {uploadingSource ? (
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 size={48} className="text-brand-400 animate-spin" />
                    <h3 className="text-xl font-bold text-white tracking-wide">{copy(locale, '正在解析源图...', 'Analyzing source...')}</h3>
                  </div>
                ) : (
                  <>
                    <div className="w-24 h-24 rounded-[24px] bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-brand-500/20 group-hover:border-brand-500/30 group-hover:text-brand-300 transition-all duration-500 shadow-2xl relative">
                      <div className="absolute inset-0 bg-brand-400/20 rounded-[24px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <Upload className="text-white/50 group-hover:text-brand-400 transition-colors relative z-10" size={40} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-2xl font-black text-white/90 mb-3 tracking-tight">{sourceGuide.title}</h3>
                    <p className="text-sm font-medium text-white/40 max-w-sm text-center leading-relaxed">
                      {sourceGuide.helper}
                    </p>
                    <div className="mt-8 flex gap-3">
                      {sourceGuide.requirements.map(item => (
                        <span key={item.slot} className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-semibold text-white/60 backdrop-blur-md">
                          {item.label} {item.required ? '*' : ''}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </button>

            {/* Inspiration Gallery (Zero Cold-Start) */}
            {templateOptions.length > 0 && (
              <div className="mt-16 w-full max-w-4xl relative">
                <div className="flex items-center justify-center gap-4 mb-8 opacity-60">
                  <div className="h-px bg-gradient-to-r from-transparent to-white/40 flex-1 max-w-[120px]"></div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-[0.2em]">{copy(locale, '或试试这些优秀案例', 'Or try these examples')}</h4>
                  <div className="h-px bg-gradient-to-l from-transparent to-white/40 flex-1 max-w-[120px]"></div>
                </div>
                
                {/* Marquee Container */}
                <div className="relative w-full overflow-hidden flex pb-4">
                  {/* Fade masks for smooth entry/exit */}
                  <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#060608] to-transparent z-10 pointer-events-none" />
                  <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#060608] to-transparent z-10 pointer-events-none" />
                  
                  <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
                    {[0, 1].map((setIndex) => (
                      <div key={setIndex} className="flex gap-5 px-2.5">
                        {templateOptions.map(item => (
                          <div 
                            key={`${setIndex}-${item.id}`} 
                            className={`flex-none w-36 h-36 rounded-2xl bg-black/40 border overflow-hidden cursor-pointer group relative shadow-xl transition-all duration-500 ${
                              activeTemplate?.id === item.id 
                                ? 'border-brand-500 shadow-[0_0_30px_rgba(var(--brand-500),0.5)] -translate-y-2' 
                                : 'border-white/10 hover:shadow-[0_0_30px_rgba(var(--brand-500),0.3)] hover:border-brand-500/40 hover:-translate-y-2'
                            }`}
                            onClick={() => {
                              void handleSelectTemplatePlan(item)
                            }}
                          >
                            <img 
                              src={item.coverAssetUrl || `https://picsum.photos/seed/${item.id}/300`} 
                              className={`w-full h-full object-cover transition-all duration-700 ${
                                activeTemplate?.id === item.id ? 'opacity-100 scale-110' : 'opacity-60 group-hover:opacity-100 group-hover:scale-110'
                              }`} 
                              alt={item.name} 
                            />
                            <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex items-end justify-center pb-4 transition-opacity duration-300 ${
                              activeTemplate?.id === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            }`}>
                              <span className={`flex items-center gap-1.5 text-xs font-bold text-white bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-lg transition-transform duration-300 ${
                                activeTemplate?.id === item.id ? 'translate-y-0' : 'transform translate-y-4 group-hover:translate-y-0'
                              }`}>
                                {activeTemplate?.id === item.id ? (
                                  <>{copy(locale, '已应用', 'Applied')}</>
                                ) : (
                                  <><Play size={12} fill="currentColor" /> {copy(locale, '一键同款', 'Try this')}</>
                                )}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="relative w-full max-w-5xl h-full flex items-center justify-center z-20 animate-in zoom-in-95 duration-500">
            {/* The Main Canvas */}
            <div className="relative w-full aspect-square sm:aspect-video max-h-[75vh] rounded-[32px] overflow-hidden glass-strong border border-white/10 shadow-2xl flex items-center justify-center bg-black/60">
              
              {/* Display Source Image if Result is not yet complete */}
              {sourcePreviewUrl && !currentResult?.previewUrl && (
                <div className="relative w-full h-full flex items-center justify-center group/source">
                  <img 
                    src={sourcePreviewUrl} 
                    alt="Source" 
                    className={`w-full h-full object-contain transition-all duration-1000 ${isProcessing ? 'opacity-40 blur-md scale-105' : 'opacity-100'}`} 
                  />
                  {!isProcessing && (
                    <button
                      onClick={handleClearSource}
                      className="absolute top-4 right-4 bg-black/60 text-white/80 hover:text-white hover:bg-rose-500/80 hover:shadow-[0_0_20px_rgba(244,63,94,0.5)] border border-white/10 backdrop-blur-md rounded-full p-2.5 opacity-0 group-hover/source:opacity-100 transition-all duration-300 z-50 transform hover:scale-110"
                      title={copy(locale, '清除当前图片', 'Clear image')}
                    >
                      <X size={18} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              )}
              
              {/* Display Result Image */}
              {currentResult?.previewUrl && (
                <div className="relative w-full h-full flex items-center justify-center group/result">
                  <img 
                    src={currentResult.previewUrl} 
                    alt="Result" 
                    className="w-full h-full object-contain animate-in fade-in duration-1000" 
                  />
                  {!isProcessing && (
                    <button
                      onClick={handleClearSource}
                      className="absolute top-4 right-4 bg-black/60 text-white/80 hover:text-white hover:bg-rose-500/80 hover:shadow-[0_0_20px_rgba(244,63,94,0.5)] border border-white/10 backdrop-blur-md rounded-full p-2.5 opacity-0 group-hover/result:opacity-100 transition-all duration-300 z-50 transform hover:scale-110"
                      title={copy(locale, '清除当前图片', 'Clear image')}
                    >
                      <X size={18} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              )}

              {/* Immersive Processing Overlay */}
              {isProcessing && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center">
                  <div className="absolute inset-0 bg-brand-500/10 animate-pulse pointer-events-none" />
                  
                  {/* Scanning Line */}
                  <div className="absolute left-0 w-full h-32 bg-gradient-to-b from-transparent via-brand-500/20 to-transparent animate-scan pointer-events-none" style={{ animationDuration: '3s' }} />
                  
                  <div className="glass-strong rounded-3xl px-8 py-6 flex flex-col items-center gap-4 shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 backdrop-blur-2xl">
                    <div className="relative flex items-center justify-center w-16 h-16">
                      <div className="absolute inset-0 rounded-full border-4 border-brand-500/20"></div>
                      <div className="absolute inset-0 rounded-full border-4 border-brand-500 border-t-transparent animate-spin"></div>
                      <Sparkles className="text-brand-400 animate-pulse" size={24} />
                    </div>
                    <div className="text-center">
                      <p className="text-base font-bold text-white tracking-wide">
                        {currentResult?.hint || copy(locale, 'AI 正在施展魔法...', 'AI is working its magic...')}
                      </p>
                      <p className="text-xs font-medium text-white/40 mt-1 uppercase tracking-widest">
                        {copy(locale, '请耐心等待，见证奇迹', 'Please wait, witnessing magic')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Floating Prompt Bar (Bottom Action Island) */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-50 transition-all duration-700 translate-y-0 opacity-100">

        <div className="glass-strong rounded-full p-2 pl-6 pr-2 flex items-center gap-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 backdrop-blur-3xl relative">
          
          {/* Upload/Replace Button */}
          <button 
            onClick={handleSelectFile} 
            className="p-2.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors relative group shrink-0" 
            title={copy(locale, '重新上传源图', 'Replace source image')}
          >
            <ImageIcon size={22} />
            {currentSourceAsset && <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#1a1b1e]"></div>}
          </button>

          <div className="h-6 w-px bg-white/10 shrink-0"></div>

          {/* Visual Parameters: Template Trigger */}
          <button 
            onClick={() => {
              setPickerOpen(true)
              void loadTemplateOptions(!templateOptionsLoaded || templateOptions.length === 0)
            }} 
            className="px-4 py-2.5 rounded-full hover:bg-white/10 text-brand-400 transition-colors flex items-center gap-2 shrink-0 border border-transparent hover:border-brand-500/30"
          >
            <Sparkles size={18} />
            <span className="text-sm font-bold max-w-[120px] truncate hidden sm:inline-block">
              {activeTemplate ? activeTemplate.name : copy(locale, '默认风格', 'Default Style')}
            </span>
            <ChevronRight size={14} className="opacity-50" />
          </button>

          <div className="h-6 w-px bg-white/10 shrink-0"></div>

          {/* Prompt Input */}
          <input 
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder={copy(locale, '描述你想要的细节，或直接点击生成...', 'Describe details, or just generate...')}
            className="flex-1 bg-transparent border-none text-white text-base font-medium focus:ring-0 placeholder-white/30 h-12 outline-none min-w-[200px]"
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void handleGenerate()
              }
            }}
          />

          {/* Generate CTA */}
          <button 
            onClick={handleGenerate}
            disabled={creatingJob || uploadingSource || !currentSourceAsset || !selectedProduct || productLoading}
            className="h-14 px-8 rounded-full bg-brand-500 text-white font-black text-sm flex items-center gap-2.5 hover:bg-brand-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-[0_0_20px_rgba(var(--brand-500),0.3)] hover:shadow-[0_0_40px_rgba(var(--brand-500),0.6)] shrink-0"
          >
            {creatingJob ? <Loader2 size={20} className="animate-spin" /> : <Wand2 size={20} />}
            {creatingJob ? copy(locale, '生成中...', 'Generating...') : copy(locale, '魔法生成', 'Generate')}
          </button>
          {pollingJobID && (
            <button
              onClick={() => { void handleCancelJob() }}
              disabled={cancelingJob}
              className="h-14 px-6 rounded-full border border-white/15 bg-white/5 text-white font-bold text-sm flex items-center gap-2 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shrink-0"
            >
              {cancelingJob ? <Loader2 size={18} className="animate-spin" /> : <X size={18} />}
              {cancelingJob ? copy(locale, '取消中...', 'Canceling...') : copy(locale, '取消任务', 'Cancel Job')}
            </button>
          )}
        </div>
      </div>

      {/* History Drawer (Right Side Filmstrip) */}
      <div className={`absolute top-1/2 right-6 -translate-y-1/2 z-40 transition-all duration-700 ${(results.filter(r => r.status !== 'failed').length > 0) ? 'translate-x-0 opacity-100' : 'translate-x-24 opacity-0 pointer-events-none'}`}>
        <div className="glass-strong rounded-[24px] p-3 border border-white/10 flex flex-col gap-3 shadow-2xl backdrop-blur-2xl">
           <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] text-center pb-2 border-b border-white/5">
             {copy(locale, '历史记录', 'History')}
           </div>
           <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto scrollbar-hide pt-1 pb-1">
             {results.filter(r => r.status !== 'failed').map(res => (
                <button 
                  key={res.id} 
                  onClick={() => {
                    resetSourceState()
                    setActiveJobID(res.id)
                  }}
                  className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                    res.id === currentResult?.id 
                      ? 'border-brand-400 scale-110 shadow-[0_0_20px_rgba(var(--brand-500),0.5)] z-10' 
                      : 'border-white/10 hover:border-white/30 opacity-50 hover:opacity-100'
                  }`}
                >
                  {res.previewUrl ? (
                     <img src={res.previewUrl} className="w-full h-full object-cover" alt="History" />
                  ) : (
                     <div className="w-full h-full flex items-center justify-center bg-white/5">
                        <Loader2 size={16} className="text-brand-400 animate-spin" />
                     </div>
                  )}
                </button>
             ))}
           </div>
        </div>
      </div>

      {/* Template Picker Modal (Visual Parameters) */}
      {pickerOpen && (
        <div className={`fixed inset-0 ${Z_INDEX.modal} flex items-center justify-center bg-black/80 px-4 backdrop-blur-md animate-in fade-in duration-300`}>
          <div className="w-full max-w-4xl rounded-[32px] border border-white/10 bg-[#0a0d14] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-white">{copy(locale, '选择模特与风格', 'Choose Style Template')}</h3>
                <p className="text-sm font-medium text-white/40 mt-2">
                  {copy(locale, '点击直接应用，省去繁琐提示词。', 'Click to apply instantly, skip complex prompts.')}
                </p>
              </div>
              <button onClick={() => setPickerOpen(false)} className="rounded-full bg-white/5 p-3 hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input
                type="text"
                value={templateSearchTerm}
                onChange={(e) => setTemplateSearchTerm(e.target.value)}
                placeholder={copy(locale, '搜索模板名称...', 'Search templates...')}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-brand-500/50 transition-colors"
              />
            </div>
            
            {templateOptionsLoading ? (
              <div className="flex min-h-[240px] items-center justify-center text-white/60">
                <Loader2 size={20} className="mr-3 animate-spin" />
                {copy(locale, '正在加载模板...', 'Loading templates...')}
              </div>
            ) : templateOptionsError ? (
              <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
                <p className="text-sm text-white/60">{templateOptionsError}</p>
                <button
                  type="button"
                  onClick={() => void loadTemplateOptions(true)}
                  className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
                >
                  {copy(locale, '重试加载', 'Retry')}
                </button>
              </div>
            ) : templateOptions
              .filter(item =>
                item.name.toLowerCase().includes(templateSearchTerm.toLowerCase()) ||
                item.summary.toLowerCase().includes(templateSearchTerm.toLowerCase())
              ).length === 0 ? (
              <div className="flex min-h-[240px] items-center justify-center text-sm text-white/50">
                {copy(locale, '暂无可用模板', 'No templates available')}
              </div>
            ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto scrollbar-hide pr-2 pb-4">
              {templateOptions
                .filter(item =>
                  item.name.toLowerCase().includes(templateSearchTerm.toLowerCase()) ||
                  item.summary.toLowerCase().includes(templateSearchTerm.toLowerCase())
                )
                .map(item => {
                const isActive = activeTemplate?.id === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      void handleSelectTemplatePlan(item)
                      setPickerOpen(false)
                    }}
                    className={`group relative aspect-[3/4] rounded-2xl border-2 overflow-hidden text-left transition-all duration-300 ${
                      isActive ? 'border-brand-500 shadow-[0_0_30px_rgba(var(--brand-500),0.3)] scale-[1.02] z-10' : 'border-white/5 hover:border-white/20'
                    }`}
                  >
                    <img src={item.coverAssetUrl || `https://picsum.photos/seed/${item.id}/300/400`} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt={item.name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-4">
                      <div className="text-sm font-bold text-white truncate">{item.name}</div>
                      <div className="text-[10px] text-white/60 line-clamp-2 mt-1">{item.summary}</div>
                    </div>
                    {isActive && (
                      <div className="absolute top-3 right-3 bg-brand-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                        {copy(locale, '已选', 'Selected')}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ToolPage() {
  const { toolSlug } = useParams()
  if (!toolSlug) return <ToolNotFoundView />
  return <Navigate to={`/products/workbench/visual-tools/${toolSlug}`} replace />
}

export function ProductScopedToolPage() {
  const { toolSlug, productId } = useParams()
  const tool = TOOLS.find((t) => t.slug === toolSlug)

  if (!tool || !productId) return <ToolNotFoundView />

  return <ToolContent tool={tool} productId={productId} />
}
