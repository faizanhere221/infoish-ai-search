// Single source of truth for every notification's copy, category, and
// priority — keyed by the same `type` string used everywhere else an event
// is identified (campaign_creator_events.event_type, messages/notifications
// related_type, src/lib/campaign-creator-cta.ts's EVENT_CTA). One place to
// read to answer "what does this event notify, and who sees what" — this
// table is also what docs/NOTIFICATIONS.md is generated from by hand, so
// keep them in sync when adding an entry.
//
// `title`/`content` are plain functions of `data` (whatever the call site
// passed to emitEvent) — not JSX, not role-aware branching beyond what's
// already encoded in `data` itself (e.g. `data.actorType` when a message
// needs to say "The brand" vs "The creator"). Never put charge_amount,
// profit, brand_notes, or client_name into a template used by any event
// that can reach a creator recipient — security-check.mjs asserts this
// over real HTTP, not just here.

export type NotificationCategory = 'messages' | 'offers' | 'contracts' | 'work' | 'payments' | 'account'
export type NotificationPriority = 'action' | 'info'

export interface EventCatalogEntry {
  category: NotificationCategory
  priority: NotificationPriority
  title: (data: Record<string, unknown>) => string
  content: (data: Record<string, unknown>) => string
}

function str(data: Record<string, unknown>, key: string): string {
  const v = data[key]
  return typeof v === 'string' ? v : v === null || v === undefined ? '' : String(v)
}

function money(data: Record<string, unknown>, amountKey = 'amount', currencyKey = 'currency'): string {
  const amount = Number(data[amountKey] ?? 0)
  const currency = str(data, currencyKey) || 'USD'
  const symbols: Record<string, string> = { USD: '$', CAD: '$', AUD: '$', GBP: '£', EUR: '€' }
  const symbol = symbols[currency]
  return symbol ? `${symbol}${amount.toLocaleString()}` : `${amount.toLocaleString()} ${currency}`
}

function actorLabel(data: Record<string, unknown>): string {
  return data.actorType === 'brand' ? 'The brand' : 'The creator'
}

export const EVENT_CATALOG: Record<string, EventCatalogEntry> = {
  // ── Offers ──────────────────────────────────────────────────────────────
  offer_sent: {
    category: 'offers',
    priority: 'action',
    title: () => 'New offer',
    content: (d) => `You received an offer for ${money(d)}`,
  },
  offer_countered: {
    category: 'offers',
    priority: 'action',
    title: () => 'Offer countered',
    content: (d) => `${actorLabel(d)} countered with ${money(d)}`,
  },
  offer_accepted: {
    category: 'offers',
    priority: 'info',
    title: () => 'Offer accepted',
    content: (d) => `Your offer of ${money(d)} was accepted`,
  },
  offer_declined: {
    category: 'offers',
    priority: 'info',
    title: () => 'Offer declined',
    content: (d) => `Your offer of ${money(d)} was declined`,
  },
  offer_withdrawn: {
    category: 'offers',
    priority: 'info',
    title: () => 'Offer withdrawn',
    content: (d) => `An offer of ${money(d)} was withdrawn`,
  },
  offer_expired: {
    category: 'offers',
    priority: 'info',
    title: () => 'Offer expired',
    content: (d) => `An offer of ${money(d)} expired without a response`,
  },

  // ── Contracts ───────────────────────────────────────────────────────────
  contract_sent: {
    category: 'contracts',
    priority: 'action',
    title: () => 'Contract ready to sign',
    content: () => 'A contract is ready for you to read and sign',
  },
  contract_signed_by_creator: {
    category: 'contracts',
    priority: 'action',
    title: () => 'Creator signed the contract',
    content: () => 'Countersign to make the contract fully signed',
  },
  contract_fully_signed: {
    category: 'contracts',
    priority: 'info',
    title: () => 'Contract fully signed',
    content: () => 'Both parties have signed the contract',
  },
  contract_declined: {
    category: 'contracts',
    priority: 'info',
    title: () => 'Contract declined',
    content: (d) => `The contract was declined: ${str(d, 'reason')}`,
  },
  contract_voided: {
    category: 'contracts',
    priority: 'info',
    title: () => 'Contract voided',
    content: (d) => `The signed contract was voided: ${str(d, 'reason')}`,
  },

  // ── Deliverables / work ─────────────────────────────────────────────────
  deliverable_added: {
    category: 'work',
    priority: 'info',
    title: () => 'New deliverable',
    content: (d) => `A deliverable was added: "${str(d, 'title')}"`,
  },
  deliverable_edited: {
    category: 'work',
    priority: 'info',
    title: () => 'Deliverable updated',
    content: (d) => `"${str(d, 'title')}" was updated`,
  },
  deliverable_draft_submitted: {
    category: 'work',
    priority: 'action',
    title: () => 'Draft ready for review',
    content: (d) => `A draft for "${str(d, 'title')}" is ready for review`,
  },
  deliverable_changes_requested: {
    category: 'work',
    priority: 'action',
    title: () => 'Changes requested',
    content: (d) => `The brand requested changes on "${str(d, 'title')}"`,
  },
  deliverable_approved: {
    category: 'work',
    priority: 'action',
    title: () => 'Draft approved',
    content: (d) => `Your draft for "${str(d, 'title')}" was approved`,
  },
  deliverable_posted: {
    category: 'work',
    priority: 'action',
    title: () => 'Deliverable posted',
    content: (d) => `"${str(d, 'title')}" has been posted`,
  },
  deliverable_completed: {
    category: 'work',
    priority: 'info',
    title: () => 'Deliverable completed',
    content: (d) => `"${str(d, 'title')}" was marked complete`,
  },
  results_added: {
    category: 'work',
    priority: 'info',
    title: () => 'Results added',
    content: (d) => `Results were added for "${str(d, 'title')}"`,
  },

  // ── Payments ────────────────────────────────────────────────────────────
  payment_due: {
    category: 'payments',
    priority: 'action',
    title: () => 'Payment due',
    content: (d) => `A payment of ${money(d)} is now due`,
  },
  payment_split: {
    category: 'payments',
    priority: 'info',
    title: () => 'Payment schedule updated',
    content: (d) => `An upfront payment of ${money(d, 'upfrontAmount', 'currency')} is now due`,
  },
  payment_marked_paid: {
    category: 'payments',
    priority: 'action',
    title: () => 'Payment marked as paid',
    content: (d) => `${money(d)} was marked paid — please confirm you received it`,
  },
  payment_confirmed: {
    category: 'payments',
    priority: 'info',
    title: () => 'Payment confirmed',
    content: (d) => `The creator confirmed receiving ${money(d)}`,
  },
  payment_disputed: {
    category: 'payments',
    priority: 'action',
    title: () => 'Payment disputed',
    content: (d) => `The creator disputed a payment of ${money(d)}: ${str(d, 'reason')}`,
  },
  payment_cancelled: {
    category: 'payments',
    priority: 'info',
    title: () => 'Payment cancelled',
    content: (d) => `A payment of ${money(d)} was cancelled: ${str(d, 'reason')}`,
  },
  kill_fee_created: {
    category: 'payments',
    priority: 'info',
    title: () => 'Kill fee due',
    content: (d) => `A kill fee of ${money(d)} is due`,
  },

  // ── Applications (pre-tracker) ──────────────────────────────────────────
  application_received: {
    category: 'account',
    priority: 'action',
    title: () => 'New campaign application',
    content: (d) => `You received a new application for "${str(d, 'campaignTitle')}"`,
  },
  application_viewed: {
    category: 'account',
    priority: 'info',
    title: () => 'Application viewed',
    content: (d) => `Your application for "${str(d, 'campaignTitle')}" was viewed`,
  },
  application_shortlisted: {
    category: 'account',
    priority: 'info',
    title: () => "You've been shortlisted!",
    content: (d) => `You've been shortlisted for "${str(d, 'campaignTitle')}"`,
  },
  application_rejected: {
    category: 'account',
    priority: 'info',
    title: () => 'Application update',
    content: (d) => `Your application for "${str(d, 'campaignTitle')}" was declined`,
  },
  application_hired: {
    category: 'account',
    priority: 'action',
    title: () => "You've been hired!",
    content: (d) => `You've been hired for "${str(d, 'campaignTitle')}"`,
  },

  // ── Messages ────────────────────────────────────────────────────────────
  new_message: {
    category: 'messages',
    priority: 'action',
    title: () => 'New message',
    content: (d) => str(d, 'preview') || 'You have a new message',
  },

  referral_commission_earned: {
    category: 'account',
    priority: 'info',
    title: () => 'You earned a commission!',
    content: (d) => `You earned ${str(d, 'amountFormatted')} commission from ${str(d, 'creatorName')}'s deal.`,
  },
  referral_commission_approved: {
    category: 'account',
    priority: 'info',
    title: () => 'Commission approved',
    content: (d) => `Your ${str(d, 'amountFormatted')} commission has been approved and added to your balance.`,
  },

  // ── Account ─────────────────────────────────────────────────────────────
  account_created: {
    category: 'account',
    priority: 'info',
    title: () => 'Welcome to Infoishai',
    content: (d) =>
      d.userType === 'brand'
        ? 'Your brand account is ready. Start finding creators to work with.'
        : 'Your creator account is ready. Complete your profile to start getting discovered.',
  },

  // ── Legacy deals (pre-campaign-workflow 1:1 deal flow) ──────────────────
  deal_created: {
    category: 'account',
    priority: 'action',
    title: () => 'New deal offer',
    content: (d) => `You received a new deal offer: "${str(d, 'dealTitle')}"`,
  },
  deal_accepted: {
    category: 'account',
    priority: 'info',
    title: () => 'Deal accepted',
    content: (d) => `Your deal "${str(d, 'dealTitle')}" has been accepted. Work is now in progress.`,
  },
  deal_declined: {
    category: 'account',
    priority: 'info',
    title: () => 'Deal declined',
    content: (d) => `Your deal "${str(d, 'dealTitle')}" was declined by the creator.`,
  },
  deal_delivered: {
    category: 'account',
    priority: 'action',
    title: () => 'Delivery ready for review',
    content: (d) => `"${str(d, 'dealTitle')}" has been delivered. Please review and approve.`,
  },
  deal_approved: {
    category: 'account',
    priority: 'info',
    title: () => 'Deal completed!',
    content: (d) => `"${str(d, 'dealTitle')}" has been approved by the brand. Great work!`,
  },
  deal_completed: {
    category: 'account',
    priority: 'info',
    title: () => 'Deal completed',
    content: (d) => `"${str(d, 'dealTitle')}" is now complete.`,
  },
  deal_revision: {
    category: 'account',
    priority: 'action',
    title: () => 'Revision requested',
    content: (d) => `"${str(d, 'dealTitle')}" requires a revision. Please check the feedback.`,
  },
}
