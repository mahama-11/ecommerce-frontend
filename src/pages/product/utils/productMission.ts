import type { ProductListItem } from '@/types/product'

export type MissionStage = 'intake' | 'template' | 'visual' | 'listing' | 'export' | 'delivery' | 'commercial'

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
  { stage: 'template', label: 'Template', description: 'Template/Prompt lineage contract' },
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
      key: 'template',
      label: 'Template/Prompt lineage',
      state: 'contract-needed',
      detail: 'Product list has no real template/prompt lineage contract yet.',
    },
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
      key: 'delivery',
      label: 'Delivery downloadability',
      state: 'contract-needed',
      detail: 'Downloadability must be checked in Delivery Station from real DownloadRecord.downloadable.',
    },
    {
      key: 'commercial',
      label: 'Commercial/quota gate',
      state: 'commercial-gate',
      detail: 'Product list cannot infer quota or commercial entitlement; route to commercial review when needed.',
    },
  ]

  contractNotes.push('Template/Prompt lineage is contract-needed on ProductList data.')
  contractNotes.push('Delivery downloadability is not claimed here; verify in Delivery Station.')
  contractNotes.push('Commercial/quota state is not guessed from SKU list.')

  let blocker = 'Ready for operator handoff.'
  let nextBestAction: NextBestAction = {
    label: 'Open Mission Detail',
    station: 'detail',
    href: `/products/${product.id}`,
    state: 'available',
    helper: 'Inspect full SKU record and existing real product contracts.',
  }

  if (product.status === 'archived') {
    blocker = 'SKU is archived; production actions are disabled until reviewed.'
    nextBestAction = {
      label: 'Review Commercial Gate',
      station: 'commercial',
      href: `/products/${product.id}`,
      state: 'commercial-gate',
      helper: 'Archived/commercial state requires explicit operator review.',
    }
  } else if (product.assetStatus !== 'ready' || !product.hasPrimaryAsset) {
    blocker = product.assetStatus === 'partial' ? 'Visual set is partial; primary/role coverage is incomplete.' : 'Visual assets are missing.'
    nextBestAction = {
      label: 'Route to Visual Station',
      station: 'visual',
      href: `/products/${encodeURIComponent(product.id)}/production/prep`,
      state: 'available',
      helper: 'Open the real V2 production prep workflow; no generation success is claimed from Mission Control.',
    }
  } else if (product.listingStatus !== 'ready') {
    blocker = product.listingStatus === 'partial' ? 'Listing exists but still needs validation/adoption.' : 'Listing copy/version is missing.'
    nextBestAction = {
      label: 'Route to Listing Station',
      station: 'listing',
      href: `/products/workbench/batch-listing?productIds=${encodeURIComponent(product.id)}&source=mission-control`,
      state: 'available',
      helper: 'Open Batch Listing with selected SKU context; the station still owns real version/adopt execution.',
    }
  } else if (product.exportStatus === 'pending') {
    blocker = 'Export package is not confirmed ready from list data.'
    nextBestAction = {
      label: 'Open Export Handoff',
      station: 'detail',
      href: `/products/${product.id}`,
      state: 'partial',
      helper: 'Use Product Detail export contracts; do not claim downloadable delivery here.',
    }
  } else {
    blocker = 'Package may be ready; downloadability must be verified from DownloadRecord.'
    nextBestAction = {
      label: 'Route to Delivery Station',
      station: 'delivery',
      href: `/products/workbench/downloads?productIds=${encodeURIComponent(product.id)}&source=mission-control`,
      state: 'contract-needed',
      helper: 'Delivery Station owns real DownloadRecord.downloadable checks.',
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
