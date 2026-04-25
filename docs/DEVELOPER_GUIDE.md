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
cd v-ecommerce-frontend
npm install --legacy-peer-deps
```

Common commands:

```bash
npm run dev
npm run lint
npx tsc --noEmit
npm run build
bash scripts/install-git-hooks.sh
```

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
- `src/mock/assetCommerce.ts`: upload, order, and delivery mock data
- `src/mock/designWorkbench.ts`: design-task and design-asset state
- `src/mock/opsWorkbench.ts`: operations records
- `src/mock/workflowBridge.ts`: cross-page workflow feed and design/template/delivery links

Guidelines:

- keep cross-page mock writes in dedicated helper files
- do not scatter raw `localStorage` calls across route pages
- prefer route-specific readers on top of shared state helpers

## 8. Real API Integration

The frontend now contains two product-facing API clients that should be preferred when the backend routes are available:

- `src/services/templateCenter.ts`: template catalog, detail, favorite, copy, and use-now flows
- `src/services/imageRuntime.ts`: source asset registration, image job creation, job polling, and asset preview loading
- `src/services/auth.ts`: login, register, password reset, and token lifecycle

Shared UX infrastructure used by these real integrations:

- `src/store/toastStore.ts`: global success/error toast state
- `src/components/Toast.tsx`: top-level toast rendering mounted from `src/main.tsx`

Current real image runtime routes used by `src/pages/ToolPage.tsx`:

- `POST /api/v1/ecommerce/assets/source`
- `GET /api/v1/ecommerce/image-jobs`
- `POST /api/v1/ecommerce/image-jobs`
- `GET /api/v1/ecommerce/image-jobs/:jobID`
- `GET /api/v1/ecommerce/assets/:assetID/content`

Current real template center routes used by `src/pages/AgentTemplateMarketPage.tsx` and `src/pages/ToolPage.tsx`:

- `GET /api/v1/ecommerce/template-center/catalog`
- `GET /api/v1/ecommerce/template-center/catalog/facets`
- `GET /api/v1/ecommerce/template-center/catalog/recommendations`
- `GET /api/v1/ecommerce/template-center/catalog/:templateId`
- `POST /api/v1/ecommerce/template-center/catalog/:templateId/favorite`
- `DELETE /api/v1/ecommerce/template-center/catalog/:templateId/favorite`
- `POST /api/v1/ecommerce/template-center/catalog/:templateId/copy`
- `POST /api/v1/ecommerce/template-center/catalog/:templateId/use`

Template center UX baseline:

- list cards render `coverAssetUrl`
- detail drawer renders `examples[].previewAssetUrl`
- drawer scroll is isolated from the background list scroll
- `Use Now` and in-tool template switching must overwrite the active prompt/template state only once per payload

## 9. Internationalization

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
- `docs/architecture/PROJECT_SKELETON.md`
