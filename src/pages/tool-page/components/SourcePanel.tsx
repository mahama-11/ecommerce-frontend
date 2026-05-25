import { Upload } from 'lucide-react'
import type { SourceAssetSummary } from '@/services/imageRuntime'
import type { AssetRequirement, Locale } from '../types'
import { copy, formatAssetLabel } from '../utils'
import { Button } from '@/components/ui/Button'

type SourceGuide = {
  title: string
  helper: string
  requirements: AssetRequirement[]
  warning?: string
}

type SourcePanelProps = {
  locale: Locale
  sourceGuide: SourceGuide
  sourcePreviewUrl: string | null
  sourceAsset: SourceAssetSummary | null
  uploadingSource: boolean
  onSelectFile: () => void
  onClearSource: () => void
}

export function SourcePanel({
  locale,
  sourceGuide,
  sourcePreviewUrl,
  sourceAsset,
  uploadingSource,
  onSelectFile,
  onClearSource,
}: SourcePanelProps) {
  return (
    <div className="glass rounded-3xl p-6 space-y-6">
      <div className="flex items-center gap-2 text-sm font-medium text-white/75">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500/15 text-xs text-brand-300">1</span>
        <span>{sourceGuide.title}</span>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/[0.06] bg-[var(--ecom-surface)]">
        <div className="flex min-h-[320px] items-center justify-center p-4 sm:p-6">
          {sourcePreviewUrl ? (
            <img
              src={sourcePreviewUrl}
              alt={copy(locale, '当前源图预览', 'Current source preview')}
              className="max-h-[420px] w-full object-contain"
            />
          ) : (
            <Button
              type="button"
              onClick={onSelectFile}
              className="flex h-full w-full flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-white/10 px-6 py-10 text-center transition-colors hover:border-brand-500/30"
            >
              <div className="mb-4 rounded-2xl border border-brand-500/20 bg-brand-500/10 p-3 text-brand-300">
                <Upload size={28} />
              </div>
              <div className="text-base font-semibold text-white">{sourceGuide.title}</div>
              <div className="mt-2 max-w-sm text-sm leading-6 text-white/45">
                {sourceGuide.helper}
              </div>
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {sourceGuide.requirements.length > 0 ? (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
            <div className="text-sm font-medium text-white">
              {copy(locale, '本模板建议素材', 'Recommended Assets')}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {sourceGuide.requirements.map(item => (
                <span
                  key={item.slot}
                  className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[11px] text-white/60"
                >
                  {formatAssetLabel(locale, item.label)}
                  {item.required ? copy(locale, ' · 必需', ' · Required') : copy(locale, ' · 可选', ' · Optional')}
                </span>
              ))}
            </div>
            {sourceGuide.warning ? (
              <div className="mt-3 text-xs leading-5 text-amber-300/90">{sourceGuide.warning}</div>
            ) : null}
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-white">
              {sourcePreviewUrl
                ? copy(locale, '已选中本次生成主素材', 'Primary source asset selected')
                : sourceGuide.title}
            </div>
            <div className="mt-1 text-xs text-white/40">
              {sourceAsset
                ? copy(
                    locale,
                    `${sourceAsset.width || '-'} × ${sourceAsset.height || '-'} · ${sourceAsset.file_name || 'source'}`,
                    `${sourceAsset.width || '-'} × ${sourceAsset.height || '-'} · ${sourceAsset.file_name || 'source'}`,
                  )
                : sourceGuide.helper}
            </div>
          </div>
          <div className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs text-white/65">
            {uploadingSource
              ? copy(locale, '上传中', 'Uploading')
              : sourceAsset
                ? copy(locale, '已准备好', 'Ready')
                : copy(locale, '待上传', 'Waiting')}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={onSelectFile}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm text-white/75 transition-colors hover:bg-[var(--ecom-surface-hover)]"
          >
            {sourcePreviewUrl ? copy(locale, '重新上传', 'Replace Image') : copy(locale, '选择图片', 'Select Image')}
          </Button>
          {sourcePreviewUrl ? (
            <Button
              type="button"
              onClick={onClearSource}
              className="rounded-2xl border border-white/[0.08] bg-transparent px-4 py-2 text-sm text-white/55 transition-colors hover:border-rose-400/25 hover:text-rose-300"
            >
              {copy(locale, '移除图片', 'Remove Image')}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
