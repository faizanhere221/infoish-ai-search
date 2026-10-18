#!/usr/bin/env node
// Read-only drift check: every table/column that schema.sql and the
// supabase/*_migration.sql files CREATE or ALTER should exist live. Shells
// out to the psql CLI (via DATABASE_URL) rather than a Postgres driver —
// CLAUDE.md flags the raw `pg` package as dead code removed in an audit,
// not something to bring back, and this needs no new dependency either way.
//
// This caught real drift twice already this session (notifications/messages
// missing columns their own migration files declared) — run it after
// writing a migration and again after the user applies it.
//
// Parsing is regex + paren-depth-based, not a real SQL parser. It handles
// this codebase's actual style (CREATE TABLE [IF NOT EXISTS] name ( ... ),
// ALTER TABLE name ADD COLUMN [IF NOT EXISTS] col ...) and nothing fancier
// (no CREATE TYPE, no renamed/dropped columns, no type checking — existence
// only). If a migration uses an unusual shape, it may miss things; this is
// a smoke test, not a guarantee.

import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.join(SCRIPT_DIR, '..')
const SUPABASE_DIR = path.join(REPO_ROOT, 'supabase')

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

const fileEnv = loadEnvFile(path.join(REPO_ROOT, '.env.local'))
const DATABASE_URL = process.env.DATABASE_URL || fileEnv.DATABASE_URL

if (!DATABASE_URL) {
  console.error('DATABASE_URL not set (checked process.env and .env.local).')
  process.exit(1)
}

function psqlRows(sql) {
  let output
  try {
    output = execFileSync('psql', [DATABASE_URL, '-t', '-A', '-F', '\t', '-c', sql], { encoding: 'utf-8' })
  } catch (err) {
    console.error('psql query failed:', err.message)
    process.exit(1)
  }
  return output
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.split('\t'))
}

// ── SQL parsing helpers ──────────────────────────────────────────────────────

function stripComments(sql) {
  let result = sql.replace(/\/\*[\s\S]*?\*\//g, '')
  result = result
    .split('\n')
    .map((line) => {
      let inString = false
      for (let i = 0; i < line.length - 1; i++) {
        if (line[i] === "'") {inString = !inString}
        if (!inString && line[i] === '-' && line[i + 1] === '-') {return line.slice(0, i)}
      }
      return line
    })
    .join('\n')
  return result
}

function findMatchingParen(sql, openIndex) {
  let depth = 0
  let inString = false
  for (let i = openIndex; i < sql.length; i++) {
    const c = sql[i]
    if (c === "'") {inString = !inString; continue}
    if (inString) {continue}
    if (c === '(') {depth++}
    else if (c === ')') {
      depth--
      if (depth === 0) {return i}
    }
  }
  return -1
}

function splitTopLevel(body) {
  const parts = []
  let depth = 0
  let start = 0
  let inString = false
  for (let i = 0; i < body.length; i++) {
    const c = body[i]
    if (c === "'") {inString = !inString; continue}
    if (inString) {continue}
    if (c === '(') {depth++}
    else if (c === ')') {depth--}
    else if (c === ',' && depth === 0) {
      parts.push(body.slice(start, i))
      start = i + 1
    }
  }
  parts.push(body.slice(start))
  return parts
}

const TABLE_LEVEL_KEYWORDS = new Set(['constraint', 'primary', 'unique', 'check', 'foreign', 'exclude'])

function extractColumnsFromBody(body) {
  const columns = []
  for (const rawPart of splitTopLevel(body)) {
    const part = rawPart.trim()
    if (!part) {continue}
    const wordMatch = part.match(/^"?(\w+)"?/)
    if (!wordMatch) {continue}
    const word = wordMatch[1].toLowerCase()
    if (TABLE_LEVEL_KEYWORDS.has(word)) {continue}
    columns.push(word)
  }
  return columns
}

// Returns [{ table, columns: [...] }] for every CREATE TABLE in the file.
function extractCreateTables(sql) {
  const results = []
  const regex = /CREATE TABLE\s+(?:IF NOT EXISTS\s+)?"?(\w+)"?\s*\(/gi
  let match
  while ((match = regex.exec(sql))) {
    const table = match[1].toLowerCase()
    const openParenIndex = match.index + match[0].length - 1
    const closeIndex = findMatchingParen(sql, openParenIndex)
    if (closeIndex === -1) {continue}
    const body = sql.slice(openParenIndex + 1, closeIndex)
    results.push({ table, columns: extractColumnsFromBody(body) })
  }
  return results
}

// Returns [{ table, column }] for every `ADD COLUMN` across every ALTER
// TABLE statement in the file (one statement can add several).
function extractAlterAddColumns(sql) {
  const results = []
  const stmtRegex = /ALTER TABLE\s+(?:ONLY\s+)?"?(\w+)"?\s+([\s\S]*?);/gi
  let match
  while ((match = stmtRegex.exec(sql))) {
    const table = match[1].toLowerCase()
    const rest = match[2]
    const addColRegex = /ADD COLUMN\s+(?:IF NOT EXISTS\s+)?"?(\w+)"?/gi
    let colMatch
    while ((colMatch = addColRegex.exec(rest))) {
      results.push({ table, column: colMatch[1].toLowerCase() })
    }
  }
  return results
}

// ── Migration order ──────────────────────────────────────────────────────────
// Must match docs/MIGRATIONS.md — chronological (git-add) order, the order
// these need to run on a fresh database. Keep both in sync when adding a
// migration file.
const MIGRATION_ORDER = [
  'schema.sql',
  'migration.sql',
  'admin_migration.sql',
  'activity_migration.sql',
  'settings_migration.sql',
  'newsletter_contact_migration.sql',
  'deals_services_fix_migration.sql',
  'campaigns_migration.sql',
  'referral_system_migration.sql',
  'creator_profile_views_migration.sql',
  'rate_limiting_migration.sql',
  'phase1_messaging_migration.sql',
  'phase2_tracker_migration.sql',
  'phase3_workflow_migration.sql',
  'phase4_fixes_migration.sql',
  'phase4_contracts_reporting_migration.sql',
  'phase5_payments_tracking_migration.sql',
  'phase5_followups_migration.sql',
  'audit_fixes_migration.sql',
  'workflow_ux_migration.sql',
  'workflow_ux_fixes_migration.sql',
  'phase6a_notifications_migration.sql',
  'phase6b_email_migration.sql',
  'drift_fix_migration.sql',
]

function main() {
  console.log(`Checking live schema against supabase/ migration files...\n`)

  const actualFiles = readdirSync(SUPABASE_DIR).filter((f) => f.endsWith('.sql'))
  const unordered = actualFiles.filter((f) => !MIGRATION_ORDER.includes(f))
  if (unordered.length > 0) {
    console.warn(`WARNING: .sql files exist but aren't in MIGRATION_ORDER (add them, and to docs/MIGRATIONS.md): ${unordered.join(', ')}\n`)
  }
  const goneFiles = MIGRATION_ORDER.filter((f) => !actualFiles.includes(f))
  if (goneFiles.length > 0) {
    console.warn(`WARNING: MIGRATION_ORDER references files that no longer exist: ${goneFiles.join(', ')}\n`)
  }

  const liveColumnsRows = psqlRows(`SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public'`)
  const liveTableColumns = new Map()
  for (const [table, column] of liveColumnsRows) {
    if (!liveTableColumns.has(table)) {liveTableColumns.set(table, new Set())}
    liveTableColumns.get(table).add(column)
  }

  let totalMissing = 0

  for (const file of MIGRATION_ORDER) {
    if (!actualFiles.includes(file)) {continue}
    const sql = stripComments(readFileSync(path.join(SUPABASE_DIR, file), 'utf-8'))

    const missing = []
    const seen = new Set()
    const report = (label) => {
      if (seen.has(label)) {return}
      seen.add(label)
      missing.push(label)
    }

    for (const { table, columns } of extractCreateTables(sql)) {
      if (!liveTableColumns.has(table)) {
        report(`TABLE ${table} — missing entirely`)
        continue
      }
      const liveCols = liveTableColumns.get(table)
      for (const col of columns) {
        if (!liveCols.has(col)) {report(`COLUMN ${table}.${col}`)}
      }
    }

    for (const { table, column } of extractAlterAddColumns(sql)) {
      if (!liveTableColumns.has(table)) {
        report(`TABLE ${table} — missing entirely (needed for an ALTER in this file)`)
        continue
      }
      if (!liveTableColumns.get(table).has(column)) {report(`COLUMN ${table}.${column}`)}
    }

    if (missing.length > 0) {
      console.log(`${file}:`)
      for (const item of missing) {console.log(`  MISSING  ${item}`)}
      console.log('')
      totalMissing += missing.length
    }
  }

  console.log('Storage buckets:')
  const buckets = psqlRows(`SELECT id, public FROM storage.buckets ORDER BY id`)
  if (buckets.length === 0) {
    console.log('  (none)')
  } else {
    for (const [id, isPublic] of buckets) {console.log(`  ${id}: public=${isPublic}`)}
  }

  console.log(`\n${totalMissing === 0 ? 'All tables/columns from every migration file are present live.' : `${totalMissing} missing table/column(s) — see above.`}`)
  process.exit(totalMissing > 0 ? 1 : 0)
}

main()
