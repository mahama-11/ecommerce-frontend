# Agent Ecommerce Frontend Project Skeleton

## 1. Intent

This document describes the current frontend skeleton that has already been implemented in `v-ecommerce-frontend`.

It focuses on:

- page groups
- layout boundaries
- current route ownership
- mock workflow continuity between pages

It does not describe backend contracts as finalized unless those contracts already exist in code.

## 2. Architecture Overview

The frontend is split into two major shells:

- **Portal shell**
  - public product and marketing pages
  - owned by `PortalLayout`
- **Console shell**
  - tool pages and workbenches
  - owned by `ConsoleLayout`

These two shells share:

- i18n resources
- mock state helpers
- route-level lazy loading
- visual tokens from `index.css`

## 3. Route Map

### 3.1 Portal Routes

- `/`
- `/home`
- `/pricing`
- `/solutions/:slug`
- `/aboutus`
- `/help`
- `/api-docs`
- `/blog`
- `/changelog`
- `/contact`
- `/careers`
- `/privacy`
- `/terms`
- `/login`
- `/register`
- `/forgot-password`

### 3.2 Console Routes

#### Tool And Chat

- `/draw/:toolSlug`
- `/chat`
- `/chat/doc`

#### AI Operations

- `/aiChat/template`
- `/aiChat/batchListing`
- `/aiChat/history`
- `/aiChat/myTemplate`
- `/aiChat/analysisRecords`
- `/aiChat/training`

#### Data And Commerce

- `/database/knowledge`
- `/database/picturelibrary`
- `/brandLibrary`
- `/database/sensitiveThesaurus`
- `/database/tagManage`
- `/orderList`
- `/downloadCenter`

#### Design Workbench

- `/draw/scene-reference`
- `/draw/product-home`
- `/draw/product-records`
- `/draw/designer-home`
- `/draw/my-design`
- `/draw/my-template`
- `/draw/team-space`
- `/draw/history`

#### Settings

- `/settings/profile`
- `/settings/personal`
- `/settings/organization`

## 4. Page Ownership

### 4.1 Portal Pages

Dedicated portal route pages now exist for the long-lived public surfaces instead of using a generic placeholder page.

Examples:

- `HomePage.tsx`
- `PricingPage.tsx`
- `ApiDocsPage.tsx`
- `BlogPage.tsx`
- `ChangelogPage.tsx`
- `HelpCenterPage.tsx`

### 4.2 Workbench Pages

Workbench routes are grouped into dedicated route pages:

- `ToolPage.tsx`
- `ChatWorkspacePage.tsx`
- `AgentTemplateMarketPage.tsx`
- `OpsWorkbenchPage.tsx`
- `AssetCommercePage.tsx`
- `DesignWorkbenchPage.tsx`
- `SettingsWorkbenchPage.tsx`

## 5. State Flow Skeleton

The frontend currently uses mock state to simulate business continuity across multiple pages.

### 5.1 Template Flow

- template market can save template records
- saved templates appear in `myTemplate`
- chat and design pages can also write templates back into the same library

Primary helpers:

- `src/mock/templateLibrary.ts`
- `src/mock/workflowBridge.ts`

### 5.2 Design And Delivery Flow

- design workbench can create mock tasks
- selected design assets can sync into the picture library
- selected design assets can create download-center bundles
- design templates can bridge into Agent templates

Primary helpers:

- `src/mock/designWorkbench.ts`
- `src/mock/assetCommerce.ts`
- `src/mock/workflowBridge.ts`

### 5.3 Operations Flow

- chat actions can save templates or emit workflow events
- operations pages now own records for batch listing, history, analysis, and training
- workflow feed is visible from multiple pages

Primary helpers:

- `src/mock/opsWorkbench.ts`
- `src/mock/workflowBridge.ts`

## 6. Navigation Skeleton

`src/mock/data.ts` currently defines the main console navigation groups:

- AI visual generation
- AI smart operations
- data libraries
- management settings

When a new long-lived module is added, update both:

- the route definition in `src/router/index.tsx`
- the navigation definition in `src/mock/data.ts`

## 7. Current Engineering Characteristics

The current codebase already includes:

- route-level lazy loading with `Suspense`
- shared detail drawer patterns
- i18n at both page and mock-data levels
- mobile/desktop split sidebar behavior
- localStorage-backed workflow continuity

## 8. Known Boundaries

The project is still frontend-first and mock-heavy in some domains.

Current limitations:

- no finalized backend integration for most workbench actions
- no persistent server-owned workflow state
- no real identity, organization, billing, or permission API wiring

These are intentionally separated from the current UI structure so they can be replaced progressively without rewriting the route skeleton.
