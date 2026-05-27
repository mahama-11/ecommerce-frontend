# Frontend product IA and visual direction governance

## Goal

Product Center and Production Pipeline pages must feel like one coherent product, not a set of independently styled engineering screens. Gates prevent regressions, but the page direction is governed here: page role, information hierarchy, primary/secondary actions, and screenshot review expectations.

## Visual direction

Agent Ecommerce product workspaces use a dark commerce creation workspace, not a generic engineering cockpit:

- semantic `--ecom-*` tokens for surface, border, text, hover, and action colors;
- high contrast only for current action/status, not every card;
- dense information is allowed, but long Chinese business copy must wrap with readable line-height;
- business cards explain user decisions and consequences, not backend/runtime implementation details;
- local page classes are allowed only for composition, not for inventing a second button/card/dark palette.
- Product Center / Visual Tools / Production pages must follow `docs/product-ux-visual-backbone.md`: dark product workbench + ecommerce visual creation + task progression + result preview.
- Visual Tools is a 商品视觉创作站, not a tool registry; the first screen must show product context, visual outcome preview, recommended next visual goals, and one primary next action.

## Page roles

| Surface | Role | Primary user question | Primary action | Secondary actions |
| --- | --- | --- | --- | --- |
| Product Center / Queue | Multi-SKU triage and entry | Which SKU should I work on next? | Open/create SKU workflow | filter, batch select, inspect readiness |
| Product Detail | Single-SKU dossier | What do we know about this SKU and what can be produced? | Continue the workflow for this SKU | inspect parsed facts, assets, versions, listing/export status |
| Production Prep | Source upload and visual strategy confirmation | Which product/reference facts should enter generation? | Complete four strategy decisions | upload/replace assets, parse images, adjust reference weighting |
| Production Sandbox | Compose and verify generation requirements | What exactly will be generated now? | Generate/refresh plan, then start production when ready | edit prompt text, configure slots/templates, inspect blockers |
| Production Workshop | Select, compare, and finalize generated assets | Which generated result should become an asset/listing input? | Select/finalize/save/download real assets | compare versions, branch/refine, tune weights |
| Listing / Delivery | Downstream publishing and handoff | Is the output ready for listing/export/download? | validate/adopt/export/download | inspect versions, package state, delivery history |
| Account / Downloads | User/account asset retrieval | What did I purchase or generate and how do I retrieve it? | download/reuse asset/package | filter, inspect usage/billing/history |
| Product Workbench auxiliary pages | Supporting tools around the SKU workflow | What supporting tool helps this SKU? | Tool-specific action | inspect side data, return to Product Center |

## Information hierarchy rules

1. Page header states the current workflow stage and next job.
2. The main column carries the work product: decisions, generation plan, result grid, or listing/export readiness.
3. Side columns carry context and guardrails: source facts, readiness, settings, version lineage, cost, or blockers.
4. Primary CTA is singular and action-oriented. If prerequisites are missing, show the concrete next step near the disabled/action-explanation control.
5. Secondary actions are visually quieter and grouped near the related content, not scattered across the page.
6. Empty/error/loading states must use product language and explain what the user can do next.
7. Do not expose `backend`, `runtime`, `provider`, `contract-needed`, `prompt_plan`, IDs, storage keys, or raw JSON in customer-facing UI.

## Shared component rule

Product composition pages must use `ProductHeroStage`, `VisualOutcomePreview`, `ProductAssetStrip`, `RecommendedToolRail`, `GenerationActionDock`, `WorkflowProgressRail`, `ResultDestinationCard`, `ToolCategoryCarousel`, and `SoftInspectorPanel` for task-stage composition before falling back to raw Card/Button grids.

Production Pipeline pages must use the shared production business components for repeated dense UI patterns:

- `ProductionSectionCard` for workflow sections;
- `DecisionOptionCard` / `DecisionStepCard` for the four strategy choices;
- `EditablePromptCard` for generation requirement editing;
- `VersionLineageItem` / `VersionLineage` for generation lineage;
- `ResultAssetCard` for selectable generated results;
- `ProductionEmptyState` for honest empty/error states.

If a page needs a new repeated business pattern, add it to `src/components/production/ProductionWorkflowComponents.tsx`, add Storybook long-Chinese/mobile/empty/error states, then consume it from pages.

## Screenshot review expectations

For Product Center / Production Pipeline UI changes, evidence must include:

- desktop, tablet, and mobile viewport screenshots for changed critical routes;
- an overflow/clipping report with zero blocking findings;
- console error and network failure counts;
- final URLs proving screenshots reached business pages, not login/fallback routes;
- route-specific notes when a screenshot is render-only evidence rather than real API persistence QA.

## Historical burn-down order

1. Prep / Sandbox / Workshop shared workflow components and visual evidence.
2. Product Detail and Product Detail tabs.
3. Listing / Delivery / Account Downloads downstream flow.
4. Product Workbench auxiliary pages.
5. Remaining Account / public utility surfaces.

Baseline updates are allowed only after a batch reduces style/readability debt and the full frontend gate passes.
