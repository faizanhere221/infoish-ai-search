'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Users } from 'lucide-react'
import { formatRelativeDate } from '@/components/campaigns/utils'
import { formatCents } from '@/lib/referral'
import type { ReferralSignup, ReferralSignupStatus } from '@/types/referral'

interface ReferralTableProps {
  referrals: ReferralSignup[]
  isLoading: boolean
}

const STATUS_STYLES: Record<ReferralSignupStatus, string> = {
  signed_up: 'bg-gray-100 text-gray-700',
  profile_complete: 'bg-blue-100 text-blue-700',
  first_deal: 'bg-amber-100 text-amber-700',
  active: 'bg-emerald-100 text-emerald-700',
}

const STATUS_LABELS: Record<ReferralSignupStatus, string> = {
  signed_up: 'Signed Up',
  profile_complete: 'Profile Complete',
  first_deal: 'First Deal',
  active: 'Active',
}

function StatusBadge({ status }: { status: ReferralSignupStatus }) {
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

export default function ReferralTable({ referrals, isLoading }: ReferralTableProps) {
  if (isLoading) {return <TableSkeleton />}

  if (referrals.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <Users className="w-12 h-12 text-gray-300 mx-auto" />
        <p className="mt-4 text-gray-500">No referrals yet. Share your link to start earning!</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500">
              <th className="px-6 py-3 font-medium">Creator</th>
              <th className="px-6 py-3 font-medium">Signup Date</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium text-right">Deals</th>
              <th className="px-6 py-3 font-medium text-right">Earnings</th>
              <th className="px-6 py-3 font-medium text-right">Commission</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {referrals.map((referral) => (
              <tr key={referral.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  {referral.creator ? (
                    <Link href={`/creators/${referral.creator.username}`} className="flex items-center gap-3 group">
                      {referral.creator.profile_photo_url ? (
                        <Image
                          src={referral.creator.profile_photo_url}
                          alt={referral.creator.display_name}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {referral.creator.display_name?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 group-hover:text-violet-600 truncate">
                          {referral.creator.display_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">@{referral.creator.username}</p>
                      </div>
                    </Link>
                  ) : (
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{referral.referred_name || 'Pending signup'}</p>
                      {referral.referred_email && (
                        <p className="text-xs text-gray-500 truncate">{referral.referred_email}</p>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{formatRelativeDate(referral.signup_date)}</td>
                <td className="px-6 py-4">
                  <StatusBadge status={referral.status} />
                </td>
                <td className="px-6 py-4 text-right text-gray-900">{referral.deals_count ?? 0}</td>
                <td className="px-6 py-4 text-right text-gray-900 whitespace-nowrap">
                  {formatCents(referral.total_deal_amount_cents ?? 0)}
                </td>
                <td className="px-6 py-4 text-right font-medium text-gray-900 whitespace-nowrap">
                  {formatCents(referral.total_commission_cents ?? 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
