'use client'

import { DollarSign } from 'lucide-react'
import { formatDate } from '@/components/campaigns/utils'
import { formatCents } from '@/lib/referral'
import type { CommissionStatus, ReferralCommission } from '@/types/referral'

interface CommissionTableProps {
  commissions: ReferralCommission[]
  isLoading: boolean
}

const STATUS_STYLES: Record<CommissionStatus, string> = {
  pending: 'bg-gray-100 text-gray-700',
  approved: 'bg-blue-100 text-blue-700',
  paid: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<CommissionStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  paid: 'Paid',
  cancelled: 'Cancelled',
}

function StatusBadge({ status }: { status: CommissionStatus }) {
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

export default function CommissionTable({ commissions, isLoading }: CommissionTableProps) {
  if (isLoading) {return <TableSkeleton />}

  if (commissions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <DollarSign className="w-12 h-12 text-gray-300 mx-auto" />
        <p className="mt-4 text-gray-500">No commissions yet. You&apos;ll earn when referred creators complete deals.</p>
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
              <th className="px-6 py-3 font-medium">Creator</th>
              <th className="px-6 py-3 font-medium">Deal</th>
              <th className="px-6 py-3 font-medium text-right">Amount</th>
              <th className="px-6 py-3 font-medium text-right">Rate</th>
              <th className="px-6 py-3 font-medium text-right">Commission</th>
              <th className="px-6 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {commissions.map((commission) => (
              <tr key={commission.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{formatDate(commission.created_at)}</td>
                <td className="px-6 py-4 text-gray-900">
                  {commission.referral_signup?.referred_name || commission.referral_signup?.referred_email || '—'}
                </td>
                <td className="px-6 py-4 text-gray-600 max-w-[200px] truncate">
                  {commission.deal?.title || '—'}
                </td>
                <td className="px-6 py-4 text-right text-gray-900 whitespace-nowrap">
                  {formatCents(commission.deal_amount_cents)}
                </td>
                <td className="px-6 py-4 text-right text-gray-600 whitespace-nowrap">
                  {Number(commission.commission_rate)}%
                </td>
                <td className="px-6 py-4 text-right font-medium text-gray-900 whitespace-nowrap">
                  {formatCents(commission.commission_amount_cents)}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={commission.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
