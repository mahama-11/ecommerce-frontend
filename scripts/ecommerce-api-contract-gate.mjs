#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const schemaRel = 'contracts/ecommerce.openapi.json'
const outputRel = 'src/api/generated/ecommerce-contract.ts'
const reportRel = 'reports/frontend-quality/api-contract-latest.json'
function writeJson(rel, payload) { const path = join(root, rel); mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, JSON.stringify(payload, null, 2) + '\n') }
const failures = []
if (!existsSync(join(root, schemaRel))) failures.push(`missing OpenAPI schema: ${schemaRel}`)
let command = null
if (!failures.length) {
  mkdirSync(dirname(join(root, outputRel)), { recursive: true })
  command = spawnSync('npx', ['openapi-typescript', schemaRel, '-o', outputRel], { cwd: root, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 })
  if ((command.status ?? 1) !== 0) failures.push(`openapi-typescript failed: ${(command.stderr || command.stdout || '').slice(-1000)}`)
}
if (!existsSync(join(root, outputRel))) failures.push(`generated contract missing: ${outputRel}`)
else {
  const text = readFileSync(join(root, outputRel), 'utf8')
  for (const required of ['getEcommerceSession', 'listProducts', 'getProduct', 'getProductionStageView']) {
    if (!text.includes(required)) failures.push(`generated contract missing operation: ${required}`)
  }
}
const result = {
  status: failures.length ? 'FAIL' : 'PASS',
  policy: 'Frontend API DTOs must be generated from a machine-readable OpenAPI contract, not hand-written in pages.',
  schema: schemaRel,
  generated: outputRel,
  command: command ? { exit_code: command.status, stderr_tail: (command.stderr || '').slice(-1000), stdout_tail: (command.stdout || '').slice(-1000) } : null,
  failures,
}
writeJson(reportRel, result)
console.log(JSON.stringify(result, null, 2))
process.exit(failures.length ? 1 : 0)
