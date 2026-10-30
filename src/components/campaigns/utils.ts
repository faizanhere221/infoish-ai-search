import { CAMPAIGN_CATEGORIES, CAMPAIGN_CREATOR_STATUS_LABELS, DELIVERABLE_STATUS_LABELS } from '@/types/campaigns'
import { platformName } from '@/utils/constants'
import type { Campaign, CampaignStatus, CampaignCreatorStatus, DeliverableStatus } from '@/types/campaigns'
import { formatDate as formatDateUTC } from '@/lib/format-date'

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  CAD: '$',
  AUD: '$',
  GBP: '£',
  EUR: '€',
}

export function formatMoney(amount: number | null | undefined, currency: string): string {
  if (amount === null || amount === undefined) {return '—'}
  const symbol = CURRENCY_SYMBOLS[currency]
  return symbol ? `${symbol}${amount.toLocaleString()}` : `${amount.toLocaleString()} ${currency}`
}

export function formatBudget(
  campaign: Pick<Campaign, 'budget_type' | 'budget_min' | 'budget_max' | 'currency'>
): string {
  if (campaign.budget_type === 'negotiable') {return 'Negotiable'}

  const { budget_min, budget_max, currency } = campaign
  if (budget_min !== null && budget_min !== undefined && budget_max !== null && budget_max !== undefined && budget_min !== budget_max) {
    return `${formatMoney(budget_min, currency)} - ${formatMoney(budget_max, currency)}`
  }
  const single = budget_max ?? budget_min
  if (single !== null && single !== undefined) {return formatMoney(single, currency)}
  return 'Not specified'
}

export function formatDate(dateStr: string | null): string {
  return formatDateUTC(dateStr)
}

// Relative for anything within the last week ("2 hours ago"), falling back
// to an absolute date beyond that — matches the common feed/activity convention.
export function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) {return '—'}
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffMin < 1) {return 'just now'}
  if (diffMin < 60) {return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`}
  if (diffHour < 24) {return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`}
  if (diffDay < 7) {return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`}
  return formatDate(dateStr)
}

export interface DeadlineInfo {
  label: string
  isPast: boolean
  isUrgent: boolean
}

export function getDeadlineInfo(deadline: string | null): DeadlineInfo {
  if (!deadline) {return { label: 'No deadline', isPast: false, isUrgent: false }}

  const diffDays = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {return { label: 'Applications closed', isPast: true, isUrgent: false }}
  if (diffDays === 0) {return { label: 'Closes today', isPast: false, isUrgent: true }}
  if (diffDays === 1) {return { label: '1 day left', isPast: false, isUrgent: true }}
  if (diffDays <= 3) {return { label: `${diffDays} days left`, isPast: false, isUrgent: true }}
  return { label: `${diffDays} days left`, isPast: false, isUrgent: false }
}

export const STATUS_BADGE: Record<CampaignStatus, { label: string; bg: string; text: string }> = {
  draft: { label: 'Draft', bg: 'bg-gray-100', text: 'text-gray-700' },
  published: { label: 'Published', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  closed: { label: 'Closed', bg: 'bg-amber-100', text: 'text-amber-700' },
  completed: { label: 'Completed', bg: 'bg-blue-100', text: 'text-blue-700' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-100', text: 'text-red-700' },
}

export const CAMPAIGN_CREATOR_STATUS_BADGE: Record<CampaignCreatorStatus, { label: string; bg: string; text: string }> = {
  shortlisted: { label: CAMPAIGN_CREATOR_STATUS_LABELS.shortlisted, bg: 'bg-gray-100', text: 'text-gray-700' },
  contacted: { label: CAMPAIGN_CREATOR_STATUS_LABELS.contacted, bg: 'bg-blue-100', text: 'text-blue-700' },
  negotiating: { label: CAMPAIGN_CREATOR_STATUS_LABELS.negotiating, bg: 'bg-amber-100', text: 'text-amber-700' },
  confirmed: { label: CAMPAIGN_CREATOR_STATUS_LABELS.confirmed, bg: 'bg-indigo-100', text: 'text-indigo-700' },
  drafting: { label: CAMPAIGN_CREATOR_STATUS_LABELS.drafting, bg: 'bg-purple-100', text: 'text-purple-700' },
  draft_review: { label: CAMPAIGN_CREATOR_STATUS_LABELS.draft_review, bg: 'bg-orange-100', text: 'text-orange-700' },
  scheduled: { label: CAMPAIGN_CREATOR_STATUS_LABELS.scheduled, bg: 'bg-cyan-100', text: 'text-cyan-700' },
  posted: { label: CAMPAIGN_CREATOR_STATUS_LABELS.posted, bg: 'bg-emerald-100', text: 'text-emerald-700' },
  completed: { label: CAMPAIGN_CREATOR_STATUS_LABELS.completed, bg: 'bg-green-100', text: 'text-green-700' },
  dropped: { label: CAMPAIGN_CREATOR_STATUS_LABELS.dropped, bg: 'bg-red-100', text: 'text-red-700' },
}

export const DELIVERABLE_STATUS_BADGE: Record<DeliverableStatus, { label: string; bg: string; text: string }> = {
  pending: { label: DELIVERABLE_STATUS_LABELS.pending, bg: 'bg-gray-100', text: 'text-gray-700' },
  draft_submitted: { label: DELIVERABLE_STATUS_LABELS.draft_submitted, bg: 'bg-blue-100', text: 'text-blue-700' },
  changes_requested: { label: DELIVERABLE_STATUS_LABELS.changes_requested, bg: 'bg-amber-100', text: 'text-amber-700' },
  approved: { label: DELIVERABLE_STATUS_LABELS.approved, bg: 'bg-indigo-100', text: 'text-indigo-700' },
  posted: { label: DELIVERABLE_STATUS_LABELS.posted, bg: 'bg-emerald-100', text: 'text-emerald-700' },
  completed: { label: DELIVERABLE_STATUS_LABELS.completed, bg: 'bg-green-100', text: 'text-green-700' },
}

export function categoryLabel(value: string | null): string {
  if (!value) {return 'Other'}
  return CAMPAIGN_CATEGORIES.find((c) => c.value === value)?.label || value
}

// Old campaigns can still name a platform we dropped: platformName()
// gives those a neutral label.
export function platformLabel(value: string): string {
  return platformName(value)
}
