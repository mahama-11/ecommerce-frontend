import type { ProductListItem } from '@/types/product'

export type MissionStage = 'intake' | 'visual' | 'listing' | 'export' | 'delivery' | 'commercial'

export type CapabilityState =
  | 'available'
  | 'partial'
  | 'blocked'
  | 'contract-needed'
  | 'unsupported'
  | 'commercial-gate'

export type ReadinessItem = {
  key: string
  label: string
  state: CapabilityState
  detail: string
}

export type NextBestAction = {
  label: string
  station: 'detail' | 'visual' | 'listing' | 'delivery' | 'commercial'
  href: string
  state: CapabilityState
  helper: string
}

export type MissionWorkUnit = {
  product: ProductListItem
  stage: MissionStage
  stageLabel: string
  stageIndex: number
  readiness: ReadinessItem[]
  blocker: string
  nextBestAction: NextBestAction
  healthScore: number
  contractNotes: string[]
}

export type ProductionStageSummary = {
  stage: MissionStage
  label: string
  description: string
  count: number
  blocked: number
  contractNeeded: boolean
}

export const MISSION_STAGES: Array<{ stage: MissionStage; label: string; description: string }> = [
  { stage: 'intake', label: 'Intake', description: 'SKU manifest and product identity' },
  { stage: 'visual', label: 'Visual', description: 'Primary SKU assets readiness' },
  { stage: 'listing', label: 'Listing', description: 'Marketplace copy/version readiness' },
  { stage: 'export', label: 'Export', description: 'Package handoff readiness' },
  { stage: 'delivery', label: 'Delivery', description: 'Download station verification' },
  { stage: 'commercial', label: 'Commercial', description: 'Quota and gate review' },
]

const STAGE_INDEX = MISSION_STAGES.reduce<Record<MissionStage, number>>((acc, item, index) => {
  acc[item.stage] = index
  return acc
}, {} as Record<MissionStage, number>)

function stateScore(state: CapabilityState) {
  if (state === 'available') return 1
  if (state === 'partial') return 0.55
  if (state === 'contract-needed' || state === 'commercial-gate') return 0.25
  return 0
}

function stageMeta(stage: MissionStage) {
  return MISSION_STAGES.find(item => item.stage === stage) ?? MISSION_STAGES[0]
}

export function deriveMissionStage(product: ProductListItem): MissionStage {
  if (product.status === 'archived') return 'commercial'
  if (product.assetStatus !== 'ready' || !product.hasPrimaryAsset) return 'visual'
  if (product.listingStatus !== 'ready') return 'listing'
  if (product.exportStatus === 'pending') return 'export'
  if (product.exportStatus === 'ready' || product.exportStatus === 'done' || product.status === 'export_ready') return 'delivery'
  return 'intake'
}

export function deriveMissionWorkUnit(product: ProductListItem): MissionWorkUnit {
  const stage = deriveMissionStage(product)
  const contractNotes: string[] = []
  const readiness: ReadinessItem[] = [
    {
      key: 'assets',
      label: 'SKU.assets',
      state: product.assetStatus === 'ready' && product.hasPrimaryAsset ? 'available' : product.assetStatus === 'partial' ? 'partial' : 'blocked',
      detail: product.assetStatus === 'ready' && product.hasPrimaryAsset
        ? `${product.assetsCount} asset(s), primary asset present.`
        : product.assetStatus === 'partial'
          ? `${product.assetsCount} asset(s); primary asset or role coverage still incomplete.`
          : 'Visual assets are missing for this SKU.',
    },
    {
      key: 'listing',
      label: 'Listing Station',
      state: product.listingStatus === 'ready' ? 'available' : product.listingStatus === 'partial' ? 'partial' : 'blocked',
      detail: product.listingStatus === 'ready'
        ? `${product.listingVersionsCount} listing version(s) ready.`
        : product.listingStatus === 'partial'
          ? `${product.listingVersionsCount} listing version(s); validation/adoption still needs operator review.`
          : 'No listing version ready for channel handoff.',
    },
    {
      key: 'export',
      label: 'Export package',
      state: product.exportStatus === 'done' || product.exportStatus === 'ready' ? 'available' : 'blocked',
      detail: product.exportStatus === 'done'
        ? 'Export package has been generated.'
        : product.exportStatus === 'ready'
          ? 'Export task is ready for Delivery Center verification.'
          : 'Export package has not been created yet.',
    },
    {
      key: 'commercial',
      label: '商业/额度检查',
      state: 'commercial-gate',
      detail: '商品列表无法判断额度和商业状态；需要时请进入商业审核。',
    },
  ]

  contractNotes.push('商品列表只展示素材、Listing 和导出状态，不推断隐藏状态。')
  contractNotes.push('是否可下载请进入交付中心确认。')
  contractNotes.push('商业额度状态需要进入审核页确认。')

  let blocker = '可以交给运营继续处理。'
  let nextBestAction: NextBestAction = {
    label: 'Open Mission Detail',
    station: 'detail',
    href: `/products/${product.id}`,
    state: 'available',
    helper: '查看完整商品资料和当前可用状态。',
  }

  if (product.status === 'archived') {
    blocker = 'SKU 已归档，复核前不能继续生产。'
    nextBestAction = {
      label: '复核商业状态',
      station: 'commercial',
      href: `/products/${product.id}`,
      state: 'commercial-gate',
      helper: '归档或商业状态需要运营明确复核。',
    }
  } else if (product.assetStatus !== 'ready' || !product.hasPrimaryAsset) {
    blocker = product.assetStatus === 'partial' ? '素材还不完整，主图或角色覆盖不足。' : '缺少视觉素材。'
    nextBestAction = {
      label: '进入视觉生产',
      station: 'visual',
      href: `/products/${encodeURIComponent(product.id)}/production/prep`,
      state: 'available',
      helper: '打开生产准备流程，补齐图片解析和选择。'
    }
  } else if (product.listingStatus !== 'ready') {
    blocker = product.listingStatus === 'partial' ? 'Listing 已存在，但还需要校验或采纳。' : '缺少 Listing 文案或版本。'
    nextBestAction = {
      label: '进入 Listing 配置',
      station: 'listing',
      href: `/products/workbench/batch-listing?productIds=${encodeURIComponent(product.id)}&source=product-center`,
      state: 'available',
      helper: '进入 Listing 配置，创建或采纳可用版本。'
    }
  } else if (product.exportStatus === 'pending') {
    blocker = '导出包还没有确认准备完成。'
    nextBestAction = {
      label: '打开导出交接',
      station: 'detail',
      href: `/products/${product.id}`,
      state: 'partial',
      helper: '进入商品详情检查导出条件。',
    }
  } else {
    blocker = '导出包可能已准备好，请进入交付中心确认是否可下载。'
    nextBestAction = {
      label: '进入交付中心',
      station: 'delivery',
      href: `/products/workbench/downloads?productIds=${encodeURIComponent(product.id)}&source=mission-control`,
      state: 'contract-needed',
      helper: '在交付中心确认文件是否已经准备好。',
    }
  }

  const healthScore = Math.round((readiness.reduce((sum, item) => sum + stateScore(item.state), 0) / readiness.length) * 100)
  const meta = stageMeta(stage)

  return {
    product,
    stage,
    stageLabel: meta.label,
    stageIndex: STAGE_INDEX[stage],
    readiness,
    blocker,
    nextBestAction,
    healthScore,
    contractNotes,
  }
}

export function buildProductionRail(products: ProductListItem[]): ProductionStageSummary[] {
  const units = products.map(deriveMissionWorkUnit)
  return MISSION_STAGES.map(meta => {
    const stageUnits = units.filter(unit => unit.stage === meta.stage)
    return {
      ...meta,
      count: stageUnits.length,
      blocked: stageUnits.filter(unit => unit.readiness.some(item => item.state === 'blocked')).length,
      contractNeeded: stageUnits.some(unit => unit.readiness.some(item => item.state === 'contract-needed' || item.state === 'commercial-gate')),
    }
  })
}
