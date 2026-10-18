'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, AlertCircle, RefreshCw, MessageSquare } from 'lucide-react'
import { ReasonDialog } from '@/components/admin/ReasonDialog'

interface ReportDetail {
  id: string
  reporter_user_id: string
  reported_user_id: string
  conversation_id: string | null
  message_id: string | null
  category: string
  note: string | null
  status: string
  resolution_action: string | null
  resolution_note: string | null
  resolved_at: string | null
  created_at: string
}

interface UserSummary {
  id: string
  email: string
  user_type: string
  is_active: boolean
}

interface ConversationView {
  messages: { id: string; sender_id: string; content: string; is_system: boolean; created_at: string }[]
  creatorName: string | null
  brandName: string | null
}

type PendingAction = { kind: 'warned' | 'suspended' | 'dismissed' }

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AdminReportDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [report, setReport] = useState<ReportDetail | null>(null)
  const [reporter, setReporter] = useState<UserSummary | null>(null)
  const [reported, setReported] = useState<UserSummary | null>(null)
  const [reportedProfileName, setReportedProfileName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [loadError, setLoadError] = useState(false)

  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [actionError, setActionError] = useState('')
  const [conversation, setConversation] = useState<ConversationView | null>(null)
  const [conversationLoading, setConversationLoading] = useState(false)

  const fetchDetail = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const res = await fetch(`/api/admin/reports/${params.id}`)
      if (res.status === 401 || res.status === 403) { router.push('/admin/login'); return }
      if (res.status === 404) { setNotFound(true); setLoading(false); return }
      if (!res.ok) {throw new Error('Failed to load')}
      const data = await res.json()
      setReport(data.report)
      setReporter(data.reporter)
      setReported(data.reported)
      setReportedProfileName(data.reportedProfileName)
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [params.id, router])

  useEffect(() => { fetchDetail() }, [fetchDetail])

  const openConversation = async () => {
    setConversationLoading(true)
    try {
      const res = await fetch(`/api/admin/reports/${params.id}/conversation`)
      const data = await res.json()
      if (!res.ok) {throw new Error(data.error || 'Failed to load conversation')}
      setConversation(data)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to load conversation')
    } finally {
      setConversationLoading(false)
    }
  }

  const confirmPendingAction = async (reason: string) => {
    if (!pendingAction || !report) {return}
    setActionError('')
    try {
      if (pendingAction.kind === 'suspended') {
        const suspendRes = await fetch(`/api/admin/users/${report.reported_user_id}/suspend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason }),
        })
        if (!suspendRes.ok) {throw new Error((await suspendRes.json().catch(() => ({})))?.error || 'Failed to suspend user')}
      }
      const res = await fetch(`/api/admin/reports/${params.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: pendingAction.kind, reason }),
      })
      if (!res.ok) {throw new Error((await res.json().catch(() => ({})))?.error || 'Failed to update report')}
      setPendingAction(null)
      await fetchDetail()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed')
    }
  }

  if (loading) {
    return <div className="py-20 text-center"><div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" /><p className="text-sm text-gray-400">Loading…</p></div>
  }
  if (notFound) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-500 font-medium">Report not found</p>
        <Link href="/admin/reports" className="mt-4 inline-block text-sm text-violet-600 hover:text-violet-700">Back to Reports</Link>
      </div>
    )
  }
  if (loadError || !report) {
    return (
      <div className="py-20 text-center">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-gray-700 font-medium mb-1">Couldn&apos;t load this report</p>
        <button onClick={() => fetchDetail()} className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    )
  }

  const canAct = report.status !== 'resolved' && report.status !== 'dismissed'

  return (
    <div className="space-y-6">
      <Link href="/admin/reports" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to Reports
      </Link>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 capitalize">{report.category} report</h1>
            <p className="text-sm text-gray-500 mt-1">
              Reported: {reported?.email ?? '—'} {reportedProfileName && `(${reportedProfileName})`} · Reporter: {reporter?.email ?? '—'}
            </p>
            <span className="inline-flex mt-2 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">{report.status}</span>
          </div>
          {canAct && (
            <div className="flex gap-2">
              <button onClick={() => setPendingAction({ kind: 'warned' })} className="px-3 py-2 border border-amber-200 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-100">
                Warn
              </button>
              <button onClick={() => setPendingAction({ kind: 'suspended' })} className="px-3 py-2 border border-red-200 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100">
                Suspend User
              </button>
              <button onClick={() => setPendingAction({ kind: 'dismissed' })} className="px-3 py-2 border border-gray-200 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                Dismiss
              </button>
            </div>
          )}
        </div>

        {report.note && (
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
            <span className="font-medium">Reporter&apos;s note:</span> {report.note}
          </div>
        )}
        {report.resolution_note && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
            <span className="font-medium capitalize">{report.resolution_action}:</span> {report.resolution_note}
          </div>
        )}

        <p className="text-xs text-gray-400 mt-4">Submitted {fmtDateTime(report.created_at)}</p>
      </div>

      {report.conversation_id && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-gray-400" /> Reported Conversation
            </h2>
            {!conversation && (
              <button onClick={openConversation} disabled={conversationLoading} className="px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-medium hover:bg-violet-700 disabled:opacity-50">
                {conversationLoading ? 'Loading…' : 'Open Conversation'}
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mb-3">Opening this is logged with this report&apos;s id. There is no general conversation browser — this is the only way in.</p>
          {conversation && (
            <div className="space-y-2 max-h-96 overflow-y-auto border-t border-gray-100 pt-3">
              {conversation.messages.map((m) => (
                <div key={m.id} className="text-sm p-2 bg-gray-50 rounded-lg">
                  <p className="text-gray-700">{m.content}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{fmtDateTime(m.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {pendingAction && (
        <ReasonDialog
          title={
            pendingAction.kind === 'warned' ? 'Warn User' :
            pendingAction.kind === 'suspended' ? 'Suspend User' :
            'Dismiss Report'
          }
          description={
            pendingAction.kind === 'warned' ? 'Sends the reported user a warning notification.' :
            pendingAction.kind === 'suspended' ? 'Suspends the reported user immediately and resolves this report.' :
            'No action is taken against the reported user.'
          }
          danger={pendingAction.kind === 'suspended'}
          confirmLabel="Confirm"
          onConfirm={confirmPendingAction}
          onClose={() => { setPendingAction(null); setActionError('') }}
        />
      )}
      {actionError && (
        <div className="fixed bottom-4 right-4 z-50 bg-red-600 text-white px-4 py-2.5 rounded-lg shadow-lg text-sm">{actionError}</div>
      )}
    </div>
  )
}
