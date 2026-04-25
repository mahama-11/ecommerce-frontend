import { useState } from 'react'
import { ChevronRight, Sparkles, X } from 'lucide-react'
import type { ActiveTemplateState, Locale, ToolTemplateOption } from '../types'
import { copy } from '../utils'

type GenerationSettingsPanelProps = {
  locale: Locale
  t: (key: string) => string
  activeTemplate: ActiveTemplateState | null
  templateOptions: ToolTemplateOption[]
  loadingTemplateOptions: boolean
  selectingTemplateID: string | null
  prompt: string
  negativePrompt: string
  creatingJob: boolean
  uploadingSource: boolean
  sourceSizeLabel: string
  onPromptChange: (value: string) => void
  onNegativePromptChange: (value: string) => void
  onClearTemplatePlan: () => void
  onSelectTemplatePlan: (template: ToolTemplateOption) => void
  onGenerate: () => void
}

export function GenerationSettingsPanel({
  locale,
  t,
  activeTemplate,
  templateOptions,
  loadingTemplateOptions,
  selectingTemplateID,
  prompt,
  negativePrompt,
  creatingJob,
  uploadingSource,
  sourceSizeLabel,
  onPromptChange,
  onNegativePromptChange,
  onClearTemplatePlan,
  onSelectTemplatePlan,
  onGenerate,
}: GenerationSettingsPanelProps) {
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <div className="glass rounded-3xl p-6 space-y-6">
      <div className="flex items-center gap-2 text-sm font-medium text-white/75">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500/15 text-xs text-brand-300">2</span>
        <span>{copy(locale, '设置生成方式', 'Set Up Generation')}</span>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-white">
              {copy(locale, '选择方案模板', 'Choose a Template Plan')}
            </div>
            <div className="mt-1 text-xs leading-5 text-white/45">
              {copy(
                locale,
                '模板会作为预设方案 prompt 一起提交，默认固定生成 1 张并跟随原图尺寸。弹层中可查看当前工具的全部模板方案。',
                'The selected template is submitted as a preset prompt layer, with one result generated at the original image size. The picker shows all templates for this tool.',
              )}
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-[#0a0d14] px-4 py-3 text-sm text-white/80 transition-colors hover:border-white/[0.16]"
          >
            <span>{activeTemplate ? copy(locale, '切换模板方案', 'Change Template') : copy(locale, '选择模板方案', 'Select Template')}</span>
            <ChevronRight className="h-4 w-4 text-white/40" />
          </button>
          {activeTemplate ? (
            <button
              type="button"
              onClick={onClearTemplatePlan}
              className="rounded-2xl border border-white/[0.08] px-4 py-3 text-sm text-white/55 transition-colors hover:border-white/20 hover:text-white/80"
            >
              {copy(locale, '清除模板', 'Clear')}
            </button>
          ) : null}
        </div>
      </div>

      {activeTemplate ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
          <div className="text-sm font-medium text-white/75">{copy(locale, '当前方案', 'Current Template')}</div>
          <div className="mt-2 text-sm text-white/85">{activeTemplate.name}</div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/[0.06] bg-black/10 px-3 py-3">
              <div className="text-[11px] text-white/35">{copy(locale, '生成数量', 'Result Count')}</div>
              <div className="mt-2 text-sm font-medium text-white">{copy(locale, '固定 1 张', 'Fixed to 1')}</div>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-black/10 px-3 py-3">
              <div className="text-[11px] text-white/35">{copy(locale, '输出尺寸', 'Output Size')}</div>
              <div className="mt-2 text-sm font-medium text-white">{sourceSizeLabel}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
          <div className="text-sm font-medium text-white/75">{copy(locale, '默认生成策略', 'Default Strategy')}</div>
          <div className="mt-2 text-sm leading-6 text-white/50">
            {copy(
              locale,
              '未选择模板时，会直接使用系统业务策略 + 你的补充描述进行生成。',
              'Without a template, the system business strategy and your custom prompt are used directly.',
            )}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/[0.06] bg-black/10 px-3 py-3">
              <div className="text-[11px] text-white/35">{copy(locale, '生成数量', 'Result Count')}</div>
              <div className="mt-2 text-sm font-medium text-white">{copy(locale, '固定 1 张', 'Fixed to 1')}</div>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-black/10 px-3 py-3">
              <div className="text-[11px] text-white/35">{copy(locale, '输出尺寸', 'Output Size')}</div>
              <div className="mt-2 text-sm font-medium text-white">{sourceSizeLabel}</div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <label className="text-sm text-white/60 font-medium">
          {activeTemplate
            ? copy(locale, '自定义补充描述（可选）', 'Custom Prompt Add-on (Optional)')
            : t('tool.textInput')}
        </label>
        <textarea
          rows={5}
          value={prompt}
          onChange={e => onPromptChange(e.target.value)}
          placeholder={
            activeTemplate
              ? copy(
                  locale,
                  '可补充你想强调的细节，例如市场偏好、动作方向、场景氛围等。',
                  'Optionally add details you want to emphasize, such as market preference, pose direction, or scene mood.',
                )
              : t('tool.textPlaceholder')
          }
          className="w-full glass rounded-2xl px-4 py-3 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-brand-500/40 transition-colors"
        />
        <textarea
          rows={2}
          value={negativePrompt}
          onChange={e => onNegativePromptChange(e.target.value)}
          placeholder={copy(
            locale,
            '可选：不希望出现的内容，如模糊、杂乱背景、重复元素',
            'Optional: what should be avoided, such as blur, messy backgrounds, or duplicate elements',
          )}
          className="w-full glass rounded-2xl px-4 py-3 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-brand-500/30 transition-colors"
        />
      </div>

      <button
        onClick={onGenerate}
        disabled={creatingJob || uploadingSource}
        className="btn-primary flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-semibold disabled:opacity-70"
      >
        <Sparkles size={18} className={creatingJob ? 'animate-spin' : ''} />
        {creatingJob
          ? copy(locale, '正在创建任务...', 'Creating job...')
          : uploadingSource
            ? copy(locale, '等待源图登记...', 'Waiting for source registration...')
            : t('tool.generate')}
      </button>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-center text-sm leading-6 text-white/40">
        {t('tool.costLabel')} <span className="text-brand-400 font-medium">{t('tool.costCredits')}</span>
        <span className="mx-2 hidden sm:inline">|</span>
        <span className="block sm:inline">
          {t('tool.remaining')} <span className="text-emerald-400 font-medium">{t('tool.remainingCredits')}</span>
        </span>
      </div>

      {pickerOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-[28px] border border-white/[0.08] bg-[#0c1018] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-base font-semibold text-white">
                  {copy(locale, '选择模板方案', 'Choose a Template Plan')}
                </div>
                <div className="mt-1 text-sm leading-6 text-white/45">
                  {copy(
                    locale,
                    '选择一个预设方案后，系统会把模板 prompt 与系统策略一起提交。你仍可在下方补充自定义描述。',
                    'Once selected, the template prompt is submitted together with the system strategy. You can still add custom instructions below.',
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="rounded-full border border-white/[0.08] p-2 text-white/55 transition-colors hover:border-white/20 hover:text-white/80"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="scrollbar-subtle mt-5 grid max-h-[65vh] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
              {templateOptions.map(item => {
                const isActive = activeTemplate?.id === item.id
                const isLoading = selectingTemplateID === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectTemplatePlan(item)
                      setPickerOpen(false)
                    }}
                    disabled={Boolean(selectingTemplateID)}
                    className={`rounded-2xl border p-4 text-left transition-colors ${
                      isActive
                        ? 'border-brand-500/40 bg-brand-500/10'
                        : 'border-white/[0.06] bg-[#0a0d14] hover:border-white/[0.14]'
                    } ${selectingTemplateID ? 'opacity-80' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-white">{item.name}</div>
                      <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] text-white/50">
                        {isLoading
                          ? copy(locale, '加载中', 'Loading')
                          : isActive
                            ? copy(locale, '已选中', 'Selected')
                            : copy(locale, '可选', 'Available')}
                      </span>
                    </div>
                    <div className="mt-2 line-clamp-3 text-xs leading-5 text-white/50">{item.summary}</div>
                  </button>
                )
              })}
            </div>
            {!loadingTemplateOptions && templateOptions.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-white/[0.08] px-4 py-3 text-xs text-white/40">
                {copy(
                  locale,
                  '当前工具暂未拉到可用方案模板，可直接使用系统策略 + 自定义描述生成。',
                  'No template plans are loaded for this tool yet. You can still generate with the system strategy and your custom prompt.',
                )}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
