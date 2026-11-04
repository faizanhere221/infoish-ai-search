#!/usr/bin/env node
// Outreach checks. Plain Node, no dependencies.
//
//   node scripts/outreach-check.mjs
//     Pure-logic checks only (normalisation, CSV parsing, import mapping,
//     owner rule, follow-up/no-reply dates, mailbox limits, working-day
//     pace, profile links). Imports src/lib/outreach/rules.ts directly; needs Node 22.18+
//     or 23.6+ (built-in TypeScript type stripping). Writes nothing.
//
//   node scripts/outreach-check.mjs --http --confirm=outreach-check
//     Also runs HTTP checks against a running dev server (BASE_URL, default
//     http://localhost:3000): duplicate blocking (incl. across creators and
//     brands), DNC blocking, import preview/commit skipping duplicates and
//     DNC rows, mailbox daily limit, undo, edits, soft delete/restore (hidden
//     from tables and exports, still blocks duplicates, still in
//     already_in_sheet.txt). WRITES DATA: creates leads tagged
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
const rules = await import(path.join(REPO_ROOT, 'src/lib/outreach/rules.ts').replace(/\\/g, '/').replace(/^([A-Za-z]):/, 'file:///$1:'))

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
