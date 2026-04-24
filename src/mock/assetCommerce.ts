export type Locale = 'zh' | 'en'

export interface LocalizedText {
  zh: string
  en: string
}

export type UploadStatus = 'queued' | 'processing' | 'ready'
export type OrderStatus = 'pending' | 'active' | 'invoice'
export type DeliveryStatus = 'packing' | 'ready' | 'expired'

export interface UploadItem {
  id: string
  name: LocalizedText
  meta: LocalizedText
  status: UploadStatus
}

export interface OrderItem {
  id: string
  title: LocalizedText
  amount: string
  status: OrderStatus
  meta: LocalizedText
}

export interface DeliveryItem {
  id: string
  title: LocalizedText
  size: string
  status: DeliveryStatus
  meta: LocalizedText
}

export const copyText = (locale: Locale, value: LocalizedText) => (locale === 'zh' ? value.zh : value.en)

export const UPLOAD_GROUPS: Record<string, UploadItem[]> = {
  '/database/knowledge': [
    {
      id: 'upload-kb-1',
      name: { zh: '2026 春季品牌手册.pdf', en: '2026 Spring Brand Handbook.pdf' },
      meta: { zh: '文档解析中 · 32 页', en: 'Parsing document · 32 pages' },
      status: 'processing',
    },
    {
      id: 'upload-kb-2',
      name: { zh: '亚马逊合规 FAQ.docx', en: 'Amazon Compliance FAQ.docx' },
      meta: { zh: '已入库 · 可用于知识问答', en: 'Indexed · ready for knowledge chat' },
      status: 'ready',
    },
  ],
  '/database/picturelibrary': [
    {
      id: 'upload-img-1',
      name: { zh: '保鲜盒主图源文件.zip', en: 'Storage Box Hero Assets.zip' },
      meta: { zh: '批量上传中 · 18 个文件', en: 'Batch uploading · 18 files' },
      status: 'processing',
    },
    {
      id: 'upload-img-2',
      name: { zh: '厨房场景灵感板.fig', en: 'Kitchen Scene Inspiration.fig' },
      meta: { zh: '待打标签 · 待团队确认', en: 'Pending tags · waiting team review' },
      status: 'queued',
    },
  ],
  '/brandLibrary': [
    {
      id: 'upload-brand-1',
      name: { zh: '品牌语气约束.md', en: 'Brand Tone Constraints.md' },
      meta: { zh: '已同步到模板与问答链路', en: 'Synced to template and chat flows' },
      status: 'ready',
    },
    {
      id: 'upload-brand-2',
      name: { zh: '视觉标准色板.ai', en: 'Visual Color Palette.ai' },
      meta: { zh: '整理中 · 等待版本确认', en: 'Organizing · waiting version confirmation' },
      status: 'queued',
    },
  ],
  '/database/sensitiveThesaurus': [
    {
      id: 'upload-risk-1',
      name: { zh: '平台敏感词规则.csv', en: 'Marketplace Risk Terms.csv' },
      meta: { zh: '规则入库中 · 216 条', en: 'Importing rules · 216 entries' },
      status: 'processing',
    },
    {
      id: 'upload-risk-2',
      name: { zh: '品牌禁用语清单.xlsx', en: 'Brand Restricted Phrases.xlsx' },
      meta: { zh: '已可用于内容质检', en: 'Ready for content QA' },
      status: 'ready',
    },
  ],
  '/database/tagManage': [
    {
      id: 'upload-tag-1',
      name: { zh: '平台标签字典.json', en: 'Platform Tag Dictionary.json' },
      meta: { zh: '待合并到统一标签树', en: 'Pending merge into master tag tree' },
      status: 'queued',
    },
  ],
}

export const ORDER_ITEMS: OrderItem[] = [
  {
    id: 'ord-202604-1001',
    title: { zh: '专业版月度订阅', en: 'Pro Monthly Subscription' },
    amount: '¥239',
    status: 'active',
    meta: { zh: '2026-04-18 开通 · 自动续费', en: 'Activated on 2026-04-18 · auto renewal' },
  },
  {
    id: 'ord-202604-1002',
    title: { zh: '算力加油包 5,000', en: 'Credit Pack 5,000' },
    amount: '¥399',
    status: 'pending',
    meta: { zh: '待支付 · 来源于批量视频任务', en: 'Pending payment · created from batch video tasks' },
  },
  {
    id: 'ord-202604-1003',
    title: { zh: '团队席位扩容 x3', en: 'Team Seat Expansion x3' },
    amount: '¥699',
    status: 'invoice',
    meta: { zh: '发票处理中 · 企业采购', en: 'Invoice processing · enterprise procurement' },
  },
]

export const DELIVERY_ITEMS: DeliveryItem[] = [
  {
    id: 'dl-202604-2001',
    title: { zh: '夏季杯具场景图打包', en: 'Summer Cup Scene Bundle' },
    size: '428MB',
    status: 'packing',
    meta: { zh: '正在打包 36 张图片与 2 个设计稿', en: 'Packing 36 images and 2 design drafts' },
  },
  {
    id: 'dl-202604-2002',
    title: { zh: '服装模特图交付包', en: 'Apparel Model Delivery Bundle' },
    size: '1.1GB',
    status: 'ready',
    meta: { zh: '24 小时内可下载', en: 'Available for download within 24 hours' },
  },
  {
    id: 'dl-202604-2003',
    title: { zh: '视频批量转换结果', en: 'Batch Video Conversion Results' },
    size: '860MB',
    status: 'expired',
    meta: { zh: '已过期 · 可重新打包', en: 'Expired · can be repackaged' },
  },
]

export function createMockUpload(pathname: string, count: number): UploadItem {
  const suffix = String(count + 1).padStart(2, '0')

  if (pathname === '/database/picturelibrary') {
    return {
      id: `upload-img-new-${suffix}`,
      name: { zh: `新素材批次 ${suffix}.zip`, en: `New Asset Batch ${suffix}.zip` },
      meta: { zh: '新加入上传队列 · 等待解析', en: 'Added to upload queue · waiting for parsing' },
      status: 'queued',
    }
  }

  if (pathname === '/brandLibrary') {
    return {
      id: `upload-brand-new-${suffix}`,
      name: { zh: `品牌规则草稿 ${suffix}.md`, en: `Brand Rule Draft ${suffix}.md` },
      meta: { zh: '待审核后同步品牌底座', en: 'Pending review before syncing to the brand layer' },
      status: 'queued',
    }
  }

  if (pathname === '/database/sensitiveThesaurus') {
    return {
      id: `upload-risk-new-${suffix}`,
      name: { zh: `风险词扩展包 ${suffix}.csv`, en: `Risk-Term Extension ${suffix}.csv` },
      meta: { zh: '待导入规则引擎', en: 'Waiting for import into the rule engine' },
      status: 'queued',
    }
  }

  if (pathname === '/database/tagManage') {
    return {
      id: `upload-tag-new-${suffix}`,
      name: { zh: `标签映射表 ${suffix}.json`, en: `Tag Mapping ${suffix}.json` },
      meta: { zh: '待合并到跨模块标签体系', en: 'Pending merge into the cross-module tag system' },
      status: 'queued',
    }
  }

  return {
    id: `upload-kb-new-${suffix}`,
    name: { zh: `新知识文档 ${suffix}.pdf`, en: `New Knowledge File ${suffix}.pdf` },
    meta: { zh: '等待解析与向量化', en: 'Waiting for parsing and vectorization' },
    status: 'queued',
  }
}

export function createMockDelivery(count: number): DeliveryItem {
  const suffix = String(count + 1).padStart(2, '0')
  return {
    id: `dl-new-${suffix}`,
    title: { zh: `新的交付包 ${suffix}`, en: `New Delivery Bundle ${suffix}` },
    size: `${320 + count * 40}MB`,
    status: 'packing',
    meta: { zh: '已进入导出打包队列', en: 'Added to the export packaging queue' },
  }
}

export function createMockOrder(count: number): OrderItem {
  const suffix = String(count + 1).padStart(2, '0')
  return {
    id: `ord-new-${suffix}`,
    title: { zh: `补充订单 ${suffix}`, en: `Supplemental Order ${suffix}` },
    amount: `¥${199 + count * 20}`,
    status: 'pending',
    meta: { zh: '新建待支付订单 · 可用于商业链路演示', en: 'New pending order · ready for commerce-flow demos' },
  }
}
