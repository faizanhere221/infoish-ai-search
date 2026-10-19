#!/usr/bin/env node
// Black-box authorization smoke test. Plain Node (built-in fetch, no
// dependencies) against a running server — run `npm run dev` first, then
// `npm run test:security`. Reads tokens from .env.test.local (gitignored;
// copy .env.test.example and fill in real values from your own dev data).
//
// Every check hits a real HTTP endpoint and asserts a status code — it
// never imports application code, so it catches the same class of bug a
// real attacker would find (a route that forgot an ownership check), not
// just what the unit-level code already assumes.

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
const CREATOR_A_TOKEN = getEnv('CREATOR_A_TOKEN')
const CREATOR_B_TOKEN = getEnv('CREATOR_B_TOKEN')
const CONVERSATION_ID = getEnv('CONVERSATION_ID')
const ATTACHMENT_PATH = getEnv('ATTACHMENT_PATH') // optional
const PRIVATE_CAMPAIGN_ID = getEnv('PRIVATE_CAMPAIGN_ID')

// Optional — Phase 4 (contracts/reporting) checks, skipped if blank.
const CAMPAIGN_CREATOR_ID = getEnv('CAMPAIGN_CREATOR_ID')
const CONTRACT_ID = getEnv('CONTRACT_ID')
const SHARE_TOKEN = getEnv('SHARE_TOKEN')

// Optional — Phase 5 (payments) checks, skipped if blank.
const PAYMENT_ID = getEnv('PAYMENT_ID')
const PAYOUT_METHOD_ID = getEnv('PAYOUT_METHOD_ID')
// A second campaign_creators row of Brand A's, with no fully_signed contract
// (any status, including none at all) — used for the payout-details 404
// check below so it still has something to test even if CAMPAIGN_CREATOR_ID
// itself happens to already be fully signed in your dev data.
const UNSIGNED_CAMPAIGN_CREATOR_ID = getEnv('UNSIGNED_CAMPAIGN_CREATOR_ID')

// Optional — Phase 6A (notifications) checks, skipped if blank.
const CREATOR_A_NOTIFICATION_ID = getEnv('CREATOR_A_NOTIFICATION_ID')

// Optional — Phase 7A (admin hardening) checks, skipped if blank.
const ADMIN_TOKEN = getEnv('ADMIN_TOKEN')
const SUPER_ADMIN_TOKEN = getEnv('SUPER_ADMIN_TOKEN')
// A disposable test user's id — ADMIN_TOKEN suspends then reactivates it to
// verify suspension actually writes an activity_logs row. Never a real account.
const ADMIN_TEST_TARGET_USER_ID = getEnv('ADMIN_TEST_TARGET_USER_ID')

// Optional — Phase 7B (admin visibility: payments/workflow/contracts/
// reports/email) checks, skipped if blank.
// WRITES DATA: fires up to 6 real POST /api/reports calls from Creator A
// against this user id to prove the per-reporter rate limit (5/hour)
// actually triggers a 429. Only ever point this at a disposable test
// account — never a real brand/creator.
const RATE_LIMIT_TEST_REPORTED_USER_ID = getEnv('RATE_LIMIT_TEST_REPORTED_USER_ID')

// Optional — creator marketplace visibility checks, skipped if blank.
// Usernames (not ids) of three different real creators in your dev data:
// one already soft-deleted, one suspended (is_active=false), one an admin
// has hidden via the "Hide from marketplace" toggle
// (creators.hidden_from_marketplace=true). All three must never appear on
// a public creator surface. Read-only — these checks never write data.
const DELETED_CREATOR_USERNAME = getEnv('DELETED_CREATOR_USERNAME')
const SUSPENDED_CREATOR_USERNAME = getEnv('SUSPENDED_CREATOR_USERNAME')
const HIDDEN_CREATOR_USERNAME = getEnv('HIDDEN_CREATOR_USERNAME')

// Optional — Phase 6B (email) checks, skipped if blank.
// A fresh, unused password-reset token's raw value (not its hash) — trigger
// POST /api/auth/forgot-password for a disposable test account, then copy
// the token out of the server console log (no RESEND_API_KEY) or the email
// itself. WRITES DATA: running this check changes that account's password
// to the fixed value below. Only ever use a disposable test account.
const PASSWORD_RESET_TOKEN = getEnv('PASSWORD_RESET_TOKEN')
const PASSWORD_RESET_TEST_NEW_PASSWORD = 'SecurityCheckReset123'

const required = { BRAND_A_TOKEN, CREATOR_A_TOKEN, CREATOR_B_TOKEN, CONVERSATION_ID, PRIVATE_CAMPAIGN_ID }
const missing = Object.entries(required).filter(([, v]) => !v).map(([k]) => k)
if (missing.length > 0) {
  console.error(`Missing required values (set in .env.test.local or the environment): ${missing.join(', ')}`)
  console.error('Copy .env.test.example to .env.test.local and fill it in with real ids/tokens from your dev data.')
  process.exit(1)
}

let passCount = 0
let failCount = 0
let skipCount = 0

const authHeaders = (token) => (token ? { Authorization: `Bearer ${token}` } : {})

// Admin auth is an HttpOnly cookie (same `auth_token` cookie the regular
// user login also sets — see src/app/api/admin/auth/login/route.ts),
// never localStorage, and the real admin UI never sends an Authorization
// header at all: its fetches are same-origin, so the browser attaches the
// cookie automatically (see the comment in src/app/admin/users/page.tsx's
// CSV export about relying on exactly that). The /api/admin/* middleware
// branch happens to also accept a Bearer header today (src/middleware.ts),
// but every ADMIN_TOKEN/SUPER_ADMIN_TOKEN request below goes through the
// cookie instead, so these checks exercise the same path production
// traffic actually uses, not an alternate one nothing real ever sends.
const ADMIN_AUTH_COOKIE_NAME = 'auth_token'
const adminCookieHeaders = (token) => (token ? { Cookie: `${ADMIN_AUTH_COOKIE_NAME}=${token}` } : {})

async function request(urlPath, options = {}) {
  return fetch(`${BASE_URL}${urlPath}`, options)
}

async function check(name, fn) {
  try {
    const { pass, detail } = await fn()
    if (pass) {
      passCount += 1
      console.log(`PASS  ${name}${detail ? ` (${detail})` : ''}`)
    } else {
      failCount += 1
      console.log(`FAIL  ${name}${detail ? ` (${detail})` : ''}`)
    }
  } catch (err) {
    failCount += 1
    console.log(`FAIL  ${name} (threw: ${err instanceof Error ? err.message : String(err)})`)
  }
}

function skip(name, reason) {
  skipCount += 1
  console.log(`SKIP  ${name} (${reason})`)
}

// Checks raw response text for any of the given JSON key names, as they'd
// appear serialized (`"key":`) — catches a leak regardless of where in the
// response shape it ended up, without needing to know the exact schema.
function leaksAnyKey(text, keys) {
  return keys.filter((k) => text.includes(`"${k}":`))
}

// Reads the payload of a JWT without verifying its signature — fine here
// since the token is one this script was already handed to use as a bearer
// credential; this just reads the email claim already inside it instead of
// needing a separate env var for the same account.
function decodeJwtPayload(token) {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'))
  } catch {
    return null
  }
}

async function main() {
  console.log(`Running security checks against ${BASE_URL}\n`)

  await check('Creator B cannot read the conversation (GET /api/conversations/:id)', async () => {
    const res = await request(`/api/conversations/${CONVERSATION_ID}`, { headers: authHeaders(CREATOR_B_TOKEN) })
    return { pass: res.status === 404, detail: `status ${res.status}` }
  })

  await check('Creator B cannot post a message into it', async () => {
    const res = await request(`/api/conversations/${CONVERSATION_ID}/messages`, {
      method: 'POST',
      headers: { ...authHeaders(CREATOR_B_TOKEN), 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'security-check probe — should never be sent' }),
    })
    return { pass: res.status === 404, detail: `status ${res.status}` }
  })

  if (ATTACHMENT_PATH) {
    await check('Creator B cannot resolve a signed attachment URL in it', async () => {
      const res = await request(
        `/api/conversations/${CONVERSATION_ID}/attachments/sign?path=${encodeURIComponent(ATTACHMENT_PATH)}`,
        { headers: authHeaders(CREATOR_B_TOKEN) }
      )
      return { pass: res.status === 404, detail: `status ${res.status}` }
    })
  } else {
    skip('Creator B cannot resolve a signed attachment URL in it', 'ATTACHMENT_PATH not set')
  }

  await check('Dead /api/messages route stays gone', async () => {
    const res = await request('/api/messages', { headers: authHeaders(CREATOR_B_TOKEN) })
    return { pass: res.status === 404, detail: `status ${res.status}` }
  })

  await check('Creator B sees no private campaigns and no client_name key (GET /api/campaigns)', async () => {
    const res = await request('/api/campaigns?limit=50', { headers: authHeaders(CREATOR_B_TOKEN) })
    const text = await res.text()
    const leaksClientName = text.includes('"client_name"')
    let leaksPrivate = false
    try {
      const data = JSON.parse(text)
      leaksPrivate = (data.campaigns || []).some((c) => c.visibility === 'private')
    } catch {
      // non-JSON response — leave leaksPrivate false, status check below still applies
    }
    return {
      pass: res.status === 200 && !leaksClientName && !leaksPrivate,
      detail: `status ${res.status}, client_name leaked: ${leaksClientName}, private campaign leaked: ${leaksPrivate}`,
    }
  })

  await check('Logged-out visitor sees no private campaigns and no client_name key (GET /api/campaigns)', async () => {
    const res = await request('/api/campaigns?limit=50')
    const text = await res.text()
    const leaksClientName = text.includes('"client_name"')
    let leaksPrivate = false
    try {
      const data = JSON.parse(text)
      leaksPrivate = (data.campaigns || []).some((c) => c.visibility === 'private')
    } catch {
      // non-JSON response — leave leaksPrivate false, status check below still applies
    }
    return {
      pass: res.status === 200 && !leaksClientName && !leaksPrivate,
      detail: `status ${res.status}, client_name leaked: ${leaksClientName}, private campaign leaked: ${leaksPrivate}`,
    }
  })

  await check('Creator B cannot view the private campaign brief', async () => {
    const res = await request(`/api/campaigns/${PRIVATE_CAMPAIGN_ID}`, { headers: authHeaders(CREATOR_B_TOKEN) })
    return { pass: res.status === 404, detail: `status ${res.status}` }
  })

  await check('Creator B cannot apply to the private campaign', async () => {
    const res = await request(`/api/campaigns/${PRIVATE_CAMPAIGN_ID}/applications`, {
      method: 'POST',
      headers: { ...authHeaders(CREATOR_B_TOKEN), 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    return { pass: res.status >= 400 && res.status < 500, detail: `status ${res.status}` }
  })

  await check('Logged-out visitor cannot list conversations', async () => {
    const res = await request('/api/conversations')
    return { pass: res.status === 401, detail: `status ${res.status}` }
  })

  // ── Phase 4 — contracts/reporting ──────────────────────────────────────────

  // Shared across the CAMPAIGN_CREATOR_ID and CONTRACT_ID blocks below (two
  // separate `if`s, so this can't be declared inside either one without
  // going out of scope for the other).
  const FORBIDDEN_CREATOR_KEYS = ['charge_amount', 'brand_notes', 'client_name']

  if (CAMPAIGN_CREATOR_ID) {
    // /dashboard/go/:id is a server-rendered redirect resolver (not a
    // client-rendered page like /contracts/:id below) — it verifies the JWT
    // itself and does the ownership check server-side, so a raw fetch here
    // really does observe the 404/redirect difference, unlike the client
    // pages elsewhere in this file.
    await check('Creator B gets 404 (no Location) on /dashboard/go/:id for a row they are not party to', async () => {
      const res = await request(`/dashboard/go/${CAMPAIGN_CREATOR_ID}`, {
        redirect: 'manual',
        headers: authHeaders(CREATOR_B_TOKEN),
      })
      return {
        pass: res.status === 404 && !res.headers.get('location'),
        detail: `status ${res.status}, location: ${res.headers.get('location') ?? 'none'}`,
      }
    })

    await check('[control] Creator A is redirected to their own my-campaigns page by /dashboard/go/:id', async () => {
      const res = await request(`/dashboard/go/${CAMPAIGN_CREATOR_ID}?tab=offer`, {
        redirect: 'manual',
        headers: authHeaders(CREATOR_A_TOKEN),
      })
      const location = res.headers.get('location') ?? ''
      return {
        pass: res.status >= 300 && res.status < 400 && location.includes(`/dashboard/my-campaigns/${CAMPAIGN_CREATOR_ID}`),
        detail: `status ${res.status}, location: ${location || 'none'}`,
      }
    })

    await check('[control] Brand A is redirected to their own tracker page by /dashboard/go/:id', async () => {
      const res = await request(`/dashboard/go/${CAMPAIGN_CREATOR_ID}?tab=offer`, {
        redirect: 'manual',
        headers: authHeaders(BRAND_A_TOKEN),
      })
      const location = res.headers.get('location') ?? ''
      return {
        pass: res.status >= 300 && res.status < 400 && /\/dashboard\/campaigns\/.+\/tracker/.test(location),
        detail: `status ${res.status}, location: ${location || 'none'}`,
      }
    })

    await check("Creator B's GET /api/dashboard/action-needed contains no row for a campaign_creator they are not party to", async () => {
      const res = await request('/api/dashboard/action-needed', { headers: authHeaders(CREATOR_B_TOKEN) })
      const text = await res.text()
      return {
        pass: res.status === 200 && !text.includes(CAMPAIGN_CREATOR_ID),
        detail: `status ${res.status}, leaked id: ${text.includes(CAMPAIGN_CREATOR_ID)}`,
      }
    })

    const subResources = ['offers', 'deliverables', 'events', 'contracts']
    for (const resource of subResources) {
      await check(`Creator B gets 404 on /api/campaign-creators/:id/${resource}`, async () => {
        const res = await request(`/api/campaign-creators/${CAMPAIGN_CREATOR_ID}/${resource}`, {
          headers: authHeaders(CREATOR_B_TOKEN),
        })
        return { pass: res.status === 404, detail: `status ${res.status}` }
      })
    }

    for (const resource of ['offers', 'deliverables', 'events']) {
      await check(`Creator A's own /api/campaign-creators/:id/${resource} has no charge_amount/brand_notes/client_name`, async () => {
        const res = await request(`/api/campaign-creators/${CAMPAIGN_CREATOR_ID}/${resource}`, {
          headers: authHeaders(CREATOR_A_TOKEN),
        })
        const text = await res.text()
        const leaked = leaksAnyKey(text, FORBIDDEN_CREATOR_KEYS)
        return { pass: res.status === 200 && leaked.length === 0, detail: `status ${res.status}, leaked: ${leaked.join(',') || 'none'}` }
      })
    }

    await check('Creator A\'s own /api/calendar has no charge_amount/payout_amount/brand_notes/client_name', async () => {
      const res = await request('/api/calendar', { headers: authHeaders(CREATOR_A_TOKEN) })
      const text = await res.text()
      const leaked = leaksAnyKey(text, [...FORBIDDEN_CREATOR_KEYS, 'payout_amount'])
      return { pass: res.status === 200 && leaked.length === 0, detail: `status ${res.status}, leaked: ${leaked.join(',') || 'none'}` }
    })
  } else {
    skip('Phase 4: campaign_creators sub-resource checks', 'CAMPAIGN_CREATOR_ID not set')
  }

  if (CONTRACT_ID) {
    await check('Creator B gets 404 on GET /api/contracts/:id', async () => {
      const res = await request(`/api/contracts/${CONTRACT_ID}`, { headers: authHeaders(CREATOR_B_TOKEN) })
      return { pass: res.status === 404, detail: `status ${res.status}` }
    })

    // /contracts/:id is a client-rendered page (no SSR auth check, same
    // pattern as /share/:token) — the HTTP response is always 200 regardless
    // of who's asking, because the page only fetches /api/contracts/:id (the
    // real boundary, checked above) after it loads in the browser. A raw
    // fetch here can't carry the browser's localStorage token either, so
    // "the page 404s for Creator B" isn't something this script can observe
    // directly. What it CAN verify: the server-rendered HTML never embeds
    // the contract body for anyone, authorized or not — there is no
    // SSR-time leak to catch regardless of auth.
    await check('/contracts/:id server HTML never embeds the contract body (client-fetched only, no SSR leak)', async () => {
      const res = await request(`/contracts/${CONTRACT_ID}`)
      const text = await res.text()
      const leaked = leaksAnyKey(text, ['body_snapshot', 'body_hash', ...FORBIDDEN_CREATOR_KEYS])
      return { pass: res.status === 200 && leaked.length === 0, detail: `status ${res.status}, leaked: ${leaked.join(',') || 'none'}` }
    })

    await check('Contract body contains no client_name/charge_amount/brand_notes', async () => {
      const res = await request(`/api/contracts/${CONTRACT_ID}`, { headers: authHeaders(BRAND_A_TOKEN) })
      const text = await res.text()
      const leaked = leaksAnyKey(text, FORBIDDEN_CREATOR_KEYS)
      return { pass: res.status === 200 && leaked.length === 0, detail: `status ${res.status}, leaked: ${leaked.join(',') || 'none'}` }
    })
  } else {
    skip('Phase 4: contract checks', 'CONTRACT_ID not set')
  }

  if (SHARE_TOKEN) {
    await check('GET /api/share/:token has no payout_amount/profit/brand_notes anywhere', async () => {
      const res = await request(`/api/share/${SHARE_TOKEN}`)
      const text = await res.text()
      const leaked = leaksAnyKey(text, ['payout_amount', 'total_payout', 'profit', 'total_profit', 'brand_notes'])
      return { pass: res.status === 200 && leaked.length === 0, detail: `status ${res.status}, leaked: ${leaked.join(',') || 'none'}` }
    })
  } else {
    skip('Phase 4: share link checks', 'SHARE_TOKEN not set')
  }

  // ── Phase 5 — payments ──────────────────────────────────────────────────────

  if (PAYOUT_METHOD_ID) {
    await check("Creator B gets 404 updating Creator A's payout method", async () => {
      const res = await request(`/api/payout-methods/${PAYOUT_METHOD_ID}`, {
        method: 'PUT',
        headers: { ...authHeaders(CREATOR_B_TOKEN), 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: 'USD' }),
      })
      return { pass: res.status === 404, detail: `status ${res.status}` }
    })
  } else {
    skip("Creator B gets 404 updating Creator A's payout method", 'PAYOUT_METHOD_ID not set')
  }

  if (CAMPAIGN_CREATOR_ID) {
    // The route needs BOTH a fully_signed contract AND an open (not yet
    // confirmed/cancelled) payment on the row — see the route's own
    // comment in src/app/api/campaign-creators/[id]/payout-details/route.ts.
    // Probing the real endpoint directly (rather than inferring from
    // CONTRACT_ID's status alone, which only checks the first precondition)
    // is what actually tells us which case applies — dev-data payments
    // move to confirmed/cancelled over time, so CAMPAIGN_CREATOR_ID can
    // drift from "both preconditions met" to "contract signed, no open
    // payment left" between runs without anyone changing .env.test.local.
    const probeRes = await request(`/api/campaign-creators/${CAMPAIGN_CREATOR_ID}/payout-details`, { headers: authHeaders(BRAND_A_TOKEN) })
    const probeText = await probeRes.text()
    const accessible = probeRes.status === 200

    const unsignedRowId = !accessible ? CAMPAIGN_CREATOR_ID : UNSIGNED_CAMPAIGN_CREATOR_ID
    if (unsignedRowId) {
      await check('Brand A gets 404 on payout-details without both a fully signed contract and an open payment', async () => {
        if (!accessible) {
          return { pass: probeRes.status === 404, detail: `status ${probeRes.status}` }
        }
        const res = await request(`/api/campaign-creators/${unsignedRowId}/payout-details`, { headers: authHeaders(BRAND_A_TOKEN) })
        return { pass: res.status === 404, detail: `status ${res.status}` }
      })
    } else {
      skip(
        'Brand A gets 404 on payout-details without both a fully signed contract and an open payment',
        'CAMPAIGN_CREATOR_ID already satisfies both preconditions in this test data, and UNSIGNED_CAMPAIGN_CREATOR_ID is not set'
      )
    }

    if (accessible) {
      await check('Payout-details (no ?reveal) never contains raw account details', async () => {
        // The masked response only ever carries masked_preview — "details"
        // only appears in the ?reveal=true branch, which this call doesn't use.
        const leaksRawDetails = probeText.includes('"details":')
        return { pass: !leaksRawDetails, detail: `status 200, leaked raw details: ${leaksRawDetails}` }
      })
    } else {
      // Fixture drift (the preconditions no longer both hold), not a code
      // problem — SKIP rather than FAIL so a passing run doesn't mask a
      // real regression and a drifted fixture doesn't cry wolf either.
      skip(
        'Payout-details (no ?reveal) never contains raw account details',
        `CAMPAIGN_CREATOR_ID returned ${probeRes.status}, not 200 — it needs both a fully_signed contract and an open (not confirmed/cancelled) payment; see the SQL snippet for CAMPAIGN_CREATOR_ID in .env.test.example to find a row that currently satisfies both`
      )
    }

    await check('Creating a milestone payment without deliverable_ids returns 400', async () => {
      const res = await request(`/api/campaign-creators/${CAMPAIGN_CREATOR_ID}/payments`, {
        method: 'POST',
        headers: { ...authHeaders(BRAND_A_TOKEN), 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 10 }), // no deliverable_ids
      })
      return { pass: res.status === 400, detail: `status ${res.status}` }
    })

    const FORBIDDEN_PAYMENT_KEYS = ['charge_amount', 'profit', 'total_charge', 'total_profit', 'brand_notes']

    await check("Creator A's own .../payments has no charge/profit", async () => {
      const res = await request(`/api/campaign-creators/${CAMPAIGN_CREATOR_ID}/payments`, { headers: authHeaders(CREATOR_A_TOKEN) })
      const text = await res.text()
      const leaked = leaksAnyKey(text, FORBIDDEN_PAYMENT_KEYS)
      return { pass: res.status === 200 && leaked.length === 0, detail: `status ${res.status}, leaked: ${leaked.join(',') || 'none'}` }
    })

    if (PAYMENT_ID) {
      await check('Creator A cannot mark their own payment as paid', async () => {
        const res = await request(`/api/campaign-creators/${CAMPAIGN_CREATOR_ID}/payments/${PAYMENT_ID}/mark-paid`, {
          method: 'POST',
          headers: { ...authHeaders(CREATOR_A_TOKEN), 'Content-Type': 'application/json' },
          body: JSON.stringify({ method: 'wise', reference: 'security-check probe — should never be accepted' }),
        })
        return { pass: res.status === 403, detail: `status ${res.status}` }
      })

      await check('Creator B gets 404 on a payment proof signed URL for a row they are not party to', async () => {
        const res = await request(`/api/campaign-creators/${CAMPAIGN_CREATOR_ID}/payments/${PAYMENT_ID}/proof/sign`, {
          headers: authHeaders(CREATOR_B_TOKEN),
        })
        return { pass: res.status === 404, detail: `status ${res.status}` }
      })
    } else {
      skip('Creator A cannot mark their own payment as paid', 'PAYMENT_ID not set')
      skip('Creator B gets 404 on a payment proof signed URL', 'PAYMENT_ID not set')
    }
  } else {
    skip('Phase 5: payment checks', 'CAMPAIGN_CREATOR_ID not set')
  }

  await check("Creator A's own /api/campaign-creators/my-payments has no charge/profit", async () => {
    const res = await request('/api/campaign-creators/my-payments', { headers: authHeaders(CREATOR_A_TOKEN) })
    const text = await res.text()
    const leaked = leaksAnyKey(text, ['charge_amount', 'profit', 'total_charge', 'total_profit', 'brand_notes'])
    return { pass: res.status === 200 && leaked.length === 0, detail: `status ${res.status}, leaked: ${leaked.join(',') || 'none'}` }
  })

  // ── Phase 6A — notifications ─────────────────────────────────────────────────

  await check("Creator A's own GET /api/notifications has no charge/profit/brand_notes/client_name", async () => {
    const res = await request('/api/notifications?limit=50', { headers: authHeaders(CREATOR_A_TOKEN) })
    const text = await res.text()
    const leaked = leaksAnyKey(text, ['charge_amount', 'profit', 'total_charge', 'total_profit', 'brand_notes', 'client_name'])
    return { pass: res.status === 200 && leaked.length === 0, detail: `status ${res.status}, leaked: ${leaked.join(',') || 'none'}` }
  })

  if (CREATOR_A_NOTIFICATION_ID) {
    // GET is scoped by the trusted x-user-id header (.eq('user_id', userId)
    // server-side) — Creator B's own list can structurally never include
    // Creator A's notification, so there's nothing to probe there. The real
    // question is PATCH: does it actually scope the UPDATE by owner, or
    // does it just return 200 "success" while silently affecting 0 rows
    // (which would look identical from the HTTP response alone)? Verified
    // by checking Creator A's notification is genuinely untouched after
    // Creator B's attempt, not just by the status code of that attempt.
    await check("Creator A's notification isn't listed for Creator B (GET /api/notifications)", async () => {
      const res = await request('/api/notifications?limit=50', { headers: authHeaders(CREATOR_B_TOKEN) })
      const text = await res.text()
      return { pass: res.status === 200 && !text.includes(CREATOR_A_NOTIFICATION_ID), detail: `status ${res.status}, leaked id: ${text.includes(CREATOR_A_NOTIFICATION_ID)}` }
    })

    await check("Creator B marking Creator A's notification read has no real effect", async () => {
      const markRes = await request('/api/notifications', {
        method: 'PATCH',
        headers: { ...authHeaders(CREATOR_B_TOKEN), 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: CREATOR_A_NOTIFICATION_ID }),
      })
      const checkRes = await request('/api/notifications?limit=50', { headers: authHeaders(CREATOR_A_TOKEN) })
      const data = await checkRes.json().catch(() => ({ notifications: [] }))
      const row = (data.notifications || []).find((n) => n.id === CREATOR_A_NOTIFICATION_ID)
      // row may be undefined if it's already read and outside the first 50 —
      // in that case there's nothing this check can observe either way.
      const stillUnread = row ? row.is_read === false : null
      return {
        pass: markRes.status < 500 && (stillUnread === null || stillUnread === true),
        detail: `PATCH status ${markRes.status}, Creator A's copy still unread: ${stillUnread}`,
      }
    })

    await check("Creator B archiving Creator A's notification has no real effect", async () => {
      const archiveRes = await request('/api/notifications', {
        method: 'PATCH',
        headers: { ...authHeaders(CREATOR_B_TOKEN), 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: CREATOR_A_NOTIFICATION_ID, archived: true }),
      })
      const checkRes = await request('/api/notifications?limit=50', { headers: authHeaders(CREATOR_A_TOKEN) })
      const text = await checkRes.text()
      return {
        pass: archiveRes.status < 500 && checkRes.status === 200 && text.includes(CREATOR_A_NOTIFICATION_ID),
        detail: `PATCH status ${archiveRes.status}, still visible to Creator A: ${text.includes(CREATOR_A_NOTIFICATION_ID)}`,
      }
    })
  } else {
    skip("Creator B can't read or modify Creator A's notification", 'CREATOR_A_NOTIFICATION_ID not set')
  }

  // ── Phase 6B — email ──────────────────────────────────────────────────────────

  await check('GET /api/cron/message-digest returns 401 without the secret', async () => {
    const res = await request('/api/cron/message-digest')
    return { pass: res.status === 401, detail: `status ${res.status}` }
  })

  await check('GET /api/cron/daily-summary returns 401 without the secret', async () => {
    const res = await request('/api/cron/daily-summary')
    return { pass: res.status === 401, detail: `status ${res.status}` }
  })

  await check('Cron routes reject a wrong secret, not just a missing one', async () => {
    const res = await request('/api/cron/daily-summary', { headers: { Authorization: 'Bearer not-the-real-secret' } })
    return { pass: res.status === 401, detail: `status ${res.status}` }
  })

  // Unsubscribe links carry their own userId inside a signed token — there
  // is no separate "which user" parameter on the request for an attacker to
  // substitute, so the only thing a black-box test can probe is that an
  // unsigned/garbage token is rejected outright rather than falling back to
  // some default account.
  await check("POST /api/email/unsubscribe rejects a garbage token (can't fall back to another user)", async () => {
    const res = await request('/api/email/unsubscribe?token=not-a-real-token', { method: 'POST' })
    return { pass: res.status === 400, detail: `status ${res.status}` }
  })

  await check('Password reset rejects an unknown/garbage token', async () => {
    const res = await request('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: `not-a-real-token-${Date.now()}`, password: 'SomePassword123' }),
    })
    return { pass: res.status === 400, detail: `status ${res.status}` }
  })

  const creatorAClaims = decodeJwtPayload(CREATOR_A_TOKEN)
  if (creatorAClaims?.email) {
    await check('Forgot-password responds identically for a real vs a fake email (no enumeration)', async () => {
      const [resReal, resFake] = await Promise.all([
        request('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: creatorAClaims.email }),
        }),
        request('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: `definitely-not-registered-${Date.now()}@example.com` }),
        }),
      ])
      const [textReal, textFake] = await Promise.all([resReal.text(), resFake.text()])
      return {
        pass: resReal.status === resFake.status && textReal === textFake,
        detail: `real: ${resReal.status}, fake: ${resFake.status}, identical body: ${textReal === textFake}`,
      }
    })
  } else {
    skip('Forgot-password responds identically for a real vs a fake email', "couldn't decode an email claim from CREATOR_A_TOKEN")
  }

  if (PASSWORD_RESET_TOKEN) {
    await check('Password reset token works once, then rejects reuse (single-use)', async () => {
      const body = JSON.stringify({ token: PASSWORD_RESET_TOKEN, password: PASSWORD_RESET_TEST_NEW_PASSWORD })
      const first = await request('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })
      const second = await request('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })
      return {
        pass: first.status === 200 && second.status === 400,
        detail: `first use: ${first.status}, reuse attempt: ${second.status}`,
      }
    })
  } else {
    skip('Password reset token works once, then rejects reuse', 'PASSWORD_RESET_TOKEN not set — see .env.test.example')
  }

  // ── Phase 7A — admin hardening ────────────────────────────────────────────────

  if (ADMIN_TOKEN || SUPER_ADMIN_TOKEN) {
    const nonAdminToken = CREATOR_A_TOKEN
    await check('Creator token gets 403 on /api/admin/* (middleware-level gate)', async () => {
      const res = await request('/api/admin/users?limit=1', { headers: authHeaders(nonAdminToken) })
      return { pass: res.status === 403, detail: `status ${res.status}` }
    })

    await check('Brand token gets 403 on /api/admin/* (middleware-level gate)', async () => {
      const res = await request('/api/admin/users?limit=1', { headers: authHeaders(BRAND_A_TOKEN) })
      return { pass: res.status === 403, detail: `status ${res.status}` }
    })
  } else {
    skip('Creator/Brand token gets 403 on /api/admin/*', 'ADMIN_TOKEN/SUPER_ADMIN_TOKEN not set')
  }

  // Positive controls, run BEFORE anything that depends on ADMIN_TOKEN/
  // SUPER_ADMIN_TOKEN actually having the role their name claims. Without
  // this, a mislabeled .env.test.local (e.g. ADMIN_TOKEN pointing at a
  // plain user) makes every "admin gets 403 on X" check below pass
  // vacuously — the middleware's generic role gate would 403 it too, so
  // the check "passes" without ever exercising the route's own
  // admin-vs-super_admin logic. These two booleans gate every check below
  // that assumes the token is real.
  let adminTokenIsAdmin = null
  if (ADMIN_TOKEN) {
    await check('[control] ADMIN_TOKEN really is an admin (GET /api/admin/payments → 200)', async () => {
      const res = await request('/api/admin/payments?limit=1', { headers: adminCookieHeaders(ADMIN_TOKEN) })
      adminTokenIsAdmin = res.status === 200
      return { pass: adminTokenIsAdmin, detail: `status ${res.status}` }
    })
  }

  let superAdminTokenIsSuperAdmin = null
  if (SUPER_ADMIN_TOKEN) {
    await check('[control] SUPER_ADMIN_TOKEN really is a super admin (PATCH /api/admin/settings, written back unchanged, → 200)', async () => {
      // Round-trips one existing value back to itself (true no-op in effect,
      // not an empty body) so this exercises the super_admin gate without
      // actually changing platform behavior.
      const getRes = await request('/api/admin/settings', { headers: adminCookieHeaders(SUPER_ADMIN_TOKEN) })
      const getData = await getRes.json().catch(() => ({}))
      const currentPageSize = getData?.settings?.default_page_size ?? 20

      const res = await request('/api/admin/settings', {
        method: 'PATCH',
        headers: { ...adminCookieHeaders(SUPER_ADMIN_TOKEN), 'Content-Type': 'application/json' },
        body: JSON.stringify({ default_page_size: currentPageSize, reason: 'security-check probe — value written back unchanged' }),
      })
      superAdminTokenIsSuperAdmin = res.status === 200
      return { pass: superAdminTokenIsSuperAdmin, detail: `status ${res.status}` }
    })
  } else {
    skip('[control] SUPER_ADMIN_TOKEN really is a super admin', 'SUPER_ADMIN_TOKEN not set')
  }

  // Every check below that assumes ADMIN_TOKEN is a genuine (non-super)
  // admin routes through this instead of calling `check` directly — if the
  // control above failed, it reports an explicit FAIL naming the real
  // cause instead of either silently skipping or (worse) letting a
  // coincidental 403 from the generic middleware gate pass for the wrong
  // reason.
  const checkAsAdmin = (name, fn) => {
    if (adminTokenIsAdmin === false) {
      return check(name, async () => ({ pass: false, detail: 'ADMIN_TOKEN is not an admin — see the "ADMIN_TOKEN really is an admin" control above' }))
    }
    return check(name, fn)
  }

  if (ADMIN_TOKEN) {
    // All three checks use a bogus/nonexistent id: every route checks the
    // caller's role before it ever touches the target row, so the 403
    // happens before any real lookup — safe to probe without a real id.
    const BOGUS_ID = '00000000-0000-0000-0000-000000000000'

    await checkAsAdmin('Admin (not super) gets 403 on DELETE /api/admin/users/:id', async () => {
      const res = await request(`/api/admin/users/${BOGUS_ID}`, {
        method: 'DELETE',
        headers: { ...adminCookieHeaders(ADMIN_TOKEN), 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'security-check probe — should never reach the DB' }),
      })
      return { pass: res.status === 403, detail: `status ${res.status}` }
    })

    await checkAsAdmin('Admin (not super) gets 403 changing a role (PATCH /api/admin/users/:id)', async () => {
      const res = await request(`/api/admin/users/${BOGUS_ID}`, {
        method: 'PATCH',
        headers: { ...adminCookieHeaders(ADMIN_TOKEN), 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'super_admin', reason: 'security-check probe — should never reach the DB' }),
      })
      return { pass: res.status === 403, detail: `status ${res.status}` }
    })

    await checkAsAdmin('Admin (not super) gets 403 on PATCH /api/admin/settings', async () => {
      const res = await request('/api/admin/settings', {
        method: 'PATCH',
        headers: { ...adminCookieHeaders(ADMIN_TOKEN), 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'security-check probe — should never reach the DB' }),
      })
      return { pass: res.status === 403, detail: `status ${res.status}` }
    })

    if (ADMIN_TEST_TARGET_USER_ID) {
      await checkAsAdmin('Admin suspending a user writes a real activity_logs row (and reactivating undoes it)', async () => {
        try {
          const suspendRes = await request(`/api/admin/users/${ADMIN_TEST_TARGET_USER_ID}/suspend`, {
            method: 'POST',
            headers: { ...adminCookieHeaders(ADMIN_TOKEN), 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: 'security-check probe — reactivated immediately after' }),
          })
          if (suspendRes.status !== 200) {
            return { pass: false, detail: `suspend returned ${suspendRes.status}, expected 200` }
          }

          const logsRes = await request('/api/admin/activity/entries?group=admin&limit=5', { headers: adminCookieHeaders(ADMIN_TOKEN) })
          const logsData = await logsRes.json().catch(() => ({ logs: [] }))
          const wrote = (logsData.logs ?? []).some(
            (l) => l.action === 'user_suspended' && l.entity_id === ADMIN_TEST_TARGET_USER_ID
          )
          return { pass: logsRes.status === 200 && wrote, detail: `activity log status ${logsRes.status}, matching row found: ${wrote}` }
        } finally {
          // Always reactivate, even if the assertion above failed, so this
          // check never leaves the test account suspended.
          await request(`/api/admin/users/${ADMIN_TEST_TARGET_USER_ID}/activate`, {
            method: 'POST',
            headers: { ...adminCookieHeaders(ADMIN_TOKEN), 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: 'security-check probe — restoring state' }),
          })
        }
      })
    } else {
      skip('Admin suspending a user writes a real activity_logs row', 'ADMIN_TEST_TARGET_USER_ID not set')
    }
  } else {
    skip('Admin (not super) gets 403 on delete/role-change/settings', 'ADMIN_TOKEN not set')
  }

  // ── Phase 7B — admin visibility (payments/workflow/contracts/reports/email) ────

  if (CREATOR_A_TOKEN) {
    // The middleware-level role gate (asserted once above for /api/admin/
    // users) is the single enforcement point for every /api/admin/* route,
    // but each of these is a brand-new route this phase added — checked
    // individually so a future route-specific bypass would actually be
    // caught here, not just assumed covered by the generic case.
    const NEW_ADMIN_ROUTES = [
      '/api/admin/payments?limit=1',
      '/api/admin/campaign-creators?limit=1',
      '/api/admin/contracts?limit=1',
      '/api/admin/reports?limit=1',
      '/api/admin/email?limit=1',
    ]
    for (const route of NEW_ADMIN_ROUTES) {
      await check(`Non-admin token gets 403 on ${route.split('?')[0]}`, async () => {
        const res = await request(route, { headers: authHeaders(CREATOR_A_TOKEN) })
        return { pass: res.status === 403, detail: `status ${res.status}` }
      })
    }
  } else {
    skip('Non-admin token gets 403 on every new Phase 7B admin route', 'CREATOR_A_TOKEN not set')
  }

  if (!PAYMENT_ID) {
    skip('GET /api/admin/payments/:id never leaks raw payout details', 'PAYMENT_ID not set')
  } else if (!ADMIN_TOKEN) {
    skip('GET /api/admin/payments/:id never leaks raw payout details', 'ADMIN_TOKEN not set')
  } else if (adminTokenIsAdmin === false) {
    await check('GET /api/admin/payments/:id never leaks raw payout details, masked preview only', async () => ({
      pass: false,
      detail: 'ADMIN_TOKEN is not an admin — see the "ADMIN_TOKEN really is an admin" control above',
    }))
  } else {
    // Fixture-aware: PAYMENT_ID can go stale (fixture drift) independently
    // of the route working correctly, and a creator with no payout method
    // on file makes the leak-check vacuously true (nothing to leak in the
    // first place). Both are SKIP, not FAIL — only an actual leak, or a
    // genuine non-200 while the token and id are both known-good, is a
    // real finding.
    const FORBIDDEN_PAYOUT_KEYS = ['details_encrypted', 'account_holder_name', 'account_number', 'iban', 'routing_number', 'sort_code']
    let probe
    try {
      const res = await request(`/api/admin/payments/${PAYMENT_ID}`, { headers: adminCookieHeaders(ADMIN_TOKEN) })
      probe = { status: res.status, text: await res.text() }
    } catch (err) {
      probe = { status: 0, text: '', error: err instanceof Error ? err.message : String(err) }
    }

    if (probe.status !== 200) {
      skip(
        'GET /api/admin/payments/:id never leaks raw payout details',
        `PAYMENT_ID returned ${probe.error ?? probe.status} instead of 200 — it may have been deleted or the fixture drifted; see the SQL snippet for PAYMENT_ID in .env.test.example`
      )
    } else {
      let hasPayoutMethod = false
      try {
        const data = JSON.parse(probe.text)
        hasPayoutMethod = Array.isArray(data?.payoutMethods) && data.payoutMethods.length > 0
      } catch {
        // leave hasPayoutMethod false — an unparsable 200 body fails the
        // check below on its own terms (leaksAnyKey just won't match)
      }

      if (!hasPayoutMethod) {
        skip(
          'GET /api/admin/payments/:id never leaks raw payout details',
          "PAYMENT_ID's creator has no payout method on file — nothing to check for leakage; see the SQL snippet for PAYMENT_ID in .env.test.example to find one whose creator has"
        )
      } else {
        await check('GET /api/admin/payments/:id never leaks raw payout details, masked preview only', async () => {
          const leaked = leaksAnyKey(probe.text, FORBIDDEN_PAYOUT_KEYS)
          return { pass: leaked.length === 0, detail: `leaked: ${leaked.join(',') || 'none'}` }
        })
      }
    }
  }

  if (RATE_LIMIT_TEST_REPORTED_USER_ID) {
    await check('POST /api/reports rate limits a reporter at 5/hour', async () => {
      const statuses = []
      for (let i = 0; i < 6; i += 1) {
        const res = await request('/api/reports', {
          method: 'POST',
          headers: { ...authHeaders(CREATOR_A_TOKEN), 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reported_user_id: RATE_LIMIT_TEST_REPORTED_USER_ID,
            category: 'other',
            note: `security-check rate-limit probe #${i + 1}`,
          }),
        })
        statuses.push(res.status)
      }
      return { pass: statuses.includes(429), detail: `statuses: ${statuses.join(',')}` }
    })
  } else {
    skip('POST /api/reports rate limits a reporter at 5/hour', 'RATE_LIMIT_TEST_REPORTED_USER_ID not set — see .env.test.example (WRITES DATA)')
  }

  // ── Creator marketplace visibility ──────────────────────────────────────────

  if (DELETED_CREATOR_USERNAME) {
    await check("A deleted creator's profile page returns 404", async () => {
      const res = await request(`/creators/${DELETED_CREATOR_USERNAME}`)
      return { pass: res.status === 404, detail: `status ${res.status}` }
    })
  } else {
    skip("A deleted creator's profile page returns 404", 'DELETED_CREATOR_USERNAME not set')
  }

  const MARKETPLACE_EXCLUDED_CREATORS = [
    ['a deleted', DELETED_CREATOR_USERNAME],
    ['a suspended', SUSPENDED_CREATOR_USERNAME],
    ['an admin-hidden', HIDDEN_CREATOR_USERNAME],
  ]
  for (const [label, username] of MARKETPLACE_EXCLUDED_CREATORS) {
    if (!username) {
      skip(`GET /api/creators never contains ${label} creator`, `${label === 'a deleted' ? 'DELETED' : label === 'a suspended' ? 'SUSPENDED' : 'HIDDEN'}_CREATOR_USERNAME not set`)
      continue
    }
    await check(`GET /api/creators never contains ${label} creator (search=${username})`, async () => {
      const res = await request(`/api/creators?search=${encodeURIComponent(username)}&limit=50`)
      const text = await res.text()
      const leaked = text.includes(`"username":"${username}"`)
      return { pass: res.status === 200 && !leaked, detail: `status ${res.status}, leaked: ${leaked}` }
    })
  }

  // Positive controls — if these fail, every 404 above might just mean the
  // route is broken for everyone, not that access control actually works.
  await check('[control] Brand A CAN read the conversation', async () => {
    const res = await request(`/api/conversations/${CONVERSATION_ID}`, { headers: authHeaders(BRAND_A_TOKEN) })
    return { pass: res.status === 200, detail: `status ${res.status}` }
  })

  await check('[control] Creator A CAN read the conversation', async () => {
    const res = await request(`/api/conversations/${CONVERSATION_ID}`, { headers: authHeaders(CREATOR_A_TOKEN) })
    return { pass: res.status === 200, detail: `status ${res.status}` }
  })

  if (CONTRACT_ID) {
    await check('[control] Brand A CAN read the contract', async () => {
      const res = await request(`/api/contracts/${CONTRACT_ID}`, { headers: authHeaders(BRAND_A_TOKEN) })
      return { pass: res.status === 200, detail: `status ${res.status}` }
    })

    await check('[control] Creator A CAN read the contract', async () => {
      const res = await request(`/api/contracts/${CONTRACT_ID}`, { headers: authHeaders(CREATOR_A_TOKEN) })
      return { pass: res.status === 200, detail: `status ${res.status}` }
    })
  } else {
    skip('[control] Brand A / Creator A CAN read the contract', 'CONTRACT_ID not set')
  }

  console.log(`\n${passCount} passed, ${failCount} failed, ${skipCount} skipped`)
  process.exit(failCount > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('security-check crashed:', err)
  process.exit(1)
})
