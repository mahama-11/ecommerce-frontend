import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { SourceAssetSummary } from '@/services/imageRuntime'
import type { AssetRequirement, Locale } from '../types'
import { copy, formatAssetLabel, formatRequirementConstraints } from '../utils'

type SlotAssetState = {
  asset: SourceAssetSummary
  previewUrl: string
}

type ToolAssetSlotPanelProps = {
  locale: Locale
  requirements: AssetRequirement[]
  slotAssets: Record<string, SlotAssetState>
  missingSlotKeys: string[]
  uploadingSource: boolean
  onSelectFile: (slot: string) => void
  onClearSlot: (slot: string) => void
}

export function ToolAssetSlotPanel({ locale, requirements, slotAssets, missingSlotKeys, uploadingSource, onSelectFile, onClearSlot }: ToolAssetSlotPanelProps) {
  if (requirements.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto mb-6 z-20 rounded-2xl border border-brand-500/20 bg-brand-500/10 px-4 py-3 text-sm text-brand-100">
        {copy(locale, '当前工具通过文字描述生成图片，不需要上传素材。', 'This tool generates from text and does not require uploaded assets.')}
      </div>
    )
  }
  return (
    <div className="w-full max-w-4xl mx-auto mb-6 z-20 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {requirements.map(requirement => {
        const uploaded = slotAssets[requirement.slot]
        const isMissing = missingSlotKeys.includes(requirement.slot)
        return (
          <div key={requirement.slot} className={`rounded-2xl border p-3 bg-white/[0.03] ${isMissing ? 'border-rose-400/60' : uploaded ? 'border-emerald-400/40' : 'border-white/10'}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-white">{formatAssetLabel(locale, requirement.label)} {requirement.required ? '*' : ''}</div>
                <div className="mt-1 text-xs text-white/45">{requirement.helper || copy(locale, '上传该位置需要的素材图', 'Upload the asset for this slot')}</div>
                {formatRequirementConstraints(locale, requirement) ? <div className="mt-1 text-[11px] text-white/35">{formatRequirementConstraints(locale, requirement)}</div> : null}
              </div>
              {uploaded ? <Button onClick={() => onClearSlot(requirement.slot)} className="rounded-full bg-white/5 p-2 text-white/60 hover:bg-white/10"><X size={14} /></Button> : null}
            </div>
            <Button onClick={() => onSelectFile(requirement.slot)} disabled={uploadingSource} className="mt-3 h-24 w-full overflow-hidden rounded-xl border border-dashed border-white/15 bg-black/30 text-white/60 hover:border-brand-400/50 hover:text-white">
              {uploaded ? <img src={uploaded.previewUrl} alt={requirement.label} className="h-full w-full object-cover" /> : <span className="flex items-center justify-center gap-2 text-sm"><Upload size={16} />{copy(locale, '上传素材', 'Upload asset')}</span>}
            </Button>
            {isMissing ? <div className="mt-2 text-xs text-rose-200">{copy(locale, '这个素材必填', 'This asset is required')}</div> : null}
          </div>
        )
      })}
    </div>
  )
}
