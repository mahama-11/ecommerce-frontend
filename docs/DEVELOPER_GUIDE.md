# Agent Ecommerce Frontend Developer Guide

## 1. Purpose

This guide is owned by `v-ecommerce-frontend` and documents the current frontend implementation baseline for Agent Ecommerce.

The project is not a generic marketing site. It is a mixed frontend composed of:

- a portal layer for public pages
- a console layer for product workbenches
- multiple mock state flows that simulate cross-page business continuity

## 2. Tech Stack

- React 19
- Vite 8
- TypeScript 6
- Tailwind CSS v4
- React Router 7
- i18next + react-i18next
- lucide-react

## 3. Install And Run

Because `react-i18next` currently declares a TypeScript `^5` peer range while this project uses TypeScript 6, use the following install command:

```bash
cd /root/work/v/ecommerce-frontend
npm install --legacy-peer-deps
```

Common commands:

```bash
npm run dev
npm run frontend:gate
npm run frontend:evidence
npm run style:repair-queue
npm run lint
npm run typecheck
npm run ci:quick
python3 /root/work/agentic-selfcheck/scripts/install_v_continuous_governance_hooks.py --repo /root/work/v/ecommerce-frontend
```

`npm run ci:quick` is the default local preflight for frontend increments. It runs the full P0/P1 governance suite: automated frontend gate, TypeScript, Storybook, production build, bundle budget, API contract, contract diff / smoke / evidence, Lighthouse budget, Playwright smoke, and Playwright visual diff:

```bash
npm run ci:quick
```

The same loop is also wired into `.github/workflows/ecommerce-frontend-governance.yml` for PRs and `main` pushes touching `ecommerce-frontend/**`, `ecommerce-backend/**`, `tools/contract-governance/**`, `docs/governance/**`, the PR template, or the workflow itself. Treat the GitHub Actions artifact `ecommerce-frontend-governance-reports` as the review/release evidence bundle when the workflow runs remotely.

Frontend automation reports are written under `reports/frontend-style-consistency/`:

- `automation-gate-latest.json` / custom `--report`: changed-file classification, gate decision, style totals, evidence status.
- `evidence-manifest.json`: generated Chromium screenshot evidence for Product Center / Production surfaces.
- `style-drift-repair-queue.json`: prioritized burn-down queue for historical page-local styling.

Product Center / Production page UI changes should use `npm run frontend:gate`; it auto-generates screenshot evidence when needed unless `--no-auto-evidence` is passed.

## 4. Project Structure

```text
src/
  components/        Shared UI pieces such as drawers
  i18n/              Translation resources and i18n bootstrap
  layouts/           Portal and console shells
  mock/              Mock workflow state, page records, and localStorage bridges
  pages/             Route-level pages and workbenches
  router/            Router definition
  types/             Shared frontend types
```

## 5. Layout Model

### 5.1 Portal Layout

`src/layouts/PortalLayout.tsx` is used for public-facing pages such as:

- `/`
- `/pricing`
- `/aboutus`
- `/help`
- `/api-docs`
- `/blog`
- `/contact`

Portal pages should:

- keep scroll behavior on the document body
- avoid hidden full-screen scroll containers unless they are conditionally rendered
- preserve strong visual hierarchy on mobile and desktop

### 5.2 Console Layout

`src/layouts/ConsoleLayout.tsx` is used for workbench pages such as:

- `/chat`
- `/aiChat/*`
- `/database/*`
- `/draw/*`
- `/settings/*`

Console pages should:

- assume dense product information
- provide mobile-first fallbacks for sidebars and action groups
- avoid horizontal crowding in headers and tool panels

### 5.3 Account And Org Layouts

`src/layouts/AccountLayout.tsx` and `src/layouts/OrgLayout.tsx` now own the detached user-center and organization-management surfaces.

Current account and org routes include:

- `/account/profile`
- `/account/assets`
- `/account/history`
- `/account/templates`
- `/account/billing`
- `/account/promotion`
- `/account/commission`
- `/account/downloads`
- `/org/overview`

Legacy settings-style entry routes such as `/settings/profile`, `/settings/personal`, `/settings/organization`, `/orderList`, and `/downloadCenter` currently redirect into these dedicated pages.

## 6. Route And Page Conventions

### 6.1 Public Pages

Public pages should be implemented as dedicated route pages instead of generic placeholders when they represent a long-lived product surface.

Current dedicated public pages include:

- Home
- Pricing
- About Us
- Help Center
- API Docs
- Blog
- Changelog
- Contact
- Careers
- Privacy
- Terms

### 6.2 Console Workbenches

Console routes are grouped by domain:

- AI chat and operations
- Template market and template library
- Data libraries and commerce
- Visual production chain
- Settings and organization management

When a route becomes product-critical, prefer a dedicated page over a generic shell.

## 7. Mock State Strategy

This frontend currently uses multiple local mock modules to simulate product continuity before backend integration is finished.

Key files:

- `src/mock/data.ts`: navigation, tools, and static portal data
- `src/mock/templateLibrary.ts`: saved template localStorage bridge
- `src/mock/assetCommerce.ts`: upload, order, and legacy delivery mock data
- `src/mock/designWorkbench.ts`: design-task and design-asset state
- `src/mock/opsWorkbench.ts`: operations records
- `src/mock/workflowBridge.ts`: cross-page workflow feed and design/template/delivery links

Guidelines:

- keep cross-page mock writes in dedicated helper files
- do not scatter raw `localStorage` calls across route pages
- prefer route-specific readers on top of shared state helpers
- do not use mock delivery bundles as the source of truth for `/account/downloads`; that page is now backed by real product export APIs

## 8. Real API Integration

The frontend now contains two product-facing API clients that should be preferred when the backend routes are available:

- `src/services/templateCenter.ts`: template catalog, detail, favorite, copy, and use-now flows
- `src/services/imageRuntime.ts`: source asset registration, image job creation, job polling, and asset preview loading
- `src/services/auth.ts`: login, register, password reset, and token lifecycle
- `src/services/http.ts`: shared authenticated request helper with token-invalid redirect handling
- `src/services/commercial.ts`: wallet, billing, promotion, commission, and channel-commercial APIs

Shared UX infrastructure used by these real integrations:

- `src/store/toastStore.ts`: global success/error toast state
- `src/components/Toast.tsx`: top-level toast rendering mounted from `src/main.tsx`

Authenticated product API rule:

- prefer `src/services/http.ts` for JSON requests that depend on product login state
- `401 / TOKEN_INVALID` responses must clear local auth state and redirect to `/login`
- avoid adding new authenticated `fetch(...)` wrappers that bypass the shared auth-expiration behavior

Current real image runtime routes used by `src/pages/ToolPage.tsx`:

- `POST /api/v1/ecommerce/assets/source`
- `GET /api/v1/ecommerce/image-jobs`
- `POST /api/v1/ecommerce/image-jobs`
- `GET /api/v1/ecommerce/image-jobs/:jobID`
- `GET /api/v1/ecommerce/assets/:assetID/content`
- product-scoped AI workspace requests must include `product_id` and `sku_code`; AI generation is no longer allowed without a bound product
- product-scoped history should prefer `GET /api/v1/ecommerce/image-jobs?productID=...` so the page only shows jobs for the current SKU
- source uploads and generated results are now expected to flow back into the selected product asset set instead of living as isolated runtime-only assets

Current real template center routes used by `src/pages/AgentTemplateMarketPage.tsx` and `src/pages/ToolPage.tsx`:

- `GET /api/v1/ecommerce/template-center/catalog`
- `GET /api/v1/ecommerce/template-center/catalog/facets`
- `GET /api/v1/ecommerce/template-center/catalog/recommendations`
- `GET /api/v1/ecommerce/template-center/catalog/:templateId`
- `POST /api/v1/ecommerce/template-center/catalog/:templateId/favorite`
- `DELETE /api/v1/ecommerce/template-center/catalog/:templateId/favorite`
- `POST /api/v1/ecommerce/template-center/catalog/:templateId/copy`
- `POST /api/v1/ecommerce/template-center/catalog/:templateId/use`

Current real commercial routes used by account and commerce pages:

- `GET /api/v1/ecommerce/wallet/summary`
- `GET /api/v1/ecommerce/wallet/history`
- `GET /api/v1/ecommerce/commercial/offerings`
- `POST /api/v1/ecommerce/commercial/orders`
- `GET /api/v1/ecommerce/commercial/orders`
- `GET /api/v1/ecommerce/commercial/orders/:orderID`
- `POST /api/v1/ecommerce/commercial/orders/:orderID/confirm-payment`
- `GET /api/v1/ecommerce/billing/summary`
- `GET /api/v1/ecommerce/billing/charges`
- `GET /api/v1/ecommerce/promotions/programs`
- `GET /api/v1/ecommerce/promotions/me/overview`
- `GET /api/v1/ecommerce/promotions/me/codes`
- `POST /api/v1/ecommerce/promotions/me/codes/ensure`
- `POST /api/v1/ecommerce/promotions/me/codes`
- `GET /api/v1/ecommerce/promotions/me/conversions`
- `GET /api/v1/ecommerce/commissions/me/overview`
- `GET /api/v1/ecommerce/commissions/me/referrals`
- `POST /api/v1/ecommerce/commissions/me/referrals/redeem`
- `GET /api/v1/ecommerce/commissions/me/channel/overview`
- `GET /api/v1/ecommerce/commissions/me/channel/bindings`
- `GET /api/v1/ecommerce/commissions/me/channel/commissions`
- `GET /api/v1/ecommerce/commissions/me/channel/settlements`

Current real product-center and download-center routes used by product and account pages:

- `GET /api/v1/ecommerce/products`
- `POST /api/v1/ecommerce/products`
- `GET /api/v1/ecommerce/products/:product_id`
- `PATCH /api/v1/ecommerce/products/:product_id`
- `PATCH /api/v1/ecommerce/products/:product_id/status`
- `DELETE /api/v1/ecommerce/products/:product_id`
- `GET /api/v1/ecommerce/products/:product_id/assets`
- `POST /api/v1/ecommerce/products/:product_id/assets`
- `DELETE /api/v1/ecommerce/products/:product_id/assets/:asset_relation_id`
- `GET /api/v1/ecommerce/products/:product_id/listing-versions`
- `POST /api/v1/ecommerce/products/:product_id/listing-versions`
- `POST /api/v1/ecommerce/products/listing-versions/batch`
- `POST /api/v1/ecommerce/products/:product_id/listing-versions/adopt`
- `POST /api/v1/ecommerce/products/listing-versions/batch-adopt`
- `PATCH /api/v1/ecommerce/products/:product_id/listing-versions/:version_id`
- `DELETE /api/v1/ecommerce/products/:product_id/listing-versions/:version_id`
- `GET /api/v1/ecommerce/products/:product_id/profit-snapshots`
- `POST /api/v1/ecommerce/products/:product_id/profit-snapshots/calculate`
- `GET /api/v1/ecommerce/products/:product_id/export-tasks`
- `POST /api/v1/ecommerce/products/:product_id/export-tasks`
- `PATCH /api/v1/ecommerce/products/:product_id/export-tasks/status`
- `GET /api/v1/ecommerce/products/:product_id/parsed-info`
- `GET /api/v1/ecommerce/products/:product_id/prompts`
- `POST /api/v1/ecommerce/products/:product_id/prompts`
- `POST /api/v1/ecommerce/products/:product_id/prompts/generate`
- `GET /api/v1/ecommerce/downloads`
- `GET /api/v1/ecommerce/downloads/:download_id/content`

Template center UX baseline:

- list cards render `coverAssetUrl`
- detail drawer renders `examples[].previewAssetUrl`
- drawer scroll is isolated from the background list scroll
- `Use Now` and in-tool template switching must overwrite the active prompt/template state only once per payload
- `/account/downloads` should prefer the real download-center aggregation over mock `DELIVERY_ITEMS`
- binary downloads behind authenticated routes should use the shared request auth headers instead of naked browser navigation to protected URLs
- download-center cards should expose enough product/export context for traceability, including linked asset count and manifest snippets when available
- the primary visual-production entry is now product-centric: `src/layouts/ProductWorkbenchLayout.tsx` + `src/pages/ProductVisualToolsPage.tsx` route users through `/products/workbench/visual-tools` before entering a tool
- `/products` no longer renders inside `src/layouts/ConsoleLayout.tsx`; product center now owns its own standalone shell, sidebar, top bar, and internal navigation instead of sharing the generic tool console menu
- `src/pages/ToolPage.tsx` is now a pure product-scoped AI workspace mounted at `/products/:productId/ai/:toolSlug`; legacy `/draw/:toolSlug` no longer hosts the real page and only redirects into the product workbench
- `/products/workbench/batch-listing` is now the canonical batch-listing route inside product center; `/aiChat/batchListing` only redirects for backward compatibility
- `src/pages/product/ProductListPage.tsx` is no longer a card-only placeholder; it now serves as a table-first product workbench with row selection, column toggles, right-side quick preview, and spreadsheet-based batch import
- batch import in product workbench uses client-side `xlsx` parsing and reuses the real create-product API row by row so validation failures stay isolated instead of blocking the full import; the parser is now lazy-loaded to avoid inflating the initial product-workbench bundle
- product detail listing cards now wire the `Adopt` action to the real product-center API instead of leaving it as a dead button
- product detail listing cards now also wire the `Edit` action to a real modal + patch request, so version maintenance is no longer read-only after generation
- product detail `Generate Assets` now enters the product-scoped visual workspace instead of leaving the user inside an isolated tool universe
- `src/pages/product/ProductDetailPage.tsx` now exposes inline metadata editing for SKU/title/category/brand/currency/tags and persists changes through blur-triggered product patch requests
- product-detail tab workbench sections are split into `src/pages/product/components/ProductDetailTabs.tsx`, where assets/listings/profit/exports/history now evolve independently instead of staying embedded in one monolithic page file

## 9. Frontend Automation Gates

Frontend consistency is enforced by scripts, not by reviewer memory.

Default preflight:

```bash
npm run ci:quick
```

This runs:

1. `npm run frontend:gate`
2. `npm run typecheck`
3. `npm run storybook:build`
4. `npm run build`
5. `npm run bundle:budget`
6. `npm run api:contract`
7. `npm run lighthouse:budget`
8. `npm run test:e2e`
9. `npm run test:visual`

`npm run frontend:gate` performs the automated product-frontend guard:

- runs `scripts/ecommerce-style-consistency.mjs`
- runs `scripts/ecommerce-eslint-baseline-gate.mjs` so existing lint debt cannot increase
- runs `scripts/ecommerce-static-quality-gate.mjs` so accessibility/focus/motion/architecture findings cannot increase
- runs `scripts/ecommerce-design-system-registry-gate.mjs` so shared UI primitives and component standardization stay machine-readable
- runs `scripts/ecommerce-api-contract-gate.mjs` so frontend API DTOs stay generated from `contracts/ecommerce.openapi.json`
- writes machine-readable reports under `reports/frontend-style-consistency/` and `reports/frontend-quality/`
- blocks any style-consistency or quality-baseline failure
- classifies changed files from git diff
- blocks Product Center / Production UI changes unless visual evidence exists for non-shared-design-system page work
- blocks global style changes to `src/index.css`, `Button`, or `EcomShell` unless an accepted style-change proposal exists

For Product Center / Production UI changes that are not only shared token/component updates, provide:

```text
reports/frontend-style-consistency/evidence-manifest.json
```

The manifest must include local screenshots and a `PASS`, `ACCEPTED`, or `ACCEPTED_WITH_NOTES` decision. This keeps C/D-risk product-flow changes from being reported complete without visible evidence.

Business interaction QA adds a P0 browser/API-readback selector layer on top of the static frontend gate. For changes touching `src/services/auth.ts`, `src/services/http.ts`, `src/services/product.ts`, `src/services/production.ts`, `src/pages/product/**`, `src/pages/production/**`, `src/pages/account/AccountDownloadsPage.tsx`, router/contract/generated API files, run:

```bash
npm run qa:changed-flow
npm run qa:report
```

Artifacts:

- `tests/e2e/support/selectors.ts`: stable P0 `data-testid` registry and internal-copy scan patterns.
- `tests/e2e/support/harness.ts`: deterministic business runtime harness for local browser gates; live fixtures must still be called out before claiming full backend/provider PASS.
- `tests/e2e/business/*.business.spec.ts`: P0 Auth, Product create/list/detail, product-scoped production entry, Prep/Sandbox/Workshop selector/copy readiness, Listing/Export/Download selector gates.
- `scripts/ecommerce-business-qa-selector.mjs`: changed-file selector + selector registry validation.
- `scripts/ecommerce-business-qa-report.mjs`: evidence JSON writer under `reports/business-interaction-qa/business-qa-report.json`.

Status discipline from `docs/business-interaction-qa-design.md` applies: browser actions with deterministic mocks are `PASS_WITH_NOTES`; live product/provider/export closure requires safe fixture ownership and cleanup evidence before reporting full `PASS`.

For global style evolution, provide:

```text
reports/frontend-style-consistency/style-change-proposal.json
```

The proposal must include rationale, scope, affected surfaces, migration plan, local visual evidence, and an accepted/approved decision. This allows the unified style to evolve without letting one page silently fork the product style.

Style drift policy:

- historical drift is recorded in `scripts/ecommerce-style-consistency-baseline.json`
- new drift cannot be added
- existing drift counts cannot increase
- baseline refresh is allowed only when a migration intentionally reduces old page-local styling

## 10. Internationalization

All user-visible text should be localized through:

- `src/i18n/zh.ts`
- `src/i18n/en.ts`

Rules:

- do not hardcode visible copy in route pages unless it is temporary during development
- translate data-driven labels, not only JSX literals
- when adding a new page, add both Chinese and English entries in the same change

## 10. Responsive Design Rules

The project currently serves both desktop console and H5 demo scenarios. Therefore:

- prefer stacked headers on mobile over compressed horizontal rows
- allow action buttons to become full-width on small screens
- keep sidebar behavior explicit between desktop and mobile modes
- avoid always-mounted hidden full-screen layers with their own scroll containers
- test dense pages such as tool workbenches, console headers, result lists, and drawers on narrow widths

## 11. Documentation And Change Hygiene

Whenever you change any of the following, update docs in the same change set:

- route structure
- layout behavior
- navigation groups
- mock workflow bridges
- deployment and install commands

Relevant docs for this project:

- `README.md`
- `AGENTS.md`
- `docs/GIT_HOOKS.md`
- `docs/DEVELOPER_GUIDE.md`
- `docs/business-interaction-qa-design.md`
- `docs/architecture/PROJECT_SKELETON.md`
