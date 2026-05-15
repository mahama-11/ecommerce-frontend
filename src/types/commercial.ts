// ─── Commercial Types ──────────────────────────────────────

export interface CommercialOrderView {
  order?: {
    status: string
    package_type: string
    package_code: string
    fulfilled_at?: string
    updated_at?: string
    created_at?: string
    id?: string
  }
}

export interface RateCard {
  status: string
  target_type: string
  target_id: string
  price_config?: string
  metadata?: string
}

export interface SKU {
  code: string
  id: string
  list_price?: number
  metadata?: string
}

export interface OfferingsResult {
  offerings?: {
    skus: SKU[]
    packages: Array<{
      code: string
      name: string
      package_type: string
      status: string
      metadata?: string
    }>
    rate_cards: RateCard[]
  }
}
