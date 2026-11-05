'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { FileUp, Loader2 } from 'lucide-react'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { PLATFORMS } from '@/utils/constants'
import {
  BRAND_IMPORT_FIELDS, CREATOR_IMPORT_FIELDS, defaultMapping, detectFileType, EXTRA, headerKey, IGNORED_COLUMNS,
  IMPORT_FILE_TYPES, IMPORT_MAX_ROWS, isApolloHeaders, isSpreadsheetFile, mapRow, parseCsv, suggestOwner,
  type ImportFileType, type ImportLead, type ImportMapping,
} from '@/lib/outreach/rules'
import type { DuplicateMatch } from '@/lib/outreach/types'
import { readJson, useOutreach } from '@/components/admin/outreach/OutreachContext'
import { buttonClass, Card, ghostButtonClass, selectClass } from '@/components/admin/outreach/ui'
import { ApolloImport } from '@/components/admin/outreach/ApolloImport'

type RowStatus = 'new' | 'duplicate' | 'dnc' | 'error'

interface PreviewRow {
  row: number
  status: RowStatus
  reasons: string[]
  match?: DuplicateMatch
}

interface CommitResult {
  inserted: number
  skipped: { row: number | null; reason: string; lead_id?: string | null }[]
}

const OWNER_PREF_KEY = 'outreach_owner_rule'
const VIEW_PAGE = 100

function readOwnerPref(): { faizan: string; va: string } {
  try {
    const v = JSON.parse(localStorage.getItem(OWNER_PREF_KEY) ?? 'null')
    return { faizan: v?.faizan ?? '', va: v?.va ?? '' }
  } catch {
    return { faizan: '', va: '' }
  }
}

const STATUS_TEXT: Record<RowStatus, string> = { new: 'New', duplicate: 'Duplicate', dnc: 'Do not contact', error: 'Error' }
const STATUS_CLASS: Record<RowStatus, string> = {
  new: 'text-emerald-300', duplicate: 'text-amber-300', dnc: 'text-red-300', error: 'text-red-400',
}

export default function OutreachImportPage() {
  useDocumentTitle('Outreach import')
  const { team, toast, bump } = useOutreach()

  const [fileName, setFileName] = useState('')
  const [fileType, setFileType] = useState<ImportFileType | ''>('')
  const [headers, setHeaders] = useState<string[]>([])
  const [dataRows, setDataRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<ImportMapping>({})
  const [defaultPlatform, setDefaultPlatform] = useState('youtube')
  const [ownerPref, setOwnerPref] = useState({ faizan: '', va: '' })
  useEffect(() => { setOwnerPref(readOwnerPref()) }, [])

  const [mapped, setMapped] = useState<ImportLead[]>([])
  const [preview, setPreview] = useState<PreviewRow[] | null>(null)
  const [owners, setOwners] = useState<Record<number, string>>({})
  const [view, setView] = useState<RowStatus | 'all'>('all')
  const [viewOffset, setViewOffset] = useState(0)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<CommitResult | null>(null)
  const [fileError, setFileError] = useState('')
  // Apollo contacts exports are recognised by their headers, whatever the file name.
  const [apollo, setApollo] = useState<{ headers: string[]; rows: string[][] } | null>(null)

  const leadType = fileType ? IMPORT_FILE_TYPES[fileType].leadType : null
  const fields: readonly string[] = leadType === 'brand' ? BRAND_IMPORT_FIELDS : CREATOR_IMPORT_FIELDS

  const mappingSummary = useMemo(() => {
    const s = { field: 0, extra: 0, ignored: 0 }
    for (const h of headers) {
      const t = mapping[h] ?? ''
      if (t === '') {s.ignored += 1} else if (t === EXTRA) {s.extra += 1} else {s.field += 1}
    }
    return s
  }, [headers, mapping])

  const resetPreview = () => {
    setPreview(null)
    setResult(null)
    setOwners({})
  }

  const onFile = async (file: File) => {
    resetPreview()
    setFileError('')
    setApollo(null)
    if (isSpreadsheetFile(file.name)) {
      setFileName('')
      setHeaders([])
      setDataRows([])
      setFileError(`${file.name} is a spreadsheet file. Open it in Excel or Google Sheets, choose File > Save as (or Download) > CSV, then upload the .csv file.`)
      return
    }
    const text = await file.text()
    const rows = parseCsv(text)
    if (rows.length < 2) {
      toast('error', 'The file has no data rows.')
      return
    }
    const hdrs = rows[0].map((h) => h.trim())
    if (isApolloHeaders(hdrs)) {
      setFileName(file.name)
      setFileType('')
      setHeaders([])
      setDataRows(rows.slice(1))
      setApollo({ headers: hdrs, rows: rows.slice(1) })
      if (rows.length - 1 > IMPORT_MAX_ROWS) {toast('error', `This file has ${(rows.length - 1).toLocaleString()} rows. Import up to ${IMPORT_MAX_ROWS.toLocaleString()} at a time.`)}
      return
    }
    const detected = detectFileType(file.name)
    setFileName(file.name)
    setFileType(detected ?? '')
    setHeaders(hdrs)
    setDataRows(rows.slice(1))
    setMapping(detected ? defaultMapping(IMPORT_FILE_TYPES[detected].leadType, hdrs) : {})
    if (!detected) {toast('warn', 'File name not recognised. Pick the file type below.')}
    if (rows.length - 1 > IMPORT_MAX_ROWS) {toast('error', `This file has ${(rows.length - 1).toLocaleString()} rows. Import up to ${IMPORT_MAX_ROWS.toLocaleString()} at a time.`)}
  }

  const onTypeChange = (t: ImportFileType | '') => {
    resetPreview()
    setFileType(t)
    setMapping(t ? defaultMapping(IMPORT_FILE_TYPES[t].leadType, headers) : {})
  }

  const setOwnerRule = (key: 'faizan' | 'va', userId: string) => {
    const next = { ...ownerPref, [key]: userId }
    setOwnerPref(next)
    try { localStorage.setItem(OWNER_PREF_KEY, JSON.stringify(next)) } catch { /* storage blocked */ }
    resetPreview()
  }

  const runPreview = async () => {
    if (!leadType) {return}
    if (dataRows.length > IMPORT_MAX_ROWS) {
      toast('error', `Import up to ${IMPORT_MAX_ROWS.toLocaleString()} rows at a time.`)
      return
    }
    setBusy(true)
    setResult(null)
    const mappedRows = dataRows.map((cells, i) => mapRow(leadType, headers, cells, mapping, i + 2, { platform: defaultPlatform, fileType: fileType || null }))
    const leads = mappedRows.map((m) => m.lead)
    const res = await fetch('/api/admin/outreach/import/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_type: leadType, rows: leads }),
    })
    const data = await readJson<{ rows: PreviewRow[] }>(res)
    setBusy(false)
    if (!res.ok) {
      toast('error', data.error ?? 'Preview failed')
      return
    }
    // Errors found while mapping in the browser (bad numbers, missing keys)
    // are added to whatever the server found.
    const byRow = new Map(mappedRows.map((m) => [m.lead._row, m.errors]))
    const rows = data.rows.map((r) => {
      const local = byRow.get(r.row) ?? []
      return local.length > 0 ? { ...r, status: 'error' as const, reasons: [...local, ...r.reasons.filter((x) => !local.includes(x))] } : r
    })
    const ids = { faizan: ownerPref.faizan || null, va: ownerPref.va || null }
    const initialOwners: Record<number, string> = {}
    for (const l of leads) {initialOwners[l._row] = suggestOwner(leadType, l as { does_sponsorships?: boolean | null; subscribers?: number | null }, ids) ?? ''}
    setMapped(leads)
    setOwners(initialOwners)
    setPreview(rows)
    setView('all')
    setViewOffset(0)
  }

  const counts = useMemo(() => {
    const c = { new: 0, duplicate: 0, dnc: 0, error: 0 }
    for (const r of preview ?? []) {c[r.status] += 1}
    return c
  }, [preview])

  const runCommit = async () => {
    if (!leadType || !preview) {return}
    setBusy(true)
    const newRows = new Set(preview.filter((r) => r.status === 'new').map((r) => r.row))
    const rows = mapped.filter((l) => newRows.has(l._row)).map((l) => ({ ...l, owner_user_id: owners[l._row] || null }))
    const res = await fetch('/api/admin/outreach/import/commit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_type: leadType, source: fileName || 'csv import', rows }),
    })
    const data = await readJson<CommitResult>(res)
    setBusy(false)
    if (!res.ok) {
      toast('error', data.error ?? 'Import failed. Nothing was imported.')
      return
    }
    // Rows skipped at preview (duplicates, DNC, errors) are reported too.
    const previewSkips = preview.filter((r) => r.status !== 'new').map((r) => ({ row: r.row, reason: r.reasons.join('; '), lead_id: r.match?.lead_id ?? null }))
    setResult({ inserted: data.inserted, skipped: [...previewSkips, ...data.skipped].sort((a, b) => (a.row ?? 0) - (b.row ?? 0)) })
    toast('success', `${data.inserted} leads imported`)
    bump()
  }

  const visible = (preview ?? []).filter((r) => view === 'all' || r.status === view)
  const leadByRow = useMemo(() => new Map(mapped.map((l) => [l._row, l])), [mapped])

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-white">Import leads</h1>

      <Card title="1. Pick a CSV">
        <div className="flex flex-wrap items-center gap-3">
          <label className={`${buttonClass} cursor-pointer`}>
            <FileUp className="h-4 w-4" /> Choose file
            <input type="file" accept=".csv,text/csv,.xlsx,.xls" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) {void onFile(f)}; e.target.value = '' }} />
          </label>
          {fileName && <span className="text-sm text-slate-300">{fileName} · {dataRows.length.toLocaleString()} rows</span>}
          {headers.length > 0 && (
            <select value={fileType} onChange={(e) => onTypeChange(e.target.value as ImportFileType | '')} className={selectClass}>
              <option value="">File type…</option>
              {(Object.keys(IMPORT_FILE_TYPES) as ImportFileType[]).map((t) => <option key={t} value={t}>{IMPORT_FILE_TYPES[t].label}</option>)}
            </select>
          )}
        </div>
        {fileError && (
          <div className="mt-3 rounded-lg border border-amber-800 bg-amber-950/50 px-3 py-2 text-sm text-amber-200">{fileError}</div>
        )}
        <p className="mt-2 text-xs text-slate-500">
          File names set the type: creators_new_*.csv, creators_review_new_*.csv, sponsor_brands_new_*.csv, yc_brands_new_*.csv.
          Apollo contact exports are recognised by their columns.
          Up to {IMPORT_MAX_ROWS.toLocaleString()} rows per import. CSV only: save .xlsx files as CSV first.
        </p>
      </Card>

      {apollo && (
        <ApolloImport key={fileName} fileName={fileName} headers={apollo.headers} rows={apollo.rows} defaultOwner={ownerPref.faizan} />
      )}

      {leadType && headers.length > 0 && (
        <Card title="2. Check every column">
          <p className="mb-3 text-sm text-slate-400">
            {headers.length} columns: {mappingSummary.field} to lead fields, {mappingSummary.extra} kept as extra fields, {mappingSummary.ignored} ignored.
            Change any of them below.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-800 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-2 py-2">Column in file</th>
                  <th className="px-2 py-2">Goes to</th>
                  <th className="px-2 py-2">Row 1</th>
                  <th className="px-2 py-2">Row 2</th>
                  <th className="px-2 py-2">Row 3</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {headers.map((h, idx) => {
                  const target = mapping[h] ?? ''
                  const ignoredWhy = target === '' ? IGNORED_COLUMNS[headerKey(h)] : undefined
                  return (
                    <tr key={`${h}-${idx}`} className={target === '' ? 'opacity-70' : ''}>
                      <td className="whitespace-nowrap px-2 py-1.5 font-mono text-xs text-slate-200" title={h}>{h || `(column ${idx + 1})`}</td>
                      <td className="px-2 py-1.5">
                        <select value={target} onChange={(e) => { setMapping({ ...mapping, [h]: e.target.value }); resetPreview() }}
                          className={`${selectClass} w-52 ${target === '' ? 'text-slate-400' : target === EXTRA ? 'text-sky-300' : ''}`}>
                          <optgroup label="Lead field">
                            {fields.map((f) => <option key={f} value={f}>{f === 'notes' ? 'notes (append)' : f}</option>)}
                          </optgroup>
                          <option value={EXTRA}>Extra field: {headerKey(h) || h}</option>
                          <option value="">Ignore</option>
                        </select>
                        {ignoredWhy && <p className="mt-0.5 text-[11px] text-slate-500">Ignored: {ignoredWhy}</p>}
                      </td>
                      {[0, 1, 2].map((r) => (
                        <td key={r} className="max-w-[180px] truncate px-2 py-1.5 text-xs text-slate-400" title={dataRows[r]?.[idx] ?? ''}>
                          {dataRows[r]?.[idx] || <span className="text-slate-600">–</span>}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {leadType === 'brand' && (
            <p className="mt-2 text-xs text-slate-500">
              Empty country is filled from the first entry in locations. Empty why them is built from batch, is_hiring and sponsor columns, like &quot;YC W24, hiring, sponsors creators&quot;.
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-800 pt-4 text-sm">
            {leadType === 'creator' && (
              <label className="flex items-center gap-2 text-slate-300">
                Platform when empty
                <select value={defaultPlatform} onChange={(e) => { setDefaultPlatform(e.target.value); resetPreview() }} className={selectClass}>
                  <option value="">None</option>
                  {PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
            )}
            <label className="flex items-center gap-2 text-slate-300">
              Faizan
              <select value={ownerPref.faizan} onChange={(e) => setOwnerRule('faizan', e.target.value)} className={selectClass}>
                <option value="">Pick</option>
                {team.map((t) => <option key={t.user_id} value={t.user_id}>{t.display_name}</option>)}
              </select>
            </label>
            {leadType === 'creator' && (
              <label className="flex items-center gap-2 text-slate-300">
                VA
                <select value={ownerPref.va} onChange={(e) => setOwnerRule('va', e.target.value)} className={selectClass}>
                  <option value="">Pick</option>
                  {team.map((t) => <option key={t.user_id} value={t.user_id}>{t.display_name}</option>)}
                </select>
              </label>
            )}
            <button onClick={runPreview} disabled={busy} className={buttonClass}>
              {busy && !preview ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Preview
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Owner rule: {leadType === 'creator' ? 'creators who do sponsorships or have 100K+ subscribers go to Faizan, other creators go to the VA.' : 'brands go to Faizan.'} Change any row in the preview.
          </p>
        </Card>
      )}

      {preview && leadType && (
        <Card
          title="3. Preview"
          actions={
            <button onClick={runCommit} disabled={busy || counts.new === 0 || !!result} className={buttonClass}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Import {counts.new.toLocaleString()} new
            </button>
          }
        >
          <div className="mb-3 flex flex-wrap gap-2 text-sm">
            {(['all', 'new', 'duplicate', 'dnc', 'error'] as const).map((s) => (
              <button key={s} onClick={() => { setView(s); setViewOffset(0) }}
                className={`rounded-lg border px-3 py-1.5 ${view === s ? 'border-violet-500 bg-violet-600/20 text-white' : 'border-slate-700 text-slate-400 hover:text-white'}`}>
                {s === 'all' ? `All ${preview.length.toLocaleString()}` : `${STATUS_TEXT[s]} ${counts[s].toLocaleString()}`}
              </button>
            ))}
          </div>
          <p className="mb-3 text-xs text-slate-500">Duplicates, do-not-contact rows and errors are skipped. Every new row goes in as one import; nothing is saved if the import fails.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-800 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-2 py-2">Row</th>
                  <th className="px-2 py-2">Result</th>
                  <th className="px-2 py-2">{leadType === 'creator' ? 'Name' : 'Company'}</th>
                  <th className="px-2 py-2">{leadType === 'creator' ? 'Profile URL' : 'Domain'}</th>
                  <th className="px-2 py-2">Email</th>
                  {leadType === 'brand' && <th className="px-2 py-2">Country</th>}
                  {leadType === 'brand' && <th className="px-2 py-2">Why them</th>}
                  <th className="px-2 py-2">Extra</th>
                  <th className="px-2 py-2">Owner</th>
                  <th className="px-2 py-2">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {visible.slice(viewOffset, viewOffset + VIEW_PAGE).map((r) => {
                  const lead = leadByRow.get(r.row)
                  return (
                    <tr key={r.row}>
                      <td className="px-2 py-1.5 font-mono text-xs text-slate-500">{r.row}</td>
                      <td className={`whitespace-nowrap px-2 py-1.5 text-xs font-medium ${STATUS_CLASS[r.status]}`}>{STATUS_TEXT[r.status]}</td>
                      <td className="max-w-[180px] truncate px-2 py-1.5 text-slate-200">{String(lead?.[leadType === 'creator' ? 'name' : 'company'] ?? '')}</td>
                      <td className="max-w-[220px] truncate px-2 py-1.5 text-slate-400">{String(lead?.[leadType === 'creator' ? 'profile_url' : 'domain'] ?? lead?.website ?? '')}</td>
                      <td className="max-w-[180px] truncate px-2 py-1.5 text-slate-400">{String(lead?.email ?? '')}</td>
                      {leadType === 'brand' && <td className="max-w-[120px] truncate px-2 py-1.5 text-slate-400">{String(lead?.country ?? '')}</td>}
                      {leadType === 'brand' && <td className="max-w-[200px] truncate px-2 py-1.5 text-slate-400" title={String(lead?.why_them ?? '')}>{String(lead?.why_them ?? '')}</td>}
                      <td className="max-w-[220px] truncate px-2 py-1.5 text-xs text-sky-300/80"
                        title={Object.entries(lead?.extra ?? {}).map(([k, v]) => `${k}: ${v}`).join('\n')}>
                        {Object.keys(lead?.extra ?? {}).join(', ')}
                      </td>
                      <td className="px-2 py-1.5">
                        {r.status === 'new' ? (
                          <select value={owners[r.row] ?? ''} onChange={(e) => setOwners({ ...owners, [r.row]: e.target.value })} className="rounded-md border border-slate-700 bg-slate-800 px-1.5 py-1 text-xs text-slate-200">
                            <option value="">Unassigned</option>
                            {team.map((t) => <option key={t.user_id} value={t.user_id}>{t.display_name}</option>)}
                          </select>
                        ) : null}
                      </td>
                      <td className="px-2 py-1.5 text-xs text-slate-400">
                        {r.match?.contact_removed ? (
                          <>Previously removed contact of <Link className="text-violet-300 underline" href={`/admin/outreach/brands?q=${encodeURIComponent(r.match.lead_id)}`}>{r.match.lead_id}</Link></>
                        ) : r.match?.deleted ? (
                          <>Previously deleted: <Link className="text-violet-300 underline" href={`/admin/outreach/${r.match.lead_type}s?q=${encodeURIComponent(r.match.lead_id)}&deleted=1`}>{r.match.lead_id}</Link></>
                        ) : r.match ? (
                          <>Already exists: <Link className="text-violet-300 underline" href={`/admin/outreach/${r.match.lead_type}s?q=${encodeURIComponent(r.match.lead_id)}`}>{r.match.lead_id}</Link>
                            {r.match.owner_name ? `, owned by ${r.match.owner_name}` : ''}{r.match.status ? `, status ${r.match.status}` : ''}</>
                        ) : r.reasons.join('; ')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {visible.length > VIEW_PAGE && (
            <div className="mt-3 flex items-center justify-end gap-2 text-sm text-slate-400">
              <span>{viewOffset + 1}–{Math.min(viewOffset + VIEW_PAGE, visible.length)} of {visible.length.toLocaleString()}</span>
              <button disabled={viewOffset === 0} onClick={() => setViewOffset(viewOffset - VIEW_PAGE)} className={ghostButtonClass}>Prev</button>
              <button disabled={viewOffset + VIEW_PAGE >= visible.length} onClick={() => setViewOffset(viewOffset + VIEW_PAGE)} className={ghostButtonClass}>Next</button>
            </div>
          )}
        </Card>
      )}

      {result && (
        <Card title="Result">
          <p className="text-sm text-white">{result.inserted.toLocaleString()} leads imported. {result.skipped.length.toLocaleString()} rows skipped.</p>
          {result.skipped.length > 0 && (
            <ul className="mt-3 max-h-80 space-y-1 overflow-y-auto text-xs text-slate-400">
              {result.skipped.map((s, i) => (
                <li key={`${s.row}-${i}`}><span className="font-mono text-slate-500">Row {s.row ?? '?'}</span>: {s.reason}</li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  )
}
