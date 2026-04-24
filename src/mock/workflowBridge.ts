import type { DeliveryItem, LocalizedText, UploadItem } from '@/mock/assetCommerce'

export interface WorkflowEvent {
  id: string
  module: 'chat' | 'template' | 'design' | 'asset' | 'delivery'
  title: LocalizedText
  detail: LocalizedText
  createdAt: string
}

export interface LinkedDesignAsset {
  id: string
  sourcePath: string
  title: LocalizedText
  desc: LocalizedText
  syncedAt: string
}

export interface LinkedDelivery extends DeliveryItem {
  sourcePath: string
  createdAt: string
}

export interface LinkedTemplateBridge {
  id: string
  designTitle: LocalizedText
  aiTemplateTitle: LocalizedText
  scenario: LocalizedText
  createdAt: string
}

const WORKFLOW_EVENTS_KEY = 'ae_mock_workflow_events'
const DESIGN_ASSETS_KEY = 'ae_mock_design_assets'
const DESIGN_DELIVERIES_KEY = 'ae_mock_design_deliveries'
const TEMPLATE_BRIDGE_KEY = 'ae_mock_template_bridges'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readList<T>(key: string): T[] {
  if (!canUseStorage()) return []

  const raw = window.localStorage.getItem(key)
  if (!raw) return []

  try {
    return JSON.parse(raw) as T[]
  } catch {
    return []
  }
}

function writeList<T extends { id: string }>(key: string, item: T) {
  if (!canUseStorage()) return []

  const existing = readList<T>(key)
  const next = [item, ...existing.filter(entry => entry.id !== item.id)]
  window.localStorage.setItem(key, JSON.stringify(next))
  return next
}

export function getWorkflowEvents() {
  return readList<WorkflowEvent>(WORKFLOW_EVENTS_KEY)
}

export function saveWorkflowEvent(event: WorkflowEvent) {
  return writeList(WORKFLOW_EVENTS_KEY, event)
}

export function getLinkedDesignAssets() {
  return readList<LinkedDesignAsset>(DESIGN_ASSETS_KEY)
}

export function saveLinkedDesignAsset(asset: LinkedDesignAsset) {
  return writeList(DESIGN_ASSETS_KEY, asset)
}

export function getLinkedDeliveries() {
  return readList<LinkedDelivery>(DESIGN_DELIVERIES_KEY)
}

export function saveLinkedDelivery(delivery: LinkedDelivery) {
  return writeList(DESIGN_DELIVERIES_KEY, delivery)
}

export function getTemplateBridges() {
  return readList<LinkedTemplateBridge>(TEMPLATE_BRIDGE_KEY)
}

export function saveTemplateBridge(bridge: LinkedTemplateBridge) {
  return writeList(TEMPLATE_BRIDGE_KEY, bridge)
}

export function createLinkedUploadFromDesign(asset: LinkedDesignAsset): UploadItem {
  return {
    id: `upload-linked-${asset.id}`,
    name: asset.title,
    meta: asset.desc,
    status: 'ready',
  }
}
