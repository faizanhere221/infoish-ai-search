'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, Check, Loader2, RefreshCw, X } from 'lucide-react'
import { formatMoney, formatDate } from '@/components/campaigns/utils'
import { OFFER_STATUS_LABELS, CREATOR_AVAILABILITY_LABELS, type CampaignOffer, type CreatorAvailabilityStatus } from '@/types/campaigns'

interface OfferTabProps {
  campaignCreatorId: string
  creatorId: string
  actorType: 'brand' | 'creator'
  token: string | null
  currency: string
  onOfferAccepted: () => void
}

interface CreatorRateInfo {
  min_budget: number | null
  availability_status: CreatorAvailabilityStatus
  min_lead_days: number
  creator_services: { title: string; price: number }[]
}

interface OfferFormState {
  amount: string
  deliverables_summary: string
  publish_by: string
  revisions_included: string
  usage_rights: string
  message: string
}

const EMPTY_FORM: OfferFormState = {
  amount: '', deliverables_summary: '', publish_by: '', revisions_included: '1', usage_rights: '', message: '',
}

export function OfferTab({ campaignCreatorId, creatorId, actorType, token, currency, onOfferAccepted }: OfferTabProps) {
  const [offers, setOffers] = useState<CampaignOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [rateInfo, setRateInfo] = useState<CreatorRateInfo | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<OfferFormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [counteringOfferId, setCounteringOfferId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const authHeader = useCallback((): Record<string, string> => (token ? { Authorization: `Bearer ${token}` } : {}), [token])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [offersRes, creatorRes] = await Promise.all([
        fetch(`/api/campaign-creators/${campaignCreatorId}/offers`, { headers: authHeader() }),
        actorType === 'brand' ? fetch(`/api/creators/${creatorId}`) : Promise.resolve(null),
      ])
      if (offersRes.ok) {
        const data = await offersRes.json()
        setOffers(data.offers || [])
      }
      if (creatorRes?.ok) {
        const data = await creatorRes.json()
        setRateInfo({
          min_budget: data.creator?.min_budget ?? null,
          availability_status: data.creator?.availability_status ?? 'open',
          min_lead_days: data.creator?.min_lead_days ?? 0,
          creator_services: (data.creator?.creator_services || []).map((s: { title: string; price: number }) => ({ title: s.title, price: s.price })),
        })
      }
    } finally {
      setLoading(false)
    }
  }, [campaignCreatorId, creatorId, actorType, authHeader])

  useEffect(() => { load() }, [load])

  const pendingOffer = offers.find((o) => o.status === 'pending')
  const isPendingSentByMe = pendingOffer?.from_party === actorType

  async function submitOffer(endpoint: string) {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(form.amount),
          currency,
          deliverables_summary: form.deliverables_summary || null,
          publish_by: form.publish_by || null,
          revisions_included: form.revisions_included ? Number(form.revisions_included) : 0,
          usage_rights: form.usage_rights || null,
          message: form.message || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to send offer')
        return
      }
      setForm(EMPTY_FORM)
      setShowForm(false)
      setCounteringOfferId(null)
      await load()
    } finally {
      setSubmitting(false)
    }
  }

  async function act(offerId: string, action: 'accept' | 'decline' | 'withdraw') {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/campaign-creators/${campaignCreatorId}/offers/${offerId}/${action}`, {
        method: 'POST',
        headers: authHeader(),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || `Failed to ${action} offer`)
        return
      }
      await load()
      if (action === 'accept') {onOfferAccepted()}
    } finally {
      setSubmitting(false)
    }
  }

  const amountNumber = Number(form.amount) || 0
  const belowListedRate = rateInfo && amountNumber > 0 &&
    rateInfo.creator_services.some((s) => amountNumber < s.price)
  const leadTimeWarning = rateInfo && form.publish_by && rateInfo.min_lead_days > 0 &&
    (new Date(form.publish_by).getTime() - Date.now()) / 86_400_000 < rateInfo.min_lead_days

  if (loading) {
    return <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {rateInfo && actorType === 'brand' && rateInfo.availability_status !== 'open' && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          This creator is marked &quot;{CREATOR_AVAILABILITY_LABELS[rateInfo.availability_status]}&quot;.
        </div>
      )}

      {pendingOffer ? (
        <div className="border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase">
              {pendingOffer.from_party === actorType ? 'Your pending offer' : 'Their offer'}
            </span>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">Pending</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatMoney(pendingOffer.amount, pendingOffer.currency)}</p>
          {pendingOffer.deliverables_summary && <p className="text-sm text-gray-600 mt-1">{pendingOffer.deliverables_summary}</p>}
          <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-gray-500">
            {pendingOffer.publish_by && <span>Publish by: {formatDate(pendingOffer.publish_by)}</span>}
            {pendingOffer.revisions_included > 0 && <span>{pendingOffer.revisions_included} revisions included</span>}
            {pendingOffer.usage_rights && <span className="col-span-2">Usage: {pendingOffer.usage_rights}</span>}
          </div>
          {pendingOffer.message && <p className="text-sm text-gray-600 mt-2 italic">&quot;{pendingOffer.message}&quot;</p>}

          <div className="flex gap-2 mt-4">
            {isPendingSentByMe ? (
              <button
                onClick={() => act(pendingOffer.id, 'withdraw')}
                disabled={submitting}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Withdraw
              </button>
            ) : (
              <>
                <button
                  onClick={() => act(pendingOffer.id, 'accept')}
                  disabled={submitting}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-brand-pink to-brand-purple text-white rounded-lg text-sm font-medium hover:shadow-lg disabled:opacity-50"
                >
                  <Check className="w-4 h-4" /> Accept
                </button>
                <button
                  onClick={() => { setCounteringOfferId(pendingOffer.id); setForm({ ...EMPTY_FORM, amount: String(pendingOffer.amount) }); setShowForm(true) }}
                  disabled={submitting}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4" /> Counter
                </button>
                <button
                  onClick={() => act(pendingOffer.id, 'decline')}
                  disabled={submitting}
                  className="px-3 py-2 border border-gray-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={() => { setForm(EMPTY_FORM); setCounteringOfferId(null); setShowForm(true) }}
          className="w-full px-4 py-2.5 bg-gradient-to-r from-brand-pink to-brand-purple text-white rounded-lg text-sm font-medium hover:shadow-lg"
        >
          {actorType === 'brand' ? 'Send an offer' : 'Propose your rate'}
        </button>
      )}

      {showForm && (
        <div className="border border-gray-200 rounded-xl p-4 space-y-3">
          <div>
            <label htmlFor="offer-amount" className="block text-sm font-medium text-gray-700 mb-1">Amount ({currency})</label>
            <input
              id="offer-amount"
              type="number"
              min="0"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink"
            />
            {belowListedRate && (
              <p className="flex items-center gap-1 text-xs text-amber-600 mt-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Below this creator&apos;s listed rate for at least one service.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="offer-summary" className="block text-sm font-medium text-gray-700 mb-1">Deliverables summary</label>
            <textarea
              id="offer-summary"
              value={form.deliverables_summary}
              onChange={(e) => setForm((f) => ({ ...f, deliverables_summary: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-pink"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="offer-publish-by" className="block text-sm font-medium text-gray-700 mb-1">Publish by</label>
              <input
                id="offer-publish-by"
                type="date"
                value={form.publish_by}
                onChange={(e) => setForm((f) => ({ ...f, publish_by: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink"
              />
              {leadTimeWarning && (
                <p className="flex items-center gap-1 text-xs text-amber-600 mt-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Sooner than this creator&apos;s {rateInfo?.min_lead_days}-day lead time.
                </p>
              )}
            </div>
            <div>
              <label htmlFor="offer-revisions" className="block text-sm font-medium text-gray-700 mb-1">Revisions included</label>
              <input
                id="offer-revisions"
                type="number"
                min="0"
                value={form.revisions_included}
                onChange={(e) => setForm((f) => ({ ...f, revisions_included: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink"
              />
            </div>
          </div>

          <div>
            <label htmlFor="offer-usage" className="block text-sm font-medium text-gray-700 mb-1">Usage rights</label>
            <input
              id="offer-usage"
              value={form.usage_rights}
              onChange={(e) => setForm((f) => ({ ...f, usage_rights: e.target.value }))}
              placeholder="e.g. 30 days organic, no paid ads"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink"
            />
          </div>

          <div>
            <label htmlFor="offer-message" className="block text-sm font-medium text-gray-700 mb-1">Message (optional)</label>
            <textarea
              id="offer-message"
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-pink"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => { setShowForm(false); setCounteringOfferId(null) }}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => submitOffer(
                counteringOfferId
                  ? `/api/campaign-creators/${campaignCreatorId}/offers/${counteringOfferId}/counter`
                  : `/api/campaign-creators/${campaignCreatorId}/offers`
              )}
              disabled={submitting || !form.amount}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-brand-pink to-brand-purple text-white rounded-lg text-sm font-medium hover:shadow-lg disabled:opacity-50"
            >
              {submitting ? 'Sending…' : counteringOfferId ? 'Send counter' : 'Send offer'}
            </button>
          </div>
        </div>
      )}

      {offers.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Offer history</p>
          <div className="space-y-2">
            {offers.map((offer) => (
              <div key={offer.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0">
                <div>
                  <span className="font-medium text-gray-900">{formatMoney(offer.amount, offer.currency)}</span>
                  <span className="text-gray-400 ml-2">from {offer.from_party}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{formatDate(offer.created_at)}</span>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">{OFFER_STATUS_LABELS[offer.status]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default OfferTab
