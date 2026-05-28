# Git Hooks

This repo uses the workspace SelfCheck hook installer.

## Install / refresh hooks

```bash
cd /root/work/agentic-selfcheck
python3 scripts/install_v_continuous_governance_hooks.py --repo /root/work/v/ecommerce-frontend
```

Installed hooks:

- `pre-commit`: cheap changed-file controls and large-source/locality guard.
- `pre-push`: selected business gates from `/root/work/agentic-selfcheck/config/v-business-gate-selector.yaml`.
- `post-merge`: refresh governance context after branch updates.

## What the hooks connect

`git changed files` → `v_continuous_governance_trigger.py` → `v-business-gate-selector.yaml` → selected SelfCheck feature gates.

For product-flow UI changes, the frontend local gate is still:

```bash
cd /root/work/v/ecommerce-frontend
npm run frontend:gate
```

`frontend:gate` writes machine-readable evidence under:

- `reports/frontend-style-consistency/automation-gate-latest.json`
- `reports/frontend-style-consistency/evidence-manifest.json`
- `reports/frontend-quality/*-latest.json`
