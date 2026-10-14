'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { OfferTab } from './drawer/OfferTab'
import { DeliverablesTab } from './drawer/DeliverablesTab'
import { ActivityTab } from './drawer/ActivityTab'

interface CampaignCreatorDrawerProps {
  campaignCreatorId: string
  creatorId: string
  creatorName: string
  currency: string
  token: string | null
  onClose: () => void
  onChanged: () => void
}

type DrawerTab = 'offer' | 'deliverables' | 'activity'

const TABS: { id: DrawerTab; label: string }[] = [
  { id: 'offer', label: 'Offer' },
  { id: 'deliverables', label: 'Deliverables' },
  { id: 'activity', label: 'Activity' },
]

export function CampaignCreatorDrawer({
  campaignCreatorId, creatorId, creatorName, currency, token, onClose, onChanged,
}: CampaignCreatorDrawerProps) {
  const [tab, setTab] = useState<DrawerTab>('offer')

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={`${creatorName} details`}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md h-full flex flex-col shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-semibold text-gray-900">{creatorName}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink" aria-label="Close">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex border-b border-gray-100 flex-shrink-0" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-3 text-sm font-medium border-b-2 ${
                tab === t.id ? 'border-brand-pink text-brand-purple-dark' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {tab === 'offer' && (
            <OfferTab
              campaignCreatorId={campaignCreatorId}
              creatorId={creatorId}
              actorType="brand"
              token={token}
              currency={currency}
              onOfferAccepted={onChanged}
            />
          )}
          {tab === 'deliverables' && <DeliverablesTab campaignCreatorId={campaignCreatorId} actorType="brand" token={token} />}
          {tab === 'activity' && <ActivityTab campaignCreatorId={campaignCreatorId} token={token} />}
        </div>
      </div>
    </div>
  )
}

export default CampaignCreatorDrawer
