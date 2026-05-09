import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check, ChevronDown, ArrowRight, Sparkles } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getAuthAwareStartPath } from '@/utils/authNavigation'
import { commercialService } from '@/services/commercial'
import { useToastStore } from '@/store/toastStore'
import type { CommercialOrderView, OfferingsResult, RateCard, SKU } from '@/types/commercial'

interface FaqItem {
  q: string
  a: string
}

export default function PricingPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth({ refreshOnMount: false })
  const { showToast } = useToastStore()
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [offerings, setOfferings] = useState<OfferingsResult | null>(null)
  const [orders, setOrders] = useState<CommercialOrderView[]>([])
  const [purchasingPlanID, setPurchasingPlanID] = useState<string | null>(null)
  const language = i18n.resolvedLanguage ?? i18n.language
  const startPath = getAuthAwareStartPath(isAuthenticated)

  const faqItems = t('pricing.faq.items', { returnObjects: true }) as FaqItem[]

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1 },
    )
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let cancelled = false
    commercialService.getOfferings()
      .then(result => {
        if (!cancelled) setOfferings(result)
      })
      .catch(() => {
        if (!cancelled) setOfferings(null)
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

  const pricingPlans = useMemo(() => {
    const skus = offerings?.offerings?.skus || []
    const packages = offerings?.offerings?.packages || []
    const rateCards = offerings?.offerings?.rate_cards || []
    const subscriptionPackages = packages.filter(item => item.package_type === 'subscription' && item.status === 'active')
    return subscriptionPackages.map((pkg) => {
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
        cta: language.startsWith('zh') ? '立即购买' : 'Buy now',
        popular: pkg.code.includes('.pro.'),
        packageCode: pkg.code,
        skuCode: sku?.code || '',
      }
    }).sort((a, b) => {
      const byPrice = a.priceAmount - b.priceAmount
      if (byPrice !== 0) return byPrice
      return a.name.localeCompare(b.name)
    })
  }, [language, offerings])

  const gridClassName = useMemo(() => {
    const count = pricingPlans.length
    if (count >= 4) return 'max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6'
    if (count === 3) return 'max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6'
    if (count === 2) return 'max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6'
    return 'max-w-xl mx-auto grid grid-cols-1 gap-6'
  }, [pricingPlans.length])

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

  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <section className="relative pt-32 pb-16 px-4 sm:px-6 text-center">
        <div className="glow-orb w-[500px] h-[500px] bg-brand-500/15 -top-40 left-1/2 -translate-x-1/2" />

        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6 animate-slide-up">
            <Sparkles className="w-4 h-4 text-brand-400" />
            <span className="text-sm text-white/70">{t('pricing.badge')}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 animate-slide-up">
            {t('pricing.title_prefix')}<span className="gradient-text">{t('pricing.title_highlight')}</span>
          </h1>
          <p className="text-lg text-white/50 animate-slide-up">
            {t('pricing.subtitle')}
          </p>
        </div>
      </section>

      {/* ── Pricing Cards ── */}
      <section className="reveal px-4 sm:px-6 pb-24">
        <div className={gridClassName}>
          {pricingPlans.map(plan => {
            const isCurrent = Boolean(activeSubscriptionPackageCode) && activeSubscriptionPackageCode === plan.packageCode
            const isBusy = purchasingPlanID === plan.packageCode
            return (
              <div
                key={plan.id}
                className={`relative glass rounded-2xl p-8 flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                  plan.popular
                    ? 'border-brand-500/40 shadow-[0_0_40px_-8px_rgba(59,130,246,0.3)]'
                    : 'hover:border-white/15'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 btn-primary px-4 py-1 rounded-full text-xs font-semibold text-white">
                    {t('pricing.popular')}
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                  <p className="text-sm text-white/40">{plan.desc}</p>
                </div>

                <div className="mb-8">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-sm text-white/40 ml-1">{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-white/60">
                      <Check className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  disabled={isCurrent || isBusy}
                  onClick={() => void handlePurchase(plan.packageCode, plan.skuCode, plan.name)}
                  className={`block text-center py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                    plan.popular
                      ? 'btn-primary text-white'
                      : 'btn-outline'
                  }`}
                >
                  {isCurrent
                    ? (language.startsWith('zh') ? '当前套餐' : 'Current plan')
                    : isBusy
                      ? (language.startsWith('zh') ? '购买中...' : 'Purchasing...')
                      : isAuthenticated
                        ? plan.cta
                        : (language.startsWith('zh') ? '开始使用' : 'Get started')}
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="reveal px-4 sm:px-6 pb-32">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            {t('pricing.faq_title')}
          </h2>

          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <div key={i} className="glass rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <span className="font-medium text-white/90">{item.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-white/40 shrink-0 transition-transform duration-300 ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-300 ${
                    openFaq === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-4 text-sm text-white/50 leading-relaxed">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section id="pricing-contact" className="reveal px-4 sm:px-6 pb-24">
        <div className="max-w-4xl mx-auto glass-strong rounded-3xl p-12 text-center relative overflow-hidden">
          <div className="glow-orb w-[250px] h-[250px] bg-brand-500/15 -top-16 -right-16" />
          <div className="glow-orb w-[200px] h-[200px] bg-accent-500/10 -bottom-10 -left-10" />

          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              {t('pricing.bottom_cta.title')}
            </h2>
            <p className="text-white/50 mb-8">
              {t('pricing.bottom_cta.subtitle')}
            </p>
            <a
              href="mailto:sales@agent-ecommerce.com"
              className="btn-primary inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold text-white"
            >
              {t('pricing.bottom_cta.button')} <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>
    </div>
  )
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
