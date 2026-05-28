# Ecommerce page type patterns

This document is an internal product/design/development contract. It is **not** a customer-facing sitemap. Customers should only see clear navigation, object context, breadcrumbs/steppers, next actions, and result destinations.

## Marketing Page

**Purpose:** Public acquisition and value explanation for visitors who are not yet inside the product workflow.

**Allowed visual posture:** Strong value proposition, proof, examples, social trust, and one or two CTAs.

**Required page regions:** Value headline, product/effect examples, use cases, conversion CTA, trust/pricing/support path.

**Forbidden patterns:** SKU queue, production station controls, raw backend status, dense authenticated workflow UI.

**Examples in current router:** `/`, `/home`, `/pricing`, `/solutions`, `/solutions/:slug`.

**User-visible context rule:** Explain what the product can do; do not pretend the visitor is already editing a SKU.

**Automation checks:** `page:position` validates marketing routes are classified as `marketing-page`; screenshot gates are not required to contain SKU context.

## Workspace Home

**Purpose:** Logged-in business entry and triage. It answers “what should I work on next?”

**Allowed visual posture:** Business workbench with queue/readiness/next-action hierarchy.

**Required page regions:** Current queue or overview, readiness/status, recommended next action, recent outputs, navigation to object detail or production station.

**Forbidden patterns:** Homepage hero as the primary structure, equal-weight tool grid, raw backend table dump, unrelated dashboard widgets.

**Examples in current router:** `/products`, `/inventory/*`.

**User-visible context rule:** Show the current business area and next actionable work; do not expose the internal IA map.

**Automation checks:** `page:position` requires business object or queue semantics; `frontend:evidence` covers critical workspace routes.

## Object Detail

**Purpose:** Single-object dossier for SKU/Product/Listing/Asset context.

**Allowed visual posture:** Object-centered dossier with facts, assets, readiness, history, and downstream actions.

**Required page regions:** Object identity, status/readiness, related assets/facts, primary continuation action, downstream destinations.

**Forbidden patterns:** Marketing homepage, standalone tool launcher, settings form, generic dashboard.

**Examples in current router:** `/products/:id`.

**User-visible context rule:** The user must know which SKU/Product they are working on and what downstream action is recommended.

**Automation checks:** `page:position` requires `businessObject` and downstream; changed critical object-detail files require visual evidence through `frontend:gate`.

## Production Station

**Purpose:** Execute a specific business production task in the SKU/Product chain.

**Allowed visual posture:** Task station with product context, inputs, recommended/selected task, expected output, execution controls, and result destination.

**Required page regions:** Current object, input assets/data, task definition, expected output, primary action, result destination, next step.

**Forbidden patterns:** Traditional homepage, tool registry, equal-weight tool matrix, raw backend/provider/runtime panel, unrelated admin dashboard.

**Examples in current router:** `/products/workbench/visual-tools`, `/products/workbench/visual-tools/:toolSlug`, `/products/:productId/ai/:toolSlug`, `/products/:id/production/prep`, `/products/:id/production/sandbox`, `/products/:id/production/workshop`.

**User-visible context rule:** Value/effect explanation is allowed only inside task context: what this task does for the current SKU and where the result goes.

**Automation checks:** `page:position` requires input, expected output, and result destination; `visual:composition` checks task-stage/result-preview anti-patterns; `runtime:layout` checks browser evidence.

## Library / Management

**Purpose:** Browse, filter, preview, reuse, or retrieve reusable records/assets/templates/downloads.

**Allowed visual posture:** Collection-first management with filters, preview, status, bulk or reuse actions.

**Required page regions:** Collection identity, filters/search, list/grid, preview/details, primary reuse/download/manage action.

**Forbidden patterns:** Homepage takeover, unstructured file dump, production controls without object/result context.

**Examples in current router:** `/aiChat/template`, `/products/workbench/downloads`, `/account/assets`, `/account/history`, `/account/templates`.

**User-visible context rule:** Show what collection the user is managing and how selected items re-enter SKU/Listings/Downloads.

**Automation checks:** `page:position` requires collection semantics and downstream/result destination.

## Settings / Admin

**Purpose:** Configure user/account/org/system settings safely.

**Allowed visual posture:** Stable, restrained forms with clear status, save/cancel, and risk hints.

**Required page regions:** Setting group, current value/status, editable controls, save/rollback, validation/error states.

**Forbidden patterns:** Marketing hero, production task stage, decorative visual outcome preview, hidden destructive actions.

**Examples in current router:** `/account/profile`, `/account/billing`, `/org/overview`.

**User-visible context rule:** Make the current scope and consequences clear; do not turn settings into a product showcase.

**Automation checks:** `page:position` requires settings/admin semantics; style gates prevent one-off form/control systems.

## Redirect / Legacy

**Purpose:** Preserve old links while routing users to canonical pages.

**Allowed visual posture:** No independent UI; router redirect only.

**Required page regions:** None.

**Forbidden patterns:** Recreating old content, hidden duplicate page, independent visual design.

**Examples in current router:** `/aiChat/batchListing`, `/products/workbench/batch-listing`, `/draw/product-home`, `/draw/product-records`, `/downloadCenter`.

**User-visible context rule:** User should land on the canonical page without seeing a separate legacy surface.

**Automation checks:** `page:position` requires `canonicalRoute`; screenshot evidence is not required for redirect routes except runtime redirect inventory when listed in visual evidence.

## Utility / Support

**Purpose:** Auth, help, docs, legal, contact, and support surfaces.

**Allowed visual posture:** Focused utility flow with clear support intent and minimal distraction.

**Required page regions:** Intent header, form/content body, related support/navigation, completion/redirect state when applicable.

**Forbidden patterns:** SKU workflow controls, production station, unrelated marketing overbuild.

**Examples in current router:** `/login`, `/help`, `/api-docs`, `/privacy`, `/terms`, `/contact`.

**User-visible context rule:** Solve the utility task quickly and route the user back to the intended workflow when applicable.

**Automation checks:** `page:position` validates utility/support classification for covered routes.
