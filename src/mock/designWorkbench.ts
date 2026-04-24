export type Locale = 'zh' | 'en'

export interface LocalizedText {
  zh: string
  en: string
}

export type DesignTaskStatus = 'queued' | 'running' | 'review' | 'done'

export interface DesignTask {
  id: string
  status: DesignTaskStatus
  title: LocalizedText
  owner: string
  product: LocalizedText
  output: LocalizedText
}

export interface DesignAsset {
  id: string
  title: LocalizedText
  desc: LocalizedText
  meta: LocalizedText
  status: DesignTaskStatus | 'draft'
}

export interface DesignMember {
  id: string
  name: string
  role: LocalizedText
  focus: LocalizedText
}

export interface DesignTimelineItem {
  id: string
  title: LocalizedText
  meta: LocalizedText
  time: string
}

export interface DesignWorkbenchMock {
  tasks: DesignTask[]
  assets: DesignAsset[]
  members: DesignMember[]
  timeline: DesignTimelineItem[]
}

export const DESIGN_STATUS_STYLES: Record<
  DesignTaskStatus | 'draft',
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
  draft: {
    zh: '草稿',
    en: 'Draft',
    className: 'bg-fuchsia-500/12 text-fuchsia-300 border-fuchsia-500/20',
  },
}

const sharedMembers: DesignMember[] = [
  {
    id: 'member-ava',
    name: 'Ava',
    role: { zh: '视觉运营', en: 'Visual Operator' },
    focus: { zh: '主图与活动图生产', en: 'Hero and campaign visuals' },
  },
  {
    id: 'member-liam',
    name: 'Liam',
    role: { zh: '设计师', en: 'Designer' },
    focus: { zh: '详情页与模板加工', en: 'PDP sections and template polishing' },
  },
  {
    id: 'member-mia',
    name: 'Mia',
    role: { zh: '审核与品牌', en: 'Brand Reviewer' },
    focus: { zh: '品牌规范与审核通过', en: 'Brand consistency and approvals' },
  },
] as const

export const DESIGN_WORKBENCH_MOCKS: Record<string, DesignWorkbenchMock> = {
  '/draw/product-home': {
    tasks: [
      {
        id: 'task-prod-1',
        status: 'running',
        title: { zh: '保鲜盒主图批量生成', en: 'Storage-box hero batch generation' },
        owner: 'Ava',
        product: { zh: '厨房收纳保鲜盒', en: 'Kitchen storage container' },
        output: { zh: '主图 4 张 + 白底图 2 张', en: '4 hero images + 2 white-background images' },
      },
      {
        id: 'task-prod-2',
        status: 'review',
        title: { zh: '杯具场景图待审核', en: 'Cup scene images awaiting review' },
        owner: 'Mia',
        product: { zh: '夏季吸管杯', en: 'Summer straw cup' },
        output: { zh: '场景图 6 张', en: '6 scene images' },
      },
      {
        id: 'task-prod-3',
        status: 'queued',
        title: { zh: '详情页卖点图导出排队', en: 'PDP selling-point export queued' },
        owner: 'Liam',
        product: { zh: '折叠收纳架', en: 'Foldable organizer' },
        output: { zh: '详情切片 8 张', en: '8 PDP slices' },
      },
    ],
    assets: [
      {
        id: 'asset-prod-1',
        title: { zh: '保鲜盒 A 套图', en: 'Container set A' },
        desc: { zh: '主图、侧视图和白底图已回收至素材库', en: 'Hero, side-view, and white-background assets synced back to the library' },
        meta: { zh: '来源于本周上新项目', en: 'Generated from this week’s launch project' },
        status: 'done',
      },
      {
        id: 'asset-prod-2',
        title: { zh: '收纳架详情页素材', en: 'Organizer PDP assets' },
        desc: { zh: '待设计器继续加工为详情模块', en: 'Awaiting further processing in the designer' },
        meta: { zh: '与设计器首页联动', en: 'Linked to the designer home' },
        status: 'review',
      },
    ],
    members: [...sharedMembers],
    timeline: [
      {
        id: 'timeline-prod-1',
        title: { zh: '主图批量任务启动', en: 'Hero-image batch started' },
        meta: { zh: 'SKU 18 个，批量处理', en: '18 SKUs in one batch' },
        time: '10:20',
      },
      {
        id: 'timeline-prod-2',
        title: { zh: '首批结果回收至素材库', en: 'First outputs synced to asset library' },
        meta: { zh: '共 16 张图', en: '16 images synced' },
        time: '11:05',
      },
    ],
  },
  '/draw/product-records': {
    tasks: [
      {
        id: 'task-record-1',
        status: 'done',
        title: { zh: '耳饰持握图生成完成', en: 'Handheld earring generation completed' },
        owner: 'Ava',
        product: { zh: '珍珠耳饰', en: 'Pearl earrings' },
        output: { zh: '交付包已生成', en: 'Delivery bundle generated' },
      },
      {
        id: 'task-record-2',
        status: 'review',
        title: { zh: '模特图换背景待复核', en: 'Model background swap pending review' },
        owner: 'Mia',
        product: { zh: '针织上衣', en: 'Knitted top' },
        output: { zh: '3 个背景版本', en: '3 background variants' },
      },
      {
        id: 'task-record-3',
        status: 'queued',
        title: { zh: '失败任务等待重试', en: 'Failed task waiting for retry' },
        owner: 'Liam',
        product: { zh: '桌面收纳盒', en: 'Desktop organizer' },
        output: { zh: '重试参数已保存', en: 'Retry parameters stored' },
      },
    ],
    assets: [
      {
        id: 'asset-record-1',
        title: { zh: '上周完成任务集', en: 'Completed tasks last week' },
        desc: { zh: '可以复制参数并重新生成', en: 'Can reuse parameters and regenerate quickly' },
        meta: { zh: '记录页核心资产', en: 'Core record-page asset' },
        status: 'done',
      },
    ],
    members: [...sharedMembers],
    timeline: [
      {
        id: 'timeline-record-1',
        title: { zh: '失败任务重试参数已保存', en: 'Retry configuration saved for failed task' },
        meta: { zh: '支持重新发起生成', en: 'Ready for rerun' },
        time: '09:40',
      },
      {
        id: 'timeline-record-2',
        title: { zh: '导出包已推送下载中心', en: 'Export bundle sent to download center' },
        meta: { zh: '订单与交付链已串联', en: 'Connected to order and delivery flow' },
        time: '12:10',
      },
    ],
  },
  '/draw/designer-home': {
    tasks: [
      {
        id: 'task-designer-1',
        status: 'running',
        title: { zh: '详情页头图拼版中', en: 'PDP hero layout in progress' },
        owner: 'Liam',
        product: { zh: '收纳架详情页', en: 'Organizer PDP' },
        output: { zh: 'Banner + 卖点模块', en: 'Banner + benefit modules' },
      },
      {
        id: 'task-designer-2',
        status: 'review',
        title: { zh: '活动海报待品牌审核', en: 'Campaign poster pending brand review' },
        owner: 'Mia',
        product: { zh: '夏季活动页', en: 'Summer campaign page' },
        output: { zh: '海报 2 套', en: '2 poster variants' },
      },
    ],
    assets: [
      {
        id: 'asset-designer-1',
        title: { zh: '活动海报模板', en: 'Campaign poster template' },
        desc: { zh: '可直接带入品牌物料和商品图', en: 'Ready to inject brand assets and product visuals' },
        meta: { zh: '模板驱动设计', en: 'Template-driven design' },
        status: 'draft',
      },
      {
        id: 'asset-designer-2',
        title: { zh: '详情页模块稿', en: 'PDP module drafts' },
        desc: { zh: '与我的设计联动，可继续修改', en: 'Linked with My Designs for further edits' },
        meta: { zh: '支持导出与协作', en: 'Supports export and collaboration' },
        status: 'running',
      },
    ],
    members: [...sharedMembers],
    timeline: [
      {
        id: 'timeline-designer-1',
        title: { zh: '模板载入设计器', en: 'Template loaded into designer' },
        meta: { zh: '品牌色与素材已同步', en: 'Brand palette and assets synced' },
        time: '13:05',
      },
    ],
  },
  '/draw/my-design': {
    tasks: [
      {
        id: 'task-my-design-1',
        status: 'review',
        title: { zh: '个人草稿待团队反馈', en: 'Personal draft awaiting team feedback' },
        owner: 'Liam',
        product: { zh: '保温杯详情页', en: 'Thermos PDP' },
        output: { zh: '导出稿件 3 版', en: '3 exported revisions' },
      },
    ],
    assets: [
      {
        id: 'asset-my-design-1',
        title: { zh: '保温杯详情长图', en: 'Thermos long PDP image' },
        desc: { zh: '最近修改于今天上午，可继续编辑或导出', en: 'Edited this morning and ready for more editing or export' },
        meta: { zh: '来源于设计器首页', en: 'Originated from designer home' },
        status: 'draft',
      },
      {
        id: 'asset-my-design-2',
        title: { zh: '活动页头图', en: 'Campaign hero banner' },
        desc: { zh: '已导出到下载中心', en: 'Exported to download center' },
        meta: { zh: '支持回流改稿', en: 'Can flow back for more edits' },
        status: 'done',
      },
    ],
    members: [...sharedMembers],
    timeline: [
      {
        id: 'timeline-my-design-1',
        title: { zh: '稿件导出完成', en: 'Draft export completed' },
        meta: { zh: '可前往下载中心查看', en: 'Open the download center to review' },
        time: '14:20',
      },
    ],
  },
  '/draw/my-template': {
    tasks: [
      {
        id: 'task-template-1',
        status: 'done',
        title: { zh: '详情模板发布完成', en: 'PDP template published' },
        owner: 'Liam',
        product: { zh: '厨房系列模板', en: 'Kitchen collection template' },
        output: { zh: '已共享给团队', en: 'Shared with the team' },
      },
    ],
    assets: [
      {
        id: 'asset-template-1',
        title: { zh: '夏季活动模板', en: 'Summer campaign template' },
        desc: { zh: '支持批量带入品牌图和卖点文案', en: 'Supports injecting brand assets and benefit copy in batch' },
        meta: { zh: '高复用模板', en: 'Highly reusable template' },
        status: 'done',
      },
      {
        id: 'asset-template-2',
        title: { zh: '详情页模块模板', en: 'PDP module template' },
        desc: { zh: '可继续沉淀为 AI Agent 模板联动', en: 'Can be extended into AI Agent template workflows' },
        meta: { zh: '连接视觉与运营', en: 'Connects design and operations' },
        status: 'draft',
      },
    ],
    members: [...sharedMembers],
    timeline: [
      {
        id: 'timeline-template-1',
        title: { zh: '模板加入团队空间', en: 'Template added to team space' },
        meta: { zh: '共享模板数量 +1', en: 'Shared template count +1' },
        time: '15:00',
      },
    ],
  },
  '/draw/team-space': {
    tasks: [
      {
        id: 'task-team-1',
        status: 'review',
        title: { zh: '团队模板待审批', en: 'Shared template pending approval' },
        owner: 'Mia',
        product: { zh: '春季家居项目', en: 'Spring home project' },
        output: { zh: '待通过后开放给全员', en: 'Will be shared to all after approval' },
      },
      {
        id: 'task-team-2',
        status: 'running',
        title: { zh: '项目协作稿处理中', en: 'Collaborative project draft in progress' },
        owner: 'Ava',
        product: { zh: '家居场景图项目', en: 'Home-scene project' },
        output: { zh: '成员协同修改', en: 'Being edited collaboratively' },
      },
    ],
    assets: [
      {
        id: 'asset-team-1',
        title: { zh: '共享模板池', en: 'Shared template pool' },
        desc: { zh: '团队共用模板与角色分配入口', en: 'Shared team templates and role-based access entry' },
        meta: { zh: '协作空间核心资产', en: 'Core collaborative asset' },
        status: 'review',
      },
    ],
    members: [...sharedMembers],
    timeline: [
      {
        id: 'timeline-team-1',
        title: { zh: '品牌审核发起', en: 'Brand review requested' },
        meta: { zh: '等待审批结论', en: 'Waiting for approval decision' },
        time: '11:55',
      },
      {
        id: 'timeline-team-2',
        title: { zh: '新成员加入项目空间', en: 'New member joined the project space' },
        meta: { zh: '成员权限已分配', en: 'Permissions assigned' },
        time: '16:10',
      },
    ],
  },
  '/draw/history': {
    tasks: [
      {
        id: 'task-history-1',
        status: 'done',
        title: { zh: '昨日商品图交付完成', en: 'Yesterday’s product-image delivery completed' },
        owner: 'Ava',
        product: { zh: '保鲜盒系列', en: 'Storage container line' },
        output: { zh: '交付包已下载', en: 'Bundle already downloaded' },
      },
      {
        id: 'task-history-2',
        status: 'review',
        title: { zh: '团队模板回写记录', en: 'Team template write-back record' },
        owner: 'Liam',
        product: { zh: '夏促模板', en: 'Summer promotion template' },
        output: { zh: '模板已同步到共享层', en: 'Template synced to shared layer' },
      },
    ],
    assets: [
      {
        id: 'asset-history-1',
        title: { zh: '近 7 日时间线', en: '7-day timeline' },
        desc: { zh: '生成、设计、导出、下载都在同一时间线里', en: 'Generation, design, export, and download appear in one timeline' },
        meta: { zh: '统一历史视角', en: 'Unified history view' },
        status: 'done',
      },
    ],
    members: [...sharedMembers],
    timeline: [
      {
        id: 'timeline-history-1',
        title: { zh: '生成任务完成并回收', en: 'Generation task completed and recovered' },
        meta: { zh: '进入设计链与下载链', en: 'Entered design and download flows' },
        time: '昨天 18:20',
      },
      {
        id: 'timeline-history-2',
        title: { zh: '模板共享到团队空间', en: 'Template shared to the team space' },
        meta: { zh: '成员已收到更新', en: 'Team members received the update' },
        time: '今天 09:15',
      },
    ],
  },
}

export function copyLocalizedText(locale: Locale, value: LocalizedText) {
  return locale === 'zh' ? value.zh : value.en
}

export function getDesignWorkbenchMock(pathname: string): DesignWorkbenchMock {
  return DESIGN_WORKBENCH_MOCKS[pathname] ?? DESIGN_WORKBENCH_MOCKS['/draw/product-home']
}

export function advanceDesignStatus(
  current: DesignTaskStatus,
): DesignTaskStatus {
  const next: Record<DesignTaskStatus, DesignTaskStatus> = {
    queued: 'running',
    running: 'review',
    review: 'done',
    done: 'done',
  }

  return next[current]
}

export function createMockDesignTask(pathname: string, count: number): DesignTask {
  const suffix = String(count + 1).padStart(2, '0')
  return {
    id: `task-extra-${suffix}`,
    status: 'queued',
    title: {
      zh: pathname === '/draw/team-space' ? `团队协作任务 ${suffix}` : `新增视觉任务 ${suffix}`,
      en: pathname === '/draw/team-space' ? `Team Collaboration Task ${suffix}` : `New Visual Task ${suffix}`,
    },
    owner: 'Ava',
    product: {
      zh: pathname === '/draw/designer-home' ? '设计加工项目' : '视觉生产项目',
      en: pathname === '/draw/designer-home' ? 'Design processing project' : 'Visual production project',
    },
    output: {
      zh: '等待进入下一状态',
      en: 'Waiting for the next status',
    },
  }
}
