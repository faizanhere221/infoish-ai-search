'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import type { CampaignCreator } from '@/types/campaigns'

interface EditCampaignCreatorModalProps {
  row: CampaignCreator
  onClose: () => void
  onSave: (updates: {
    payout_amount: number | null
    charge_amount: number | null
    currency: string
    posted_url: string | null
    posted_at: string | null
    brand_notes: string | null
  }) => Promise<void>
}

export function EditCampaignCreatorModal({ row, onClose, onSave }: EditCampaignCreatorModalProps) {
  const [payout, setPayout] = useState(row.payout_amount !== null ? String(row.payout_amount) : '')
  const [charge, setCharge] = useState(row.charge_amount !== null ? String(row.charge_amount) : '')
  const [currency, setCurrency] = useState(row.currency || 'USD')
  const [postedUrl, setPostedUrl] = useState(row.posted_url || '')
  const [postedDate, setPostedDate] = useState(row.posted_at ? row.posted_at.slice(0, 10) : '')
  const [notes, setNotes] = useState(row.brand_notes || '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await onSave({
        payout_amount: payout ? Number(payout) : null,
        charge_amount: charge ? Number(charge) : null,
        currency,
        posted_url: postedUrl.trim() || null,
        posted_at: postedDate ? new Date(postedDate).toISOString() : null,
        brand_notes: notes.trim() || null,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`Edit ${row.creator?.display_name || 'creator'}`}>
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-semibold text-gray-900">Edit {row.creator?.display_name || 'creator'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink" aria-label="Close">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-payout" className="block text-sm font-medium text-gray-700 mb-1">Payout to creator</label>
              <input
                id="edit-payout"
                type="number"
                min="0"
                value={payout}
                onChange={(e) => setPayout(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink"
              />
            </div>
            <div>
              <label htmlFor="edit-charge" className="block text-sm font-medium text-gray-700 mb-1">Charge to client</label>
              <input
                id="edit-charge"
                type="number"
                min="0"
                value={charge}
                onChange={(e) => setCharge(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink"
              />
            </div>
          </div>

          <div>
            <label htmlFor="edit-currency" className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <select
              id="edit-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink"
            >
              {['USD', 'GBP', 'EUR', 'CAD', 'AUD'].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="edit-posted-url" className="block text-sm font-medium text-gray-700 mb-1">Posted link</label>
            <input
              id="edit-posted-url"
              type="url"
              value={postedUrl}
              onChange={(e) => setPostedUrl(e.target.value)}
              placeholder="https://…"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink"
            />
          </div>

          <div>
            <label htmlFor="edit-posted-date" className="block text-sm font-medium text-gray-700 mb-1">Posted date</label>
            <input
              id="edit-posted-date"
              type="date"
              value={postedDate}
              onChange={(e) => setPostedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink"
            />
          </div>

          <div>
            <label htmlFor="edit-notes" className="block text-sm font-medium text-gray-700 mb-1">Internal notes</label>
            <textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Only visible to you"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-pink"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full px-4 py-2 bg-gradient-to-r from-brand-pink to-brand-purple text-white rounded-lg text-sm font-medium hover:shadow-lg disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditCampaignCreatorModal
