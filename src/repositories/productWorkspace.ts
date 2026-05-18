import {
  getSavedTemplates as getSavedTemplatesFromMock,
  saveTemplateRecord as saveTemplateRecordToMock,
  type SavedTemplateRecord,
} from '@/mock/templateLibrary'
import {
  getLinkedDeliveries as getLinkedDeliveriesFromMock,
  getLinkedDesignAssets as getLinkedDesignAssetsFromMock,
  getTemplateBridges as getTemplateBridgesFromMock,
  getWorkflowEvents as getWorkflowEventsFromMock,
  saveLinkedDelivery as saveLinkedDeliveryToMock,
  saveLinkedDesignAsset as saveLinkedDesignAssetToMock,
  saveTemplateBridge as saveTemplateBridgeToMock,
  saveWorkflowEvent as saveWorkflowEventToMock,
  type LinkedDelivery,
  type LinkedDesignAsset,
  type LinkedTemplateBridge,
  type WorkflowEvent,
} from '@/mock/workflowBridge'
import { request } from '@/services/http'

const env = import.meta.env as Record<string, string | undefined>
const DATA_SOURCE = env.VITE_ECOMMERCE_DATA_SOURCE ?? 'api'

function shouldUseApi() {
  return DATA_SOURCE !== 'mock'
}

export const productWorkspaceRepository = {
  async listSavedTemplates() {
    if (shouldUseApi()) {
      return request<SavedTemplateRecord[]>('/api/v1/ecommerce/templates/saved')
    }

    return getSavedTemplatesFromMock()
  },

  async saveSavedTemplate(record: SavedTemplateRecord) {
    if (shouldUseApi()) {
      return request<SavedTemplateRecord[]>('/api/v1/ecommerce/templates/saved', {
        method: 'POST',
        body: JSON.stringify(record),
      })
    }

    return saveTemplateRecordToMock(record)
  },

  async updateSavedTemplate(record: SavedTemplateRecord) {
    if (shouldUseApi()) {
      return request<SavedTemplateRecord[]>(`/api/v1/ecommerce/templates/saved/${encodeURIComponent(record.id)}`, {
        method: 'PUT',
        body: JSON.stringify(record),
      })
    }

    return saveTemplateRecordToMock(record)
  },

  async deleteSavedTemplate(id: string) {
    if (shouldUseApi()) {
      return request<SavedTemplateRecord[]>(`/api/v1/ecommerce/templates/saved/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
    }

    return getSavedTemplatesFromMock().filter(item => item.id !== id)
  },

  async useSavedTemplate(id: string) {
    if (shouldUseApi()) {
      return request<SavedTemplateRecord>(`/api/v1/ecommerce/templates/saved/${encodeURIComponent(id)}/use`, {
        method: 'POST',
      })
    }

    return getSavedTemplatesFromMock().find(item => item.id === id) ?? null
  },

  async listWorkflowEvents() {
    if (shouldUseApi()) {
      return request<WorkflowEvent[]>('/api/v1/ecommerce/workflow/events')
    }

    return getWorkflowEventsFromMock()
  },

  async saveWorkflowEvent(event: WorkflowEvent) {
    if (shouldUseApi()) {
      return request<WorkflowEvent[]>('/api/v1/ecommerce/workflow/events', {
        method: 'POST',
        body: JSON.stringify(event),
      })
    }

    return saveWorkflowEventToMock(event)
  },

  async listLinkedDesignAssets() {
    if (shouldUseApi()) {
      return request<LinkedDesignAsset[]>('/api/v1/ecommerce/assets/linked-designs')
    }

    return getLinkedDesignAssetsFromMock()
  },

  async saveLinkedDesignAsset(asset: LinkedDesignAsset) {
    if (shouldUseApi()) {
      return request<LinkedDesignAsset[]>('/api/v1/ecommerce/assets/linked-designs', {
        method: 'POST',
        body: JSON.stringify(asset),
      })
    }

    return saveLinkedDesignAssetToMock(asset)
  },

  async listLinkedDeliveries() {
    if (shouldUseApi()) {
      return request<LinkedDelivery[]>('/api/v1/ecommerce/deliveries/linked')
    }

    return getLinkedDeliveriesFromMock()
  },

  async saveLinkedDelivery(delivery: LinkedDelivery) {
    if (shouldUseApi()) {
      return request<LinkedDelivery[]>('/api/v1/ecommerce/deliveries/linked', {
        method: 'POST',
        body: JSON.stringify(delivery),
      })
    }

    return saveLinkedDeliveryToMock(delivery)
  },

  async listTemplateBridges() {
    if (shouldUseApi()) {
      return request<LinkedTemplateBridge[]>('/api/v1/ecommerce/workflow/template-bridges')
    }

    return getTemplateBridgesFromMock()
  },

  async saveTemplateBridge(bridge: LinkedTemplateBridge) {
    if (shouldUseApi()) {
      return request<LinkedTemplateBridge[]>('/api/v1/ecommerce/workflow/template-bridges', {
        method: 'POST',
        body: JSON.stringify(bridge),
      })
    }

    return saveTemplateBridgeToMock(bridge)
  },
}
