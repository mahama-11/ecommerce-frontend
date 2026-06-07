# Agent Ecommerce 前端业务交互 QA 设计 v1

Status: ACTIVE
Owner: `ecommerce-frontend`
Scope: Agent Ecommerce 前端真实业务交互、API 契约、浏览器验收、SelfCheck/CI 选择器
Last updated: 2026-06-03

## 1. 目标

把 Agent Ecommerce 前端 QA 从“页面能打开 / build 通过 / mock smoke”升级成“真实业务交互验收链路”。

核心目标：

```text
用户路径可走通
-> 前端状态可信
-> API 调用正确
-> 后端状态可回读
-> 刷新/返回后不丢状态
-> 异常路径不误导
-> 证据可复跑、可归档、可被 SelfCheck 选择
```

本设计基于当前代码实际情况：

- 前端已经包含 `Product Workbench`、`Product Detail`、`V2 Production Prep/Sandbox/Workshop`、`Template Center`、`Image Runtime`、`Downloads`、`Commercial/Account` 等真实/半真实业务入口。
- `src/services/*` 已经存在真实 API service layer，不应继续用 legacy mock bridge 替代关键 mutation。
- 当前 Playwright smoke 仍偏“路由渲染 + dev mock”，不能证明 `create -> list -> detail/read`、`mutation -> refetch`、`generation -> result asset`、`export -> download` 等业务完成。
- Contract governance 里已有部分 future live smoke skeleton，但大多是 `PASS_WITH_NOTES/BLOCKED`，不能当作真实闭环证据。

## 2. 非目标

本文件不是视觉设计稿，也不是一次性测试清单。

非目标：

- 不把所有页面一次性写成大而全 E2E。
- 不用 mock-only 证据声称真实业务完成。
- 不在前端复制 Platform 的 auth/org/wallet/billing/runtime 真相。
- 不把 `prompt_plan`、`runtime`、`provider`、`contract/blocker`、callback/result asset 等内部词暴露到用户界面。

## 3. 当前业务对象与真实入口

### 3.1 核心对象

- 用户/session：`src/services/auth.ts`
- 商品/SKU：`src/services/product.ts` 的 `listProducts/createProduct/getProduct/updateProduct/deleteProduct`
- 商品资产：`listProductAssets/addProductAsset/updateProductAssetRelation/deleteProductAsset`
- Listing 版本：`createListingVersion/batchCreateListingVersions/adoptListingVersion/updateListingVersion/deleteListingVersion`
- Prompt：`getProductParsedInfo/listProductPrompts/generateProductPrompt/createProductPrompt`
- V2 视觉生产 session/stage-view：`src/services/production.ts`
- Image Runtime job：`src/services/imageRuntime.ts`
- Export/Download：`createExportTask/createExportPackage/listDownloads/downloadExport/downloadExportTask`
- Commercial/Wallet/Billing/Promotion/Commission：`src/services/commercial.ts`
- Template Center：`src/services/templateCenter.ts`

### 3.2 核心路由

P0/P1 业务 QA 以这些路由为主：

```text
Auth
  /login
  /register

Product Workbench
  /products
  /products/:id
  /products/workbench/visual-tools
  /products/:productId/ai/:toolSlug
  /products/workbench/downloads

V2 Production Pipeline
  /products/:id/production/prep
  /products/:id/production/sandbox
  /products/:id/production/workshop

Template / Account / Commercial
  /aiChat/template
  /account/billing
  /account/downloads
  /account/promotion
  /account/commission
```

## 4. QA 分层模型

### 4.1 Static gate

用途：防止低级代码、样式、契约漂移进入业务 QA。

当前已有命令：

```bash
npm run frontend:gate
npm run typecheck
npm run build
npm run api:contract
npm run contract:smoke
npm run contract:evidence
npm run test:e2e
npm run test:visual
```

要求：

- 用户可见改动至少跑 `frontend:gate + typecheck + build`。
- API/service/types 改动至少跑 `api:contract + contract:smoke + contract:evidence`。
- Product Center / Production UI 改动必须产出截图 evidence manifest。

### 4.2 Service contract smoke

用途：证明 service adapter 对真实 API response 的 shape、状态枚举、错误 envelope、字段命名能正确处理。

每个 contract smoke 至少包含：

```text
operation:
route/method:
request fixture:
response shape assertion:
normalization assertion:
error/unauthorized assertion:
consumer paths:
evidence path:
```

重点覆盖：

- snake_case ↔ camelCase normalization。
- `401/TOKEN_INVALID` 清 token + 跳登录。
- list/detail 返回结构、分页、empty state。
- mutation 后 refetch 用同一个真实 API 模型。
- 生成/导出/计费等异步状态不把 `failed/blocked/contract_needed` 显示成成功。

### 4.3 Browser interaction gate

用途：证明真实用户路径可操作。

每个业务动作至少断言：

```text
route rendered from intended worktree/build
current object visible
CTA visible and enabled/disabled reason correct
click triggers expected request
visible state changes correctly
console/network has no unexpected errors
screenshot/trace captured
```

### 4.4 Backend readback gate

用途：证明 UI 所声称完成的动作真的发生。

凡是前端声称以下动作成功，必须回读：

- 商品创建/编辑/删除：`create/update/delete -> list/detail/read`
- 资产上传/关系变更：`asset mutation -> product assets refetch`
- Listing 创建/编辑/采用：`listing mutation -> product detail/listing versions refetch`
- Prompt 生成/保存：`prompt mutation -> prompt list/detail/stage-view refetch`
- Image generation：`job create -> poll -> result asset archived/displayed`
- Workshop 保存/写回：`finalize/writeback -> product assets/listing/export surface refetch`
- Export/Download：`export task/package -> downloads list -> authenticated content request`
- Commercial：`order/confirm/payment-like action -> wallet/billing/order readback`

### 4.5 Negative gate

每条 P0 链路至少一个负例：

- 未登录 / token 失效。
- 前置条件不满足。
- API 失败。
- 重复点击。
- 返回 `failed/blocked/contract_needed/capability_unavailable`。
- 刷新/返回重进后状态丢失。
- 用户界面出现内部字段、raw JSON 或 `[object Object]`。

## 5. P0/P1/P2 业务交互矩阵

### P0：必须真实闭合

#### P0-1 Auth + protected route

业务承诺：用户登录后能进入业务工作区；未登录不能进入受保护页面。

交互链：

```text
/login 或注册 fixture
-> 保存 session/token
-> 进入 /products
-> 受保护 API 带 Authorization
-> token invalid 时清理状态并回 /login
```

证据：

- 浏览器打开 `/products` 前后鉴权状态。
- `/api/v1/ecommerce/auth/session` 或等价 session read。
- 401/TOKEN_INVALID 负例。

#### P0-2 Product create -> list -> detail/read

业务承诺：SKU 是业务中枢，后续生产、Listing、Export 都必须绑定真实 product_id + sku_code。

交互链：

```text
/products
-> 创建单个 QA 商品或导入一行 QA SKU
-> POST /api/v1/ecommerce/products
-> list refetch 出现该 SKU
-> 点击行进入 /products/:id
-> GET /products/:id 显示 title/sku/status/assets/listings/exports
-> cleanup/archive/delete QA 商品
```

必须断言：

- 最终 URL 不包含 `:productId`、`:id` 字面量。
- 列表中出现新 SKU。
- 详情页标题/SKU 是业务字段，不是 raw id。
- create payload 使用 `sku_code/title/tags/...`，service 边界负责 normalization。

#### P0-3 Product metadata edit persistence

业务承诺：详情页编辑商品信息后刷新仍保留。

交互链：

```text
/products/:id
-> 编辑 title/category/brand/tags/currency 等可编辑字段
-> PATCH /products/:id
-> detail refetch
-> reload page
-> 字段仍是新值
```

负例：

- PATCH 失败时不能显示成功。
- blur-triggered 保存不能在空值/非法值时误保存。

#### P0-4 Product-scoped visual entry

业务承诺：AI 生产不能是工具孤岛，必须从 SKU/Product 进入。

交互链：

```text
/products 或 /products/:id
-> 点击进入视觉生产/AI 工具
-> /products/:productId/ai/:toolSlug 或 /products/:id/production/prep
-> 页面显示当前 SKU/title
-> 创建 image job / visual session 请求必须携带 product_id + sku_code
```

必须断言：

- `/draw/:toolSlug` legacy 路由不承载真实生产路径。
- CTA 最终 pathname 是 product-scoped 路由。
- 请求 payload 不缺 `product_id` / `sku_code`。

#### P0-5 Production Prep source + four choices + stage-view

业务承诺：Prep 完成商品图/参考图理解与四项固定选择，之后才能进入出图方案。

交互链：

```text
/products/:id/production/prep
-> 上传/选择 SKU 图和参考图
-> POST source reference / uploadParsingSource
-> startParsing
-> stage-view(sources) refetch
-> 展示 SKU/reference 分轨解析
-> 完成四项固定选择
-> updateAttentionDecision / intent selection mutation
-> stage-view refetch
-> Sandbox 可继续
```

必须断言：

- 低置信度只走内部 safe fallback；不要出现“继续使用低质量图片/按低质量图片继续生成方案”模块。
- 页面不暴露 raw JSON、`deconstruction_elements`、`prompt_plan`、`runtime/provider/backend`。
- 四项选择完成前，下一步 CTA 禁止误导性提交。
- 刷新/返回后 source 与 choices 从 stage-view 恢复，而不是只靠 localStorage。

#### P0-6 Sandbox prompt compose -> generation readiness

业务承诺：Sandbox 生成的是用户可读的出图要求，不是内部 prompt_plan/debug JSON。

交互链：

```text
/products/:id/production/sandbox
-> refetch stage-view(sandbox)
-> 点击生成/刷新出图方案
-> POST prompt planner / compile intent
-> poll/read stage-view
-> composed prompt text 可见
-> no internal terms
-> execution CTA 只在 readiness 满足时允许提交
```

必须断言：

- 缺 prompt_id/readiness 时 CTA 显示用户可理解原因，如“补齐生成条件”。
- 点击后有可观察 running/polling 状态。
- 不出现 `prompt_id/prompt_plan/runtime/provider/contract/blocker` 等内部字段。

#### P0-7 Generation fanout -> Workshop real result

业务承诺：进入 Workshop 前，至少有真实生成结果或明确失败状态；不能用 task-id toast 代替完成。

交互链：

```text
Sandbox execution
-> create generation/fanout job
-> poll batch/version status
-> result_assets 非空
-> /products/:id/production/workshop
-> 真实缩略图/结果图可见
-> 选择/比较/分支/保存动作可用或明确 contract-needed
```

必须断言：

- 请求的 slot 数与 UI 终态数量一致。
- partial success 不自动当 full success。
- 失败 slot 展示已净化的业务原因。
- Workshop 图片通过受保护资源加载，不直接裸露不可访问 URL。

#### P0-8 Listing create/edit/adopt

业务承诺：Listing 版本是可维护、可采用的业务资产。

交互链：

```text
/products/:id
-> 创建/编辑 listing version
-> POST/PATCH listing-versions
-> refetch product detail/listing versions
-> 点击采用
-> POST adopt
-> listing_status/version 状态更新
```

必须断言：

- Edit/Adopt 不是死按钮。
- adopt 后目标版本在 UI 上成为当前采用版本。
- 负例：无 listing、接口失败、重复采用。

#### P0-9 Export package -> downloads -> authenticated content

业务承诺：用户能从商品资产/Listing 生成交付包，并在下载中心拿到可追踪文件。

交互链：

```text
/products/:id 或 /products/workbench/downloads
-> create export task/package
-> list downloads
-> download record 显示 product/export context
-> 点击下载
-> authenticated content request 成功
```

必须断言：

- `/account/downloads` 与 `/products/workbench/downloads` 不能回退到 mock DELIVERY_ITEMS 作为真实证据。
- 下载请求带鉴权 header，而不是裸浏览器跳 protected URL。
- download card 展示 product title/SKU、asset count、manifest 片段或等价 trace。

### P1：高频/高风险交互

- Product table：分页、筛选、列切换、行选择、右侧 preview、批量导入局部失败隔离。
- Product assets：设主图、删除关系、图片预览 blob、长标题/长 SKU 布局。
- Template Center：list/filter/detail/favorite/copy/use-now，`Use Now` 对 tool/template state 只生效一次。
- Image Runtime V1 workspace：source upload -> create job -> poll -> cancel -> asset preview。
- Commercial：offerings -> order -> confirm-payment dev fixture -> wallet/billing readback。
- Account pages：assets/history/templates/downloads 的真实 API/empty/error/loading。
- Inventory：如果纳入 Ecommerce release ring，按独立模块补 service/browser/readback gate。

### P2：体验/边界

- 移动端：Product table、Prep/Sandbox/Workshop、download cards、account pages。
- 慢接口：loading 不无限转，有超时/重试。
- 并发：重复点击、二次提交、轮询 race。
- 长文本：SKU/title/tags/prompt/错误文案不撑爆布局。
- i18n：ZH/EN 都不露内部词。
- 视觉证据：desktop/tablet/mobile screenshots。

## 6. Route -> CTA -> API -> State -> Evidence 合同模板

每个新增或修复的前端业务动作，都必须填这个合同：

```text
qa_id:
priority: P0 | P1 | P2
route:
object:
user_action:
preconditions:
expected_ui_before:
api_calls:
  - method/path:
    payload_keys:
    forbidden_keys:
expected_ui_after:
backend_readback:
negative_cases:
selectors_required:
evidence:
  - screenshot:
  - trace:
  - api_response_snapshot:
  - console_network_summary:
status: PASS | PASS_WITH_NOTES | PARTIAL_PASS | FAIL | BLOCKED
```

示例：

```text
qa_id: ecom-product-create-list-detail
priority: P0
route: /products
object: Product/SKU
user_action: 创建 QA SKU 并进入详情
api_calls:
  - POST /api/v1/ecommerce/products
  - GET /api/v1/ecommerce/products
  - GET /api/v1/ecommerce/products/:product_id
backend_readback: list + detail 都包含新 SKU
negative_cases: missing sku/title, duplicate sku, 401
selectors_required:
  - product-list-page
  - product-create-submit
  - product-row[data-product-id]
  - product-detail-page
status: BLOCKED until live fixture + cleanup exists
```

## 7. 推荐 Playwright/QA Harness 结构

当前 `tests/e2e/ecommerce.smoke.spec.ts` 仍以 `?dev=1 + installEcommerceMocks` 为主。下一阶段应新增业务 runtime 项目，保留 mock smoke 作为快速渲染检查，但不把它当真实闭环。

建议结构：

```text
tests/e2e/
  config/
    runtime-projects.ts
  support/
    api-client.ts          # authenticated Ecommerce API client
    auth-fixture.ts        # login/register/session fixture, redacts tokens
    data-fixture.ts        # product/template/export disposable fixtures
    evidence.ts            # screenshots, traces, response snapshots, report md/json
    selectors.ts           # stable data-testid registry
  pages/
    LoginPage.ts
    ProductListPage.ts
    ProductDetailPage.ts
    ProductionPrepPage.ts
    ProductionSandboxPage.ts
    ProductionWorkshopPage.ts
    DownloadsPage.ts
  specs/
    product-create-list-detail.runtime.spec.ts
    product-edit-persistence.runtime.spec.ts
    production-prep-sandbox-workshop.runtime.spec.ts
    listing-export-download.runtime.spec.ts
```

新增 npm scripts：

```json
{
  "qa:business": "playwright test -c playwright.business.config.ts --project=chromium-business-runtime",
  "qa:changed-flow": "node scripts/ecommerce-business-qa-selector.mjs && npm run qa:business",
  "qa:report": "node scripts/ecommerce-business-qa-report.mjs"
}
```

执行原则：

- 本地/Dev 可用真实 fixture；Prod 默认只读或受批准的 smoke，禁止自动创建污染数据。
- fixture 数据必须带 `QA-`/timestamp/worker 标识，并能 cleanup/archive/delete。
- 脚本不能打印 JWT、secret、host 私密信息。
- 浏览器 evidence 需要截图/trace/console/network summary。

## 8. Stable selector 合同

业务 QA 不能依赖文本或视觉顺序。新增/修复交互时补 `data-testid`。

命名规则：

```text
<domain>-<object>-<action/state>
```

建议 P0 selector：

```text
auth-login-form
auth-login-submit
product-list-page
product-create-open
product-create-submit
product-row
product-row-open-detail
product-detail-page
product-detail-save-status
product-visual-entry
production-prep-page
production-source-upload-sku
production-source-upload-reference
production-parse-start
production-choice-card
production-choice-submit
production-next-sandbox
production-sandbox-page
production-prompt-compose
production-generation-start
production-workshop-page
production-version-card
listing-create-submit
listing-adopt-submit
export-create-submit
download-record-card
download-record-download
```

规则：

- selector 放在业务边界上，不放在纯样式 wrapper 上。
- 不能用翻译文本、按钮顺序或 className 作为唯一定位。
- CTA 变更必须同步 selector registry。

## 9. Change selector：改什么触发什么 gate

### 9.1 P0 全量业务 gate 触发

触发路径：

```text
src/services/auth.ts
src/services/http.ts
src/services/product.ts
src/services/production.ts
src/services/imageRuntime.ts
src/services/commercial.ts
src/pages/product/**
src/pages/production/**
src/pages/account/AccountDownloadsPage.tsx
src/router/index.tsx
contracts/ecommerce.openapi.json
src/api/generated/ecommerce-contract.ts
```

触发 gate：

```text
frontend:gate
typecheck
build
api:contract
contract:smoke
qa:business or selected P0 runtime specs
```

### 9.2 Route/CTA gate

触发路径：

```text
src/router/index.tsx
src/layouts/ProductWorkbenchLayout.tsx
src/layouts/ProductionLayout.tsx
src/pages/ProductVisualToolsPage.tsx
src/pages/ToolPage.tsx
```

必须验证：

- final pathname。
- page identity/heading。
- selected SKU/product context。
- no literal `:productId` / `:id` anchor。

### 9.3 Copy/internal-term gate

触发路径：

```text
src/pages/**
src/components/**
src/i18n/**
src/services/production.ts
```

扫描禁词：

```text
prompt_plan
prompt_id
runtime
provider
backend
contract-needed
contract needed
blocker
result asset
callback
stage-view
deconstruction_elements
[object Object]
```

允许范围：

- DTO/type 文件。
- developer docs。
- operator/debug view 且明确非客户页面。

## 10. Evidence report 形状

每次业务 QA 输出：

```json
{
  "feature_id": "ecommerce-frontend-business-interaction-qa",
  "environment": "local|cloud-dev|prod-readonly",
  "frontend": { "path": "", "branch": "", "commit": "", "port": "" },
  "backend": { "base_url": "redacted", "health": "PASS|FAIL|BLOCKED" },
  "journeys": [
    {
      "qa_id": "ecom-product-create-list-detail",
      "status": "PASS|PASS_WITH_NOTES|PARTIAL_PASS|FAIL|BLOCKED",
      "route": "/products",
      "actions_clicked": [],
      "api_calls": [],
      "backend_readback": "PASS|FAIL|NOT_RUN",
      "negative_cases": [],
      "screenshot": "",
      "trace": "",
      "console_errors": [],
      "network_failures": [],
      "cleanup": "PASS|FAIL|NOT_REQUIRED|BLOCKED"
    }
  ],
  "final_status": "PASS|PASS_WITH_NOTES|PARTIAL_PASS|FAIL|BLOCKED"
}
```

Fail-closed 规则：

- browser 没点 CTA：最多 `PARTIAL_PASS`。
- mutation 没后端回读：最多 `PASS_WITH_NOTES`，P0 默认 `PARTIAL_PASS`。
- 使用 mock fixture 声称真实闭环：`FAIL` 或 `PARTIAL_PASS`。
- 有 raw JSON/internal terms/user-facing copy 泄露：P0 `FAIL`。
- cleanup 失败：不能 `PASS`。

## 11. 落地切片计划

### Slice 1：文档与 selector skeleton

Type: AFK

Acceptance:

- 本文件纳入 `AGENTS.md`/Developer Guide 索引。
- 建立 `qa_id` 命名和 P0 selector registry。
- 新增 business QA selector 脚本 skeleton，不执行 live 写操作。

Verifier:

```bash
npm run acceptance:governance
npm run frontend:gate
```

### Slice 2：真实 auth + product fixture

Type: AFK, but requires safe local/dev env

Acceptance:

- `tests/e2e/support/api-client.ts` 能登录/注册或读取 fixture token。
- 创建 disposable product，list/detail 回读，cleanup。
- 不打印 token。

Verifier:

```bash
npm run qa:business -- --grep @product-create-list-detail
```

### Slice 3：Product List/Detail Page Objects + selectors

Type: AFK

Acceptance:

- Product List 和 Detail 暴露稳定 `data-testid`。
- Playwright 通过 Page Object 点击 create/open/edit。
- 断言 URL、heading、SKU/title、console/network。

Verifier:

```bash
npm run qa:business -- --grep @product-core
```

### Slice 4：Production Prep/Sandbox runtime gate

Type: AFK + possible BLOCKED by backend fixture readiness

Acceptance:

- Prep source/choices 从 stage-view 回读。
- Sandbox prompt compose 不露内部词。
- 缺 readiness 时 CTA 用户语言可理解。
- 若 live API 未就绪，报告 `BLOCKED`，不能 mock 成 PASS。

Verifier:

```bash
npm run qa:business -- --grep @production-prep-sandbox
```

### Slice 5：Workshop generation/result gate

Type: HITL if real provider cost or prod-like runtime needed

Acceptance:

- Generation job/fanout 可 poll 到 terminal。
- result_assets 非空才进入 full PASS。
- Partial success/failed slot 不误导。

Verifier:

```bash
npm run qa:business -- --grep @production-workshop
```

### Slice 6：Listing + Export + Download gate

Type: AFK for local/dev, HITL for prod download/write smoke

Acceptance:

- Listing create/edit/adopt 有 refetch 证据。
- Export package/download list/content request 有鉴权与 trace。
- Cleanup 完整。

Verifier:

```bash
npm run qa:business -- --grep @listing-export-download
```

### Slice 7：SelfCheck/CI 接入

Type: AFK

Acceptance:

- `contract-governance/critical-journeys.json` 从 future skeleton 扩展出当前 P0 runtime journeys。
- Changed-file selector 能把 product/production/service 改动路由到对应 business gate。
- Evidence JSON 接入 V Evidence Contract。

Verifier:

```bash
npm run contract:smoke
npm run contract:evidence
cd /root/work/agentic-selfcheck && scripts/v-requirement-gate.sh ecommerce-frontend-business-interaction-qa static,api,browser,evidence requirement.changed.v.ecommerce-frontend-business-interaction-qa
```

## 12. 当前状态判断

当前状态应该报告为：

```text
PARTIAL_PASS
```

原因：

- 已有 `frontend:gate/typecheck/build/api:contract/test:e2e` 等基础门禁。
- 已有 product/production routes、services、future contract journey skeleton。
- 但 P0 真实业务链路尚未全部转成可复跑的 browser + API readback evidence。
- 当前 smoke 仍包含 `?dev=1` 与 mock installation，不能作为真实闭环证据。

## 13. 后续判断口径

以后任何前端业务改动的最终汇报必须分层：

```text
静态门禁：PASS/FAIL
契约门禁：PASS/PASS_WITH_NOTES/BLOCKED
浏览器交互：PASS/PARTIAL_PASS/FAIL/BLOCKED
后端回读：PASS/NOT_RUN/FAIL
负例：PASS/NOT_RUN/FAIL
最终业务状态：PASS/PASS_WITH_NOTES/PARTIAL_PASS/FAIL/BLOCKED
```

不能再用“页面能打开 + build 过了”说明业务逻辑 QA 完成。
