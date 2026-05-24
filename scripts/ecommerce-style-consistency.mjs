#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const requiredFiles = [
  'src/components/ui/Button.tsx',
  'src/components/ui/EcomShell.tsx',
  'src/index.css',
]
const criticalFiles = [
  'src/layouts/ProductWorkbenchLayout.tsx',
  'src/layouts/ProductionLayout.tsx',
]
const tokenNeedles = [
  '--ecom-bg',
  '--ecom-surface-hover',
  '--ecom-action-primary',
  '--ecom-text-muted',
  '--ecom-border-strong',
]
const forbiddenInCritical = [
  { name: 'raw hex color utility', re: /(?:bg|text|border)-\[#[0-9a-fA-F]{3,8}\]/ },
  { name: 'bare button element', re: /<button\b/ },
  { name: 'ad-hoc white hover surface', re: /hover:bg-white\/\[/ },
  { name: 'ad-hoc header background', re: /bg-\[#080b11\]/ },
]
const failures = []

for (const rel of requiredFiles) {
  if (!existsSync(join(root, rel))) failures.push(`${rel}: required design-system file missing`)
}

const cssPath = join(root, 'src/index.css')
if (existsSync(cssPath)) {
  const css = readFileSync(cssPath, 'utf8')
  for (const token of tokenNeedles) {
    if (!css.includes(token)) failures.push(`src/index.css: missing token ${token}`)
  }
}

for (const rel of criticalFiles) {
  const path = join(root, rel)
  if (!existsSync(path)) {
    failures.push(`${rel}: missing critical shell file`)
    continue
  }
  const text = readFileSync(path, 'utf8')
  if (!text.includes("@/components/ui/Button")) failures.push(`${rel}: must use shared Button/ButtonLink`)
  if (!text.includes("@/components/ui/EcomShell")) failures.push(`${rel}: must use shared EcomShell/Header/NavPill`)
  for (const rule of forbiddenInCritical) {
    if (rule.re.test(text)) failures.push(`${rel}: ${rule.name} is not allowed in critical shells`)
  }
}

const result = {
  status: failures.length ? 'FAIL' : 'PASS',
  checked: { requiredFiles, criticalFiles, tokenNeedles },
  failures,
}
console.log(JSON.stringify(result, null, 2))
process.exit(failures.length ? 1 : 0)
