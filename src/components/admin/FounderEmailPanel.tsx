'use client'

import { useCallback, useEffect, useState } from 'react'
import { Mail, Send, UserCheck } from 'lucide-react'
import { ReasonDialog } from '@/components/admin/ReasonDialog'

interface FounderEmailState {
  kind: string | null
  contacted_at: string | null
  row: {
    status: string
    source: string
    attempts: number
    last_error: string | null
    queued_at: string
    sent_at: string | null
  } | null
}

const KIND_LABELS: Record<string, string> = {
  creator_welcome: 'Creator welcome',
  brand_welcome: 'Brand welcome',
}

const STATUS_STYLES: Record<string, string> = {
  sent: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  sending: 'bg-amber-100 text-amber-700',
  failed: 'bg-red-100 text-red-700',
  skipped: 'bg-gray-100 text-gray-600',
}

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// Founder email status for one account, shown in the admin user, creator,
// and brand drawers: sent or not and when, the "contacted" flag that
// excludes the account, and a test send to the admin's own inbox.
export function FounderEmailPanel({ userId }: { userId: string }) {
  const [state, setState] = useState<FounderEmailState | null>(null)
  const [missingTable, setMissingTable] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [confirmContacted, setConfirmContacted] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoadError(false)
    try {
      const res = await fetch(`/api/admin/users/${userId}/founder-email`)
      if (!res.ok) {throw new Error()}
      const data = await res.json()
      setState(data.founderEmail)
      setMissingTable(!!data.missing_table)
    } catch {
      setLoadError(true)
    }
  }, [userId])

  useEffect(() => { load() }, [load])

  const toggleContacted = async (reason: string) => {
    setError('')
    setNotice('')
    try {
      const res = await fetch(`/api/admin/users/${userId}/founder-email`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacted: !state?.contacted_at, reason }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {throw new Error(data?.error || 'Failed to update')}
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setConfirmContacted(false)
    }
  }

  const sendTest = async () => {
    if (!state?.kind) {return}
    setError('')
    setNotice('')
    setSendingTest(true)
    try {
      const res = await fetch('/api/admin/founder-emails/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: state.kind, user_id: userId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {throw new Error(data?.error || 'Failed to send test')}
      setNotice(`Test sent to ${data.to}.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send test')
    } finally {
      setSendingTest(false)
    }
  }

  if (loadError) {
    return (
      <section>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Founder email</h3>
        <p className="text-sm text-gray-500">Couldn&apos;t load founder email status.</p>
      </section>
    )
  }
  if (missingTable) {
    return (
      <section>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Founder email</h3>
        <p className="text-sm text-amber-700">Run supabase/founder_emails_migration.sql to turn on founder emails.</p>
      </section>
    )
  }
  if (!state?.kind) {return null}

  const row = state.row
  return (
    <section>
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Founder email</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-gray-500">{KIND_LABELS[state.kind] ?? state.kind}</span>
          {row ? (
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[row.status] ?? 'bg-gray-100 text-gray-600'}`}>
              {row.status === 'pending' ? 'queued' : row.status}
            </span>
          ) : (
            <span className="text-gray-800 font-medium">Not sent</span>
          )}
        </div>
        {row?.sent_at && (
          <div className="flex justify-between">
            <span className="text-gray-500">Sent</span>
            <span className="text-gray-800 font-medium">{fmtDateTime(row.sent_at)}</span>
          </div>
        )}
        {row && !row.sent_at && (
          <div className="flex justify-between">
            <span className="text-gray-500">Queued</span>
            <span className="text-gray-800 font-medium">{fmtDateTime(row.queued_at)}{row.source === 'backfill' ? ' (admin send)' : ''}</span>
          </div>
        )}
        {row?.last_error && row.status !== 'sent' && (
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Note</span>
            <span className="text-gray-800 font-medium text-right">{row.last_error}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-500">Contacted by founder</span>
          <span className="text-gray-800 font-medium">{state.contacted_at ? fmtDateTime(state.contacted_at) : 'No'}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        <button
          onClick={() => setConfirmContacted(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          <UserCheck className="w-3.5 h-3.5" />
          {state.contacted_at ? 'Clear "contacted"' : 'Mark as contacted'}
        </button>
        <button
          onClick={sendTest}
          disabled={sendingTest}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-violet-200 text-xs font-medium text-violet-700 hover:bg-violet-50 disabled:opacity-50"
        >
          {sendingTest ? <Mail className="w-3.5 h-3.5 animate-pulse" /> : <Send className="w-3.5 h-3.5" />}
          {sendingTest ? 'Sending...' : 'Send test to me'}
        </button>
      </div>
      {notice && <p className="text-xs text-emerald-700 mt-2">{notice}</p>}
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

      {confirmContacted && (
        <ReasonDialog
          title={state.contacted_at ? 'Clear "contacted"' : 'Mark as contacted'}
          description={
            state.contacted_at
              ? 'The account becomes eligible for the founder email again, unless it was already sent or skipped.'
              : 'The founder already reached out to this account, so it never gets the automated founder email.'
          }
          confirmLabel={state.contacted_at ? 'Clear' : 'Mark contacted'}
          onConfirm={toggleContacted}
          onClose={() => setConfirmContacted(false)}
        />
      )}
    </section>
  )
}
