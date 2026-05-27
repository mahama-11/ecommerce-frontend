# Product UX visual backbone

## Visual posture

Agent Ecommerce uses this visual posture for Product Center, Visual Tools, and Production surfaces:

> Dark product workbench + commerce visual creation + task progression + result preview.

This is not a pure Linear clone and not a pure Raycast clone. The product should feel like a serious ecommerce visual creation workspace: calm dark shell, one clear working stage, visible product/output context, and progressive next actions.

## Directional keywords

- less control console; more creation studio
- less capability matrix; more task stage
- less system status; more user next step
- less nested cards; more hierarchy and whitespace
- less backend vocabulary; more ecommerce workflow language
- less equal-weight modules; more primary object, primary action, and result preview

## Core page IA questions

Every core page must make these six answers visible without reading implementation docs:

1. What task is the user doing now?
2. What is the primary object: SKU, product, asset, generation task, or export package?
3. What is the one primary action?
4. What secondary actions are available but quieter?
5. Where can the user see or retrieve the result?
6. Are system status and implementation details weakened into helper text, disclosure, or diagnostics?

## Core composition primitives

Core pages should compose product semantics from these primitives before falling back to raw Card/Button grids:

- ProductHeroStage
- VisualOutcomePreview
- ProductAssetStrip
- RecommendedToolRail
- GenerationActionDock
- WorkflowProgressRail
- ResultDestinationCard
- ToolCategoryCarousel
- SoftInspectorPanel

## Visual Tools target role

Visual Tools is a 商品视觉创作站, not a tool registry. Its default page narrative is:

1. show the current product/SKU context;
2. show product assets and expected visual outcome;
3. recommend a small set of next visual goals;
4. keep the primary action near the selected goal;
5. put queues, rules, unavailable future tools, and diagnostics behind quieter surfaces.

## Public references translated into principles

- Linear: strong opening claim, large product stage, restrained dark hierarchy, few equal-weight boxes above the fold.
- Raycast: one focused action surface, fast command posture, polished hover/selected states.
- Vercel/Stripe: high craft, clear section rhythm, complex systems expressed through progressive explanation rather than raw mechanics.

## Anti-pattern floor

The automated visual composition gate blocks or warns on:

- card nesting depth over 2 in core first-screen code;
- excessive rounded/bordered surfaces before the user gets a primary task;
- overloaded tool grids without recommendation/preview affordances;
- customer-facing technical terms such as pipeline, backend, contract, runtime, attach-back, and station;
- missing hero/task stage;
- missing visual outcome or product asset preview on Visual/AI generation pages.
