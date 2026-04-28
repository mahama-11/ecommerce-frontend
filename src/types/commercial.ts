export type WalletAssetSummary = {
  asset_code: string
  asset_type: string
  lifecycle_type: string
  account_balance: number
  available_balance: number
  expiring_balance: number
  next_expires_at?: string
}

export type WalletSummary = {
  billing_subject_type: string
  billing_subject_id: string
  product_code: string
  total_balance: number
  permanent_balance: number
  reward_balance: number
  allowance_balance: number
  assets: WalletAssetSummary[]
  primary_asset_code?: string
}

export type Product = {
  id: string
  code: string
  name: string
  status: string
  metadata?: string
}

export type SKU = {
  id: string
  product_id: string
  code: string
  name: string
  sku_type: string
  billing_mode: string
  currency: string
  list_price: number
  status: string
  metadata?: string
}

export type CommercialPackage = {
  id: string
  product_id: string
  code: string
  name: string
  package_type: string
  status: string
  metadata?: string
}

export type RateCard = {
  id: string
  product_id: string
  code: string
  target_type: string
  target_id: string
  price_model: string
  currency: string
  price_config: string
  effective_from?: string
  effective_to?: string
  version: number
  status: string
  metadata?: string
}

export type AssetDefinition = {
  asset_code: string
  product_code: string
  asset_type: string
  lifecycle_type: string
  default_expire_days: number
  reset_cycle?: string
  status: string
  description?: string
  metadata?: string
}

export type AllowancePolicy = {
  id: string
  product_code: string
  billing_subject_type: string
  billing_subject_id: string
  asset_code: string
  amount: number
  reset_cycle: string
  status: string
  effective_from?: string
  effective_to?: string
  metadata?: string
}

export type OfferingsView = {
  product?: Product
  skus: SKU[]
  packages: CommercialPackage[]
  rate_cards: RateCard[]
  asset_definitions: AssetDefinition[]
  allowance_policies: AllowancePolicy[]
}

export type OfferingsResult = {
  product_code: string
  offerings: OfferingsView
  wallet_summary?: WalletSummary
}

export type CommercialOrderRecord = {
  id: string
  user_id: string
  organization_id: string
  product_code: string
  sku_code: string
  package_code: string
  package_type: string
  currency: string
  quantity: number
  unit_amount: number
  total_amount: number
  status: string
  payment_status: string
  fulfillment_status: string
  metadata_json?: string
  paid_at?: string
  fulfilled_at?: string
  created_at: string
  updated_at: string
}

export type CommercialPaymentRecord = {
  id: string
  order_id: string
  user_id: string
  organization_id: string
  amount: number
  currency: string
  payment_method: string
  provider_code: string
  external_payment_id?: string
  status: string
  metadata_json?: string
  paid_at?: string
  created_at: string
  updated_at: string
}

export type CommercialFulfillmentRecord = {
  id: string
  order_id: string
  user_id: string
  organization_id: string
  package_code: string
  fulfillment_mode: string
  status: string
  asset_code: string
  amount: number
  allowance_policy_id?: string
  cycle_key?: string
  wallet_account_id?: string
  wallet_bucket_id?: string
  wallet_ledger_id?: string
  metadata_json?: string
  expires_at?: string
  fulfilled_at?: string
  created_at: string
  updated_at: string
}

export type CommercialOrderView = {
  order?: CommercialOrderRecord
  payment?: CommercialPaymentRecord
  fulfillment?: CommercialFulfillmentRecord
  wallet_summary?: WalletSummary
}

export type CommercialOrdersResult = {
  items: CommercialOrderView[]
}

export type WalletHistoryEntry = {
  id: string
  category: string
  title: string
  description?: string
  direction: string
  amount: number
  asset_code?: string
  currency?: string
  status: string
  occurred_at: string
  reference_type?: string
  reference_id?: string
  billable_item_code?: string
  charge_mode?: string
  quota_consumed?: number
  credits_consumed?: number
  wallet_debited?: number
  metadata?: Record<string, unknown>
}

export type WalletHistoryResult = {
  items: WalletHistoryEntry[]
}

export type BillingChargeRecord = {
  id: string
  product_code: string
  organization_id: string
  user_id?: string
  event_id: string
  business_type: string
  scene_code?: string
  source_type?: string
  source_id?: string
  billable_item_code?: string
  charge_mode?: string
  charge_session_id?: string
  settlement_id?: string
  currency?: string
  gross_amount: number
  discount_amount: number
  net_amount: number
  quota_consumed: number
  credits_consumed: number
  wallet_asset_code?: string
  wallet_debited: number
  billing_amount: number
  reward_amount: number
  commission_amount: number
  status: string
  occurred_at: string
  refunded_at?: string
  route_snapshot?: string
  metadata_json?: string
  channel_status: string
  channel_ledger_id?: string
  channel_error?: string
  created_at?: string
  updated_at?: string
}

export type BillingSummary = {
  charge_count: number
  settled_count: number
  refunded_count: number
  total_net_amount: number
  total_wallet_debited: number
  total_credits_consumed: number
  channel_pending_count: number
  channel_failed_count: number
}

export type PromotionProgram = {
  id: string
  product_code: string
  program_code: string
  name: string
  status: string
  trigger_type: string
  commission_policy: string
  commission_currency: string
  commission_fixed_amount: number
  commission_rate_bps: number
  settlement_delay_days: number
  allow_repeat: boolean
  effective_from?: string
  effective_to?: string
  metadata?: string
  created_at?: string
  updated_at?: string
}

export type PromotionCode = {
  id: string
  program_id: string
  product_code: string
  code: string
  status: string
  metadata?: Record<string, unknown>
  invite_url?: string
  signup_url?: string
  share_text?: string
  created_at: string
  updated_at: string
}

export type PromotionConversion = {
  id: string
  program_id: string
  referral_code_id: string
  product_code: string
  trigger_type: string
  promoter_subject_type?: string
  promoter_subject_id?: string
  referred_subject_type: string
  referred_subject_id: string
  settlement_subject_type?: string
  settlement_subject_id?: string
  reference_type?: string
  reference_id?: string
  commission_currency: string
  commission_amount: number
  commission_ledger_id: string
  status: string
  metadata?: string
  created_at: string
  updated_at: string
}

export type PromotionOverview = {
  programs: PromotionProgram[]
  codes: PromotionCode[]
  conversions: PromotionConversion[]
  total_conversions: number
  tracked_conversions: number
  earned_conversions: number
  reversed_conversions: number
  invite_base_url?: string
}

export type PromotionCodeResolve = {
  code: string
  product_code?: string
  program_id: string
  program_code?: string
  program_name: string
  trigger_type: string
  commission_policy?: string
  commission_currency?: string
  commission_fixed_amount?: number
  commission_rate_bps?: number
  settlement_delay_days?: number
  allow_repeat?: boolean
  reward_policy_desc?: string
  promoter_subject_type?: string
  promoter_subject_id?: string
  status?: string
  metadata?: Record<string, unknown>
}

export type CommissionLedger = {
  id: string
  product_code?: string
  commission_type?: string
  beneficiary_subject_type?: string
  beneficiary_subject_id?: string
  settlement_subject_type?: string
  settlement_subject_id?: string
  currency: string
  amount: number
  status: string
  reference_type?: string
  reference_id?: string
  redeemed_reward_id?: string
  redeemed_at?: string
  metadata?: string
  created_at: string
  updated_at?: string
}

export type CommissionOverview = {
  commissions: CommissionLedger[]
  total_commission: number
  earned_commission: number
  pending_commission: number
  reversed_commission: number
  redeemed_commission: number
  redeemable_commission: number
  redeem_target_asset_code: string
}

export type RedeemResponse = {
  reward_ledger_id: string
  asset_code: string
  total_amount: number
  commissions: CommissionLedger[]
}

export type ChannelPartnerSummary = {
  id: string
  code: string
  name: string
  partner_type: string
  status: string
  risk_level: string
}

export type ChannelProgramSummary = {
  id: string
  program_code: string
  name: string
  program_type: string
  status: string
}

export type ChannelBinding = {
  id: string
  product_code: string
  org_id: string
  channel_partner_id: string
  channel_program_id: string
  binding_source: string
  source_code: string
  source_ref_id: string
  binding_scope: string
  status: string
  effective_from?: string
  effective_to?: string
  locked_until?: string
  replaced_by_binding_id: string
  reason_code: string
  evidence: string
  created_by: string
  metadata: string
  created_at: string
  updated_at: string
}

export type ChannelBindingView = {
  binding: ChannelBinding
  partner?: ChannelPartnerSummary
  program?: ChannelProgramSummary
}

export type ChannelCommissionLedger = {
  id: string
  channel_partner_id: string
  channel_program_id: string
  source_charge_id: string
  billable_item_code: string
  currency: string
  commission_amount: number
  status: string
  created_at: string
  earned_at?: string
  settled_at?: string
  reversed_at?: string
}

export type ChannelCommissionView = {
  partner?: ChannelPartnerSummary
  program?: ChannelProgramSummary
  ledger: ChannelCommissionLedger
}

export type ChannelSettlementBatch = {
  id: string
  batch_no: string
  channel_program_id: string
  settlement_cycle: string
  currency: string
  status: string
  generated_at?: string
  confirmed_at?: string
  closed_at?: string
}

export type ChannelSettlementItem = {
  id: string
  settlement_batch_id: string
  channel_partner_id: string
  currency: string
  commission_amount: number
  clawback_amount: number
  adjustment_amount: number
  net_amount: number
  status: string
  statement_snapshot: string
  metadata: string
  created_at: string
  updated_at: string
}

export type ChannelSettlementView = {
  partner?: ChannelPartnerSummary
  program?: ChannelProgramSummary
  batch?: ChannelSettlementBatch
  item: ChannelSettlementItem
}

export type ChannelOverview = {
  partners: ChannelPartnerSummary[]
  current_bindings: ChannelBindingView[]
  total_commission: number
  pending_commission: number
  earned_commission: number
  settled_commission: number
  reversed_commission: number
  settlement_count: number
  recent_settlements: ChannelSettlementView[]
}
