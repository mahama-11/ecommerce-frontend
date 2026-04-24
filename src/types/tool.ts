export interface ToolDef {
  id: string
  slug: string
  name: string
  desc: string
  icon: string
  category: ToolCategory
  complexity: number
  tags: string[]
  comingSoon?: boolean
}

export type ToolCategory =
  | 'model'
  | 'product'
  | 'suite'
  | 'video'
  | 'designer'
  | 'chat'
  | 'database'

export interface SolutionDef {
  id: string
  slug: string
  title: string
  subtitle: string
  audience: string
  icon: string
  color: string
  features: string[]
}

export interface PricingPlan {
  id: string
  name: string
  price: string
  period: string
  desc: string
  features: string[]
  cta: string
  popular?: boolean
}
