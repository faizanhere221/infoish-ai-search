#!/usr/bin/env node
// End-to-end check of creator platforms + services persistence, through the
// same HTTP routes the settings page and onboarding wizard use:
//   PUT /api/creators/:id/platforms, PUT /api/creators/:id/services,
//   GET /api/creators/:userId?include_inactive=1 (owner read, as settings does),
//   GET /api/creators/:username (the public profile API).
//
// !! WRITES DATA. It overwrites the test creator's platforms and services many
// times, then restores the original lists at the end. Service rows get new
// ids on restore (the services PUT replaces the list), so any deal pointing at
// an old service id loses that link. Only ever run it against a disposable
// test creator account.
//
// Plain Node (built-in fetch, no dependencies). Reads BASE_URL and
// TEST_CREATOR_TOKEN from .env.test.local. Run against an already-running
// server:
//   node scripts/creator-profile-check.mjs --confirm=<test creator username>
// Without --confirm matching the token's creator username it prints what it
// would touch and exits without writing anything.

import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const REPO_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

function loadEnvFile(filePath) {
  const env = {}
  if (!existsSync(filePath)) {return env}
  for (const rawLine of readFileSync(filePath, 'utf-8').split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) {continue}
    const eq = line.indexOf('=')
    if (eq === -1) {continue}
    let value = line.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    env[line.slice(0, eq).trim()] = value
  }
  return env
}

const fileEnv = loadEnvFile(path.join(REPO_ROOT, '.env.test.local'))
const getEnv = (key) => process.env[key] ?? fileEnv[key] ?? ''
const BASE_URL = getEnv('BASE_URL') || 'http://localhost:3000'
const TOKEN = getEnv('TEST_CREATOR_TOKEN')
const confirmArg = process.argv.find((a) => a.startsWith('--confirm='))?.slice('--confirm='.length)

// Every platform the settings page and the onboarding wizard offer
// (src/utils/constants.ts PLATFORMS). The signup page only picks platforms
// (no handle/followers/URL), so it has no input of its own to test here.
const PLATFORMS = [
  { platform: 'twitter', platform_username: '@pc_twitter', followers: 5076, platform_url: 'https://x.com/pc_twitter' },
  { platform: 'youtube', platform_username: '@pc_youtube', followers: 120000, platform_url: 'https://www.youtube.com/@pc_youtube' },
  { platform: 'linkedin', platform_username: 'pc-linkedin', followers: 3400, platform_url: 'https://www.linkedin.com/in/pc-linkedin/' },
  { platform: 'instagram', platform_username: '@pc.instagram', followers: 8800, platform_url: 'https://www.instagram.com/pc.instagram' },
  { platform: 'tiktok', platform_username: '@pc_tiktok', followers: 22000, platform_url: 'https://www.tiktok.com/@pc_tiktok' },
  { platform: 'twitch', platform_username: 'pc_twitch', followers: 900, platform_url: 'https://www.twitch.tv/pc_twitch' },
  { platform: 'blog', platform_username: 'pc.dev', followers: 0, platform_url: 'https://pc.dev/' },
  { platform: 'newsletter', platform_username: 'PC Weekly', followers: 15000, platform_url: 'https://pcweekly.substack.com' },
  { platform: 'podcast', platform_username: 'PC Podcast', followers: 4200, platform_url: 'https://podcasts.apple.com/podcast/pc/id123' },
  { platform: 'github', platform_username: 'pc-github', followers: 650, platform_url: 'https://github.com/pc-github' },
  { platform: 'discord', platform_username: 'pc-discord', followers: 1300, platform_url: 'https://discord.gg/pcinvite' },
  { platform: 'other', platform_username: 'pc-other', followers: 10, platform_url: 'https://example.com/pc' },
]

let passCount = 0
let failCount = 0

function report(name, pass, detail) {
  if (pass) {passCount += 1} else {failCount += 1}
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` (${detail})` : ''}`)
}

const authHeaders = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }

async function api(method, urlPath, body, { auth = true } = {}) {
  const res = await fetch(`${BASE_URL}${urlPath}`, {
    method,
    headers: auth ? authHeaders : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch { /* non-JSON */ }
  return { status: res.status, json, text }
}

function decodeJwtPayload(token) {
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf-8'))
  } catch {
    return null
  }
}

let ctx = null // { creatorId, userId, username }

async function readOwner() {
  const res = await api('GET', `/api/creators/${ctx.userId}?include_inactive=1`)
  if (res.status !== 200) {throw new Error(`owner read failed: ${res.status} ${res.text.slice(0, 200)}`)}
  return res.json.creator
}

async function readPublic() {
  const res = await api('GET', `/api/creators/${ctx.username}`, undefined, { auth: false })
  if (res.status !== 200) {throw new Error(`public read failed: ${res.status} ${res.text.slice(0, 200)}`)}
  return res.json.creator
}

const putPlatforms = (platforms) => api('PUT', `/api/creators/${ctx.creatorId}/platforms`, { platforms })
const putServices = (services) => api('PUT', `/api/creators/${ctx.creatorId}/services`, { services })

const byPlatform = (rows) => Object.fromEntries((rows || []).map((r) => [r.platform, r]))

/** Compare expected platform rows against a creator read; returns a list of mismatch strings. */
function diffPlatforms(expected, creator) {
  const actual = byPlatform(creator.creator_platforms)
  const problems = []
  for (const e of expected) {
    const a = actual[e.platform]
    if (!a) { problems.push(`${e.platform} missing`); continue }
    for (const key of ['platform_username', 'platform_url', 'followers']) {
      if ((a[key] ?? null) !== (e[key] ?? null)) {
        problems.push(`${e.platform}.${key}: expected ${JSON.stringify(e[key])}, got ${JSON.stringify(a[key])}`)
      }
    }
  }
  const extra = Object.keys(actual).filter((p) => !expected.some((e) => e.platform === p))
  if (extra.length) {problems.push(`unexpected platforms: ${extra.join(', ')}`)}
  const expectedTotal = expected.reduce((s, e) => s + (e.followers || 0), 0)
  if (creator.total_followers !== expectedTotal) {
    problems.push(`total_followers: expected ${expectedTotal}, got ${creator.total_followers}`)
  }
  return problems
}

/** Save `sent`, then confirm both reads match `expected` (defaults to `sent`). */
async function platformCase(name, sent, expected = sent) {
  try {
    const res = await putPlatforms(sent)
    if (res.status !== 200) { report(name, false, `PUT ${res.status}: ${res.json?.error ?? res.text.slice(0, 120)}`); return }
    const ownerProblems = diffPlatforms(expected, await readOwner())
    const publicProblems = diffPlatforms(expected, await readPublic())
    const problems = [...ownerProblems.map((p) => `owner ${p}`), ...publicProblems.map((p) => `public ${p}`)]
    report(name, problems.length === 0, problems.slice(0, 4).join('; '))
  } catch (err) {
    report(name, false, `threw: ${err.message}`)
  }
}

/** Send something invalid: expect 400 AND the stored list unchanged. */
async function rejectCase(name, sent, stillExpected) {
  try {
    const res = await putPlatforms(sent)
    const problems = diffPlatforms(stillExpected, await readOwner())
    report(
      name,
      res.status === 400 && problems.length === 0,
      `status ${res.status}${res.json?.error ? `: ${res.json.error}` : ''}${problems.length ? `; ${problems[0]}` : ''}`
    )
  } catch (err) {
    report(name, false, `threw: ${err.message}`)
  }
}

const SERVICE_KEYS = ['title', 'description', 'content_type', 'platform', 'price', 'delivery_days', 'revisions_included', 'is_active']

function diffServices(expected, rows) {
  const problems = []
  if ((rows || []).length !== expected.length) {
    problems.push(`count: expected ${expected.length}, got ${(rows || []).length}`)
  }
  expected.forEach((e, i) => {
    const a = rows?.[i]
    if (!a) {return}
    for (const key of SERVICE_KEYS) {
      if (e[key] === undefined) {continue}
      const actual = key === 'price' ? Number(a[key]) : a[key] ?? null
      if (actual !== e[key]) {problems.push(`#${i + 1} ${key}: expected ${JSON.stringify(e[key])}, got ${JSON.stringify(actual)}`)}
    }
  })
  return problems
}

async function serviceCase(name, sent, expected = sent) {
  try {
    const res = await putServices(sent)
    if (res.status !== 200) { report(name, false, `PUT ${res.status}: ${res.json?.error ?? res.text.slice(0, 120)}`); return }
    const owner = await readOwner()
    const pub = await readPublic()
    const problems = [
      ...diffServices(expected, owner.creator_services).map((p) => `owner ${p}`),
      ...diffServices(expected.filter((s) => s.is_active !== false), pub.creator_services).map((p) => `public ${p}`),
    ]
    report(name, problems.length === 0, problems.slice(0, 4).join('; '))
  } catch (err) {
    report(name, false, `threw: ${err.message}`)
  }
}

const svc = (title, price, extra = {}) => ({
  title,
  description: null,
  content_type: null,
  platform: 'twitter',
  price,
  delivery_days: 7,
  revisions_included: 1,
  is_active: true,
  ...extra,
})

async function main() {
  console.log('WARNING: this script WRITES DATA. It overwrites the test creator\'s platforms and')
  console.log('services, then restores them. Service ids change on restore. Test accounts only.\n')

  if (!TOKEN) {
    console.log('TEST_CREATOR_TOKEN is not set in .env.test.local — nothing to do.')
    process.exit(1)
  }
  const claims = decodeJwtPayload(TOKEN)
  if (!claims?.userId || claims.userType !== 'creator') {
    console.log('TEST_CREATOR_TOKEN is not a creator token.')
    process.exit(1)
  }
  if (claims.exp && claims.exp * 1000 < Date.now()) {
    console.log(`TEST_CREATOR_TOKEN expired at ${new Date(claims.exp * 1000).toISOString()} — log in as the test creator and copy a fresh token.`)
    process.exit(1)
  }

  ctx = { userId: claims.userId }
  const original = await readOwner()
  ctx.creatorId = original.id
  ctx.username = original.username
  if (original.user_id !== claims.userId) {
    console.log('Owner read returned a different creator than the token belongs to — aborting.')
    process.exit(1)
  }

  console.log(`Target: ${BASE_URL}, creator @${ctx.username} (${ctx.creatorId}), ` +
    `${original.creator_platforms.length} platforms / ${original.creator_services.length} services now.`)
  if (confirmArg !== ctx.username) {
    console.log(`\nNot confirmed. Re-run with --confirm=${ctx.username} to run the checks against this account.`)
    process.exit(1)
  }
  console.log('')

  try {
    // ── Platforms ─────────────────────────────────────────────────────────
    await platformCase(`All ${PLATFORMS.length} platforms save handle, followers, URL exactly`, PLATFORMS)

    for (const p of PLATFORMS) {
      await platformCase(`${p.platform} alone saves and reads back exactly`, [p])
    }

    const base = [PLATFORMS[0], PLATFORMS[1], PLATFORMS[2]] // twitter, youtube, linkedin
    const withTwitter = (patch) => [{ ...PLATFORMS[0], ...patch }, PLATFORMS[1], PLATFORMS[2]]
    await platformCase('Setup: twitter + youtube + linkedin', base)

    await platformCase('Handle with "@" persists as typed', withTwitter({ platform_username: '@MATKA_r' }))
    await platformCase('Handle without "@" persists as typed', withTwitter({ platform_username: 'MATKA_r' }))
    await platformCase('Handle with surrounding spaces is trimmed',
      withTwitter({ platform_username: '  MATKA_r ' }), withTwitter({ platform_username: 'MATKA_r' }))

    await platformCase('Followers 5076 (number)', withTwitter({ followers: 5076 }))
    await platformCase('Followers "5076" (string)', withTwitter({ followers: '5076' }), withTwitter({ followers: 5076 }))
    await platformCase('Followers "5,076"', withTwitter({ followers: '5,076' }), withTwitter({ followers: 5076 }))
    await platformCase('Followers "5k"', withTwitter({ followers: '5k' }), withTwitter({ followers: 5000 }))
    await platformCase('Followers "1.2M"', withTwitter({ followers: '1.2M' }), withTwitter({ followers: 1200000 }))
    await rejectCase('Followers "lots" is rejected with 400, nothing changes', withTwitter({ followers: 'lots' }), withTwitter({ followers: 1200000 }))
    await rejectCase('Followers -5 is rejected with 400, nothing changes', withTwitter({ followers: -5 }), withTwitter({ followers: 1200000 }))

    await platformCase('x.com URL persists exactly', withTwitter({ platform_url: 'https://x.com/MATKA_r' }))
    await platformCase('twitter.com URL persists exactly (not rewritten)', withTwitter({ platform_url: 'https://twitter.com/MATKA_r' }))
    await platformCase('Scheme-less "x.com/MATKA_r" gets https://',
      withTwitter({ platform_url: 'x.com/MATKA_r' }), withTwitter({ platform_url: 'https://x.com/MATKA_r' }))
    await rejectCase('javascript: URL is rejected with 400, nothing changes',
      withTwitter({ platform_url: 'javascript:alert(1)' }), withTwitter({ platform_url: 'https://x.com/MATKA_r' }))

    const withYoutube = (patch) => [PLATFORMS[0], { ...PLATFORMS[1], ...patch }, PLATFORMS[2]]
    await platformCase('YouTube @handle URL', withYoutube({ platform_url: 'https://www.youtube.com/@MATKA_r' }))
    await platformCase('YouTube /channel/ URL', withYoutube({ platform_url: 'https://www.youtube.com/channel/UCCc3r0e2o6wMwuXH-GBsVLQ' }))
    await platformCase('YouTube URL with query string', withYoutube({ platform_url: 'https://youtube.com/@pc?si=abc123' }))

    const withLinkedin = (patch) => [PLATFORMS[0], PLATFORMS[1], { ...PLATFORMS[2], ...patch }]
    await platformCase('LinkedIn /in/ URL', withLinkedin({ platform_url: 'https://www.linkedin.com/in/iqra-ikram-9660732b4' }))
    await platformCase('Scheme-less "www.linkedin.com/in/..." gets https://',
      withLinkedin({ platform_url: 'www.linkedin.com/in/iqra-ikram-9660732b4' }),
      withLinkedin({ platform_url: 'https://www.linkedin.com/in/iqra-ikram-9660732b4' }))

    await platformCase('Empty optional fields save as null/null/0',
      [{ platform: 'twitter', platform_username: '', platform_url: '' }, PLATFORMS[1], PLATFORMS[2]],
      [{ platform: 'twitter', platform_username: null, platform_url: null, followers: 0 }, PLATFORMS[1], PLATFORMS[2]])

    await platformCase('Setup: twitter + youtube + linkedin again', base)
    await platformCase('Editing one platform leaves the others untouched', withTwitter({ followers: 9999, platform_username: '@edited' }))
    await platformCase('Removing a platform keeps the rest', [PLATFORMS[0], PLATFORMS[2]])
    await platformCase('Adding a platform back keeps the rest', [PLATFORMS[0], PLATFORMS[2], PLATFORMS[1]])
    await platformCase('Removing every platform leaves none, total_followers 0', [])

    // ── Services ──────────────────────────────────────────────────────────
    const s1 = svc('Twitter Thread', 100, { content_type: 'thread' })
    const s2 = svc('Single Post', 100, { content_type: 'post' })
    await serviceCase('Save one service', [s1])
    await serviceCase('Add a second service', [s1, s2])
    await serviceCase('Edit a price', [s1, { ...s2, price: 150 }])
    await serviceCase('Price as "$1,000" saves as 1000', [s1, { ...s2, price: '$1,000' }], [s1, { ...s2, price: 1000 }])
    await serviceCase('Remove one service', [s1])

    const five = [
      svc('Twitter Thread', 100, { content_type: 'thread' }),
      svc('Single Post', 100, { content_type: 'post' }),
      svc('Dedicated Video', 2500, { platform: 'youtube', content_type: 'dedicated', delivery_days: 14 }),
      svc('LinkedIn Post', 400, { platform: 'linkedin', content_type: 'post', revisions_included: 0 }),
      svc('Paused Newsletter Slot', 500, { platform: 'newsletter', content_type: 'section', is_active: false }),
    ]
    await serviceCase('Save a list of 5 (incl. 0 revisions and one paused) — none lost, order kept', five)
    await serviceCase('Re-saving the list of 5 as read back loses nothing (paused one survives)', five)

    try {
      const anon = await api('GET', `/api/creators/${ctx.userId}?include_inactive=1`, undefined, { auth: false })
      const leaked = (anon.json?.creator?.creator_services || []).some((s) => s.is_active === false)
      report('include_inactive=1 without a token returns no paused services', anon.status === 200 && !leaked, `status ${anon.status}, leaked: ${leaked}`)
    } catch (err) {
      report('include_inactive=1 without a token returns no paused services', false, `threw: ${err.message}`)
    }

    await serviceCase('Removing every service leaves none', [])
  } finally {
    // ── Restore ───────────────────────────────────────────────────────────
    const restorePlatforms = original.creator_platforms.map((p) => ({
      platform: p.platform,
      platform_username: p.platform_username,
      platform_url: p.platform_url,
      followers: p.followers ?? 0,
    }))
    const restoreServices = original.creator_services.map((s) => ({
      title: s.title,
      description: s.description,
      content_type: s.content_type,
      platform: s.platform,
      price: Number(s.price),
      delivery_days: s.delivery_days,
      revisions_included: s.revisions_included,
      is_active: s.is_active,
    }))
    const pr = await putPlatforms(restorePlatforms)
    const sr = await putServices(restoreServices)
    if (pr.status !== 200 || sr.status !== 200) {
      report('Restore original data', false, `platforms ${pr.status}, services ${sr.status}. Original data: ${JSON.stringify({ restorePlatforms, restoreServices })}`)
    } else {
      const after = await readOwner()
      // Legacy rows can hold values the validator now normalizes (a
      // scheme-less URL gains https://, a padded handle is trimmed).
      const problems = [
        ...diffPlatforms(restorePlatforms.map((p) => ({
          ...p,
          platform_username: p.platform_username?.trim() || null,
          platform_url: p.platform_url ? (/^https?:\/\//i.test(p.platform_url.trim()) ? p.platform_url.trim() : `https://${p.platform_url.trim()}`) : null,
        })), after),
        ...diffServices(restoreServices, after.creator_services),
      ]
      report('Restore original data', problems.length === 0, problems.slice(0, 4).join('; '))
    }
  }

  console.log(`\n${passCount} passed, ${failCount} failed`)
  process.exit(failCount > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
