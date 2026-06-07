# Ecommerce QA Debt

> 更新原则：新增缺口必须有负责人/触发条件/退出标准；已被测试覆盖的项移动到“已关闭”。本文件服务 `npm run qa:quality-dashboard`。

## 当前开放债务

| ID | 优先级 | 类型 | 范围 | 现状 | 退出标准 |
|---|---|---|---|---|---|
| QA-DEBT-001 | P1 | 真实契约 | ecommerce backend real API | 已新增 `npm run test:contract:real` real-first 入口；当前无真实后端时 dashboard 只能 `PASS_WITH_NOTES`，设置 `ECOMMERCE_QA_REQUIRE_REAL=1` 会 fail-closed。 | Dev/review lane 提供 `ECOMMERCE_REAL_CONTRACT_BASE_URL` 和必要 token 后，非破坏性 real contract smoke 返回 authenticated `PASS`；关键 mutation 再跑 `npm run qa:business:live` 并保留 cleanup 证据。 |
| QA-DEBT-002 | P1 | Mock 隔离 | `tests/e2e/support/harness.ts` | Business runtime 已强制 `workers: 1`，避免共享 mock/evidence 竞态。 | mock state/evidence path 按 worker 隔离后恢复并行，并连续两轮 business suite 通过。 |
| QA-DEBT-003 | P2 | 软性质量 | API timeout/loading/error boundary/pagination | 已记录到 `docs/soft-quality-issues.md`，dashboard 跟踪治理入口。 | 对每个问题补预算或 gate，并在 quality dashboard 中由 `OPEN` 转 `CONTROLLED`/`CLOSED`。 |

## 已关闭

| ID | 关闭证据 |
|---|---|
| QA-CLOSED-001 | Vitest/RTL 基础设施已接入；`npm run test:unit:coverage` 通过，utils/store 阈值 ≥ 60%。 |
| QA-CLOSED-002 | P0/P1 缺口 business E2E 已新增：chat/design/ops/tool/inventory replenishment/inventory alerts/account profile；新增 16 个 case 本地通过。 |
| QA-CLOSED-003 | Mock schema contract 已新增；`npm run test:contract` 覆盖 auth/template/commercial/product/listing/export/production/image/inventory endpoint 并通过。 |
| QA-CLOSED-004 | 核心组件测试已新增：`DecisionStepCard`、`VersionLineageItem`、`ResultAssetCard`。 |
