'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, AlertCircle, RefreshCw, FileText, Wallet, StickyNote } from 'lucide-react'
import { ReasonDialog } from '@/components/admin/ReasonDialog'

interface PaymentDetail {
  id: string
  campaign_creator_id: string
  amount: number
  currency: string
  type: string
  status: string
  due_date: string | null
  method: string | null
  reference: string | null
  proof_path: string | null
  dispute_reason: string | null
  cancelled_reason: string | null
  created_at: string
}

interface HistoryItem {
  kind: 'event' | 'admin_action'
  type: string
  actor: string
  payload: Record<string, unknown>
  created_at: string
}

interface PayoutMethod {
  id: string
  method: string
  masked_preview: string | null
  currency: string
  is_default: boolean
}

type PendingAction =
  | { kind: 'note' }
  | { kind: 'resolve'; resolution: 'marked_paid' | 'confirmed' }
  | { kind: 'cancel' }

function fmtMoney(amount: number, currency: string) {
  const symbols: Record<string, string> = { USD: '$', CAD: '$', AUD: '$', GBP: '£', EUR: '€' }
  const symbol = symbols[currency]
  return symbol ? `${symbol}${Number(amount).toLocaleString()}` : `${Number(amount).toLocaleString()} ${currency}`
}

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AdminPaymentDetailPage({ params }: { params: { id: string } }) {
  const paymentId = params.id
  const router = useRouter()

  const [payment, setPayment] = useState<PaymentDetail | null>(null)
  const [context, setContext] = useState<{ campaign_title: string | null; creator_name: string | null; brand_name: string | null } | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [actionError, setActionError] = useState('')
  const [proofLoading, setProofLoading] = useState(false)

  const fetchDetail = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}`)
      if (res.status === 401 || res.status === 403) { router.push('/admin/login'); return }
      if (res.status === 404) { setNotFound(true); setLoading(false); return }
      if (!res.ok) {throw new Error('Failed to load payment')}
      const data = await res.json()
      setPayment(data.payment)
      setContext(data.context)
      setHistory(data.history ?? [])
      setPayoutMethods(data.payoutMethods ?? [])
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [paymentId, router])

  useEffect(() => { fetchDetail() }, [fetchDetail])

  const viewProof = async () => {
    setProofLoading(true)
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/proof`)
      const data = await res.json()
      if (!res.ok) {throw new Error(data.error || 'No proof available')}
      window.open(data.url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to load proof')
    } finally {
      setProofLoading(false)
    }
  }

  const confirmPendingAction = async (reason: string) => {
    if (!pendingAction) {return}
    setActionError('')
    try {
      if (pendingAction.kind === 'note') {
        const res = await fetch(`/api/admin/payments/${paymentId}/note`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason }),
        })
        if (!res.ok) {throw new Error((await res.json().catch(() => ({})))?.error || 'Failed to add note')}
      } else if (pendingAction.kind === 'resolve') {
        const res = await fetch(`/api/admin/payments/${paymentId}/resolve-dispute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resolution: pendingAction.resolution, reason }),
        })
        if (!res.ok) {throw new Error((await res.json().catch(() => ({})))?.error || 'Failed to resolve dispute')}
      } else {
        const res = await fetch(`/api/admin/payments/${paymentId}/cancel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason }),
        })
        if (!res.ok) {throw new Error((await res.json().catch(() => ({})))?.error || 'Failed to cancel payment')}
      }
      setPendingAction(null)
      await fetchDetail()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed')
    }
  }

  if (loading) {
    return <div className="py-20 text-center"><div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" /><p className="text-sm text-gray-400">Loading payment…</p></div>
  }
  if (notFound) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-500 font-medium">Payment not found</p>
        <Link href="/admin/payments" className="mt-4 inline-block text-sm text-violet-600 hover:text-violet-700">Back to Payments</Link>
      </div>
    )
  }
  if (loadError || !payment) {
    return (
      <div className="py-20 text-center">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-gray-700 font-medium mb-1">Couldn&apos;t load this payment</p>
        <button onClick={() => fetchDetail()} className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    )
  }

  const canResolve = payment.status === 'disputed'
  const canCancel = !['confirmed', 'cancelled'].includes(payment.status)

  return (
    <div className="space-y-6">
      <Link href="/admin/payments" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to Payments
      </Link>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{fmtMoney(payment.amount, payment.currency)} — {payment.type}</h1>
            <p className="text-sm text-gray-500 mt-1">{context?.campaign_title ?? '—'} · {context?.creator_name ?? '—'} · {context?.brand_name ?? '—'}</p>
            <span className="inline-flex mt-2 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">{payment.status.replace('_', ' ')}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {payment.proof_path && (
              <button onClick={viewProof} disabled={proofLoading} className="flex items-center gap-2 px-3 py-2 border border-gray-200 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50">
                <FileText className="w-4 h-4" /> {proofLoading ? 'Loading…' : 'View Proof'}
              </button>
            )}
            <button onClick={() => setPendingAction({ kind: 'note' })} className="flex items-center gap-2 px-3 py-2 border border-gray-200 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
              <StickyNote className="w-4 h-4" /> Add Note
            </button>
            {canResolve && (
              <>
                <button onClick={() => setPendingAction({ kind: 'resolve', resolution: 'marked_paid' })} className="px-3 py-2 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100">
                  Resolve → Marked Paid
                </button>
                <button onClick={() => setPendingAction({ kind: 'resolve', resolution: 'confirmed' })} className="px-3 py-2 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100">
                  Resolve → Confirmed
                </button>
              </>
            )}
            {canCancel && (
              <button onClick={() => setPendingAction({ kind: 'cancel' })} className="px-3 py-2 border border-red-200 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100">
                Cancel Payment
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><p className="text-gray-400 text-xs">Due date</p><p className="text-gray-800 font-medium">{payment.due_date ?? '—'}</p></div>
          <div><p className="text-gray-400 text-xs">Method</p><p className="text-gray-800 font-medium capitalize">{payment.method ?? '—'}</p></div>
          <div><p className="text-gray-400 text-xs">Reference</p><p className="text-gray-800 font-medium truncate">{payment.reference ?? '—'}</p></div>
          <div><p className="text-gray-400 text-xs">Created</p><p className="text-gray-800 font-medium">{fmtDateTime(payment.created_at)}</p></div>
        </div>

        {payment.dispute_reason && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <span className="font-medium">Dispute reason:</span> {payment.dispute_reason}
          </div>
        )}
        {payment.cancelled_reason && (
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
            <span className="font-medium">Cancelled:</span> {payment.cancelled_reason}
          </div>
        )}
      </div>

      {/* Payout method — masked only, never decrypted */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-gray-400" /> Creator Payout Method
        </h2>
        {payoutMethods.length === 0 ? (
          <p className="text-sm text-gray-400">No payout method on file.</p>
        ) : (
          <div className="space-y-2">
            {payoutMethods.map(m => (
              <div key={m.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-lg">
                <span className="text-gray-700">{m.masked_preview ?? `${m.method} (masked)`}{m.is_default && <span className="ml-2 text-xs text-violet-600">default</span>}</span>
                <span className="text-gray-400 text-xs">{m.currency}</span>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-400 mt-2">Raw account details are never shown to admins — masked preview only.</p>
      </div>

      {/* History */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 text-sm mb-3">History</h2>
        {history.length === 0 ? (
          <p className="text-sm text-gray-400">No history yet.</p>
        ) : (
          <div className="space-y-3">
            {history.map((h, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${h.kind === 'admin_action' ? 'bg-violet-500' : 'bg-gray-300'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-gray-700 capitalize">{h.type.replace(/_/g, ' ')} <span className="text-gray-400">· {h.actor}</span></p>
                  {h.kind === 'admin_action' && typeof h.payload?.reason === 'string' && (
                    <p className="text-gray-500 text-xs mt-0.5">{h.payload.reason}</p>
                  )}
                </div>
                <span className="text-gray-400 text-xs flex-shrink-0">{fmtDateTime(h.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {pendingAction && (
        <ReasonDialog
          title={
            pendingAction.kind === 'note' ? 'Add Internal Note' :
            pendingAction.kind === 'resolve' ? `Resolve Dispute → ${pendingAction.resolution === 'marked_paid' ? 'Marked Paid' : 'Confirmed'}` :
            'Cancel Payment'
          }
          description={
            pendingAction.kind === 'note' ? 'Internal only — never shown to the brand or creator.' :
            pendingAction.kind === 'resolve' ? 'This notifies both the brand and the creator.' :
            'This notifies both the brand and the creator. This cannot be undone.'
          }
          danger={pendingAction.kind === 'cancel'}
          confirmLabel={pendingAction.kind === 'note' ? 'Add Note' : 'Confirm'}
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
