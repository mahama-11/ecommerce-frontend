# Agent Ecommerce Frontend - Agent Context

> This file is the stable index for `v-ecommerce-frontend`. Put volatile progress into guides, not here.

## 1. Scope

`v-ecommerce-frontend` is the Agent Ecommerce frontend application. It currently covers:

- Portal pages: home, pricing, solutions, help, blog, API docs, legal pages
- Console pages: AI chat, template market, data libraries, design workbench, orders/download center
- Management pages: profile settings, personal center, organization management
- Mock workflow linking: template save-back, design asset sync, delivery queue, workflow feed

## 2. Key Documents

- [Developer Guide](docs/DEVELOPER_GUIDE.md)
- [Project Skeleton](docs/architecture/PROJECT_SKELETON.md)
- [Template Center Design](../docs/architecture/AGENT_ECOMMERCE_TEMPLATE_CENTER_DESIGN.md)
- [Template Center Evolution Plan](../docs/architecture/AGENT_ECOMMERCE_TEMPLATE_CENTER_EVOLUTION_PLAN.md)

## 3. Commands

```bash
cd v-ecommerce-frontend
npm install --legacy-peer-deps
npm run dev
npx tsc --noEmit
npm run build
```

## 4. Documentation Rules

- Add new frontend docs under `docs/` or `docs/architecture/`
- Keep docs aligned with actual routes, layouts, and workflow mock state
- Update this file or the root `AGENTS.md` whenever a new long-lived markdown file is added
