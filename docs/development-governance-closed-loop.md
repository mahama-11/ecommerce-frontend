# Development Governance Closed Loop

This document is the operator map for the current Ecommerce frontend development governance. Its purpose is to keep improvements usable: every rule should have a trigger, a gate, evidence, and a place where humans can see the result.

## Closed-loop chain

```text
Requirement / bug report
  -> risk level: P0/P1/P2/P3
  -> executable acceptance matrix when user-visible or product-flow
  -> RED/GREEN regression or allowed post-change gate
  -> local frontend gate and generated evidence
  -> SelfCheck changed-file selector and feature gate
  -> PR / CI report artifact
  -> clean Cloud dev deploy with provenance
  -> merge / promote only after approval for prod
```

## Single source of truth by layer

| Layer | Source of truth | Main command / gate | Evidence |
| --- | --- | --- | --- |
| Requirement semantics | `docs/acceptance-tdd-governance.md`, `docs/templates/frontend-cta-acceptance-matrix.md` | `npm run acceptance:governance` | `reports/frontend-quality/acceptance-governance-latest.json`, `reports/frontend-quality/acceptance-matrix-latest.json` |
| Page role / IA | `docs/ecommerce-page-contracts.md`, `docs/ecommerce-page-position-registry.json` | `npm run page:position` | `reports/frontend-style-consistency/page-position-report.json` |
| Design system / style drift | `docs/ecommerce-design-system-rules.md`, `docs/design-system-registry.json` | `npm run frontend:gate` | `reports/frontend-style-consistency/automation-gate-latest.json` |
| Runtime layout / visual evidence | `scripts/ecommerce-frontend-visual-evidence.mjs`, `scripts/ecommerce-runtime-layout-gate.mjs` | `npm run frontend:gate` | `reports/frontend-style-consistency/evidence-manifest.json`, `reports/frontend-quality/runtime-layout-latest.json` |
| API / contract | `contracts/ecommerce.openapi.json`, `contract-adapter.config.json` | `npm run api:contract`, `npm run contract:*` | `reports/contract-governance/**` |
| SelfCheck business routing | `/root/work/agentic-selfcheck/config/v-business-gate-selector.yaml` | `scripts/v_business_gate_selector.py`, `scripts/v-requirement-gate.sh ...` | `/root/work/agentic-selfcheck/reports/**` |
| PR CI | `/root/work/v/.github/workflows/ecommerce-frontend-governance.yml` | GitHub Actions `Ecommerce Frontend Governance` | artifact `ecommerce-frontend-governance-reports` |
| Cloud dev deploy | `/root/work/v/tools/dev/README.md` | `tools/dev/ecommerce-frontend-dev-deploy.sh dev` or `tools/dev/deploy-cloud-dev-all.sh` | `/root/work/v/artifacts/cloud-dev/metadata/**`, container health |

## Rules that prevent drift

1. Do not add a rule that only lives in prose. Add a script/gate or an explicit checklist item consumed by an existing gate.
2. Do not add a new gate if an existing gate can own the rule with a smaller interface.
3. Do not refresh baselines to hide regressions. Baselines move down by burn-down, or up only with an accepted proposal.
4. Product-flow UI changes must have browser/runtime evidence, not only typecheck/build.
5. Dev deploys must be clean and provenance-backed by default; dirty deploy is only a labelled dev escape hatch.
6. Deploy and hook entrypoints must point to the workspace-level tools so agents do not choose parallel paths.

## Current audit notes

- The frontend loop is mostly closed: requirement semantics, page position, design system, visual evidence, API contract, SelfCheck routing, CI, and Cloud dev deploy all have machine-readable gates.
- Recent gap closed: product-scoped AI tool page `src/pages/ToolPage.tsx` is now explicitly routed to Ecommerce frontend style governance in SelfCheck, not only to the large-source locality guard.
- Deploy entrypoints now resolve to workspace Cloud dev/prod promotion tools, not repo-local alternatives.
- Git hook docs now point only to the workspace SelfCheck hook installer.

## Remaining deliberate gaps

1. `ci:quick` is intentionally heavier than `frontend:gate`; use `frontend:gate` during tight iteration and `ci:quick` for PR/release confidence.
2. Some historical baseline debt still exists; the rule is no increase plus burn-down, not instant zero.
3. SelfCheck is the business control plane, while frontend local gates are the fast verifier. They should remain connected through changed-file routing rather than duplicated one-for-one.
