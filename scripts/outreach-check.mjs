#!/usr/bin/env node
// Outreach checks. Plain Node, no dependencies.
//
//   node scripts/outreach-check.mjs
//     Pure-logic checks only (normalisation, CSV parsing, import mapping,
//     owner rule, follow-up/no-reply dates, mailbox limits, working-day
//     pace, profile links, and the Creator / Client Database rules: price
//     maths, rate age, shortlist text, "find matching creators", field and
//     row validation, rating = admins only). Imports src/lib/outreach/rules.ts
//     and database.ts directly; needs Node 22.18+ or 23.6+ (built-in
//     TypeScript type stripping). Writes nothing.
//
//   node scripts/outreach-check.mjs --http --confirm=outreach-check
//     Also runs HTTP checks against a running dev server (BASE_URL, default
//     http://localhost:3000): duplicate blocking (incl. across creators and
//     brands), DNC blocking, import preview/commit skipping duplicates and
//     DNC rows, mailbox daily limit, undo, edits, soft delete/restore (hidden
//     from tables and exports, still blocks duplicates, still in
//     already_in_sheet.txt), and the Database (add / restore, fields,
//     rates, campaigns, search filters, export,
//     remove, members can't set the rating or remove). WRITES DATA: creates leads tagged
//     source=outreach-check, a DNC entry and a mailbox with a 1/day limit,
//     then soft-deletes the leads (their rows stay, as deleted), removes the
//     DNC entry and pauses the mailbox. Needs ADMIN_TOKEN (an admin's
//     auth_token cookie, see .env.test.example) in .env.test.local;
//     OUTREACH_TOKEN adds the member 403 checks. Run the migrations first.
//
// Outreach role access (403 outside the section) lives in
// scripts/security-check.mjs (OUTREACH_TOKEN).

import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import assert from 'node:assert/strict'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.join(SCRIPT_DIR, '..')
const tsUrl = (rel) => path.join(REPO_ROOT, rel).replace(/\\/g, '/').replace(/^([A-Za-z]):/, 'file:///$1:')
const rules = await import(tsUrl('src/lib/outreach/rules.ts'))
const db = await import(tsUrl('src/lib/outreach/database.ts'))

let passCount = 0
let failCount = 0
let skipCount = 0

async function check(name, fn) {
  try {
    await fn()
    passCount += 1
    console.log(`PASS  ${name}`)
  } catch (err) {
    failCount += 1
    console.log(`FAIL  ${name}\n      ${err instanceof Error ? err.message.split('\n').join('\n      ') : String(err)}`)
  }
}

function skip(name, reason) {
  skipCount += 1
  console.log(`SKIP  ${name} (${reason})`)
}

// ─── Pure logic ──────────────────────────────────────────────────────────────

async function pureChecks() {
  console.log('Pure-logic checks\n')

  await check('normalizeEmail: lowercase, trim, mailto:, empty → null', () => {
    assert.equal(rules.normalizeEmail('  John.Doe@Example.COM '), 'john.doe@example.com')
    assert.equal(rules.normalizeEmail('mailto:A@B.co'), 'a@b.co')
    assert.equal(rules.normalizeEmail('   '), null)
    assert.equal(rules.normalizeEmail(null), null)
  })

  await check('normalizeUrl: no protocol/www/query/fragment/trailing slash, lowercase', () => {
    assert.equal(rules.normalizeUrl('https://www.YouTube.com/@SomeChannel/?si=abc#x'), 'youtube.com/@somechannel')
    assert.equal(rules.normalizeUrl('http://youtube.com/@somechannel///'), 'youtube.com/@somechannel')
    assert.equal(rules.normalizeUrl('youtube.com/@SomeChannel'), 'youtube.com/@somechannel')
    assert.equal(rules.normalizeUrl(' WWW.linkedin.com/in/jane '), 'linkedin.com/in/jane')
    assert.equal(rules.normalizeUrl(''), null)
  })

  await check('normalizeDomain: host only, no port', () => {
    assert.equal(rules.normalizeDomain('https://www.Acme.io/pricing?x=1'), 'acme.io')
    assert.equal(rules.normalizeDomain('acme.io:8080/path'), 'acme.io')
    assert.equal(rules.normalizeDomain('ACME.IO'), 'acme.io')
  })

  await check('the same creator in two spellings gives the same keys', () => {
    const a = rules.leadKeys('creator', { email: 'Jane@Mail.com ', profile_url: 'https://www.youtube.com/@Jane/' })
    const b = rules.leadKeys('creator', { email: 'jane@mail.com', profile_url: 'youtube.com/@jane?feature=share' })
    assert.deepEqual(a, b)
  })

  await check('brand keys fall back from domain to website', () => {
    assert.deepEqual(rules.leadKeys('brand', { website: 'https://www.acme.io/' }), [{ type: 'domain', value: 'acme.io' }])
    assert.deepEqual(rules.leadKeys('brand', { domain: 'Acme.io', website: 'other.com' }), [{ type: 'domain', value: 'acme.io' }])
  })

  await check('dncKeys adds the email domain (a DNC domain blocks every address there)', () => {
    const keys = rules.dncKeys('creator', { email: 'sam@competitor.com' })
    assert.ok(keys.some((k) => k.type === 'domain' && k.value === 'competitor.com'))
  })

  await check('parseCsv: quotes, escaped quotes, commas/newlines in quotes, CRLF, BOM, blank lines', () => {
    const text = '\uFEFFa,b,c\r\n1,"x, y","he said ""hi"""\r\n\r\n2,"line1\nline2",\n'
    assert.deepEqual(rules.parseCsv(text), [
      ['a', 'b', 'c'],
      ['1', 'x, y', 'he said "hi"'],
      ['2', 'line1\nline2', ''],
    ])
  })

  await check('toCsv: escapes quotes/commas and neutralises formula injection', () => {
    const out = rules.toCsv(['a', 'b'], [{ a: '=HYPERLINK("x")', b: 'one, two' }])
    assert.equal(out, 'a,b\r\n"\'=HYPERLINK(""x"")","one, two"')
  })

  await check('parseNumber: "5,076", "5k", "1.2M", "12%", junk', () => {
    assert.equal(rules.parseNumber('5,076'), 5076)
    assert.equal(rules.parseNumber('5k'), 5000)
    assert.equal(rules.parseNumber('1.2M'), 1200000)
    assert.equal(rules.parseNumber('12%'), 12)
    assert.equal(rules.parseNumber('n/a'), null)
    assert.equal(rules.parseBool('Yes'), true)
    assert.equal(rules.parseBool('no'), false)
    assert.equal(rules.parseBool('maybe'), null)
  })

  await check('detectFileType: by file name, review file wins over creators_', () => {
    assert.equal(rules.detectFileType('creators_new_2026-11-04.csv'), 'creators_new')
    assert.equal(rules.detectFileType('C:\\Downloads\\creators_review_new_batch3.csv'), 'creators_review_new')
    assert.equal(rules.detectFileType('sponsor_brands_new_1.csv'), 'sponsor_brands_new')
    assert.equal(rules.detectFileType('YC_BRANDS_NEW_w24.csv'), 'yc_brands_new')
    assert.equal(rules.detectFileType('creators_new_1.xlsx'), null)
    assert.equal(rules.detectFileType('random.csv'), null)
  })

  // Header rows from the real sheets (some names are cut off in the
  // screenshots, so the matchers work on prefixes too).
  const CREATOR_HEADERS = ['date_found', 'channel_name', 'channel_url', 'country', 'niche', 'found_by', 'subscribers', 'avg_views',
    'views_to_subs', 'engagement_rate', 'days_since_last_upload', 'uploads_last_30d', 'email', 'instagram', 'x_twitter', 'linkedin',
    'tiktok', 'website_or_link', 'does_sponsorships', 'sponsor_brands', 'recent_video_titles', 'status']
  const SPONSOR_HEADERS = ['domain', 'sponsor_label', 'creators_count', 'creators', 'example_video', 'example_url', 'evidence', 'first_seen']
  const YC_HEADERS = ['score', 'name', 'website', 'domain', 'one_liner', 'batch', 'batch_year', 'team_size', 'country', 'locations',
    'industry', 'tags', 'is_hiring', 'sponsors_creators', 'sponsor_creators', 'yc_url', 'status_outreach']

  await check('defaultMapping: creators_new headers', () => {
    const m = rules.defaultMapping('creator', CREATOR_HEADERS)
    assert.equal(m.channel_name, 'name')
    assert.equal(m.channel_url, 'profile_url')
    assert.equal(m.engagement_rate, 'engagement_pct')
    assert.equal(m.x_twitter, 'x')
    assert.equal(m.website_or_link, 'website')
    assert.equal(m.does_sponsorships, 'does_sponsorships')
    assert.equal(m.sponsor_brands, 'sponsor_brands')
    assert.equal(m.date_found, 'extra')
    assert.equal(m.recent_video_titles, 'extra')
    assert.equal(m.status, '', 'sheet status is ignored, imports start as found')
  })

  await check('defaultMapping: truncated creator headers still map', () => {
    const m = rules.defaultMapping('creator', ['channel_n', 'channel_u', 'engagem', 'does_spo', 'sponsor_b', 'website_c'])
    assert.deepEqual(m, { channel_n: 'name', channel_u: 'profile_url', engagem: 'engagement_pct', does_spo: 'does_sponsorships', sponsor_b: 'sponsor_brands', website_c: 'website' })
  })

  await check('defaultMapping: sponsor_brands_new headers', () => {
    const m = rules.defaultMapping('brand', SPONSOR_HEADERS)
    assert.equal(m.domain, 'domain')
    assert.equal(m.sponsor_label, 'company')
    assert.equal(m.evidence, 'why_them')
    assert.equal(m.creators_count, 'extra')
    assert.equal(m.example_video, 'extra')
  })

  await check('defaultMapping: yc_brands_new headers', () => {
    const m = rules.defaultMapping('brand', YC_HEADERS)
    assert.equal(m.name, 'company')
    assert.equal(m.website, 'website')
    assert.equal(m.one_liner, 'product')
    assert.equal(m.team_size, 'team_size')
    assert.equal(m.score, 'score')
    for (const h of ['batch', 'batch_year', 'locations', 'industry', 'tags', 'is_hiring', 'sponsors_creators', 'sponsor_creators', 'yc_url']) {
      assert.equal(m[h], 'extra', h)
    }
    assert.equal(m.country, 'country')
    assert.equal(m.domain, 'domain')
    assert.equal(m.status_outreach, '')
  })

  await check('mapRow: types values, collects notes, reports bad values', () => {
    const m = rules.defaultMapping('creator', CREATOR_HEADERS)
    const cells = CREATOR_HEADERS.map(() => '')
    const set = (h, v) => { cells[CREATOR_HEADERS.indexOf(h)] = v }
    set('channel_name', 'Jane Tech'); set('channel_url', 'youtube.com/@janetech'); set('subscribers', '125,400')
    set('avg_views', '12.5k'); set('does_sponsorships', 'Yes'); set('date_found', '2026-11-01'); set('email', 'JANE@x.com')
    const { lead, errors } = rules.mapRow('creator', CREATOR_HEADERS, cells, m, 2, { platform: 'youtube' })
    assert.deepEqual(errors, [])
    assert.equal(lead.subscribers, 125400)
    assert.equal(lead.avg_views, 12500)
    assert.equal(lead.does_sponsorships, true)
    assert.equal(lead.platform, 'youtube')
    assert.equal(lead.extra.date_found, '2026-11-01')
    assert.equal(lead.notes, undefined)
    assert.equal(lead._row, 2)

    set('subscribers', 'lots'); set('email', 'not-an-email')
    const bad = rules.mapRow('creator', CREATOR_HEADERS, cells, m, 3)
    assert.equal(bad.errors.length, 2)
  })

  await check('mapRow: a brand with only a domain gets the domain as company', () => {
    const { lead, errors } = rules.mapRow('brand', ['domain'], ['acme.io'], { domain: 'domain' }, 2)
    assert.deepEqual(errors, [])
    assert.equal(lead.company, 'acme.io')
  })

  await check('mapRow: a row with no key to dedupe on is an error', () => {
    const { errors } = rules.mapRow('creator', ['channel_name'], ['No Link'], { channel_name: 'name' }, 2)
    assert.ok(errors.some((e) => e.includes('duplicates')))
  })

  await check('yc_brands row: fields, extra, country from locations, why_them built', () => {
    const m = rules.defaultMapping('brand', YC_HEADERS)
    const values = {
      score: '87', name: 'Acme AI', website: 'https://acme.ai', domain: 'acme.ai', one_liner: 'Agents for support', batch: 'W24',
      batch_year: '2024', team_size: '12', country: '', locations: 'San Francisco, CA, USA; Remote', industry: 'B2B',
      tags: 'ai; devtools', is_hiring: 'true', sponsors_creators: 'yes', sponsor_creators: 'Fireship', yc_url: 'https://www.ycombinator.com/companies/acme-ai',
      status_outreach: 'emailed',
    }
    const cells = YC_HEADERS.map((h) => values[h])
    const { lead, errors } = rules.mapRow('brand', YC_HEADERS, cells, m, 2, { fileType: 'yc_brands_new' })
    assert.deepEqual(errors, [])
    assert.equal(lead.company, 'Acme AI')
    assert.equal(lead.product, 'Agents for support')
    assert.equal(lead.score, 87)
    assert.equal(lead.team_size, '12')
    assert.equal(lead.country, 'USA')
    assert.equal(lead.why_them, 'YC W24, hiring, sponsors creators')
    assert.equal(lead.status, undefined, 'status_outreach is ignored')
    assert.deepEqual(Object.keys(lead.extra).sort(), ['batch', 'batch_year', 'industry', 'is_hiring', 'locations', 'sponsor_creators', 'sponsors_creators', 'tags', 'yc_url'])
  })

  await check('why_them: kept when the file has one, empty when nothing to say', () => {
    assert.equal(rules.buildWhyThem({ batch: 'S23' }, 'sponsor_brands_new'), 'S23')
    assert.equal(rules.buildWhyThem({ is_hiring: 'no', sponsors_creators: '0' }, 'yc_brands_new'), null)
    const { lead } = rules.mapRow('brand', ['domain', 'why_them', 'batch'], ['x.io', 'Sponsors 4 channels', 'W24'], { domain: 'domain', why_them: 'why_them', batch: 'extra' }, 2, { fileType: 'yc_brands_new' })
    assert.equal(lead.why_them, 'Sponsors 4 channels')
  })

  await check('countryFromLocations', () => {
    assert.equal(rules.countryFromLocations('Berlin, Germany'), 'Germany')
    assert.equal(rules.countryFromLocations('Remote'), 'Remote')
    assert.equal(rules.countryFromLocations('London, UK | NYC, USA'), 'UK')
    assert.equal(rules.countryFromLocations(''), null)
  })

  await check('every file type: no column disappears (each maps to a field, extra or ignore)', () => {
    for (const [type, headers] of [['creator', CREATOR_HEADERS], ['brand', SPONSOR_HEADERS], ['brand', YC_HEADERS]]) {
      const m = rules.defaultMapping(type, headers)
      assert.deepEqual(Object.keys(m).sort(), [...headers].sort())
    }
  })

  await check('spreadsheet uploads are detected (save as CSV first)', () => {
    assert.equal(rules.isSpreadsheetFile('yc_brands_new_1.xlsx'), true)
    assert.equal(rules.isSpreadsheetFile('creators.XLS'), true)
    assert.equal(rules.isSpreadsheetFile('creators_new_1.csv'), false)
  })

  await check('field validation: email', () => {
    assert.deepEqual(rules.validateLeadField('email', '  Jane@Acme.IO '), { ok: true, value: 'jane@acme.io' })
    assert.equal(rules.validateLeadField('email', 'jane@acme').ok, false)
    assert.deepEqual(rules.validateLeadField('email', ''), { ok: true, value: null })
  })

  await check('field validation: URLs get https://, other schemes are refused', () => {
    assert.deepEqual(rules.validateLeadField('website', 'acme.io/pricing'), { ok: true, value: 'https://acme.io/pricing' })
    assert.deepEqual(rules.validateLeadField('profile_url', 'http://youtube.com/@x'), { ok: true, value: 'http://youtube.com/@x' })
    assert.equal(rules.validateLeadField('website', 'javascript:alert(1)').ok, false)
    assert.equal(rules.validateLeadField('website', 'not a url').ok, false)
    assert.equal(rules.validateLeadField('linkedin', 'localhost').ok, false)
  })

  await check('field validation: social handles become profile URLs', () => {
    assert.deepEqual(rules.validateLeadField('instagram', '@jane.doe'), { ok: true, value: 'https://instagram.com/jane.doe' })
    assert.deepEqual(rules.validateLeadField('x', 'jane'), { ok: true, value: 'https://x.com/jane' })
    assert.deepEqual(rules.validateLeadField('tiktok', '@jane'), { ok: true, value: 'https://www.tiktok.com/@jane' })
    assert.deepEqual(rules.validateLeadField('instagram', 'instagram.com/jane'), { ok: true, value: 'https://instagram.com/jane' })
  })

  await check('profile links: creator main link is profile_url, then youtube/linkedin/x/instagram/tiktok/website', () => {
    const lead = {
      profile_url: 'youtube.com/@jane', linkedin: 'https://linkedin.com/in/jane', x: 'x.com/jane',
      instagram: 'https://www.instagram.com/jane/', tiktok: 'tiktok.com/@jane', website: 'jane.dev',
    }
    const links = rules.leadLinks('creator', lead)
    assert.deepEqual(links.map((l) => l.kind), ['youtube', 'linkedin', 'x', 'instagram', 'tiktok', 'website'])
    assert.equal(links[0].url, 'https://youtube.com/@jane')
    assert.deepEqual(rules.primaryLink('creator', { x: 'twitter.com/jane', website: 'jane.dev' }), { kind: 'x', url: 'https://twitter.com/jane' })
    assert.equal(rules.primaryLink('creator', { extra: { youtube: 'youtu.be/abc' } }).kind, 'youtube')
    assert.equal(rules.primaryLink('creator', {}), null)
  })

  await check('profile links: brands use website (or domain), then linkedin', () => {
    assert.deepEqual(rules.leadLinks('brand', { website: 'acme.io', linkedin: 'linkedin.com/company/acme' }).map((l) => l.url),
      ['https://acme.io', 'https://linkedin.com/company/acme'])
    assert.equal(rules.primaryLink('brand', { domain: 'acme.io' }).url, 'https://acme.io')
    assert.equal(rules.primaryLink('brand', { linkedin: 'linkedin.com/company/acme' }).kind, 'linkedin')
  })

  await check('profile links: only http(s); javascript:, data:, mailto: and junk never become links', () => {
    for (const bad of ['javascript:alert(1)', 'JavaScript:alert(1)', 'data:text/html,hi', 'mailto:a@b.co', 'vbscript:x', '@handle', 'not a url', 'localhost']) {
      assert.deepEqual(rules.leadLinks('creator', { profile_url: bad, website: bad }), [], bad)
    }
    const links = rules.leadLinks('creator', { profile_url: 'javascript:alert(1)', website: 'https://ok.dev' })
    assert.deepEqual(links, [{ kind: 'website', url: 'https://ok.dev' }])
    assert.ok(links.every((l) => /^https?:\/\//.test(l.url)))
  })

  await check('profile links: the same URL twice shows once', () => {
    const links = rules.leadLinks('creator', { profile_url: 'https://www.linkedin.com/in/jane/', linkedin: 'linkedin.com/in/jane' })
    assert.equal(links.length, 1)
    assert.equal(links[0].kind, 'linkedin')
  })

  await check('field validation: numbers >= 0, "5k" and "5,076" accepted', () => {
    assert.deepEqual(rules.validateLeadField('subscribers', '5,076'), { ok: true, value: 5076 })
    assert.deepEqual(rules.validateLeadField('avg_views', '1.25k'), { ok: true, value: 1250 })
    assert.deepEqual(rules.validateLeadField('engagement_pct', '3.5%'), { ok: true, value: 3.5 })
    assert.equal(rules.validateLeadField('score', '-1').ok, false)
    assert.equal(rules.validateLeadField('subscribers', 'lots').ok, false)
  })

  await check('field validation: domain, bool, channel, extra, length', () => {
    assert.deepEqual(rules.validateLeadField('domain', 'https://www.Acme.io/x'), { ok: true, value: 'acme.io' })
    assert.equal(rules.validateLeadField('domain', 'acme').ok, false)
    assert.deepEqual(rules.validateLeadField('does_sponsorships', 'Yes'), { ok: true, value: true })
    assert.equal(rules.validateLeadField('channel', 'fax').ok, false)
    assert.deepEqual(rules.validateLeadField('extra', { Batch: 'W24', empty: '' }), { ok: true, value: { batch: 'W24' } })
    assert.equal(rules.validateLeadField('extra', ['x']).ok, false)
    assert.equal(rules.validateLeadField('name', 'x'.repeat(256)).ok, false)
  })

  await check('validateLeadUpdates: status, lead_id and unknown fields are refused, not dropped', () => {
    const { values, errors } = rules.validateLeadUpdates('creator', { email: 'a@b.co', status: 'won', lead_id: 'C-1', company: 'x' })
    assert.deepEqual(values, { email: 'a@b.co' })
    assert.deepEqual(Object.keys(errors).sort(), ['company', 'lead_id', 'status'])
    assert.ok(rules.validateLeadUpdates('brand', { why_them: 'x' }).errors.why_them === undefined)
  })

  await check('owner rule: sponsorships or 100K+ → Faizan, other creators → VA, brands → Faizan', () => {
    const ids = { faizan: 'F', va: 'V' }
    assert.equal(rules.suggestOwner('creator', { does_sponsorships: true, subscribers: 500 }, ids), 'F')
    assert.equal(rules.suggestOwner('creator', { does_sponsorships: false, subscribers: 100_000 }, ids), 'F')
    assert.equal(rules.suggestOwner('creator', { does_sponsorships: false, subscribers: 99_999 }, ids), 'V')
    assert.equal(rules.suggestOwner('creator', { does_sponsorships: null, subscribers: null }, ids), 'V')
    assert.equal(rules.suggestOwner('brand', {}, ids), 'F')
  })

  await check('follow-up = contacted + 4 days, no-reply = followed up + 7 days', () => {
    assert.equal(rules.followUpDate('2026-11-04'), '2026-11-08')
    assert.equal(rules.followUpDate('2026-11-28'), '2026-12-02')
    assert.equal(rules.noReplyDate('2026-12-28'), '2027-01-04')
  })

  await check('Karachi day boundaries (UTC+5)', () => {
    assert.equal(rules.karachiToday(new Date('2026-11-04T18:59:59Z')), '2026-11-04')
    assert.equal(rules.karachiToday(new Date('2026-11-04T19:00:00Z')), '2026-11-05')
    assert.equal(rules.karachiDayStart('2026-11-05').toISOString(), '2026-11-04T19:00:00.000Z')
    assert.equal(rules.weekStart('2026-11-08'), '2026-11-02') // Sunday → Monday before
    assert.equal(rules.weekStart('2026-11-02'), '2026-11-02')
  })

  await check('mailbox warm-up: 10 / 15 / 25 / 30, custom up to 40, personal 30', () => {
    const mb = (start, extra = {}) => ({ start_date: start, is_personal: false, custom_limit: null, ...extra })
    const today = '2026-11-30'
    assert.equal(rules.mailboxDailyLimit(mb('2026-11-30'), today), 10)
    assert.equal(rules.mailboxDailyLimit(mb('2026-11-24'), today), 10) // day 6
    assert.equal(rules.mailboxDailyLimit(mb('2026-11-23'), today), 15) // day 7 = week 2
    assert.equal(rules.mailboxDailyLimit(mb('2026-11-16'), today), 25)
    assert.equal(rules.mailboxDailyLimit(mb('2026-11-09'), today), 30)
    assert.equal(rules.mailboxDailyLimit(mb('2026-11-30', { custom_limit: 35 }), today), 35)
    assert.equal(rules.mailboxDailyLimit(mb('2026-11-30', { custom_limit: 99 }), today), 40)
    assert.equal(rules.mailboxDailyLimit(mb('2026-11-30', { is_personal: true }), today), 30)
    assert.equal(rules.mailboxDailyLimit(mb('2026-11-30', { is_personal: true, custom_limit: 20 }), today), 20)
  })

  await check('mailbox state: warn at 80%, full at the limit', () => {
    assert.equal(rules.mailboxState(23, 30), 'ok')
    assert.equal(rules.mailboxState(24, 30), 'warn')
    assert.equal(rules.mailboxState(30, 30), 'full')
    assert.equal(rules.mailboxState(7, 10), 'ok')
    assert.equal(rules.mailboxState(8, 10), 'warn')
  })

  await check('working days: Mon–Fri vs Mon–Sat, Sundays never count', () => {
    // November 2026: 30 days, starts on a Sunday.
    assert.equal(rules.workingDaysBetween('2026-11-01', '2026-11-30', false), 21)
    assert.equal(rules.workingDaysBetween('2026-11-01', '2026-11-30', true), 25)
    assert.equal(rules.isWorkingDay('2026-11-07', false), false) // Saturday
    assert.equal(rules.isWorkingDay('2026-11-07', true), true)
    assert.equal(rules.isWorkingDay('2026-11-08', true), false) // Sunday
  })

  await check('month pace: on track / behind, per-day needed', () => {
    // Mon 16 Nov, Mon–Fri: 10 working days done of 21, 11 left incl. today.
    const behind = rules.monthPace(1000, 300, '2026-11-16', false)
    assert.equal(behind.workingDaysTotal, 21)
    assert.equal(behind.workingDaysLeft, 11)
    assert.equal(behind.expectedByNow, Math.round(1000 * 10 / 21))
    assert.equal(behind.onTrack, false)
    assert.equal(behind.perDayNeeded, Math.ceil(700 / 11))
    assert.equal(rules.monthPace(1000, 500, '2026-11-16', false).onTrack, true)
    assert.equal(rules.monthPace(0, 0, '2026-11-16', false).onTrack, true)
  })
}

// ─── Pure logic: Creator / Client Database ───────────────────────────────────

async function databaseChecks() {
  console.log('\nDatabase pure-logic checks\n')
  const today = '2026-11-05'
  const rates = [
    { platform: 'youtube', format: 'dedicated_video', price: 2000, currency: 'USD', quoted_at: '2026-06-01' },
    { platform: 'youtube', format: 'integration', price: 800, currency: 'USD', quoted_at: '2026-10-20' },
    { platform: 'instagram', format: 'story', price: 350, currency: 'USD', quoted_at: null },
    { platform: 'instagram', format: 'post', price: 50000, currency: 'PKR', quoted_at: null },
  ]

  await check('db platforms match PLATFORMS ids; free-text lead platforms map to them', () => {
    assert.deepEqual([...db.DB_PLATFORMS], ['youtube', 'linkedin', 'twitter', 'tiktok', 'instagram'])
    assert.equal(db.platformId(' YouTube '), 'youtube')
    assert.equal(db.platformId('X (Twitter)'), 'twitter')
    assert.equal(db.platformId('x'), 'twitter')
    assert.equal(db.platformId('IG'), 'instagram')
    assert.equal(db.platformId('github'), null)
    assert.equal(db.platformId(null), null)
  })

  await check('cheapest / typical: main currency (most rates, USD wins a tie), median, format + platform filters', () => {
    assert.deepEqual(db.cheapestAndTypical(rates), { currency: 'USD', cheapest: 350, typical: 800 })
    assert.deepEqual(db.cheapestAndTypical(rates, { formats: ['story'] }), { currency: 'USD', cheapest: 350, typical: 350 })
    assert.deepEqual(db.cheapestAndTypical(rates, { currency: 'pkr' }), { currency: 'PKR', cheapest: 50000, typical: 50000 })
    assert.deepEqual(db.cheapestAndTypical(rates, { platforms: ['youtube'] }), { currency: 'USD', cheapest: 800, typical: 1400 })
    const tie = [{ platform: 'youtube', format: 'short', price: 10, currency: 'EUR' }, { platform: 'youtube', format: 'short', price: 20, currency: 'USD' }]
    assert.equal(db.cheapestAndTypical(tie).currency, 'USD')
    assert.deepEqual(db.cheapestAndTypical([]), { currency: null, cheapest: null, typical: null })
    assert.equal(db.cheapestAndTypical(rates, { formats: ['thread'] }).cheapest, null)
  })

  await check('rate age: "quoted N days ago", stale (amber) after 90 days', () => {
    assert.equal(db.rateAgeDays('2026-06-01', today), 157)
    assert.equal(db.rateAgeLabel('2026-06-01', today), 'Quoted 157 days ago')
    assert.equal(db.rateAgeLabel('2026-11-04', today), 'Quoted 1 day ago')
    assert.equal(db.rateAgeLabel(today, today), 'Quoted today')
    assert.equal(db.rateAgeLabel(null, today), 'No quote date')
    assert.equal(db.isRateStale('2026-08-07', today), false) // 90 days
    assert.equal(db.isRateStale('2026-08-06', today), true) // 91 days
    assert.equal(db.isRateStale(null, today), false)
    assert.equal(db.rateAgeDays('junk', today), null)
  })

  await check('money and follower formatting', () => {
    assert.equal(db.formatMoney(1500, 'USD'), '$1,500')
    assert.equal(db.formatMoney('99.5', 'usd'), '$99.50')
    assert.match(db.formatMoney(50000, 'PKR'), /50,000/)
    assert.equal(db.formatMoney(null, 'USD'), '')
    assert.equal(db.formatMoney(10, 'ZZ1'), '10 ZZ1')
    assert.equal(db.formatFollowers(155000), '155K')
    assert.equal(db.formatFollowers(1250000), '1.3M')
    assert.equal(db.formatFollowers(980), '980')
  })

  await check('shortlist: name, link, followers, rate for the format; "on request" when none; nothing internal', () => {
    const text = db.shortlistText([
      { lead_id: 'C-0001', name: 'Alice', link: 'https://youtube.com/@alice', total_followers: 155000, platform_label: 'YouTube', rates, quality_rating: 5, notes: 'secret note', email: 'alice@x.com' },
      { lead_id: 'C-0002', name: '', link: null, total_followers: null, platform_label: null, rates: [] },
    ], { format: 'integration' })
    assert.equal(text, [
      '1. Alice', '   https://youtube.com/@alice', '   155K followers (YouTube)', '   Integration: $800', '',
      '2. C-0002', '   Integration: on request',
    ].join('\n'))
    assert.ok(!/secret|alice@x\.com|★/.test(text), 'no internal fields')
    assert.match(db.shortlistText([{ lead_id: 'C-1', name: 'A', link: null, total_followers: 1, platform_label: null, rates }], {}), /Rate: from \$350/)
  })

  await check('"Find matching creators": niches, target countries (else the lead country), platforms, budget', () => {
    const q = new URLSearchParams(db.matchingCreatorsQuery({
      niches: ['SaaS & Software', 'Developer Tools'], target_countries: ['USA', 'UK'], country: 'Germany',
      platforms: ['youtube'], budget_min: 1000, budget_max: 5000, budget_currency: 'usd',
    }))
    assert.equal(q.get('niche'), 'SaaS & Software,Developer Tools')
    assert.equal(q.get('country'), 'USA,UK')
    assert.equal(q.get('platform'), 'youtube')
    assert.equal(q.get('max_price'), '5000')
    assert.equal(q.get('currency'), 'USD')
    const q2 = new URLSearchParams(db.matchingCreatorsQuery({ niches: [], target_countries: [], country: 'Germany', platforms: [], budget_min: null, budget_max: null }))
    assert.equal(q2.get('country'), 'Germany')
    assert.equal(q2.get('max_price'), null)
  })

  await check('Database fields: types, lists, followers map; unknown fields refused', () => {
    const r = db.validateDbFields('creator', {
      availability: 'limited', min_lead_days: '7', upfront_pct: '50%', payment_methods: ['wise', 'paypal'],
      tags: 'Fast, fast, good editing', followers: { youtube: '120k', instagram: '' }, next_available_date: '2026-12-01',
      notes: '  hi  ',
    }, { isAdmin: false })
    assert.deepEqual(r.errors, {})
    assert.deepEqual(r.values, {
      availability: 'limited', min_lead_days: 7, upfront_pct: 50, payment_methods: ['wise', 'paypal'],
      tags: ['Fast', 'good editing'], followers: { youtube: 120000 }, next_available_date: '2026-12-01', notes: 'hi',
    })
    const bad = db.validateDbFields('creator', {
      availability: 'soon', upfront_pct: 120, payment_methods: ['cash'], followers: { github: 5 }, next_available_date: '12/01',
      removed_at: 'x', min_lead_days: -1,
    }, { isAdmin: true })
    assert.deepEqual(Object.keys(bad.errors).sort(), ['availability', 'followers', 'min_lead_days', 'next_available_date', 'payment_methods', 'removed_at', 'upfront_pct'])
    assert.deepEqual(db.validateDbFields('creator', { tags: '' }, { isAdmin: false }).values.tags, [])
  })

  await check('quality rating: admins only, 1 to 5; members cannot filter or sort by it', () => {
    assert.match(db.validateDbFields('creator', { quality_rating: 4 }, { isAdmin: false }).errors.quality_rating, /admins/)
    assert.equal(db.validateDbFields('creator', { quality_rating: '4' }, { isAdmin: true }).values.quality_rating, 4)
    assert.ok(db.validateDbFields('creator', { quality_rating: 6 }, { isAdmin: true }).errors.quality_rating)
    assert.equal(db.validateDbFields('creator', { quality_rating: '' }, { isAdmin: true }).values.quality_rating, null)
    const member = db.creatorDbFilters(new URLSearchParams('min_rating=4&sort=rating'), { isAdmin: false, callerId: 'u1' })
    assert.equal(member.min_rating, null)
    assert.equal(member.sort, 'added')
    const admin = db.creatorDbFilters(new URLSearchParams('min_rating=4&sort=rating'), { isAdmin: true, callerId: 'u1' })
    assert.equal(admin.min_rating, 4)
    assert.equal(admin.sort, 'rating')
  })

  await check('client fields: stage, platforms, sizes, budget order, currency', () => {
    const r = db.validateDbFields('brand', {
      stage: 'active', platforms: ['youtube', 'tiktok'], creator_sizes: ['micro'], budget_min: '1k', budget_max: '$5,000',
      budget_currency: 'eur', niches: ['SaaS & Software'], target_countries: 'USA, UK',
    }, { isAdmin: false })
    assert.deepEqual(r.errors, {})
    assert.equal(r.values.budget_min, 1000)
    assert.equal(r.values.budget_max, 5000)
    assert.equal(r.values.budget_currency, 'EUR')
    assert.deepEqual(r.values.target_countries, ['USA', 'UK'])
    const bad = db.validateDbFields('brand', { stage: 'won', platforms: ['github'], budget_min: 9000, budget_max: 100, budget_currency: 'dollars' }, { isAdmin: true })
    assert.deepEqual(Object.keys(bad.errors).sort(), ['budget_currency', 'budget_max', 'platforms', 'stage'])
  })

  await check('rate / contact / campaign rows: required fields, defaults, partial edits, no id/lead_id', () => {
    const rate = db.validateDbItem('rates', { platform: 'youtube', format: 'integration', price: '1.5k', usage_rights: 'yes' }, false)
    assert.deepEqual(rate.errors, {})
    assert.deepEqual(rate.values, { platform: 'youtube', format: 'integration', price: 1500, usage_rights: true, currency: 'USD' })
    assert.deepEqual(Object.keys(db.validateDbItem('rates', { platform: 'github', price: -5 }, false).errors).sort(), ['format', 'platform', 'price'])
    assert.deepEqual(db.validateDbItem('rates', { price: 900 }, true).errors, {})
    assert.ok(db.validateDbItem('rates', { price: '' }, true).errors.price, 'price stays required on edit')
    assert.ok(db.validateDbItem('rates', { id: 'x', lead_id: 'C-1' }, true).errors.lead_id)
    assert.ok(db.validateDbItem('campaigns', { run_date: '2026-09-01' }, false).errors.title)
    assert.equal(db.isDbItemKind('creator', 'rates'), true)
    assert.equal(db.isDbItemKind('creator', 'campaigns'), false)
    assert.equal(db.isDbItemKind('brand', 'contacts'), false) // brand contacts live on the lead now
    assert.equal(db.isDbItemKind('brand', 'campaigns'), true)
  })

  await check('table filters: comma lists, unknown platform/format/stage values dropped, owner=me', () => {
    const f = db.creatorDbFilters(new URLSearchParams('niche=AI,SaaS&platform=youtube,github&format=short,bogus&max_price=1.5k&currency=eur&owner=me&sort=price&dir=asc'), { isAdmin: false, callerId: 'u1' })
    assert.deepEqual(f.niches, ['AI', 'SaaS'])
    assert.deepEqual(f.platforms, ['youtube'])
    assert.deepEqual(f.formats, ['short'])
    assert.equal(f.max_price, 1500)
    assert.equal(f.currency, 'EUR')
    assert.equal(f.owner, 'u1')
    assert.equal(f.sort, 'price')
    assert.equal(f.dir, 'asc')
    const b = db.brandDbFilters(new URLSearchParams('stage=active,won&min_budget=2000&sort=bogus'), { callerId: 'u1' })
    assert.deepEqual(b.stages, ['active'])
    assert.equal(b.min_budget, 2000)
    assert.equal(b.sort, 'added')
  })

  await check('"Add to Database" is offered after replied (creators) and call booked / won (brands)', () => {
    assert.deepEqual([...db.DB_OFFER_ACTIONS.creator], ['replied'])
    assert.deepEqual([...db.DB_OFFER_ACTIONS.brand], ['call_booked', 'won'])
  })
}

// ─── Pure logic: mailbox window, contacts, Apollo, lists ─────────────────────

async function contactsListsChecks() {
  console.log('\nMailbox window, contacts, Apollo and lists pure-logic checks\n')

  await check('mailbox window: 12 to 24 hours, anything else → 15 (same as outreach_mailbox_window_hours)', () => {
    assert.equal(rules.mailboxWindowHours(15), 15)
    assert.equal(rules.mailboxWindowHours('12'), 12)
    assert.equal(rules.mailboxWindowHours(24), 24)
    assert.equal(rules.mailboxWindowHours(11), 15)
    assert.equal(rules.mailboxWindowHours(25), 15)
    assert.equal(rules.mailboxWindowHours('abc'), 15)
    assert.equal(rules.mailboxWindowHours(null), 15)
  })

  await check('"next slot frees at HH:MM (Karachi)": UTC+5, other days show the date', () => {
    assert.equal(rules.karachiClock('2026-11-06T08:21:20Z'), '13:21')
    assert.equal(rules.karachiClock('2026-11-05T20:05:00Z'), '01:05')
    assert.equal(rules.karachiClock(null), null)
    const now = new Date('2026-11-06T06:00:00Z') // 11:00 Karachi
    assert.equal(rules.karachiSlotLabel('2026-11-06T08:21:20Z', now), '13:21')
    assert.equal(rules.karachiSlotLabel('2026-11-06T20:00:00Z', now), '7 Nov 01:00')
  })

  await check('outreach_mailbox_full detail "sent/limit/next_free_at" parses (Postgres timestamptz text)', () => {
    assert.deepEqual(rules.parseMailboxFullDetail('2/2/2026-11-06 13:21:20.94032+05'), { sent: 2, limit: 2, nextFreeAt: '2026-11-06T08:21:20.940Z' })
    assert.deepEqual(rules.parseMailboxFullDetail('30/30'), { sent: 30, limit: 30, nextFreeAt: null })
    assert.equal(rules.parseMailboxFullDetail('junk'), null)
    assert.equal(rules.parseMailboxFullDetail(null), null)
  })

  await check('lists from the source file name (same as outreach_list_from_source)', () => {
    assert.equal(rules.listFromSource('brand', 'yc_brands_new_2026-11-01.csv'), 'yc')
    assert.equal(rules.listFromSource('brand', 'sponsor_brands.csv'), 'sponsor')
    assert.equal(rules.listFromSource('brand', 'Apollo export.csv'), 'apollo')
    assert.equal(rules.listFromSource('brand', 'manual'), 'manual')
    assert.equal(rules.listFromSource('brand', null), 'manual')
    assert.equal(rules.listFromSource('creator', 'creators_review.csv'), 'creators_review')
    assert.equal(rules.listFromSource('creator', 'creators_review_new_x.csv'), 'creators_review')
    assert.equal(rules.listFromSource('creator', 'creators.csv'), 'creators_new')
    assert.equal(rules.listFromSource('creator', 'creators_new_x.csv'), 'creators_new')
    assert.equal(rules.listFromSource('creator', 'manual'), 'manual')
    assert.deepEqual([...rules.listsFor('brand')], ['yc', 'sponsor', 'apollo', 'manual'])
    assert.deepEqual([...rules.listsFor('creator')], ['creators_new', 'creators_review', 'manual'])
  })

  await check('contacts: old contact_name splits into first / last name like the migration', () => {
    assert.deepEqual(rules.splitName('Ann Lee Smith'), { first_name: 'Ann', last_name: 'Lee Smith' })
    assert.deepEqual(rules.splitName('  Olga  '), { first_name: 'Olga', last_name: null })
    assert.deepEqual(rules.splitName(''), { first_name: null, last_name: null })
    assert.equal(rules.contactName({ first_name: 'Ann', last_name: 'Lee' }), 'Ann Lee')
    assert.equal(rules.contactName({ email: 'x@y.com' }), 'x@y.com')
  })

  await check('brand status follows the furthest-along contact; call booked / won never drop', () => {
    const s = rules.brandStatusFromContacts
    assert.equal(s(['found', 'replied', 'contacted'], 'contacted'), 'replied')
    assert.equal(s(['found', 'followed_up'], 'contacted'), 'followed_up')
    assert.equal(s(['contacted', 'bounced'], 'found'), 'contacted')
    assert.equal(s(['found', 'not_interested'], 'contacted'), 'not_interested')
    assert.equal(s(['bounced', 'no_reply'], 'followed_up'), 'bounced')
    assert.equal(s(['found', 'found'], 'found'), 'found')
    assert.equal(s(['bounced'], 'call_booked'), 'call_booked')
    assert.equal(s(['replied'], 'won'), 'won')
    assert.equal(s([], 'contacted'), 'contacted')
  })

  await check('contact fields: email / LinkedIn follow the lead rules; status is never editable here', () => {
    const ok = rules.validateContactFields({ first_name: ' Ann ', email: ' ANN@acme.io ', linkedin: 'linkedin.com/in/ann', is_primary: true }, false)
    assert.deepEqual(ok.errors, {})
    assert.deepEqual(ok.values, { first_name: 'Ann', email: 'ann@acme.io', linkedin: 'https://linkedin.com/in/ann', is_primary: true })
    assert.ok(rules.validateContactFields({ email: 'nope' }, false).errors.email)
    assert.ok(rules.validateContactFields({ linkedin: 'javascript:alert(1)' }, false).errors.linkedin)
    assert.ok(rules.validateContactFields({ status: 'replied' }, true).errors.status)
    assert.ok(rules.validateContactFields({ title: 'CMO' }, false).errors.first_name, 'needs a name, email or LinkedIn')
    assert.deepEqual(rules.validateContactFields({ title: 'CMO' }, true).errors, {}, 'an edit can change only the title')
    assert.ok(rules.validateContactFields({ is_primary: 'yes' }, true).errors.is_primary)
  })

  await check('Apollo: detected by headers (exact spellings "Employes", "Tittle"), case-insensitive, typos tolerated', () => {
    const h = ['Company Name', 'Website', 'Employes size', 'First Name', 'Last Name', 'Tittle', 'Email', 'Linkedin']
    assert.deepEqual(rules.apolloMapping(h), {
      'Company Name': 'company', Website: 'website', 'Employes size': 'team_size', 'First Name': 'first_name',
      'Last Name': 'last_name', Tittle: 'title', Email: 'email', Linkedin: 'linkedin',
    })
    assert.equal(rules.isApolloHeaders(h), true)
    assert.equal(rules.isApolloHeaders(h.map((x) => x.toUpperCase())), true)
    const typos = rules.apolloMapping(['Comapny Name', 'webiste', 'Emploees size', 'Frist Name', 'Last Nme', 'Titel', 'Emial', 'Linkdin', 'Phone'])
    assert.deepEqual(Object.values(typos), ['company', 'website', 'team_size', 'first_name', 'last_name', 'title', 'email', 'linkedin', ''])
    // Other files are not Apollo
    assert.equal(rules.isApolloHeaders(['company', 'website', 'domain', 'country', 'batch']), false)
    assert.equal(rules.isApolloHeaders(['channel_name', 'channel_url', 'subscribers', 'email']), false)
  })

  await check('Apollo rows: website → website + domain, email / LinkedIn checked, needs a brand and a person', () => {
    const h = ['Company Name', 'Website', 'Employes size', 'First Name', 'Last Name', 'Tittle', 'Email', 'Linkedin']
    const m = rules.apolloMapping(h)
    const { row, errors } = rules.mapApolloRow(h, ['Acme', 'www.acme.io/about', '11-50', 'Ann', 'Lee', 'CMO', 'ANN@acme.io', 'linkedin.com/in/ann'], m, 2)
    assert.deepEqual(errors, [])
    assert.equal(row.website, 'https://www.acme.io/about')
    assert.equal(row.domain, 'acme.io')
    assert.equal(row.email, 'ann@acme.io')
    assert.equal(row.team_size, '11-50')
    assert.equal(row._row, 2)
    assert.ok(rules.mapApolloRow(h, ['Acme', '', '', 'Ann', '', '', 'bad-email', ''], m, 3).errors.some((e) => /email/.test(e)))
    assert.ok(rules.mapApolloRow(h, ['', '', '', 'Ann', '', '', 'a@b.co', ''], m, 4).errors.some((e) => /company/.test(e)))
    assert.ok(rules.mapApolloRow(h, ['Acme', 'acme.io', '', '', '', 'CMO', '', ''], m, 5).errors.some((e) => /contact/.test(e)))
    assert.ok(rules.mapApolloRow(h, ['Acme', 'javascript:alert(1)', '', 'Ann', '', '', '', ''], m, 6).errors.some((e) => /website/.test(e)))
    // Server re-check of an already mapped row gives the same result
    assert.deepEqual(rules.cleanApolloRow({ ...row }).row, row)
    assert.equal(rules.mapApolloRow(h, ['', 'beta.io', '', 'Bo', '', '', '', ''], m, 7).row.company, 'beta.io')
  })
}

// ─── HTTP (writes data) ──────────────────────────────────────────────────────

function loadEnvFile(filePath) {
  const env = {}
  if (!existsSync(filePath)) {return env}
  for (const rawLine of readFileSync(filePath, 'utf-8').split('\n')) {
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

async function httpChecks() {
  const fileEnv = loadEnvFile(path.join(REPO_ROOT, '.env.test.local'))
  const getEnv = (k) => process.env[k] ?? fileEnv[k] ?? ''
  const BASE_URL = getEnv('BASE_URL') || 'http://localhost:3000'
  const ADMIN_TOKEN = getEnv('ADMIN_TOKEN')
  const OUTREACH_TOKEN = getEnv('OUTREACH_TOKEN') // optional: member 403 checks
  console.log(`\nHTTP checks against ${BASE_URL} (writes data)\n`)
  if (!ADMIN_TOKEN) {
    skip('HTTP outreach checks', 'ADMIN_TOKEN not set in .env.test.local')
    return
  }

  const headers = { Cookie: `auth_token=${ADMIN_TOKEN}`, 'Content-Type': 'application/json' }
  const call = async (method, urlPath, body) => {
    const res = await fetch(`${BASE_URL}${urlPath}`, { method, headers, body: body ? JSON.stringify(body) : undefined })
    let json = null
    try { json = await res.json() } catch { /* non-JSON */ }
    return { status: res.status, json }
  }
  const raw = async (method, urlPath) => {
    const res = await fetch(`${BASE_URL}${urlPath}`, { method, headers })
    return { status: res.status, text: await res.text() }
  }

  const tag = `oc${Date.now()}`
  const email1 = `${tag}.one@outreach-check.invalid`
  const email2 = `${tag}.dnc@outreach-check.invalid`
  const email3 = `${tag}.three@outreach-check.invalid`
  const created = []
  let dncId = null
  let mailboxId = null

  try {
    const team = await call('GET', '/api/admin/outreach/team').catch(() => null)
    if (!team) {
      skip('HTTP outreach checks', `no server at ${BASE_URL}; start the dev server first`)
      return
    }
    if (team.status !== 200) {
      skip('HTTP outreach checks', `GET /api/admin/outreach/team returned ${team.status}; is the migration applied and ADMIN_TOKEN fresh?`)
      return
    }

    await check('add creator A', async () => {
      const r = await call('POST', '/api/admin/outreach/leads/creators', {
        name: `${tag} A`, email: email1, profile_url: `https://www.youtube.com/@${tag}A`, source: 'outreach-check',
      })
      assert.equal(r.status, 201, JSON.stringify(r.json))
      assert.match(r.json.lead.lead_id, /^C-\d{4,}$/)
      created.push(['creators', r.json.lead.lead_id])
    })
    const leadA = created[0]?.[1]

    await check('duplicate email (other case + spaces) is blocked with the existing lead id', async () => {
      const r = await call('POST', '/api/admin/outreach/leads/creators', { name: 'dupe', email: `  ${email1.toUpperCase()} `, source: 'outreach-check' })
      assert.equal(r.status, 409)
      assert.equal(r.json.duplicates?.[0]?.lead_id, leadA)
    })

    await check('duplicate profile URL (other spelling) is blocked', async () => {
      const r = await call('POST', '/api/admin/outreach/leads/creators', { name: 'dupe', profile_url: `youtube.com/@${tag.toUpperCase()}a/?si=1`, source: 'outreach-check' })
      assert.equal(r.status, 409)
      assert.equal(r.json.duplicates?.[0]?.lead_id, leadA)
    })

    await check('email is unique across creators AND brands', async () => {
      const r = await call('POST', '/api/admin/outreach/leads/brands', { company: 'dupe co', email: email1, domain: `${tag}.invalid`, source: 'outreach-check' })
      assert.equal(r.status, 409)
      assert.equal(r.json.duplicates?.[0]?.lead_id, leadA)
    })

    await check('add a DNC email', async () => {
      const r = await call('POST', '/api/admin/outreach/dnc', { key_type: 'email', value: email2.toUpperCase(), reason: 'removal_request' })
      assert.equal(r.status, 201, JSON.stringify(r.json))
      assert.equal(r.json.entry.key_value, email2)
      dncId = r.json.entry.id
    })

    await check('a lead on the DNC list is blocked', async () => {
      const r = await call('POST', '/api/admin/outreach/leads/creators', { name: 'dnc', email: email2, source: 'outreach-check' })
      assert.equal(r.status, 409, JSON.stringify(r.json))
      assert.match(r.json.error, /do-not-contact/)
    })

    const importRows = [
      { _row: 2, name: 'dup of A', email: email1 },
      { _row: 3, name: 'dnc row', email: email2 },
      { _row: 4, name: 'new row', email: email3, profile_url: `youtube.com/@${tag}three`, subscribers: 150000 },
      { _row: 5, name: 'no key' },
      { _row: 6, name: 'same as row 4', profile_url: `https://youtube.com/@${tag}THREE/` },
    ]

    await check('import preview: 1 new, 2 duplicates, 1 DNC, 1 error', async () => {
      const r = await call('POST', '/api/admin/outreach/import/preview', { lead_type: 'creator', rows: importRows })
      assert.equal(r.status, 200, JSON.stringify(r.json))
      assert.deepEqual(r.json.counts, { new: 1, duplicate: 2, dnc: 1, error: 1 })
      const byRow = Object.fromEntries(r.json.rows.map((x) => [x._row ?? x.row, x]))
      assert.equal(byRow[2].match.lead_id, leadA)
      assert.equal(byRow[6].duplicateOfRow, 4)
    })

    await check('import commit: inserts the new row, skips and reports the rest', async () => {
      const r = await call('POST', '/api/admin/outreach/import/commit', { lead_type: 'creator', source: 'outreach-check', rows: importRows })
      assert.equal(r.status, 200, JSON.stringify(r.json))
      assert.equal(r.json.inserted, 1)
      assert.equal(r.json.skipped.length, 4)
      const found = await call('GET', `/api/admin/outreach/leads/creators?q=${encodeURIComponent(`${tag}three`)}`)
      const lead = found.json.leads.find((l) => l.email === email3)
      assert.ok(lead, 'imported lead not found')
      created.push(['creators', lead.lead_id])
    })

    const patchA = (body) => call('PATCH', `/api/admin/outreach/leads/creators/${leadA}`, body)

    await check('edit: email already used by another lead → 409 naming that lead, on the email field', async () => {
      const r = await patchA({ email: email3.toUpperCase() })
      assert.equal(r.status, 409, JSON.stringify(r.json))
      assert.match(r.json.fields.email[0], /^Already used by C-\d+/)
    })

    await check('edit: email on the DNC list → 409 on the email field', async () => {
      const r = await patchA({ email: email2 })
      assert.equal(r.status, 409, JSON.stringify(r.json))
      assert.match(r.json.fields.email[0], /do-not-contact/)
    })

    await check('edit: invalid values → 400 per field, never 500', async () => {
      const r = await patchA({ email: 'not-an-email', subscribers: '-5', website: 'javascript:alert(1)' })
      assert.equal(r.status, 400, JSON.stringify(r.json))
      assert.deepEqual(Object.keys(r.json.fields).sort(), ['email', 'subscribers', 'website'])
    })

    await check('edit: status and lead_id are not editable', async () => {
      const r = await patchA({ status: 'signed_up', lead_id: 'C-9' })
      assert.equal(r.status, 400, JSON.stringify(r.json))
      assert.ok(r.json.fields.status && r.json.fields.lead_id)
    })

    await check('edit: normalises values and logs old → new as "edited"', async () => {
      const r = await patchA({ website: `${tag}.example`, subscribers: '5k', extra: { batch: 'W24' } })
      assert.equal(r.status, 200, JSON.stringify(r.json))
      assert.equal(r.json.lead.website, `https://${tag}.example`)
      assert.equal(r.json.lead.subscribers, 5000)
      assert.equal(r.json.lead.extra.batch, 'W24')
      const again = await patchA({ website: `https://${tag}.example`, subscribers: 5000 })
      assert.equal(again.json.changed, false, 'saving the same values logs nothing')
      const detail = (await call('GET', `/api/admin/outreach/leads/creators/${leadA}`)).json
      const edits = detail.activity.filter((a) => a.action === 'edited')
      assert.equal(edits.length, 1)
      assert.deepEqual(edits[0].changes.subscribers, { old: null, new: 5000 })
    })

    await check('search finds extra fields', async () => {
      const r = await call('GET', `/api/admin/outreach/leads/creators?q=W24&limit=200`)
      assert.ok(r.json.leads.some((l) => l.lead_id === leadA))
    })

    await check('missing-email filter and counter', async () => {
      const all = await call('GET', `/api/admin/outreach/leads/creators?q=${tag}&limit=200`)
      const missing = await call('GET', `/api/admin/outreach/leads/creators?q=${tag}&missing=email&limit=200`)
      assert.equal(missing.status, 200)
      assert.ok(missing.json.leads.every((l) => !l.email))
      assert.equal(all.json.missingEmailCount, missing.json.total)
    })

    await check('add a mailbox with a 1/day limit', async () => {
      const r = await call('POST', '/api/admin/outreach/mailboxes', {
        address: `${tag}@outreach-check.invalid`, start_date: '2026-01-01', is_personal: false, custom_limit: 1,
      })
      assert.equal(r.status, 201, JSON.stringify(r.json))
      mailboxId = r.json.mailbox.id
    })

    let firstActivity = null
    await check('contacted: status, follow-up date, mailbox count', async () => {
      const r = await call('POST', '/api/admin/outreach/actions', { lead_id: leadA, action: 'contacted', channel: 'email', mailbox_id: mailboxId })
      assert.equal(r.status, 200, JSON.stringify(r.json))
      assert.equal(r.json.result.mailbox_sent_today, 1)
      assert.equal(r.json.result.mailbox_limit, 1)
      firstActivity = r.json.result.activity_id
      const lead = (await call('GET', `/api/admin/outreach/leads/creators/${leadA}`)).json.lead
      assert.equal(lead.status, 'contacted')
      assert.equal(lead.follow_up_date, rules.followUpDate(lead.date_contacted))
    })

    await check('mailbox at its limit blocks the next send', async () => {
      const second = created[1]?.[1]
      const r = await call('POST', '/api/admin/outreach/actions', { lead_id: second, action: 'contacted', channel: 'email', mailbox_id: mailboxId })
      assert.equal(r.status, 409, JSON.stringify(r.json))
      assert.equal(r.json.code, 'outreach_mailbox_full')
    })

    await check('DMs need no mailbox', async () => {
      const second = created[1]?.[1]
      const r = await call('POST', '/api/admin/outreach/actions', { lead_id: second, action: 'contacted', channel: 'linkedin' })
      assert.equal(r.status, 200, JSON.stringify(r.json))
      assert.equal(r.json.result.mailbox_id, null)
    })

    await check('undo restores the lead and frees the mailbox send', async () => {
      const r = await call('POST', '/api/admin/outreach/actions/undo', { activity_id: firstActivity })
      assert.equal(r.status, 200, JSON.stringify(r.json))
      const lead = (await call('GET', `/api/admin/outreach/leads/creators/${leadA}`)).json.lead
      assert.equal(lead.status, 'found')
      assert.equal(lead.follow_up_date, null)
      const again = await call('POST', '/api/admin/outreach/actions/undo', { activity_id: firstActivity })
      assert.equal(again.status, 409)
    })

    await check('opted out adds the email to the DNC list and flags the lead', async () => {
      const r = await call('POST', '/api/admin/outreach/actions', { lead_id: leadA, action: 'opted_out' })
      assert.equal(r.status, 200, JSON.stringify(r.json))
      const lead = (await call('GET', `/api/admin/outreach/leads/creators/${leadA}`)).json.lead
      assert.equal(lead.dnc, true)
      const undo = await call('POST', '/api/admin/outreach/actions/undo', { activity_id: r.json.result.activity_id })
      assert.equal(undo.status, 200)
      const after = (await call('GET', `/api/admin/outreach/leads/creators/${leadA}`)).json.lead
      assert.equal(after.dnc, false, 'undo should remove the DNC entry the opt-out added')
    })

    // ── Soft delete / restore ──
    const email4 = `${tag}.deleted@outreach-check.invalid`
    let leadD = null
    await check('add creator D (to delete)', async () => {
      const r = await call('POST', '/api/admin/outreach/leads/creators', {
        name: `${tag} D`, email: email4, profile_url: `youtube.com/@${tag}D`, x: `x.com/${tag}d`, source: 'outreach-check',
      })
      assert.equal(r.status, 201, JSON.stringify(r.json))
      leadD = r.json.lead.lead_id
      created.push(['creators', leadD])
    })
    const inTable = async (q, extra = '') =>
      (await call('GET', `/api/admin/outreach/leads/creators?q=${encodeURIComponent(q)}&limit=200${extra}`)).json

    await check('"select all matching": ids=1 returns every matching lead id', async () => {
      const r = await call('GET', `/api/admin/outreach/leads/creators?q=${tag}&ids=1`)
      assert.equal(r.status, 200, JSON.stringify(r.json))
      assert.ok(r.json.ids.includes(leadA) && r.json.ids.includes(leadD))
      assert.equal(r.json.total, (await inTable(tag)).total)
    })

    await check('delete: hidden from the table, counts and export; listed under the Deleted filter', async () => {
      const r = await call('POST', '/api/admin/outreach/leads/creators/delete', { lead_ids: [leadD] })
      assert.equal(r.status, 200, JSON.stringify(r.json))
      assert.equal(r.json.deleted, 1)
      const visible = await inTable(leadD)
      assert.equal(visible.total, 0)
      assert.ok(!(await inTable(tag)).leads.some((l) => l.lead_id === leadD))
      const deleted = await inTable(leadD, '&deleted=1')
      assert.equal(deleted.total, 1)
      assert.ok(deleted.leads[0].deleted_at && deleted.leads[0].deleted_by)
      const csv = await raw('GET', `/api/admin/outreach/leads/creators/export?q=${tag}`)
      assert.equal(csv.status, 200)
      assert.ok(!csv.text.includes(email4), 'deleted lead must not be exported')
      assert.ok(csv.text.includes(leadA), 'other leads are still exported')
    })

    await check('delete again changes nothing (reported as skipped)', async () => {
      const r = await call('POST', '/api/admin/outreach/leads/creators/delete', { lead_ids: [leadD] })
      assert.equal(r.status, 200)
      assert.equal(r.json.deleted, 0)
      assert.equal(r.json.skipped, 1)
    })

    await check('a deleted lead still blocks duplicates: "Previously deleted: C-…" on add, check and import', async () => {
      const add = await call('POST', '/api/admin/outreach/leads/creators', { name: 'again', email: email4.toUpperCase(), source: 'outreach-check' })
      assert.equal(add.status, 409, JSON.stringify(add.json))
      assert.equal(add.json.error, `Previously deleted: ${leadD}`)
      const dup = await call('GET', `/api/admin/outreach/check-duplicate?type=creator&email=${encodeURIComponent(email4)}`)
      assert.equal(dup.json.duplicates[0].lead_id, leadD)
      assert.equal(dup.json.duplicates[0].deleted, true)
      const preview = await call('POST', '/api/admin/outreach/import/preview', {
        lead_type: 'creator', rows: [{ _row: 2, name: 'again', profile_url: `https://www.youtube.com/@${tag}d/` }],
      })
      assert.equal(preview.status, 200, JSON.stringify(preview.json))
      assert.equal(preview.json.rows[0].status, 'duplicate')
      assert.equal(preview.json.rows[0].reasons[0], `Previously deleted: ${leadD}`)
      const edit = await call('PATCH', `/api/admin/outreach/leads/creators/${created[1][1]}`, { email: email4 })
      assert.equal(edit.status, 409, JSON.stringify(edit.json))
      assert.equal(edit.json.fields.email[0], `Previously deleted: ${leadD}`)
    })

    await check('a deleted lead stays in already_in_sheet.txt', async () => {
      const r = await raw('GET', '/api/admin/outreach/export/already-in-sheet')
      assert.equal(r.status, 200)
      assert.ok(r.text.split('\n').includes(email4))
    })

    await check('a deleted lead takes no actions or edits until restored (409, never 500)', async () => {
      const act = await call('POST', '/api/admin/outreach/actions', { lead_id: leadD, action: 'contacted', channel: 'linkedin' })
      assert.equal(act.status, 409, JSON.stringify(act.json))
      assert.equal(act.json.code, 'outreach_deleted')
      const edit = await call('PATCH', `/api/admin/outreach/leads/creators/${leadD}`, { notes: 'x' })
      assert.equal(edit.status, 409, JSON.stringify(edit.json))
    })

    await check('restore: back in the table; delete and restore both logged', async () => {
      const r = await call('POST', '/api/admin/outreach/leads/creators/restore', { lead_ids: [leadD] })
      assert.equal(r.status, 200, JSON.stringify(r.json))
      assert.equal(r.json.restored, 1)
      assert.equal((await inTable(leadD)).total, 1)
      const detail = (await call('GET', `/api/admin/outreach/leads/creators/${leadD}`)).json
      assert.equal(detail.lead.deleted_at, null)
      const actions = detail.activity.map((a) => a.action)
      assert.ok(actions.includes('deleted') && actions.includes('restored'), actions.join(','))
    })

    await check('per-row DELETE is a soft delete too', async () => {
      const r = await call('DELETE', `/api/admin/outreach/leads/creators/${leadD}`)
      assert.equal(r.status, 200, JSON.stringify(r.json))
      const detail = (await call('GET', `/api/admin/outreach/leads/creators/${leadD}`)).json
      assert.ok(detail.lead.deleted_at, 'row should still exist with deleted_at set')
    })

    // ── Creator / Client Database ──
    const dbApi = '/api/admin/outreach/database'
    let dbC = null // creator lead promoted to the Database
    let dbDirect = null // creator added directly
    let dbB = null // brand lead promoted to the Database

    await check('database: add a creator lead (201), again = already (200); the leads table shows it as in_db', async () => {
      const lead = await call('POST', '/api/admin/outreach/leads/creators', {
        name: `${tag} DB`, email: `${tag}.db@outreach-check.invalid`, profile_url: `https://www.youtube.com/@${tag}db`,
        platform: 'YouTube', subscribers: 150000, niche: 'AI tools', country: 'UK', source: 'outreach-check',
      })
      assert.equal(lead.status, 201, JSON.stringify(lead.json))
      dbC = lead.json.lead.lead_id
      created.push(['creators', dbC])
      const a = await call('POST', `${dbApi}/creators`, { lead_id: dbC })
      assert.equal(a.status, 201, JSON.stringify(a.json))
      assert.equal(a.json.added, true)
      const b = await call('POST', `${dbApi}/creators`, { lead_id: dbC })
      assert.equal(b.status, 200, JSON.stringify(b.json))
      assert.equal(b.json.already, true)
      const list = await call('GET', `/api/admin/outreach/leads/creators?q=${dbC}`)
      assert.equal(list.json.leads[0]?.in_db, true)
      assert.equal((await call('POST', `${dbApi}/creators`, { lead_id: 'C-99999999' })).status, 404)
    })

    await check('database: fields save and only changes are logged; bad values → 400 per field', async () => {
      const r = await call('PATCH', `${dbApi}/creators/${dbC}`, { availability: 'limited', tags: [tag, 'fast'], followers: { instagram: '5k' }, upfront_pct: 50 })
      assert.equal(r.status, 200, JSON.stringify(r.json))
      assert.deepEqual(Object.keys(r.json.changes).sort(), ['availability', 'followers', 'tags', 'upfront_pct'])
      const same = await call('PATCH', `${dbApi}/creators/${dbC}`, { availability: 'limited' })
      assert.equal(same.status, 200)
      assert.deepEqual(same.json.changes, {})
      const bad = await call('PATCH', `${dbApi}/creators/${dbC}`, { availability: 'soon', removed_at: '2020-01-01' })
      assert.equal(bad.status, 400, JSON.stringify(bad.json))
      assert.ok(bad.json.fields.availability && bad.json.fields.removed_at)
    })

    await check('database: rates add / edit / delete; a bad rate → 400 on its field', async () => {
      const base = `${dbApi}/creators/${dbC}/rates`
      const r1 = await call('POST', base, { platform: 'youtube', format: 'dedicated_video', price: 2000, currency: 'USD', quoted_at: '2026-06-01' })
      assert.equal(r1.status, 201, JSON.stringify(r1.json))
      assert.equal((await call('POST', base, { platform: 'youtube', format: 'integration', price: '800' })).status, 201)
      const r3 = await call('POST', base, { platform: 'instagram', format: 'story', price: 350, usage_rights: true, usage_note: '30 days' })
      assert.equal(r3.status, 201)
      const bad = await call('POST', base, { platform: 'github', format: 'story', price: -1 })
      assert.equal(bad.status, 400)
      assert.ok(bad.json.fields.platform && bad.json.fields.price)
      const edit = await call('PATCH', `${base}/${r3.json.item.id}`, { price: 300 })
      assert.equal(edit.status, 200, JSON.stringify(edit.json))
      assert.equal(Number(edit.json.item.price), 300)
      const tmp = await call('POST', base, { platform: 'tiktok', format: 'short', price: 100 })
      assert.equal((await call('DELETE', `${base}/${tmp.json.item.id}`)).status, 200)
      assert.equal((await call('DELETE', `${base}/${tmp.json.item.id}`)).status, 404)
      // A rate id from another entry never matches this one
      assert.equal((await call('PATCH', `${dbApi}/creators/C-99999999/rates/${r1.json.item.id}`, { price: 1 })).status, 404)
    })

    await check('database search: cheapest / typical, budget, format, platform, country, niche (contains), tag, sort', async () => {
      const q = (extra) => call('GET', `${dbApi}/creators?tag=${encodeURIComponent(tag)}${extra}`)
      const all = await q('')
      assert.equal(all.status, 200, JSON.stringify(all.json))
      assert.equal(all.json.total, 1)
      const row = all.json.rows[0]
      assert.equal(row.lead_id, dbC)
      assert.equal(Number(row.cheapest), 300)
      assert.equal(Number(row.typical), 800)
      assert.equal(row.rate_currency, 'USD')
      assert.equal(Number(row.total_followers), 155000)
      assert.deepEqual(row.all_platforms, ['instagram', 'youtube'])
      assert.equal(row.last_quoted_at !== null, true)
      assert.ok(!('email_norm' in row), 'internal key column not sent')
      assert.equal((await q('&max_price=500')).json.total, 1)
      assert.equal((await q('&max_price=500&format=dedicated_video')).json.total, 0)
      assert.equal((await q('&max_price=500&currency=EUR')).json.total, 0)
      assert.equal((await q('&platform=tiktok')).json.total, 0)
      assert.equal((await q('&country=uk')).json.total, 1)
      assert.equal((await q(`&niche=${encodeURIComponent('AI Tools & Automation')}`)).json.total, 1)
      assert.equal((await q('&niche=Fintech')).json.total, 0)
      assert.equal((await q('&availability=booked')).json.total, 0)
      assert.equal((await q('&sort=price&dir=asc')).status, 200)
    })

    await check('database: detail has the lead, rates and activity; CSV export has the row', async () => {
      const d = await call('GET', `${dbApi}/creators/${dbC}`)
      assert.equal(d.status, 200, JSON.stringify(d.json))
      assert.equal(d.json.lead.lead_id, dbC)
      assert.equal(d.json.rates.length, 3)
      const actions = d.json.activity.map((a) => a.action)
      assert.ok(actions.includes('db_added') && actions.includes('db_edited'), actions.join(','))
      const csv = await raw('GET', `${dbApi}/creators/export?tag=${encodeURIComponent(tag)}`)
      assert.equal(csv.status, 200)
      assert.ok(csv.text.includes(dbC) && csv.text.includes('Integration: 800'), csv.text.slice(0, 400))
    })

    await check('database: add directly creates the lead as replied; a duplicate is 409 naming the existing lead', async () => {
      const email = `${tag}.direct@outreach-check.invalid`
      const r = await call('POST', `${dbApi}/creators`, { lead: { name: `${tag} Direct`, email, profile_url: `https://www.youtube.com/@${tag}direct`, source: 'outreach-check' } })
      assert.equal(r.status, 201, JSON.stringify(r.json))
      assert.equal(r.json.created, true)
      dbDirect = r.json.lead_id
      created.push(['creators', dbDirect])
      const lead = await call('GET', `/api/admin/outreach/leads/creators/${dbDirect}`)
      assert.equal(lead.json.lead.status, 'replied')
      const dup = await call('POST', `${dbApi}/creators`, { lead: { name: 'again', email: email.toUpperCase() } })
      assert.equal(dup.status, 409, JSON.stringify(dup.json))
      assert.equal(dup.json.duplicates[0].lead_id, dbDirect)
      const badStatus = await call('POST', `${dbApi}/creators`, { lead: { email: `${tag}.x@outreach-check.invalid` }, status: 'won' })
      assert.equal(badStatus.status, 400)
    })

    await check('a replied action offers "Add to Database" only when the lead is not in it yet', async () => {
      const e = await call('POST', '/api/admin/outreach/leads/creators', { name: `${tag} E`, email: `${tag}.e@outreach-check.invalid`, source: 'outreach-check' })
      assert.equal(e.status, 201)
      created.push(['creators', e.json.lead.lead_id])
      const offer = await call('POST', '/api/admin/outreach/actions', { lead_id: e.json.lead.lead_id, action: 'replied' })
      assert.equal(offer.status, 200, JSON.stringify(offer.json))
      assert.equal(offer.json.dbOffer, true)
      const noOffer = await call('POST', '/api/admin/outreach/actions', { lead_id: dbC, action: 'replied' })
      assert.equal(noOffer.status, 200, JSON.stringify(noOffer.json))
      assert.equal(noOffer.json.dbOffer, false)
    })

    await check('client database: fields, budget order, campaigns, search', async () => {
      const domain = `${tag}-brand.invalid`
      const lead = await call('POST', '/api/admin/outreach/leads/brands', { company: `${tag} Brand`, domain, contact_name: 'Ann', email: `ann@${domain}`, country: 'Germany', source: 'outreach-check' })
      assert.equal(lead.status, 201, JSON.stringify(lead.json))
      dbB = lead.json.lead.lead_id
      created.push(['brands', dbB])
      assert.equal((await call('POST', `${dbApi}/brands`, { lead_id: dbB })).status, 201)
      const f = await call('PATCH', `${dbApi}/brands/${dbB}`, { stage: 'active', niches: ['SaaS & Software'], target_countries: ['USA'], budget_min: 1000, budget_max: 5000, platforms: ['youtube'] })
      assert.equal(f.status, 200, JSON.stringify(f.json))
      const order = await call('PATCH', `${dbApi}/brands/${dbB}`, { budget_min: 9000 })
      assert.equal(order.status, 400, JSON.stringify(order.json))
      // Contacts belong to the lead now (/leads/brands/[id]/contacts), not the Database.
      assert.equal((await call('POST', `${dbApi}/brands/${dbB}/contacts`, { first_name: 'x' })).status, 404)
      const camp = await call('POST', `${dbApi}/brands/${dbB}/campaigns`, { title: 'Launch', run_date: '2026-09-01', total_budget: '4k' })
      assert.equal(camp.status, 201, JSON.stringify(camp.json))
      assert.equal((await call('POST', `${dbApi}/brands/${dbB}/rates`, { price: 1 })).status, 404)
      const s = (extra) => call('GET', `${dbApi}/brands?q=${encodeURIComponent(tag)}${extra}`)
      const found = await s('&stage=active&min_budget=4000&country=usa&niche=' + encodeURIComponent('SaaS & Software'))
      assert.equal(found.json.total, 1, JSON.stringify(found.json))
      assert.equal(found.json.rows[0].campaigns_count, 1)
      assert.equal((await s('&min_budget=6000')).json.total, 0)
      assert.equal((await s('&stage=past')).json.total, 0)
      const csv = await raw('GET', `${dbApi}/brands/export?q=${encodeURIComponent(tag)}`)
      assert.ok(csv.text.includes(dbB), 'brand export has the row')
    })

    await check('database: remove (admin) hides the entry; adding again restores its rates', async () => {
      const r = await call('DELETE', `${dbApi}/creators/${dbC}`)
      assert.equal(r.status, 200, JSON.stringify(r.json))
      assert.equal(r.json.removed, 1)
      const gone = await call('GET', `${dbApi}/creators/${dbC}`)
      assert.equal(gone.status, 404)
      assert.equal(gone.json.removed, true)
      assert.equal((await call('GET', `${dbApi}/creators?tag=${encodeURIComponent(tag)}`)).json.total, 0)
      assert.equal((await call('PATCH', `${dbApi}/creators/${dbC}`, { notes: 'x' })).status, 404)
      const back = await call('POST', `${dbApi}/creators`, { lead_id: dbC })
      assert.equal(back.status, 201)
      assert.equal(back.json.restored, true)
      assert.equal((await call('GET', `${dbApi}/creators/${dbC}`)).json.rates.length, 3)
    })

    // ── Mailbox window, brand contacts, lists, Apollo ──
    const probe = await call('GET', '/api/admin/outreach/leads/brands?limit=1')
    const v2 = probe.json?.features?.contacts === true
    let contactBrand = null
    if (!v2) {
      await check('before the contacts/lists migration: old paths keep working, new features answer 409 (never 500)', async () => {
        assert.equal(probe.status, 200)
        assert.equal((await call('GET', '/api/admin/outreach/leads/brands?list=yc&limit=1')).status, 200, 'list filter is ignored')
        const s = await call('GET', '/api/admin/outreach/settings')
        assert.equal(s.status, 200)
        assert.equal(s.json.settings.mailbox_window_hours, null)
        assert.equal((await call('PATCH', '/api/admin/outreach/settings', { mailbox_window_hours: 15 })).status, 409)
        const mb = await call('GET', '/api/admin/outreach/mailboxes')
        assert.equal(mb.status, 200)
        assert.ok(mb.json.mailboxes.every((m) => m.window_hours === null), 'calendar-day limit before the migration')
        const apollo = await call('POST', '/api/admin/outreach/import/apollo', { source: 'apollo.csv', rows: [{ company: 'x', email: 'x@y.co' }], commit: false })
        assert.equal(apollo.status, 409)
        assert.equal((await call('GET', '/api/admin/outreach/dashboard')).json.lists, null)
      })
      skip('mailbox window / contacts / lists / Apollo HTTP checks', 'run supabase/outreach_contacts_lists_migration.sql first')
    } else {
      let originalHours = 15
      await check('mailbox window setting: 12 to 24 hours, admins only; mailboxes report the window', async () => {
        const s = await call('GET', '/api/admin/outreach/settings')
        assert.equal(s.status, 200, JSON.stringify(s.json))
        originalHours = s.json.settings.mailbox_window_hours
        assert.ok(originalHours >= 12 && originalHours <= 24)
        assert.equal((await call('PATCH', '/api/admin/outreach/settings', { mailbox_window_hours: 11 })).status, 400)
        assert.equal((await call('PATCH', '/api/admin/outreach/settings', { mailbox_window_hours: 25 })).status, 400)
        assert.equal((await call('PATCH', '/api/admin/outreach/settings', { mailbox_window_hours: 12.5 })).status, 400)
        const ok = await call('PATCH', '/api/admin/outreach/settings', { mailbox_window_hours: originalHours })
        assert.equal(ok.status, 200, JSON.stringify(ok.json))
        const mb = await call('GET', '/api/admin/outreach/mailboxes')
        assert.ok(mb.json.mailboxes.every((m) => m.window_hours === originalHours), 'every mailbox counts over the window')
      })

      await check('a 1-send mailbox that is full says when its next slot frees up (Karachi time)', async () => {
        if (!mailboxId) {throw new Error('the mailbox from the earlier check is missing')}
        const mb = (await call('GET', '/api/admin/outreach/mailboxes')).json.mailboxes.find((m) => m.id === mailboxId)
        assert.ok(mb, 'test mailbox listed')
        if (mb.sent_today >= mb.daily_limit) {
          assert.ok(mb.next_free_at && Date.parse(mb.next_free_at) > Date.now(), 'next_free_at in the future')
          const lead = await call('POST', '/api/admin/outreach/leads/creators', { name: `${tag} W`, email: `${tag}.w@outreach-check.invalid`, source: 'outreach-check' })
          created.push(['creators', lead.json.lead.lead_id])
          const r = await call('POST', '/api/admin/outreach/actions', { lead_id: lead.json.lead.lead_id, action: 'contacted', channel: 'email', mailbox_id: mailboxId })
          assert.equal(r.status, 409)
          assert.match(r.json.error, /next slot frees at \d\d:\d\d|frees at \d+ \w+ \d\d:\d\d/i)
        }
      })

      const domain = `${tag}-contacts.invalid`
      await check('brand contacts: the brand\'s own contact becomes the primary contact row', async () => {
        const b = await call('POST', '/api/admin/outreach/leads/brands', { company: `${tag} Contacts`, domain, contact_name: 'Ann Lee', role: 'CMO', email: `ann@${domain}`, source: 'outreach-check' })
        assert.equal(b.status, 201, JSON.stringify(b.json))
        contactBrand = b.json.lead.lead_id
        created.push(['brands', contactBrand])
        const c = await call('GET', `/api/admin/outreach/leads/brands/${contactBrand}/contacts`)
        assert.equal(c.status, 200, JSON.stringify(c.json))
        assert.equal(c.json.contacts.length, 1)
        assert.deepEqual([c.json.contacts[0].first_name, c.json.contacts[0].last_name, c.json.contacts[0].title, c.json.contacts[0].is_primary], ['Ann', 'Lee', 'CMO', true])
      })

      const cbase = () => `/api/admin/outreach/leads/brands/${contactBrand}/contacts`
      let bo = null
      await check('brand contacts: add; an email used by any lead or contact → 409 naming it; DNC → 409; bad values → 400', async () => {
        const r = await call('POST', cbase(), { first_name: 'Bo', title: 'CEO', email: `bo@${domain}`, linkedin: 'linkedin.com/in/bo' })
        assert.equal(r.status, 201, JSON.stringify(r.json))
        bo = r.json.contact
        assert.equal(bo.linkedin, 'https://linkedin.com/in/bo')
        assert.equal(bo.is_primary, false)
        const dupLead = await call('POST', cbase(), { first_name: 'X', email: email1.toUpperCase() })
        assert.equal(dupLead.status, 409, JSON.stringify(dupLead.json))
        assert.match(dupLead.json.error, /Already used by C-\d+/)
        const dupContact = await call('POST', cbase(), { first_name: 'Y', email: `bo@${domain}` })
        assert.equal(dupContact.status, 409)
        const dnc = await call('POST', cbase(), { first_name: 'Z', email: email2 })
        assert.equal(dnc.status, 409, JSON.stringify(dnc.json))
        assert.match(dnc.json.error, /do-not-contact/)
        assert.equal((await call('POST', cbase(), { first_name: 'Q', email: 'nope' })).status, 400)
        assert.equal((await call('POST', cbase(), { title: 'no name' })).status, 400)
        assert.equal((await call('PATCH', `${cbase()}/${bo.id}`, { status: 'replied' })).status, 400, 'status moves through actions')
      })

      await check('one email, one record: a creator lead with a contact\'s email is blocked', async () => {
        const r = await call('POST', '/api/admin/outreach/leads/creators', { name: 'dup', email: `BO@${domain}`, source: 'outreach-check' })
        assert.equal(r.status, 409, JSON.stringify(r.json))
        assert.equal(r.json.duplicates?.[0]?.lead_id, contactBrand)
      })

      await check('actions pick the contact; the brand status follows the furthest-along contact; undo restores both', async () => {
        const c1 = await call('POST', '/api/admin/outreach/actions', { lead_id: contactBrand, action: 'contacted', channel: 'linkedin', contact_id: bo.id })
        assert.equal(c1.status, 200, JSON.stringify(c1.json))
        assert.equal(c1.json.result.contact_id, bo.id)
        assert.equal(c1.json.result.status, 'contacted')
        const list = (await call('GET', cbase())).json.contacts
        assert.equal(list.find((x) => x.id === bo.id).status, 'contacted')
        assert.equal(list.find((x) => x.first_name === 'Ann').status, 'found')
        // No contact given: the server picks the one that was contacted.
        const rep = await call('POST', '/api/admin/outreach/actions', { lead_id: contactBrand, action: 'replied' })
        assert.equal(rep.status, 200, JSON.stringify(rep.json))
        assert.equal(rep.json.result.contact_id, bo.id)
        assert.equal(rep.json.result.status, 'replied')
        const undo = await call('POST', '/api/admin/outreach/actions/undo', { activity_id: rep.json.result.activity_id })
        assert.equal(undo.status, 200, JSON.stringify(undo.json))
        const lead = (await call('GET', `/api/admin/outreach/leads/brands/${contactBrand}`)).json.lead
        assert.equal(lead.status, 'contacted')
        assert.equal((await call('GET', cbase())).json.contacts.find((x) => x.id === bo.id).status, 'contacted')
        const wrong = await call('POST', '/api/admin/outreach/actions', { lead_id: contactBrand, action: 'replied', contact_id: 'not-a-contact' })
        assert.equal(wrong.status, 404)
        const booked = await call('POST', '/api/admin/outreach/actions', { lead_id: contactBrand, action: 'call_booked' })
        assert.equal(booked.json.result.status, 'call_booked')
        const bounce = await call('POST', '/api/admin/outreach/actions', { lead_id: contactBrand, action: 'bounced', contact_id: bo.id })
        assert.equal(bounce.json.result.status, 'call_booked', 'a contact bounce never drops a booked call')
        await call('POST', '/api/admin/outreach/actions/undo', { activity_id: bounce.json.result.activity_id })
      })

      await check('make primary: the brand row shows it; editing the brand email edits the primary contact', async () => {
        assert.equal((await call('PATCH', `${cbase()}/${bo.id}`, { is_primary: true })).status, 200)
        const row = (await call('GET', `/api/admin/outreach/leads/brands?q=${contactBrand}`)).json.leads[0]
        assert.equal(row.contacts.count, 2)
        assert.equal(row.contacts.primary.name, 'Bo')
        assert.equal(row.email, `bo@${domain}`)
        const e = await call('PATCH', `/api/admin/outreach/leads/brands/${contactBrand}`, { email: `bo2@${domain}` })
        assert.equal(e.status, 200, JSON.stringify(e.json))
        const list = (await call('GET', cbase())).json.contacts
        assert.equal(list.find((x) => x.id === bo.id).email, `bo2@${domain}`)
        const taken = await call('PATCH', `/api/admin/outreach/leads/brands/${contactBrand}`, { email: email1 })
        assert.equal(taken.status, 409, JSON.stringify(taken.json))
        assert.ok(taken.json.fields?.email, 'reported on the email field')
      })

      await check('remove a contact: logged, key freed, the other contact becomes primary', async () => {
        assert.equal((await call('DELETE', `${cbase()}/${bo.id}`)).status, 200)
        const list = (await call('GET', cbase())).json.contacts
        assert.equal(list.length, 1)
        assert.equal(list[0].is_primary, true)
        const free = await call('GET', `/api/admin/outreach/check-duplicate?type=creator&email=${encodeURIComponent(`bo2@${domain}`)}`)
        assert.equal(free.status, 200)
        assert.equal(free.json.duplicates.length, 0, 'the email is free again')
        const acts = (await call('GET', `/api/admin/outreach/leads/brands/${contactBrand}`)).json.activity.map((a) => a.action)
        assert.ok(['contact_added', 'contact_edited', 'contact_removed'].every((a) => acts.includes(a)), acts.join(','))
      })

      await check('lists: manual adds land on "manual"; admins change the list; filter by list; bad list → 400', async () => {
        const row = (await call('GET', `/api/admin/outreach/leads/brands?q=${contactBrand}`)).json.leads[0]
        assert.equal(row.list, 'manual')
        assert.equal((await call('GET', `/api/admin/outreach/leads/brands?q=${contactBrand}&list=manual`)).json.total, 1)
        const r = await call('PATCH', `/api/admin/outreach/leads/brands/${contactBrand}`, { list: 'yc' })
        assert.equal(r.status, 200, JSON.stringify(r.json))
        assert.equal((await call('GET', `/api/admin/outreach/leads/brands?q=${contactBrand}&list=yc`)).json.total, 1)
        assert.equal((await call('GET', `/api/admin/outreach/leads/brands?q=${contactBrand}&list=sponsor`)).json.total, 0)
        assert.equal((await call('PATCH', `/api/admin/outreach/leads/brands/${contactBrand}`, { list: 'creators_new' })).status, 400)
        const csv = await raw('GET', `/api/admin/outreach/leads/brands/export?q=${contactBrand}`)
        assert.ok(csv.text.split('\n')[0].includes('list'), 'export has a list column')
      })

      await check('Apollo import: preview writes nothing; commit adds contacts to existing brands, creates "apollo" brands, keeps lists', async () => {
        const rows = [
          { _row: 2, company: `${tag} Contacts`, website: `https://${domain}`, team_size: '11-50', first_name: 'Cy', last_name: 'C', title: 'CTO', email: `cy@${domain}` },
          { _row: 3, company: `${tag} Newco`, website: `${tag}-newco.invalid`, first_name: 'Nia', email: `nia@${tag}-newco.invalid` },
          { _row: 4, company: `${tag} Newco`, website: `${tag}-newco.invalid`, first_name: 'Ned', email: `ned@${tag}-newco.invalid` },
          { _row: 5, company: `${tag} Contacts`, website: domain, first_name: 'Again', email: `ann@${domain}` },
          { _row: 6, company: 'Bad', website: 'javascript:alert(1)', first_name: 'B', email: 'b@x.co' },
          { _row: 7, company: 'X', first_name: 'D', email: email2 },
        ]
        const body = (commit) => ({ source: `apollo_${tag}.csv`, rows, commit })
        const p = await call('POST', '/api/admin/outreach/import/apollo', body(false))
        assert.equal(p.status, 200, JSON.stringify(p.json))
        assert.deepEqual(p.json.counts, { contacts_added: 3, existing_brands: 1, new_brands: 1, duplicates: 1, dnc: 1, errors: 1 })
        assert.equal(p.json.report.existing[0].lead_id, contactBrand)
        assert.equal((await call('GET', `/api/admin/outreach/leads/brands?q=${encodeURIComponent(`${tag} Newco`)}`)).json.total, 0, 'preview wrote nothing')
        const c = await call('POST', '/api/admin/outreach/import/apollo', body(true))
        assert.equal(c.status, 200, JSON.stringify(c.json))
        assert.equal(c.json.counts.contacts_added, 3)
        const newco = c.json.report.created[0]
        created.push(['brands', newco.lead_id])
        const nb = (await call('GET', `/api/admin/outreach/leads/brands?q=${newco.lead_id}`)).json.leads[0]
        assert.equal(nb.list, 'apollo')
        assert.equal(nb.contacts.count, 2)
        const existing = (await call('GET', `/api/admin/outreach/leads/brands?q=${contactBrand}`)).json.leads[0]
        assert.equal(existing.list, 'yc', 'Apollo never changes an existing brand\'s list')
        assert.equal(existing.team_size, '11-50', 'empty field filled')
        assert.equal(existing.company, `${tag} Contacts`, 'existing value kept')
        const again = await call('POST', '/api/admin/outreach/import/apollo', body(false))
        assert.equal(again.json.counts.contacts_added, 0)
        assert.equal(again.json.counts.duplicates, 4)
      })

      await check('dashboard: results per list (leads, contacted, replied, reply rate) with a per-person breakdown', async () => {
        const d = await call('GET', '/api/admin/outreach/dashboard')
        assert.equal(d.status, 200)
        assert.ok(Array.isArray(d.json.lists), 'lists present')
        const yc = d.json.lists.find((l) => l.lead_type === 'brand' && l.list === 'yc')
        assert.ok(yc && yc.totals.today.contacted >= 1, 'the yc brand above was contacted today')
        assert.ok(Array.isArray(yc.people) && yc.people.length >= 1)
        assert.ok('reply_rate' in yc.totals.week)
      })
    }

    if (OUTREACH_TOKEN && v2 && contactBrand) {
      await check('members: edit and add contacts, but only admins change a lead\'s list or the mailbox window', async () => {
        const m = (method, p, body) => fetch(`${BASE_URL}${p}`, {
          method, headers: { Cookie: `auth_token=${OUTREACH_TOKEN}`, 'Content-Type': 'application/json' },
          body: body ? JSON.stringify(body) : undefined,
        })
        assert.equal((await m('POST', `/api/admin/outreach/leads/brands/${contactBrand}/contacts`, { first_name: 'Member', email: `member@${domain}` })).status, 201)
        assert.equal((await m('PATCH', `/api/admin/outreach/leads/brands/${contactBrand}`, { list: 'sponsor' })).status, 403)
        assert.equal((await m('PATCH', '/api/admin/outreach/settings', { mailbox_window_hours: 15 })).status, 403)
      })
    }

    if (OUTREACH_TOKEN && dbDirect) {
      const asMember = async (method, urlPath, body) => {
        const res = await fetch(`${BASE_URL}${urlPath}`, {
          method, headers: { Cookie: `auth_token=${OUTREACH_TOKEN}`, 'Content-Type': 'application/json' },
          body: body ? JSON.stringify(body) : undefined,
        })
        const text = await res.text()
        let json = null
        try { json = JSON.parse(text) } catch { /* CSV */ }
        return { status: res.status, json, text }
      }
      await check('members: never see the quality rating, cannot set it or remove entries; can edit the rest', async () => {
        assert.equal((await call('PATCH', `${dbApi}/creators/${dbDirect}`, { quality_rating: 4 })).status, 200)
        const adminRow = await call('GET', `${dbApi}/creators?q=${encodeURIComponent(dbDirect)}`)
        assert.equal(adminRow.json.rows[0].quality_rating, 4)
        const list = await asMember('GET', `${dbApi}/creators?q=${encodeURIComponent(dbDirect)}`)
        assert.equal(list.status, 200, list.text)
        assert.ok(!('quality_rating' in list.json.rows[0]), 'no rating in the member list')
        const detail = await asMember('GET', `${dbApi}/creators/${dbDirect}`)
        assert.ok(!('quality_rating' in detail.json.entry), 'no rating in the member detail')
        assert.ok(!detail.json.activity.some((a) => a.changes && 'quality_rating' in a.changes), 'no rating in member history')
        assert.equal((await asMember('PATCH', `${dbApi}/creators/${dbDirect}`, { quality_rating: 1 })).status, 403)
        assert.equal((await asMember('PATCH', `${dbApi}/creators/${dbDirect}`, { notes: 'member note' })).status, 200)
        assert.equal((await asMember('POST', `${dbApi}/creators/${dbDirect}/rates`, { platform: 'youtube', format: 'short', price: 50 })).status, 201)
        assert.equal((await asMember('DELETE', `${dbApi}/creators/${dbDirect}`)).status, 403)
        const csv = await asMember('GET', `${dbApi}/creators/export?q=${encodeURIComponent(dbDirect)}`)
        assert.ok(!csv.text.split('\n')[0].includes('quality_rating'), 'no rating column for members')
      })
    } else {
      skip('database member checks (rating hidden, no remove)', 'OUTREACH_TOKEN not set in .env.test.local')
    }

    await check('database: a deleted lead\'s entry is hidden and read-only (404 / 409, never 500)', async () => {
      assert.equal((await call('DELETE', `/api/admin/outreach/leads/creators/${dbC}`)).status, 200)
      assert.equal((await call('GET', `${dbApi}/creators/${dbC}`)).status, 404)
      assert.equal((await call('GET', `${dbApi}/creators?tag=${encodeURIComponent(tag)}`)).json.total, 0)
      const add = await call('POST', `${dbApi}/creators`, { lead_id: dbC })
      assert.equal(add.status, 409, JSON.stringify(add.json))
      const rate = await call('POST', `${dbApi}/creators/${dbC}/rates`, { platform: 'youtube', format: 'short', price: 5 })
      assert.equal(rate.status, 409, JSON.stringify(rate.json))
    })

    if (OUTREACH_TOKEN) {
      const member = (method, urlPath, body) => fetch(`${BASE_URL}${urlPath}`, {
        method, headers: { Cookie: `auth_token=${OUTREACH_TOKEN}`, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      })
      await check('outreach members get 403 on delete, restore, the Deleted filter and ids=1', async () => {
        for (const [method, p, body] of [
          ['POST', '/api/admin/outreach/leads/creators/delete', { lead_ids: [leadA] }],
          ['POST', '/api/admin/outreach/leads/creators/restore', { lead_ids: [leadD] }],
          ['DELETE', `/api/admin/outreach/leads/creators/${leadA}`],
          ['GET', '/api/admin/outreach/leads/creators?deleted=1'],
          ['GET', '/api/admin/outreach/leads/creators?ids=1'],
        ]) {
          assert.equal((await member(method, p, body)).status, 403, `${method} ${p}`)
        }
      })
    } else {
      skip('outreach member 403 on delete/restore', 'OUTREACH_TOKEN not set in .env.test.local')
    }
  } finally {
    for (const [segment, id] of created) {
      await call('DELETE', `/api/admin/outreach/leads/${segment}/${id}`)
    }
    if (dncId) {await call('DELETE', `/api/admin/outreach/dnc/${dncId}`, { reason: 'outreach-check cleanup' })}
    if (mailboxId) {await call('PATCH', `/api/admin/outreach/mailboxes/${mailboxId}`, { is_active: false })}
    console.log(`\nCleanup: soft-deleted ${created.length} test leads${dncId ? ' and the DNC entry' : ''}${mailboxId ? `, paused mailbox ${tag}@outreach-check.invalid` : ''}.`)
  }
}

await pureChecks()
await databaseChecks()
await contactsListsChecks()
const args = process.argv.slice(2)
if (args.includes('--http')) {
  if (!args.includes('--confirm=outreach-check')) {
    console.log('\n--http writes data. Re-run with --http --confirm=outreach-check to go ahead.')
    process.exit(1)
  }
  await httpChecks()
}

console.log(`\n${passCount} passed, ${failCount} failed, ${skipCount} skipped`)
process.exit(failCount > 0 ? 1 : 0)
