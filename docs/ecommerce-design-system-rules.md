# Ecommerce Design System Rules

> P3 产物。统一按钮、暗色主题、页面骨架和业务语义组件；页面不能各自发挥。

## 设计系统底线

- 页面不能直接拼 UI primitives；优先使用业务语义组件。
- 禁止页面自写 `bg-black` / `hover:bg-*` / raw hex button。
- 禁止随机 dark surface：暗色背景、卡片、hover、border、文字灰阶必须来自 `src/styles/tokens.css` / `src/index.css` 中的 `--ecom-*` token。
- 禁止页面级重复 header/card/grid/shell；先选页面类型模板，再选共享 shell。
- 允许局部视觉表现，但必须不破坏页面层级、主业务对象、上游/下游和结果去向。

## 1. 按钮

统一入口：`src/components/ui/Button.tsx`。

- 主按钮：用于第一主行动。
- 次按钮：用于次级动作/浏览更多。
- 危险按钮：用于删除/高风险操作。
- 文本按钮：用于轻量导航。

禁止：页面内直接组合 `bg-black`、`bg-white`、`hover:bg-*`、raw hex、固定 `h-9 whitespace-nowrap` 伪装成业务卡片。

## 2. 暗色主题

统一 token：

- 背景：`--ecom-bg`
- Header：`--ecom-header-bg`
- Surface：`--ecom-surface`, `--ecom-surface-muted`, `--ecom-surface-raised`
- Hover/Active：`--ecom-surface-hover`, `--ecom-surface-active`
- Border：`--ecom-border`, `--ecom-border-strong`, `--ecom-border-bright`
- Text：`--ecom-text-primary`, `--ecom-text-secondary`, `--ecom-text-muted`, `--ecom-text-faint`
- Action：`--ecom-action-primary`, `--ecom-action-primary-hover`, `--ecom-action-primary-text`

## 3. 页面骨架

统一入口：`src/components/layout/`。

- `MarketingShell`：宣传/获客层。
- `WorkspaceShell`：工作台/业务入口层。
- `ObjectDetailShell`：对象详情层。
- `ProductionStationShell`：功能生产层。
- `SettingsShell`：管理/配置层。
- `LibraryManagementShell`：模板/素材/记录集合层。

页面选择 shell 前必须先确定 Page Contract 的 `pageType`。

## 4. 业务语义组件

统一入口：`src/components/product-composition/`。

- `ProductHeroStage`
- `VisualOutcomePreview`
- `ProductAssetStrip`
- `RecommendedToolRail`
- `GenerationActionDock`
- `WorkflowProgressRail`
- `ResultDestinationCard`
- `ToolCategoryCarousel`
- `SoftInspectorPanel`

这些组件承载 SKU / Asset / Task / Result / Workflow 语义；不能退化成普通卡片网格。

## 5. 页面类型使用规则

- Marketing Page：价值主张、效果展示、典型场景、信任证明、CTA。
- Workspace Home：当前业务概览、待处理对象、推荐下一步、最近产出、快捷入口。
- Object Detail：对象档案、完整度/风险、素材/资产、推荐任务、历史结果、下游动作。
- Production Station：当前对象、输入素材、推荐任务、预期输出、执行区、结果去向、下一步。
- Library / Management：筛选、集合视图、批量操作、详情预览、状态管理。
- Settings / Admin：分组设置、当前状态、编辑控制、保存/回滚、风险提示。

## 6. 验收标准

一个页面通过设计治理，必须同时满足：

1. 知道自己在全站哪个层级。
2. 知道主业务对象是什么。
3. 知道解决什么问题。
4. 知道上游和下游。
5. 使用对应页面类型模板。
6. 使用共享 shell / token / 业务组件。
7. 没有页面级自创按钮、暗色、卡片、hover。
8. 有真实浏览器截图证据。
9. 有 automation gate 防回退。
