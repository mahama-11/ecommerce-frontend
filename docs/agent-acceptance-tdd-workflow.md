# AI Agent 验收/TDD 执行流程

本流程约束 AI Agent 在 Agent Ecommerce 前端关键变更中的默认行为，防止“解释合理但业务语义错”。

## 默认流程

1. **需求语义复述**：先把用户话翻译成业务对象、当前页面、目标页面、上下文、禁止结果。
2. **验收矩阵**：P0/P1 先填 `docs/templates/frontend-cta-acceptance-matrix.md` 对应字段；必要时写入 `reports/frontend-quality/acceptance-matrix-latest.json`。
3. **RED 测试**：Bug 修复、关键路径、返工问题必须先写失败测试并运行确认失败原因正确。
4. **GREEN 实现**：只做让验收通过的最小实现，避免顺手重构业务语义。
5. **Runtime 验收**：前端 CTA/路由/布局/生成链路必须有真实浏览器或 CDP 证据。
6. **CI/SelfCheck**：运行 `npm run acceptance:governance`、`npm run governance:test`、`npm run frontend:gate`，需要时运行 SelfCheck feature gate。
7. **汇报状态**：未完成真实行为验收时只能报 `PARTIAL_PASS`。

## P0 硬约束

命中以下情况，不允许直接改生产代码：

- Bug 修复；
- 用户关键路径；
- Product Center / SKU / Visual Tools / Production / Workshop；
- 付费、权限、导出、资产、生成任务；
- API contract / DTO adapter；
- 以前已经返工过的问题；
- 用户明确指出“你没理解”的需求。

P0 必须保留：

```text
验收矩阵 → RED 测试输出 → GREEN 测试输出 → Runtime Evidence → CI/SelfCheck 输出
```

## 汇报口径

```text
PASS：验收、RED/GREEN、runtime、CI/SelfCheck 均完成。
PASS_WITH_NOTES：主路径通过，剩余非阻断且已记录。
PARTIAL_PASS：静态/unit/API 过了，但真实行为验收未完成。
FAIL：用户路径失败。
BLOCKED：环境/权限/外部服务阻断。
```

## 禁止事项

- 只说“我会验证”但不运行工具。
- 只跑 typecheck/build 就说前端交互 PASS。
- 只验证 URL 包含 `productId`，不验证目标页面身份和 selector 上下文。
- 把同页 scroll/focus 当成进入下游工作台。
- 用实现细节替代用户语义验收。
