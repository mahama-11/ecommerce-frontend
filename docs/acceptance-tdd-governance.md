# Agent Ecommerce 验收/TDD 分级治理

> 目标：把需求从「一句话解释」固化为可执行验收，再落到 TDD/BDD/Runtime Gate、CI/SelfCheck。这里不是照搬纯 TDD 教条，而是按风险分级执行。

## 需求语义 → 可执行验收 → TDD/BDD/Runtime Gate → CI/SelfCheck

所有非 trivial 变更进入实现前，先完成这条链路：

1. **需求语义**：用业务对象、用户动作、当前页面、目标页面、上下文、禁止结果描述需求；避免只写技术实现。
2. **可执行验收**：把需求改写成 Given / When / Then / And / Forbidden；验收必须能被脚本、Playwright、CDP 或 SelfCheck 读取。
3. **TDD/BDD/Runtime Gate**：按 P0/P1/P2/P3 风险选择测试先行或实现后 gate；P0 必须先 RED。
4. **CI/SelfCheck**：把稳定规则接入 `frontend:gate`、`governance:test`、runtime evidence、SelfCheck feature gate 和 PR checklist。

## P0/P1/P2/P3 分级策略

| 等级 | 适用范围 | 执行方式 | 最低证据 |
| --- | --- | --- | --- |
| P0 | Bug 修复、用户关键路径、Product Center/SKU/Visual Tools/Production/Workshop、付费/权限/导出/资产/生成任务、API contract/DTO adapter、返工过的问题、用户明确指出“没理解”的需求 | **acceptance_and_red_test_first**：先验收矩阵，先 RED 测试，再实现 | acceptance matrix、RED/GREEN 证据、runtime browser evidence、相关 gate |
| P1 | 新组件、表单、状态机、async polling、错误态、service adapter、数据投影 | **test_first_recommended**：默认先 unit/integration/BDD；如不先写，必须说明原因 | unit/integration 测试、typecheck/build、相关 gate |
| P2 | 文案替换、低风险样式调整、单页面轻微布局修复 | **gate_after_allowed**：可先实现后验证 | typecheck、build、frontend:gate；涉及渲染则 runtime layout/visual evidence |
| P3 | 视觉方向、原型、throwaway demo、设计对比 | **spike_allowed**：允许 spike，但生产化前补验收和测试 | spike 说明；进入生产前补 acceptance + core behavior test + visual/layout gate |

机器可读策略名：

```json
{
  "P0": { "mode": "acceptance_and_red_test_first" },
  "P1": { "mode": "test_first_recommended" },
  "P2": { "mode": "gate_after_allowed" },
  "P3": { "mode": "spike_allowed" }
}
```

## 三层 TDD/测试治理

### 第一层：语义验收先行（ATDD / BDD）

凡是用户可感知的业务行为，先写：

```text
Given 当前页面/状态
When 用户执行动作
Then 应该看到什么页面/结果
And 上下文如何生效
And 禁止出现什么
```

前端 CTA 示例：

```text
Given 用户在商品队列 /products
When 点击某 SKU 的“进入视觉工具中心”
Then 跳转到 /products/workbench/visual-tools
And URL 携带 productId 与 source=sku-queue
And 视觉工具中心选中该 SKU
And 不允许停留在 /products 顶部
```

### 第二层：模块级 TDD

稳定逻辑默认测试先行：

- route helper：`visualToolsCenterHref(productId)`
- DTO adapter / payload projection
- 状态机 / 权限判断
- async polling / 错误包装
- 生成任务状态转换

这类测试必须快，默认进入 `governance:test` 或项目 unit test。

### 第三层：Runtime / Browser Gate

用户真实路径必须用浏览器证据验证：

- 点击真实按钮；
- 最终 URL；
- 目标页面身份/主标题；
- 上下文是否生效（例如 SKU selector 选中）；
- console error / network failure；
- overflow / clipping / table 裁剪。

`HTTP 200`、`URL 包含 productId`、`typecheck/build` 都不能单独算 P0 PASS。

## 五个长期机制

### 机制一：需求进入实现前，先生成验收矩阵

模板见 `docs/templates/frontend-cta-acceptance-matrix.md`。P0/P1 前端业务需求必须填完：变更对象、用户动作、当前页面、目标页面、必须携带上下文、成功标志、禁止结果、验证方式。

### 机制二：每个 Bug 必须先变成回归测试

固定流程：

```text
1. 复现 bug
2. 写失败测试
3. 确认测试失败原因正确
4. 修复
5. 测试通过
6. 全量相关 gate
```

没有 RED/GREEN 证据的 Bug 修复只能报 `PARTIAL_PASS`，不能报 PASS。

### 机制三：前端 CTA / 路由类需求必须有 Browser 验收

验证必须覆盖：点击真实按钮、最终 URL、目标页面身份、上下文是否生效、console/network、布局是否裁剪。特别禁止只验证 helper 字符串或 query 参数。

### 机制四：测试绑定用户语义，不绑定实现细节

优先断言：

- 用户是否到了正确工作台；
- 目标 SKU 是否生效；
- 页面是否展示正确任务状态；
- 禁止留在错误页面、滚到顶部、展示内部术语。

避免只断言：函数被调用、className 存在、URL 包含某个参数。

### 机制五：SelfCheck / CI 加测试先行合规检查

`npm run acceptance:governance` 负责检查：

- docs/template 是否存在；
- changed files 是否命中 P0/P1；
- P0 是否有 acceptance matrix；
- P0 CTA/route 是否有 runtime evidence；
- 证据是否包含页面身份、上下文、生效结果、禁止结果。

SelfCheck 层必须能看到这个结果；PR checklist 必须引用同一套证据。

## 状态口径

- **PASS**：验收矩阵、RED/GREEN、runtime evidence、typecheck/build/frontend:gate/SelfCheck 都满足。
- **PASS_WITH_NOTES**：主路径真实通过，但有非用户可见、已记录的后续项。
- **PARTIAL_PASS**：只完成静态/unit/API，未完成真实行为验收。
- **FAIL**：变更路径失败。
- **BLOCKED**：环境、权限、外部服务阻止验证。

AI Agent 执行关键变更时，默认必须先写验收标准、先写 RED 测试、再实现、最后真实浏览器验证；没做到必须明示 `PARTIAL_PASS`。
