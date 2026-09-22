'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'

interface RecordPayoutModalProps {
  partnerId: string
  pendingBalanceCents: number
  onClose: () => void
  onSuccess: () => void
}

const PAYMENT_METHODS = ['PayPal', 'Wire Transfer', 'Wise', 'Bank Transfer', 'Other']

export default function RecordPayoutModal({ partnerId, pendingBalanceCents, onClose, onSuccess }: RecordPayoutModalProps) {
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState(PAYMENT_METHODS[0])
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pendingBalance = pendingBalanceCents / 100

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const amountNum = parseFloat(amount)
    if (!amountNum || amountNum <= 0) {
      setError('Enter a valid amount')
      return
    }
    if (amountNum > pendingBalance) {
      setError(`Amount can't exceed the pending balance of $${pendingBalance.toFixed(2)}`)
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/admin/partners/${partnerId}/payouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_cents: Math.round(amountNum * 100),
          payment_method: method,
          payment_reference: reference || undefined,
          notes: notes || undefined,
          // A payout recorded here already happened (admin is logging a
          // completed transfer), so mark it completed immediately —
          // that's what makes referral_partners.total_paid_cents update.
          status: 'completed',
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to record payout')
        setIsSubmitting(false)
        return
      }

      onSuccess()
    } catch (err) {
      console.error('Record payout error:', err)
      setError('Network error. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Record Payout</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Pending balance: <span className="font-semibold text-gray-900">${pendingBalance.toFixed(2)}</span>
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount ($) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={pendingBalance || undefined}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Reference Number</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Transaction ID, optional"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || pendingBalance <= 0}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Recording...' : 'Record Payout'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
