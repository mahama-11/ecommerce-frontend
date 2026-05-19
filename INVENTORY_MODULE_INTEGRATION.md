# 库存中心模块集成文档

> 适用于 `ecommerce-frontend` 仓库，合并到现有代码库。
> 以 GitHub `mahama-11/ecommerce-frontend` 为准，本地如有差异以 GitHub 为准。

---

## 一、模块概览

| 属性 | 值 |
|------|-----|
| 模块名 | 库存中心（Inventory Center） |
| 路由前缀 | `/inventory` |
| 布局组件 | `InventoryLayout`（独立侧边栏布局，不复用 `PortalLayout`） |
| 状态管理 | Zustand store (`inventoryStore`) |
| 服务层 | `@/services/inventory`（API 预留 + mock fallback） |
| 页面数量 | 7 个 |
| 代码总量 | ~1280 行（不含 Layout/Store/Service） |
| i18n | 中英文键已添加到 `en.ts`/`zh.ts` |
| 后端依赖 | 无（已预留 API 接口，mock 数据正常） |

### 页面清单

| 路由 | 页面文件 | 功能 |
|------|---------|------|
| `/inventory` | `InventoryDashboardPage` | 仪表盘：6 统计卡 + 最近活动 |
| `/inventory/replenishment` | `InventoryReplenishmentPage` | CSV 上传 → 配置 → 计算 → 结果（支持优先级） |
| `/inventory/products` | `InventoryProductManagePage` | SKU 列表：状态徽章 + 筛选 + 分页 |
| `/inventory/inbound` | `InventoryInboundPage` | FBA 入库记录追踪 |
| `/inventory/alerts` | `InventoryAlertsPage` | 低库存预警面板 |
| `/inventory/analysis` | `InventoryAnalysisPage` | 销售数据分析 |
| `/inventory/settings` | `InventorySettingsPage` | 系统设置 |

---

## 二、文件清单

### 2.1 类型定义
**文件**: `src/types/inventory.ts`（约 190 行）

```
导出类型：
- InventoryPlatform, FbaStatus, AlertLevel（枚举）
- InventoryStats          — 仪表盘统计数据
- InventoryProduct        — 库存商品（含 SKU/平台/库存/销量/预警）
- ReplenishmentRow        — 补货计算单行
- ReplenishmentCalc       — 补货计算完整结果
- ReplenishmentCalcInput  — 补货计算输入参数
- InboundRecord           — FBA 入库记录
- AlertRule               — 预警规则配置
- InventoryAlert          — 预警条目
- SalesDataPoint          — 销售数据点
- SalesAnalysis           — 销售分析汇总
- InventorySettings       — 系统设置
- InventoryFilter         — 筛选条件
- PaginatedResult<T>      — 分页结果
- CsvParseResult          — CSV 解析结果
- ExportFormat            — 导出格式枚举
```

**依赖**: 无（独立文件）

---

### 2.2 状态管理
**文件**: `src/store/inventoryStore.ts`（约 211 行）

```ts
// 使用方式
import { useInventoryStore } from '@/store/inventoryStore'

// state
stats, products, totalProducts, alerts, inboundRecords,
salesAnalysis, settings, calcHistory, currentCalc,
filter, loading*, calculating

// actions
loadStats, loadProducts, loadAlerts, loadInbound,
loadSales(period), loadSettings, loadCalcHistory,
calculateReplenishment(safeStockDays, replenishFactor, period),
saveCurrentCalc, clearCurrentCalc,
markAlertRead(alertId), saveSettings(settings),
setFilter(partial), resetFilter()
```

**依赖**: `@/types/inventory`, `@/services/inventory`

---

### 2.3 服务层
**文件**: `src/services/inventory.ts`（约 434 行）

```ts
// API 预留格式（后端实现后替换 mock 逻辑）
GET  /api/v1/ecommerce/inventory/stats
POST /api/v1/ecommerce/inventory/products
GET  /api/v1/ecommerce/inventory/replenishment
POST /api/v1/ecommerce/inventory/replenishment/calculate
POST /api/v1/ecommerce/inventory/csv/parse
GET  /api/v1/ecommerce/inventory/inbound
GET  /api/v1/ecommerce/inventory/alerts
PATCH /api/v1/ecommerce/inventory/alerts/:alertId/read
GET  /api/v1/ecommerce/inventory/sales?period=7d|30d|90d
GET  /api/v1/ecommerce/inventory/settings
PUT  /api/v1/ecommerce/inventory/settings

// 本地持久化（无需后端）
saveReplenishmentCalc(calc)   // localStorage 'inventory_calcs'
getStoredCalcs()              // localStorage 'inventory_calcs'
getInventorySettings()        // localStorage 'inventory_settings' fallback
saveInventorySettings()       // localStorage

// CSV 工具
parseCsv(text) → CsvParseResult
exportReplenishmentCsv(calc)
downloadTemplateCsv()

// 所有函数均有 try/catch，失败时返回 mock 数据，不阻塞 UI
```

**依赖**: `@/types/inventory`, `@/services/http`（`request()` 工具）

---

### 2.4 布局组件
**文件**: `src/layouts/InventoryLayout.tsx`（约 201 行）

```
- 独立全屏暗色布局（#0a0a12 背景）
- 左侧固定 240px 侧边栏（7 项导航 + 今日提醒卡片）
- 顶部条：面包屑 + 语言切换 + 登录/用户菜单
- 内容区：<Outlet /> 渲染子页面
- 侧边栏导航使用 NavLink + 自定义 match 函数
- 背景装饰：两个固定定位的模糊光效（cyan + emerald）
```

**侧边栏导航项**（`NAV_ITEMS`）：
| key | i18n key | 路由 |
|-----|---------|------|
| overview | `inventory.nav.overview` | `/inventory` |
| replenishment | `inventory.nav.replenishment` | `/inventory/replenishment` |
| products | `inventory.nav.products` | `/inventory/products` |
| inbound | `inventory.nav.inbound` | `/inventory/inbound` |
| alerts | `inventory.nav.alerts` | `/inventory/alerts` |
| analysis | `inventory.nav.analysis` | `/inventory/analysis` |
| settings | `inventory.nav.settings` | `/inventory/settings` |

**依赖**: `@/components/account/UserAccountMenu`, `@/hooks/useAuth`, `@/utils/authNavigation`, `react-router-dom`, `react-i18next`, `lucide-react`

---

### 2.5 页面组件（7 个）

| 文件 | 行数 | 主要功能 |
|------|------|---------|
| `src/pages/inventory/InventoryDashboardPage.tsx` | 270 | 统计卡（6个）+ 最近活动时间线 |
| `src/pages/inventory/InventoryReplenishmentPage.tsx` | 313 | CSV 导入 → 配置面板 → 计算 → 结果表格 + 优先级标签 + CSV 导出 |
| `src/pages/inventory/InventoryProductManagePage.tsx` | 160 | SKU 表格 + 平台/状态/预警级别筛选 + 排序 + 分页 |
| `src/pages/inventory/InventoryInboundPage.tsx` | 108 | FBA 入库 shipment 列表 + 状态筛选 |
| `src/pages/inventory/InventoryAlertsPage.tsx` | 144 | 预警列表 + 等级过滤 + 标记已读 |
| `src/pages/inventory/InventoryAnalysisPage.tsx` | 105 | 销售趋势数据 + 汇总指标 |
| `src/pages/inventory/InventorySettingsPage.tsx` | 180 | 参数配置（安全库存天数/补货系数/交期等）+ 保存 |

**所有页面均为 `export default` 组件**，使用 `useInventoryStore` 获取数据，在 `useEffect` 中触发 `load*` action。

---

## 三、路由集成

**文件**: `src/router/index.tsx`

### 动态 import 声明（已添加）

```tsx
const InventoryLayout       = lazy(() => import('@/layouts/InventoryLayout'))
const InventoryDashboardPage  = lazy(() => import('@/pages/inventory/InventoryDashboardPage'))
const InventoryReplenishmentPage = lazy(() => import('@/pages/inventory/InventoryReplenishmentPage'))
const InventoryProductManagePage = lazy(() => import('@/pages/inventory/InventoryProductManagePage'))
const InventoryInboundPage    = lazy(() => import('@/pages/inventory/InventoryInboundPage'))
const InventoryAlertsPage     = lazy(() => import('@/pages/inventory/InventoryAlertsPage'))
const InventoryAnalysisPage   = lazy(() => import('@/pages/inventory/InventoryAnalysisPage'))
const InventorySettingsPage   = lazy(() => import('@/pages/inventory/InventorySettingsPage'))
```

### 路由配置（直接添加到 router 数组，**无需 RequireAuth**）

```tsx
{
  path: '/inventory',
  element: <S><InventoryLayout /></S>,
  children: [
    { index: true, element: <S><InventoryDashboardPage /></S> },
    { path: 'replenishment', element: <S><InventoryReplenishmentPage /></S> },
    { path: 'products',       element: <S><InventoryProductManagePage /></S> },
    { path: 'inbound',        element: <S><InventoryInboundPage /></S> },
    { path: 'alerts',          element: <S><InventoryAlertsPage /></S> },
    { path: 'analysis',        element: <S><InventoryAnalysisPage /></S> },
    { path: 'settings',        element: <S><InventorySettingsPage /></S> },
  ],
},
```

> ⚠️ **关键**: `path: '/inventory'` 必须加在 layout route 上（不是 pathless），否则子路由 `/inventory/*` 无法正确解析。
>
> ⚠️ **认证**: 当前 `InventoryLayout` 内部会根据 `useAuth().isAuthenticated` 显示登录入口，但路由层**未用 RequireAuth 包裹**（开发绕过）。合并时如需权限控制，将整个 route 包入 `<RequireAuth>` 即可。

---

## 四、i18n 键（已添加）

### `src/i18n/en.ts` 键路径

```
nav.products           — "Products"（顶部导航）
nav.solutions          — "Solutions"
nav.pricing            — "Pricing"
nav.aboutUs            — "About Us"

inventory              — "Inventory"（解决方案页入口）
inventory.nav.overview — "Overview"
inventory.nav.replenishment — "Replenishment"
inventory.nav.products — "Products"
inventory.nav.inbound  — "Inbound"
inventory.nav.alerts   — "Alerts"
inventory.nav.analysis — "Analysis"
inventory.nav.settings — "Settings"
inventory.dashboard.*  — 各仪表盘文案
inventory.replenishment.* — 补货计算文案
inventory.products.*   — 商品管理文案
inventory.alerts.*     — 预警文案
inventory.analysis.*  — 销售分析文案
inventory.settings.*   — 设置页文案
```

> `zh.ts` 同等路径已添加（编码问题不影响使用）

---

## 五、顶部导航接入（待完成）

**目标**: 在 `PortalLayout` 顶部导航栏添加「库存中心」入口，与「产品中心」「任务中心」「模板中心」「交付中心」并列。

**参考设计**: 产品中心 `src/layouts/ProductWorkbenchLayout` 侧边栏的"库存中心"入口链接，路由为 `/inventory`。

**待操作**:
1. 读取 `PortalLayout.tsx`
2. 找到顶部导航 `NAV_ITEMS` 或类似配置
3. 添加 `{ key: 'inventory', label: t('nav.inventory'), to: '/inventory' }`
4. 同时在 `en.ts`/`zh.ts` 添加 `nav.inventory` 键

---

## 六、后端 API 约定

后端 API 需实现以下端点（路径前缀 `/api/v1/ecommerce/inventory`）：

| 方法 | 路径 | 请求体 / 参数 | 响应 |
|------|------|--------------|------|
| GET | `/stats` | — | `InventoryStats` |
| POST | `/products` | `InventoryFilter` | `PaginatedResult<InventoryProduct>` |
| GET | `/replenishment` | — | `ReplenishmentCalc[]` |
| POST | `/replenishment/calculate` | `{safeStockDays, replenishFactor, period}` | `ReplenishmentCalc` |
| POST | `/csv/parse` | `{csv: string}` | `CsvParseResult` |
| GET | `/inbound` | — | `InboundRecord[]` |
| GET | `/alerts` | — | `InventoryAlert[]` |
| PATCH | `/alerts/:id/read` | — | `void` |
| GET | `/sales?period=7d\|30d\|90d` | — | `SalesAnalysis` |
| GET | `/settings` | — | `InventorySettings` |
| PUT | `/settings` | `InventorySettings` | `void` |

> 所有端点均为**可选**。前端服务层 catch 后返回 mock 数据，不影响页面展示。

---

## 七、合入步骤

### 步骤 1：确认目标仓库 clean 状态

```bash
cd /path/to/ecommerce-frontend
git status  # 确保 working tree clean
git pull origin main  # 以 GitHub 为准
```

### 步骤 2：确认以下文件不存在冲突

```
src/types/inventory.ts          ← 新增，应无冲突
src/store/inventoryStore.ts     ← 新增，应无冲突
src/services/inventory.ts       ← 新增，应无冲突
src/layouts/InventoryLayout.tsx  ← 新增，应无冲突
src/pages/inventory/*.tsx       ← 新增目录，应无冲突
```

### 步骤 3：确认路由文件修改

`src/router/index.tsx` 已有以下内容（见上方"路由集成"），确认无冲突。

### 步骤 4：确认 i18n 文件修改

`en.ts` 和 `zh.ts` 中已添加 `inventory.*` 键。搜索 `inventory:` 确认无重复 key。

### 步骤 5：执行合并

```bash
# 从本项目复制文件到目标仓库
SRC=/Users/mac/WorkBuddy/20260427235250/ecommerce-frontend
DST=/path/to/your/ecommerce-frontend

cp $SRC/src/types/inventory.ts $DST/src/types/
cp $SRC/src/store/inventoryStore.ts $DST/src/store/
cp $SRC/src/services/inventory.ts $DST/src/services/
cp $SRC/src/layouts/InventoryLayout.tsx $DST/src/layouts/
cp $SRC/src/pages/inventory/*.tsx $DST/src/pages/inventory/

# 路由文件需手动比对合并（import + route 配置）
# i18n 文件需手动比对合并（inventory 键）
```

### 步骤 6：验证

```bash
cd $DST
npx vite --port 5180
# 访问 http://localhost:5180/inventory
# 应显示库存仪表盘
# 依次访问 /inventory/replenishment, /inventory/products 等
```

### 步骤 7：顶部导航接入（待完成）

按第五章所述，修改 `PortalLayout.tsx`。

---

## 八、已知限制

1. **无权限控制**: 当前 `/inventory` 路由未使用 `RequireAuth` 包裹（开发绕过），生产环境需添加。
2. **PortalLayout 顶部导航**: 「库存中心」链接尚未接入，需手动添加（见第五章）。
3. **后端未实现**: 所有 API 为预留结构，实际数据为 mock。切换到真实 API 只需修改 `src/services/inventory.ts` 中的 `request()` 调用路径。
4. **响应式**: 页面针对桌面端优化，移动端可能有布局问题。
5. **图片**: 商品列表中 `imageUrl` 字段预留，UI 中暂未渲染。
