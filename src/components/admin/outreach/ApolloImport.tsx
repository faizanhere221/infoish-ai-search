'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import {
  APOLLO_FIELD_LABELS, APOLLO_FIELDS, apolloMapping, IMPORT_MAX_ROWS, mapApolloRow, type ApolloField,
} from '@/lib/outreach/rules'
import { readJson, useOutreach } from '@/components/admin/outreach/OutreachContext'
import { buttonClass, Card, selectClass } from '@/components/admin/outreach/ui'

interface Report {
  existing: { lead_id: string; company: string | null; contacts: number }[]
  created: { lead_id: string; company: string | null; contacts: number }[]
  duplicates: { row: number; email: string | null; lead_id?: string | null; same_as_row?: number }[]
  dnc: { row: number; key: string }[]
  errors: { row: number; reason: string }[]
}

interface Counts {
  contacts_added: number
  existing_brands: number
  new_brands: number
  duplicates: number
  dnc: number
  errors: number
}

// Apollo contacts export (Company Name, Website, Employes size, First Name,
// Last Name, Tittle, Email, Linkedin). Each row becomes a contact on the
// brand it matches (domain, then website, then exact company name), filling
// only empty brand fields; unknown companies become new brands, list Apollo.
export function ApolloImport({ fileName, headers, rows, defaultOwner }: {
  fileName: string
  headers: string[]
  rows: string[][]
  defaultOwner: string
}) {
  const { team, toast, bump } = useOutreach()
  const [mapping, setMapping] = useState<Record<string, ApolloField | ''>>(() => apolloMapping(headers))
  const [owner, setOwner] = useState(defaultOwner)
  const [preview, setPreview] = useState<{ report: Report; counts: Counts } | null>(null)
  const [done, setDone] = useState<{ report: Report; counts: Counts } | null>(null)
  const [busy, setBusy] = useState(false)

  const mapped = useMemo(() => rows.map((cells, i) => mapApolloRow(headers, cells, mapping, i + 2)), [rows, headers, mapping])
  const localErrors = mapped.filter((m) => m.errors.length > 0)

  const run = async (commit: boolean) => {
    if (rows.length > IMPORT_MAX_ROWS) {
      toast('error', `Import up to ${IMPORT_MAX_ROWS.toLocaleString()} rows at a time.`)
      return
    }
    setBusy(true)
    const res = await fetch('/api/admin/outreach/import/apollo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: fileName || 'apollo import',
        rows: mapped.filter((m) => m.errors.length === 0).map((m) => m.row),
        owner_user_id: owner || null,
        commit,
      }),
    })
    const data = await readJson<{ message: string; report: Report; counts: Counts }>(res)
    setBusy(false)
    if (!res.ok) {
      toast('error', data.error ?? (commit ? 'Import failed. Nothing was imported.' : 'Preview failed'))
      return
    }
    // Rows the browser already rejected are part of the report too.
    const report = { ...data.report, errors: [...localErrors.map((m) => ({ row: m.row._row, reason: m.errors.join('; ') })), ...data.report.errors].sort((a, b) => a.row - b.row) }
    const counts = { ...data.counts, errors: report.errors.length }
    if (commit) {
      setDone({ report, counts })
      setPreview(null)
      toast('success', data.message)
      bump()
    } else {
      setPreview({ report, counts })
    }
  }

  const shown = done ?? preview

  return (
    <>
      <Card title="2. Apollo contacts: check the columns">
        <p className="mb-3 text-sm text-slate-400">
          Detected an Apollo export. Each row adds a contact to the brand with the same domain, website or company name, and fills only
          empty brand fields. Companies not found become new brands on the Apollo list.
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {headers.map((h) => (
            <label key={h} className="block text-xs">
              <span className="mb-0.5 block font-mono text-slate-300">{h || '(empty header)'}</span>
              <select value={mapping[h] ?? ''} className={`${selectClass} w-full`}
                onChange={(e) => { setMapping({ ...mapping, [h]: e.target.value as ApolloField | '' }); setPreview(null) }}>
                <option value="">Ignore</option>
                {APOLLO_FIELDS.map((f) => <option key={f} value={f}>{APOLLO_FIELD_LABELS[f]}</option>)}
              </select>
            </label>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-300">
          <span>Owner of new brands</span>
          <select value={owner} onChange={(e) => setOwner(e.target.value)} className={selectClass}>
            <option value="">Me</option>
            {team.map((t) => <option key={t.user_id} value={t.user_id}>{t.display_name}</option>)}
          </select>
          <button disabled={busy} onClick={() => void run(false)} className={buttonClass}>
            {busy && !preview ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Preview {rows.length.toLocaleString()} rows
          </button>
        </div>
      </Card>

      {shown && (
        <Card title={done ? '4. Imported' : '3. Preview'}>
          <div className="mb-4 grid gap-3 text-sm sm:grid-cols-3 lg:grid-cols-6">
            {[
              ['Contacts added', shown.counts.contacts_added, 'text-emerald-300'],
              ['To existing brands', shown.counts.existing_brands, 'text-slate-200'],
              ['New brands', shown.counts.new_brands, 'text-slate-200'],
              ['Duplicate contacts', shown.counts.duplicates, 'text-amber-300'],
              ['Do not contact', shown.counts.dnc, 'text-red-300'],
              ['Errors', shown.counts.errors, 'text-red-400'],
            ].map(([label, n, cls]) => (
              <div key={label as string} className="rounded-lg border border-slate-800 px-3 py-2">
                <div className={`text-xl font-semibold ${cls}`}>{Number(n).toLocaleString()}</div>
                <div className="text-xs text-slate-500">{label}</div>
              </div>
            ))}
          </div>

          {shown.report.existing.length > 0 && (
            <details className="mb-3" open={shown.report.existing.length <= 20}>
              <summary className="cursor-pointer text-sm font-medium text-slate-200">Contacts added to existing brands ({shown.report.existing.length})</summary>
              <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
                {shown.report.existing.map((b) => (
                  <li key={b.lead_id} className="text-slate-300">
                    <Link href={`/admin/outreach/brands?q=${encodeURIComponent(b.lead_id)}`} className="font-mono text-xs text-violet-300 hover:underline">{b.lead_id}</Link>{' '}
                    {b.company}: {b.contacts} contact{b.contacts === 1 ? '' : 's'}
                  </li>
                ))}
              </ul>
            </details>
          )}
          {shown.report.created.length > 0 && (
            <details className="mb-3" open={shown.report.created.length <= 20}>
              <summary className="cursor-pointer text-sm font-medium text-slate-200">New brands ({shown.report.created.length})</summary>
              <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
                {shown.report.created.map((b) => (
                  <li key={b.lead_id} className="text-slate-300">
                    {done ? <span className="font-mono text-xs text-violet-300">{b.lead_id}</span> : null} {b.company}: {b.contacts} contact{b.contacts === 1 ? '' : 's'}
                  </li>
                ))}
              </ul>
            </details>
          )}
          {(shown.report.duplicates.length > 0 || shown.report.dnc.length > 0 || shown.report.errors.length > 0) && (
            <details>
              <summary className="cursor-pointer text-sm font-medium text-slate-200">Skipped rows ({shown.report.duplicates.length + shown.report.dnc.length + shown.report.errors.length})</summary>
              <ul className="mt-2 max-h-72 space-y-0.5 overflow-y-auto text-xs text-slate-400">
                {[
                  ...shown.report.duplicates.map((d) => ({ row: d.row, text: `Duplicate contact ${d.email ?? ''}${d.lead_id ? `, already on ${d.lead_id}` : d.same_as_row ? `, same as row ${d.same_as_row}` : ''}` })),
                  ...shown.report.dnc.map((d) => ({ row: d.row, text: `Do not contact (${d.key})` })),
                  ...shown.report.errors.map((e) => ({ row: e.row, text: e.reason })),
                ].sort((a, b) => a.row - b.row).map((x, i) => <li key={`${x.row}-${i}`}>Row {x.row}: {x.text}</li>)}
              </ul>
            </details>
          )}

          {!done && (
            <div className="mt-4">
              <button disabled={busy || shown.counts.contacts_added === 0} onClick={() => void run(true)} className={buttonClass}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Import {shown.counts.contacts_added.toLocaleString()} contacts
              </button>
            </div>
          )}
        </Card>
      )}
    </>
  )
}
