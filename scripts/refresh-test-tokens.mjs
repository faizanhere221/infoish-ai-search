#!/usr/bin/env node
// Refreshes the user-login test tokens in .env.test.local by signing in to
// /api/auth/login with each test account. Plain Node, no dependencies.
//
//   node scripts/refresh-test-tokens.mjs           refresh tokens that are
//                                                   missing, invalid or expire
//                                                   within 24 hours
//   node scripts/refresh-test-tokens.mjs --force   refresh every account
//   npm run test:security:fresh                    this, then test:security
//
// Credentials come ONLY from .env.test.local (gitignored, the same file the
// test scripts read) or the environment, never from this file:
//   TEST_BRAND_A_EMAIL / TEST_BRAND_A_PASSWORD     → BRAND_A_TOKEN      (brand)
//   TEST_CREATOR_A_EMAIL / TEST_CREATOR_A_PASSWORD → CREATOR_A_TOKEN    (creator)
//   TEST_CREATOR_B_EMAIL / TEST_CREATOR_B_PASSWORD → CREATOR_B_TOKEN    (creator)
//   TEST_CREATOR_EMAIL / TEST_CREATOR_PASSWORD     → TEST_CREATOR_TOKEN (creator,
//     optional: creator-profile-check.mjs only; skipped when not set)
//
// Never prints a token or a password. Writes only the token lines it
// refreshed (other lines, comments and line endings stay as they are), via
// a temp file + rename so a crash never leaves a half-written file. Runs
// against an already-running server (BASE_URL, default
// http://localhost:3000). /api/auth/login allows 5 sign-ins per 15 minutes
// per IP: on a 429 the script stops and says when to try again.

import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const REPO_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const ENV_FILE = path.join(REPO_ROOT, '.env.test.local')
const REFRESH_WITHIN_MS = 24 * 60 * 60 * 1000

const ACCOUNTS = [
  { tokenKey: 'BRAND_A_TOKEN', prefix: 'TEST_BRAND_A', userType: 'brand', required: true },
  { tokenKey: 'CREATOR_A_TOKEN', prefix: 'TEST_CREATOR_A', userType: 'creator', required: true },
  { tokenKey: 'CREATOR_B_TOKEN', prefix: 'TEST_CREATOR_B', userType: 'creator', required: true },
  { tokenKey: 'TEST_CREATOR_TOKEN', prefix: 'TEST_CREATOR', userType: 'creator', required: false },
]

// Same parsing as the test scripts' loadEnvFile().
function parseEnv(content) {
  const env = {}
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) {continue}
    const eq = line.indexOf('=')
    if (eq === -1) {continue}
    let value = line.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {value = value.slice(1, -1)}
    env[line.slice(0, eq).trim()] = value
  }
  return env
}

// exp (ms) from a JWT's payload, or null. Reads claims only, verifies nothing.
function tokenExpiry(token) {
  try {
    const claims = JSON.parse(Buffer.from(String(token).split('.')[1], 'base64url').toString('utf8'))
    return typeof claims.exp === 'number' ? claims.exp * 1000 : null
  } catch {
    return null
  }
}

function tokenClaims(token) {
  try {
    return JSON.parse(Buffer.from(String(token).split('.')[1], 'base64url').toString('utf8'))
  } catch {
    return {}
  }
}

const utc = (ms) => `${new Date(ms).toISOString().slice(0, 16).replace('T', ' ')} UTC`

// Replaces KEY=... in place (first match), or appends it. Keeps CRLF files CRLF.
function setEnvLine(content, key, value) {
  const eol = content.includes('\r\n') ? '\r\n' : '\n'
  const lines = content.split(/\r?\n/)
  const i = lines.findIndex((l) => l.trim().startsWith(`${key}=`))
  if (i >= 0) {lines[i] = `${key}=${value}`}
  else {
    while (lines.length > 0 && lines[lines.length - 1] === '') {lines.pop()}
    lines.push(`${key}=${value}`, '')
  }
  return lines.join(eol)
}

async function main() {
  const force = process.argv.includes('--force')
  if (!existsSync(ENV_FILE)) {
    console.error('.env.test.local not found. Copy .env.test.example to .env.test.local and fill in the TEST_*_EMAIL / TEST_*_PASSWORD values.')
    process.exit(1)
  }
  let content = readFileSync(ENV_FILE, 'utf8')
  const fileEnv = parseEnv(content)
  const get = (k) => process.env[k] ?? fileEnv[k] ?? ''
  const BASE_URL = (get('BASE_URL') || 'http://localhost:3000').replace(/\/$/, '')

  // Creator A and Creator B must be different people, or every
  // "B can't see A's data" check passes for the wrong reason.
  const emailA = get('TEST_CREATOR_A_EMAIL').trim().toLowerCase()
  const emailB = get('TEST_CREATOR_B_EMAIL').trim().toLowerCase()
  if (emailA && emailA === emailB) {
    console.error('TEST_CREATOR_A_EMAIL and TEST_CREATOR_B_EMAIL are the same account. Use two different creators.')
    process.exit(1)
  }

  console.log(`Refreshing test tokens against ${BASE_URL}${force ? ' (--force)' : ''}\n`)
  let failed = 0
  let changed = 0
  let rateLimited = false

  for (const acct of ACCOUNTS) {
    const email = get(`${acct.prefix}_EMAIL`).trim()
    const password = get(`${acct.prefix}_PASSWORD`)
    const label = acct.tokenKey.padEnd(19)
    if (!email || !password) {
      if (acct.required) {
        failed += 1
        console.log(`${label} MISSING  set ${acct.prefix}_EMAIL and ${acct.prefix}_PASSWORD in .env.test.local`)
      } else {
        console.log(`${label} skipped  (${acct.prefix}_EMAIL / ${acct.prefix}_PASSWORD not set; optional)`)
      }
      continue
    }

    const exp = tokenExpiry(get(acct.tokenKey))
    if (!force && exp && exp - Date.now() > REFRESH_WITHIN_MS) {
      console.log(`${label} kept     still valid until ${utc(exp)}`)
      continue
    }
    if (rateLimited) {
      failed += acct.required ? 1 : 0
      console.log(`${label} not tried (rate limited, see above)`)
      continue
    }

    let res
    try {
      res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
    } catch {
      console.error(`\nNo server at ${BASE_URL}. Start the dev server first (npm run dev), then run this again.`)
      process.exit(1)
    }
    let body = null
    try { body = await res.json() } catch { /* not JSON */ }

    if (res.status === 429) {
      rateLimited = true
      failed += acct.required ? 1 : 0
      const wait = Number(res.headers.get('retry-after') ?? 0)
      console.log(`${label} FAILED   rate limited (5 sign-ins per 15 minutes)${wait ? `; try again in ${Math.ceil(wait / 60)} min` : ''}`)
      continue
    }
    if (res.status !== 200 || typeof body?.token !== 'string') {
      failed += acct.required ? 1 : 0
      // The server's own message ("Invalid email or password", ...). Never the request.
      console.log(`${label} FAILED   ${res.status} ${typeof body?.error === 'string' ? body.error : 'login failed'}`)
      continue
    }

    const claims = tokenClaims(body.token)
    if (claims.userType !== acct.userType) {
      failed += acct.required ? 1 : 0
      console.log(`${label} FAILED   this account is a ${claims.userType || 'unknown'} account; ${acct.tokenKey} needs a ${acct.userType}`)
      continue
    }

    content = setEnvLine(content, acct.tokenKey, body.token)
    changed += 1
    const newExp = tokenExpiry(body.token)
    const note = claims.profileId ? '' : `  (warning: no ${acct.userType} profile yet, profile checks will skip or fail)`
    console.log(`${label} refreshed valid until ${newExp ? utc(newExp) : 'unknown'}${note}`)
  }

  if (changed > 0) {
    const tmp = `${ENV_FILE}.tmp-${process.pid}`
    writeFileSync(tmp, content, 'utf8')
    renameSync(tmp, ENV_FILE)
    console.log(`\nUpdated ${changed} token${changed === 1 ? '' : 's'} in .env.test.local.`)
  } else {
    console.log('\nNo tokens changed.')
  }
  if (failed > 0) {
    console.log(`${failed} required account${failed === 1 ? '' : 's'} could not be refreshed.`)
    process.exit(1)
  }
}

await main()
