import { request } from '@/services/http'
import type {
  CommercialOrdersResult,
  CommercialOrderView,
  BillingChargeRecord,
  BillingSummary,
  ChannelBindingView,
  ChannelCommissionView,
  ChannelOverview,
  ChannelSettlementView,
  CommissionLedger,
  CommissionOverview,
  PromotionCode,
  PromotionCodeResolve,
  PromotionConversion,
  PromotionOverview,
  PromotionProgram,
  RedeemResponse,
  OfferingsResult,
  WalletHistoryResult,
  WalletSummary,
} from '@/types/commercial'

type ItemsResponse<T> = { items?: T[] }

const extractItems = <T>(input: T[] | ItemsResponse<T> | null | undefined): T[] => {
  if (Array.isArray(input)) return input
  return input?.items || []
}

export const commercialService = {
  getOfferings: async () => request<OfferingsResult>('/api/v1/ecommerce/commercial/offerings'),
  createOrder: async (input: { sku_code?: string; package_code?: string; quantity?: number; metadata?: string }) =>
    request<CommercialOrderView>('/api/v1/ecommerce/commercial/orders', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  listOrders: async () => request<CommercialOrdersResult>('/api/v1/ecommerce/commercial/orders'),
  getOrder: async (orderID: string) => request<CommercialOrderView>(`/api/v1/ecommerce/commercial/orders/${orderID}`),
  confirmOrderPayment: async (orderID: string, input?: { payment_method?: string; provider_code?: string; payment_asset_code?: string; external_payment_id?: string; metadata?: string }) =>
    request<CommercialOrderView>(`/api/v1/ecommerce/commercial/orders/${orderID}/confirm-payment`, {
      method: 'POST',
      body: JSON.stringify(input || {}),
    }),
  getWalletSummary: async () => request<WalletSummary>('/api/v1/ecommerce/wallet/summary'),
  getWalletHistory: async (limit: number = 100) =>
    request<WalletHistoryResult>(`/api/v1/ecommerce/wallet/history?limit=${limit}`),

  getBillingSummary: async () => request<BillingSummary>('/api/v1/ecommerce/billing/summary'),
  getBillingCharges: async (limit: number = 100, offset: number = 0) =>
    request<BillingChargeRecord[]>(`/api/v1/ecommerce/billing/charges?limit=${limit}&offset=${offset}`),

  getPromotionPrograms: async () => {
    const res = await request<PromotionProgram[] | ItemsResponse<PromotionProgram>>('/api/v1/ecommerce/promotions/programs')
    return extractItems(res)
  },
  getPromotionOverview: async (status?: string) =>
    request<PromotionOverview>(`/api/v1/ecommerce/promotions/me/overview${status ? `?status=${encodeURIComponent(status)}` : ''}`),
  getPromotionCodes: async (programCode?: string, status?: string) => {
    const params = new URLSearchParams()
    if (programCode) params.set('program_code', programCode)
    if (status) params.set('status', status)
    const query = params.toString()
    const res = await request<PromotionCode[] | ItemsResponse<PromotionCode>>(`/api/v1/ecommerce/promotions/me/codes${query ? `?${query}` : ''}`)
    return extractItems(res)
  },
  ensurePromotionCode: async (programCode?: string) =>
    request<PromotionCode>('/api/v1/ecommerce/promotions/me/codes/ensure', {
      method: 'POST',
      body: JSON.stringify(programCode ? { program_code: programCode } : {}),
    }),
  createPromotionCode: async (programCode: string, code?: string, metadata?: string) =>
    request<PromotionCode>('/api/v1/ecommerce/promotions/me/codes', {
      method: 'POST',
      body: JSON.stringify({ program_code: programCode, code, metadata }),
    }),
  getPromotionConversions: async (status?: string) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : ''
    const res = await request<PromotionConversion[] | ItemsResponse<PromotionConversion>>(`/api/v1/ecommerce/promotions/me/conversions${query}`)
    return extractItems(res)
  },
  resolvePromotionCode: async (code: string) =>
    request<PromotionCodeResolve>(`/api/v1/ecommerce/promotions/codes/${encodeURIComponent(code)}/resolve`),

  getCommissionOverview: async (status?: string) =>
    request<CommissionOverview>(`/api/v1/ecommerce/commissions/me/overview${status ? `?status=${encodeURIComponent(status)}` : ''}`),
  getReferralCommissions: async (status?: string) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : ''
    const res = await request<CommissionLedger[] | ItemsResponse<CommissionLedger>>(`/api/v1/ecommerce/commissions/me/referrals${query}`)
    return extractItems(res)
  },
  redeemCommissions: async (commissionIds?: string[]) =>
    request<RedeemResponse>('/api/v1/ecommerce/commissions/me/referrals/redeem', {
      method: 'POST',
      body: JSON.stringify(commissionIds?.length ? { commission_ids: commissionIds } : {}),
    }),

  getChannelOverview: async () => request<ChannelOverview>('/api/v1/ecommerce/commissions/me/channel/overview'),
  getChannelBindings: async () => {
    const res = await request<ChannelBindingView[] | ItemsResponse<ChannelBindingView>>('/api/v1/ecommerce/commissions/me/channel/bindings')
    return extractItems(res)
  },
  getChannelCommissions: async (status?: string) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : ''
    const res = await request<ChannelCommissionView[] | ItemsResponse<ChannelCommissionView>>(`/api/v1/ecommerce/commissions/me/channel/commissions${query}`)
    return extractItems(res)
  },
  getChannelSettlements: async (status?: string) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : ''
    const res = await request<ChannelSettlementView[] | ItemsResponse<ChannelSettlementView>>(`/api/v1/ecommerce/commissions/me/channel/settlements${query}`)
    return extractItems(res)
  },
}
