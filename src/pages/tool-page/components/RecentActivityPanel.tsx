import { Image } from 'lucide-react'
import type { GeneratedResult, Locale } from '../types'
import { copy, resultStatusLabel } from '../utils'
import { Button } from '@/components/ui/Button'

type RecentActivityPanelProps = {
  locale: Locale
  results: GeneratedResult[]
  currentResult: GeneratedResult | null
  recentJobResults: GeneratedResult[]
  sourcePreviewUrl: string | null
  onSelectRunningJob: (jobID: string) => void
}

export function RecentActivityPanel({
  locale,
  results,
  currentResult,
  recentJobResults,
  sourcePreviewUrl,
  onSelectRunningJob,
}: RecentActivityPanelProps) {
  return (
    <div className="glass rounded-3xl p-6">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-medium text-white/75">{copy(locale, '最近记录', 'Recent Activity')}</div>
          <div className="mt-1 text-xs text-white/35">{copy(locale, '你最近生成过的结果和处理中任务会保留在这里。', 'Your recent results and in-progress jobs stay here for quick review.')}</div>
        </div>
        <div className="text-xs text-white/35">
          {copy(locale, `${results.length} 条记录`, `${results.length} records`)}
        </div>
      </div>
      <div className="space-y-3">
        {(currentResult ? [currentResult, ...recentJobResults] : recentJobResults).map(item => (
          <Button
            key={item.id}
            type="button"
            onClick={() => {
              if (item.status === 'running' || item.status === 'queued') {
                onSelectRunningJob(item.id)
              }
            }}
            className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 text-left transition-colors hover:bg-[var(--ecom-surface-hover)]"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] p-2">
                {item.previewUrl ? (
                  <img src={item.previewUrl} alt={item.title} className="max-h-full w-full object-contain" />
                ) : sourcePreviewUrl ? (
                  <img src={sourcePreviewUrl} alt={item.title} className="max-h-full w-full object-contain opacity-70" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Image className="h-5 w-5 text-white/20" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="truncate text-sm font-medium text-white">{item.title}</div>
                  <div className="rounded-full border border-white/[0.08] bg-black/10 px-2.5 py-1 text-[11px] text-white/55">
                    {resultStatusLabel(locale, item.status)}
                  </div>
                </div>
                <div className="mt-2 text-xs leading-5 text-white/45">{item.hint}</div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500 transition-colors duration-500"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </Button>
        ))}
        {!results.length ? (
          <div className="flex min-h-[160px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02]">
            <Image size={40} className="mb-3 text-white/15" />
            <p className="text-sm text-white/30">
              {copy(locale, '完成一次生成后，这里会自动保留最近结果和处理中任务。', 'After your first generation, recent results and in-progress jobs will appear here automatically.')}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
