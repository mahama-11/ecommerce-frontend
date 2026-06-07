import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useToastStore } from '@/store/toastStore'
import { usePrepStore, useSandboxStore, useWorkshopStore } from '@/store/productionStore'

function resetToastStore() {
  useToastStore.setState({ message: null, type: 'info', visible: false })
}

describe('toastStore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    resetToastStore()
  })

  it('starts hidden with info type', () => {
    expect(useToastStore.getState()).toMatchObject({ message: null, type: 'info', visible: false })
  })

  it.each(['success', 'error', 'info'] as const)('showToast displays %s toast', (type) => {
    useToastStore.getState().showToast(`message-${type}`, type)
    expect(useToastStore.getState()).toMatchObject({ message: `message-${type}`, type, visible: true })
  })

  it('showToast defaults to info type', () => {
    useToastStore.getState().showToast('hello')
    expect(useToastStore.getState()).toMatchObject({ message: 'hello', type: 'info', visible: true })
  })

  it('hideToast hides current toast without clearing message', () => {
    useToastStore.getState().showToast('hello', 'success')
    useToastStore.getState().hideToast()
    expect(useToastStore.getState()).toMatchObject({ message: 'hello', visible: false })
  })

  it('auto hides toast after 3 seconds', () => {
    useToastStore.getState().showToast('hello', 'success')
    vi.advanceTimersByTime(2999)
    expect(useToastStore.getState().visible).toBe(true)
    vi.advanceTimersByTime(1)
    expect(useToastStore.getState().visible).toBe(false)
  })
})

describe('production prep store', () => {
  beforeEach(() => usePrepStore.getState().reset())

  it('sets and resets product id', () => {
    usePrepStore.getState().setProductId('p1')
    expect(usePrepStore.getState().productId).toBe('p1')
    usePrepStore.getState().reset()
    expect(usePrepStore.getState().productId).toBeNull()
  })

  it('deduplicates sources by id', () => {
    usePrepStore.getState().addSource({ id: 's1', type: 'sku' } as never)
    usePrepStore.getState().addSource({ id: 's1', type: 'reference' } as never)
    expect(usePrepStore.getState().sources).toHaveLength(1)
    expect(usePrepStore.getState().isDirty).toBe(true)
  })

  it('deduplicates sources by assetId and sourceReferenceId', () => {
    usePrepStore.getState().addSource({ id: 's1', assetId: 'asset-1' } as never)
    usePrepStore.getState().addSource({ id: 's2', assetId: 'asset-1' } as never)
    usePrepStore.getState().addSource({ id: 's3', sourceReferenceId: 'ref-1' } as never)
    usePrepStore.getState().addSource({ id: 's4', sourceReferenceId: 'ref-1' } as never)
    expect(usePrepStore.getState().sources.map(item => item.id)).toEqual(['s2', 's4'])
  })

  it('removes source by id, assetId, or sourceReferenceId', () => {
    usePrepStore.getState().setSources([{ id: 's1', assetId: 'asset-1', sourceReferenceId: 'ref-1' }] as never)
    usePrepStore.getState().removeSource('asset-1')
    expect(usePrepStore.getState().sources).toEqual([])
  })

  it('updates attribute bias only when parsing exists', () => {
    usePrepStore.getState().updateAttributeBias('color', 80)
    expect(usePrepStore.getState().parsing).toBeNull()
    usePrepStore.getState().setParsing({ mergedAttributes: [{ key: 'color', driftBias: 50 }, { key: 'shape', driftBias: 40 }] } as never)
    usePrepStore.getState().updateAttributeBias('color', 80)
    expect(usePrepStore.getState().parsing?.mergedAttributes[0].driftBias).toBe(80)
    expect(usePrepStore.getState().isDirty).toBe(true)
  })

  it('sets global drift bias and dirty flag', () => {
    usePrepStore.getState().setGlobalDriftBias(70)
    expect(usePrepStore.getState()).toMatchObject({ globalDriftBias: 70, isDirty: true })
  })
})

describe('production sandbox store', () => {
  beforeEach(() => useSandboxStore.getState().reset())

  it('adds updates and removes intents', () => {
    useSandboxStore.getState().addIntent({ id: 'i1', prompt: 'a' } as never)
    useSandboxStore.getState().updateIntent('i1', { prompt: 'b' } as never)
    expect(useSandboxStore.getState().intents[0]).toMatchObject({ id: 'i1', prompt: 'b' })
    useSandboxStore.getState().removeIntent('i1')
    expect(useSandboxStore.getState().intents).toEqual([])
  })

  it('clamps image count between 1 and 10', () => {
    useSandboxStore.getState().setImageCount(0)
    expect(useSandboxStore.getState().imageCount).toBe(1)
    useSandboxStore.getState().setImageCount(99)
    expect(useSandboxStore.getState().imageCount).toBe(10)
  })

  it('updates asset task fields', () => {
    useSandboxStore.getState().updateAssetTask('asset-1', { sceneTag: '详情图' })
    expect(useSandboxStore.getState().assetTasks.find(item => item.id === 'asset-1')?.sceneTag).toBe('详情图')
  })

  it('adds and removes asset tasks', () => {
    useSandboxStore.getState().addAssetTask({ id: 'asset-new', name: 'New task' } as never)
    expect(useSandboxStore.getState().assetTasks.some(item => item.id === 'asset-new')).toBe(true)
    useSandboxStore.getState().removeAssetTask('asset-new')
    expect(useSandboxStore.getState().assetTasks.some(item => item.id === 'asset-new')).toBe(false)
  })

  it('merges advanced params', () => {
    useSandboxStore.getState().setAdvancedParams({ cfgScale: 8, highResFix: true })
    expect(useSandboxStore.getState().advancedParams).toMatchObject({ cfgScale: 8, highResFix: true, seed: -1 })
  })
})

describe('production workshop store', () => {
  beforeEach(() => useWorkshopStore.getState().reset())

  it('adds updates and selects variants', () => {
    useWorkshopStore.getState().addVariant({ id: 'v1', status: 'ready' } as never)
    useWorkshopStore.getState().updateVariant('v1', { status: 'accepted' } as never)
    useWorkshopStore.getState().toggleVariantSelection('v1')
    expect(useWorkshopStore.getState().variants[0]).toMatchObject({ id: 'v1', status: 'accepted' })
    expect(useWorkshopStore.getState().selectedVariantIds).toEqual(['v1'])
  })

  it('toggleVariantSelection removes selected variant on second toggle', () => {
    useWorkshopStore.getState().toggleVariantSelection('v1')
    useWorkshopStore.getState().toggleVariantSelection('v1')
    expect(useWorkshopStore.getState().selectedVariantIds).toEqual([])
  })

  it('adds and updates inpaint task', () => {
    useWorkshopStore.getState().addInpaintTask({ id: 'task-1', status: 'queued' } as never)
    useWorkshopStore.getState().updateInpaintTask('task-1', { status: 'done' } as never)
    expect(useWorkshopStore.getState().inpaintTasks[0]).toMatchObject({ id: 'task-1', status: 'done' })
  })

  it('appends refinement message when session exists', () => {
    useWorkshopStore.getState().setActiveRefinement({ id: 'r1', messages: [] } as never)
    useWorkshopStore.getState().appendRefinementMessage({ role: 'assistant', content: 'done' } as never)
    expect(useWorkshopStore.getState().activeRefinement?.messages).toHaveLength(1)
  })

  it('appendRefinementMessage is no-op without active session', () => {
    useWorkshopStore.getState().appendRefinementMessage({ role: 'assistant', content: 'done' } as never)
    expect(useWorkshopStore.getState().activeRefinement).toBeNull()
  })

  it('merges weight params and resets defaults', () => {
    useWorkshopStore.getState().setWeightParams({ skuBias: 80 })
    expect(useWorkshopStore.getState().weightParams.skuBias).toBe(80)
    useWorkshopStore.getState().reset()
    expect(useWorkshopStore.getState().weightParams.skuBias).toBe(50)
  })
})
