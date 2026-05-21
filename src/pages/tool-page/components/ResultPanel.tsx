import { CheckCircle2, Clock3, Image, Sparkles } from 'lucide-react'
import type { GeneratedResult, Locale } from '../types'
import { copy, resultStatusLabel } from '../utils'

type ResultPanelProps = {
  locale: Locale
  sourceSizeLabel: string
  sourcePreviewUrl: string | null
  currentResult: GeneratedResult | null
  isProcessing: boolean
  uploadingSource: boolean
  sourceAssetReady: boolean
  toolSlug: string
  onGenerateAgain: () => void
}

export function ResultPanel({
  locale,
  sourceSizeLabel,
  sourcePreviewUrl,
  currentResult,
  isProcessing,
  uploadingSource,
  sourceAssetReady,
  toolSlug,
  onGenerateAgain,
}: ResultPanelProps) {
  return (
    <div className="glass rounded-3xl p-6">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-white/75">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500/15 text-xs text-brand-300">3</span>
            <span>{copy(locale, '查看结果', 'Review Results')}</span>
          </div>
          <div className="mt-1 text-xs text-white/35">
            {copy(locale, '最新生成结果会优先显示在这里，保持图片原始比例便于判断构图。', 'The latest result appears here first and keeps the original ratio for a more accurate review.')}
          </div>
        </div>
        <div className="text-xs text-white/35">
          {copy(locale, `固定 1 张 · ${sourceSizeLabel}`, `Fixed to 1 result · ${sourceSizeLabel}`)}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[28px] border border-white/[0.06] bg-[#0a0d14]">
        <div className="flex min-h-[360px] items-center justify-center p-5 sm:min-h-[440px]">
          {currentResult?.previewUrl ? (
            <img
              src={currentResult.previewUrl}
              alt={currentResult.title}
              className="max-h-[560px] w-full object-contain"
            />
          ) : sourcePreviewUrl ? (
            <img
              src={sourcePreviewUrl}
              alt={copy(locale, '待生成源图', 'Pending source image')}
              className="max-h-[520px] w-full object-contain opacity-90"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_45%)]">
              <Image size={52} className="mb-4 text-white/15" />
              <p className="text-sm text-white/35">
                {copy(locale, '上传源图后，这里会优先展示最新结果。', 'Upload a source image and the latest result will appear here first.')}
              </p>
            </div>
          )}
        </div>
        {isProcessing ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#090b12]/48 backdrop-blur-md">
            <div className="rounded-3xl border border-white/[0.08] bg-black/30 px-6 py-5 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-brand-400/30 bg-brand-500/12">
                <Sparkles className="h-6 w-6 animate-spin text-brand-300" />
              </div>
              <div className="text-sm font-medium text-white">
                {uploadingSource
                  ? copy(locale, '正在登记源图', 'Registering source image')
                  : copy(locale, '正在生成效果图', 'Generating image results')}
              </div>
              <div className="mt-2 text-xs text-white/45">
                {currentResult?.hint || copy(locale, '保持当前页面打开，我们会自动更新结果。', 'Keep this page open and the result will update automatically.')}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-4">
          <div className="text-sm font-medium text-white">
            {currentResult?.title || copy(locale, '等待生成任务', 'Waiting for a generation job')}
          </div>
          <div className="mt-2 text-sm leading-6 text-white/50">
            {currentResult?.hint || copy(locale, '上传源图并填写描述后，系统会在这里回显实时进度和最终效果。', 'After uploading a source image and entering a prompt, realtime progress and the final output will be shown here.')}
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500 transition-all duration-500"
              style={{ width: `${currentResult?.progress ?? 0}%` }}
            />
          </div>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-4 text-center sm:min-w-[120px]">
          <div className="text-[11px] text-white/35">{copy(locale, '状态', 'Status')}</div>
          <div className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-white">
            {currentResult?.status === 'done' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <Clock3 className={`h-4 w-4 ${currentResult?.status === 'failed' ? 'text-rose-300' : 'text-brand-300'}`} />
            )}
            <span>{resultStatusLabel(locale, currentResult?.status ?? 'queued')}</span>
          </div>
          <div className="mt-2 text-xs text-white/40">
            {copy(locale, `进度 ${currentResult?.progress ?? 0}%`, `Progress ${currentResult?.progress ?? 0}%`)}
          </div>
        </div>
      </div>

      {currentResult?.previewUrl ? (
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href={currentResult.previewUrl}
            download={`${toolSlug}-${currentResult.id}.png`}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm text-white/75 transition-colors hover:bg-white/[0.08]"
          >
            {copy(locale, '下载结果', 'Download')}
          </a>
          <button
            type="button"
            onClick={onGenerateAgain}
            disabled={isProcessing || !sourceAssetReady}
            className="rounded-2xl border border-white/[0.08] bg-transparent px-4 py-2 text-sm text-white/60 transition-colors hover:border-brand-400/30 hover:text-white disabled:opacity-40"
          >
            {copy(locale, '基于当前设置重新生成', 'Generate Again')}
          </button>
        </div>
      ) : null}
    </div>
  )
}
