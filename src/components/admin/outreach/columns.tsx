'use client'

import { COUNTRIES, NICHES, PLATFORMS, platformName } from '@/utils/constants'
import { CHANNEL_LABELS, CHANNELS, type LeadType } from '@/lib/outreach/rules'
import type { OutreachLeadRow, OutreachTeamMember } from '@/lib/outreach/types'
import type { CellEditor } from '@/components/admin/outreach/EditableCell'
import { ExternalLink, formatCount, StatusBadge } from '@/components/admin/outreach/ui'

// Column definitions for the creator and brand tables. `field` is what a
// cell edit PATCHes; columns without one are read-only. Extra columns
// (batch, tags, ...) read and write lead.extra[key].

export type ColumnKind =
  | 'text' | 'email' | 'url' | 'int' | 'number' | 'platform' | 'country' | 'niche' | 'channel'
  | 'owner' | 'bool' | 'status' | 'date' | 'extra'

export interface LeadColumn {
  id: string
  label: string
  kind: ColumnKind
  field?: string
  extraKey?: string
  sort?: string
  defaultVisible?: boolean
}

const col = (id: string, label: string, kind: ColumnKind, opts: Partial<LeadColumn> = {}): LeadColumn => ({
  id, label, kind, field: kind === 'date' ? undefined : id, ...opts,
})

export const CREATOR_COLUMNS: LeadColumn[] = [
  col('name', 'Name', 'text', { sort: 'name', defaultVisible: true }),
  col('profile_url', 'Profile URL', 'url'),
  col('platform', 'Platform', 'platform', { sort: 'platform', defaultVisible: true }),
  col('country', 'Country', 'country', { sort: 'country', defaultVisible: true }),
  col('niche', 'Niche', 'niche', { sort: 'niche', defaultVisible: true }),
  col('subscribers', 'Subs', 'int', { sort: 'subscribers', defaultVisible: true }),
  col('avg_views', 'Avg views', 'int', { sort: 'avg_views', defaultVisible: true }),
  col('engagement_pct', 'Eng %', 'number', { sort: 'engagement_pct' }),
  col('does_sponsorships', 'Sponsors?', 'bool'),
  col('sponsor_brands', 'Sponsor brands', 'text'),
  col('email', 'Email', 'email', { defaultVisible: true }),
  col('instagram', 'Instagram', 'url'),
  col('x', 'X', 'url'),
  col('linkedin', 'LinkedIn', 'url'),
  col('tiktok', 'TikTok', 'url'),
  col('website', 'Website', 'url'),
  col('owner_user_id', 'Owner', 'owner', { defaultVisible: true }),
  col('channel', 'Channel', 'channel'),
  col('status', 'Status', 'status', { sort: 'status', defaultVisible: true, field: undefined }),
  col('date_contacted', 'Contacted', 'date', { sort: 'date_contacted', defaultVisible: true }),
  col('follow_up_date', 'Follow-up', 'date', { sort: 'follow_up_date', defaultVisible: true }),
  col('notes', 'Notes', 'text'),
  col('source', 'Source', 'text'),
]

export const BRAND_COLUMNS: LeadColumn[] = [
  col('company', 'Company', 'text', { sort: 'company', defaultVisible: true }),
  col('website', 'Website', 'url'),
  col('domain', 'Domain', 'text', { defaultVisible: true }),
  col('country', 'Country', 'country', { sort: 'country', defaultVisible: true }),
  col('product', 'Product', 'text'),
  col('team_size', 'Team', 'text', { sort: 'team_size' }),
  col('why_them', 'Why them', 'text'),
  col('score', 'Score', 'number', { sort: 'score', defaultVisible: true }),
  col('contact_name', 'Contact', 'text', { defaultVisible: true }),
  col('role', 'Role', 'text', { defaultVisible: true }),
  col('email', 'Email', 'email', { defaultVisible: true }),
  col('linkedin', 'LinkedIn', 'url'),
  col('owner_user_id', 'Owner', 'owner', { defaultVisible: true }),
  col('channel', 'Channel', 'channel'),
  col('status', 'Status', 'status', { sort: 'status', defaultVisible: true, field: undefined }),
  col('date_contacted', 'Contacted', 'date', { sort: 'date_contacted', defaultVisible: true }),
  col('follow_up_date', 'Follow-up', 'date', { sort: 'follow_up_date', defaultVisible: true }),
  col('notes', 'Notes', 'text'),
  col('source', 'Source', 'text'),
]

// Extra fields the import files bring in; any other key found on the page
// is offered in the column picker too.
export const KNOWN_EXTRAS: Record<LeadType, string[]> = {
  creator: ['date_found', 'found_by', 'views_to_subs', 'days_since_last_upload', 'uploads_last_30d', 'recent_video_titles'],
  brand: ['batch', 'batch_year', 'industry', 'locations', 'tags', 'is_hiring', 'sponsors_creators', 'sponsor_creators', 'yc_url', 'creators_count', 'first_seen'],
}

export function extraColumn(key: string): LeadColumn {
  return { id: `extra.${key}`, label: key.replace(/_/g, ' '), kind: 'extra', field: 'extra', extraKey: key }
}

export function cellValue(lead: OutreachLeadRow, c: LeadColumn): string {
  const raw = c.kind === 'extra' ? lead.extra?.[c.extraKey ?? ''] : (lead as unknown as Record<string, unknown>)[c.id]
  if (raw === null || raw === undefined) {return ''}
  if (c.kind === 'bool') {return raw === true ? 'true' : raw === false ? 'false' : ''}
  return String(raw)
}

export function cellDisplay(lead: OutreachLeadRow, c: LeadColumn, ownerName: (id: string | null) => string): React.ReactNode {
  const v = cellValue(lead, c)
  switch (c.kind) {
    case 'status': return <StatusBadge status={lead.status} />
    case 'owner': return ownerName(lead.owner_user_id)
    case 'platform': return v ? (platformName(v) === 'Other platform' ? v : platformName(v)) : <Empty />
    case 'channel': return v ? CHANNEL_LABELS[v as keyof typeof CHANNEL_LABELS] ?? v : <Empty />
    case 'bool': return v === 'true' ? 'Yes' : v === 'false' ? 'No' : <Empty />
    case 'int': return v ? formatCount(Number(v)) : <Empty />
    case 'url': return v ? <ExternalLink href={v}>{v.replace(/^https?:\/\/(www\.)?/i, '')}</ExternalLink> : <Empty />
    case 'extra':
      return v ? (/^https?:\/\//i.test(v) ? <ExternalLink href={v}>{v.replace(/^https?:\/\/(www\.)?/i, '')}</ExternalLink> : v) : <Empty />
    default: return v || <Empty />
  }
}

function Empty() {
  return <span className="text-slate-600">–</span>
}

export function cellEditor(
  c: LeadColumn,
  ctx: { team: OutreachTeamMember[]; countries: string[]; niches: string[] },
): CellEditor {
  switch (c.kind) {
    case 'platform':
      return { type: 'select', options: [{ value: '', label: 'None' }, ...PLATFORMS.map((p) => ({ value: p.id, label: p.name }))] }
    case 'channel':
      return { type: 'select', options: [{ value: '', label: 'None' }, ...CHANNELS.map((ch) => ({ value: ch, label: CHANNEL_LABELS[ch] }))] }
    case 'owner':
      return { type: 'select', options: [{ value: '', label: 'Unassigned' }, ...ctx.team.map((t) => ({ value: t.user_id, label: t.display_name }))] }
    case 'bool':
      return { type: 'select', options: [{ value: '', label: 'Unknown' }, { value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }] }
    case 'country':
      return { type: 'text', suggestions: [...new Set([...ctx.countries, ...COUNTRIES.map((x) => x.name)])].sort() }
    case 'niche':
      return { type: 'text', suggestions: [...new Set([...ctx.niches, ...NICHES])].sort() }
    case 'email':
      return { type: 'text', inputMode: 'email' }
    case 'url':
      return { type: 'text', inputMode: 'url' }
    case 'int':
    case 'number':
      return { type: 'text', inputMode: 'decimal' }
    default:
      return { type: 'text' }
  }
}
