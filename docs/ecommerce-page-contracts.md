# Ecommerce Page Contracts

> P1 产物。每个页面必须登记，不允许随便设计。机器可读源是 `docs/ecommerce-page-position-registry.json`；本文是人读版。

## Contract 模板

```text
Route:
页面名称:
页面层级:
主业务对象:
用户来到这里是为了解决什么问题:
上游页面:
下游页面:
第一主行动:
次行动:
结果输出到哪里:
是否承担宣传/价值解释:
允许的设计范式:
禁止的设计方式:
```


## Public portal — `/`

```text
Route: /
页面名称: Public portal
页面层级: 宣传/获客层 / marketing-page
主业务对象: Visitor / prospect
用户来到这里是为了解决什么问题: Explain product value and route visitors to trial/login/pricing.
上游页面: External acquisition, Direct visit
下游页面: /login, /register, /pricing, /solutions
第一主行动: Understand value and start trial
次行动: 按页面类型提供次级浏览/管理/返回动作
结果输出到哪里: Authenticated workspace entry
是否承担宣传/价值解释: 是
允许的设计范式: Public marketing narrative with value proof, effect examples, and clear CTA
禁止的设计方式: logged-in production station pattern, dense SKU operations table, internal backend status
```


## Public portal — `/home`

```text
Route: /home
页面名称: Public portal
页面层级: 宣传/获客层 / marketing-page
主业务对象: Visitor / prospect
用户来到这里是为了解决什么问题: Canonical home alias for product value explanation.
上游页面: Direct visit
下游页面: /login, /pricing, /solutions
第一主行动: Understand value and start trial
次行动: 按页面类型提供次级浏览/管理/返回动作
结果输出到哪里: Authenticated workspace entry
是否承担宣传/价值解释: 是
允许的设计范式: Public marketing narrative
禁止的设计方式: functional workbench layout, settings/admin layout
```


## Public portal — `/pricing`

```text
Route: /pricing
页面名称: Public portal
页面层级: 宣传/获客层 / marketing-page
主业务对象: Visitor / buyer
用户来到这里是为了解决什么问题: Explain plan value and purchase path.
上游页面: Home, Feature pages
下游页面: /login, /register, /account/billing
第一主行动: Compare plans
次行动: 按页面类型提供次级浏览/管理/返回动作
结果输出到哪里: Billing or registration
是否承担宣传/价值解释: 是
允许的设计范式: Pricing comparison and value proof
禁止的设计方式: SKU production dashboard, hidden purchase prerequisites
```


## Public portal — `/solutions`

```text
Route: /solutions
页面名称: Public portal
页面层级: 宣传/获客层 / marketing-page
主业务对象: Visitor by use case
用户来到这里是为了解决什么问题: Explain use-case value and guide to trial.
上游页面: Home, SEO
下游页面: /login, /register, /products
第一主行动: Select a use case
次行动: 按页面类型提供次级浏览/管理/返回动作
结果输出到哪里: Registration or workspace
是否承担宣传/价值解释: 是
允许的设计范式: Use-case marketing detail
禁止的设计方式: object detail dossier, production station
```


## Auth — `/login`

```text
Route: /login
页面名称: Auth
页面层级: 辅助支持层 / utility-support
主业务对象: Visitor / returning user
用户来到这里是为了解决什么问题: Authenticate user and return them to intended route.
上游页面: Protected routes, Public portal
下游页面: previous protected route, /products
第一主行动: Log in
次行动: 按页面类型提供次级浏览/管理/返回动作
结果输出到哪里: Authenticated session
是否承担宣传/价值解释: 否/弱化
允许的设计范式: Focused auth form with redirect context
禁止的设计方式: marketing homepage hero overload, SKU workflow controls
```


## Product Workbench — `/products`

```text
Route: /products
页面名称: Product Workbench
页面层级: 工作台/业务入口层 / workspace-home
主业务对象: SKU/Product queue
用户来到这里是为了解决什么问题: Help users choose which SKU/Product to work on next.
上游页面: Login, Portal CTA, Product navigation
下游页面: /products/:id, /products/workbench/visual-tools, /products/:id/production/prep
第一主行动: Open/create SKU workflow
次行动: 按页面类型提供次级浏览/管理/返回动作
结果输出到哪里: Selected SKU enters downstream production
是否承担宣传/价值解释: 是，但必须嵌入当前任务
允许的设计范式: Workspace home: queue, readiness, recommended next actions
禁止的设计方式: homepage-style product marketing, equal-weight tool grid, raw backend table dump
```


## Product Workbench — `/products/:id`

```text
Route: /products/:id
页面名称: Product Workbench
页面层级: 对象详情层 / object-detail
主业务对象: SKU/Product
用户来到这里是为了解决什么问题: Show single-SKU dossier and decide the next workflow action.
上游页面: /products, search/deep link
下游页面: /products/:id/production/prep, /products/workbench/visual-tools, /aiChat/template, /products/workbench/downloads
第一主行动: Continue SKU workflow
次行动: 按页面类型提供次级浏览/管理/返回动作
结果输出到哪里: Visual assets, listing drafts, downloads
是否承担宣传/价值解释: 是，但必须嵌入当前任务
允许的设计范式: Object detail dossier: facts, assets, readiness, downstream actions
禁止的设计方式: homepage hero, generic settings page, tool registry
```


## Product Workbench — `/products/workbench/visual-tools`

```text
Route: /products/workbench/visual-tools
页面名称: Product Workbench
页面层级: 功能生产层 / production-station
主业务对象: SKU / Product Asset
用户来到这里是为了解决什么问题: 为当前 SKU 选择并执行视觉生产任务
上游页面: SKU Detail / Product Center
下游页面: SKU.assets / Listing / Template Center
第一主行动: 选择推荐视觉任务并开始生成
次行动: 浏览更多视觉目标
结果输出到哪里: SKU.assets
是否承担宣传/价值解释: 需要，但必须嵌入任务，不是首页式宣传
允许的设计范式: SKU 视觉任务工作台
禁止的设计方式: 工具矩阵、官网首页、纯后台表格、tool registry、equal-weight tool matrix、raw backend status panel
```


## Product Workbench — `/products/workbench/visual-tools/:toolSlug`

```text
Route: /products/workbench/visual-tools/:toolSlug
页面名称: Product Workbench
页面层级: 功能生产层 / production-station
主业务对象: SKU/Product Asset
用户来到这里是为了解决什么问题: Execute a selected visual production goal for a SKU.
上游页面: /products/workbench/visual-tools, /products/:id
下游页面: SKU.assets, /aiChat/template, /products/workbench/downloads
第一主行动: Configure/start selected visual task
次行动: 按页面类型提供次级浏览/管理/返回动作
结果输出到哪里: Task result saved as SKU visual asset
是否承担宣传/价值解释: 是，但必须嵌入当前任务
允许的设计范式: Focused visual production station for one goal
禁止的设计方式: homepage hero as primary structure, tool registry, equal-weight tool matrix, raw backend status panel
```


## Product Workbench — `/products/:productId/ai/:toolSlug`

```text
Route: /products/:productId/ai/:toolSlug
页面名称: Product Workbench
页面层级: 功能生产层 / production-station
主业务对象: SKU/Product Asset
用户来到这里是为了解决什么问题: Run an AI tool in the context of a specific product.
上游页面: /products/:id, /products/workbench/visual-tools/:toolSlug
下游页面: SKU.assets, /products/:id
第一主行动: Run product-scoped AI task
次行动: 按页面类型提供次级浏览/管理/返回动作
结果输出到哪里: Product-scoped generated asset
是否承担宣传/价值解释: 是，但必须嵌入当前任务
允许的设计范式: Product-scoped AI workspace
禁止的设计方式: anonymous tool playground, homepage marketing
```


## Production Pipeline — `/products/:id/production/prep`

```text
Route: /products/:id/production/prep
页面名称: Production Pipeline
页面层级: 功能生产层 / production-station
主业务对象: SKU/Product Generation Job
用户来到这里是为了解决什么问题: Handle the prep stage of SKU visual production.
上游页面: /products/:id, previous production stage
下游页面: next production stage, SKU.assets, /aiChat/template, /products/workbench/downloads
第一主行动: Complete source/strategy decisions
次行动: 按页面类型提供次级浏览/管理/返回动作
结果输出到哪里: Confirmed strategy inputs
是否承担宣传/价值解释: 是，但必须嵌入当前任务
允许的设计范式: Production pipeline station with workflow progress, current task, guardrails, and result destination
禁止的设计方式: standalone homepage, unrelated dashboard, raw provider/runtime panel
```


## Production Pipeline — `/products/:id/production/sandbox`

```text
Route: /products/:id/production/sandbox
页面名称: Production Pipeline
页面层级: 功能生产层 / production-station
主业务对象: SKU/Product Generation Job
用户来到这里是为了解决什么问题: Handle the sandbox stage of SKU visual production.
上游页面: /products/:id, previous production stage
下游页面: next production stage, SKU.assets, /aiChat/template, /products/workbench/downloads
第一主行动: Compose and verify generation requirements
次行动: 按页面类型提供次级浏览/管理/返回动作
结果输出到哪里: Generation plan and fanout request
是否承担宣传/价值解释: 是，但必须嵌入当前任务
允许的设计范式: Production pipeline station with workflow progress, current task, guardrails, and result destination
禁止的设计方式: standalone homepage, unrelated dashboard, raw provider/runtime panel
```


## Production Pipeline — `/products/:id/production/workshop`

```text
Route: /products/:id/production/workshop
页面名称: Production Pipeline
页面层级: 功能生产层 / production-station
主业务对象: SKU/Product Generation Job
用户来到这里是为了解决什么问题: Handle the workshop stage of SKU visual production.
上游页面: /products/:id, previous production stage
下游页面: next production stage, SKU.assets, /aiChat/template, /products/workbench/downloads
第一主行动: Select/finalize generated assets
次行动: 按页面类型提供次级浏览/管理/返回动作
结果输出到哪里: Final assets saved for listing/download
是否承担宣传/价值解释: 是，但必须嵌入当前任务
允许的设计范式: Production pipeline station with workflow progress, current task, guardrails, and result destination
禁止的设计方式: standalone homepage, unrelated dashboard, raw provider/runtime panel
```


## Template Center — `/aiChat/template`

```text
Route: /aiChat/template
页面名称: Template Center
页面层级: 库/管理层 / library-management
主业务对象: Template / Listing pattern collection
用户来到这里是为了解决什么问题: Browse and reuse templates for listing/content/visual production.
上游页面: Product Center, Visual Tools, Production Workshop
下游页面: Listing draft, Product workflow, Tool execution
第一主行动: Choose template
次行动: 按页面类型提供次级浏览/管理/返回动作
结果输出到哪里: Reusable template applied to SKU/listing workflow
是否承担宣传/价值解释: 否/弱化
允许的设计范式: Library management with filters, preview, reuse action
禁止的设计方式: batch listing legacy language, homepage hero takeover, raw prompt registry
```


## Product Workbench — `/products/workbench/downloads`

```text
Route: /products/workbench/downloads
页面名称: Product Workbench
页面层级: 库/管理层 / library-management
主业务对象: Generated asset/download package collection
用户来到这里是为了解决什么问题: Retrieve generated/downloadable assets and packages.
上游页面: SKU Detail, Workshop, Template Center
下游页面: Local download, reuse in workflow
第一主行动: Download/reuse asset
次行动: 按页面类型提供次级浏览/管理/返回动作
结果输出到哪里: Downloaded package or reused asset
是否承担宣传/价值解释: 否/弱化
允许的设计范式: Asset/download library with status and filters
禁止的设计方式: marketing page, unscoped file dump
```


## Account / Organization — `/account/profile`

```text
Route: /account/profile
页面名称: Account / Organization
页面层级: 管理/配置层 / settings-admin
主业务对象: User profile
用户来到这里是为了解决什么问题: Manage personal profile and preferences.
上游页面: account navigation
下游页面: related account pages, Product Center
第一主行动: Update profile
次行动: 按页面类型提供次级浏览/管理/返回动作
结果输出到哪里: Updated account state or selected reusable record
是否承担宣传/价值解释: 否/弱化
允许的设计范式: Stable account/settings or library surface
禁止的设计方式: page-local design system, ad-hoc button palette, unscoped dark surface drift
```


## Account / Organization — `/account/assets`

```text
Route: /account/assets
页面名称: Account / Organization
页面层级: 库/管理层 / library-management
主业务对象: Account assets
用户来到这里是为了解决什么问题: Review owned/generated account-level assets.
上游页面: account navigation
下游页面: related account pages, Product Center
第一主行动: Open or reuse asset
次行动: 按页面类型提供次级浏览/管理/返回动作
结果输出到哪里: Updated account state or selected reusable record
是否承担宣传/价值解释: 否/弱化
允许的设计范式: Stable account/settings or library surface
禁止的设计方式: page-local design system, ad-hoc button palette, unscoped dark surface drift
```


## Account / Organization — `/account/history`

```text
Route: /account/history
页面名称: Account / Organization
页面层级: 库/管理层 / library-management
主业务对象: Account history
用户来到这里是为了解决什么问题: Review historical usage and generation records.
上游页面: account navigation
下游页面: related account pages, Product Center
第一主行动: Inspect record
次行动: 按页面类型提供次级浏览/管理/返回动作
结果输出到哪里: Updated account state or selected reusable record
是否承担宣传/价值解释: 否/弱化
允许的设计范式: Stable account/settings or library surface
禁止的设计方式: page-local design system, ad-hoc button palette, unscoped dark surface drift
```


## Account / Organization — `/account/templates`

```text
Route: /account/templates
页面名称: Account / Organization
页面层级: 库/管理层 / library-management
主业务对象: User templates
用户来到这里是为了解决什么问题: Manage saved personal templates.
上游页面: account navigation
下游页面: related account pages, Product Center
第一主行动: Open/reuse template
次行动: 按页面类型提供次级浏览/管理/返回动作
结果输出到哪里: Updated account state or selected reusable record
是否承担宣传/价值解释: 否/弱化
允许的设计范式: Stable account/settings or library surface
禁止的设计方式: page-local design system, ad-hoc button palette, unscoped dark surface drift
```


## Account / Organization — `/account/billing`

```text
Route: /account/billing
页面名称: Account / Organization
页面层级: 管理/配置层 / settings-admin
主业务对象: Billing account
用户来到这里是为了解决什么问题: Review billing/orders and plan state.
上游页面: account navigation
下游页面: related account pages, Product Center
第一主行动: Manage billing
次行动: 按页面类型提供次级浏览/管理/返回动作
结果输出到哪里: Updated account state or selected reusable record
是否承担宣传/价值解释: 否/弱化
允许的设计范式: Stable account/settings or library surface
禁止的设计方式: page-local design system, ad-hoc button palette, unscoped dark surface drift
```


## Account / Organization — `/org/overview`

```text
Route: /org/overview
页面名称: Account / Organization
页面层级: 管理/配置层 / settings-admin
主业务对象: Organization
用户来到这里是为了解决什么问题: Review organization workspace and members.
上游页面: account navigation
下游页面: related account pages, Product Center
第一主行动: Manage organization
次行动: 按页面类型提供次级浏览/管理/返回动作
结果输出到哪里: Updated account state or selected reusable record
是否承担宣传/价值解释: 否/弱化
允许的设计范式: Stable account/settings or library surface
禁止的设计方式: page-local design system, ad-hoc button palette, unscoped dark surface drift
```


## Inventory — `/inventory/*`

```text
Route: /inventory/*
页面名称: Inventory
页面层级: 工作台/业务入口层 / workspace-home
主业务对象: Inventory SKU/stock queue
用户来到这里是为了解决什么问题: Manage inventory-related product operations.
上游页面: Main nav
下游页面: inventory replenishment, inventory product management, alerts
第一主行动: Open inventory work item
次行动: 按页面类型提供次级浏览/管理/返回动作
结果输出到哪里: Inventory task/update
是否承担宣传/价值解释: 是，但必须嵌入当前任务
允许的设计范式: Inventory workspace with queue/status/action hierarchy
禁止的设计方式: marketing homepage, visual production station
```


## Legacy route — `/aiChat/batchListing`

```text
Route: /aiChat/batchListing
页面名称: Legacy route
页面层级: 历史重定向层 / redirect-legacy
主业务对象: Legacy navigation alias
用户来到这里是为了解决什么问题: Redirect legacy route to canonical /aiChat/template.
上游页面: legacy bookmarks, old navigation
下游页面: /aiChat/template
第一主行动: Redirect
次行动: 按页面类型提供次级浏览/管理/返回动作
结果输出到哪里: Canonical route reached
是否承担宣传/价值解释: 否/弱化
允许的设计范式: No UI; router redirect only
禁止的设计方式: rendering new page here, duplicating legacy content
```


## Legacy route — `/products/workbench/batch-listing`

```text
Route: /products/workbench/batch-listing
页面名称: Legacy route
页面层级: 历史重定向层 / redirect-legacy
主业务对象: Legacy navigation alias
用户来到这里是为了解决什么问题: Redirect legacy route to canonical /aiChat/template.
上游页面: legacy bookmarks, old navigation
下游页面: /aiChat/template
第一主行动: Redirect
次行动: 按页面类型提供次级浏览/管理/返回动作
结果输出到哪里: Canonical route reached
是否承担宣传/价值解释: 否/弱化
允许的设计范式: No UI; router redirect only
禁止的设计方式: rendering new page here, duplicating legacy content
```


## Legacy route — `/draw/product-home`

```text
Route: /draw/product-home
页面名称: Legacy route
页面层级: 历史重定向层 / redirect-legacy
主业务对象: Legacy navigation alias
用户来到这里是为了解决什么问题: Redirect legacy route to canonical /products.
上游页面: legacy bookmarks, old navigation
下游页面: /products
第一主行动: Redirect
次行动: 按页面类型提供次级浏览/管理/返回动作
结果输出到哪里: Canonical route reached
是否承担宣传/价值解释: 否/弱化
允许的设计范式: No UI; router redirect only
禁止的设计方式: rendering new page here, duplicating legacy content
```


## Legacy route — `/draw/product-records`

```text
Route: /draw/product-records
页面名称: Legacy route
页面层级: 历史重定向层 / redirect-legacy
主业务对象: Legacy navigation alias
用户来到这里是为了解决什么问题: Redirect legacy route to canonical /products/workbench/visual-tools.
上游页面: legacy bookmarks, old navigation
下游页面: /products/workbench/visual-tools
第一主行动: Redirect
次行动: 按页面类型提供次级浏览/管理/返回动作
结果输出到哪里: Canonical route reached
是否承担宣传/价值解释: 否/弱化
允许的设计范式: No UI; router redirect only
禁止的设计方式: rendering new page here, duplicating legacy content
```


## Legacy route — `/downloadCenter`

```text
Route: /downloadCenter
页面名称: Legacy route
页面层级: 历史重定向层 / redirect-legacy
主业务对象: Legacy navigation alias
用户来到这里是为了解决什么问题: Redirect legacy route to canonical /products/workbench/downloads.
上游页面: legacy bookmarks, old navigation
下游页面: /products/workbench/downloads
第一主行动: Redirect
次行动: 按页面类型提供次级浏览/管理/返回动作
结果输出到哪里: Canonical route reached
是否承担宣传/价值解释: 否/弱化
允许的设计范式: No UI; router redirect only
禁止的设计方式: rendering new page here, duplicating legacy content
```
