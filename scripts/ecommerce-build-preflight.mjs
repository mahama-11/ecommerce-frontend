#!/usr/bin/env node
import { execFileSync } from 'node:child_process'

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim()
}

function fail(message, details = '') {
  console.error(JSON.stringify({ status: 'FAIL', gate: 'ecommerce-build-preflight', message, details }, null, 2))
  process.exit(1)
}

let head
try {
  head = git(['rev-parse', '--verify', 'HEAD'])
} catch (error) {
  fail('Build/deploy requires at least one local git commit before packaging.', String(error?.message ?? error))
}

const branch = git(['rev-parse', '--abbrev-ref', 'HEAD'])
const porcelain = git(['status', '--porcelain=v1'])
if (porcelain) {
  fail('Build/deploy requires a clean working tree. Commit or stash all changes first.', porcelain)
}

const upstream = (() => {
  try {
    return git(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'])
  } catch {
    return null
  }
})()

const aheadBehind = (() => {
  if (!upstream) return null
  try {
    const [ahead, behind] = git(['rev-list', '--left-right', '--count', `${upstream}...HEAD`]).split(/\s+/).map(Number)
    return { upstream, ahead, behind }
  } catch {
    return { upstream, ahead: null, behind: null }
  }
})()

console.log(JSON.stringify({
  status: 'PASS',
  gate: 'ecommerce-build-preflight',
  branch,
  head,
  short_sha: head.slice(0, 12),
  clean: true,
  upstream: aheadBehind,
}, null, 2))
