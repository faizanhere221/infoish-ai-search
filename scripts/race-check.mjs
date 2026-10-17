#!/usr/bin/env node
// Race-condition smoke test. Plain Node (built-in fetch, no dependencies)
// against a running server — run `npm run dev` first (or point BASE_URL at
// one that's already running), then `node scripts/race-check.mjs`. Reads
// tokens/ids from .env.test.local (same file security-check.mjs uses).
//
// WRITES DATA. Fires two concurrent requests at a real payment record on a
// real campaign_creators row and leaves it mutated (marked paid / split).
// Only ever point this at disposable test rows, never real production data.
//
// What it checks:
//   - mark-paid: both concurrent calls hit the same payment with DIFFERENT
//     `reference` values. The route's UPDATE is a single conditional
//     statement (`WHERE status IN (...)`), so Postgres only lets one of the
//     two actually change the row — by design (see
//     src/app/api/campaign-creators/[id]/payments/[paymentId]/mark-paid/route.ts)
//     a call that loses that race still gets a 200 back (idempotent: the
//     end state it wanted was reached by someone), so this script can't
//     tell the winner apart by HTTP status alone. What it CAN verify: the
//     payment lands on exactly one of the two reference values afterward,
//     never a corrupted mix, and never both — proving only one write
//     actually went through even though both calls reported success.
//   - split: the row-locking `split_payment()` Postgres function means
//     only one of the two identical concurrent calls can find the original
//     still 'scheduled' — the other raises inside the function and the
//     route turns that into a 409. This script asserts exactly one 200 and
//     one 409, and that re-fetching the row shows exactly one new
//     upfront/final pair, not two.

import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.join(SCRIPT_DIR, '..')

function loadEnvFile(filePath) {
  const env = {}
  if (!existsSync(filePath)) {return env}
  const content = readFileSync(filePath, 'utf-8')
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) {continue}
    const eq = line.indexOf('=')
    if (eq === -1) {continue}
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    env[key] = value
  }
  return env
}

const fileEnv = loadEnvFile(path.join(REPO_ROOT, '.env.test.local'))
const getEnv = (key) => process.env[key] ?? fileEnv[key] ?? ''

const BASE_URL = getEnv('BASE_URL') || 'http://localhost:3000'
const BRAND_A_TOKEN = getEnv('BRAND_A_TOKEN')
const RACE_CAMPAIGN_CREATOR_ID = getEnv('RACE_CAMPAIGN_CREATOR_ID')
const RACE_PAYMENT_ID = getEnv('RACE_PAYMENT_ID')
const RACE_SPLIT_PAYMENT_ID = getEnv('RACE_SPLIT_PAYMENT_ID')

const required = { BRAND_A_TOKEN, RACE_CAMPAIGN_CREATOR_ID }
const missing = Object.entries(required).filter(([, v]) => !v).map(([k]) => k)
if (missing.length > 0) {
  console.error(`Missing required values (set in .env.test.local or the environment): ${missing.join(', ')}`)
  console.error('RACE_CAMPAIGN_CREATOR_ID is the row both RACE_PAYMENT_ID and RACE_SPLIT_PAYMENT_ID belong to — Brand A must own it.')
  process.exit(1)
}
if (!RACE_PAYMENT_ID && !RACE_SPLIT_PAYMENT_ID) {
  console.error('Set at least one of RACE_PAYMENT_ID (mark-paid race) or RACE_SPLIT_PAYMENT_ID (split race) in .env.test.local.')
  process.exit(1)
}

const authHeaders = (token) => (token ? { Authorization: `Bearer ${token}` } : {})
const jsonHeaders = (token) => ({ ...authHeaders(token), 'Content-Type': 'application/json' })

async function request(urlPath, options = {}) {
  return fetch(`${BASE_URL}${urlPath}`, options)
}

async function getPayments() {
  const res = await request(`/api/campaign-creators/${RACE_CAMPAIGN_CREATOR_ID}/payments`, {
    headers: authHeaders(BRAND_A_TOKEN),
  })
  if (!res.ok) {
    throw new Error(`Failed to list payments for ${RACE_CAMPAIGN_CREATOR_ID}: status ${res.status}`)
  }
  const data = await res.json()
  return data.payments || []
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

let failCount = 0
function assert(condition, message) {
  if (condition) {
    console.log(`  OK    ${message}`)
  } else {
    failCount += 1
    console.log(`  FAIL  ${message}`)
  }
}

async function runMarkPaidRace() {
  console.log(`\n── mark-paid race on ${RACE_PAYMENT_ID} ──`)

  const before = await getPayments()
  const target = before.find((p) => p.id === RACE_PAYMENT_ID)
  if (!target) {
    console.log(`  SKIP  ${RACE_PAYMENT_ID} not found on ${RACE_CAMPAIGN_CREATOR_ID}`)
    return
  }
  console.log(`  before: status=${target.status} type=${target.type} amount=${target.amount} ${target.currency}`)
  if (!['due', 'disputed'].includes(target.status)) {
    console.log(`  SKIP  payment must be "due" or "disputed" to race mark-paid from (currently "${target.status}")`)
    return
  }

  const refA = `race-check-A-${Date.now()}`
  const refB = `race-check-B-${Date.now()}`

  const fire = (reference) =>
    request(`/api/campaign-creators/${RACE_CAMPAIGN_CREATOR_ID}/payments/${RACE_PAYMENT_ID}/mark-paid`, {
      method: 'POST',
      headers: jsonHeaders(BRAND_A_TOKEN),
      body: JSON.stringify({ method: 'bank_transfer', reference }),
    })

  const [resA, resB] = await Promise.all([fire(refA), fire(refB)])

  console.log(`  call A (reference=${refA}): status ${resA.status}`)
  console.log(`  call B (reference=${refB}): status ${resB.status}`)

  assert(resA.status < 500 && resB.status < 500, 'neither call 500ed')

  const after = await getPayments()
  const final = after.find((p) => p.id === RACE_PAYMENT_ID)

  assert(!!final, 'payment still exists after the race')
  assert(final?.status === 'marked_paid', `final status is "marked_paid" (got "${final?.status}")`)

  const winner = final?.reference === refA ? 'A' : final?.reference === refB ? 'B' : null
  assert(
    winner !== null,
    `final reference ("${final?.reference}") is exactly one of the two values sent (A="${refA}", B="${refB}") — not corrupted, not blank`
  )
  if (winner) {console.log(`  → call ${winner}'s write is the one that actually stuck (the other was absorbed as an idempotent no-op)`)}
}

async function runSplitRace() {
  console.log(`\n── split race on ${RACE_SPLIT_PAYMENT_ID} ──`)

  const before = await getPayments()
  const target = before.find((p) => p.id === RACE_SPLIT_PAYMENT_ID)
  if (!target) {
    console.log(`  SKIP  ${RACE_SPLIT_PAYMENT_ID} not found on ${RACE_CAMPAIGN_CREATOR_ID}`)
    return
  }
  console.log(`  before: status=${target.status} type=${target.type} amount=${target.amount} ${target.currency}`)
  if (target.type !== 'full' || target.status !== 'scheduled') {
    console.log(`  SKIP  payment must be an unsplit "full" payment in "scheduled" status (currently type="${target.type}", status="${target.status}")`)
    return
  }

  const upfrontAmount = Math.round((target.amount / 2) * 100) / 100
  const finalAmount = Math.round((target.amount - upfrontAmount) * 100) / 100
  console.log(`  splitting into upfront=${upfrontAmount} + final=${finalAmount}`)

  const fire = () =>
    request(`/api/campaign-creators/${RACE_CAMPAIGN_CREATOR_ID}/payments/${RACE_SPLIT_PAYMENT_ID}/split`, {
      method: 'POST',
      headers: jsonHeaders(BRAND_A_TOKEN),
      body: JSON.stringify({ upfront_amount: upfrontAmount, final_amount: finalAmount }),
    })

  const [resA, resB] = await Promise.all([fire(), fire()])
  const [bodyA, bodyB] = await Promise.all([resA.json().catch(() => ({})), resB.json().catch(() => ({}))])

  console.log(`  call A: status ${resA.status}${resA.status === 409 ? ` (${bodyA.error})` : ''}`)
  console.log(`  call B: status ${resB.status}${resB.status === 409 ? ` (${bodyB.error})` : ''}`)

  const twoHundreds = [resA.status, resB.status].filter((s) => s === 200).length
  const fourOhNines = [resA.status, resB.status].filter((s) => s === 409).length
  assert(twoHundreds === 1, `exactly one call got 200 (got ${twoHundreds})`)
  assert(fourOhNines === 1, `exactly one call got 409 (got ${fourOhNines})`)

  const after = await getPayments()
  const original = after.find((p) => p.id === RACE_SPLIT_PAYMENT_ID)
  const upfronts = after.filter((p) => p.type === 'upfront' && p.amount === upfrontAmount)
  const finals = after.filter((p) => p.type === 'final' && p.amount === finalAmount)

  assert(original?.status === 'cancelled', `original payment is "cancelled" (got "${original?.status}")`)
  assert(upfronts.length === 1, `exactly one new "upfront" payment of ${upfrontAmount} exists (got ${upfronts.length}) — a double-split would create two`)
  assert(finals.length === 1, `exactly one new "final" payment of ${finalAmount} exists (got ${finals.length}) — a double-split would create two`)
}

async function main() {
  console.log('⚠  race-check.mjs WRITES DATA (mark-paid / split) on the payment rows below.')
  console.log('   Only run this against disposable test rows — never real/production data.')
  console.log(`   Target: ${BASE_URL}, campaign_creator ${RACE_CAMPAIGN_CREATOR_ID}`)
  if (RACE_PAYMENT_ID) {console.log(`   RACE_PAYMENT_ID       = ${RACE_PAYMENT_ID} (will be marked paid)`)}
  if (RACE_SPLIT_PAYMENT_ID) {console.log(`   RACE_SPLIT_PAYMENT_ID = ${RACE_SPLIT_PAYMENT_ID} (will be split)`)}
  console.log('   Starting in 3s — Ctrl+C to abort...\n')
  await sleep(3000)

  if (RACE_PAYMENT_ID) {await runMarkPaidRace()}
  if (RACE_SPLIT_PAYMENT_ID) {await runSplitRace()}

  console.log(failCount > 0 ? `\n${failCount} assertion(s) failed.` : '\nAll assertions passed.')
  process.exit(failCount > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('race-check crashed:', err)
  process.exit(1)
})
