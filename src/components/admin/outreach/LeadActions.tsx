'use client'

import { useEffect, useState } from 'react'
import { Loader2, Send, X } from 'lucide-react'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import {
  BRAND_ACTIONS, CHANNEL_LABELS, CHANNELS, CONTACT_ACTIONS, contactName, CREATOR_ACTIONS, karachiSlotLabel, mailboxState,
  STATUS_LABELS, type Channel, type LeadType,
} from '@/lib/outreach/rules'
import type { BrandContact, OutreachLeadRow, OutreachMailboxWithUsage } from '@/lib/outreach/types'
import { readJson, useOutreach } from '@/components/admin/outreach/OutreachContext'
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

// "3/30 in 15 h" (rolling window) or "3/30 today" (before the migration).
export function mailboxUsageLabel(m: OutreachMailboxWithUsage): string {
  return `${m.sent_today}/${m.daily_limit}${m.window_hours ? ` in ${m.window_hours} h` : ' today'}`
}

export function mailboxFullLabel(m: OutreachMailboxWithUsage): string {
  const at = karachiSlotLabel(m.next_free_at)
  return at ? `Full. Next slot frees at ${at} (Karachi).` : 'This mailbox reached its limit.'
}

const isContactAction = (a: string) => (CONTACT_ACTIONS as readonly string[]).includes(a)

// Which contact the server would pick (same order as outreach_log_action).
function defaultContact(contacts: BrandContact[], action: string): string {
  const ok = (c: BrandContact) => action === 'contacted' ? c.status === 'found'
    : action === 'followed_up' ? c.status === 'contacted'
      : action === 'replied' ? ['contacted', 'followed_up', 'no_reply'].includes(c.status)
        : !['bounced', 'opted_out', 'not_interested'].includes(c.status)
  const list = contacts.filter(ok).sort((a, b) => Number(b.is_primary) - Number(a.is_primary)
    || (a.follow_up_date ?? '9999').localeCompare(b.follow_up_date ?? '9999'))
  return list[0]?.id ?? contacts[0]?.id ?? ''
}

interface ActionDialogProps {
  lead: OutreachLeadRow
  leadType: LeadType
  action: string
  contact?: BrandContact | null // fixed contact (from the contacts list)
  onClose: () => void
}

// One action that needs a choice: channel + mailbox for a send (mailboxes
// show their usage, warn at 80% and are disabled when full; the server
// enforces it too), and for brands with several contacts, which contact.
export function ActionDialog({ lead, leadType, action, contact, onClose }: ActionDialogProps) {
  const { mailboxes, me, logAction } = useOutreach()
  useEscapeKey(onClose)
  const isSend = action === 'contacted' || action === 'followed_up'
  const needsContact = leadType === 'brand' && isContactAction(action) && !contact && (lead.contacts?.count ?? 0) > 1
  const last = readLastSend()
  const active = mailboxes.filter((m) => m.is_active)
  const mine = active.filter((m) => m.owner_user_id === me?.user_id)
  const ordered = [...mine, ...active.filter((m) => m.owner_user_id !== me?.user_id)]
  const startChannel = (contact?.channel ?? lead.channel) as Channel | null

  const pickDefaultMailbox = () => {
    const prefer = [contact?.mailbox_id, lead.mailbox_id, last?.mailboxId].find((id) => id && ordered.some((m) => m.id === id && m.sent_today < m.daily_limit))
    return prefer ?? ordered.find((m) => m.sent_today < m.daily_limit)?.id ?? ''
  }

  const [channel, setChannel] = useState<Channel>(startChannel ?? last?.channel ?? 'email')
  const [mailboxId, setMailboxId] = useState<string>(pickDefaultMailbox)
  const [contacts, setContacts] = useState<BrandContact[]>([])
  const [contactId, setContactId] = useState(contact?.id ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!needsContact) {return}
    void (async () => {
      const res = await fetch(`/api/admin/outreach/leads/brands/${encodeURIComponent(lead.lead_id)}/contacts`)
      const data = await readJson<{ contacts: BrandContact[] }>(res)
      if (res.ok) {
        setContacts(data.contacts)
        setContactId(defaultContact(data.contacts, action))
      }
    })()
  }, [needsContact, lead.lead_id, action])

  const selected = ordered.find((m) => m.id === mailboxId)
  const state = selected ? mailboxState(selected.sent_today, selected.daily_limit) : null
  const blocked = (isSend && channel === 'email' && (!selected || state === 'full')) || (needsContact && !contactId)
  const chosenContact = contact ?? contacts.find((c) => c.id === contactId) ?? null

  const submit = async () => {
    setSaving(true)
    const singleContact = leadType === 'brand' && lead.contacts?.count === 1 ? lead.contacts.primary?.id : undefined
    const result = await logAction({
      leadId: lead.lead_id,
      action,
      channel: isSend ? channel : null,
      mailboxId: isSend && channel === 'email' ? mailboxId : null,
      contactId: contact?.id ?? (needsContact ? contactId : singleContact) ?? null,
    })
    setSaving(false)
    if (result) {
      if (isSend) {writeLastSend(channel, channel === 'email' ? mailboxId : null)}
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">
            {STATUS_LABELS[action]}: {lead.lead_id}{chosenContact ? `, ${contactName(chosenContact)}` : ''}
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white" aria-label="Close"><X className="h-4 w-4" /></button>
        </div>

        {needsContact && (
          <>
            <label className="mb-1 block text-xs font-medium text-slate-400">Contact</label>
            <select value={contactId} onChange={(e) => setContactId(e.target.value)} className={`${selectClass} mb-4 w-full`}>
              {contacts.length === 0 && <option value="">Loading contacts…</option>}
              {contacts.map((c) => (
                <option key={c.id} value={c.id} disabled={action === 'followed_up' && !c.date_contacted}>
                  {contactName(c)}{c.title ? `, ${c.title}` : ''} ({STATUS_LABELS[c.status] ?? c.status}){c.is_primary ? ', primary' : ''}
                </option>
              ))}
            </select>
          </>
        )}

        {isSend && (
          <>
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
                        {m.address} ({mailboxUsageLabel(m)}){m.sent_today >= m.daily_limit ? ` full until ${karachiSlotLabel(m.next_free_at) ?? 'later'}` : ''}
                      </option>
                    ))}
                  </select>
                )}
                {selected && state && (
                  <p className={`mt-2 text-xs ${mailboxStateClass(state)}`}>
                    {state === 'full'
                      ? mailboxFullLabel(selected)
                      : state === 'warn'
                        ? `Close to the limit: ${selected.daily_limit - selected.sent_today} sends left${selected.window_hours ? ` in the ${selected.window_hours}-hour window` : ' today'}.`
                        : `${selected.daily_limit - selected.sent_today} sends left${selected.window_hours ? ` in the ${selected.window_hours}-hour window` : ' today'}.`}
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-slate-400">DMs don&apos;t use a mailbox. They count toward your daily target.</p>
            )}
          </>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className={ghostButtonClass}>Cancel</button>
          <button onClick={() => void submit()} disabled={saving || blocked} className={buttonClass}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Log {STATUS_LABELS[action].toLowerCase()}
          </button>
        </div>
      </div>
    </div>
  )
}

interface LeadActionsProps {
  lead: OutreachLeadRow
  leadType: LeadType
  // Status cell editing: just the action select, opened and focused.
  // Status only changes through actions so mailbox limits, DNC and undo apply.
  selectOnly?: boolean
  onDone?: () => void
}

export function LeadActions({ lead, leadType, selectOnly, onDone }: LeadActionsProps) {
  const { logAction } = useOutreach()
  const [dialog, setDialog] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const actions: readonly string[] = leadType === 'creator' ? CREATOR_ACTIONS : BRAND_ACTIONS
  const next = NEXT_ACTION[leadType][lead.status]
  const contactCount = leadType === 'brand' ? lead.contacts?.count ?? 0 : 0
  // A brand with one contact: that contact. Several: the dialog asks.
  const singleContact = contactCount === 1 ? lead.contacts?.primary?.id ?? null : null

  // true = the action ran (or needs no dialog); false = a dialog opened
  const run = async (action: string): Promise<boolean> => {
    const pickContact = contactCount > 1 && isContactAction(action)
    if (action === 'contacted' || action === 'followed_up') {
      // A follow-up on the same mailbox/channel as the first contact is one click.
      if (action === 'followed_up' && !pickContact && lead.channel && (lead.channel !== 'email' || lead.mailbox_id)) {
        setBusy(true)
        const r = await logAction({ leadId: lead.lead_id, action, channel: lead.channel, mailboxId: lead.mailbox_id, contactId: singleContact })
        setBusy(false)
        if (!r) {setDialog('followed_up')}
        return !!r
      }
      setDialog(action)
      return false
    }
    if (pickContact) {
      setDialog(action)
      return false
    }
    if (action === 'opted_out' && !window.confirm(`Mark ${lead.lead_id} as opted out? ${singleContact ? 'The contact\'s email goes' : 'Their email and profile URL go'} on the do-not-contact list.`)) {
      return true
    }
    setBusy(true)
    await logAction({ leadId: lead.lead_id, action, contactId: isContactAction(action) ? singleContact : null })
    setBusy(false)
    return true
  }

  const sendBlocked = lead.dnc

  if (selectOnly) {
    return (
      <>
        <select
          autoFocus
          value=""
          disabled={busy}
          onChange={(e) => {
            const v = e.target.value
            if (!v) {return}
            void run(v).then((done) => { if (done) {onDone?.()} })
          }}
          onKeyDown={(e) => { if (e.key === 'Escape') {onDone?.()} }}
          onBlur={() => { if (!dialog) {onDone?.()} }}
          className="rounded-md border border-violet-500 bg-slate-800 px-1.5 py-1 text-xs text-slate-200 focus:outline-none"
          aria-label={`Change status of ${lead.lead_id}`}
        >
          <option value="">{STATUS_LABELS[lead.status] ?? lead.status}: pick an action</option>
          {actions.map((a) => (
            <option key={a} value={a} disabled={sendBlocked && (a === 'contacted' || a === 'followed_up')}>
              {STATUS_LABELS[a]}
            </option>
          ))}
        </select>
        {dialog && <ActionDialog lead={lead} leadType={leadType} action={dialog} onClose={() => { setDialog(null); onDone?.() }} />}
      </>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      {next && !(sendBlocked && (next === 'contacted' || next === 'followed_up')) && (
        <button onClick={() => void run(next)} disabled={busy}
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
      {dialog && <ActionDialog lead={lead} leadType={leadType} action={dialog} onClose={() => setDialog(null)} />}
    </div>
  )
}
