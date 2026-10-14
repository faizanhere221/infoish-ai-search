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

  console.log(`\n${passCount} passed, ${failCount} failed, ${skipCount} skipped`)
  process.exit(failCount > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('security-check crashed:', err)
  process.exit(1)
})
