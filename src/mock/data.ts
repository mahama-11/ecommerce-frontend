import type { ToolDef, SolutionDef, PricingPlan } from '@/types/tool'

type SupportedLocale = 'zh' | 'en'

const resolveLocale = (language: string): SupportedLocale =>
  language.toLowerCase().startsWith('en') ? 'en' : 'zh'

const TOOL_TRANSLATIONS: Record<
  string,
  { en: { name: string; desc: string; tags: string[] } }
> = {
  'changing-model': {
    en: {
      name: 'Real Person to Model',
      desc: 'Upload a try-on photo and transform it into different model ethnicities and looks',
      tags: ['Apparel', 'Face Swap', 'V2.0'],
    },
  },
  'changing-mannequin': {
    en: {
      name: 'Mannequin to Model',
      desc: 'Turn mannequin photos into realistic human model visuals',
      tags: ['Mannequin', 'Full Body', 'Scene'],
    },
  },
  'changing-bg': {
    en: {
      name: 'Background Swap',
      desc: 'Replace studio backgrounds with a variety of selling scenes',
      tags: ['Background', 'Scene', 'Studio'],
    },
  },
  'ai-dressing': {
    en: {
      name: 'AI Dressing',
      desc: 'Upload flat-lay apparel and generate ready-to-wear try-on results',
      tags: ['Try-On', 'Outfit', 'One-Piece'],
    },
  },
  'ai-wearable': {
    en: {
      name: 'Wearable Product',
      desc: 'Generate close-up lifestyle images for watches, necklaces, earrings, and more',
      tags: ['Wearable', 'Jewelry', 'Close-Up'],
    },
  },
  'ai-posture': {
    en: {
      name: 'Pose Variations',
      desc: 'Generate multiple pose variants from a single model image',
      tags: ['Pose', 'Variation', 'Suite'],
    },
  },
  'ai-product': {
    en: {
      name: 'Product Scene Composition',
      desc: 'Place your product into a large library of AI-generated scenes',
      tags: ['Scene', 'Composition', 'Universal'],
    },
  },
  'product-replacement': {
    en: {
      name: 'Product Replacement',
      desc: 'Replace products in a reference image with your own SKU',
      tags: ['Replace', 'Perspective', 'Reference'],
    },
  },
  'image-fission': {
    en: {
      name: 'Scene Variation',
      desc: 'Create multiple similar scenes from one reference image',
      tags: ['Variation', 'Similar', 'Batch'],
    },
  },
  'scene-image': {
    en: {
      name: 'Scene Asset Generation',
      desc: 'Generate background scene assets from text prompts',
      tags: ['Text to Image', 'Scene', 'Background'],
    },
  },
  'handheld-goods': {
    en: {
      name: 'Handheld Product',
      desc: 'Generate model shots holding your product naturally',
      tags: ['Handheld', 'Model', 'Product'],
    },
  },
  'clothing-image-suite': {
    en: {
      name: 'Apparel Image Suite',
      desc: 'Generate model shots, lifestyle posts, selling points, and A+ assets in one go',
      tags: ['Apparel', 'All-in-One', 'Brand'],
    },
  },
  'product-image-suite': {
    en: {
      name: 'Product Image Suite',
      desc: 'Generate A+, selling-point, white-background, and scene images from multi-angle uploads',
      tags: ['Product', 'Multi-Image', 'Brand'],
    },
  },
  video: {
    en: {
      name: 'Image to Video',
      desc: 'Turn a reference image plus prompt into a 5-second AI video',
      tags: ['Video', 'AI', '5 Seconds'],
    },
  },
  'batch-generate-videos': {
    en: {
      name: 'Batch Video Generation',
      desc: 'Upload in batch and convert videos into flat, color, or anime styles',
      tags: ['Batch', 'Style', 'Convert'],
    },
  },
  'video-concat': {
    en: {
      name: 'Video Stitching',
      desc: 'Combine 2-4 clips into a finished marketing video',
      tags: ['Stitch', 'Edit', 'Final Cut'],
    },
  },
  'designer-home': {
    en: {
      name: 'Designer',
      desc: 'A design workspace with filters by type, category, and layout',
      tags: ['Design', 'Template', 'Layout'],
    },
  },
  'product-refine': {
    en: {
      name: 'Product Retouch',
      desc: 'Enhance texture and polish of product visuals in one click',
      tags: ['Retouch', 'Texture', 'Enhance'],
    },
  },
}

const SOLUTION_TRANSLATIONS: Record<
  string,
  { en: { title: string; subtitle: string; audience: string; features: string[] } }
> = {
  boutique: {
    en: {
      title: 'Boutique Seller',
      subtitle: 'Refine every single SKU with AI from shooting to listing',
      audience: 'Sellers focused on premium product quality',
      features: ['Phone Shot to White Background', 'AI Scene Images', 'Best-Seller Listing Rewrite', 'AI Foreign Model Try-On'],
    },
  },
  multipleStores: {
    en: {
      title: 'Multi-Store Seller',
      subtitle: 'Batch variation workflows to scale one asset into many outputs',
      audience: 'Distribution and multi-store operators',
      features: ['Bulk Listing Generation', 'Bulk Image Variations', 'Sensitive Word Detection', 'Batch Background Removal'],
    },
  },
  creativeCustomized: {
    en: {
      title: 'Creative Custom Seller',
      subtitle: 'An AI creative factory for POD and customized products',
      audience: 'T-shirt, mug, and POD sellers',
      features: ['Creative Asset Variations', 'Creative Copy Generation', 'Commercially Safe Assets', 'One Click Multi-Style'],
    },
  },
  clothing: {
    en: {
      title: 'Apparel Seller',
      subtitle: 'Upgrade clothing presentation with AI-powered model replacement',
      audience: 'Fashion and apparel sellers',
      features: ['Real Person to Model', 'Model Scene Swap', 'AI Multi-Ethnicity Face', 'Massive Scene Library'],
    },
  },
}

const PRICING_TRANSLATIONS: Record<
  string,
  { en: { name: string; period: string; desc: string; features: string[]; cta: string } }
> = {
  free: {
    en: {
      name: 'Free',
      period: 'Forever',
      desc: 'Try the core AI capabilities',
      features: ['10 free generations per day', 'Basic cutout', '3 scene templates', '720p export', 'Community support'],
      cta: 'Start Free',
    },
  },
  basic: {
    en: {
      name: 'Basic',
      period: '/month',
      desc: 'Great for solo sellers and daily use',
      features: ['500 generations / month', 'All AI tools', '1080p export', '100 templates', '5GB asset space', 'Email support'],
      cta: 'Subscribe Now',
    },
  },
  pro: {
    en: {
      name: 'Pro',
      period: '/month',
      desc: 'For professional sellers and studios',
      features: ['3000 generations / month', 'AI video generation', '4K export', 'Unlimited templates', '50GB asset space', 'API access', 'Priority support'],
      cta: 'Upgrade to Pro',
    },
  },
  team: {
    en: {
      name: 'Team',
      period: '/month+',
      desc: 'For collaborative enterprise teams',
      features: ['10000 shared generations / month', 'Team workspace', 'Brand library management', 'Unlimited storage', 'SSO integration', 'Dedicated tech support', 'Custom models'],
      cta: 'Contact Sales',
    },
  },
}

export function getLocalizedTool(tool: ToolDef, language: string): ToolDef {
  const locale = resolveLocale(language)
  if (locale === 'zh') return tool

  const translated = TOOL_TRANSLATIONS[tool.slug]?.en
  if (!translated) return tool

  return {
    ...tool,
    name: translated.name,
    desc: translated.desc,
    tags: translated.tags,
  }
}

export function getLocalizedSolution(solution: SolutionDef, language: string): SolutionDef {
  const locale = resolveLocale(language)
  if (locale === 'zh') return solution

  const translated = SOLUTION_TRANSLATIONS[solution.slug]?.en
  if (!translated) return solution

  return {
    ...solution,
    title: translated.title,
    subtitle: translated.subtitle,
    audience: translated.audience,
    features: translated.features,
  }
}

export function getLocalizedPricingPlan(plan: PricingPlan, language: string): PricingPlan {
  const locale = resolveLocale(language)
  if (locale === 'zh') return plan

  const translated = PRICING_TRANSLATIONS[plan.id]?.en
  if (!translated) return plan

  return {
    ...plan,
    name: translated.name,
    period: translated.period,
    desc: translated.desc,
    features: translated.features,
    cta: translated.cta,
  }
}

export const TOOL_CATEGORIES = [
  { key: 'model', label: '模特图系列', labelKey: 'toolCategories.model', icon: '👤', color: 'from-pink-500/20 to-rose-600/10' },
  { key: 'product', label: '商品图系列', labelKey: 'toolCategories.product', icon: '📦', color: 'from-blue-500/20 to-cyan-600/10' },
  { key: 'suite', label: '套图系列', labelKey: 'toolCategories.suite', icon: '🖼️', color: 'from-purple-500/20 to-violet-600/10' },
  { key: 'video', label: 'AI 视频', labelKey: 'toolCategories.video', icon: '🎬', color: 'from-red-500/20 to-orange-600/10' },
  { key: 'designer', label: '设计器', labelKey: 'toolCategories.designer', icon: '🎨', color: 'from-emerald-500/20 to-teal-600/10' },
] as const

export const TOOLS: ToolDef[] = [
  { id: 't1', slug: 'changing-model', name: '真人换模特', desc: '上传真人试穿图 → 换脸换肤为不同人种模特', icon: '👤', category: 'model', complexity: 5, tags: ['服装', '换脸', 'V2.0'] },
  { id: 't2', slug: 'changing-mannequin', name: '人台换模特', desc: '上传人台假模特图 → 生成真人模特效果', icon: '🧍', category: 'model', complexity: 5, tags: ['人台', '全身', '场景'] },
  { id: 't3', slug: 'changing-bg', name: '换背景', desc: '上传真人棚拍图 → 替换为各种场景背景', icon: '🌄', category: 'model', complexity: 4, tags: ['背景', '场景', '棚拍'] },
  { id: 't4', slug: 'ai-dressing', name: 'AI穿衣', desc: '上传平铺服装 → 一键生成穿衣上身效果', icon: '👗', category: 'model', complexity: 5, tags: ['穿衣', '上下装', '连体衣'] },
  { id: 't5', slug: 'ai-wearable', name: '穿戴商品', desc: '上传手表/项链/耳环 → 生成模特穿戴特写图', icon: '⌚', category: 'model', complexity: 4, tags: ['穿戴', '首饰', '特写'] },
  { id: 't6', slug: 'ai-posture', name: '姿势裂变', desc: '1张模特图 → N种不同姿势的套图', icon: '🤸', category: 'model', complexity: 4, tags: ['姿势', '裂变', '套图'] },

  { id: 't7', slug: 'ai-product', name: '商品场景合成', desc: '上传商品图 → AI合成到海量预设场景中', icon: '🎯', category: 'product', complexity: 4, tags: ['场景', '合成', '全品类'] },
  { id: 't8', slug: 'product-replacement', name: '商品替换', desc: '上传参考图 → 替换其中的商品为自己的产品', icon: '🔄', category: 'product', complexity: 4, tags: ['替换', '透视', '参考图'] },
  { id: 't9', slug: 'image-fission', name: '场景裂变', desc: '上传1张场景参考图 → 裂变出N张类似场景', icon: '✨', category: 'product', complexity: 3, tags: ['裂变', '相似', '批量'] },
  { id: 't10', slug: 'scene-image', name: '场景素材生成', desc: '文字描述 → 生成场景背景图', icon: '🖌️', category: 'product', complexity: 3, tags: ['文生图', '场景', '背景'] },
  { id: 't11', slug: 'handheld-goods', name: '手持商品', desc: '上传商品图 → 生成模特手持商品效果', icon: '🤲', category: 'product', complexity: 4, tags: ['手持', '模特', '商品'] },

  { id: 't12', slug: 'clothing-image-suite', name: '服装套图', desc: '上传≤6张服装图 → 一键生成模特图+种草图+卖点图+A+图', icon: '👔', category: 'suite', complexity: 5, tags: ['服装', '一站式', '品牌'] },
  { id: 't13', slug: 'product-image-suite', name: '商品套图', desc: '上传多视角商品图 → 生成A+图+卖点图+白底图+场景图', icon: '📸', category: 'suite', complexity: 5, tags: ['商品', '多图', '品牌'] },

  { id: 't14', slug: 'video', name: '图生视频', desc: '上传参考图+prompt → AI生成5秒视频', icon: '🎥', category: 'video', complexity: 5, tags: ['视频', 'AI', '5秒'] },
  { id: 't15', slug: 'batch-generate-videos', name: '批量生成视频', desc: '批量上传视频 → 风格转换(平面/色彩/动漫)', icon: '🎞️', category: 'video', complexity: 4, tags: ['批量', '风格', '转换'] },
  { id: 't16', slug: 'video-concat', name: '视频拼接', desc: '选择2-4个视频片段 → 一键拼接成品视频', icon: '🔗', category: 'video', complexity: 2, tags: ['拼接', '剪辑', '成品'] },

  { id: 't17', slug: 'designer-home', name: '设计器', desc: '图片设计器, 按类型/品类/版式筛选模板', icon: '🎨', category: 'designer', complexity: 4, tags: ['设计', '模板', '版式'] },
  { id: 't18', slug: 'product-refine', name: '商品精修', desc: '一键提升商品图片质感', icon: '💎', category: 'product', complexity: 3, tags: ['精修', '质感', '增强'] },
]

export const SOLUTIONS: SolutionDef[] = [
  {
    id: 's1', slug: 'boutique', title: '精品卖家', subtitle: '单品精做, 从拍照到上架全链路AI加速',
    audience: '注重产品品质的精品卖家', icon: '💎',
    color: 'from-blue-500 to-cyan-500',
    features: ['手机拍 → 白底图', 'AI场景图', 'BS Listing仿写', 'AI外模试穿'],
  },
  {
    id: 's2', slug: 'multipleStores', title: '多店铺卖家', subtitle: '批量裂变, 一张图生成无限可能',
    audience: '铺货型/多店运营卖家', icon: '🏪',
    color: 'from-purple-500 to-pink-500',
    features: ['批量生成Listing', '批量图片裂变', '侵权词检测', '批量抠图'],
  },
  {
    id: 's3', slug: 'creativeCustomized', title: '创意定制卖家', subtitle: 'POD/定制品的AI创意工厂',
    audience: 'T-shirt/马克杯/POD卖家', icon: '🎨',
    color: 'from-orange-500 to-red-500',
    features: ['AI创意素材裂变', '创意文字生成', '无侵权商用', '一键多款'],
  },
  {
    id: 's4', slug: 'clothing', title: '服装卖家', subtitle: '真人换模特, AI让服装展示更高端',
    audience: '服饰品类卖家', icon: '👗',
    color: 'from-pink-500 to-rose-500',
    features: ['真人换模特', '模特换场景', 'AI面具(多人种)', '海量场景库'],
  },
]

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free', name: '免费版', price: '¥0', period: '永久',
    desc: '体验核心AI能力',
    features: ['每日10次免费生图', '基础抠图', '3张场景模板', '720p导出', '社区支持'],
    cta: '免费开始',
  },
  {
    id: 'basic', name: '基础版', price: '¥55', period: '/月',
    desc: '适合个人卖家日常使用',
    features: ['500次/月生图额度', '全部AI工具', '高清1080p导出', '100个模板', '5GB素材空间', '邮件支持'],
    cta: '立即订阅', popular: true,
  },
  {
    id: 'pro', name: '高级版', price: '¥239', period: '/月',
    desc: '适合专业卖家和工作室',
    features: ['3000次/月生图额度', 'AI视频生成', '4K导出', '无限模板', '50GB素材空间', 'API接口', '专属客服'],
    cta: '升级高级版',
  },
  {
    id: 'team', name: '团队版', price: '¥399', period: '/月起',
    desc: '适合团队协作的企业方案',
    features: ['10000次/月共享额度', '团队协作空间', '品牌库管理', '无限存储', 'SSO集成', '专属技术支持', '自定义模型'],
    cta: '联系销售',
  },
]

export const NAV_TOOL_GROUPS = [
  {
    label: 'AI 视觉生成',
    labelKey: 'navGroups.visual',
    items: [
      { label: '模特图系列', labelKey: 'toolCategories.model', icon: '👤', children: TOOLS.filter(t => t.category === 'model') },
      { label: '商品图系列', labelKey: 'toolCategories.product', icon: '📦', children: TOOLS.filter(t => t.category === 'product') },
      { label: '套图系列', labelKey: 'toolCategories.suite', icon: '🖼️', children: TOOLS.filter(t => t.category === 'suite') },
      { label: 'AI 视频', labelKey: 'toolCategories.video', icon: '🎬', children: TOOLS.filter(t => t.category === 'video') },
      { label: '设计器', labelKey: 'toolCategories.designer', icon: '🎨', children: TOOLS.filter(t => t.category === 'designer') },
    ],
  },
  {
    label: 'AI 智能运营',
    labelKey: 'navGroups.ops',
    items: [
      { label: 'AI对话', labelKey: 'pages.chat', icon: '💬', path: '/chat' },
      { label: '知识库对话', labelKey: 'pages.chatDoc', icon: '📚', path: '/chat/doc' },
      { label: '批量Listing', labelKey: 'pages.aiChatBatchListing', icon: '📝', path: '/aiChat/batchListing' },
      { label: 'AI Agent模板', labelKey: 'pages.aiChatTemplate', icon: '🤖', path: '/aiChat/template' },
      { label: '历史会话', labelKey: 'pages.aiChatHistory', icon: '🗂️', path: '/aiChat/history' },
      { label: '我的模板', labelKey: 'pages.aiChatMyTemplate', icon: '📁', path: '/aiChat/myTemplate' },
      { label: '分析记录', labelKey: 'pages.aiChatAnalysisRecords', icon: '📊', path: '/aiChat/analysisRecords' },
      { label: 'AI训练(选品)', labelKey: 'pages.aiChatTraining', icon: '🎯', path: '/aiChat/training' },
    ],
  },
  {
    label: '数据资料库',
    labelKey: 'navGroups.data',
    items: [
      { label: '智能知识库', labelKey: 'pages.databaseKnowledge', icon: '📖', path: '/database/knowledge' },
      { label: '图片素材库', labelKey: 'pages.databasePicturelibrary', icon: '🖼️', path: '/database/picturelibrary' },
      { label: '品牌库', labelKey: 'pages.brandLibrary', icon: '🏷️', path: '/brandLibrary' },
      { label: '敏感词库', labelKey: 'pages.databaseSensitiveThesaurus', icon: '🚫', path: '/database/sensitiveThesaurus' },
      { label: '标签管理', labelKey: 'pages.databaseTagManage', icon: '🏷️', path: '/database/tagManage' },
    ],
  },
  {
    label: '管理设置',
    labelKey: 'navGroups.settings',
    items: [
      { label: '个人设置', labelKey: 'pages.settingsProfile', icon: '⚙️', path: '/settings/profile' },
      { label: '个人管理', labelKey: 'pages.settingsPersonal', icon: '👤', path: '/settings/personal' },
      { label: '组织管理', labelKey: 'pages.settingsOrganization', icon: '🏢', path: '/settings/organization' },
    ],
  },
]
