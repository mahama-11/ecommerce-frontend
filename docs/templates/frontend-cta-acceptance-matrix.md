# 前端 CTA / 路由验收矩阵模板

> 用于 Product Center / SKU / Visual Tools / Production / Workshop 等前端业务入口。目标是先固定“用户语义”，再写测试和实现。

## 基础字段

```text
变更对象：
用户动作：
当前页面：
目标页面：
目标页面身份：
必须携带上下文：
成功标志：
禁止结果：
验证方式：
风险等级：P0 | P1 | P2 | P3
RED 测试命令：
GREEN 测试命令：
Runtime Evidence：
SelfCheck / CI Gate：
```

## BDD 写法

```text
Given <当前页面/状态>
When <用户点击/输入/提交>
Then <最终页面/结果>
And <上下文如何生效>
And <页面身份/主标题/关键业务对象可见>
And <console/network/layout 无阻断问题>
Forbidden <禁止停留、跳错、滚到顶部、丢上下文、展示内部术语>
```

## Product Center 示例

```text
变更对象：SKU 队列第三个 CTA
用户动作：点击“进入视觉工具中心”
当前页面：/products
目标页面：/products/workbench/visual-tools
目标页面身份：视觉工具中心 / 商品视觉创作站
必须携带上下文：productId, source=sku-queue
成功标志：视觉工具中心显示，selector 选中该 SKU
禁止结果：停留 /products 顶部；只滚动/聚焦队列；跳到 /products/{id}；URL 只有 productId 但页面身份错误
验证方式：Playwright/CDP 点击真实按钮 + URL + 目标页面 heading + selector value + console/network + overflow
风险等级：P0
RED 测试命令：node --test tests/governance/product-center-governance.test.mjs
GREEN 测试命令：node --test tests/governance/product-center-governance.test.mjs && npm run frontend:gate
Runtime Evidence：reports/frontend-style-consistency/evidence-manifest.json
SelfCheck / CI Gate：ecommerce-frontend-style-governance static
```

## JSON artifact 建议

当 P0/P1 变更需要机器读取时，写入：

```text
reports/frontend-quality/acceptance-matrix-latest.json
```

最小字段：

```json
{
  "status": "PASS",
  "change_object": "SKU queue third CTA",
  "user_action": "click 进入视觉工具中心",
  "current_page": "/products",
  "target_page": "/products/workbench/visual-tools",
  "required_context": ["productId", "source=sku-queue"],
  "success_signal": "视觉工具中心显示并选中该 SKU",
  "forbidden_result": "停留 /products 顶部",
  "verification": "Playwright click + URL + page identity + selector value",
  "red_green_evidence": {
    "red": "failed before fix",
    "green": "passed after fix"
  }
}
```

验收原则：目标页面身份和上下文生效是必须项；只验证 URL 形状不合格。
