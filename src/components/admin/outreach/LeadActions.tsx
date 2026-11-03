'use client'

import { useState } from 'react'
import { Loader2, Send, X } from 'lucide-react'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import {
  BRAND_ACTIONS, CHANNEL_LABELS, CHANNELS, CREATOR_ACTIONS, mailboxState, STATUS_LABELS,
  type Channel, type LeadType,
} from '@/lib/outreach/rules'
import type { OutreachLeadRow } from '@/lib/outreach/types'
import { useOutreach } from '@/components/admin/outreach/OutreachContext'
import { buttonClass, ghostButtonClass, mailboxStateClass, selectClass } from '@/components/admin/outreach/ui'

const NEXT_ACTION: Record<LeadType, Record<string, string>> = {
  creator: { found: 'contacted', contacted: 'followed_up', followed_up: 'replied', replied: 'signed_up' },
  brand: { found: 'contacted', contacted: 'followed_up', followed_up: 'replied', replied: 'call_booked', call_booked: 'won' },
}

const LAST_SEND_KEY = 'outreach_last_send'

function readLastSend(): { channel: Channel; mailboxId: string | null } | null {
  try {
    const v = JSON.parse(localStorage.getItem(LAST_SEND_KEY) ?? 'null')
    return v && CHANNELS.includes(v.channel) ? v : null
  } catch {
    return null
  }
}

function writeLastSend(channel: Channel, mailboxId: string | null) {
  try {
    localStorage.setItem(LAST_SEND_KEY, JSON.stringify({ channel, mailboxId }))
  } catch {
    // storage blocked: the picker falls back to defaults next time
  }
}

interface SendPickerProps {
  lead: OutreachLeadRow
  action: 'contacted' | 'followed_up'
  onClose: () => void
}

// Channel + mailbox choice for a send. Mailboxes show today's count/limit,
// warn at 80% and are disabled when full (the server enforces it too).
function SendPicker({ lead, action, onClose }: SendPickerProps) {
  const { mailboxes, me, logAction } = useOutreach()
  useEscapeKey(onClose)
  const last = readLastSend()
  const active = mailboxes.filter((m) => m.is_active)
  const mine = active.filter((m) => m.owner_user_id === me?.user_id)
  const ordered = [...mine, ...active.filter((m) => m.owner_user_id !== me?.user_id)]

  const pickDefaultMailbox = () => {
    const prefer = [lead.mailbox_id, last?.mailboxId].find((id) => id && ordered.some((m) => m.id === id && m.sent_today < m.daily_limit))
    return prefer ?? ordered.find((m) => m.sent_today < m.daily_limit)?.id ?? ''
  }

  const [channel, setChannel] = useState<Channel>((lead.channel as Channel) ?? last?.channel ?? 'email')
  const [mailboxId, setMailboxId] = useState<string>(pickDefaultMailbox)
  const [saving, setSaving] = useState(false)

  const selected = ordered.find((m) => m.id === mailboxId)
  const state = selected ? mailboxState(selected.sent_today, selected.daily_limit) : null
  const blocked = channel === 'email' && (!selected || state === 'full')

  const submit = async () => {
    setSaving(true)
    const result = await logAction({ leadId: lead.lead_id, action, channel, mailboxId: channel === 'email' ? mailboxId : null })
    setSaving(false)
    if (result) {
      writeLastSend(channel, channel === 'email' ? mailboxId : null)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">
            {STATUS_LABELS[action]}: {lead.lead_id}
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white" aria-label="Close"><X className="h-4 w-4" /></button>
        </div>

        <label className="mb-1 block text-xs font-medium text-slate-400">Channel</label>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {CHANNELS.map((c) => (
            <button key={c} onClick={() => setChannel(c)}
              className={`rounded-lg border px-3 py-1.5 text-sm ${channel === c ? 'border-violet-500 bg-violet-600/20 text-white' : 'border-slate-700 text-slate-400 hover:text-white'}`}>
              {CHANNEL_LABELS[c]}
            </button>
          ))}
        </div>

        {channel === 'email' ? (
          <>
            <label className="mb-1 block text-xs font-medium text-slate-400">Mailbox</label>
            {ordered.length === 0 ? (
              <p className="text-sm text-amber-300">No active mailboxes. Ask an admin to add one.</p>
            ) : (
              <select value={mailboxId} onChange={(e) => setMailboxId(e.target.value)} className={`${selectClass} w-full`}>
                <option value="">Pick a mailbox</option>
                {ordered.map((m) => (
                  <option key={m.id} value={m.id} disabled={m.sent_today >= m.daily_limit}>
                    {m.address} ({m.sent_today}/{m.daily_limit}){m.sent_today >= m.daily_limit ? ' full' : ''}
                  </option>
                ))}
              </select>
            )}
            {selected && state && (
              <p className={`mt-2 text-xs ${mailboxStateClass(state)}`}>
                {state === 'full'
                  ? 'This mailbox reached its daily limit.'
                  : state === 'warn'
                    ? `Close to the limit: ${selected.daily_limit - selected.sent_today} sends left today.`
                    : `${selected.daily_limit - selected.sent_today} sends left today.`}
              </p>
            )}
          </>
        ) : (
          <p className="text-xs text-slate-400">DMs don&apos;t use a mailbox. They count toward your daily target.</p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className={ghostButtonClass}>Cancel</button>
          <button onClick={submit} disabled={saving || blocked} className={buttonClass}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Log {STATUS_LABELS[action].toLowerCase()}
          </button>
        </div>
      </div>
    </div>
  )
}

export function LeadActions({ lead, leadType }: { lead: OutreachLeadRow; leadType: LeadType }) {
  const { logAction } = useOutreach()
  const [picker, setPicker] = useState<'contacted' | 'followed_up' | null>(null)
  const [busy, setBusy] = useState(false)
  const actions: readonly string[] = leadType === 'creator' ? CREATOR_ACTIONS : BRAND_ACTIONS
  const next = NEXT_ACTION[leadType][lead.status]

  const run = async (action: string) => {
    if (action === 'contacted' || action === 'followed_up') {
      // A follow-up on the same mailbox/channel as the first contact is one click.
      if (action === 'followed_up' && lead.channel && (lead.channel !== 'email' || lead.mailbox_id)) {
        setBusy(true)
        const r = await logAction({ leadId: lead.lead_id, action, channel: lead.channel, mailboxId: lead.mailbox_id })
        setBusy(false)
        if (!r) {setPicker('followed_up')}
        return
      }
      setPicker(action)
      return
    }
    if (action === 'opted_out' && !window.confirm(`Mark ${lead.lead_id} as opted out? Their email and profile URL go on the do-not-contact list.`)) {
      return
    }
    setBusy(true)
    await logAction({ leadId: lead.lead_id, action })
    setBusy(false)
  }

  const sendBlocked = lead.dnc

  return (
    <div className="flex items-center gap-1.5">
      {next && !(sendBlocked && (next === 'contacted' || next === 'followed_up')) && (
        <button onClick={() => run(next)} disabled={busy}
          className="whitespace-nowrap rounded-md bg-violet-600 px-2 py-1 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-50">
          {busy ? '…' : STATUS_LABELS[next]}
        </button>
      )}
      <select
        value=""
        disabled={busy}
        onChange={(e) => { if (e.target.value) {void run(e.target.value)} }}
        className="rounded-md border border-slate-700 bg-slate-800 px-1.5 py-1 text-xs text-slate-300 focus:outline-none"
        aria-label={`More actions for ${lead.lead_id}`}
      >
        <option value="">More</option>
        {actions.map((a) => (
          <option key={a} value={a} disabled={sendBlocked && (a === 'contacted' || a === 'followed_up')}>
            {STATUS_LABELS[a]}
          </option>
        ))}
      </select>
      {picker && <SendPicker lead={lead} action={picker} onClose={() => setPicker(null)} />}
    </div>
  )
}
