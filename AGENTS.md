# Agent Ecommerce Frontend - Agent Context

> This repository provides the frontend for Agent Ecommerce, built with React 19 + TypeScript + Vite + Tailwind CSS. It covers portal pages, console workbench, and management interfaces.

## 1. Purpose

`v-ecommerce-frontend` is the product frontend for Agent Ecommerce.

It should host:

- Portal pages: Home, Pricing, Solutions, Blog, Help, API Docs, Legal pages
- Console workbench: AI Chat, Template Market, Asset Library, Design Workbench, Order/Download Center
- Management pages: Profile Settings, Personal Center, Organization Management
- Mock workflow states: Template writeback, Design asset sync, Delivery queue, Unified workflow feed

It should not host:

- Backend API logic (delegate to `v-ecommerce-backend`)
- Platform auth/org/RBAC UI (delegate to platform services)
- Shared subscription/wallet/payment UI truth (reuse platform components)

## 2. Key Documents

- [Developer Guide](docs/DEVELOPER_GUIDE.md)
- [Frontend Style Governance](docs/frontend-style-governance.md)
- [Frontend Product IA Governance](docs/frontend-product-ia-governance.md)
- [Acceptance/TDD Governance](docs/acceptance-tdd-governance.md)
- [Business Interaction QA Design](docs/business-interaction-qa-design.md)
- [Multi-image Template Integration Matrix](docs/multimage-template-integration-matrix.md)
- [Frontend CTA Acceptance Matrix](docs/templates/frontend-cta-acceptance-matrix.md)
- [Agent Acceptance/TDD Workflow](docs/agent-acceptance-tdd-workflow.md)
- [Development Governance Closed Loop](docs/development-governance-closed-loop.md)
- [Git Hooks](docs/GIT_HOOKS.md)
- [Project Skeleton](docs/architecture/PROJECT_SKELETON.md)
- [Contract Adapter Config](contract-adapter.config.json)
- [Contract Critical Journeys](contract-governance/critical-journeys.json)
- [Workspace Cloud Dev Deploy Runbook](../tools/dev/README.md) — Cloud dev 部署固定入口，负责 commit/provenance guard、prod guard 与 health/evidence。
- [Template Center Data Model](../ecommerce-backend/docs/architecture/TEMPLATE_CENTER_DATA_MODEL.md) — backend-owned template model and media mapping reference.
- [Multi-image Template Integration Matrix](docs/multimage-template-integration-matrix.md) — frontend integration state and acceptance matrix.

## 3. Commands

```bash
cd /root/work/v/ecommerce-frontend
npm install --legacy-peer-deps
npm run dev
npm run frontend:gate
npm run layout:density
npm run frontend:evidence
npm run frontend:burn-down
npm run lint:baseline
npm run quality:static
npm run design-system:check
npm run storybook:build
npm run api:contract
npm run contract:smoke
npm run contract:evidence
npm run qa:business
npm run qa:business:live
npm run qa:changed-flow
npm run qa:report
npm run test:contract:real
npm run test:e2e
npm run test:visual
npm run lighthouse:budget
npm run bundle:budget
npm run typecheck
npm run build
npm run ci:qa-gate
npm run ci:qa-gate:offline
npm run ci:quick
python3 /root/work/agentic-selfcheck/scripts/install_v_continuous_governance_hooks.py --repo /root/work/v/ecommerce-frontend
```

## 4. Notes

- Project name in `package.json` is still `v-lf-frontend`, but product display and docs use "Agent Ecommerce"
- Use `--legacy-peer-deps` due to `react-i18next` peer dependency range mismatch with TypeScript 6
- Development follows "visual skeleton → basic capabilities → business capabilities → integration logic" rhythm
- Mock data layer supports independent frontend development before backend is ready

## 5. Documentation Rules

- Add frontend docs under `docs/` or `docs/architecture/`
- Keep component, page, and mock docs aligned with code
- Update this file whenever long-lived frontend docs are added
