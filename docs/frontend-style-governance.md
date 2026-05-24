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

`npm run style:consistency` has two layers:

1. **Strict critical-shell rules** — Product/Production layout files must use shared Button/EcomShell primitives and cannot contain raw hex utilities or bare buttons.
2. **Repo-wide drift baseline** — the current historical drift is recorded in `scripts/ecommerce-style-consistency-baseline.json`. New files cannot add drift, and existing files cannot increase drift. Reducing drift is always allowed; refresh the baseline only in PRs that intentionally burn down old page-local styling.

This means old inconsistency is tolerated only as burn-down debt. New inconsistency fails closed.

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
npm run style:consistency -- --write-baseline
npm run style:consistency
npm run typecheck
npm run build
```

## Acceptance evidence

A frontend consistency PR should report:

- changed shared tokens/components
- migrated pages/shells
- `style:consistency` result and drift totals
- `typecheck` and `build` result
- browser screenshots for user-visible redesigns

