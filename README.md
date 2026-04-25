# Agent Ecommerce Frontend

`v-ecommerce-frontend` 是 Agent Ecommerce 的前端演示与产品骨架项目，基于 `React 19 + Vite + TypeScript + Tailwind CSS v4` 构建，当前重点承载：

- 门户站点：首页、定价、方案、博客、帮助、API Docs、法务页
- 控制台工作台：AI 对话、模板市场、资料库、设计工作台、订单/下载中心
- 管理层页面：个人设置、个人管理、组织管理
- 多工作台 mock 状态流：模板回流、设计产物回流、下载交付、统一 workflow feed

## Quick Start

```bash
cd v-ecommerce-frontend
npm install --legacy-peer-deps
npm run dev
```

常用命令：

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
bash scripts/install-git-hooks.sh
```

## Documentation

- [Developer Guide](docs/DEVELOPER_GUIDE.md)
- [Git Hooks](docs/GIT_HOOKS.md)
- [Project Skeleton](docs/architecture/PROJECT_SKELETON.md)
- [Project Agent Context](AGENTS.md)

## Notes

- 项目当前 `package.json` 名称仍为 `v-lf-frontend`，但产品展示与文档统一按 `Agent Ecommerce` 表述。
- `react-i18next` 与 `TypeScript 6` 的 peer 范围存在差异；本项目安装和部署统一使用 `--legacy-peer-deps`。
- 这是一个以“视觉骨架 -> 基础能力 -> 业务能力 -> 联动逻辑”为节奏推进的前端项目，因此文档会同时覆盖页面结构与 mock 状态流。
