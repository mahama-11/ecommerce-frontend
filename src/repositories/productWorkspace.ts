// ─── Product Workspace Repository ─────────────────────────
// Client-side repository for workflow events, design assets, deliveries,
// saved templates, and template bridges in the product workspace.

import type { WorkflowEvent, LinkedDesignAsset, LinkedDelivery, LinkedTemplateBridge } from '@/mock/workflowBridge'

interface SavedTemplate {
  id: string
  name?: string
  platform?: string
  tags?: string[]
  usageCount?: number
  favorite?: number
  content?: Record<string, unknown>
  createdAt?: string
  savedAt?: string
  sourceType?: string
  sourceLabel?: string
  [key: string]: unknown
}

// In-memory store (MVP — replace with API calls when backend is ready)
const workflowEvents: WorkflowEvent[] = []
const designAssets: LinkedDesignAsset[] = []
const deliveries: LinkedDelivery[] = []
const savedTemplates: SavedTemplate[] = []
const templateBridges: LinkedTemplateBridge[] = []

export const productWorkspaceRepository = {
  // Workflow Events
  async listWorkflowEvents(): Promise<WorkflowEvent[]> {
    return [...workflowEvents]
  },

  async saveWorkflowEvent(event: WorkflowEvent): Promise<unknown> {
    const idx = workflowEvents.findIndex(e => e.id === event.id)
    if (idx >= 0) workflowEvents[idx] = event
    else workflowEvents.push(event)
    return event
  },

  // Design Assets
  async listLinkedDesignAssets(): Promise<LinkedDesignAsset[]> {
    return [...designAssets]
  },

  async saveLinkedDesignAsset(asset: LinkedDesignAsset): Promise<unknown> {
    const idx = designAssets.findIndex(a => a.id === asset.id)
    if (idx >= 0) designAssets[idx] = asset
    else designAssets.push(asset)
    return asset
  },

  // Deliveries
  async listLinkedDeliveries(): Promise<LinkedDelivery[]> {
    return [...deliveries]
  },

  async saveLinkedDelivery(delivery: LinkedDelivery): Promise<unknown> {
    const idx = deliveries.findIndex(d => d.id === delivery.id)
    if (idx >= 0) deliveries[idx] = delivery
    else deliveries.push(delivery)
    return delivery
  },

  // Saved Templates
  async saveSavedTemplate(template: SavedTemplate): Promise<unknown> {
    const idx = savedTemplates.findIndex(t => t.id === template.id)
    if (idx >= 0) savedTemplates[idx] = template
    else savedTemplates.push(template)
    return template
  },

  // Template Bridges
  async saveTemplateBridge(bridge: LinkedTemplateBridge): Promise<unknown> {
    const idx = templateBridges.findIndex(b => b.id === bridge.id)
    if (idx >= 0) templateBridges[idx] = bridge
    else templateBridges.push(bridge)
    return bridge
  },
}
