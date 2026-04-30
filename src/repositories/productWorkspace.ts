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
      try {
        return await request<SavedTemplateRecord[]>('/api/v1/ecommerce/templates/saved')
      } catch {
        // Temporarily keep the workbench usable while backend connectivity is being stabilized.
      }
    }

    return getSavedTemplatesFromMock()
  },

  async saveSavedTemplate(record: SavedTemplateRecord) {
    if (shouldUseApi()) {
      try {
        return await request<SavedTemplateRecord[]>('/api/v1/ecommerce/templates/saved', {
          method: 'POST',
          body: JSON.stringify(record),
        })
      } catch {
        // Temporarily keep the workbench usable while backend connectivity is being stabilized.
      }
    }

    return saveTemplateRecordToMock(record)
  },

  async listWorkflowEvents() {
    if (shouldUseApi()) {
      try {
        return await request<WorkflowEvent[]>('/api/v1/ecommerce/workflow/events')
      } catch {
        // Temporarily keep the workbench usable while backend connectivity is being stabilized.
      }
    }

    return getWorkflowEventsFromMock()
  },

  async saveWorkflowEvent(event: WorkflowEvent) {
    if (shouldUseApi()) {
      try {
        return await request<WorkflowEvent[]>('/api/v1/ecommerce/workflow/events', {
          method: 'POST',
          body: JSON.stringify(event),
        })
      } catch {
        // Temporarily keep the workbench usable while backend connectivity is being stabilized.
      }
    }

    return saveWorkflowEventToMock(event)
  },

  async listLinkedDesignAssets() {
    if (shouldUseApi()) {
      try {
        return await request<LinkedDesignAsset[]>('/api/v1/ecommerce/assets/linked-designs')
      } catch {
        // Temporarily keep the workbench usable while backend connectivity is being stabilized.
      }
    }

    return getLinkedDesignAssetsFromMock()
  },

  async saveLinkedDesignAsset(asset: LinkedDesignAsset) {
    if (shouldUseApi()) {
      try {
        return await request<LinkedDesignAsset[]>('/api/v1/ecommerce/assets/linked-designs', {
          method: 'POST',
          body: JSON.stringify(asset),
        })
      } catch {
        // Temporarily keep the workbench usable while backend connectivity is being stabilized.
      }
    }

    return saveLinkedDesignAssetToMock(asset)
  },

  async listLinkedDeliveries() {
    if (shouldUseApi()) {
      try {
        return await request<LinkedDelivery[]>('/api/v1/ecommerce/deliveries/linked')
      } catch {
        // Temporarily keep the workbench usable while backend connectivity is being stabilized.
      }
    }

    return getLinkedDeliveriesFromMock()
  },

  async saveLinkedDelivery(delivery: LinkedDelivery) {
    if (shouldUseApi()) {
      try {
        return await request<LinkedDelivery[]>('/api/v1/ecommerce/deliveries/linked', {
          method: 'POST',
          body: JSON.stringify(delivery),
        })
      } catch {
        // Temporarily keep the workbench usable while backend connectivity is being stabilized.
      }
    }

    return saveLinkedDeliveryToMock(delivery)
  },

  async listTemplateBridges() {
    if (shouldUseApi()) {
      try {
        return await request<LinkedTemplateBridge[]>('/api/v1/ecommerce/workflow/template-bridges')
      } catch {
        // Temporarily keep the workbench usable while backend connectivity is being stabilized.
      }
    }

    return getTemplateBridgesFromMock()
  },

  async saveTemplateBridge(bridge: LinkedTemplateBridge) {
    if (shouldUseApi()) {
      try {
        return await request<LinkedTemplateBridge[]>('/api/v1/ecommerce/workflow/template-bridges', {
          method: 'POST',
          body: JSON.stringify(bridge),
        })
      } catch {
        // Temporarily keep the workbench usable while backend connectivity is being stabilized.
      }
    }

    return saveTemplateBridgeToMock(bridge)
  },
}
