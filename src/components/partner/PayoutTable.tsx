'use client'

import { Wallet } from 'lucide-react'
import { formatDate } from '@/components/campaigns/utils'
import { formatCents } from '@/lib/referral'
import type { PayoutStatus, ReferralPayout } from '@/types/referral'

interface PayoutTableProps {
  payouts: ReferralPayout[]
  isLoading: boolean
}

const STATUS_STYLES: Record<PayoutStatus, string> = {
  pending: 'bg-gray-100 text-gray-700',
  processing: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<PayoutStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
}

function StatusBadge({ status }: { status: PayoutStatus }) {
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}

function TableSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="animate-pulse space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-14 bg-gray-100 rounded-lg" />
        ))}
      </div>
    </div>
  )
}

export default function PayoutTable({ payouts, isLoading }: PayoutTableProps) {
  if (isLoading) {return <TableSkeleton />}

  if (payouts.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <Wallet className="w-12 h-12 text-gray-300 mx-auto" />
        <p className="mt-4 text-gray-500">No payouts yet. Request a payout when you reach the minimum balance.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500">
              <th className="px-6 py-3 font-medium">Date</th>
              <th className="px-6 py-3 font-medium text-right">Amount</th>
              <th className="px-6 py-3 font-medium">Method</th>
              <th className="px-6 py-3 font-medium">Reference</th>
              <th className="px-6 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {payouts.map((payout) => (
              <tr key={payout.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{formatDate(payout.created_at)}</td>
                <td className="px-6 py-4 text-right font-medium text-gray-900 whitespace-nowrap">
                  {formatCents(payout.amount_cents)}
                </td>
                <td className="px-6 py-4 text-gray-600">{payout.payment_method || '—'}</td>
                <td className="px-6 py-4 text-gray-600">{payout.payment_reference || '—'}</td>
                <td className="px-6 py-4">
                  <StatusBadge status={payout.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
