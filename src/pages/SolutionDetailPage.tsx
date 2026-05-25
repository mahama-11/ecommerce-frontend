import { useTranslation } from 'react-i18next'
import { ArrowRight, BarChart3, LineChart, Search, Mail, ClipboardList, ShieldCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type AgentSolution = {
  id: string
  zhTitle: string
  enTitle: string
  zhSubtitle: string
  enSubtitle: string
  zhDesc: string
  enDesc: string
  icon: LucideIcon
  accent: string
  capabilitiesZh: string[]
  capabilitiesEn: string[]
  scenariosZh: string[]
  scenariosEn: string[]
  inputsZh: string[]
  inputsEn: string[]
  outputsZh: string[]
  outputsEn: string[]
}

const AGENT_SOLUTIONS: AgentSolution[] = [
  {
    id: 'campaign-forecast',
    zhTitle: '电商大促单量预测 Agent',
    enTitle: 'Campaign Demand Forecast Agent',
    zhSubtitle: '预测 Prime Day、黑五、618、双11 等大促单量，并反推备货计划。',
    enSubtitle: 'Forecast campaign demand for Prime Day, Black Friday, 618, and Singles’ Day, then translate it into replenishment plans.',
    zhDesc: '面向跨境电商卖家，通过历史销售、活动力度、库存状态、类目趋势和竞品表现，生成保守/中性/乐观三种单量预测与备货建议。',
    enDesc: 'For cross-border sellers: combine sales history, campaign mechanics, inventory state, category trends, and competitor signals to produce conservative/base/optimistic demand forecasts and inventory actions.',
    icon: BarChart3,
    accent: 'from-cyan-400/22 via-blue-400/12 to-transparent',
    capabilitiesZh: ['历史销售趋势分析', '活动因子与增长率评估', '三场景销量预测', '安全库存与分批发货建议'],
    capabilitiesEn: ['Sales trend analysis', 'Campaign lift-factor evaluation', 'Three-scenario demand forecast', 'Safety stock and shipment plan'],
    scenariosZh: ['Prime Day / Black Friday 备货', '旺季库存规划', '活动效果复盘', '常规补货测算'],
    scenariosEn: ['Prime Day / Black Friday replenishment', 'Peak-season inventory planning', 'Campaign performance review', 'Routine replenishment calculation'],
    inputsZh: ['ASIN/SKU、类目、售价', '当前 FBA/在途/预留库存', '近 3-12 个月销量', '活动折扣与促销目标'],
    inputsEn: ['ASIN/SKU, category, price', 'FBA / inbound / reserved stock', '3-12 months sales history', 'Discount and campaign target'],
    outputsZh: ['预测单量与置信区间', '建议备货量', '分批发货时间表', '缺货/滞销风险提示'],
    outputsEn: ['Forecast demand and confidence range', 'Recommended replenishment volume', 'Shipment schedule', 'Stockout / overstock risk notes'],
  },
  {
    id: 'dynamic-pricing',
    zhTitle: '电商动态定价 Agent',
    enTitle: 'Dynamic Pricing Agent',
    zhSubtitle: '根据市场供需、竞品价格、库存压力和目标 ROI 生成动态调价策略。',
    enSubtitle: 'Generate dynamic pricing strategies from market demand, competitor pricing, inventory pressure, and ROI targets.',
    zhDesc: '用于新品定价、大促调价、利润优化、销量优先和滞销清仓等场景，输出推荐价格区间、调价频率、分阶段执行计划和风险提示。',
    enDesc: 'Support launch pricing, campaign pricing, profit optimization, volume-first moves, and clearance scenarios with price bands, adjustment cadence, staged plans, and risk notes.',
    icon: LineChart,
    accent: 'from-emerald-400/22 via-lime-400/10 to-transparent',
    capabilitiesZh: ['竞品价格监控', '价格弹性与 Buy Box 分析', '利润/销量/平衡策略模拟', '大促预热-活动-恢复期调价计划'],
    capabilitiesEn: ['Competitor price monitoring', 'Price elasticity and Buy Box analysis', 'Profit / volume / balanced strategy simulation', 'Pre-campaign / campaign / recovery pricing plan'],
    scenariosZh: ['新品上市定价', '大促期间调价', '价格战应对', '滞销品清仓'],
    scenariosEn: ['New product launch pricing', 'Campaign repricing', 'Price-war response', 'Clearance pricing'],
    inputsZh: ['产品成本与当前售价', '竞品均价与价格区间', '库存周转天数', '目标 ROI / 利润率'],
    inputsEn: ['Cost and current price', 'Competitor average and price range', 'Inventory turnover days', 'Target ROI / margin'],
    outputsZh: ['推荐价格与区间', '调价频率与幅度', '阶段性调价表', '品牌与平台合规风险'],
    outputsEn: ['Recommended price and range', 'Adjustment cadence and range', 'Staged pricing schedule', 'Brand and platform policy risks'],
  },
  {
    id: 'competitor-analysis',
    zhTitle: '电商竞品分析 Agent',
    enTitle: 'Competitor Analysis Agent',
    zhSubtitle: '监控竞品价格、排名、评分、评论、上新和促销动作，识别机会与威胁。',
    enSubtitle: 'Monitor competitor price, rank, rating, reviews, launches, and promotion moves to identify opportunities and risks.',
    zhDesc: '用于类目调研、新品进入、价格战分析、BSR 头部竞品分析和大促竞品监控，输出竞品概览、价格分布、销量估算、机会风险和策略建议。',
    enDesc: 'For category research, new-market entry, price-war analysis, BSR leader analysis, and campaign monitoring; outputs competitor overview, price distribution, estimated volume, opportunity/risk, and strategy suggestions.',
    icon: Search,
    accent: 'from-violet-400/24 via-fuchsia-400/10 to-transparent',
    capabilitiesZh: ['竞品基础信息采集', 'BSR / 关键词排名监控', '销量趋势估算', '价格、评论、促销动作追踪'],
    capabilitiesEn: ['Competitor profile capture', 'BSR / keyword rank monitoring', 'Sales trend estimation', 'Price, review, and promotion tracking'],
    scenariosZh: ['新品调研', '类目容量评估', '价格战分析', '大促竞品监控'],
    scenariosEn: ['New-product research', 'Category capacity estimation', 'Price-war analysis', 'Campaign competitor monitoring'],
    inputsZh: ['目标类目或核心关键词', '竞品 ASIN 列表', '分析维度与周期', '价格/排名/评论关注点'],
    inputsEn: ['Target category or keywords', 'Competitor ASIN list', 'Analysis dimensions and period', 'Price / rank / review focus'],
    outputsZh: ['竞品列表与画像', '价格带和排名分布', '估算销量', '机会、风险与运营建议'],
    outputsEn: ['Competitor list and profiles', 'Price band and rank distribution', 'Estimated sales volume', 'Opportunity, risk, and operating suggestions'],
  },
]

function pick(locale: string, zh: string, en: string) {
  return locale.startsWith('zh') ? zh : en
}

function AgentCard({ agent, locale }: { agent: AgentSolution; locale: string }) {
  const Icon = agent.icon
  const capabilities = locale.startsWith('zh') ? agent.capabilitiesZh : agent.capabilitiesEn
  const scenarios = locale.startsWith('zh') ? agent.scenariosZh : agent.scenariosEn
  const inputs = locale.startsWith('zh') ? agent.inputsZh : agent.inputsEn
  const outputs = locale.startsWith('zh') ? agent.outputsZh : agent.outputsEn

  return (
    <section id={agent.id} className="scroll-mt-28 overflow-hidden rounded-[32px] border border-white/[0.08] bg-white/[0.035] shadow-[0_24px_90px_rgba(0,0,0,0.28)]">
      <div className={`relative bg-gradient-to-br ${agent.accent} p-7 sm:p-9`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_38%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-black/20 px-3 py-1 text-xs font-semibold text-white/58">
              <Icon className="h-4 w-4 text-cyan-100" />
              {pick(locale, '展示方案', 'Showcase')}
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{pick(locale, agent.zhTitle, agent.enTitle)}</h2>
            <p className="mt-3 text-base leading-7 text-white/66">{pick(locale, agent.zhSubtitle, agent.enSubtitle)}</p>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/48">{pick(locale, agent.zhDesc, agent.enDesc)}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-5 sm:p-7 lg:grid-cols-4">
        {[
          { title: pick(locale, '核心能力', 'Capabilities'), items: capabilities, icon: ShieldCheck },
          { title: pick(locale, '适用场景', 'Use cases'), items: scenarios, icon: ClipboardList },
          { title: pick(locale, '输入信息', 'Inputs'), items: inputs, icon: Mail },
          { title: pick(locale, '输出结果', 'Outputs'), items: outputs, icon: ArrowRight },
        ].map(block => {
          const BlockIcon = block.icon
          return (
            <div key={block.title} className="rounded-3xl border border-white/[0.07] bg-[var(--ecom-surface)]/70 p-5">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white/86">
                <BlockIcon className="h-4 w-4 text-cyan-100/75" />
                {block.title}
              </div>
              <ul className="space-y-2.5">
                {block.items.map(item => (
                  <li key={item} className="flex gap-2 text-sm leading-6 text-white/52">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-200/70" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default function SolutionDetailPage() {
  const { i18n } = useTranslation()
  const locale = i18n.resolvedLanguage ?? i18n.language

  return (
    <div className="min-h-screen bg-[var(--ecom-bg)] text-white">
      <section className="relative overflow-hidden border-b border-white/[0.06] px-6 py-20 sm:py-24">
        <div className="glow-orb -left-40 top-0 h-[420px] w-[420px] bg-cyan-400/12" />
        <div className="glow-orb -right-24 top-24 h-[360px] w-[360px] bg-violet-400/12" />
        <div className="relative mx-auto max-w-6xl">
          <div className="mb-5 inline-flex rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100/65">
            {pick(locale, '解决方案', 'Solutions')}
          </div>
          <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl">
            {pick(locale, '面向电商运营的 AI Agent 展示', 'AI Agent showcases for ecommerce operations')}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-white/58 sm:text-lg">
            {pick(
              locale,
              '围绕大促预测、动态定价和竞品分析三个高频场景，展示从业务输入到行动建议的完整工作方式。',
              'A showcase of three decision-heavy ecommerce scenarios, from business inputs to actionable recommendations.',
            )}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {AGENT_SOLUTIONS.map(agent => (
              <a key={agent.id} href={`#${agent.id}`} className="rounded-full border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-sm text-white/64 transition hover:border-cyan-100/35 hover:text-white">
                {pick(locale, agent.zhTitle, agent.enTitle)}
              </a>
            ))}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-12 sm:py-16">
        {AGENT_SOLUTIONS.map(agent => (
          <AgentCard key={agent.id} agent={agent} locale={locale} />
        ))}
      </main>
    </div>
  )
}
