'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Wallet } from 'lucide-react'
import { formatMoney } from '@/components/campaigns/utils'

interface MarkedPaidItem {
  id: string
  campaign_creator_id: string
  amount: number
  currency: string
  campaign_title: string | null
  brand_name: string | null
}

// Nudges a creator to confirm or dispute a payment the brand already
// marked as paid. Renders nothing while loading or if there's nothing to
// show.
export function PaymentsTodoWidget() {
  const [items, setItems] = useState<MarkedPaidItem[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token) {return}
    fetch('/api/campaign-creators/my-payments', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : { payments: [] }))
      .then((data) => setItems((data.payments || []).filter((p: { status: string }) => p.status === 'marked_paid')))
      .finally(() => setLoaded(true))
  }, [])

  if (!loaded || items.length === 0) {return null}

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
      <h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-3">
        <Wallet className="w-4 h-4 text-blue-600" />
        {items.length} payment{items.length === 1 ? '' : 's'} marked as paid — please confirm
      </h3>
      <div className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.id}
            href="/dashboard/earnings"
            className="flex items-center justify-between bg-white rounded-lg p-3 hover:shadow-sm transition-shadow"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">{item.campaign_title}</p>
              <p className="text-xs text-gray-500">{item.brand_name}</p>
            </div>
            <span className="font-semibold text-brand-purple-dark">{formatMoney(item.amount, item.currency)}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default PaymentsTodoWidget
