# Agent Ecommerce 前端质量保障提升方案 v1.0

> Status: ACTIVE
> Owner: ecommerce-frontend
> Scope: 测试覆盖度提升 + 软性质量问题发现与治理
> Last updated: 2026-06-07

---

## 1. 当前基线

### 1.1 测试现状

| 维度 | 数量 | 状态 |
|------|------|------|
| E2E Business | 17 spec 文件，34 cases，**20/20 通过** | ✅ 通过 |
| E2E Smoke | 3 cases，mock 渲染检查 | ✅ 通过 |
| E2E Visual | 3 viewport 截图对比 | ⚠️ 基线未维护 |
| Governance Test | 12 `.test.mjs`，905 行 | ✅ 通过 |
| **Unit/Component Test** | **0** | ❌ 缺失 |
| **Integration/Contract** | **0**（harness mock 替代） | ❌ 缺失 |
| 页面覆盖率 | 21/56 = 37.5% | ⚠️ 偏低 |
| Service 函数 | 122 个，0 单测 | ❌ 缺失 |
| data-testid | 54 个定义，94 处使用 | ⚠️ 不足 |
| **Mock 漂移风险** | harness.ts 245 行，手工维护 | 🔴 高风险 |
| **Flaky test** | 并发模式 19/20 失败，串行通过 | 🔴 竞态严重 |

### 1.2 已覆盖业务域

- ✅ Auth（登录态、未认证拦截、错误提示）
- ✅ Product Center（CRUD、编辑持久化、AI Pipeline、导出下载）
- ✅ Listing（创建、编辑、采纳版本）
- ✅ Production（Prep→Sandbox→Workshop 三阶段、定稿回流）
- ✅ Template Center（目录渲染、Use Now 路由）
- ✅ Visual Tools（SKU 级视觉工作空间入口）
- ✅ Inventory（Dashboard + 6 个子路由加载）
- ✅ Commercial（套餐展示、钱包摘要）
- ✅ Downloads（下载记录、认证下载）
- ✅ Negative（API 失败降级、认证失败处理）

### 1.3 未覆盖业务域

| 业务域 | 页面 | 风险 | 建议优先级 |
|--------|------|------|-----------|
| Chat Workspace AI 对话 | `ChatWorkspacePage` | 🔴 P0 | **Phase 2 首批** |
| Design Workbench 设计工作台 | `DesignWorkbenchPage` | 🔴 P0 | **Phase 2 首批** |
| Ops Workbench 运营工作台 | `OpsWorkbenchPage` | 🔴 P0 | Phase 2 第二批 |
| Tool Page 工具页 | `ToolPage.tsx` + 10 组件 | 🔴 P0 | Phase 2 第二批 |
| Account 个人中心 | Profile/Assets/Templates/History/Promotion/Commission | 🟡 P1 | Phase 3 |
| Asset Commerce 资产库 | `AssetCommercePage` | 🟡 P1 | Phase 3 |
| Org 组织管理 | `OrgOverviewPage` | 🟡 P1 | Phase 3 |
| Portal 门户页面 | Home/Pricing/Solutions/Blog/Help/About/Contact/Careers | 🟢 P2 | 按需补充 |

### 1.4 已知技术债务（2026-06-07 修复）

| 文件 | 问题 | 修复方式 |
|------|------|---------|
| `InventoryDashboardPage.tsx` | `products`/`totalProducts` undefined 崩溃 | 加 `safeProducts`/`safeTotalProducts` 防御 |
| `InventoryProductManagePage.tsx` | `products.filter` 非数组崩溃 | 加 `safeProducts` 防御 |
| `InventoryAlertsPage.tsx` | `alerts.filter` 非数组崩溃 | 加 `safeAlerts` 防御 |
| `InventoryAnalysisPage.tsx` | `salesAnalysis.toLocaleString` undefined 崩溃 | 加 `safeSalesAnalysis` 可选链防御 |
| `InventoryInboundPage.tsx` | `inboundRecords.filter` 非数组崩溃 | 加 `safeInboundRecords` 防御 |
| `harness.ts` | inventory 相关 API 无 mock | 补全 8 个 inventory mock handler |

---

## 2. 目标状态（3 个月达成）

### 2.0 Real-first 原则

- local/dev/review lane 能走真实 frontend proxy + ecommerce backend 的，优先跑真实契约/真实读写回读；mock 只作为离线回归、第三方付费隔离或罕见错误态构造。
- `npm run qa:business` / `npm run qa:business:mock` 的证据默认是 `local-mock-runtime`，不得声称 live backend/provider/export 闭环。
- `npm run test:contract:real` 是 PR 前置真实契约入口；未配置真实后端时 dashboard 只能 `PASS_WITH_NOTES`。需要强制真实时使用 `ECOMMERCE_QA_REQUIRE_REAL=1 npm run ci:qa-gate`。
- 关键 mutation 升级为 live closure 时，使用 `npm run qa:business:live`，要求 safe dev/review lane、fixture ownership、readback 和 cleanup 证据。

| 维度 | 目标 | 时间 |
|------|------|------|
| **E2E Business** | 页面覆盖率 ≥ 70%（40/56），cases ≥ 50 | **Week 4** |
| **Unit Test** | Utils + Store 核心逻辑 ≥ 60% 覆盖 | Week 6 |
| **Component Test** | 核心交互组件 ≥ 30% 覆盖 | Week 8 |
| **Contract Smoke** | Mock schema 校验 ≥ 20 个 endpoint | Week 6 |
| **CI Gate** | PR 合并前必须过：typecheck + build + e2e-smoke + e2e-business | Week 2 |
| **Governance** | P0 变更必须带 acceptance matrix + RED test | 持续 |

---

## 3. 分阶段实施计划

### Phase 1：基础设施 + E2E 竞态修复（Week 1-2）

#### 3.1.1 E2E 竞态修复（最高优先级）

当前并发模式（默认 workers）下 19/20 测试失败，串行模式全部通过。问题根源：测试间共享 `products` 数组和全局 mock 状态。

**修复方案：**
1. 每个 test 使用独立的 `products` 副本（`structuredClone` 或工厂函数）
2. 或：CI / 本地跑 business 测试时强制 `--workers=1`
3. 在 `playwright.business.config.ts` 中显式配置 `workers: 1` 作为短期方案

```ts
// playwright.business.config.ts
export default defineConfig({
  ...baseConfig,
  workers: 1, // 串行执行，避免竞态
  // 长期：修复状态隔离后恢复并发
})
```

#### 3.1.2 引入 Vitest + React Testing Library（精简范围）

```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

新增 `vitest.config.ts`：

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/unit/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/', '**/*.d.ts', 'src/services/*.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

> **注意**：`coverage.exclude` 排除 `src/services/*.ts`，因为 Service 层以 E2E + Contract 测试为主，单元测试价值有限。

新增 npm scripts：

```json
{
  "test:unit": "vitest run",
  "test:unit:watch": "vitest",
  "test:unit:coverage": "vitest run --coverage"
}
```

#### 3.1.3 目录结构标准化

```
tests/
  e2e/
    business/           # 业务 E2E（已有，20 cases）
    smoke/              # 渲染冒烟（已有）
    visual/             # 视觉回归（已有，基线待维护）
    contract/           # Mock schema 校验（新增）
  unit/
    utils/              # 纯函数工具单测（新增，优先）
    store/              # Store 逻辑单测（新增）
  governance/           # 治理检查（已有）
```

> **调整**：删除 `component/` 目录（押后到 Phase 4），删除 `unit/services/`（Service 以 E2E 覆盖）。

#### 3.1.4 测试数据工厂（Test Data Factory）

新增 `tests/support/factories.ts`：

```ts
export const productFactory = (overrides = {}) => ({
  id: 'test-product-1',
  sku_code: 'TEST-SKU-001',
  title: 'Test Product',
  status: 'ready',
  ...overrides,
})

export const listingVersionFactory = (overrides = {}) => ({
  id: 'test-listing-1',
  version_no: 1,
  version_label: 'v1',
  status: 'draft',
  ...overrides,
})

export const inventoryProductFactory = (overrides = {}) => ({
  id: 'inv-1',
  sku: 'INV-001',
  title: 'Inventory Product',
  platform: 'amazon',
  fbaStock: 100,
  available: 80,
  status: 'in_stock',
  ...overrides,
})
```

#### 3.1.5 Mock 维护策略（新增）

当前 `harness.ts` 245 行，手工维护，漂移风险高。

**短期方案：**
1. 按业务域拆分 mock：`auth.mocks.ts`、`product.mocks.ts`、`inventory.mocks.ts`
2. 每个 mock 文件顶部标注 **"最后同步日期 + 对应后端 API 版本"**
3. PR 修改 mock 时必须同步更新 `docs/api-mock-sync-log.md`

**中期方案：**
- 从 OpenAPI / TypeScript 类型自动生成 mock schema（待 `api:contract` 脚本完善后接入）

---

### Phase 2：E2E 业务扩展（Week 2-5）

#### 3.2.1 新增业务 E2E（覆盖缺口页面，优先 P0）

| 测试文件 | 覆盖页面 | 业务场景 | 预估人天 |
|---------|---------|---------|---------|
| `chat-workspace.business.spec.ts` | `ChatWorkspacePage` | AI 对话、模板调用、历史记录 | 3 |
| `design-workbench.business.spec.ts` | `DesignWorkbenchPage` | 设计工具、素材拖拽、导出 | 3 |
| `tool-page.business.spec.ts` | `ToolPage` + 组件 | 工具选择、参数配置、执行 | 2 |
| `ops-workbench.business.spec.ts` | `OpsWorkbenchPage` | 运营工作台入口、数据面板 | 2 |
| `inventory-replenishment.business.spec.ts` | `InventoryReplenishmentPage` | 补货计算、CSV 上传、结果导出 | 1.5 |
| `inventory-alerts.business.spec.ts` | `InventoryAlertsPage` | 预警列表、标记已读、筛选 | 1 |
| `account-profile.business.spec.ts` | `AccountProfilePage` | 个人资料编辑、头像上传 | 1.5 |

**目标：Phase 2 结束时**
- E2E Business cases：≥ 50（新增 30+）
- 页面覆盖率：≥ 70%（40/56）
- 所有 P0 业务域至少 1 个 business spec

#### 3.2.2 Mock Schema 校验（Contract Test 第一阶段）

**前提**：当前无稳定真实后端环境，Contract Test 先以 "mock schema 校验" 形式存在。

新增 `tests/e2e/contract/` 目录：

```ts
// tests/e2e/contract/product.contract.spec.ts
import { expect, test } from '@playwright/test'
import { productFactory } from '../../support/factories'
import { installBusinessRuntimeMocks } from '../support/harness'

test('product list response matches schema', async ({ page }) => {
  await installBusinessRuntimeMocks(page)
  const response = await page.evaluate(async () => {
    const res = await fetch('/api/v1/ecommerce/products')
    return res.json()
  })

  // 校验响应结构
  expect(response.code).toBe(0)
  expect(Array.isArray(response.data)).toBe(true)
  expect(response.data[0]).toMatchObject({
    id: expect.any(String),
    sku_code: expect.any(String),
    title: expect.any(String),
    status: expect.any(String),
  })
})
```

新增 script：
```json
"test:contract": "playwright test tests/e2e/contract --project=api-contract"
```

> **注意**：真实 API 契约测试（调后端而非 mock）待 `v-contract-smoke` 基础设施就绪后，在 Phase 4 接入。

#### 3.2.3 后端回读验证（Backend Readback）

在关键 mutation E2E 中增加回读断言（已有部分，需补全）：
- create → list refetch ✅（product-core 已有）
- update → detail refetch → reload ✅（product-edit-persistence 已有）
- delete → list 确认消失 ❌（缺失，Phase 2 补充）

---

### Phase 3：单元测试 + CI 门禁（Week 4-6）

#### 3.3.1 Utils + Store 单测（精简范围）

**不做 Service 层单测**（理由：Service 以 E2E 覆盖，单元测试 ROI 低）。

覆盖范围：

| 模块 | 内容 | 测试重点 |
|------|------|---------|
| `src/utils/` | 纯函数（日期、货币、字符串处理） | 边界值、国际化 |
| `src/store/inventoryStore.ts` | 状态转换、筛选逻辑 | 初始状态、加载失败、分页 |
| `src/store/useToastStore.ts` | Toast 队列管理 | 并发添加、自动消失 |

**目标：Phase 3 结束时**
- Utils 单测：≥ 30 个 cases
- Store 单测：≥ 20 个 cases
- 总单元测试覆盖率：≥ 60%（仅 utils + store）

#### 3.3.2 PR 合并门禁（Merge Gate）

```yaml
# .github/workflows/qa-gate.yml（建议配置）
jobs:
  static:
    - typecheck
    - build
    - lint:baseline
    - quality:static
  e2e-smoke:
    - test:e2e
  e2e-business:
    - qa:business
  # unit 和 contract 等 Phase 3/4 有实际内容后再加入
```

> **调整**：Unit 测试和 Contract 测试等 Phase 3/4 有实际内容后再加入 CI 门禁，避免空跑。

---

### Phase 4：组件测试 + 真实契约（Week 6-10）

#### 3.4.1 组件测试（核心交互组件）

覆盖 `ProductionWorkflowComponents.tsx` 中的 `DecisionStepCard`、`VersionLineageItem`、`ResultAssetCard`。

**前提**：需要完善 `jsdom` 的 CSS / Canvas mock，配置成本较高，押后。

#### 3.4.2 真实 API 契约测试

**前提**：`ecommerce-backend` 本地启动流程稳定、`v-contract-smoke` 脚本就绪。

接入方式：
1. 本地启动 backend + database
2. `npm run test:contract:real` 调真实 API
3. 与 mock schema 对比，发现 drift

#### 3.4.3 P0 变更验收矩阵强制检查

在 `acceptance:governance` 中增加：
- P0 文件变更 → 检查 `docs/acceptance/${qaId}.md` 存在
- P0 变更 → 检查 RED test 存在

---

### Phase 5：长期治理机制（Week 8+，持续）

#### 3.5.1 测试债务追踪

新增 `docs/qa-debt.md`，记录未完成的测试缺口。

#### 3.5.2 每周质量站会

固定议程：失败分析、验收矩阵审查、债务 burn-down、覆盖率趋势。

#### 3.5.3 测试先行合规检查

接入 SelfCheck gate：
- frontend-e2e-business-pass
- frontend-e2e-page-coverage ≥ 70%
- frontend-p0-acceptance-matrix-exists
- frontend-unit-coverage ≥ 60%（Week 6 后启用）
- frontend-contract-smoke-pass（Week 10 后启用）

---

## 4. 资源投入估算

| 投入项 | 原估算 | 修订估算 | 调整原因 |
|--------|--------|---------|---------|
| E2E 竞态修复 | — | 1 人天 | 新增，强制串行或修复状态隔离 |
| Mock 拆分 + 维护策略 | — | 1 人天 | 新增，降低漂移风险 |
| Vitest + RTL 基础设施 | 2 人天 | 3 人天 | 含 CSS/i18n mock 配置 |
| Utils + Store 单测 | 7 人天 | 4 人天 | 不做 Service 单测，范围缩小 |
| E2E 扩展（7 个 spec） | 8 人天 | **14 人天** | Chat/Design 工作台 mock 复杂度高 |
| Mock Schema 校验（20 endpoint） | 5 人天 | 3 人天 | 先做 mock 校验，真实契约延后 |
| CI 门禁配置 | 2 人天 | 1 人天 | 初期门禁精简 |
| 治理机制落地 | 3 人天 | 3 人天 | 不变 |
| **总计** | **31 人天** | **~30 人天** | 结构优化，E2E 占比提高 |

> **关键调整**：E2E 扩展从 8 人天增至 14 人天，单元测试从 7 人天降至 4 人天。总体持平，但风险前置（E2E 先跑通）。

---

## 5. 验收标准

| 检查项 | 验收方式 | 启用时间 |
|--------|---------|---------|
| `npm run test:unit:coverage` 覆盖率 ≥ 60%（utils + store） | CI 自动检查 | Week 6 |
| `npm run qa:business` 全部通过 | CI 自动检查 | **Week 2** |
| 页面覆盖率 ≥ 70% | `scripts/ecommerce-quality-dashboard.mjs` | Week 5 |
| P0 变更带 acceptance matrix | `npm run acceptance:governance` | 持续 |
| Mock schema 校验全部通过 | `npm run test:contract` | Week 5 |
| 无 flaky test | 连续 2 周 E2E 100% 通过 | Week 4 |
| 真实 API 契约测试通过 | `npm run test:contract:real` | Week 10+ |

---

## 6. 软性质量问题发现与治理

### 6.1 已发现的软性质量问题

#### 🔴 问题 1：Mock delay 累积导致虚假性能基线

**发现方式**：代码扫描 `src/services/production.ts`

**数据**：
- 32 处 `await delay()` 调用
- 总延迟：25,150ms
- 平均延迟：786ms
- 最大延迟：3,000ms（`createWorkshopGenerationVersion`）
- 分布：200ms×4, 300ms×7, 600ms×3, 1,200ms×4, 1,500ms×2, 2,000ms×1, 2,500ms×1, 3,000ms×1

**影响**：
- dev mode 下用户感知的"性能"是虚假的
- 无法判断真实后端响应时间
- 可能掩盖真实性能问题（如后端 3s+ 响应未优化）

**治理方案**：
1. **短期**：在 delay 调用处加 `console.warn('[DEV-MOCK] Artificial delay:', ms, 'ms')`，提醒开发者这是 mock 延迟
2. **中期**：引入 `performance.mark` 记录真实 API 耗时，与 mock 延迟对比
3. **长期**：dev mode 支持 `?real-api=1` 模式，直接调真实后端，绕过 mock delay

```ts
// 建议修改
export async function ensurePromptPlanReady(...) {
  if (isDevMode()) {
    const delayMs = 1500
    console.warn(`[DEV-MOCK] Artificial delay: ${delayMs}ms for prompt planner`)
    await delay(delayMs)
    return mockPromptPlan()
  }
  // ... 真实逻辑
}
```

---

#### 🔴 问题 2：HTTP 层无请求超时/重试/取消机制

**发现方式**：`src/services/http.ts` 代码审查

**数据**：
- `request()` 函数：无 `timeout`、无 `retry`、无 `AbortSignal` 传递
- `fetch()` 调用：无 `signal` 参数
- 仅 `templateCenter.ts` 使用了 `AbortSignal`（1 处）
- 其他 121 处 `request()` 调用均无取消能力

**影响**：
- 慢请求挂死无反馈，用户看不到 loading 状态
- 组件卸载后请求继续，可能导致内存泄漏或状态更新错误
- 无重试机制，网络抖动直接导致失败

**治理方案**：
1. **短期**：`http.ts` 增加默认 timeout（10s）和 `AbortSignal` 支持

```ts
// 建议修改
export async function request<T>(
  path: string,
  init?: RequestOptions & { signal?: AbortSignal; timeout?: number }
): Promise<T> {
  const { silent, timeout = 10_000, signal, ...requestInit } = init ?? {}

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  // 合并外部 signal
  if (signal) {
    signal.addEventListener('abort', () => controller.abort())
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...requestInit,
      signal: controller.signal,
      headers: buildHeaders(requestInit.headers),
    })
    clearTimeout(timeoutId)
    // ...
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiRequestError('Request timeout', 408)
    }
    throw error
  }
}
```

2. **中期**：在 UI 层统一处理 loading 和超时状态
3. **长期**：引入指数退避重试（exponential backoff）

---

#### 🟡 问题 3：页面 Loading 状态不一致

**发现方式**：`grep -rn "loading\|Loading\|spinner" src/pages/ --include="*.tsx" | wc -l = 163`

**数据**：
- 163 处 loading 相关代码分布在 56 个页面中
- 无统一 Loading 组件/模式
- 部分页面用 `div.animate-spin`，部分用文本"加载中..."

**影响**：
- 用户体验不一致
- 难以全局监控加载性能
- 可能遗漏某些场景的 loading 状态

**治理方案**：
1. **短期**：统一使用 `Skeleton` 组件替代简单 spinner
2. **中期**：在 store 层统一暴露 `loadingKeys` 状态，页面消费
3. **长期**：引入 `react-query` 或 `swr` 管理请求状态和缓存

---

#### 🟡 问题 4：Error Boundary 覆盖不完整

**发现方式**：`grep -rn "ErrorBoundary\|errorElement" src/ --include="*.tsx" | wc -l = 116`

**数据**：
- Router 层级有 `errorElement`
- 但组件层级缺少 `ErrorBoundary`
- `InventoryDashboardPage` 等页面在 API 返回 undefined 时直接崩溃

**影响**：
- 单个组件错误导致整页白屏
- 用户看到 "Unexpected Application Error" 而不是友好提示

**治理方案**：
1. **短期**：给核心页面组件包裹 `ErrorBoundary`
2. **中期**：统一错误降级 UI（如"页面加载失败，请刷新重试"）
3. **长期**：错误上报到 Sentry 或自建监控

---

#### 🟡 问题 5：分页/分段处理不一致

**发现方式**：`grep -rn "pageSize\|limit\|offset" src/services/ --include="*.ts"`

**数据**：
- `inventory.ts`：`pageSize=20`，手动 slice
- `templateCenter.ts`：`limit`/`offset` 传参
- `commercial.ts`：`limit=100`（硬编码）
- `imageRuntime.ts`：`limit` 可选
- 无统一分页模型

**影响**：
- 不同模块分页行为不一致
- 可能加载过多数据导致性能问题
- 前端内存占用不可控

**治理方案**：
1. **短期**：统一分页参数模型 `{ page, pageSize, total, totalPages }`
2. **中期**：虚拟滚动（virtual scroll）处理大数据列表
3. **长期**：服务端分页 + cursor 分页支持

---

#### 🟢 问题 6：Toast 错误提示缺乏上下文

**发现方式**：`src/services/http.ts` 第 86 行

**数据**：
```ts
if (!silent) {
  useToastStore.getState().showToast(errorMsg, 'error')
}
```

- 所有 API 错误统一走 Toast，无错误分类
- 无错误码映射到用户友好文案
- 无错误重试引导

**治理方案**：
1. **短期**：错误分类（网络错误/服务端错误/业务错误）
2. **中期**：根据错误码显示不同文案和 CTA（如"网络不稳定，点击重试"）
3. **长期**：错误日志上报，分析高频错误

---

### 6.2 主流软性质量保障矩阵

软性质量问题可以发现，但需要把 E2E 从“页面能点通”升级为“运行时质量证据采集”。不同问题对应不同发现手段：

| 问题类型 | 可发现方式 | 建议门禁/预算 | 项目落地方式 |
|---------|-----------|--------------|-------------|
| **请求耗时过大** | Playwright 监听 `request/response` + Resource Timing + backend `x-request-id` | P0 页面关键 API P95 < 2s；单请求 > 5s 标红 | `evidence.ts` 记录 API URL、method、status、duration、requestId |
| **响应体过大 / 大 read model** | 记录 `Content-Length` / response body bytes；对 stage/list/detail 接口做 byte budget | 列表接口 < 200KB；轮询接口 < 50KB；页面首屏 API 总量 < 500KB | contract smoke 增加 response-size assertion |
| **无分页 / 前端假分页** | 静态扫描 `.slice(0, N)`、`limit=100`；运行时构造 >pageSize 数据并点下一页 | 列表必须返回 `{items,total,page,pageSize}` 或 cursor；禁止隐藏式截断 | Product/Inventory/List 页加 pagination gate |
| **Loading 缺失或卡死** | E2E 点击后断言 loading/skeleton 在 200ms 内出现，10s 内进入 terminal state | 无“无限 loading”；超时要有用户可操作错误态 | Page Object 增加 `expectLoadingThenSettled()` |
| **跳转异常 / placeholder route** | 点击 CTA 后断言 pathname、页面 identity、无 `:id` / `:productId` 字面量 | 所有主 CTA 必须验证最终路由和目标页标题 | changed-flow E2E 强制 CTA click assertion |
| **重复请求 / N+1** | Playwright network 收集同 endpoint 次数；按页面汇总 waterfall | 同一页面首屏同 endpoint > 3 次报警 | evidence report 增加 duplicate API summary |
| **错误提示缺上下文** | 负例 E2E + Toast 文案断言 | API 错误必须区分网络/权限/业务错误，并给下一步 | negative specs 覆盖 401/403/500/timeout |
| **组件白屏 / ErrorBoundary 缺失** | Console exception 捕获 + `Unexpected Application Error` 文案扫描 | 任何 console error / React Router ErrorBoundary 均 FAIL | 已在 `expectCleanEvidence` 收集 |
| **内部术语泄漏** | DOM 文案扫描 + bundle grep | 用户面禁止 `prompt_id`、`runtime`、`provider`、`contract-needed` 等 | business spec 加 absent assertions |
| **视觉/布局软问题** | screenshot inventory + Lighthouse + 人工 UX review | 关键页面无横向溢出、按钮不遮挡、移动端可滚动 | visual smoke + design review checklist |

> 结论：软性质量不能靠单一测试解决，要靠“预算 + 证据 + 趋势”。一次 E2E 只证明当前可用；质量看板要证明它没有变慢、变大、变乱。

### 6.3 软性质量问题发现机制

| 发现方式 | 适用问题 | 频率 |
|---------|---------|------|
| **代码扫描**（grep/ast） | delay 累积、loading 不一致、分页不一致、placeholder route、前端假分页 | 每次 PR |
| **E2E 运行时观察** | 页面白屏、加载过慢、跳转异常、无限 loading、重复请求 | 每次测试 |
| **Performance.mark / Resource Timing** | 真实 API 耗时、渲染耗时、首屏请求总量 | 持续采集 |
| **Console/Network 监控** | 未处理错误、重复请求、大 payload、慢请求 | E2E evidence 收集 |
| **Contract / Budget Test** | 响应 schema、分页字段、响应大小、接口数量 | 每次 CI / nightly |
| **用户反馈分析** | 体验问题、操作困惑、文案不清、流程反直觉 | 每周 |
| **Lighthouse/Budget** | 性能、可访问性、SEO、资源体积 | 每次 CI / release |

### 6.4 软性质量问题治理流程

```
发现问题
  → 记录到 docs/soft-quality-issues.md（含影响范围、证据、优先级）
  → 评估：是否阻塞当前迭代？
    → 是：立即修复 + 补测试
    → 否：进入技术债务 backlog
  → 修复后：
    → 补单元测试验证修复
    → E2E 覆盖该场景
    → 更新质量看板
```

---

## 7. 附录

### 7.1 修改的文件清单（已修复）

| 文件 | 修改类型 |
|------|---------|
| `tests/e2e/business/listing-edit-adopt.business.spec.ts` | 测试修复 |
| `tests/e2e/business/template-center.business.spec.ts` | 测试修复 |
| `tests/e2e/pages/TemplateCenterPage.ts` | 测试修复 |
| `tests/e2e/business/visual-tools.business.spec.ts` | 测试修复 |
| `tests/e2e/business/production-workshop-finalize.business.spec.ts` | 测试修复 |
| `tests/e2e/support/harness.ts` | Mock 数据修复（补全 inventory 8 个 handler） |
| `tests/e2e/support/evidence.ts` | 工具函数修复 |
| `src/pages/inventory/InventoryDashboardPage.tsx` | 源码防御性修复（safeProducts/safeTotalProducts） |
| `src/pages/inventory/InventoryProductManagePage.tsx` | 源码防御性修复（safeProducts） |
| `src/pages/inventory/InventoryAlertsPage.tsx` | 源码防御性修复（safeAlerts） |
| `src/pages/inventory/InventoryAnalysisPage.tsx` | 源码防御性修复（safeSalesAnalysis/dataPoints） |
| `src/pages/inventory/InventoryInboundPage.tsx` | 源码防御性修复（safeInboundRecords） |
| `tests/e2e/business/product-export-download.business.spec.ts` | 测试修复（window.open 不可拦截，改验证按钮可用） |

### 7.2 参考文档

- `docs/business-interaction-qa-design.md` — 业务交互 QA 设计
- `docs/acceptance-tdd-governance.md` — 验收/TDD 分级治理
- `docs/development-governance-closed-loop.md` — 开发治理闭环
