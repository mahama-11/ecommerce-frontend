# Ecommerce Soft Quality Issues

> 本文档承接 `docs/qa-coverage-improvement-plan.md` 第 6 节。状态含义：`OPEN` 未治理，`CONTROLLED` 已有检测/预算但仍需演进，`CLOSED` 已完成。

| ID | 状态 | 问题 | 风险 | 当前控制 | 下一步 |
|---|---|---|---|---|---|
| SQ-001 | OPEN | Dev mock delay 累积形成虚假性能基线 | 用户感知性能与真实后端不一致 | E2E evidence 记录 console/network；dashboard 跟踪该 debt | 给 mock delay 打 `[DEV-MOCK]` warning，并记录 mock/real API timing 差异。 |
| SQ-002 | OPEN | HTTP 层缺 timeout/retry/cancel | 慢请求卡死、组件卸载后请求继续 | 真实契约 preflight 已用 timeout；业务 E2E 捕获 network failures | 在 `src/services/http.ts` 增加默认 timeout 与 AbortSignal 支持。 |
| SQ-003 | CONTROLLED | Loading 状态不一致 | 用户体验不一致、无限 loading 难发现 | 新增 business E2E 覆盖 Chat/Tool/Inventory 等关键 loading/terminal state | 引入统一 Skeleton/Loading primitive，并补 runtime loading budget。 |
| SQ-004 | CONTROLLED | Error Boundary 覆盖不完整 | 单组件错误导致白屏 | `expectCleanEvidence` 抓 console error / Unexpected Application Error | 核心页面组件局部 ErrorBoundary + 负例测试。 |
| SQ-005 | OPEN | 分页/分段模型不一致 | 大列表前端假分页、内存和响应体不可控 | Mock schema contract 已覆盖 inventory/products 分页 envelope | 统一 `{items,total,page,pageSize,totalPages}` 或 cursor 模型。 |
| SQ-006 | CONTROLLED | Toast 错误提示缺上下文 | 用户不知道下一步操作 | 负例 business specs 已覆盖 auth/api failure 基础路径 | 错误码映射到用户行动文案和重试 CTA。 |

## 每周治理议程

1. 读取 `reports/frontend-quality/quality-dashboard-latest.json`。
2. 复盘失败/`PASS_WITH_NOTES` 项，确认是否新增 QA debt。
3. 检查 `docs/qa-debt.md` 的开放项是否有退出证据。
4. 抽查 business E2E trace/evidence：console/network 是否仍干净。
5. 更新本文件状态，关闭项必须附对应命令或报告路径。
