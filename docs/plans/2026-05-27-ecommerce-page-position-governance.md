# Ecommerce Page Position Governance Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task when moving from planning to code landing.

**Goal:** Stop Ecommerce frontend pages from being designed independently by adding an internal page-position registry, page-type patterns, business backbone contracts, and fail-closed frontend gates.

**Architecture:** This is an internal governance layer, not a user-facing sitemap. The user-facing product only receives clearer navigation, breadcrumbs, object context, next-step cues, and result destinations. Enforcement is through docs + machine-readable manifests + scripts wired into `npm run frontend:gate`.

**Tech Stack:** React Router, Vite, Node ESM governance scripts, `node --test`, existing `frontend:gate`, existing visual/runtime/style gates.

---

## Non-goals

- Do not create a visible “full site map” page for customers.
- Do not redesign every route in this phase.
- Do not turn functional pages into marketing homepages.
- Do not bypass existing `frontend-style-governance`, `frontend-product-ia-governance`, `product-ux-visual-backbone`, or `visual:composition` gates.

## Product principle

Every route must answer:

```text
Where am I in the product?
What business object am I working on?
What problem does this page solve?
What came before this page?
What happens after this page?
Which page-type pattern should constrain its design?
```

Internal governance decides page role. User-facing UI only shows useful context: navigation, breadcrumb/stepper, current SKU/Product context, primary next action, output destination.

---

## Page type taxonomy

Use this fixed vocabulary in the registry:

```text
marketing-page        Public acquisition / value explanation
workspace-home        Logged-in business entry and triage
object-detail         Single SKU/Product/Listing/Asset dossier
production-station    Execute one business production task
library-management    Browse/manage reusable assets, templates, records
settings-admin        Configure account/org/system settings
redirect-legacy       Historical route redirected to canonical route
utility-support       Help, docs, legal, auth, support
```

---

## Task 1: Add machine-readable page-position registry

**Objective:** Create the source of truth for route role, page type, business object, upstream/downstream, allowed design pattern, and user-facing context expectations.

**Files:**
- Create: `docs/ecommerce-page-position-registry.json`
- Modify: `docs/frontend-product-ia-governance.md`

**Registry shape:**

```json
{
  "schemaVersion": "1.0.0",
  "productBackbone": {
    "primaryObject": "SKU/Product",
    "businessLoop": [
      "Product Center",
      "SKU Detail",
      "Visual Production",
      "SKU.assets",
      "Template Center / Listing",
      "Delivery / Downloads"
    ]
  },
  "pageTypes": {
    "marketing-page": { "userVisibleMap": false },
    "workspace-home": { "requiresBusinessObjectOrQueue": true },
    "object-detail": { "requiresBusinessObject": true },
    "production-station": { "requiresInputOutputDestination": true },
    "library-management": { "requiresCollectionSemantics": true },
    "settings-admin": { "requiresStableFormSemantics": true },
    "redirect-legacy": { "requiresRedirectTarget": true },
    "utility-support": { "requiresSupportIntent": true }
  },
  "routes": []
}
```

**Minimum route coverage for first landing:**

```text
/
/home
/pricing
/solutions
/login
/products
/products/:id
/products/workbench/visual-tools
/products/workbench/visual-tools/:toolSlug
/products/:productId/ai/:toolSlug
/products/:id/production/prep
/products/:id/production/sandbox
/products/:id/production/workshop
/aiChat/template
/products/workbench/downloads
/account/profile
/account/assets
/account/history
/account/templates
/account/billing
/org/overview
/inventory/*
legacy redirects: /aiChat/batchListing, /products/workbench/batch-listing, /draw/product-home, /draw/product-records, /downloadCenter
```

**Acceptance criteria:**
- Registry exists and is valid JSON.
- Every covered route has: `route`, `pageType`, `surface`, `businessObject`, `solves`, `upstream`, `downstream`, `primaryAction`, `resultDestination`, `designPattern`, `forbiddenPatterns`, `userVisibleContext`.
- Legacy redirects have `canonicalRoute`.

**Verifier command:**

```bash
node -e "JSON.parse(require('fs').readFileSync('docs/ecommerce-page-position-registry.json','utf8')); console.log('registry json ok')"
```

---

## Task 2: Add page-type pattern document

**Objective:** Make design expectations explicit per page type so agents do not apply homepage logic to every page.

**Files:**
- Create: `docs/ecommerce-page-type-patterns.md`

**Required sections:**

```text
Marketing Page
Workspace Home
Object Detail
Production Station
Library / Management
Settings / Admin
Redirect / Legacy
Utility / Support
```

Each section must include:

```text
Purpose
Allowed visual posture
Required page regions
Forbidden patterns
Examples in current router
User-visible context rule
Automation checks
```

**Acceptance criteria:**
- Visual Tools is explicitly classified as `production-station`, not `marketing-page`.
- Product Center is `workspace-home`.
- Product Detail is `object-detail`.
- Template Center is `library-management`.
- Pricing/Home are `marketing-page`.

---

## Task 3: Add route registry gate

**Objective:** Fail closed when core routes are missing from the internal page-position registry or have invalid contracts.

**Files:**
- Create: `scripts/ecommerce-page-position-gate.mjs`
- Create: `tests/governance/page-position-gate.test.mjs`
- Modify: `package.json`

**Script behavior:**

```text
Input: docs/ecommerce-page-position-registry.json
Output: reports/frontend-style-consistency/page-position-report.json
Exit 0: all required routes valid
Exit 1: missing route, invalid pageType, missing business fields, redirect without canonicalRoute
```

**Validation rules:**

```text
1. schemaVersion must exist.
2. pageType must be one of the fixed taxonomy values.
3. non-redirect routes must define solves, upstream, downstream, primaryAction, designPattern.
4. production-station routes must define businessObject, input, expectedOutput, resultDestination.
5. object-detail routes must define businessObject and downstream.
6. marketing-page routes must not be required to define SKU/Product object.
7. redirect-legacy routes must define canonicalRoute.
8. forbiddenPatterns must include at least one explicit anti-pattern.
```

**Package script:**

```json
"page:position": "node scripts/ecommerce-page-position-gate.mjs"
```

**Tests:**
- valid registry passes.
- missing Visual Tools contract fails.
- Visual Tools incorrectly classified as `marketing-page` fails.
- redirect without `canonicalRoute` fails.
- production station without `resultDestination` fails.

**Verifier command:**

```bash
node --test tests/governance/page-position-gate.test.mjs
npm run page:position
```

---

## Task 4: Wire page-position gate into frontend gate

**Objective:** Make page-position governance part of the default frontend acceptance path.

**Files:**
- Modify: `scripts/ecommerce-frontend-automation-gate.mjs`
- Modify: `docs/frontend-style-governance.md`
- Modify: `docs/frontend-product-ia-governance.md`

**Implementation:**
- Add `page:position` into the same sequence as `frontend:ia`, `style:consistency`, `layout:density`, `visual:composition`, and `runtime:layout`.
- Report page-position status in the automation report.
- Keep failures blocking.

**Acceptance criteria:**
- `npm run frontend:gate` runs `page:position`.
- Missing/invalid page contract fails `frontend:gate`.
- Report includes page-position result.

**Verifier command:**

```bash
npm run governance:test
npm run frontend:gate
```

---

## Task 5: Add business-backbone fields to Visual Tools and critical SKU flow

**Objective:** Ensure critical pages are not only visually governed, but placed in the SKU business chain.

**Files:**
- Modify: `docs/ecommerce-page-position-registry.json`
- Modify: `docs/product-ux-visual-backbone.md`
- Modify if needed: `src/pages/ProductVisualToolsPage.tsx`

**Critical chain:**

```text
Product Center
→ SKU Detail
→ Visual Tools / Production Prep
→ Sandbox
→ Workshop
→ SKU.assets
→ Template Center / Listing
→ Delivery / Downloads
```

**Visual Tools contract:**

```text
pageType: production-station
businessObject: SKU/Product Asset
solves: choose and execute the next visual task for a SKU
upstream: Product Center, SKU Detail
input: SKU context, current assets, category, reference images
expectedOutput: visual assets attached to SKU.assets
resultDestination: SKU.assets, Template Center, Listing
forbiddenPatterns: homepage hero, tool registry, equal-weight tool matrix, raw backend status panel
userVisibleContext: current SKU/product context, recommended next task, expected outputs, save/use destination
```

**Acceptance criteria:**
- Registry captures the chain above.
- Visual Tools remains a functional production station, not a marketing page.
- User-facing route can still show value/effect, but only inside task context.

---

## Task 6: Add changed-route enforcement

**Objective:** Prevent future UI changes from touching core routes without a page contract and screenshot evidence.

**Files:**
- Modify: `scripts/ecommerce-frontend-automation-gate.mjs`
- Modify: `scripts/ecommerce-frontend-visual-evidence.mjs`
- Modify: `scripts/ecommerce-runtime-layout-gate.mjs` if route inventory reads a hardcoded list today.

**Rules:**

```text
1. Detect changed page files from git diff.
2. Map changed page files to registry routes.
3. If a changed file maps to a core route, require registry entry.
4. If pageType is workspace-home/object-detail/production-station/library-management, require screenshot evidence for that route or a valid generated manifest.
5. Redirect routes do not require screenshot evidence, but require canonicalRoute.
```

**Acceptance criteria:**
- Changing `ProductVisualToolsPage.tsx` without a registry entry fails.
- Changing a marketing page does not require SKU fields.
- Changing a redirect route without canonical route fails.
- Evidence manifest route IDs align with registry route IDs.

---

## Task 7: Burn down existing inconsistent pages by page type

**Objective:** Migrate page clusters in order without turning this into a big-bang redesign.

**Order:**

```text
Batch A: Product Center + Product Detail + Visual Tools
Batch B: Production Prep + Sandbox + Workshop
Batch C: Template Center + Listing/Delivery/Downloads
Batch D: Account/Org/Settings
Batch E: Inventory
Batch F: Public marketing/support pages
```

**Per-batch checklist:**

```text
1. Confirm registry contract.
2. Confirm correct page type pattern.
3. Replace page-local styles with shared tokens/primitives where practical.
4. Add/adjust semantic product components only when repeated.
5. Run page-position, visual-composition, runtime-layout, frontend:evidence, frontend:gate.
6. Commit batch with report path and screenshot evidence.
```

---

## Task 8: Verification suite

**Objective:** Make completion measurable.

**Commands:**

```bash
npm run page:position
npm run visual:composition
npm run runtime:layout
npm run frontend:evidence
npm run frontend:gate
npm run governance:test
npm run typecheck
npm run build
```

**Evidence paths:**

```text
reports/frontend-style-consistency/page-position-report.json
reports/frontend-style-consistency/evidence-manifest.json
reports/frontend-style-consistency/screenshots/*.png
reports/frontend-style-consistency/runtime-layout-report.json
reports/frontend-style-consistency/visual-composition-report.json
```

---

## Delivery phases

### Phase 1 — Governance foundation

Deliver:
- registry JSON
- page-type pattern doc
- page-position gate
- tests
- `frontend:gate` wiring

Stop condition:
- all commands in Task 8 pass.

### Phase 2 — Critical SKU flow contracts

Deliver:
- full Product Center → SKU Detail → Visual/Production → Template/Listing → Delivery route contracts
- evidence route inventory aligned to registry

Stop condition:
- changing a critical page without registry/evidence fails closed.

### Phase 3 — Page-type migration batches

Deliver:
- migrate page clusters by batch order
- reduce old style drift instead of hiding it

Stop condition:
- baseline drift decreases batch by batch; no new page-local style system.

---

## Final acceptance

This work is done when:

```text
1. Every critical route has an internal page-position contract.
2. Every critical route declares a page type.
3. Visual Tools is governed as a production station, not a homepage.
4. Core SKU chain is documented and machine-checked.
5. frontend:gate fails if a core UI page changes without contract/evidence.
6. Users see only useful path context, not an exposed full-site map.
7. Typecheck/build/governance/frontend gates pass.
```
