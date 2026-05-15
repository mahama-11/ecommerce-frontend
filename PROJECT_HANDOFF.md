# Agent Ecommerce — Frontend 项目交付文档

> **版本**: v2.0 | **日期**: 2026-05-15 | **源码行数**: ~23,400 行 (86 个文件)
>
> 本文档面向前端/后端工程师，提供完整的项目结构、模块说明、交互逻辑和二次开发指引。

---

## 一、项目综述

### 1.1 产品定位

Agent Ecommerce 是面向跨境电商卖家的 AI 视觉生产平台。核心工作流：上传 SKU 商品图/参考图 → AI 双轨解析属性 → LLM 决策树推荐策略 → 配置意图与执行参数 → 批量生成营销图片 → 迭代精修 → 导出交付。

### 1.2 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 框架 | React | 19.2 |
| 语言 | TypeScript | 6.0 |
| 构建 | Vite | 8.0 |
| 样式 | Tailwind CSS | 4.2 |
| 路由 | React Router | 7.14 |
| 状态管理 | Zustand | 5.0 |
| 动画 | Framer Motion | 12.38 |
| 图标 | Lucide React | 1.8 |
| HTTP | 原生 fetch (封装) | - |
| 国际化 | i18next + react-i18next | 25.10 |
| Excel | xlsx (SheetJS) | 0.18 |

### 1.3 架构概览

```
┌─────────────────────────────────────────────────┐
│                  PortalLayout                    │
│  (公共页面: 首页/定价/方案/博客/登录/注册)          │
├──────────┬──────────┬──────────┬────────────────┤
│ Console  │ Product  │Production│   Account      │
│ Layout   │ Workbench│  Layout  │   Layout       │
│ (工具/   │ (商品    │ (V2 生产 │  (个人中心      │
│  运营/   │ 中心     │  管线)   │   /资产/账单)   │
│  设计)   │          │          │                │
└──────────┴──────────┴──────────┴────────────────┘
```

### 1.4 开发/构建

```bash
npm install          # 安装依赖
npm run dev          # 开发服务器 http://localhost:5180
npm run typecheck    # TypeScript 类型检查
npm run build        # 生产构建 (tsc + vite build)
npm run ci:quick     # CI 快速检查 (typecheck + build)
```

### 1.5 Dev Mock 模式

URL 添加 `?dev=1` 参数可启用本地 Mock 数据，无需后端即可完整体验 V2 工作流：

```
http://localhost:5180/?dev=1                          # 首页 (含 Demo 入口)
http://localhost:5180/products/demo-product-1/production/prep?dev=1    # Prep Hub
http://localhost:5180/products/demo-product-1/production/sandbox?dev=1 # Sandbox
http://localhost:5180/products/demo-product-1/production/workshop?dev=1# Workshop
```

Mock 自动注入逻辑：`?dev=1` → RequireAuth 自动写入 localStorage mock session → PrepHub 自动填充素材 + 触发解析 + 自动评估决策树。

---

## 二、目录结构

```
src/
├── main.tsx                    # 应用入口 (React.StrictMode + AuthBootstrap + Toast + Router)
├── index.css                   # 全局样式 + Tailwind 主题 + 自定义 CSS 类
├── router/
│   └── index.tsx               # 路由定义 (全部 lazy load)
├── layouts/                    # 布局组件 (6 个)
│   ├── PortalLayout.tsx        #   公共布局 (顶栏 + mega-menu + footer)
│   ├── ConsoleLayout.tsx       #   控制台布局 (侧栏 + 顶栏)
│   ├── AccountLayout.tsx       #   个人中心布局
│   ├── OrgLayout.tsx           #   组织管理布局
│   ├── ProductWorkbenchLayout.tsx  # 商品工作台布局 (含 ProductWorkflowNav)
│   └── ProductionLayout.tsx    #   V2 生产管线布局 (步骤导航 + 环境光效)
├── pages/                      # 页面组件
│   ├── HomePage.tsx            #   首页 (Hero + V2 Pipeline 展示 + Quick Entry)
│   ├── PricingPage.tsx         #   定价页
│   ├── SolutionDetailPage.tsx  #   解决方案详情
│   ├── ToolPage.tsx            #   V1 工具页 (已重定向到 V2)
│   ├── ProductVisualToolsPage.tsx # V1 视觉工具总览 (已重定向)
│   ├── BatchListingPage.tsx    #   批量 Listing
│   ├── ChatWorkspacePage.tsx   #   AI 对话工作台
│   ├── AgentTemplateMarketPage.tsx # AI Agent 模板市场
│   ├── OpsWorkbenchPage.tsx    #   智能运营工作台
│   ├── AssetCommercePage.tsx   #   资产/知识库
│   ├── DesignWorkbenchPage.tsx #   设计器工作台
│   ├── GenericPage.tsx         #   通用内容页 (博客/帮助/FAQ)
│   ├── AboutUsPage.tsx         #   关于我们
│   ├── ContactPage.tsx         #   联系我们
│   ├── CareersPage.tsx         #   招聘
│   ├── PrivacyPage.tsx         #   隐私政策
│   ├── TermsPage.tsx           #   服务条款
│   ├── ApiDocsPage.tsx         #   API 文档
│   ├── BlogPage.tsx            #   博客
│   ├── ChangelogPage.tsx       #   更新日志
│   ├── HelpCenterPage.tsx      #   帮助中心
│   ├── auth/                   #   认证页面
│   │   ├── LoginPage.tsx       #     登录
│   │   ├── RegisterPage.tsx    #     注册
│   │   └── ForgotPasswordPage.tsx # 找回密码
│   ├── account/                #   个人中心页面
│   │   ├── AccountProfilePage.tsx    # 个人资料
│   │   ├── AccountAssetsPage.tsx     # 我的资产
│   │   ├── AccountBillingPage.tsx    # 订单与额度
│   │   ├── AccountHistoryPage.tsx    # 历史记录
│   │   ├── AccountTemplatesPage.tsx  # 商品模板
│   │   ├── AccountPromotionPage.tsx  # 推广管理
│   │   ├── AccountCommissionPage.tsx # 佣金管理
│   │   └── AccountDownloadsPage.tsx  # 下载中心
│   ├── product/                #   商品模块
│   │   ├── ProductListPage.tsx       # 商品列表 (Queue)
│   │   ├── ProductDetailPage.tsx     # 商品详情 (SKU Detail)
│   │   ├── components/
│   │   │   ├── ProductAIPipelinePanel.tsx  # AI Pipeline 面板
│   │   │   └── ProductDetailTabs.tsx      # 详情 Tab 导航
│   │   └── utils/
│   │       └── productMission.ts        # 商品任务工具函数
│   ├── org/                    #   组织管理
│   │   └── OrgOverviewPage.tsx  #     组织总览
│   └── production/             #   ★ V2 生产管线 (核心模块)
│       ├── PrepHubPage.tsx     #     生产准备区 (~941 行)
│       ├── SandboxPage.tsx     #     策略配置与执行 (~863 行)
│       └── WorkshopPage.tsx    #     迭代工作坊 (~930 行)
├── components/                 # 公共组件
│   ├── Toast.tsx               #   全局 Toast 通知
│   ├── DetailDrawer.tsx        #   详情抽屉
│   ├── auth/
│   │   ├── AuthBootstrap.tsx   #     认证引导 (监听 URL token / session 恢复)
│   │   ├── RequireAuth.tsx     #     路由守卫 (未登录 → 登录页)
│   │   └── RequireOrgAdmin.tsx #     组织管理员守卫
│   ├── account/
│   │   ├── UserAccountMenu.tsx #     用户头像下拉菜单
│   │   └── UserSummaryCard.tsx #     用户信息卡片
│   ├── pricing/
│   │   └── PricingPlanGrid.tsx #     定价方案网格
│   └── product-workbench/
│       ├── ProductWorkflowNav.tsx # 工作流导航栏 (Queue→SKU→Production→Listing→Export)
│       └── index.tsx               # 工作流容器
├── store/                      # Zustand 状态管理
│   ├── productionStore.ts      #   V2 生产管线 Store (Prep + Sandbox + Workshop)
│   └── toastStore.ts           #   全局 Toast Store
├── state/
│   └── auth.ts                 #   认证状态 (发布-订阅模式, 非 Zustand)
├── services/                   # API 服务层
│   ├── apiBase.ts              #   API Base URL 配置
│   ├── http.ts                 #   HTTP 请求封装 (fetch + Envelope + 401 处理)
│   ├── auth.ts                 #   认证 API (login/register/session/refresh)
│   ├── product.ts              #   商品 CRUD API
│   ├── production.ts           #   ★ V2 生产 API (18 个端点, 含 dev mock)
│   ├── commercial.ts           #   商业化 API
│   └── templateCenter.ts       #   模板中心 API
├── types/                      # TypeScript 类型定义
│   ├── tool.ts                 #   工具/方案/定价类型
│   ├── product.ts              #   商品类型
│   ├── commercial.ts           #   商业化类型
│   └── production.ts           #   ★ V2 生产管线类型 (~389 行)
├── mock/                       # Mock 数据 (V1 页面)
│   ├── data.ts                 #   TOOL_CATEGORIES, TOOLS, SOLUTIONS, PRICING, NAV_GROUPS
│   ├── products.ts             #   商品列表/详情 Mock
│   ├── assetCommerce.ts        #   资产商城 Mock
│   ├── designWorkbench.ts      #   设计器 Mock
│   ├── opsWorkbench.ts         #   运营工作台 Mock
│   ├── templateLibrary.ts      #   模板库 Mock
│   └── workflowBridge.ts       #   工作流桥接 Mock
├── mocks/                      # Mock 数据 (V2 生产)
│   └── productionDemo.ts       #   V2 全链路 Mock (素材/解析/决策树/意图/变体/精修)
├── hooks/
│   └── useAuth.ts              #   认证 Hook (session 状态 + refresh)
├── repositories/
│   └── productWorkspace.ts     #   商品工作台数据仓库
├── utils/
│   ├── authNavigation.ts       #   认证感知的路径导航工具
│   └── commercialDisplay.ts    #   商业化数据展示工具
├── lib/
│   └── cn.ts                   #   clsx + tailwind-merge 工具函数
├── styles/
│   └── zIndex.ts               #   z-index 层级常量
└── i18n/
    ├── index.ts                #   i18next 初始化配置
    ├── helpers.ts              #   翻译辅助函数
    ├── zh.ts                   #   中文翻译 (~1500 键)
    └── en.ts                   #   英文翻译 (~1500 键)
```

---

## 三、路由体系

### 3.1 路由层级

| 层级 | Layout | 认证要求 | 说明 |
|------|--------|----------|------|
| L0 | PortalLayout | 无 | 公共页面 (首页/定价/方案/登录等) |
| L1 | ConsoleLayout | RequireAuth | 控制台页面 (工具/运营/设计/对话) |
| L1 | AccountLayout | RequireAuth | 个人中心 (资料/资产/账单) |
| L1 | OrgLayout | RequireOrgAdmin | 组织管理 |
| L1 | ProductWorkbenchLayout | RequireAuth | 商品中心 (列表/详情) |
| L1 | ProductionLayout | RequireAuth | V2 生产管线 (Prep/Sandbox/Workshop) |

### 3.2 路由辅助函数

路由文件 (`router/index.tsx`) 定义了 5 个路由工厂函数，统一包裹认证 + Layout：

- `consolePage(Element)` — RequireAuth → ConsoleLayout → Page
- `accountPage(Element)` — RequireAuth → AccountLayout → Page
- `orgPage(Element)` — RequireOrgAdmin → OrgLayout → Page
- `productWorkbenchPage(children)` — RequireAuth → ProductWorkbenchLayout (/products) → children
- `productionPage(children)` — RequireAuth → ProductionLayout (/products/:id/production) → children

### 3.3 V2 生产管线路由

```
/products/:id/production/prep       → PrepHubPage     (生产准备区)
/products/:id/production/sandbox    → SandboxPage     (策略配置与执行)
/products/:id/production/workshop   → WorkshopPage    (迭代工作坊)
```

### 3.4 V1 → V2 重定向

以下旧路由已重定向到 V2 对应页面：

| 旧路由 | 新路由 |
|--------|--------|
| `/products/workbench/visual-tools` | `/products` |
| `/products/workbench/visual-tools/:toolSlug` | `/products` |
| `/products/:productId/ai/:toolSlug` | `/products/:productId/production/prep` |
| `/draw/product-records` | `/products` |
| `/draw/product-home` | `/products` |
| `/settings/profile` | `/account/profile` |
| `/settings/personal` | `/account/assets` |
| `/settings/organization` | `/org/overview` |

---

## 四、核心模块详解

### 4.1 V2 生产管线 — 总体工作流

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Prep Hub   │────→│   Sandbox   │────→│  Workshop   │
│  生产准备区  │     │ 策略配置执行 │     │  迭代工作坊  │
└─────────────┘     └─────────────┘     └─────────────┘
     │                    │                    │
     ├─ 上传素材           ├─ 策略摘要           ├─ 变体矩阵
     ├─ 双轨解析           ├─ DIY 额外要求       ├─ 版本谱系
     ├─ LLM 决策树         ├─ 任务配额管理       ├─ 全局权重
     ├─ 属性权重调节       ├─ 模板预览           ├─ 局部重绘
     └─ 冲突解决           ├─ 执行设置           └─ 对话精修
                          └─ 消耗预估
```

### 4.2 PrepHubPage — 生产准备区 (941 行)

**路由**: `/products/:id/production/prep`

**布局**: 12 列 grid (5 + 4 + 3) + 底部全宽

| 区域 | 列数 | 功能 |
|------|------|------|
| 左栏 (5col) | SKU + Reference 上传 | UploadZone 组件，拖拽上传，缩略图网格 |
| 中栏 (4col) | LLM 决策树 | 交互式步骤问答，选项卡片，进度条 |
| 右栏 (3col) | 解析属性 | 属性行列表，置信度条，可编辑值 |
| 底部 (全宽) | 全局权重调节 | SKU↔Reference 偏向滑杆 |

**子组件**:
- `UploadZone`: 拖拽上传区，支持 drag/drop + click，缩略图预览
- `DecisionStepCard`: 单步决策卡片，含选项网格 + 选中指示器
- `AttributeRow`: 属性行，含置信度进度条 + Bias 滑杆
- `usePolling<T>`: 自定义 Hook，轮询 API 直到指定条件满足

**核心交互**:
1. 用户上传 SKU 图和参考图
2. 点击"开始解析"触发双轨解析 (ComfyUI + 第三方)
3. 解析完成后自动触发 LLM 决策树评估
4. 决策树以步骤式问答呈现，用户逐步选择选项
5. 用户可跳过决策树 (右上角跳过按钮)
6. 完成决策树或跳过后，右上角显示"策略配置"下一步按钮

**Store**: `usePrepStore`
- 状态: `productId`, `sources[]`, `parsing`, `decisionTree`, `globalDriftBias`
- 操作: `addSource`, `removeSource`, `setParsing`, `setDecisionTree`, `updateAttributeBias`, `setGlobalDriftBias`

**API 端点** (Prep Hub):
| 函数 | 方法 | 路径 | 说明 |
|------|------|------|------|
| `uploadParsingSource` | POST | `/api/v2/production/{productId}/sources` | 上传素材图 |
| `startParsing` | POST | `/api/v2/production/{productId}/parse` | 启动双轨解析 |
| `getParsingResult` | GET | `/api/v2/production/{productId}/parse` | 轮询解析结果 |
| `evaluateDecisionTree` | POST | `/api/v2/production/{productId}/decision-tree` | 触发决策树评估 |
| `getDecisionTree` | GET | `/api/v2/production/{productId}/decision-tree` | 轮询决策树状态 |
| `updateParsedAttribute` | PATCH | `/api/v2/production/{productId}/attributes/{key}` | 手动修正属性 |

### 4.3 SandboxPage — 策略配置与执行 (863 行)

**路由**: `/products/:id/production/sandbox`

**布局**: 12 列 grid (3 + 6 + 3) + 底部

| 区域 | 列数 | 功能 |
|------|------|------|
| 左栏 (3col) | 策略摘要 + DIY Prompt | 只读策略摘要 + 自然语言输入 + 关键词识别 |
| 中栏 (6col) | 配额管理 + 模板预览 | 任务数量调节 + 资产行 + SVG 线框预览 |
| 右栏 (3col) | 执行设置 + 消耗预估 | 模型/分辨率选择 + 高级参数折叠 + Credits 实时计算 |
| 底部 | 操作栏 | "开始策略化生产"主按钮 + "返回上一步" |

**子组件**:
- `SectionCard`: 通用卡片容器，带标题栏
- `WireframePreview`: SVG 线框图预览，根据模板类型渲染不同构图
- `KEYWORD_PATTERNS`: 实时识别 DIY 输入中的关键词 (场景/风格/姿势/角度等)

**核心交互**:
1. 策略摘要区只读展示 (从 Prep Hub 传入)
2. DIY 额外要求输入框支持自然语言，实时识别关键词高亮
3. 任务配额管理：+/- 调整每项资产生成数量 (1-10)
4. 模板预览区根据选中模板渲染 SVG 线框图
5. 执行设置区：模型选择 (3 选项) + 分辨率 (4 选项) + 高级参数 (折叠面板)
6. Credits 消耗实时计算 (模型单价 × 分辨率系数 × 数量)
7. 点击"开始策略化生产"按钮触发批量执行

**Store**: `useSandboxStore`
- 状态: `intents[]`, `executionConfig`, `quota`, `strategySummary`, `diyPrompt`, `recognizedKeywords`, `assetTasks[]`, `imageCount`, `selectedModel`, `selectedResolution`, `advancedParams`
- 操作: `addIntent`, `updateIntent`, `removeIntent`, `setExecutionConfig`, `setDiyPrompt`, `setImageCount`, `setSelectedModel`, `setSelectedResolution`, `setAdvancedParams`

**API 端点** (Sandbox):
| 函数 | 方法 | 路径 | 说明 |
|------|------|------|------|
| `compileIntent` | POST | `/api/v2/production/{productId}/intents` | 编译生成意图 |
| `listIntents` | GET | `/api/v2/production/{productId}/intents` | 列出所有意图 |
| `updateIntent` | PATCH | `/api/v2/production/{productId}/intents/{intentId}` | 更新意图 |
| `deleteIntent` | DELETE | `/api/v2/production/{productId}/intents/{intentId}` | 删除意图 |
| `executeIntents` | POST | `/api/v2/production/{productId}/execute` | 执行选中意图 |
| `getTaskQuota` | GET | `/api/v2/production/{productId}/quota` | 获取配额 |
| `getExecutionConfig` | GET | `/api/v2/production/{productId}/execution-config` | 获取执行配置 |
| `updateExecutionConfig` | PUT | `/api/v2/production/{productId}/execution-config` | 更新执行配置 |

### 4.4 WorkshopPage — 迭代工作坊 (930 行)

**路由**: `/products/:id/production/workshop`

**布局**: 12 列 grid (3 + 6 + 3) + 底部

| 区域 | 列数 | 功能 |
|------|------|------|
| 左栏 (3col) | 版本谱系 | 垂直时间轴，5 个版本节点，支持点击切换 |
| 中栏 (6col) | 变体矩阵 | 8 张变体卡片，多选 checkbox，网格/列表双视图 |
| 右栏 (3col) | 版本控制台 | 全局权重滑杆 + 高级微调折叠面板 |
| 底部 | AI 助手栏 | 自然语言输入优化指令 |

**子组件**:
- `VersionLineage`: 垂直时间轴 + 版本节点卡片 + 当前版本高亮
- `VariantCard`: 变体图片卡片 + checkbox + hover 操作栏
- `VariantGrid`: 网格/列表双视图 + 筛选排序工具栏
- `WeightControl`: 全局 SKU/Reference 权重滑杆 + 高级微调
- `ZoomModal`: 点击图片放大预览模态框
- `AiAssistantBar`: 底部自然语言输入栏

**核心交互**:
1. 版本谱系展示完整迭代历史 (V-init → V1.0 → V1.1 → V1.2)
2. 点击版本节点切换当前活跃版本
3. 变体矩阵支持多选 (checkbox) 和 hover 操作 (放大/下载)
4. 网格/列表双视图切换
5. 全局权重滑杆控制 SKU↔Reference 偏向
6. 高级微调：风格强度 + 身份一致性 + 创意自由度
7. 底部 AI 助手接受自然语言优化指令

**Store**: `useWorkshopStore`
- 状态: `variants[]`, `selectedVariantIds[]`, `inpaintTasks[]`, `activeRefinement`, `versionNodes[]`, `activeVersionId`, `weightParams`, `aiAssistantInput`
- 操作: `setVariants`, `toggleVariantSelection`, `setActiveVersionId`, `setWeightParams`, `appendRefinementMessage`

**API 端点** (Workshop):
| 函数 | 方法 | 路径 | 说明 |
|------|------|------|------|
| `listVariants` | GET | `/api/v2/production/{productId}/variants` | 列出生成变体 |
| `createInpaintTask` | POST | `/api/v2/production/{productId}/inpaint` | 创建局部重绘任务 |
| `getInpaintTask` | GET | `/api/v2/production/{productId}/inpaint/{taskId}` | 轮询重绘任务 |
| `getOrCreateRefinementSession` | POST | `/api/v2/production/{productId}/variants/{variantId}/refinement` | 创建/恢复精修会话 |
| `sendRefinementMessage` | POST | `/api/v2/production/{productId}/refinement/{sessionId}/messages` | 发送精修消息 |
| `finalizeAssets` | POST | `/api/v2/production/{productId}/finalize` | 确认交付资产 |

---

## 五、类型系统

### 5.1 V2 核心类型 (`src/types/production.ts`, 389 行)

**Prep Hub 层**:
- `ParsingSource` — 解析素材 (id, type, url, thumbnailUrl)
- `ParsedAttribute` — 解析属性 (key, label, value, confidence, source, driftBias)
- `DualTrackParsing` — 双轨解析结果 (comfyuiResult, thirdPartyResult, mergedAttributes, conflicts)
- `DecisionStep` — 交互式决策步骤 (id, title, options[], selectedOptionId, status)
- `LlmDecisionTreeResult` — 决策树结果 (steps[], recommendedActions[], overallConfidence)

**Sandbox 层**:
- `CompiledIntent` — 编译后的生成意图 (type, description, prompt, priority, status)
- `ExecutionConfig` — 执行配置 (provider, maxConcurrency, timeout)
- `SceneTemplate` — 场景模板 (id, category, aspectRatio, compositionRules)
- `AssetTask` — 资产任务 (name, sceneTag, templateId)
- `ModelOption` / `ResolutionOption` — 模型和分辨率选项
- `AdvancedParams` — 高级参数 (seed, negativePrompt, sampling, cfgScale, steps, highResFix)

**Workshop 层**:
- `AssetVariant` — 生成变体 (id, intentId, assetUrl, status, score)
- `InpaintTask` — 局部重绘任务 (variantId, regions[], prompt, status)
- `RefinementSession` — 精修会话 (messages[], isTyping)
- `VersionNode` — 版本节点 (version, description, skuBias, refBias, weightParams)
- `WeightParams` — 权重参数 (skuBias, styleStrength, identityConsistency, creativeFreedom)

### 5.2 通用类型

- `ToolDef` (`tool.ts`) — 工具定义 (id, slug, name, desc, category, complexity, tags)
- `SolutionDef` (`tool.ts`) — 解决方案定义
- `PricingPlan` (`tool.ts`) — 定价方案
- `ProductType` (`product.ts`) — 商品类型
- `CommercialType` (`commercial.ts`) — 商业化类型

---

## 六、状态管理

### 6.1 Zustand Store (生产管线)

三个独立 Store，各自管理一个页面的状态，互不干扰：

| Store | Hook | 管理范围 |
|-------|------|----------|
| Prep Hub | `usePrepStore` | 素材、解析结果、决策树、全局权重 |
| Sandbox | `useSandboxStore` | 意图列表、执行配置、配额、策略摘要、DIY Prompt、资产行 |
| Workshop | `useWorkshopStore` | 变体列表、选择状态、重绘任务、精修会话、版本节点、权重 |

每个 Store 都包含 `reset()` 方法，在切换产品时调用。

### 6.2 认证状态 (发布-订阅)

`src/state/auth.ts` 实现了轻量级发布-订阅模式（非 Zustand）：

- `getAuthState()` — 获取当前认证状态
- `subscribeAuth(listener)` — 订阅变化
- `applyAuth(payload)` — 设置认证状态（通知所有订阅者）
- `logoutAuth()` — 清除认证
- `refreshAuthSession()` — 刷新 Session

### 6.3 Toast Store

`src/store/toastStore.ts` — 全局 Toast 通知，支持 success / error / info 三种类型。

---

## 七、API 层

### 7.1 HTTP 封装 (`src/services/http.ts`)

- **Envelope 协议**: 所有 API 返回 `{ code, message, data, error?, error_hint? }`
- **自动 Token**: `request()` 自动从 localStorage 读取 `ecommerce_access_token` 注入 Bearer
- **401 处理**: 自动清除 Token 并跳转登录页（保留 redirect 参数）
- **错误 Toast**: 非 silent 请求自动弹出错误 Toast
- **`downloadBinary()`**: 专用二进制下载，自动触发浏览器下载

### 7.2 API Base URL (`src/services/apiBase.ts`)

```
开发: http://localhost:8396 (Vite proxy: /api/v1/ecommerce)
生产: https://api.agent-ecommerce.com (华为云)
```

### 7.3 V2 Production API 全景 (18 个端点)

| # | 端点 | 方法 | 所属页面 | 后端状态 |
|---|------|------|----------|----------|
| 1 | `/api/v2/production/{productId}/sources` | POST | Prep Hub | 待实现 |
| 2 | `/api/v2/production/{productId}/parse` | POST | Prep Hub | 待实现 |
| 3 | `/api/v2/production/{productId}/parse` | GET | Prep Hub | 待实现 |
| 4 | `/api/v2/production/{productId}/decision-tree` | POST | Prep Hub | 待实现 |
| 5 | `/api/v2/production/{productId}/decision-tree` | GET | Prep Hub | 待实现 |
| 6 | `/api/v2/production/{productId}/attributes/{key}` | PATCH | Prep Hub | 待实现 |
| 7 | `/api/v2/production/{productId}/intents` | POST | Sandbox | 待实现 |
| 8 | `/api/v2/production/{productId}/intents` | GET | Sandbox | 待实现 |
| 9 | `/api/v2/production/{productId}/intents/{id}` | PATCH | Sandbox | 待实现 |
| 10 | `/api/v2/production/{productId}/intents/{id}` | DELETE | Sandbox | 待实现 |
| 11 | `/api/v2/production/{productId}/execute` | POST | Sandbox | 待实现 |
| 12 | `/api/v2/production/{productId}/quota` | GET | Sandbox | 待实现 |
| 13 | `/api/v2/production/{productId}/execution-config` | GET | Sandbox | 待实现 |
| 14 | `/api/v2/production/{productId}/execution-config` | PUT | Sandbox | 待实现 |
| 15 | `/api/v2/production/{productId}/variants` | GET | Workshop | 待实现 |
| 16 | `/api/v2/production/{productId}/inpaint` | POST | Workshop | 待实现 |
| 17 | `/api/v2/production/{productId}/refinement/{sessionId}/messages` | POST | Workshop | 待实现 |
| 18 | `/api/v2/production/{productId}/finalize` | POST | Workshop | 待实现 |

> 所有 API 函数已实现完整前端逻辑，每个函数包含 `isDevMode()` 分支返回 Mock 数据。
> 后端只需按 Envelope 协议 `{ code: 0, data: ... }` 返回对应结构即可无缝对接。

### 7.4 后端对接指引

1. 每个生产 API 函数的 dev 分支返回的数据结构即为后端 `data` 字段的预期结构
2. 参考 `src/types/production.ts` 中的类型定义了解每个字段的含义
3. 参考 `src/mocks/productionDemo.ts` 了解具体的 Mock 数据示例
4. `uploadParsingSource` 使用 `FormData` 上传，非 JSON
5. 所有 API 需在 Header 中携带 `Authorization: Bearer <token>`

---

## 八、认证体系

### 8.1 认证流程

```
用户访问 → AuthBootstrap (监听 URL token/session)
  ├─ URL 含 token 参数 → 自动写入 localStorage
  ├─ localStorage 有 session → 恢复认证状态
  └─ 无 session → 未登录状态

RequireAuth 路由守卫:
  ├─ 已认证 → 渲染子页面
  ├─ 未认证 + 有 token → 尝试 refreshAuthSession
  └─ 未认证 + 无 token → 跳转登录页 (含 redirect 回调)
```

### 8.2 Dev Bypass (`?dev=1`)

- `RequireAuth.tsx`: `?dev=1` 时自动写入 mock session 到 localStorage
- `useAuth.ts`: dev bypass 模式下跳过 refreshAuthSession
- Mock 用户: `{ id: 'dev-user-001', email: 'dev@agent-ecommerce.com', name: 'Dev User' }`

---

## 九、国际化 (i18n)

### 9.1 配置

- `src/i18n/index.ts`: i18next 初始化，语言检测，fallback 链 (zh → en)
- `src/i18n/helpers.ts`: 翻译辅助函数

### 9.2 翻译文件

| 文件 | 语言 | 键数 | 说明 |
|------|------|------|------|
| `zh.ts` | 中文 | ~1500 | 包含 V2 生产管线约 100+ 键 |
| `en.ts` | 英文 | ~1500 | 与 zh.ts 一一对应 |

### 9.3 V2 翻译键命名规范

```
production.nav.prep          # 导航
production.prep.title        # 页面标题
production.prep.subtitle     # 页面副标题
production.prep.decisionTree # 模块名称
production.prep.skipDecisionTree    # 交互文案
production.prep.skipDecisionTreeConfirm  # 确认弹窗文案
```

---

## 十、样式体系

### 10.1 Tailwind v4 主题变量

定义在 `src/index.css` 的 `@theme` 块中：

| 变量 | 值 | 用途 |
|------|------|------|
| `--color-brand-*` | blue-50~900 | 主品牌蓝色系 |
| `--color-accent-*` | violet-400~600 | 强调紫色系 |

### 10.2 全局 CSS 类

| 类名 | 用途 |
|------|------|
| `.gradient-text` | 品牌渐变文字 (brand-300 → brand-400) |
| `.gradient-text-warm` | 暖色渐变文字 |
| `.btn-primary` | 主按钮 (品牌蓝背景) |
| `.btn-outline` | 描边按钮 |
| `.sidebar-item` | 侧栏链接项 |
| `.glow-orb` | 环境光效模糊球 |
| `.reveal` | 入场动画 (淡入上移) |

### 10.3 设计规范

- **背景色**: `bg-[#0a0a12]` (深色主题)
- **卡片背景**: `bg-white/[0.02]` ~ `bg-white/[0.04]`
- **边框**: `border-white/[0.06]` ~ `border-white/[0.12]`
- **文字**: `text-white` (主要) / `text-white/60` (次要) / `text-white/30` (辅助)
- **圆角**: `rounded-xl` / `rounded-2xl` (卡片) / `rounded-full` (标签)
- **间距**: 12 列 grid 系统，`gap-5` 为主间距

---

## 十一、二次开发指引

### 11.1 新增 V2 API 端点

1. 在 `src/types/production.ts` 定义请求/响应类型
2. 在 `src/services/production.ts` 添加 API 函数 (含 dev mock 分支)
3. 在 `src/mocks/productionDemo.ts` 补充 Mock 数据生成函数
4. 在页面组件中调用新 API

### 11.2 新增 V2 子模块

1. 在对应页面的 grid 布局中分配列数
2. 创建独立子组件文件
3. 按需扩展 Store 状态和 actions
4. 添加 i18n 翻译键 (zh.ts + en.ts)

### 11.3 接入真实后端

1. 修改 `src/services/apiBase.ts` 的 API_BASE_URL
2. 所有 API 函数已有完整类型定义和 dev mock 分支
3. 后端按 Envelope 协议 `{ code: 0, data: ..., message: "" }` 返回即可
4. 移除或保留 dev mock 分支（建议保留，方便本地开发调试）

### 11.4 ComfyUI 集成

项目预留了 ComfyUI 双轨解析架构：
- `ParsingTrack = 'comfyui' | 'third_party'`
- `ExecutionProvider = 'comfyui' | 'third_party_api'`
- ComfyUI Bridge 运行在 `localhost:8080`，经 frpc 映射到华为云
- 后端实现时需同时对接 ComfyUI 节点 API 和预留第三方 API 接口

---

## 十二、构建产物

```bash
npm run build   # 输出到 dist/
```

构建产物为纯静态资源 (HTML + JS + CSS)，可部署到：
- Nginx / Apache
- CDN (EdgeOne Pages)
- Docker 容器

SPA 路由需配置 fallback 到 `index.html`。
