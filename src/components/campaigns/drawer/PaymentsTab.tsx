'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, Eye, FileText, Loader2, Scissors, Upload, Wallet } from 'lucide-react'
import { formatMoney, formatDate } from '@/components/campaigns/utils'

interface PaymentsTabProps {
  campaignCreatorId: string
  actorType: 'brand' | 'creator'
  rowStatus: string
  token: string | null
}

interface Payment {
  id: string
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
}

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  scheduled: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Scheduled' },
  due: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Due' },
  marked_paid: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Marked paid' },
  confirmed: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Confirmed' },
  disputed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Disputed' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-400', label: 'Cancelled' },
}

const TYPE_LABELS: Record<string, string> = {
  full: 'Full payment', upfront: 'Upfront', milestone: 'Milestone', final: 'Final', kill_fee: 'Kill fee',
}

function isOverdue(p: Payment): boolean {
  return p.status === 'due' && !!p.due_date && new Date(p.due_date) < new Date()
}

export function PaymentsTab({ campaignCreatorId, actorType, rowStatus, token }: PaymentsTabProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [splittingId, setSplittingId] = useState<string | null>(null)
  const [upfrontAmount, setUpfrontAmount] = useState('')
  const [finalAmount, setFinalAmount] = useState('')

  const [payingId, setPayingId] = useState<string | null>(null)
  const [method, setMethod] = useState('wise')
  const [reference, setReference] = useState('')
  const [proofPath, setProofPath] = useState<string | null>(null)

  const [disputingId, setDisputingId] = useState<string | null>(null)
  const [disputeReason, setDisputeReason] = useState('')

  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  const [payoutDetails, setPayoutDetails] = useState<{ method: string; account_holder_name: string; masked_preview?: string; currency: string; details?: Record<string, string> } | null>(null)
  const [payoutLoading, setPayoutLoading] = useState(false)
  const [payoutError, setPayoutError] = useState<string | null>(null)

  const authHeader = useCallback((): Record<string, string> => (token ? { Authorization: `Bearer ${token}` } : {}), [token])
  const base = `/api/campaign-creators/${campaignCreatorId}/payments`

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(base, { headers: authHeader() })
      if (res.ok) {
        const data = await res.json()
        setPayments(data.payments || [])
      }
    } finally {
      setLoading(false)
    }
  }, [base, authHeader])

  useEffect(() => { load() }, [load])

  async function submitSplit(paymentId: string) {
    setBusyId(paymentId)
    setError(null)
    try {
      const res = await fetch(`${base}/${paymentId}/split`, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ upfront_amount: Number(upfrontAmount), final_amount: Number(finalAmount) }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to split payment')
        return
      }
      setSplittingId(null)
      setUpfrontAmount('')
      setFinalAmount('')
      await load()
    } finally {
      setBusyId(null)
    }
  }

  async function uploadProof(e: React.ChangeEvent<HTMLInputElement>, paymentId: string) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) {return}
    setBusyId(paymentId)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`${base}/${paymentId}/proof`, { method: 'POST', headers: authHeader(), body: formData })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to upload proof')
        return
      }
      setProofPath(data.path)
    } finally {
      setBusyId(null)
    }
  }

  async function submitMarkPaid(paymentId: string) {
    setBusyId(paymentId)
    setError(null)
    try {
      const res = await fetch(`${base}/${paymentId}/mark-paid`, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, reference, proof_path: proofPath }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to mark as paid')
        return
      }
      setPayingId(null)
      setReference('')
      setProofPath(null)
      await load()
    } finally {
      setBusyId(null)
    }
  }

  async function confirmReceipt(paymentId: string) {
    setBusyId(paymentId)
    setError(null)
    try {
      const res = await fetch(`${base}/${paymentId}/confirm`, { method: 'POST', headers: authHeader() })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to confirm')
        return
      }
      await load()
    } finally {
      setBusyId(null)
    }
  }

  async function submitDispute(paymentId: string) {
    setBusyId(paymentId)
    setError(null)
    try {
      const res = await fetch(`${base}/${paymentId}/dispute`, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: disputeReason }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to dispute')
        return
      }
      setDisputingId(null)
      setDisputeReason('')
      await load()
    } finally {
      setBusyId(null)
    }
  }

  async function submitCancel(paymentId: string) {
    setBusyId(paymentId)
    setError(null)
    try {
      const res = await fetch(`${base}/${paymentId}/cancel`, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to cancel')
        return
      }
      setCancellingId(null)
      setCancelReason('')
      await load()
    } finally {
      setBusyId(null)
    }
  }

  async function viewProof(paymentId: string) {
    const res = await fetch(`${base}/${paymentId}/proof/sign`, { headers: authHeader() })
    if (res.ok) {
      const data = await res.json()
      window.open(data.url, '_blank', 'noopener,noreferrer')
    }
  }

  async function loadPayoutDetails(reveal: boolean) {
    setPayoutLoading(true)
    setPayoutError(null)
    try {
      const res = await fetch(`/api/campaign-creators/${campaignCreatorId}/payout-details${reveal ? '?reveal=true' : ''}`, { headers: authHeader() })
      const data = await res.json()
      if (!res.ok) {
        setPayoutError(data.error || 'Payout details are not available yet')
        setPayoutDetails(null)
        return
      }
      setPayoutDetails(data)
    } finally {
      setPayoutLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-2">
        Payments are made directly between brand and creator. Infoishai keeps the record.
      </p>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      {actorType === 'brand' && (
        <div className="border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5" /> Payout details
            </h5>
            {!payoutDetails && (
              <button onClick={() => loadPayoutDetails(false)} disabled={payoutLoading} className="text-xs text-brand-purple-dark hover:underline">
                Show
              </button>
            )}
          </div>
          {payoutError && <p className="text-xs text-red-600">{payoutError}</p>}
          {payoutDetails && (
            <div className="text-sm text-gray-700 space-y-1">
              <p>{payoutDetails.account_holder_name} &middot; {payoutDetails.currency}</p>
              {payoutDetails.details ? (
                <pre className="whitespace-pre-wrap font-sans text-xs bg-gray-50 p-2 rounded">{JSON.stringify(payoutDetails.details, null, 2)}</pre>
              ) : (
                <div className="flex items-center justify-between">
                  <span>{payoutDetails.masked_preview}</span>
                  <button onClick={() => loadPayoutDetails(true)} disabled={payoutLoading} className="inline-flex items-center gap-1 text-xs text-brand-purple-dark hover:underline">
                    <Eye className="w-3 h-3" /> Reveal
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {payments.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No payment records yet.</p>}

      {payments.map((p) => {
        const badge = STATUS_BADGE[p.status]
        const overdue = isOverdue(p)
        return (
          <div key={p.id} className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">{TYPE_LABELS[p.type] || p.type} &middot; {formatMoney(p.amount, p.currency)}</h4>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>{badge.label}</span>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-2">
              {p.due_date && <span className={overdue ? 'text-red-600 font-medium flex items-center gap-1' : ''}>
                {overdue && <AlertTriangle className="w-3 h-3" />} Due {formatDate(p.due_date)}
              </span>}
              {p.method && <span>via {p.method}{p.reference ? ` · ${p.reference}` : ''}</span>}
            </div>

            {p.dispute_reason && p.status === 'disputed' && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2 mb-2">{p.dispute_reason}</p>
            )}
            {p.cancelled_reason && p.status === 'cancelled' && (
              <p className="text-sm text-gray-500 mb-2">Cancelled: {p.cancelled_reason}</p>
            )}
            {p.proof_path && (
              <button onClick={() => viewProof(p.id)} className="inline-flex items-center gap-1 text-sm text-brand-purple-dark hover:underline mb-2">
                <FileText className="w-3.5 h-3.5" /> View proof
              </button>
            )}

            {actorType === 'brand' && p.type === 'full' && p.status === 'scheduled' && (
              splittingId === p.id ? (
                <div className="space-y-2 mt-2 p-3 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" min="0" value={upfrontAmount} onChange={(e) => setUpfrontAmount(e.target.value)} placeholder="Upfront amount" className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm" />
                    <input type="number" min="0" value={finalAmount} onChange={(e) => setFinalAmount(e.target.value)} placeholder="Final amount" className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setSplittingId(null)} className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600">Cancel</button>
                    <button onClick={() => submitSplit(p.id)} disabled={busyId === p.id} className="flex-1 px-3 py-1.5 bg-gradient-to-r from-brand-pink to-brand-purple text-white rounded-lg text-sm font-medium disabled:opacity-50">Save split</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setSplittingId(p.id)} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mt-1">
                  <Scissors className="w-3.5 h-3.5" /> Split into upfront + final
                </button>
              )
            )}

            {actorType === 'brand' && (p.status === 'due' || p.status === 'disputed') && (
              payingId === p.id ? (
                <div className="space-y-2 mt-2 p-3 bg-gray-50 rounded-lg">
                  <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm">
                    <option value="wise">Wise</option>
                    <option value="payoneer">Payoneer</option>
                    <option value="bank_transfer">Bank transfer</option>
                    <option value="paypal">PayPal</option>
                    <option value="other">Other</option>
                  </select>
                  <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Transfer reference / id" className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm" />
                  <label className="inline-flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" /> {proofPath ? 'Proof attached' : 'Attach proof (optional)'}
                    <input type="file" className="hidden" onChange={(e) => uploadProof(e, p.id)} />
                  </label>
                  <div className="flex gap-2">
                    <button onClick={() => { setPayingId(null); setProofPath(null) }} className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600">Cancel</button>
                    <button onClick={() => submitMarkPaid(p.id)} disabled={busyId === p.id || !reference.trim()} className="flex-1 px-3 py-1.5 bg-gradient-to-r from-brand-pink to-brand-purple text-white rounded-lg text-sm font-medium disabled:opacity-50">Mark as paid</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setPayingId(p.id)} className="px-3 py-1.5 bg-gradient-to-r from-brand-pink to-brand-purple text-white rounded-lg text-sm font-medium mt-1">
                  Mark as paid
                </button>
              )
            )}

            {actorType === 'brand' && rowStatus === 'dropped' && (p.status === 'scheduled' || p.status === 'due') && (
              cancellingId === p.id ? (
                <div className="space-y-2 mt-2 p-3 bg-gray-50 rounded-lg">
                  <input value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Reason" className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm" />
                  <div className="flex gap-2">
                    <button onClick={() => setCancellingId(null)} className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600">Back</button>
                    <button onClick={() => submitCancel(p.id)} disabled={busyId === p.id || !cancelReason.trim()} className="flex-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">Cancel payment</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setCancellingId(p.id)} className="text-sm text-red-600 hover:underline mt-1 block">Cancel this payment</button>
              )
            )}

            {actorType === 'creator' && p.status === 'marked_paid' && (
              disputingId === p.id ? (
                <div className="space-y-2 mt-2 p-3 bg-gray-50 rounded-lg">
                  <input value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} placeholder="What's wrong?" className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm" />
                  <div className="flex gap-2">
                    <button onClick={() => setDisputingId(null)} className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600">Cancel</button>
                    <button onClick={() => submitDispute(p.id)} disabled={busyId === p.id || !disputeReason.trim()} className="flex-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">Dispute</button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 mt-1">
                  <button onClick={() => confirmReceipt(p.id)} disabled={busyId === p.id} className="px-3 py-1.5 bg-gradient-to-r from-brand-pink to-brand-purple text-white rounded-lg text-sm font-medium disabled:opacity-50">
                    Confirm receipt
                  </button>
                  <button onClick={() => setDisputingId(p.id)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600">
                    Dispute
                  </button>
                </div>
              )
            )}
          </div>
        )
      })}
    </div>
  )
}

export default PaymentsTab
