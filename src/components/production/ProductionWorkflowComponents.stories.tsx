import type { Meta, StoryObj } from '@storybook/react-vite'
import { DecisionStepCard, EditablePromptCard, ProductionEmptyState, ProductionSectionCard, ResultAssetCard, VersionLineage } from './ProductionWorkflowComponents'
import type { AssetVariant, DecisionStep, VersionNode } from '@/types/production'

const meta = {
  title: 'Production/WorkflowComponents',
  component: ProductionSectionCard,
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'dark' },
    viewport: { defaultViewport: 'responsive' },
  },
} satisfies Meta<typeof ProductionSectionCard>

export default meta

type Story = StoryObj<typeof meta>

const longDecisionStep: DecisionStep = {
  id: 'reference-background',
  stepNumber: 4,
  title: '参考图里的背景和道具元素是否要进入本次出图要求',
  description: '这是一段很长的中文说明，用来验证组件在真实业务语境、小屏宽度和多行内容下不会挤压、截断或把决策后果说不清楚。',
  status: 'active',
  options: [
    { id: 'keep', label: '保留参考图中的工业车间、暖色逆光、金属碎屑和工具台氛围，并纳入本次出图要求', description: '适合希望生成图明显继承参考图风格时使用。', icon: '✓', confidence: 0.88 },
    { id: 'replace', label: '只保留参考图的光影方向，背景主体仍以当前 SKU 和品牌约束为准', description: '适合参考图好看但主体或场景不完全适配时使用。', icon: '↔', confidence: 0.76 },
    { id: 'drop', label: '不纳入参考图背景，只使用商品图和平台主图规范', description: '适合需要干净主图、减少干扰元素时使用。', icon: '×', confidence: 0.64 },
  ],
  selectedOptionId: 'keep',
}

const versionNodes: VersionNode[] = [
  { id: 'v-init', version: 'V1.0', label: '初始生成轮次：保留 SKU 主体并参考工业车间光影', description: '包含 6 张结果图，其中 2 张进入后续精修候选。', timestamp: new Date().toISOString(), isCurrent: false, skuBias: 55, refBias: 45, strategySnapshot: '保留主体，参考工业光影', childrenIds: ['v-2'], weightParams: { skuBias: 55, styleStrength: 0.6, identityConsistency: 0.8, creativeFreedom: 0.4 } },
  { id: 'v-2', version: 'V1.1', label: '第二轮精修：压低背景复杂度，强化材质纹理', description: '当前选中版本，适合进入 Listing 主图和场景图组合。', timestamp: new Date().toISOString(), isCurrent: true, skuBias: 70, refBias: 30, strategySnapshot: '降低背景复杂度，强化材质纹理', parentId: 'v-init', childrenIds: [], weightParams: { skuBias: 70, styleStrength: 0.45, identityConsistency: 0.9, creativeFreedom: 0.25 } },
]

const variant: AssetVariant = {
  id: 'asset-result-01',
  intentId: 'intent-01',
  assetUrl: 'https://picsum.photos/seed/ecom-result-card/512/512',
  thumbnailUrl: 'https://picsum.photos/seed/ecom-result-card/512/512',
  width: 1024,
  height: 1024,
  status: 'ready',
  score: 91,
  metadata: {
    template_name: '极端长 SKU 名称 - Amazon 平台主图模板 / 工业车间质感保留 / 暖色逆光版本',
    source_name: 'QA-STYLE-EXTREME-SKU-0000000000001 白色棉质 T-Shirt 正面图',
  },
  createdAt: new Date().toISOString(),
}

export const DecisionLongChinese: StoryObj<typeof DecisionStepCard> = {
  render: () => <div className="max-w-xl"><DecisionStepCard step={longDecisionStep} isCurrent onSelectOption={() => {}} /></div>,
}

export const DecisionLoadingAndDisabled: StoryObj<typeof DecisionStepCard> = {
  render: () => <div className="max-w-xl"><DecisionStepCard step={{ ...longDecisionStep, status: 'pending', options: [], selectedOptionId: undefined }} isCurrent={false} onSelectOption={() => {}} pendingLabel="正在分析 SKU 与参考图，确认后生成选项..." /></div>,
}

export const EditablePromptLongText: StoryObj<typeof EditablePromptCard> = {
  render: () => (
    <div className="max-w-2xl">
      <EditablePromptCard
        value="请生成一张适用于 Amazon 主图和 Listing 场景图的电商图片：保持白色棉质 T-Shirt 的版型、领口、袖口和材质纹理；参考工业车间的暖色逆光和金属质感，但不要让背景元素遮挡商品主体。"
        dirty
        onChange={() => {}}
        onRestore={() => {}}
        keywords={['工业车间', '暖色逆光', '材质纹理', '主体清晰']}
        details={[{ label: '背景', value: '工业车间背景弱化处理，避免抢占商品主体' }, { label: '光线', value: '暖色逆光，保留边缘高光' }, { label: '构图', value: '商品居中，占画面 80%，适合平台主图' }]}
      />
    </div>
  ),
}

export const VersionLineageStates: StoryObj<typeof VersionLineage> = {
  render: () => <div className="max-w-sm"><VersionLineage nodes={versionNodes} activeId="v-2" onSelect={() => {}} onCompare={() => {}} onBranch={() => {}} /></div>,
}

export const ResultSelectedAndExtremeSku: StoryObj<typeof ResultAssetCard> = {
  render: () => <div className="max-w-xs"><ResultAssetCard variant={variant} index={0} isSelected onToggle={() => {}} onZoom={() => {}} onDownload={() => {}} /></div>,
}

export const EmptyAndErrorState: Story = {
  args: { title: '生产流程空状态', subtitle: '验证无数据 / 错误说明在暗色业务卡片里的可读性', children: null },
  render: () => (
    <ProductionSectionCard title="生产流程空状态" subtitle="验证无数据 / 错误说明在暗色业务卡片里的可读性">
      <ProductionEmptyState title="暂时没有可迭代的图片" description="还没有真实生成结果。系统不会用占位图冒充结果；请回到策略配置页提交生产，等待图片返回后再进入。" />
    </ProductionSectionCard>
  ),
}

export const NarrowMobileDensity: StoryObj<typeof DecisionStepCard> = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => <div className="w-[340px]"><DecisionStepCard step={longDecisionStep} isCurrent onSelectOption={() => {}} /></div>,
}
