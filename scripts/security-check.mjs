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

    const FORBIDDEN_CREATOR_KEYS = ['charge_amount', 'brand_notes', 'client_name']

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
    // Adaptive: only meaningful when the row's contract (if CONTRACT_ID is
    // set) is NOT fully_signed yet — payout-details 404s until it is. If the
    // contract happens to already be fully_signed in your test data, this
    // check doesn't apply and is skipped rather than asserting the wrong
    // thing.
    let contractIsFullySigned = false
    if (CONTRACT_ID) {
      const contractRes = await request(`/api/contracts/${CONTRACT_ID}`, { headers: authHeaders(BRAND_A_TOKEN) })
      if (contractRes.ok) {
        const data = await contractRes.json().catch(() => ({}))
        contractIsFullySigned = data?.contract?.status === 'fully_signed'
      }
    }

    if (!contractIsFullySigned) {
      await check('Brand A gets 404 on payout-details without a fully signed contract', async () => {
        const res = await request(`/api/campaign-creators/${CAMPAIGN_CREATOR_ID}/payout-details`, { headers: authHeaders(BRAND_A_TOKEN) })
        return { pass: res.status === 404, detail: `status ${res.status}` }
      })
      skip('Payout-details (no ?reveal) never contains raw account details', 'needs a fully_signed contract to get a 200 to inspect — see the 404 check above')
    } else {
      skip('Brand A gets 404 on payout-details without a fully signed contract', 'the contract on CAMPAIGN_CREATOR_ID is already fully_signed in this test data')

      await check('Payout-details (no ?reveal) never contains raw account details', async () => {
        const res = await request(`/api/campaign-creators/${CAMPAIGN_CREATOR_ID}/payout-details`, { headers: authHeaders(BRAND_A_TOKEN) })
        const text = await res.text()
        // The masked response only ever carries masked_preview — "details"
        // only appears in the ?reveal=true branch, which this call doesn't use.
        const leaksRawDetails = text.includes('"details":')
        return { pass: res.status === 200 && !leaksRawDetails, detail: `status ${res.status}, leaked raw details: ${leaksRawDetails}` }
      })
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
