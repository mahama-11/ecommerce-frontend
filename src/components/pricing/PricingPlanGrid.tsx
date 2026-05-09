import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { commercialService } from '@/services/commercial'
import { useAuth } from '@/hooks/useAuth'
import { getAuthAwareStartPath } from '@/utils/authNavigation'
import { useToastStore } from '@/store/toastStore'
import type { CommercialOrderView, OfferingsResult, RateCard, SKU } from '@/types/commercial'

type PricingVariant = 'preview' | 'full'

type PricingPlanView = {
  id: string
  name: string
  desc: string
  price: string
  priceAmount: number
  period: string
  features: string[]
  cta: string
  popular: boolean
  packageCode: string
  skuCode: string
}

type PricingPlanGridProps = {
  variant?: PricingVariant
  className?: string
}

export default function PricingPlanGrid({ variant = 'full', className = '' }: PricingPlanGridProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth({ refreshOnMount: false })
  const { showToast } = useToastStore()
  const [offerings, setOfferings] = useState<OfferingsResult | null>(null)
  const [orders, setOrders] = useState<CommercialOrderView[]>([])
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [purchasingPlanID, setPurchasingPlanID] = useState<string | null>(null)
  const language = i18n.resolvedLanguage ?? i18n.language
  const startPath = getAuthAwareStartPath(isAuthenticated)
  const compact = variant === 'preview'

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadFailed(false)
    commercialService.getOfferings()
      .then(result => {
        if (!cancelled) setOfferings(result)
      })
      .catch(() => {
        if (!cancelled) {
          setOfferings(null)
          setLoadFailed(true)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      setOrders([])
      return
    }
    let cancelled = false
    commercialService.listOrders()
      .then(result => {
        if (!cancelled) setOrders(result.items || [])
      })
      .catch(() => {
        if (!cancelled) setOrders([])
      })
    return () => { cancelled = true }
  }, [isAuthenticated])

  const activeSubscriptionPackageCode = useMemo(() => {
    return [...orders]
      .filter(item => item.order?.status === 'fulfilled' && item.order?.package_type === 'subscription')
      .sort((a, b) => {
        const aTime = new Date(a.order?.fulfilled_at || a.order?.updated_at || a.order?.created_at || 0).getTime()
        const bTime = new Date(b.order?.fulfilled_at || b.order?.updated_at || b.order?.created_at || 0).getTime()
        return bTime - aTime
      })[0]?.order?.package_code || ''
  }, [orders])

  const pricingPlans = useMemo<PricingPlanView[]>(() => buildPricingPlans(offerings, language), [language, offerings])

  const gridClassName = useMemo(() => {
    const count = pricingPlans.length
    if (compact) return 'grid sm:grid-cols-2 lg:grid-cols-4 gap-6'
    if (count >= 4) return 'max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6'
    if (count === 3) return 'max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6'
    if (count === 2) return 'max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6'
    return 'max-w-xl mx-auto grid grid-cols-1 gap-6'
  }, [compact, pricingPlans.length])

  const handlePurchase = async (packageCode: string, skuCode: string, planName: string) => {
    if (!isAuthenticated) {
      navigate(startPath)
      return
    }
    try {
      setPurchasingPlanID(packageCode)
      const created = await commercialService.createOrder({ package_code: packageCode, sku_code: skuCode || undefined })
      const orderID = created.order?.id
      if (!orderID) throw new Error(language.startsWith('zh') ? '创建订单失败' : 'Failed to create order')
      await commercialService.confirmOrderPayment(orderID, { payment_method: 'wallet_balance', provider_code: 'platform_wallet' })
      const latestOrders = await commercialService.listOrders()
      setOrders(latestOrders.items || [])
      showToast(language.startsWith('zh') ? `${planName} 已购买并生效` : `${planName} is active now`, 'success')
      navigate('/account/assets')
    } catch (error) {
      const message = error instanceof Error ? error.message : (language.startsWith('zh') ? '购买失败，请稍后重试' : 'Purchase failed, please try again.')
      showToast(message, 'error')
    } finally {
      setPurchasingPlanID(null)
    }
  }

  if (loading) {
    return (
      <div className={`${gridClassName} ${className}`.trim()}>
        {[0, 1, 2].map(item => (
          <div key={item} className={`glass rounded-2xl ${compact ? 'p-6' : 'p-8'} animate-pulse`}>
            <div className="h-5 w-2/3 rounded bg-white/10" />
            <div className="mt-4 h-4 w-full rounded bg-white/8" />
            <div className="mt-8 h-10 w-1/2 rounded bg-white/10" />
            <div className="mt-8 h-10 rounded-xl bg-white/8" />
          </div>
        ))}
      </div>
    )
  }

  if (loadFailed || pricingPlans.length === 0) {
    return (
      <div className={`mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center ${className}`.trim()}>
        <div className="text-lg font-semibold text-white/88">
          {language.startsWith('zh') ? '价格方案暂时不可用' : 'Pricing plans are temporarily unavailable'}
        </div>
        <p className="mt-2 text-sm text-white/45">
          {language.startsWith('zh') ? '请稍后刷新，或联系销售确认当前套餐。' : 'Please refresh later or contact sales for the current plans.'}
        </p>
      </div>
    )
  }

  return (
    <div className={`${gridClassName} ${className}`.trim()}>
      {pricingPlans.map(plan => {
        const isCurrent = Boolean(activeSubscriptionPackageCode) && activeSubscriptionPackageCode === plan.packageCode
        const isBusy = purchasingPlanID === plan.packageCode
        return (
          <div
            key={plan.id}
            className={`relative glass rounded-2xl ${compact ? 'p-6' : 'p-8'} flex flex-col transition-all duration-300 hover:-translate-y-1 ${
              plan.popular
                ? 'border-brand-500/40 shadow-[0_0_40px_-8px_rgba(59,130,246,0.3)]'
                : 'hover:border-white/15'
            }`}
          >
            {plan.popular && (
              <div className={`absolute -top-3 left-1/2 -translate-x-1/2 btn-primary ${compact ? 'px-3' : 'px-4'} py-1 rounded-full text-xs font-semibold text-white`}>
                {variant === 'preview' ? t('home.pricing_preview.popular') : t('pricing.popular')}
              </div>
            )}

            <div className={compact ? 'mb-4' : 'mb-6'}>
              <h3 className={`${compact ? 'text-lg' : 'text-xl'} font-bold mb-1`}>{plan.name}</h3>
              <p className="text-sm text-white/40">{plan.desc}</p>
            </div>

            <div className={compact ? 'mb-6' : 'mb-8'}>
              <span className={`${compact ? 'text-3xl' : 'text-4xl'} font-bold`}>{plan.price}</span>
              <span className="text-sm text-white/40 ml-1">{plan.period}</span>
            </div>

            <ul className={`${compact ? 'space-y-2 mb-6' : 'space-y-3 mb-8'} flex-1`}>
              {plan.features.map(f => (
                <li key={f} className={`flex items-start gap-2.5 ${compact ? 'text-sm' : 'text-sm'} text-white/60`}>
                  <Check className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-brand-400 shrink-0 mt-0.5`} />
                  {f}
                </li>
              ))}
            </ul>

            {variant === 'preview' ? (
              <Link
                to="/pricing"
                className={`block text-center ${compact ? 'py-2.5' : 'py-3'} rounded-xl text-sm font-semibold transition-all ${plan.popular ? 'btn-primary text-white' : 'btn-outline'}`}
              >
                {plan.cta}
              </Link>
            ) : (
              <button
                type="button"
                disabled={isCurrent || isBusy}
                onClick={() => void handlePurchase(plan.packageCode, plan.skuCode, plan.name)}
                className={`block text-center py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed ${plan.popular ? 'btn-primary text-white' : 'btn-outline'}`}
              >
                {isCurrent
                  ? (language.startsWith('zh') ? '当前套餐' : 'Current plan')
                  : isBusy
                    ? (language.startsWith('zh') ? '购买中...' : 'Purchasing...')
                    : isAuthenticated
                      ? plan.cta
                      : (language.startsWith('zh') ? '登录后购买' : 'Sign in to buy')}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function buildPricingPlans(offerings: OfferingsResult | null, language: string): PricingPlanView[] {
  const skus = offerings?.offerings?.skus || []
  const packages = offerings?.offerings?.packages || []
  const rateCards = offerings?.offerings?.rate_cards || []
  return packages
    .filter(item => item.package_type === 'subscription' && item.status === 'active')
    .map((pkg) => {
      const metadata = safeParse(pkg.metadata)
      const skuCode = typeof metadata.sku_code === 'string' ? metadata.sku_code : ''
      const sku = skus.find(item => item.code === skuCode) || findSKUByPackageCode(skus, pkg.code)
      const rateCard = findRateCard(rateCards, sku?.id || '', pkg.code)
      const unitAmount = getUnitAmount(rateCard) || sku?.list_price || 0
      return {
        id: pkg.code,
        name: pkg.name,
        desc: subscriptionDescription(pkg.code, language),
        price: formatMoney(unitAmount),
        priceAmount: unitAmount,
        period: language.startsWith('zh') ? '/月' : '/mo',
        features: subscriptionFeatures(pkg.code, language),
        cta: language.startsWith('zh') ? '查看详情' : 'View details',
        popular: pkg.code.includes('.pro.'),
        packageCode: pkg.code,
        skuCode: sku?.code || '',
      }
    })
    .sort((a, b) => {
      const byPrice = a.priceAmount - b.priceAmount
      if (byPrice !== 0) return byPrice
      return a.name.localeCompare(b.name)
    })
}

function safeParse(raw?: string) {
  if (!raw) return {} as Record<string, unknown>
  try {
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return {} as Record<string, unknown>
  }
}

function findSKUByPackageCode(items: SKU[], packageCode: string) {
  return items.find((item) => safeParse(item.metadata).package_code === packageCode)
}

function findRateCard(items: RateCard[], skuID: string, packageCode: string) {
  return items.find((item) => item.status === 'active' && ((item.target_type === 'sku' && item.target_id === skuID) || safeParse(item.metadata).package_code === packageCode))
}

function getUnitAmount(item?: RateCard) {
  if (!item?.price_config) return 0
  const parsed = safeParse(item.price_config)
  const value = parsed.unit_amount
  return typeof value === 'number' ? value : 0
}

function formatMoney(cents: number) {
  return `¥${(cents / 100).toLocaleString()}`
}

function subscriptionDescription(packageCode: string, language: string) {
  if (packageCode.includes('.basic.')) return language.startsWith('zh') ? '适合日常卖家运营的实用月包' : 'A practical monthly package for daily seller operations'
  if (packageCode.includes('.pro.')) return language.startsWith('zh') ? '适合高频运营卖家与紧凑团队' : 'For high-frequency operators and compact teams'
  if (packageCode.includes('.growth.')) return language.startsWith('zh') ? '适合需要共享流程、治理与持续充值的团队' : 'For teams that need shared workflow, governance, and ongoing top-up'
  return language.startsWith('zh') ? '适合电商 AI 生产的商业套餐' : 'A commerce package for AI production'
}

function subscriptionFeatures(packageCode: string, language: string) {
  if (packageCode.includes('.basic.')) {
    return language.startsWith('zh')
      ? ['每月套餐充值 300 次额度', '核心视觉工作流', '标准导出与交付', '可随时追加积分']
      : ['Monthly package recharge', 'Core visual workflows', 'Standard export and delivery', 'Extra credits available anytime']
  }
  if (packageCode.includes('.pro.')) {
    return language.startsWith('zh')
      ? ['更高月套餐充值', '高级工作流访问', '灵活追加积分', '优先支持']
      : ['Higher monthly package recharge', 'Advanced workflow access', 'Flexible extra credit top-up', 'Priority support']
  }
  return language.startsWith('zh')
    ? ['团队套餐充值方案', '共享团队工作区', '组织级治理', '额外积分与商业支持']
    : ['Team package recharge plan', 'Shared team workspace', 'Organization-level governance', 'Extra credits and commercial support']
}
