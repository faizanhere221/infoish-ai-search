// Single source of truth for "what should a system message / notification
// about this event link to, and what should the button say" — shared by
// ChatThread's actionable message cards and the notifications page, for
// both brand and creator viewers. Keyed by the same eventType string
// recordCampaignCreatorAction() already logs to campaign_creator_events
// (see src/lib/campaign-creator-events.ts), so nothing new needs to be
// invented at each call site — every route already passes an eventType.

export type DrawerTab = 'offer' | 'deliverables' | 'contract' | 'payments'

interface EventCta {
  tab: DrawerTab
  // Button label when the BRAND is viewing. Omit to show no button (a
  // purely informational message for the brand, e.g. "you declined this").
  brand?: string
  // Button label when the CREATOR is viewing.
  creator?: string
}

export const EVENT_CTA: Record<string, EventCta> = {
  offer_sent: { tab: 'offer', creator: 'Review offer', brand: 'View offer' },
  offer_countered: { tab: 'offer', creator: 'Review counter-offer', brand: 'Review counter-offer' },
  offer_accepted: { tab: 'offer', creator: 'View offer', brand: 'View offer' },
  offer_declined: { tab: 'offer', creator: 'View offer', brand: 'View offer' },
  offer_withdrawn: { tab: 'offer', creator: 'View offer', brand: 'View offer' },

  contract_sent: { tab: 'contract', creator: 'Review and sign', brand: 'View contract' },
  contract_signed_by_creator: { tab: 'contract', creator: 'View contract', brand: 'Countersign' },
  contract_fully_signed: { tab: 'contract', creator: 'View contract', brand: 'View contract' },
  contract_declined: { tab: 'contract', creator: 'View contract', brand: 'View contract' },
  contract_voided: { tab: 'contract', creator: 'View contract', brand: 'View contract' },

  deliverable_draft_submitted: { tab: 'deliverables', creator: 'View deliverable', brand: 'Review draft' },
  deliverable_approved: { tab: 'deliverables', creator: 'View deliverable', brand: 'View deliverable' },
  deliverable_changes_requested: { tab: 'deliverables', creator: 'See feedback', brand: 'View deliverable' },
  deliverable_posted: { tab: 'deliverables', creator: 'View deliverable', brand: 'Review post' },
  deliverable_completed: { tab: 'deliverables', creator: 'View deliverable', brand: 'View deliverable' },

  payment_marked_paid: { tab: 'payments', creator: 'Confirm payment', brand: 'View payment' },
  payment_confirmed: { tab: 'payments', creator: 'View payment', brand: 'View payment' },
  payment_disputed: { tab: 'payments', creator: 'View payment', brand: 'Resolve dispute' },
  payment_cancelled: { tab: 'payments', creator: 'View payment', brand: 'View payment' },
  payment_split: { tab: 'payments', creator: 'View payment', brand: 'View payment' },
  kill_fee_created: { tab: 'payments', creator: 'View payment', brand: 'View payment' },
}

// Tab is the same regardless of who's viewing — only the button label
// differs. Used where only the destination matters (e.g. building a
// notification's href), not a label.
export function getEventTab(eventType: string | null | undefined): DrawerTab | null {
  if (!eventType) {return null}
  return EVENT_CTA[eventType]?.tab ?? null
}

export function getEventCta(
  eventType: string | null | undefined,
  viewerType: 'brand' | 'creator'
): { tab: DrawerTab; label: string } | null {
  if (!eventType) {return null}
  const entry = EVENT_CTA[eventType]
  if (!entry) {return null}
  const label = viewerType === 'brand' ? entry.brand : entry.creator
  if (!label) {return null}
  return { tab: entry.tab, label }
}

// The one URL every deep link (chat card button, notification) points at —
// a tiny resolver page (src/app/dashboard/go/[campaignCreatorId]/page.tsx)
// looks up which campaign the row belongs to and the viewer's own role,
// then forwards to the real brand tracker or creator campaign-detail URL.
// Neither a message nor a notification knows the campaign id or the
// viewer's role up front, so resolving both here (rather than building the
// final URL at write time) keeps this working correctly even if a brand
// and creator click the exact same link.
export function campaignCreatorGoUrl(campaignCreatorId: string, tab: DrawerTab): string {
  return `/dashboard/go/${campaignCreatorId}?tab=${tab}`
}
