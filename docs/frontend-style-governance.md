# Ecommerce frontend style governance

## Goal

Future frontend changes should preserve one product-level visual system instead of creating page-local button, shell, dark-surface, and hover variants.

This is enforced as code, not only as documentation.

## Default rule

For Product Center / Production Pipeline surfaces, use the shared Ecommerce design system first:

- Tokens: `src/index.css` `--ecom-*`
- Buttons/links: `src/components/ui/Button.tsx`
- Product dark shell/navigation/dialog primitives: `src/components/ui/EcomShell.tsx`
- Guard: `npm run style:consistency`

Do not add one-off page-local versions of:

- dark background hex utilities like `bg-[#0a0a12]`, `bg-[#080b11]`, `bg-[#09090b]`
- arbitrary button styling via bare `<button>` in product pages
- ad-hoc hover surfaces such as `hover:bg-white/[...]`
- per-page header/card/dialog border/text colors when an `--ecom-*` token exists

## How future requirements stay consistent

Every non-trivial UI change follows this order:

1. Identify the target surface: Product Center shell, SKU Queue, SKU Detail, Prep, Sandbox, Workshop, Listing, Delivery, public portal, account, or inventory.
2. Reuse existing shared primitives before writing local classes.
3. If a new visual pattern is genuinely needed, add it as a semantic token/component first, then consume it from pages.
4. Run `npm run style:consistency` before typecheck/build.
5. If the change is C/D-risk page/flow/visual work, route through the SelfCheck frontend workflow before implementation and require screenshots/parity evidence after implementation.

## Guard policy

`npm run frontend:gate` is the default automation entrypoint for frontend increments. It runs style consistency, ESLint baseline, static accessibility/architecture quality checks, design-system registry validation, writes machine-readable reports, classifies changed files from git diff, generates the style-drift repair queue, and fails Product Center / Production UI page changes that do not include local visual evidence. If such a page change is detected and no valid manifest exists, the gate attempts to generate Chromium screenshot evidence automatically via `npm run frontend:evidence`. It also blocks changes to global style files (`src/index.css`, shared `Button`, shared `EcomShell`) unless the change includes an accepted style-change proposal.

`npm run style:consistency` has two layers:

1. **Strict critical-shell rules** — Product/Production layout files must use shared Button/EcomShell primitives and cannot contain raw hex utilities or bare buttons.
2. **Repo-wide drift baseline** — the current historical drift is recorded in `scripts/ecommerce-style-consistency-baseline.json`. New files cannot add drift, and existing files cannot increase drift. Reducing drift is always allowed; refresh the baseline only in PRs that intentionally burn down old page-local styling.

This means old inconsistency is tolerated only as burn-down debt. New inconsistency fails closed.

## Style evolution policy

Unified style is allowed to evolve, but only through the shared layer and with explicit migration evidence.

Allowed style evolution path:

1. Change global tokens or shared primitives first (`src/index.css`, `Button`, `EcomShell`).
2. Add `reports/frontend-style-consistency/style-change-proposal.json` with:
   - `decision`: `ACCEPTED`, `ACCEPTED_WITH_NOTES`, or `APPROVED`
   - `rationale`: why the product style is changing
   - `scope`: what is allowed to change and what must stay stable
   - `affected_surfaces`: Product Center / Production / Portal / Account / Inventory impact list
   - `migration_plan`: which old styles will be migrated and whether baseline should decrease
   - `screenshots` or `visual_evidence`: local before/after evidence
3. Run `npm run frontend:gate`.
4. Migrate consuming pages in batches; each batch must not increase style drift.
5. Refresh the drift baseline only after a migration reduces old debt.

Not allowed:

- changing shared tokens just to make one page look different
- introducing a second dark palette beside `--ecom-*`
- bypassing the style-change proposal by editing page-local classes
- refreshing the baseline to hide a broader style regression

## Automated visual evidence

`npm run frontend:evidence` starts a local Vite server, launches headless Chromium through the Chrome DevTools Protocol, captures Product Center / Production screenshots, and writes:

```text
reports/frontend-style-consistency/evidence-manifest.json
reports/frontend-style-consistency/screenshots/*.png
```

`npm run frontend:gate` invokes this automatically for Product Center / Production UI changes when no accepted manifest exists. The generated manifest is render/visual-inventory evidence; it does not replace full runtime interaction QA or backend persistence checks for business-critical flows.

## Drift repair queue

`npm run style:repair-queue` reads `scripts/ecommerce-style-consistency-baseline.json` and writes a prioritized burn-down queue:

```text
reports/frontend-style-consistency/style-drift-repair-queue.json
```

Repair batches must monotonically reduce baseline totals. A PR may refresh the baseline only after `npm run style:consistency` proves the new totals are lower.

## When updating the baseline

Allowed:

- after migrating a page from local styles to shared tokens/components
- when counts decrease or files are removed

Not allowed:

- to hide new one-off button styles
- to introduce a new dark palette for one page
- to bypass Product Center / Production Pipeline shell consistency

Command:

```bash
npm run frontend:gate
npm run style:consistency -- --write-baseline
npm run frontend:gate
npm run typecheck
npm run build
```

## Acceptance evidence

A frontend consistency PR should report:

- changed shared tokens/components
- migrated pages/shells
- `style:consistency` / `frontend:gate` result and drift totals
- whether Product Center / Production UI changes required a visual evidence manifest
- `typecheck` and `build` result
- browser screenshots for user-visible redesigns

