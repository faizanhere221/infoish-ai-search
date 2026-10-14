'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Gift } from 'lucide-react'
import { formatMoney } from '@/components/campaigns/utils'

interface PendingOffer {
  offer_id: string
  campaign_creator_id: string
  campaign_title: string | null
  brand_name: string | null
  amount: number
  currency: string
  created_at: string
}

// Surfaces brand-sent offers a creator hasn't responded to yet — otherwise
// a pending offer only showed up if they happened to open that specific
// row's Offer tab. Renders nothing while loading or if there's nothing to
// show, so it's safe to drop onto any creator page.
export function PendingOffersWidget() {
  const [offers, setOffers] = useState<PendingOffer[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token) {return}
    fetch('/api/campaign-creators/pending-offers', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : { pending_offers: [] }))
      .then((data) => setOffers(data.pending_offers || []))
      .finally(() => setLoaded(true))
  }, [])

  if (!loaded || offers.length === 0) {return null}

  return (
    <div className="bg-gradient-to-r from-brand-pink/10 to-brand-purple/10 border border-brand-pink/20 rounded-xl p-4 mb-6">
      <h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-3">
        <Gift className="w-4 h-4 text-brand-purple-dark" />
        {offers.length} offer{offers.length === 1 ? '' : 's'} waiting for your response
      </h3>
      <div className="space-y-2">
        {offers.map((offer) => (
          <Link
            key={offer.offer_id}
            href={`/dashboard/my-campaigns/${offer.campaign_creator_id}`}
            className="flex items-center justify-between bg-white rounded-lg p-3 hover:shadow-sm transition-shadow"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">{offer.campaign_title}</p>
              <p className="text-xs text-gray-500">{offer.brand_name}</p>
            </div>
            <span className="font-semibold text-brand-purple-dark">{formatMoney(offer.amount, offer.currency)}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default PendingOffersWidget
