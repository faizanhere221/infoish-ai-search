'use client'

import { useState } from 'react'
import { Ban, Check, Copy, ExternalLink as ExternalLinkIcon, Globe, Instagram, Linkedin, Mail, Music2, Twitter, Youtube } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  LINK_LABELS, STATUS_LABELS, withHttps, type LeadLink, type LinkKind, type MailboxState, type QuickOpen,
} from '@/lib/outreach/rules'

// Small shared pieces for the outreach admin pages.

const STATUS_STYLES: Record<string, string> = {
  found: 'bg-slate-700/60 text-slate-300',
  contacted: 'bg-sky-900/50 text-sky-300',
  followed_up: 'bg-indigo-900/50 text-indigo-300',
  replied: 'bg-amber-900/40 text-amber-300',
  signed_up: 'bg-emerald-900/50 text-emerald-300',
  call_booked: 'bg-teal-900/50 text-teal-300',
  won: 'bg-emerald-900/50 text-emerald-300',
  not_interested: 'bg-slate-800 text-slate-400',
  no_reply: 'bg-slate-800 text-slate-400',
  bounced: 'bg-red-950/60 text-red-300',
  opted_out: 'bg-red-950/60 text-red-300',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn('inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium', STATUS_STYLES[status] ?? 'bg-slate-800 text-slate-300')}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

export function DncBadge() {
  return (
    <span title="On the do-not-contact list" className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-red-600/20 px-2 py-0.5 text-xs font-semibold text-red-300">
      <Ban className="h-3 w-3" /> DNC
    </span>
  )
}

// Only http(s) links render as links, so a "javascript:" profile URL in a
// CSV never becomes a clickable script. Scheme-less values get https://.
export function safeHref(v: string | null | undefined): string | null {
  return v ? withHttps(v) : null
}

const LINK_ICONS: Record<LinkKind, React.ComponentType<{ className?: string }>> = {
  youtube: Youtube,
  linkedin: Linkedin,
  x: Twitter,
  instagram: Instagram,
  tiktok: Music2,
  website: Globe,
}

export function LinkIcon({ kind, className }: { kind: LinkKind; className?: string }) {
  const Icon = LINK_ICONS[kind]
  return <Icon className={cn('h-3.5 w-3.5 flex-shrink-0', className)} aria-hidden="true" />
}

// One icon per link, each opening in a new tab. Links come from
// leadLinks(), which only returns http(s) URLs.
export function LinkIcons({ links }: { links: LeadLink[] }) {
  if (links.length === 0) {return <span className="text-slate-600">–</span>}
  return (
    <span className="inline-flex items-center gap-1">
      {links.map((l) => (
        <a
          key={l.url}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          title={`${LINK_LABELS[l.kind]}: ${l.url}`}
          aria-label={`Open ${LINK_LABELS[l.kind]}`}
          className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-violet-300"
        >
          <LinkIcon kind={l.kind} />
        </a>
      ))}
    </span>
  )
}

export function ExternalLink({ href, children, className }: { href: string | null | undefined; children: React.ReactNode; className?: string }) {
  const url = safeHref(href)
  if (!url) {return <span className={className}>{children}</span>}
  return (
    <a href={url} target="_blank" rel="noopener noreferrer nofollow" className={cn('text-violet-300 hover:text-violet-200 hover:underline', className)}>
      {children}
    </a>
  )
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false // clipboard blocked: the text stays visible next to the button
  }
}

// Small copy icon; shows a tick for 1.5 s after copying.
export function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => void copyText(text).then((ok) => {
        if (!ok) {return}
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      })}
      title={copied ? 'Copied' : label}
      aria-label={label}
      className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-white"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

// The "go reply" button of a follow-up row (see followUpQuickOpen()).
// Webmail: copies the lead's email first, then opens the webmail tab.
export function QuickOpenButton({ open }: { open: QuickOpen | null }) {
  const [copied, setCopied] = useState(false)
  if (!open) {return null}
  const cls = 'inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800'
  if (open.kind === 'copy') {
    return (
      <button type="button" className={cls} onClick={() => void copyText(open.copy).then((ok) => {
        if (!ok) {return}
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      })}>
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />} {copied ? 'Copied' : open.label}
      </button>
    )
  }
  const url = withHttps(open.url)
  if (!url) {return null}
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cls}
      // The copy runs on the same click, before the new tab takes focus.
      onClick={open.kind === 'webmail' ? () => { void copyText(open.copy) } : undefined}
      title={open.kind === 'webmail' ? `Copies ${open.copy}, then opens the webmail` : url}
    >
      {open.kind === 'profile' ? <ExternalLinkIcon className="h-3.5 w-3.5" /> : <Mail className="h-3.5 w-3.5" />} {open.label}
    </a>
  )
}

export function formatCount(n: number | null | undefined): string {
  if (n === null || n === undefined) {return ''}
  if (n >= 1_000_000) {return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`}
  if (n >= 1_000) {return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`}
  return String(n)
}

export function formatPct(r: number | null | undefined): string {
  return r === null || r === undefined ? '–' : `${(r * 100).toFixed(1)}%`
}

export function ProgressBar({ value, max, state }: { value: number; max: number; state?: 'ok' | 'warn' | 'bad' }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const color = state === 'bad' ? 'bg-red-500' : state === 'warn' ? 'bg-amber-500' : 'bg-violet-500'
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
      <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function mailboxStateClass(state: MailboxState): string {
  return state === 'full' ? 'text-red-300' : state === 'warn' ? 'text-amber-300' : 'text-slate-300'
}

export function Card({ title, actions, children, className }: { title?: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-xl border border-slate-800 bg-slate-900', className)}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
          {title && <h2 className="text-sm font-semibold text-white">{title}</h2>}
          {actions}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  )
}

export const inputClass =
  'w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none'
export const selectClass =
  'rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-2 text-sm text-white focus:border-violet-500 focus:outline-none'
export const buttonClass =
  'inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50'
export const ghostButtonClass =
  'inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50'
