import { Play } from 'lucide-react'
import type { Locale, ToolTemplateOption } from '../types'
import { copy } from '../utils'

type ToolTemplateGalleryProps = {
  locale: Locale
  templateOptions: ToolTemplateOption[]
  activeTemplateID?: string
  onSelect: (item: ToolTemplateOption) => void
}

export function ToolTemplateGallery({ locale, templateOptions, activeTemplateID, onSelect }: ToolTemplateGalleryProps) {
  if (templateOptions.length === 0) return null
  return (
    <div className="mt-16 w-full max-w-4xl relative">
      <div className="flex items-center justify-center gap-4 mb-8 opacity-60">
        <div className="h-px bg-gradient-to-r from-transparent to-white/40 flex-1 max-w-[120px]"></div>
        <h4 className="text-xs font-bold text-white uppercase tracking-[0.2em]">{copy(locale, '或试试这些优秀案例', 'Or try these examples')}</h4>
        <div className="h-px bg-gradient-to-l from-transparent to-white/40 flex-1 max-w-[120px]"></div>
      </div>
      <div className="relative w-full overflow-hidden flex pb-4">
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#060608] to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#060608] to-transparent z-10 pointer-events-none" />
        <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
          {[0, 1].map((setIndex) => (
            <div key={setIndex} className="flex gap-5 px-2.5">
              {templateOptions.map(item => {
                const isActive = activeTemplateID === item.id
                return (
                  <div
                    key={`${setIndex}-${item.id}`}
                    role="button"
                    tabIndex={0}
                    aria-label={`${copy(locale, '应用模板', 'Apply template')} ${item.name}`}
                    className={`flex-none w-36 h-36 rounded-2xl bg-black/40 border overflow-hidden cursor-pointer group relative shadow-xl transition-colors duration-500 ${isActive ? 'border-brand-500 shadow-[0_0_30px_rgba(var(--brand-500),0.5)] -translate-y-2' : 'border-white/10 hover:shadow-[0_0_30px_rgba(var(--brand-500),0.3)] hover:border-brand-500/40 hover:-translate-y-2'}`}
                    onClick={() => onSelect(item)}
                    onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') onSelect(item) }}
                  >
                    <img
                      src={item.coverAssetUrl || `https://picsum.photos/seed/${item.id}/300`}
                      className={`w-full h-full object-cover transition-colors duration-700 ${isActive ? 'opacity-100 scale-110' : 'opacity-60 group-hover:opacity-100 group-hover:scale-110'}`}
                      alt={item.name}
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex items-end justify-center pb-4 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      <span className={`flex items-center gap-1.5 text-xs font-bold text-white bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-lg transition-transform duration-300 ${isActive ? 'translate-y-0' : 'transform translate-y-4 group-hover:translate-y-0'}`}>
                        {isActive ? <>{copy(locale, '已应用', 'Applied')}</> : <><Play size={12} fill="currentColor" /> {copy(locale, '一键同款', 'Try this')}</>}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
