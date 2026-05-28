import { ChevronRight, Image as ImageIcon, Loader2, Sparkles, Wand2, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { SourceAssetSummary } from '@/services/imageRuntime'
import type { Product } from '@/types/product'
import type { ToolInputMode } from '@/types/tool'
import type { Locale } from '../types'
import { copy } from '../utils'

type ToolPromptBarProps = {
  locale: Locale
  activeInputMode: ToolInputMode
  activeTemplateName?: string
  templateOptionsLoaded: boolean
  templateOptionsLength: number
  currentSourceAsset?: SourceAssetSummary | null
  prompt: string
  setPrompt: (value: string) => void
  creatingJob: boolean
  uploadingSource: boolean
  selectedProduct?: Product | null
  productLoading: boolean
  pollingJobID?: string | null
  cancelingJob: boolean
  onSelectFile: () => void
  onOpenTemplates: () => void
  onGenerate: () => void
  onCancelJob: () => void
}

export function ToolPromptBar({ locale, activeInputMode, activeTemplateName, templateOptionsLoaded: _templateOptionsLoaded, templateOptionsLength: _templateOptionsLength, currentSourceAsset, prompt, setPrompt, creatingJob, uploadingSource, selectedProduct, productLoading, pollingJobID, cancelingJob, onSelectFile, onOpenTemplates, onGenerate, onCancelJob }: ToolPromptBarProps) {
  const needsSourceAsset = activeInputMode !== 'text_to_image'
  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-50 transition-colors duration-700 translate-y-0 opacity-100">
      <div className="glass-strong rounded-full p-2 pl-6 pr-2 flex items-center gap-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 backdrop-blur-3xl relative">
        {needsSourceAsset ? (<>
          <Button
            onClick={onSelectFile}
            className="p-2.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors relative group shrink-0"
            title={copy(locale, '重新上传源图', 'Replace source image')}
          >
            <ImageIcon size={22} />
            {currentSourceAsset && <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[var(--ecom-border)]"></div>}
          </Button>
          <div className="h-6 w-px bg-white/10 shrink-0"></div>
        </>) : null}
        <Button
          onClick={onOpenTemplates}
          className="px-4 py-2.5 rounded-full hover:bg-white/10 text-brand-400 transition-colors flex items-center gap-2 shrink-0 border border-transparent hover:border-brand-500/30"
        >
          <Sparkles size={18} />
          <span className="text-sm font-bold max-w-[120px] truncate hidden sm:inline-block">
            {activeTemplateName || copy(locale, '默认风格', 'Default Style')}
          </span>
          <ChevronRight size={14} className="opacity-50" />
        </Button>
        <div className="h-6 w-px bg-white/10 shrink-0"></div>
        <input
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder={copy(locale, '描述你想要的细节，或直接点击生成...', 'Describe details, or just generate...')}
          className="min-w-0 flex-1 bg-transparent border-none text-white text-base font-medium focus:ring-0 placeholder-white/30 h-12 outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 focus-visible:ring-offset-0"
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              onGenerate()
            }
          }}
        />
        <Button
          onClick={onGenerate}
          disabled={creatingJob || uploadingSource || (needsSourceAsset && !currentSourceAsset) || !selectedProduct || productLoading}
          className="h-14 px-8 rounded-full bg-brand-500 text-white font-black text-sm flex items-center gap-2.5 hover:bg-brand-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300 shadow-[0_0_20px_rgba(var(--brand-500),0.3)] hover:shadow-[0_0_40px_rgba(var(--brand-500),0.6)] shrink-0"
        >
          {creatingJob ? <Loader2 size={20} className="animate-spin" /> : <Wand2 size={20} />}
          {creatingJob ? copy(locale, '生成中...', 'Generating...') : copy(locale, '生成', 'Generate')}
        </Button>
        {pollingJobID && (
          <Button
            onClick={onCancelJob}
            disabled={cancelingJob}
            className="h-14 px-6 rounded-full border border-white/15 bg-white/5 text-white font-bold text-sm flex items-center gap-2 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300 shrink-0"
          >
            {cancelingJob ? <Loader2 size={18} className="animate-spin" /> : <X size={18} />}
            {cancelingJob ? copy(locale, '取消中...', 'Canceling...') : copy(locale, '取消任务', 'Cancel Job')}
          </Button>
        )}
      </div>
    </div>
  )
}
