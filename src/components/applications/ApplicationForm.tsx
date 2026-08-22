'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import type { Campaign } from '@/types/campaigns'
import { formatBudget } from '@/components/campaigns/utils'

const MIN_COVER_MESSAGE_LENGTH = 50

export interface ApplicationFormValues {
  proposed_rate: number | null
  cover_message: string
  pitch: string | null
}

interface ApplicationFormProps {
  campaign: Campaign
  submitting: boolean
  submitError: string | null
  onSubmit: (values: ApplicationFormValues) => void
}

export default function ApplicationForm({ campaign, submitting, submitError, onSubmit }: ApplicationFormProps) {
  const [proposedRate, setProposedRate] = useState('')
  const [coverMessage, setCoverMessage] = useState('')
  const [pitch, setPitch] = useState('')
  const [coverMessageError, setCoverMessageError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const trimmedCoverMessage = coverMessage.trim()
    if (trimmedCoverMessage.length < MIN_COVER_MESSAGE_LENGTH) {
      setCoverMessageError(`Cover message must be at least ${MIN_COVER_MESSAGE_LENGTH} characters`)
      return
    }
    setCoverMessageError(null)

    onSubmit({
      proposed_rate: proposedRate ? parseInt(proposedRate, 10) : null,
      cover_message: trimmedCoverMessage,
      pitch: pitch.trim() || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Proposed Rate (USD)</label>
        <input
          type="number"
          min={0}
          value={proposedRate}
          onChange={(e) => setProposedRate(e.target.value)}
          placeholder="e.g. 750"
          className="w-full sm:w-64 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <p className="mt-1.5 text-xs text-gray-500">
          Campaign budget: <span className="font-medium text-gray-700">{formatBudget(campaign)}</span>
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Cover Message *</label>
        <textarea
          value={coverMessage}
          onChange={(e) => {
            setCoverMessage(e.target.value)
            if (coverMessageError) setCoverMessageError(null)
          }}
          placeholder="Introduce yourself and why you're a good fit..."
          rows={6}
          maxLength={5000}
          className={`w-full px-4 py-3 border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 ${
            coverMessageError ? 'border-red-300' : 'border-gray-200'
          }`}
        />
        <div className="flex items-center justify-between mt-1.5">
          {coverMessageError ? (
            <p className="text-sm text-red-600">{coverMessageError}</p>
          ) : (
            <span />
          )}
          <p className="text-xs text-gray-400">{coverMessage.trim().length}/{MIN_COVER_MESSAGE_LENGTH} min</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Pitch</label>
        <textarea
          value={pitch}
          onChange={(e) => setPitch(e.target.value)}
          placeholder="How would you approach this campaign?"
          rows={4}
          maxLength={5000}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      {submitError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{submitError}</div>
      )}

      <div className="flex items-center gap-3">
        <Link
          href={`/campaigns/${campaign.id}`}
          className="px-4 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 disabled:opacity-50"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          Submit Application
        </button>
      </div>
    </form>
  )
}
