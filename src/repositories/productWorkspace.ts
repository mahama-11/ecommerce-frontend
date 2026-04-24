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
import { API_BASE_URL } from '@/services/apiBase'
import { getAccessToken } from '@/services/auth'

type ApiEnvelope<T> = {
  code: number
  message: string
  data: T
  error?: string
  error_code?: string
  error_hint?: string
}

const env = import.meta.env as Record<string, string | undefined>
const DATA_SOURCE = env.VITE_ECOMMERCE_DATA_SOURCE ?? 'api'

function shouldUseApi() {
  return DATA_SOURCE !== 'mock'
}

async function requestJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  const payload = (await response.json()) as ApiEnvelope<T>
  if (!response.ok || payload.code !== 0) {
    throw new Error(payload.error_hint || payload.error || payload.message || `Request failed with status ${response.status}`)
  }

  return payload.data
}

export const productWorkspaceRepository = {
  async listSavedTemplates() {
    if (shouldUseApi()) {
      try {
        return await requestJSON<SavedTemplateRecord[]>('/api/v1/ecommerce/templates/saved')
      } catch {
        // Temporarily keep the workbench usable while backend connectivity is being stabilized.
      }
    }

    return getSavedTemplatesFromMock()
  },

  async saveSavedTemplate(record: SavedTemplateRecord) {
    if (shouldUseApi()) {
      try {
        return await requestJSON<SavedTemplateRecord[]>('/api/v1/ecommerce/templates/saved', {
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
        return await requestJSON<WorkflowEvent[]>('/api/v1/ecommerce/workflow/events')
      } catch {
        // Temporarily keep the workbench usable while backend connectivity is being stabilized.
      }
    }

    return getWorkflowEventsFromMock()
  },

  async saveWorkflowEvent(event: WorkflowEvent) {
    if (shouldUseApi()) {
      try {
        return await requestJSON<WorkflowEvent[]>('/api/v1/ecommerce/workflow/events', {
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
        return await requestJSON<LinkedDesignAsset[]>('/api/v1/ecommerce/assets/linked-designs')
      } catch {
        // Temporarily keep the workbench usable while backend connectivity is being stabilized.
      }
    }

    return getLinkedDesignAssetsFromMock()
  },

  async saveLinkedDesignAsset(asset: LinkedDesignAsset) {
    if (shouldUseApi()) {
      try {
        return await requestJSON<LinkedDesignAsset[]>('/api/v1/ecommerce/assets/linked-designs', {
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
        return await requestJSON<LinkedDelivery[]>('/api/v1/ecommerce/deliveries/linked')
      } catch {
        // Temporarily keep the workbench usable while backend connectivity is being stabilized.
      }
    }

    return getLinkedDeliveriesFromMock()
  },

  async saveLinkedDelivery(delivery: LinkedDelivery) {
    if (shouldUseApi()) {
      try {
        return await requestJSON<LinkedDelivery[]>('/api/v1/ecommerce/deliveries/linked', {
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
        return await requestJSON<LinkedTemplateBridge[]>('/api/v1/ecommerce/workflow/template-bridges')
      } catch {
        // Temporarily keep the workbench usable while backend connectivity is being stabilized.
      }
    }

    return getTemplateBridgesFromMock()
  },

  async saveTemplateBridge(bridge: LinkedTemplateBridge) {
    if (shouldUseApi()) {
      try {
        return await requestJSON<LinkedTemplateBridge[]>('/api/v1/ecommerce/workflow/template-bridges', {
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
