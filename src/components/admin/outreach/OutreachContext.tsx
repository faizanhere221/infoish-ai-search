'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { CheckCircle, AlertTriangle, Undo2, X } from 'lucide-react'
import { STATUS_LABELS, UNDO_WINDOW_MS } from '@/lib/outreach/rules'
import type { ActionResult, OutreachMailboxWithUsage, OutreachTeamMember } from '@/lib/outreach/types'

// Shared state for every /admin/outreach page: who I am, the team (owner
// names), mailboxes with today's usage, toasts, and the undo bar for the
// last one-click action.

export interface Me {
  user_id: string
  role: string
  is_admin: boolean
  is_super_admin: boolean
}

interface Toast {
  id: number
  kind: 'success' | 'error' | 'warn'
  message: string
}

interface UndoEntry {
  activityId: string
  leadId: string
  label: string
  expiresAt: number
}

interface OutreachContextValue {
  me: Me | null
  team: OutreachTeamMember[]
  mailboxes: OutreachMailboxWithUsage[]
  ownerName: (userId: string | null) => string
  refreshTeam: () => Promise<void>
  refreshMailboxes: () => Promise<void>
  toast: (kind: Toast['kind'], message: string) => void
  logAction: (input: { leadId: string; action: string; mailboxId?: string | null; channel?: string | null }) => Promise<ActionResult | null>
  // Bumped after every action/undo so pages reload their data.
  version: number
  bump: () => void
}

const Ctx = createContext<OutreachContextValue | null>(null)

export function useOutreach(): OutreachContextValue {
  const v = useContext(Ctx)
  if (!v) {throw new Error('useOutreach outside OutreachProvider')}
  return v
}

export async function readJson<T>(res: Response): Promise<T & { error?: string }> {
  try {
    return (await res.json()) as T & { error?: string }
  } catch {
    return { error: `Request failed (${res.status})` } as T & { error?: string }
  }
}

export function OutreachProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null)
  const [team, setTeam] = useState<OutreachTeamMember[]>([])
  const [mailboxes, setMailboxes] = useState<OutreachMailboxWithUsage[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])
  const [undo, setUndo] = useState<UndoEntry | null>(null)
  const [version, setVersion] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  const toastId = useRef(0)

  const toast = useCallback((kind: Toast['kind'], message: string) => {
    const id = ++toastId.current
    setToasts((t) => [...t, { id, kind, message }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'error' ? 7000 : 4500)
  }, [])

  const refreshTeam = useCallback(async () => {
    const res = await fetch('/api/admin/outreach/team')
    const data = await readJson<{ team: OutreachTeamMember[]; me: Me }>(res)
    if (res.ok) {
      setTeam(data.team)
      setMe(data.me)
    }
  }, [])

  const refreshMailboxes = useCallback(async () => {
    const res = await fetch('/api/admin/outreach/mailboxes')
    const data = await readJson<{ mailboxes: OutreachMailboxWithUsage[] }>(res)
    if (res.ok) {setMailboxes(data.mailboxes)}
  }, [])

  useEffect(() => {
    void refreshTeam()
    void refreshMailboxes()
  }, [refreshTeam, refreshMailboxes])

  // Ticks the undo countdown and drops the entry once the window closes.
  useEffect(() => {
    if (!undo) {return}
    const t = setInterval(() => {
      setNow(Date.now())
      if (Date.now() >= undo.expiresAt) {setUndo(null)}
    }, 1000)
    return () => clearInterval(t)
  }, [undo])

  const bump = useCallback(() => setVersion((v) => v + 1), [])

  const ownerName = useCallback(
    (userId: string | null) => (userId ? team.find((t) => t.user_id === userId)?.display_name ?? 'Unknown' : 'Unassigned'),
    [team],
  )

  const logAction = useCallback<OutreachContextValue['logAction']>(async ({ leadId, action, mailboxId, channel }) => {
    const res = await fetch('/api/admin/outreach/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: leadId, action, mailbox_id: mailboxId ?? null, channel: channel ?? null }),
    })
    const data = await readJson<{ result: ActionResult; dmWarning: { channel: string; sent: number; limit: number } | null }>(res)
    if (!res.ok) {
      toast('error', data.error ?? 'Action failed')
      return null
    }
    const label = `${leadId} marked ${STATUS_LABELS[action]?.toLowerCase() ?? action}`
    setUndo({ activityId: data.result.activity_id, leadId, label, expiresAt: Date.now() + UNDO_WINDOW_MS })
    setNow(Date.now())
    const r = data.result
    if (r.mailbox_limit && r.mailbox_sent_today !== null && r.mailbox_sent_today >= Math.ceil(r.mailbox_limit * 0.8)) {
      toast('warn', `Mailbox at ${r.mailbox_sent_today}/${r.mailbox_limit} sends today.`)
    }
    if (data.dmWarning) {
      toast('warn', `${data.dmWarning.sent} ${data.dmWarning.channel} messages today. Your soft limit is ${data.dmWarning.limit}.`)
    }
    bump()
    void refreshMailboxes()
    return r
  }, [toast, bump, refreshMailboxes])

  const runUndo = async () => {
    if (!undo) {return}
    const entry = undo
    setUndo(null)
    const res = await fetch('/api/admin/outreach/actions/undo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activity_id: entry.activityId }),
    })
    const data = await readJson<{ message: string }>(res)
    if (!res.ok) {
      toast('error', data.error ?? 'Undo failed')
      return
    }
    toast('success', `Undone: ${entry.label}`)
    bump()
    void refreshMailboxes()
  }

  const secondsLeft = undo ? Math.max(Math.ceil((undo.expiresAt - now) / 1000), 0) : 0

  return (
    <Ctx.Provider value={{ me, team, mailboxes, ownerName, refreshTeam, refreshMailboxes, toast, logAction, version, bump }}>
      {children}

      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-96 max-w-[calc(100vw-2rem)] flex-col gap-2">
        {undo && (
          <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-200 shadow-2xl">
            <CheckCircle className="h-4 w-4 flex-shrink-0 text-emerald-400" />
            <span className="flex-1 truncate">{undo.label}</span>
            <button onClick={runUndo} className="inline-flex items-center gap-1 rounded-md bg-slate-700 px-2 py-1 text-xs font-medium text-white hover:bg-slate-600">
              <Undo2 className="h-3.5 w-3.5" /> Undo {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
            </button>
            <button onClick={() => setUndo(null)} className="text-slate-500 hover:text-slate-300" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {toasts.map((t) => (
          <div key={t.id} className={`pointer-events-auto flex items-start gap-2 rounded-xl border px-4 py-3 text-sm shadow-2xl ${
            t.kind === 'error' ? 'border-red-800 bg-red-950 text-red-200' : t.kind === 'warn' ? 'border-amber-800 bg-amber-950 text-amber-200' : 'border-emerald-800 bg-emerald-950 text-emerald-200'
          }`}>
            {t.kind === 'success' ? <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}
