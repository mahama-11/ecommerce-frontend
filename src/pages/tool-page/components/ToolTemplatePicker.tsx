import { ChevronRight, Loader2, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Z_INDEX } from '@/styles/zIndex'
import type { Locale, ToolTemplateOption } from '../types'
import { copy } from '../utils'

type ToolTemplatePickerProps = {
  open: boolean
  locale: Locale
  templateSearchTerm: string
  setTemplateSearchTerm: (value: string) => void
  templateOptionsLoading: boolean
  templateOptionsError: string
  filteredTemplateOptions: ToolTemplateOption[]
  activeTemplateID?: string
  selectingTemplateID: string | null
  onClose: () => void
  onRetry: () => void
  onSelect: (item: ToolTemplateOption) => void
}

export function ToolTemplatePicker({ open, locale, templateSearchTerm, setTemplateSearchTerm, templateOptionsLoading, templateOptionsError, filteredTemplateOptions, activeTemplateID, selectingTemplateID, onClose, onRetry, onSelect }: ToolTemplatePickerProps) {
  if (!open) return null
  return (
    <div className={`fixed inset-0 ${Z_INDEX.modal} flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-md animate-in fade-in duration-300`}>
      <div data-testid="template-picker-modal" className="flex w-full max-w-5xl max-h-[min(86vh,780px)] flex-col overflow-hidden rounded-[32px] border border-white/10 bg-[var(--ecom-surface)] p-6 shadow-2xl animate-in zoom-in-95 duration-300 sm:p-8">
        <div className="mb-6 flex shrink-0 items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-black text-white">{copy(locale, '选择模特与风格', 'Choose Style Template')}</h3>
            <p className="text-sm font-medium text-white/40 mt-2">
              {copy(locale, '点击直接应用，省去繁琐提示词。', 'Click to apply instantly, skip complex prompts.')}
            </p>
          </div>
          <Button onClick={onClose} className="rounded-full bg-white/5 p-3 hover:bg-white/10 text-white/60 hover:text-white transition-colors">
            <X size={20} />
          </Button>
        </div>
        <div className="relative mb-5 shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
          <input
            type="text"
            value={templateSearchTerm}
            onChange={(e) => setTemplateSearchTerm(e.target.value)}
            placeholder={copy(locale, '搜索模板名称...', 'Search templates...')}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 focus-visible:ring-offset-0 focus:border-brand-500/50 transition-colors"
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
            <Button type="button" onClick={onRetry} className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10">
              {copy(locale, '重试加载', 'Retry')}
            </Button>
          </div>
        ) : filteredTemplateOptions.length === 0 ? (
          <div className="flex min-h-[240px] items-center justify-center text-sm text-white/50">
            {copy(locale, '暂无可用模板', 'No templates available')}
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto pr-1 pb-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTemplateOptions.map(item => {
                const isActive = activeTemplateID === item.id
                return (
                  <Button
                    key={item.id}
                    data-testid="template-style-card"
                    aria-busy={selectingTemplateID === item.id}
                    onClick={() => onSelect(item)}
                    className={`group relative h-auto min-h-[320px] whitespace-normal overflow-hidden rounded-2xl border-2 text-left transition-colors duration-300 flex flex-col items-stretch justify-start ${isActive ? 'border-brand-500 shadow-[0_0_30px_rgba(var(--brand-500),0.3)] scale-[1.02] z-10' : 'border-white/5 hover:border-white/20'}`}
                  >
                    <div className="relative h-56 w-full shrink-0 overflow-hidden bg-white/[0.03]">
                      <img src={item.coverAssetUrl || `https://picsum.photos/seed/${item.id}/300/400`} className="absolute inset-0 h-full w-full object-cover opacity-85 transition-opacity group-hover:opacity-100" alt={item.name} />
                      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 to-transparent" />
                    </div>
                    <div className="flex min-h-[104px] flex-1 flex-col justify-between gap-3 bg-black/55 p-4">
                      <div>
                        <div className="text-base font-bold text-white leading-snug">{item.name}</div>
                        <div className="mt-2 text-sm text-white/65 leading-relaxed line-clamp-3">{item.summary}</div>
                      </div>
                      <div className="flex items-center justify-between text-xs font-bold text-brand-200">
                        <span>{copy(locale, '点击应用', 'Apply')}</span>
                        {selectingTemplateID === item.id ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
                      </div>
                    </div>
                    {isActive && (
                      <div className="absolute top-3 right-3 bg-brand-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                        {copy(locale, '已选', 'Selected')}
                      </div>
                    )}
                  </Button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
