# Frontend Quality Governance

This frontend uses automated gates instead of manual reminders. Existing debt can burn down, but new increments cannot make the baseline worse.

## P0/P1 status

P0 is complete and fail-closed:

1. `npm run lint:baseline` records current ESLint debt and blocks any new lint debt.
2. `docs/design-system-registry.json` is the component contract for shared primitives and variants.
3. Storybook is configured under `.storybook/` and currently covers `Button`, `Card`, `Input`, `Badge`, `Dialog`, and `EcomShell`.
4. `eslint-plugin-jsx-a11y` is enabled, and the static quality gate blocks icon-only buttons without an accessible label.

Because P0 is complete, P1 is also wired into `ci:quick`:

5. `npm run test:e2e` runs Playwright smoke checks for Product Center, Visual Tools, and Production Prep with deterministic auth/API mocks.
6. `npm run test:visual` runs Playwright screenshot diff against committed baselines for the same critical surfaces.
7. `npm run api:contract` generates frontend API types from `contracts/ecommerce.openapi.json` and fails when expected operations disappear.
8. `npm run bundle:budget` and `npm run lighthouse:budget` block silent bundle, performance, accessibility, and best-practices regressions.

## Governance layers

| Layer | Command | Policy |
| --- | --- | --- |
| Style consistency | `npm run style:consistency` | No raw dark hex utilities, bare buttons, ad-hoc hover/header colors, or random dark palettes may increase. |
| ESLint baseline | `npm run lint:baseline` | Existing ESLint debt is a ceiling; errors and rule-level counts cannot increase. |
| Static quality/a11y | `npm run quality:static` | Accessibility, focus, motion, inline style, and architecture findings cannot increase. |
| Design-system registry | `npm run design-system:check` | Core UI primitives, variants, and story-readiness stay machine-readable. |
| Storybook build | `npm run storybook:build` | Active components must compile in Storybook before CI passes. |
| Visual evidence | `npm run frontend:evidence` | Product Center / Production UI changes need generated screenshot evidence. |
| Playwright smoke | `npm run test:e2e` | Critical product routes must render authenticated workflow surfaces without runtime errors. |
| Playwright visual diff | `npm run test:visual` | Critical product route screenshots cannot drift unexpectedly. |
| API contract | `npm run api:contract` | Frontend API DTOs are generated from OpenAPI, not manually invented inside pages. |
| Bundle budget | `npm run bundle:budget` | Built JS/CSS assets must remain within explicit gzip budgets after `npm run build`. |
| Lighthouse budget | `npm run lighthouse:budget` | Preview build must satisfy performance/accessibility/best-practices thresholds. |
| Unified fast gate | `npm run frontend:gate` | Runs fast fail-closed governance checks and emits one JSON report. |
| CI quick gate | `npm run ci:quick` | Runs the full P0/P1 suite: frontend gate, typecheck, Storybook, build, bundle, API contract, Lighthouse, E2E, and visual diff. |

## Baseline policy

Baselines are committed under `scripts/` and `tests/e2e/*-snapshots/`:

- `scripts/ecommerce-style-consistency-baseline.json`
- `scripts/ecommerce-eslint-baseline.json`
- `scripts/ecommerce-static-quality-baseline.json`
- `scripts/ecommerce-bundle-budget-baseline.json`
- `tests/e2e/ecommerce.visual.spec.ts-snapshots/*.png`

Rules:

1. Baselines may only move downward unless an explicit proposal explains why the ceiling changed.
2. New files should not introduce new categories of debt.
3. If a page needs a new visual pattern, add it to shared tokens/components first.
4. Global style files require `reports/frontend-style-consistency/style-change-proposal.json` with rationale, scope, migration plan, affected surfaces, screenshots, and accepted decision.
5. Visual snapshots may be updated only with matching product-flow evidence and reviewed intent.

## Design-system registry

`docs/design-system-registry.json` is the machine-readable product UI contract. Active components must exist under `src/components/ui/`, define allowed variants, and have Storybook coverage.

Current active primitives:

- `Button`
- `EcomShell`
- `Input`
- `Card`
- `Badge`
- `Dialog`

Planned primitives:

- `Toast`
- `EmptyState`

## Recommended PR evidence

For frontend PRs include:

1. `npm run frontend:gate`
2. `npm run typecheck`
3. `npm run storybook:build`
4. `npm run build`
5. `npm run bundle:budget`
6. `npm run api:contract`
7. `npm run lighthouse:budget`
8. `npm run test:e2e`
9. `npm run test:visual`
10. Product-flow screenshot evidence when relevant
11. SelfCheck requirement gate result when the business-gate selector routes the change

## Reports

Generated latest reports are ignored by git and written under:

- `reports/frontend-style-consistency/`
- `reports/frontend-quality/`

SelfCheck consumes the unified gate report and mirrors summaries into workspace reports.
