import { request } from '@/services/http'
import type { CommercialOrderView, OfferingsResult } from '@/types/commercial'

// ─── Commercial Service ───────────────────────────────────

export const commercialService = {
  listOrders(): Promise<{ items: CommercialOrderView[] }> {
    return request('/api/v1/commercial/orders', { method: 'GET' })
  },

  getOfferings(): Promise<OfferingsResult> {
    return request('/api/v1/commercial/offerings', { method: 'GET' })
  },

  createOrder(params: { package_code: string; sku_code?: string }): Promise<{ order?: { id: string } }> {
    return request('/api/v1/commercial/orders', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  },

  confirmOrderPayment(orderId: string, params: { payment_method: string; provider_code: string }): Promise<unknown> {
    return request(`/api/v1/commercial/orders/${orderId}/confirm`, {
      method: 'POST',
      body: JSON.stringify(params),
    })
  },
}
