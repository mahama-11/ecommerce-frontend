import type { Page, Route } from '@playwright/test'
import { inventoryProductFactory, listingVersionFactory, productFactory } from '../../support/factories'

export const QA_PRODUCT_ID = 'qa-business-product'
export const QA_PRODUCT_SKU = 'QA-BIZ-001'

const devSession = {
  access_token: 'dev-business-token',
  user: { full_name: 'Business QA User', email: 'business-qa@agent-ecommerce.local', org_name: 'Local QA', org_role: 'admin' },
  access: { product_roles: ['admin', 'ecommerce.workspace_admin'] },
}

type RawProduct = Record<string, unknown>

function baseProduct(overrides: Partial<RawProduct> = {}): RawProduct {
  return {
    ...productFactory({
      id: QA_PRODUCT_ID,
      product_id: QA_PRODUCT_ID,
      title: 'Business QA SKU',
      sku_code: QA_PRODUCT_SKU,
      skuCode: QA_PRODUCT_SKU,
    }),
    category_id: 'qa-category',
    brand_id: 'qa-brand',
    cost_currency: 'USD',
    assets_count: 1,
    listing_versions_count: 2,
    has_primary_asset: true,
    tags: ['QA', 'business-interaction'],
    ...overrides,
  }
}

const listingVersions = [
  { ...listingVersionFactory({ id: 'listing-v1', version_no: 1, version_label: 'QA draft', status: 'draft', title: 'QA listing draft', description: 'Business QA listing draft' }), bullet_points: ['durable', 'portable'], keywords: ['qa'] },
  { ...listingVersionFactory({ id: 'listing-v2', version_no: 2, version_label: 'QA adopted', status: 'adopted', title: 'QA listing adopted', description: 'Business QA listing adopted' }), bullet_points: ['accepted'], keywords: ['qa'] },
]

const qaAsset = {
  relation: { id: 'asset-relation-1', asset_id: 'asset-1', relation_type: 'source', asset_role: 'hero', is_primary: true, owner_id: QA_PRODUCT_ID, owner_type: 'product', created_at: new Date().toISOString() },
  asset: { id: 'asset-1', asset_type: 'image', mime_type: 'image/png', file_name: 'qa-product.png', thumbnail_url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="%230891b2"/></svg>', original_url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="%230891b2"/></svg>', created_at: new Date().toISOString() },
}

function productDetail(product: RawProduct) {
  return {
    product,
    assets: [qaAsset],
    listing_versions: listingVersions,
    profit_snapshots: [],
    export_tasks: [{ id: 'export-task-1', product_id: product.id, status: 'succeeded', platform: 'amazon', site: 'US', locale: 'en_US', format: 'csv', asset_count: 1, created_at: new Date().toISOString() }],
    activities: [],
    parsed_info: {
      status: 'succeeded',
      confidence: 0.92,
      parser_version: 'v1.2.0',
      category_guess: 'Electronics',
      platform_fit: ['amazon', 'shopee'],
      visual_features: { material: 'metal', style: 'minimal', color: 'silver' },
      usage_scenarios: ['Home office', 'Travel'],
      source_asset_ids: ['asset-1'],
      created_at: new Date().toISOString(),
    },
    prompts: [
      { id: 'prompt-qa-1', version_no: 1, status: 'ready', generation_type: 'image', module: 'hero', content: '电商主图：保留当前商品主体，使用参考图的干净光线和构图，突出材质与产品轮廓。', schema_json: {}, source_map_json: {}, template_ids: ['tpl-qa-1'], created_at: new Date().toISOString() },
    ],
  }
}

const sourceReferences = [
  { id: 'source-sku-1', source_kind: 'product_asset', source_ref: 'asset-1', asset_id: 'asset-1', asset_relation_id: 'asset-relation-1', status: 'ready', metadata: { source_role: 'sku' }, created_at: new Date().toISOString() },
  { id: 'source-ref-1', source_kind: 'url', source_ref: 'reference', status: 'ready', metadata: { source_role: 'reference' }, created_at: new Date().toISOString() },
]

const generationVersion = {
  id: 'gen-v1', version_id: 'gen-v1', version: 'v1', label: 'QA 生成轮次', prompt_id: 'prompt-qa', runtime_job_id: 'runtime-gen-v1', status: 'completed', stage: 'completed', progress: 100, selected_result_asset_id: 'asset-generated-1', is_current: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  result_assets: [{ id: 'result-asset-1', asset_id: 'asset-generated-1', asset_content_url: '/api/v1/ecommerce/assets/asset-generated-1/content', thumbnail_url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="%2314b8a6"/><text x="20" y="64" fill="white">QA</text></svg>', metadata: { template_name: 'QA hero', source_name: 'QA SKU', generation_group_id: 'prompt:prompt-qa', width: 1024, height: 1024 } }],
  metadata: { user_visible_round: 'QA 生成轮次', config: { skuBias: 72, styleStrength: 0.64, identityConsistency: 0.82, creativeFreedom: 0.36 } },
}

function stageView() {
  return {
    id: 'session-qa-1',
    session_id: 'session-qa-1',
    product_id: QA_PRODUCT_ID,
    sku_code: QA_PRODUCT_SKU,
    status: 'ready',
    current_stage: 'prompt',
    source_references: sourceReferences,
    deconstruction_elements: [
      { id: 'choice-1', label: '商品主体', value: { value: '保留当前商品主体' }, selected: true, decision: 'keep', confidence: 0.92, group_path: ['fixed_question', 'sku_subject'] },
      { id: 'choice-2', label: '商品背景', value: { value: '使用干净背景' }, selected: true, decision: 'replace', confidence: 0.9, group_path: ['fixed_question', 'sku_background'] },
      { id: 'choice-3', label: '参考主体', value: { value: '参考构图' }, selected: true, decision: 'keep', confidence: 0.88, group_path: ['fixed_question', 'reference_subject'] },
      { id: 'choice-4', label: '参考背景', value: { value: '参考氛围' }, selected: true, decision: 'keep', confidence: 0.86, group_path: ['fixed_question', 'reference_background'] },
    ],
    prompt_plan: {
      id: 'prompt-plan-qa', prompt_id: 'prompt-qa', status: 'ready', source: 'llm_prompt_planner',
      variables: { composed_prompt_text: '电商主图：保留当前商品主体，使用参考图的干净光线和构图，突出材质与产品轮廓。', keywords: ['电商主图', '干净光线'] },
      metadata: { source: 'llm_prompt_planner', prompt_diff: { added: ['突出材质'], removed: [], changed: ['背景更简洁'] } },
      diff: { added: ['突出材质'], removed: [], changed: ['背景更简洁'] }, blockers: [],
    },
    intent_spec: {
      schema_version: 'v1',
      product_id: QA_PRODUCT_ID,
      selections: [
        { element_id: 'fixed:sku_product', element_type: 'product_fact', element_key: 'sku_product', decision: 'keep', label: '要，保留 SKU 产品主体', value: { description: '保留当前商品主体' }, metadata: { fixed_prompt_question: true, prompt_slot: 'sku_product', source_role: 'sku' } },
        { element_id: 'fixed:sku_background', element_type: 'background', element_key: 'sku_background', decision: 'drop', label: '不要，改换 SKU 背景', value: { description: '使用干净背景' }, metadata: { fixed_prompt_question: true, prompt_slot: 'sku_background', source_role: 'sku' } },
        { element_id: 'fixed:reference_product', element_type: 'product_fact', element_key: 'reference_product', decision: 'keep', label: '要，参考产品元素进入画面', value: { description: '参考图构图' }, metadata: { fixed_prompt_question: true, prompt_slot: 'reference_product', source_role: 'reference' } },
        { element_id: 'fixed:reference_background', element_type: 'background', element_key: 'reference_background', decision: 'keep', label: '要，采用参考背景场景', value: { description: '参考氛围' }, metadata: { fixed_prompt_question: true, prompt_slot: 'reference_background', source_role: 'reference' } },
      ],
      requirements: { type: 'scene_generation' },
    },
    generation_versions: [generationVersion],
  }
}

function downloadRecord(product: RawProduct) {
  return {
    id: 'download-qa-1', status: 'succeeded', downloadable: true, product_id: product.id, product_title: product.title, product_sku: product.sku_code, product_path: `/products/${product.id}`,
    platform: 'amazon', site: 'US', locale: 'en_US', format: 'csv', asset_count: 1, primary_asset_role: 'hero', listing_version_label: 'QA adopted', download_file_name: 'qa-export.csv', package_url: '/api/v1/ecommerce/exports/download-qa-1/download', file_size: '1 KB', assets: [{ relation_id: 'asset-relation-1', asset_id: 'asset-1', asset_role: 'hero', is_primary: true, file_name: 'qa-product.png' }], created_at: new Date().toISOString(),
  }
}

function envelope(data: unknown, code = 0, message = 'ok') {
  return { code, message, data }
}

async function fulfill(route: Route, data: unknown, status = 200) {
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(envelope(data, status === 200 ? 0 : status, status === 200 ? 'ok' : 'error')) })
}

export async function installBusinessRuntimeMocks(page: Page) {
  const products: RawProduct[] = [baseProduct()]
  const generationVersions = [generationVersion]
  await page.addInitScript(session => {
    window.localStorage.setItem('ecommerce_access_token', session.access_token)
    window.localStorage.setItem('ecommerce_session', JSON.stringify(session))
  }, devSession)

  await page.route('**/api/v1/ecommerce/**', async (route: Route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname
    const method = request.method()

    if (path.includes('/auth/session') || path.includes('/auth/me')) return fulfill(route, { user: devSession.user, credits: { balance: 999 }, access: devSession.access })
    if (path.includes('/auth/login')) {
      const body = JSON.parse(request.postData() || '{}') as Record<string, unknown>
      if (body.email === 'bad@example.com') {
        return fulfill(route, { error: 'Invalid email or password' }, 401)
      }
      return fulfill(route, devSession)
    }

    if (path.includes('/template-center/catalog/recommendations') && method === 'GET') {
      return fulfill(route, [
        { id: 'tpl-qa-rec-1', slug: 'qa-rec-hero', name: 'QA Rec Hero', summary: 'Recommended QA template', modality: 'image', executorType: 'image_tool', series: 'qa', capabilityType: 'image_generation', interactionMode: 'single', platformTags: ['amazon'], industryTags: ['qa'], scenarioTags: ['hero'], isFeatured: true, recommendScore: 0.95, isFavorited: false, favoriteCount: 0, useCount: 1, successRateHint: 0.9 },
      ])
    }
    if (path.includes('/template-center/catalog/facets') && method === 'GET') {
      return fulfill(route, { platforms: [{ key: 'amazon', label: 'Amazon', count: 1 }], modalities: [{ key: 'image', label: 'Image', count: 1 }], series: [{ key: 'qa', label: 'QA', count: 1 }], capabilities: [{ key: 'image_generation', label: 'Image Generation', count: 1 }] })
    }
    if (path.includes('/template-center/catalog') && method === 'GET') {
      return fulfill(route, [
        { id: 'tpl-qa-1', slug: 'qa-hero', name: 'QA Hero Template', summary: 'Business QA hero template', modality: 'image', executorType: 'image_tool', series: 'qa', capabilityType: 'image_generation', interactionMode: 'single', platformTags: ['amazon'], industryTags: ['qa'], scenarioTags: ['hero'], isFeatured: true, recommendScore: 0.95, isFavorited: false, favoriteCount: 0, useCount: 1, successRateHint: 0.9 },
      ])
    }
    if (path.includes('/template-center/favorites') && method === 'GET') {
      return fulfill(route, [])
    }
    if (path.includes('/template-center/catalog/') && path.endsWith('/use') && method === 'POST') {
      return fulfill(route, { targetRoute: '/products/workbench/visual-tools', executorType: 'image_tool', prefilledInputSchema: {}, preloadedTemplatePayload: {}, supportsAsyncJob: true, supportsBatch: false })
    }
    if (path.includes('/commercial/offerings') && method === 'GET') {
      return fulfill(route, {
        product_code: 'ecommerce',
        offerings: {
          product: { id: 'product-ecommerce', code: 'ecommerce', name: 'Agent Ecommerce', status: 'active' },
          skus: [
            { id: 'sku-starter', product_id: 'product-ecommerce', code: 'starter', name: 'Starter', sku_type: 'subscription', billing_mode: 'prepaid', currency: 'CNY', list_price: 990, status: 'active', metadata: JSON.stringify({ package_code: 'ecommerce.basic.monthly' }) },
            { id: 'sku-pro', product_id: 'product-ecommerce', code: 'pro', name: 'Pro', sku_type: 'subscription', billing_mode: 'prepaid', currency: 'CNY', list_price: 2990, status: 'active', metadata: JSON.stringify({ package_code: 'ecommerce.pro.monthly' }) },
          ],
          packages: [
            { id: 'pkg-basic', product_id: 'product-ecommerce', code: 'ecommerce.basic.monthly', name: 'Starter', package_type: 'subscription', status: 'active', metadata: JSON.stringify({ sku_code: 'starter' }) },
            { id: 'pkg-pro', product_id: 'product-ecommerce', code: 'ecommerce.pro.monthly', name: 'Pro', package_type: 'subscription', status: 'active', metadata: JSON.stringify({ sku_code: 'pro' }) },
          ],
          rate_cards: [
            { id: 'rate-basic', product_id: 'product-ecommerce', code: 'rate-basic', target_type: 'sku', target_id: 'sku-starter', price_model: 'one_time', currency: 'CNY', price_config: JSON.stringify({ unit_amount: 990 }), version: 1, status: 'active', metadata: JSON.stringify({ package_code: 'ecommerce.basic.monthly' }) },
            { id: 'rate-pro', product_id: 'product-ecommerce', code: 'rate-pro', target_type: 'sku', target_id: 'sku-pro', price_model: 'one_time', currency: 'CNY', price_config: JSON.stringify({ unit_amount: 2990 }), version: 1, status: 'active', metadata: JSON.stringify({ package_code: 'ecommerce.pro.monthly' }) },
          ],
          asset_definitions: [],
          allowance_policies: [],
        },
        wallet_summary: null,
      })
    }
    if (path.includes('/wallet/summary') && method === 'GET') {
      return fulfill(route, {
        billing_subject_type: 'organization',
        billing_subject_id: 'org-qa',
        product_code: 'ecommerce',
        total_balance: 100,
        permanent_balance: 70,
        reward_balance: 20,
        allowance_balance: 10,
        primary_asset_code: 'ECOMMERCE_CASH',
        assets: [
          { asset_code: 'ECOMMERCE_CASH', asset_type: 'cash', lifecycle_type: 'permanent', account_balance: 100, available_balance: 100, expiring_balance: 0 },
        ],
        quota: { billable_item_code: 'ecommerce.image_generation', granted: 1000, consumed: 1, reserved: 0, remaining: 999 },
      })
    }
    if (path.includes('/wallet/history') && method === 'GET') {
      return fulfill(route, { items: [{ id: 'wallet-history-qa-1', category: 'charge', title: 'QA generation charge', direction: 'debit', amount: 1, asset_code: 'ECOMMERCE_CASH', currency: 'USD', status: 'settled', occurred_at: new Date().toISOString(), reference_type: 'image_job', reference_id: 'image-job-qa-1' }] })
    }
    if (path.includes('/billing/summary') && method === 'GET') {
      return fulfill(route, { charge_count: 1, settled_count: 1, refunded_count: 0, total_net_amount: 1, total_wallet_debited: 1, total_credits_consumed: 1, channel_pending_count: 0, channel_failed_count: 0 })
    }
    if (path.includes('/billing/charges') && method === 'GET') {
      return fulfill(route, [{ id: 'charge-qa-1', product_code: 'ecommerce', organization_id: 'org-qa', user_id: 'user-qa', event_id: 'event-qa-1', business_type: 'image_generation', gross_amount: 1, discount_amount: 0, net_amount: 1, quota_consumed: 1, credits_consumed: 1, wallet_asset_code: 'ECOMMERCE_CASH', wallet_debited: 1, billing_amount: 1, reward_amount: 0, commission_amount: 0, status: 'settled', occurred_at: new Date().toISOString(), channel_status: 'settled' }])
    }
    if (path.includes('/commercial/orders/') && path.endsWith('/confirm-payment') && method === 'POST') {
      return fulfill(route, { order: { id: 'order-qa-created', user_id: 'user-qa', organization_id: 'org-qa', product_code: 'ecommerce', sku_code: 'starter', package_code: 'starter', package_type: 'subscription', currency: 'USD', quantity: 1, unit_amount: 9.99, total_amount: 9.99, status: 'paid', payment_status: 'paid', fulfillment_status: 'fulfilled', created_at: new Date().toISOString(), updated_at: new Date().toISOString() } })
    }
    if (path.includes('/commercial/orders') && method === 'POST') {
      return fulfill(route, { order: { id: 'order-qa-created', user_id: 'user-qa', organization_id: 'org-qa', product_code: 'ecommerce', sku_code: 'starter', package_code: 'starter', package_type: 'subscription', currency: 'USD', quantity: 1, unit_amount: 9.99, total_amount: 9.99, status: 'pending', payment_status: 'pending', fulfillment_status: 'pending', created_at: new Date().toISOString(), updated_at: new Date().toISOString() } })
    }
    if (path.includes('/commercial/orders') && method === 'GET') {
      return fulfill(route, { items: [{ order: { id: 'order-qa-1', user_id: 'user-qa', organization_id: 'org-qa', product_code: 'ecommerce', sku_code: 'starter', package_code: 'starter', package_type: 'subscription', currency: 'USD', quantity: 1, unit_amount: 9.99, total_amount: 9.99, status: 'paid', payment_status: 'paid', fulfillment_status: 'fulfilled', created_at: new Date().toISOString(), updated_at: new Date().toISOString() } }] })
    }

    if (path.includes('/workflow/events') && method === 'GET') {
      return fulfill(route, [
        { id: 'event-qa-1', module: 'chat', title: { zh: 'QA 工作流事件', en: 'QA workflow event' }, detail: { zh: '用于业务测试的回流记录', en: 'Workflow record for business QA' }, createdAt: new Date().toISOString() },
      ])
    }
    if (path.includes('/workflow/events') && method === 'POST') {
      const event = JSON.parse(request.postData() || '{}')
      return fulfill(route, [event])
    }
    if (path.includes('/templates/saved') && method === 'GET') return fulfill(route, [])
    if (path.includes('/templates/saved') && ['POST', 'PUT', 'DELETE'].includes(method)) return fulfill(route, [])
    if (path.includes('/assets/linked-designs') && method === 'GET') return fulfill(route, [])
    if (path.includes('/assets/linked-designs') && method === 'POST') return fulfill(route, [JSON.parse(request.postData() || '{}')])
    if (path.includes('/deliveries/linked') && method === 'GET') return fulfill(route, [])
    if (path.includes('/deliveries/linked') && method === 'POST') return fulfill(route, [JSON.parse(request.postData() || '{}')])
    if (path.includes('/workflow/template-bridges') && method === 'GET') return fulfill(route, [])
    if (path.includes('/workflow/template-bridges') && method === 'POST') return fulfill(route, [JSON.parse(request.postData() || '{}')])

    if (path.endsWith('/downloads') && method === 'GET') return fulfill(route, products.map(downloadRecord))
    if (path.includes('/downloads/') && path.endsWith('/content')) return route.fulfill({ status: 200, contentType: 'text/csv', headers: { 'Content-Disposition': 'attachment; filename="qa-export.csv"' }, body: 'sku,title\nQA-BIZ-001,Business QA SKU\n' })
    if (path.includes('/exports/') && path.endsWith('/download')) return route.fulfill({ status: 200, contentType: 'text/csv', headers: { 'Content-Disposition': 'attachment; filename="qa-export.csv"' }, body: 'sku,title\nQA-BIZ-001,Business QA SKU\n' })
    if (path.endsWith('/export-packages') && method === 'POST') return fulfill(route, { id: 'export-package-generated-1', status: 'succeeded', platform: 'ecommerce', site: 'download-center', locale: 'zh-CN', format: 'zip' })
    if (path.endsWith('/export-tasks') && method === 'POST') return fulfill(route, { id: 'export-task-created', status: 'succeeded' })

    if (path.includes('/v2/visual-workflows/sessions') && method === 'GET') return fulfill(route, { items: [{ id: 'session-qa-1', product_id: QA_PRODUCT_ID, sku_code: QA_PRODUCT_SKU, current_stage: 'prompt', status: 'ready', template_id: 'qa-template' }] })
    if (path.includes('/v2/visual-workflows/') && path.endsWith('/stage-view')) return fulfill(route, stageView())
    if (path.includes('/v2/visual-workflows/') && path.endsWith('/generation-versions') && method === 'GET') return fulfill(route, { items: generationVersions })
    if (path.includes('/v2/visual-workflows/') && path.endsWith('/generation-versions') && method === 'POST') {
      const next = generationVersions.length + 1
      const created = { ...generationVersion, id: `gen-v${next}`, version_id: `gen-v${next}`, prompt_id: `prompt-qa-${next}`, runtime_job_id: `runtime-gen-v${next}`, status: 'completed', stage: 'completed', progress: 100, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), metadata: { ...generationVersion.metadata, source: 'workshop_regenerate' } }
      generationVersions.push(created)
      return fulfill(route, created)
    }
    if (path.includes('/v2/visual-workflows/') && path.endsWith('/prompt-planner-jobs') && method === 'POST') return fulfill(route, { runtime_job_id: 'job-qa', status: 'queued' })
    if (path.includes('/v2/visual-workflows/') && path.endsWith('/generation-version-fanouts') && method === 'POST') {
      const payload = route.request().postDataJSON() as { template_slots?: Array<Record<string, unknown>> } | null
      const slots = payload?.template_slots?.length ? payload.template_slots : [{ template_id: 'tpl-qa-1', scene_tag: 'hero', detail_requirement: 'QA hero result' }]
      const items = slots.map((slot, index) => {
        const version = { ...generationVersion, id: `gen-fanout-${index + 1}`, version_id: `gen-fanout-${index + 1}`, prompt_id: `prompt-fanout-${index + 1}`, runtime_job_id: `runtime-fanout-${index + 1}` }
        generationVersions.push(version)
        return { fanout_task_id: `task-qa-${index + 1}`, source_asset_id: String(slot.source_asset_id ?? 'asset-1'), template_id: String(slot.template_id ?? 'tpl-qa-1'), slot_index: Number(slot.slot_index ?? index), scene_tag: String(slot.scene_tag ?? 'hero'), detail_requirement: String(slot.detail_requirement ?? 'QA hero result'), generation_version: version }
      })
      return fulfill(route, {
        fanout_id: 'batch-qa',
        batch_id: 'batch-qa',
        items,
        tasks: items.map(item => ({ id: item.fanout_task_id, status: 'succeeded', progress: 100, scene_tag: item.scene_tag, template_name: 'QA hero', result_asset_count: item.generation_version.result_assets?.length ?? 1 })),
      })
    }
    const generationVersionAction = path.match(/\/v2\/visual-workflows\/([^/]+)\/generation-versions\/([^/]+)\/(select|writeback-selected-asset|save-as-template)$/)
    if (generationVersionAction && method === 'POST') {
      const [, , versionId, action] = generationVersionAction
      if (action === 'select') return fulfill(route, { version_id: versionId, selected_result_asset_id: 'asset-generated-1', status: 'completed' })
      if (action === 'writeback-selected-asset') return fulfill(route, { asset_relation: { id: 'asset-relation-generated-1', asset_id: 'asset-generated-1' } })
      if (action === 'save-as-template') return fulfill(route, { template: { id: 'template-generated-1' }, saved_templates: [{ id: 'template-generated-1' }] })
    }
    if (path.includes('/v2/visual-workflows/') && method === 'PATCH') return fulfill(route, { id: 'session-qa-1', product_id: QA_PRODUCT_ID, sku_code: QA_PRODUCT_SKU, current_stage: 'prompt', status: 'ready' })
    if (path.includes('/v2/visual-workflows/') && method === 'GET') return fulfill(route, { id: 'session-qa-1', product_id: QA_PRODUCT_ID, sku_code: QA_PRODUCT_SKU, current_stage: 'prompt', status: 'ready' })
    if (path.includes('/source-references') && method === 'POST') return fulfill(route, sourceReferences[0])
    if (path.includes('/deconstruction-jobs') && method === 'POST') return fulfill(route, { id: 'deconstruct-qa', status: 'completed' })
    if (path.includes('/deconstruction-elements/') && method === 'PATCH') return fulfill(route, { ok: true })

    if (path.endsWith('/assets/source') && method === 'POST') return fulfill(route, { id: 'asset-upload-qa', mime_type: 'image/png', file_name: 'qa-upload.png' })
    if (path.includes('/assets/') && path.endsWith('/content')) return route.fulfill({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#0891b2"/></svg>' })

    if (path.endsWith('/image-jobs') && method === 'GET') {
      return fulfill(route, [
        { job_id: 'image-job-qa-1', organization_id: 'org-qa', user_id: 'user-qa', scene_type: 'scene', input_mode: 'text_to_image', source_asset_id: '', runtime_job_id: 'runtime-image-qa-1', status: 'succeeded', stage: 'completed', stage_message: 'completed', progress: 100, selected_result_asset_id: 'asset-generated-1' },
      ])
    }
    if (path.endsWith('/image-jobs') && method === 'POST') {
      return fulfill(route, { job_id: 'image-job-created-1', organization_id: 'org-qa', user_id: 'user-qa', scene_type: 'scene', input_mode: 'text_to_image', source_asset_id: '', runtime_job_id: 'runtime-image-created-1', status: 'succeeded', stage: 'completed', stage_message: 'completed', progress: 100, selected_result_asset_id: 'asset-generated-1' })
    }
    if (path.includes('/image-jobs/') && path.endsWith('/cancel') && method === 'POST') {
      return fulfill(route, { job_id: 'image-job-created-1', organization_id: 'org-qa', user_id: 'user-qa', scene_type: 'scene', input_mode: 'text_to_image', source_asset_id: '', runtime_job_id: 'runtime-image-created-1', status: 'canceled', stage: 'canceled', stage_message: 'canceled', progress: 0 })
    }
    if (path.includes('/image-jobs/') && method === 'GET') {
      return fulfill(route, { job_id: 'image-job-created-1', organization_id: 'org-qa', user_id: 'user-qa', scene_type: 'scene', input_mode: 'text_to_image', source_asset_id: '', runtime_job_id: 'runtime-image-created-1', status: 'succeeded', stage: 'completed', stage_message: 'completed', progress: 100, selected_result_asset_id: 'asset-generated-1' })
    }

    // Inventory product list must be matched before the generic /products POST create route.
    if (path.includes('/inventory/products') && method === 'POST') {
      return fulfill(route, {
        items: [
          inventoryProductFactory({ id: 'inv-1', sku: 'INV-SKU-001', title: 'QA Inventory Product' }),
        ],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      })
    }

    if (path.endsWith('/products') && method === 'GET') return fulfill(route, products)
    if (path.endsWith('/products') && method === 'POST') {
      const body = JSON.parse(request.postData() || '{}') as Record<string, unknown>
      const created = baseProduct({ id: 'qa-created-product', product_id: 'qa-created-product', sku_code: body.sku_code || 'QA-CREATED', skuCode: body.sku_code || 'QA-CREATED', title: body.title || 'Created QA SKU' })
      products.unshift(created)
      return fulfill(route, created)
    }
    const productAssetMatch = path.match(/\/products\/([^/]+)\/assets$/)
    if (productAssetMatch && method === 'POST') return fulfill(route, { id: 'asset-relation-created' })
    const productMatch = path.match(/\/products\/([^/]+)$/)
    if (productMatch && method === 'GET') {
      const product = products.find(item => String(item.id) === productMatch[1]) ?? products[0]
      return fulfill(route, productDetail(product))
    }
    if (productMatch && method === 'PATCH') {
      const product = products.find(item => String(item.id) === productMatch[1]) ?? products[0]
      Object.assign(product, JSON.parse(request.postData() || '{}'))
      return fulfill(route, product)
    }
    if (path.includes('/adopt') && method === 'POST') return fulfill(route, { ok: true })
    if (path.includes('/listing-versions') && method === 'POST') return fulfill(route, { ...listingVersions[0], id: 'listing-created', status: 'draft' })

    // ─── Inventory mocks ─────────────────────────────────────────
    if (path.includes('/inventory/stats') && method === 'GET') {
      return fulfill(route, { totalQuantity: 1234, totalQuantityTrend: 5.2, skuCount: 56, skuCountNew: 3, lowStockCount: 4, lowStockTrend: 'warning', stockDays: 28, stockDaysChange: -2, inTransitCount: 12, outboundOrders: 8, pendingInbound: 5 })
    }
    if (path.includes('/inventory/alerts') && method === 'GET') {
      return fulfill(route, [
        { id: 'alert-qa-1', sku: 'INV-SKU-001', title: 'QA Inventory Product', alertLevel: 'warning', message: '库存低于安全库存，建议补货', currentStock: 12, suggestedAction: '补货 30 件', read: false, createdAt: new Date().toISOString() },
        { id: 'alert-qa-2', sku: 'INV-SKU-002', title: 'QA Backup Product', alertLevel: 'info', message: '库存健康', currentStock: 120, suggestedAction: '继续观察', read: true, createdAt: new Date().toISOString() },
      ])
    }
    if (path.includes('/inventory/alerts/') && path.endsWith('/read') && method === 'PATCH') {
      return fulfill(route, { ok: true })
    }
    if (path.includes('/inventory/inbound') && method === 'GET') {
      return fulfill(route, [])
    }
    if (path.includes('/inventory/sales') && method === 'GET') {
      return fulfill(route, { period: '30d', totalSales: 100, totalRevenue: 5000, totalOrders: 50, avgOrderValue: 100, returnRate: 1.5, topSku: 'INV-SKU-001', topSkuSales: 100, dataPoints: [] })
    }
    if (path.includes('/inventory/settings') && method === 'GET') {
      return fulfill(route, { defaultSafeStockDays: 14, defaultReplenishFactor: 1.0, defaultLeadDays: 7, alertEnabled: true, alertEmail: 'qa@example.com', currency: 'USD', autoRefreshInterval: 30 })
    }
    if (path.includes('/inventory/replenishment') && method === 'GET') {
      return fulfill(route, [])
    }
    if (path.includes('/inventory/replenishment/calculate') && method === 'POST') {
      return fulfill(route, { id: 'calc-qa-1', uploadedAt: new Date().toISOString(), safeStockDays: 14, replenishFactor: 1.0, analysisPeriod: '30d', rows: [{ sku: 'INV-SKU-001', title: 'QA Inventory Product', currentStock: 42, inTransit: 10, availableStock: 35, sales7d: 14, sales30d: 70, avgDailySales: 2.3, stockDays: 18, safeStockDays: 14, replenishFactor: 1.0, suggestedQty: 20, leadDays: 7 }], totalSuggested: 20, totalCost: 240, estimatedFreight: 10 })
    }

    return fulfill(route, {})
  })
}
