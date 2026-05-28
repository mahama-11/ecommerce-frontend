export type Locale = 'zh' | 'en'

export interface LocalizedText {
  zh: string
  en: string
}

export type OpsRecordStatus = 'queued' | 'running' | 'review' | 'done'

export interface OpsRecord {
  id: string
  title: LocalizedText
  desc: LocalizedText
  status: OpsRecordStatus
  owner: string
  meta: LocalizedText
  action: LocalizedText
}

export const OPS_STATUS_STYLES: Record<
  OpsRecordStatus,
  { zh: string; en: string; className: string }
> = {
  queued: {
    zh: '排队中',
    en: 'Queued',
    className: 'bg-white/[0.05] text-white/55 border-white/[0.08]',
  },
  running: {
    zh: '处理中',
    en: 'Running',
    className: 'bg-brand-500/12 text-brand-300 border-brand-500/20',
  },
  review: {
    zh: '待审核',
    en: 'In Review',
    className: 'bg-amber-500/12 text-amber-300 border-amber-500/20',
  },
  done: {
    zh: '已完成',
    en: 'Done',
    className: 'bg-emerald-500/12 text-emerald-300 border-emerald-500/20',
  },
}

export const pickOps = (locale: Locale, value: LocalizedText) =>
  locale === 'zh' ? value.zh : value.en

export const OPS_RECORDS_MAP: Record<string, OpsRecord[]> = {
  '/aiChat/batchListing': [
    {
      id: 'ops-batch-1',
      title: { zh: '厨房收纳盒模板中心', en: 'Kitchen organizer template center' },
      desc: { zh: '已挂载评论洞察和品牌语气，待导出到商品中心。', en: 'Review insights and brand tone attached, waiting to export into the product center.' },
      status: 'running',
      owner: 'Ava',
      meta: { zh: 'SKU 18 个 · Amazon', en: '18 SKUs · Amazon' },
      action: { zh: '导出 CSV', en: 'Export CSV' },
    },
    {
      id: 'ops-batch-2',
      title: { zh: '杯具标题重写任务', en: 'Cup-title rewrite batch' },
      desc: { zh: '已完成质检，待回写商品中心。', en: 'QA completed and ready to write back to the product center.' },
      status: 'review',
      owner: 'Mia',
      meta: { zh: 'SKU 9 个 · TikTok Shop', en: '9 SKUs · TikTok Shop' },
      action: { zh: '回写商品中心', en: 'Write Back' },
    },
  ],
  '/aiChat/history': [
    {
      id: 'ops-history-1',
      title: { zh: '收纳盒卖点对话会话', en: 'Organizer selling-point session' },
      desc: { zh: '最近一次输出已被保存为模板并同步到模板中心。', en: 'Latest output was saved as a template and synced into template center.' },
      status: 'done',
      owner: 'Ava',
      meta: { zh: '今天 10:40', en: 'Today 10:40' },
      action: { zh: '继续追问', en: 'Continue Chat' },
    },
    {
      id: 'ops-history-2',
      title: { zh: '品牌规则问答记录', en: 'Brand-rule Q&A session' },
      desc: { zh: '待归档进知识资产层。', en: 'Pending archive into the knowledge asset layer.' },
      status: 'queued',
      owner: 'Mia',
      meta: { zh: '知识库引用 3 条', en: '3 knowledge citations' },
      action: { zh: '同步知识库', en: 'Sync to Knowledge Base' },
    },
  ],
  '/aiChat/analysisRecords': [
    {
      id: 'ops-analysis-1',
      title: { zh: '亚马逊评论洞察报告', en: 'Amazon review insight report' },
      desc: { zh: '核心结论已生成，待回写模板中心。', en: 'Core conclusions generated and ready to flow into template center.' },
      status: 'review',
      owner: 'Liam',
      meta: { zh: '评论样本 840 条', en: '840 review samples' },
      action: { zh: '发送到模板中心', en: 'Send to Template Center' },
    },
    {
      id: 'ops-analysis-2',
      title: { zh: '竞品卖点拆解任务', en: 'Competitor selling-point breakdown' },
      desc: { zh: '正在整理证据与建议动作。', en: 'Compiling evidence and suggested actions.' },
      status: 'running',
      owner: 'Ava',
      meta: { zh: '竞品链接 12 个', en: '12 competitor URLs' },
      action: { zh: '查看结论', en: 'Open Insights' },
    },
  ],
  '/aiChat/training': [
    {
      id: 'ops-training-1',
      title: { zh: '选品策略 v3 校准', en: 'Selection strategy v3 tuning' },
      desc: { zh: '引入预算约束和类目偏好后的新版本待采纳。', en: 'A new version with budget constraints and category preferences is awaiting adoption.' },
      status: 'review',
      owner: 'Mia',
      meta: { zh: '采纳率预测 94%', en: 'Predicted adoption 94%' },
      action: { zh: '采纳新策略', en: 'Adopt Strategy' },
    },
    {
      id: 'ops-training-2',
      title: { zh: '历史反馈重训练', en: 'Historical feedback retraining' },
      desc: { zh: '正在吸收近 30 天人工修正结果。', en: 'Absorbing manual corrections from the last 30 days.' },
      status: 'running',
      owner: 'Ava',
      meta: { zh: '反馈样本 126 条', en: '126 feedback samples' },
      action: { zh: '查看版本差异', en: 'Compare Versions' },
    },
  ],
}

export function getOpsRecords(pathname: string) {
  return OPS_RECORDS_MAP[pathname] ?? []
}

export function advanceOpsStatus(status: OpsRecordStatus): OpsRecordStatus {
  const next: Record<OpsRecordStatus, OpsRecordStatus> = {
    queued: 'running',
    running: 'review',
    review: 'done',
    done: 'done',
  }

  return next[status]
}
