# API Mock Sync Log

> Purpose: keep Playwright business mocks aligned with frontend service contracts and backend API shape. Mock handlers are offline regression fixtures only; prefer real frontend proxy/backend evidence whenever a safe dev/review lane is available. Update this file whenever `tests/e2e/support/harness.ts` or split mock handlers change.

| Date | Area | Mock file | Contract source | Notes |
|------|------|-----------|-----------------|-------|
| 2026-06-07 | Product / Listing / Production / Template / Commercial / Downloads / Inventory | `tests/e2e/support/harness.ts` | Current frontend service layer + business E2E needs | Baseline hand-maintained mock harness; inventory handlers added; future work should split by domain and add schema budget tests. |
| 2026-06-07 | Real-first QA policy | `scripts/ecommerce-real-contract-preflight.mjs`, `scripts/ecommerce-dev-live-mutating-qa.mjs`, `scripts/ecommerce-quality-dashboard.mjs` | `../docs/REAL_RUNTIME_CONTRACT_QA.md` | Default `ci:qa-gate` now runs authenticated real contract preflight and live mutating product/listing/export/download QA; missing fixture/live evidence fails the dashboard. Offline deterministic regression is kept as `ci:qa-gate:offline`. |
