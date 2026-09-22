'use client'

import Link from 'next/link'
import { ChevronUp, ChevronDown, ChevronsUpDown, Eye, Filter } from 'lucide-react'
import { formatCents } from '@/lib/referral'
import type { PartnerStatus, ReferralPartner } from '@/types/referral'

export interface AdminPartnerRow extends ReferralPartner {
  total_earnings_cents: number
}

interface PartnerTableProps {
  partners: AdminPartnerRow[]
  isLoading: boolean
  sortField: string
  sortDir: 'asc' | 'desc'
  onSort: (field: string) => void
}

const STATUS_STYLES: Record<PartnerStatus, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  paused: 'bg-amber-100 text-amber-700',
  deactivated: 'bg-gray-100 text-gray-600',
}

function StatusBadge({ status }: { status: PartnerStatus }) {
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize whitespace-nowrap ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  )
}

function SortTh({
  field, label, current, dir, onSort, align = 'left',
}: {
  field: string
  label: string
  current: string
  dir: 'asc' | 'desc'
  onSort: (f: string) => void
  align?: 'left' | 'right'
}) {
  const active = current === field
  return (
    <th
      className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700 whitespace-nowrap ${align === 'right' ? 'text-right' : 'text-left'}`}
      onClick={() => onSort(field)}
    >
      <span className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
        {label}
        {active ? (dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronsUpDown className="w-3 h-3 opacity-30" />}
      </span>
    </th>
  )
}

export default function PartnerTable({ partners, isLoading, sortField, sortDir, onSort }: PartnerTableProps) {
  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm text-gray-400">Loading partners…</p>
      </div>
    )
  }

  if (partners.length === 0) {
    return (
      <div className="py-20 text-center">
        <Filter className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500 font-medium">No partners found</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <SortTh field="name" label="Partner" current={sortField} dir={sortDir} onSort={onSort} />
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Code</th>
            <SortTh field="commission_rate" label="Rate" current={sortField} dir={sortDir} onSort={onSort} align="right" />
            <SortTh field="total_referrals" label="Referrals" current={sortField} dir={sortDir} onSort={onSort} align="right" />
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Earnings</th>
            <SortTh field="total_paid_cents" label="Paid" current={sortField} dir={sortDir} onSort={onSort} align="right" />
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {partners.map((partner) => (
            <tr key={partner.id} className="hover:bg-gray-50/60 transition-colors">
              <td className="px-4 py-3">
                <p className="text-sm font-medium text-gray-800 truncate max-w-48">{partner.name}</p>
                <p className="text-xs text-gray-400 truncate max-w-48">{partner.email}</p>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 font-mono whitespace-nowrap">{partner.referral_code}</td>
              <td className="px-4 py-3 text-sm text-gray-700 text-right whitespace-nowrap">{Number(partner.commission_rate)}%</td>
              <td className="px-4 py-3 text-sm font-medium text-gray-700 text-right">{partner.total_referrals}</td>
              <td className="px-4 py-3 text-sm font-semibold text-emerald-700 text-right whitespace-nowrap">{formatCents(partner.total_earnings_cents)}</td>
              <td className="px-4 py-3 text-sm text-gray-700 text-right whitespace-nowrap">{formatCents(partner.total_paid_cents)}</td>
              <td className="px-4 py-3"><StatusBadge status={partner.status} /></td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end">
                  <Link href={`/admin/partners/${partner.id}`} title="View / Edit" className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                    <Eye className="w-4 h-4" />
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
