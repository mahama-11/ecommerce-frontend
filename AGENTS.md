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
- [Git Hooks](docs/GIT_HOOKS.md)
- [Project Skeleton](docs/architecture/PROJECT_SKELETON.md)
- [Template Center Design](../docs/architecture/AGENT_ECOMMERCE_TEMPLATE_CENTER_DESIGN.md)
- [Template Center Evolution Plan](../docs/architecture/AGENT_ECOMMERCE_TEMPLATE_CENTER_EVOLUTION_PLAN.md)

## 3. Commands

```bash
cd v-ecommerce-frontend
npm install --legacy-peer-deps
npm run dev
npm run typecheck
npm run lint
npm run build
bash scripts/install-git-hooks.sh
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
