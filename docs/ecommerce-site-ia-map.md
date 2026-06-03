# Ecommerce Site IA Map

> P0 产物。内部全站信息架构地图，不是用户可见页面。用户端只通过导航、面包屑、步骤流、空状态和下一步引导体现路径感。

## P0 总原则

所有页面先进入全站层级，再进入单页设计；禁止把每个页面都当首页、工具大卖场或后台表格单独发挥。

## 主业务链路

```text
Product Center → SKU Detail → Visual Production → SKU.assets → Template Center / Listing → Delivery / Downloads
```

- 主业务对象：SKU/Product
- 核心链路 Route：`/products`, `/products/:id`, `/products/workbench/visual-tools`, `/products/:id/production/prep`, `/products/:id/production/sandbox`, `/products/:id/production/workshop`, `/aiChat/template`, `/products/workbench/downloads`

## 页面层级

1. 宣传/获客层：讲价值、展示效果、强 CTA，更像官网/产品介绍。
2. 工作台/业务入口层：登录后知道“我现在该做什么”，展示业务状态、推荐下一步、提供任务入口。
3. 对象详情层：围绕 SKU/Product/Listing/Asset/Generation Job 处理对象问题。
4. 功能生产层：完成具体业务任务，明确输入、任务、预期输出、结果保存位置。
5. 管理/配置层：低频管理、配置、系统状态，清晰稳定少炫技。
6. 库/管理层：模板、素材、任务记录、下载等集合管理。
7. 历史重定向/辅助层：只承接兼容和支持，不发明新视觉范式。

## 宣传/获客层 `marketing-page`

用途：Public acquisition and value explanation.

| Route | 页面/Surface | 主业务对象 | 第一主行动 | 下游 |
|---|---|---|---|---|
| `/` | Public portal | Visitor / prospect | Understand value and start trial | /login, /register, /pricing |
| `/home` | Public portal | Visitor / prospect | Understand value and start trial | /login, /pricing, /solutions |
| `/pricing` | Public portal | Visitor / buyer | Compare plans | /login, /register, /account/billing |
| `/solutions` | Public portal | Visitor by use case | Select a use case | /login, /register, /products |

## 工作台/业务入口层 `workspace-home`

用途：Logged-in business entry and triage.

| Route | 页面/Surface | 主业务对象 | 第一主行动 | 下游 |
|---|---|---|---|---|
| `/products` | Product Workbench | SKU/Product queue | Open/create SKU workflow | /products/:id, /products/workbench/visual-tools, /products/:id/production/prep |
| `/inventory/*` | Inventory | Inventory SKU/stock queue | Open inventory work item | inventory replenishment, inventory product management, alerts |

## 对象详情层 `object-detail`

用途：Single SKU/Product/Listing/Asset dossier.

| Route | 页面/Surface | 主业务对象 | 第一主行动 | 下游 |
|---|---|---|---|---|
| `/products/:id` | Product Workbench | SKU/Product | Continue SKU workflow | /products/:id/production/prep, /products/workbench/visual-tools, /aiChat/template |

## 功能生产层 `production-station`

用途：Execute one business production task.

| Route | 页面/Surface | 主业务对象 | 第一主行动 | 下游 |
|---|---|---|---|---|
| `/products/workbench/visual-tools` | Product Workbench | SKU/Product Asset | Start recommended visual task | SKU.assets, /aiChat/template, /products/:id/production/prep |
| `/products/workbench/visual-tools/:toolSlug` | Product Workbench | SKU/Product Asset | Configure/start selected visual task | SKU.assets, /aiChat/template, /products/workbench/downloads |
| `/products/:productId/ai/:toolSlug` | Product Workbench | SKU/Product Asset | Run product-scoped AI task | SKU.assets, /products/:id |
| `/products/:id/production/prep` | Production Pipeline | SKU/Product Generation Job | Complete source/strategy decisions | next production stage, SKU.assets, /aiChat/template |
| `/products/:id/production/sandbox` | Production Pipeline | SKU/Product Generation Job | Compose and verify generation requirements | next production stage, SKU.assets, /aiChat/template |
| `/products/:id/production/workshop` | Production Pipeline | SKU/Product Generation Job | Select/finalize generated assets | next production stage, SKU.assets, /aiChat/template |

## 库/管理层 `library-management`

用途：Browse/manage reusable assets, templates, records.

| Route | 页面/Surface | 主业务对象 | 第一主行动 | 下游 |
|---|---|---|---|---|
| `/aiChat/template` | Template Center | Template / Listing pattern collection | Choose template | Listing draft, Product workflow, Tool execution |
| `/products/workbench/downloads` | Product Workbench | Generated asset/download package collection | Download/reuse asset | Local download, reuse in workflow |
| `/account/assets` | Account / Organization | Account assets | Open or reuse asset | related account pages, Product Center |
| `/account/history` | Account / Organization | Account history | Inspect record | related account pages, Product Center |
| `/account/templates` | Account / Organization | User templates | Open/reuse template | related account pages, Product Center |

## 管理/配置层 `settings-admin`

用途：Configure account/org/system settings.

| Route | 页面/Surface | 主业务对象 | 第一主行动 | 下游 |
|---|---|---|---|---|
| `/account/profile` | Account / Organization | User profile | Update profile | related account pages, Product Center |
| `/account/billing` | Account / Organization | Billing account | Manage billing | related account pages, Product Center |
| `/org/overview` | Account / Organization | Organization | Manage organization | related account pages, Product Center |

## 历史重定向层 `redirect-legacy`

用途：Historical route redirected to canonical route.

| Route | 页面/Surface | 主业务对象 | 第一主行动 | 下游 |
|---|---|---|---|---|
| `/aiChat/batchListing` | Legacy route | Legacy navigation alias | Redirect | /aiChat/template |
| `/products/workbench/batch-listing` | Legacy route | Legacy navigation alias | Redirect | /aiChat/template |
| `/draw/product-home` | Legacy route | Legacy navigation alias | Redirect | /products |
| `/draw/product-records` | Legacy route | Legacy navigation alias | Redirect | /products/workbench/visual-tools |
| `/downloadCenter` | Legacy route | Legacy navigation alias | Redirect | /products/workbench/downloads |

## 辅助支持层 `utility-support`

用途：Help, docs, legal, auth, support.

| Route | 页面/Surface | 主业务对象 | 第一主行动 | 下游 |
|---|---|---|---|---|
| `/login` | Auth | Visitor / returning user | Log in | previous protected route, /products |


## 用户端呈现方式

不呈现“全站地图页”。只在具体页面中呈现：

- 当前层级：导航/面包屑/工作流 Stepper。
- 当前对象：SKU/Product/Listing/Asset 上下文。
- 当前任务：第一主行动和推荐下一步。
- 结果去向：保存到 SKU.assets、Listing、Template Center 或 Downloads。
- 下游引导：成功/空状态必须给下一步，不允许停在功能孤岛。
