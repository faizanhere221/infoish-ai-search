'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import {
  Search, X, RefreshCw, Filter, ChevronLeft, ChevronRight, AlertTriangle, Send, Mail,
} from 'lucide-react'
import { ReasonDialog } from '@/components/admin/ReasonDialog'

interface EmailLogRow {
  id: string
  user_id: string | null
  user_email: string | null
  category: string
  template: string
  status: string
  provider_id: string | null
  error: string | null
  created_at: string
}

interface ReminderPreview {
  eligible: number
  sendableToday: number
  budgetRemaining: number
  incomplete: number
  optedOut: number
  alreadySent: number
}

interface ReminderCandidate {
  user_id: string
  username: string
  display_name: string | null
  percentage: number
  missing_count: number
}

interface DailyUsage {
  day: string
  sent_count: number
}

const STATUS_STYLES: Record<string, string> = {
  sent: 'bg-emerald-100 text-emerald-700',
  skipped: 'bg-amber-100 text-amber-700',
  failed: 'bg-red-100 text-red-700',
  logged_dev: 'bg-gray-100 text-gray-600',
}

const RESENDABLE_TEMPLATES = new Set(['welcome_creator', 'welcome_brand', 'verify_email', 'password_reset'])
const DAILY_LIMIT = 100

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function UsageChart({ data }: { data: DailyUsage[] }) {
  if (data.length === 0) {return <p className="text-sm text-gray-400">No usage data yet.</p>}
  return (
    <div className="flex items-end gap-1.5 h-24">
      {data.map((d) => (
        <div key={d.day} className="flex-1 flex flex-col items-center gap-1 group relative">
          <div
            className={`w-full rounded-t ${d.sent_count >= DAILY_LIMIT ? 'bg-red-400' : d.sent_count >= DAILY_LIMIT * 0.9 ? 'bg-amber-400' : 'bg-violet-400'}`}
            style={{ height: `${Math.max(4, Math.min(100, (d.sent_count / DAILY_LIMIT) * 100))}%` }}
            title={`${d.day}: ${d.sent_count} sent`}
          />
          <span className="text-[10px] text-gray-400">{d.day.slice(5)}</span>
        </div>
      ))}
    </div>
  )
}

function Pagination({ page, total, limit, onPage }: { page: number; total: number; limit: number; onPage: (p: number) => void }) {
  const totalPages = Math.ceil(total / limit)
  if (totalPages <= 1) {return null}
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
      <p className="text-sm text-gray-500">{(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total.toLocaleString()}</p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(page - 1)} disabled={page === 1} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const p = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(page - 2, totalPages - 4)) + i
          return <button key={p} onClick={() => onPage(p)} className={`w-8 h-8 rounded text-sm font-medium ${p === page ? 'bg-violet-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}>{p}</button>
        })}
        <button onClick={() => onPage(page + 1)} disabled={page === totalPages} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
      </div>
    </div>
  )
}

function AdminEmailContent() {
  useDocumentTitle('Email')
  const router = useRouter()
  const searchParams = useSearchParams()

  const [emails, setEmails] = useState<EmailLogRow[]>([])
  const [dailyUsage, setDailyUsage] = useState<DailyUsage[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)
  const [missingTable, setMissingTable] = useState(false)

  const [status, setStatus] = useState(searchParams.get('status') ?? '')
  const [category, setCategory] = useState(searchParams.get('category') ?? '')
  const [userSearch, setUserSearch] = useState(searchParams.get('user') ?? '')
  const [page, setPage] = useState(1)

  const [resendTarget, setResendTarget] = useState<EmailLogRow | null>(null)
  const [actionError, setActionError] = useState('')
  const [reminderPreview, setReminderPreview] = useState<ReminderPreview | null>(null)
  const [testCandidates, setTestCandidates] = useState<ReminderCandidate[] | null>(null)
  const [testCreatorId, setTestCreatorId] = useState('')
  const [sendingTest, setSendingTest] = useState(false)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [actionNotice, setActionNotice] = useState('')

  const fetchEmails = useCallback(async (isRefresh = false) => {
    if (isRefresh) {setRefreshing(true)} else {setLoading(true)}
    setError(false)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (status) {params.set('status', status)}
      if (category) {params.set('category', category)}
      if (userSearch) {params.set('user', userSearch)}

      const res = await fetch(`/api/admin/email?${params}`)
      if (res.status === 401 || res.status === 403) { router.push('/admin/login'); return }
      if (!res.ok) {throw new Error('Failed to load')}
      const data = await res.json()
      setEmails(data.emails ?? [])
      setTotal(data.total ?? 0)
      setDailyUsage(data.dailyUsage ?? [])
      setMissingTable(!!data.missing_table)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [page, status, category, userSearch, router])

  useEffect(() => { fetchEmails() }, [fetchEmails])

  const confirmResend = async (reason: string) => {
    if (!resendTarget) {return}
    setActionError('')
    try {
      const res = await fetch(`/api/admin/email/${resendTarget.id}/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      if (!res.ok) {throw new Error((await res.json().catch(() => ({})))?.error || 'Failed to resend')}
      setResendTarget(null)
      await fetchEmails(true)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to resend')
    }
  }

  // Profile reminders: load the preview first, so the confirm dialog says
  // exactly how many creators get the email before anything is sent.
  const openReminderPreview = async () => {
    setActionError('')
    setActionNotice('')
    setLoadingPreview(true)
    try {
      const res = await fetch('/api/admin/profile-reminders')
      if (!res.ok) {throw new Error((await res.json().catch(() => ({})))?.error || 'Failed to load preview')}
      setReminderPreview((await res.json()).preview)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to load preview')
    } finally {
      setLoadingPreview(false)
    }
  }

  // "Send test to me": the reminder as one eligible creator would get it,
  // delivered to the logged-in admin. The creator is not marked as reminded.
  const openTestPicker = async () => {
    setActionError('')
    setActionNotice('')
    setLoadingPreview(true)
    try {
      const res = await fetch('/api/admin/profile-reminders')
      if (!res.ok) {throw new Error((await res.json().catch(() => ({})))?.error || 'Failed to load creators')}
      const candidates = ((await res.json()).candidates ?? []) as ReminderCandidate[]
      if (candidates.length === 0) {
        setActionNotice('No creators are in the reminder list, so there is nothing to preview.')
        return
      }
      setTestCandidates(candidates)
      setTestCreatorId(candidates[0].user_id)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to load creators')
    } finally {
      setLoadingPreview(false)
    }
  }

  const sendTest = async () => {
    if (!testCreatorId) {return}
    setActionError('')
    setSendingTest(true)
    try {
      const res = await fetch('/api/admin/profile-reminders/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creator_user_id: testCreatorId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {throw new Error(data?.error || 'Failed to send test')}
      setTestCandidates(null)
      setActionNotice(`Test email sent to ${data.to}.`)
      await fetchEmails(true)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to send test')
    } finally {
      setSendingTest(false)
    }
  }

  const confirmReminders = async (reason: string) => {
    setActionError('')
    try {
      const res = await fetch('/api/admin/profile-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {throw new Error(data?.error || 'Failed to send reminders')}
      const r = data.result as { sent: number; failed: number; leftForLater: number }
      setReminderPreview(null)
      setActionNotice(`Profile reminders: ${r.sent} sent, ${r.failed} failed, ${r.leftForLater} left for a later day.`)
      await fetchEmails(true)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to send reminders')
    }
  }

  const todayUsage = dailyUsage[dailyUsage.length - 1]?.sent_count ?? 0
  const clearFilters = () => { setStatus(''); setCategory(''); setUserSearch(''); setPage(1) }
  const hasFilters = Boolean(status || category || userSearch)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Email</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total.toLocaleString()} log entries</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openReminderPreview}
            disabled={loadingPreview}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {loadingPreview ? 'Checking...' : 'Send profile reminders'}
          </button>
          <button
            onClick={openTestPicker}
            disabled={loadingPreview}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-violet-200 bg-white text-violet-700 text-sm font-medium hover:bg-violet-50 disabled:opacity-50"
          >
            <Mail className="w-4 h-4" />
            Send test to me
          </button>
          <button onClick={() => fetchEmails(true)} disabled={refreshing} className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {missingTable && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          email_log table not found. Run <code className="bg-black/5 px-1 rounded">supabase/phase6b_email_migration.sql</code> first.
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800 text-sm">Daily Usage</h2>
          <span className={`text-sm font-semibold ${todayUsage >= DAILY_LIMIT ? 'text-red-600' : 'text-gray-700'}`}>{todayUsage}/{DAILY_LIMIT} today</span>
        </div>
        <UsageChart data={dailyUsage} />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by user email…" value={userSearch} onChange={e => { setUserSearch(e.target.value); setPage(1) }}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
            <option value="">All Statuses</option>
            <option value="sent">Sent</option>
            <option value="skipped">Skipped</option>
            <option value="failed">Failed</option>
            <option value="logged_dev">Logged (dev)</option>
          </select>
          <select value={category} onChange={e => { setCategory(e.target.value); setPage(1) }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
            <option value="">All Categories</option>
            {['messages', 'offers', 'contracts', 'work', 'payments', 'daily_summary', 'profile_tips', 'security'].map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
          </select>
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg bg-white">
              <X className="w-3.5 h-3.5" /> Clear all
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {error ? (
          <div className="py-20 text-center">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-gray-700 font-medium mb-1">Couldn&apos;t load the email log</p>
            <button onClick={() => fetchEmails()} className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 mt-2">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        ) : loading ? (
          <div className="py-20 text-center"><div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" /><p className="text-sm text-gray-400">Loading…</p></div>
        ) : emails.length === 0 ? (
          <div className="py-20 text-center"><Filter className="w-8 h-8 text-gray-300 mx-auto mb-2" /><p className="text-gray-500 font-medium">No entries found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Template</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Error</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Sent</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {emails.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-700">{e.user_email ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{e.template}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">{e.category.replace('_', ' ')}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[e.status] ?? 'bg-gray-100 text-gray-600'}`}>{e.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-red-600 truncate max-w-48">{e.error ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{fmtDateTime(e.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      {e.status === 'failed' && RESENDABLE_TEMPLATES.has(e.template) && (
                        <button onClick={() => setResendTarget(e)} className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 text-gray-500 hover:text-violet-600 text-xs font-medium">
                          <Send className="w-3.5 h-3.5" /> Resend
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} total={total} limit={20} onPage={setPage} />
      </div>

      {resendTarget && (
        <ReasonDialog
          title="Resend Email"
          description={`Resend the ${resendTarget.template.replace(/_/g, ' ')} email to ${resendTarget.user_email ?? 'this user'}.`}
          confirmLabel="Resend"
          onConfirm={confirmResend}
          onClose={() => { setResendTarget(null); setActionError('') }}
        />
      )}
      {reminderPreview && reminderPreview.sendableToday > 0 && (
        <ReasonDialog
          title="Send Profile Reminders"
          description={`${reminderPreview.sendableToday} of ${reminderPreview.eligible} eligible creators will get the one-time "finish your profile" email today (${reminderPreview.budgetRemaining} sends left in today's quota). Already reminded: ${reminderPreview.alreadySent}. Opted out: ${reminderPreview.optedOut}.`}
          confirmLabel={`Send to ${reminderPreview.sendableToday}`}
          onConfirm={confirmReminders}
          onClose={() => setReminderPreview(null)}
        />
      )}
      {reminderPreview && reminderPreview.sendableToday === 0 && (
        <div className="fixed bottom-4 right-4 z-50 bg-gray-800 text-white px-4 py-2.5 rounded-lg shadow-lg text-sm flex items-center gap-3">
          {reminderPreview.eligible === 0
            ? `No creators to remind (${reminderPreview.alreadySent} already reminded, ${reminderPreview.optedOut} opted out).`
            : `${reminderPreview.eligible} creators are waiting, but today's email quota is used up. Try again tomorrow.`}
          <button onClick={() => setReminderPreview(null)} className="underline">Close</button>
        </div>
      )}
      {testCandidates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="test-reminder-title">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-6">
            <h2 id="test-reminder-title" className="text-lg font-semibold text-gray-900">Send a test reminder to yourself</h2>
            <p className="text-sm text-gray-500 mt-1">
              Pick a creator. You get the email exactly as they would, at your own address. The creator is not marked as reminded.
            </p>
            <label htmlFor="test-creator" className="block text-sm font-medium text-gray-700 mt-4 mb-1">Creator</label>
            <select
              id="test-creator"
              value={testCreatorId}
              onChange={(e) => setTestCreatorId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {testCandidates.map((c) => (
                <option key={c.user_id} value={c.user_id}>
                  {c.display_name || c.username} (@{c.username}): {c.percentage}% complete, {c.missing_count} missing
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setTestCandidates(null)}
                disabled={sendingTest}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={sendTest}
                disabled={sendingTest || !testCreatorId}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {sendingTest ? 'Sending...' : 'Send test'}
              </button>
            </div>
          </div>
        </div>
      )}
      {actionNotice && (
        <div className="fixed bottom-4 right-4 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-lg shadow-lg text-sm">{actionNotice}</div>
      )}
      {actionError && (
        <div className="fixed bottom-4 right-4 z-50 bg-red-600 text-white px-4 py-2.5 rounded-lg shadow-lg text-sm">{actionError}</div>
      )}
    </div>
  )
}

export default function AdminEmailPage() {
  return (
    <Suspense>
      <AdminEmailContent />
    </Suspense>
  )
}
