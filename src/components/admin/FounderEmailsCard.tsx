'use client'

import { useState } from 'react'
import { Mail, Send } from 'lucide-react'
import { ReasonDialog } from '@/components/admin/ReasonDialog'

interface Preview {
  eligible: number
  sendableToday: number
  budgetRemaining: number
  alreadyHandled: number
  contacted: number
  optedOut: number
}

interface KindConfig {
  kind: string
  title: string
  description: string
  sendLabel: string
  audienceNoun: string
}

const KINDS: KindConfig[] = [
  {
    kind: 'creator_welcome',
    title: 'Creator welcome',
    description: 'Sent once a creator profile is complete and over the follower threshold (Settings). Profile link, bio link, badge.',
    sendLabel: 'Send to qualifying creators',
    audienceNoun: 'creators',
  },
  {
    kind: 'brand_welcome',
    title: 'Brand welcome',
    description: 'Sent when a brand signs up, with a free strategy call link. "Send" reaches brands who signed up before this email existed.',
    sendLabel: 'Send to existing brands',
    audienceNoun: 'brands',
  },
]

// Founder emails on /admin/email: per email, a count preview before the
// "send to existing accounts" backfill, and a sample test to the admin.
export function FounderEmailsCard({ onSent }: { onSent: () => void }) {
  const [loadingKind, setLoadingKind] = useState<string | null>(null)
  const [preview, setPreview] = useState<{ config: KindConfig; preview: Preview } | null>(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const flash = (setter: (v: string) => void, message: string) => {
    setter(message)
    setTimeout(() => setter(''), 6000)
  }

  const openPreview = async (config: KindConfig) => {
    setError('')
    setNotice('')
    setLoadingKind(config.kind)
    try {
      const res = await fetch(`/api/admin/founder-emails?kind=${config.kind}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {throw new Error(data?.error || 'Failed to load preview')}
      const p = data.preview as Preview
      if (p.eligible === 0) {
        flash(setNotice, `No ${config.audienceNoun} to send to (${p.alreadyHandled} already sent or queued, ${p.contacted} contacted, ${p.optedOut} opted out).`)
        return
      }
      setPreview({ config, preview: p })
    } catch (err) {
      flash(setError, err instanceof Error ? err.message : 'Failed to load preview')
    } finally {
      setLoadingKind(null)
    }
  }

  const confirmSend = async (reason: string) => {
    if (!preview) {return}
    try {
      const res = await fetch('/api/admin/founder-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: preview.config.kind, reason }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {throw new Error(data?.error || 'Failed to send')}
      const r = data.result as { sent: number; skipped: number; failed: number; leftForLater: number }
      flash(setNotice, `${preview.config.title}: ${r.sent} sent, ${r.skipped} skipped, ${r.failed} failed, ${r.leftForLater} queued for the next daily run.`)
      onSent()
    } catch (err) {
      flash(setError, err instanceof Error ? err.message : 'Failed to send')
    } finally {
      setPreview(null)
    }
  }

  const sendTest = async (config: KindConfig) => {
    setError('')
    setNotice('')
    setLoadingKind(`test:${config.kind}`)
    try {
      const res = await fetch('/api/admin/founder-emails/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: config.kind }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {throw new Error(data?.error || 'Failed to send test')}
      flash(setNotice, `Test ${config.title.toLowerCase()} sent to ${data.to}, with sample data.`)
      onSent()
    } catch (err) {
      flash(setError, err instanceof Error ? err.message : 'Failed to send test')
    } finally {
      setLoadingKind(null)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h2 className="font-semibold text-gray-800 text-sm">Founder emails</h2>
      <p className="text-xs text-gray-400 mt-0.5 mb-3">
        Once per account, in the founder&apos;s name. Over today&apos;s quota, they wait for the next daily run.
      </p>
      <div className="space-y-3">
        {KINDS.map((config) => (
          <div key={config.kind} className="flex flex-wrap items-center justify-between gap-3 py-2 border-t border-gray-50 first:border-0">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800">{config.title}</p>
              <p className="text-xs text-gray-500">{config.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => openPreview(config)}
                disabled={loadingKind !== null}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {loadingKind === config.kind ? 'Checking...' : config.sendLabel}
              </button>
              <button
                onClick={() => sendTest(config)}
                disabled={loadingKind !== null}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-violet-200 bg-white text-violet-700 text-sm font-medium hover:bg-violet-50 disabled:opacity-50"
              >
                <Mail className="w-4 h-4" />
                {loadingKind === `test:${config.kind}` ? 'Sending...' : 'Send test to me'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {preview && (
        <ReasonDialog
          title={preview.config.sendLabel}
          description={`${preview.preview.eligible} ${preview.config.audienceNoun} will get the ${preview.config.title.toLowerCase()}. ${preview.preview.sendableToday} go out now (${preview.preview.budgetRemaining} sends left in today's quota), the rest on the next daily run. Already sent or queued: ${preview.preview.alreadyHandled}. Contacted: ${preview.preview.contacted}. Opted out: ${preview.preview.optedOut}.`}
          confirmLabel={`Send to ${preview.preview.eligible}`}
          onConfirm={confirmSend}
          onClose={() => setPreview(null)}
        />
      )}
      {notice && <div className="fixed bottom-4 right-4 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-lg shadow-lg text-sm max-w-md">{notice}</div>}
      {error && <div className="fixed bottom-4 right-4 z-50 bg-red-600 text-white px-4 py-2.5 rounded-lg shadow-lg text-sm max-w-md">{error}</div>}
    </div>
  )
}
