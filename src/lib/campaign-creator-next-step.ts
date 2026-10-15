import type { DrawerTab } from '@/components/campaigns/CampaignCreatorDrawer'

export interface NextStepInput {
  status: string
  contract_status?: string | null
  payment_status?: string | null
  payment_overdue?: boolean
  pending_offer_from?: 'brand' | 'creator' | null
  deliverable_statuses?: string[]
}

export interface NextStep {
  label: string
  tab: DrawerTab
  // Whose turn it is right now, right now — used to sort "Action needed"
  // dashboard lists and to decide whether a line reads as an instruction
  // ("Send an offer") vs. a status update ("Waiting for creator to reply").
  mine: boolean
}

function has(statuses: string[] | undefined, status: string): boolean {
  return !!statuses?.includes(status)
}

// One shared decision tree, used by the brand tracker row, the creator's
// campaign card, and both dashboard "Action needed" lists — so the exact
// same row never shows contradictory guidance in two places. Returns null
// once there's genuinely nothing left to do (completed/dropped).
export function getNextStep(input: NextStepInput, viewerType: 'brand' | 'creator'): NextStep | null {
  const { status, contract_status = null, payment_status = null, payment_overdue = false, pending_offer_from = null, deliverable_statuses = [] } = input

  if (status === 'dropped') {return null}

  if (viewerType === 'brand') {
    if (payment_overdue) {return { label: 'Mark payment as paid', tab: 'payments', mine: true }}
    if (payment_status === 'due') {return { label: 'Mark payment as paid', tab: 'payments', mine: true }}
    if (payment_status === 'disputed') {return { label: 'Resolve payment dispute', tab: 'payments', mine: true }}

    if (pending_offer_from === 'creator') {return { label: 'Review counter-offer', tab: 'offer', mine: true }}
    if (pending_offer_from === 'brand') {return { label: 'Waiting for creator to reply', tab: 'offer', mine: false }}
    if (['shortlisted', 'contacted'].includes(status)) {return { label: 'Send an offer', tab: 'offer', mine: true }}

    if (contract_status === 'draft') {return { label: 'Review and send the contract', tab: 'contract', mine: true }}
    if (contract_status === 'sent') {return { label: 'Waiting for creator to sign', tab: 'contract', mine: false }}
    if (contract_status === 'signed_by_creator') {return { label: 'Countersign contract', tab: 'contract', mine: true }}

    if (has(deliverable_statuses, 'draft_submitted')) {return { label: 'Review draft', tab: 'deliverables', mine: true }}
    if (has(deliverable_statuses, 'posted')) {return { label: 'Mark deliverable complete', tab: 'deliverables', mine: true }}
    if (has(deliverable_statuses, 'changes_requested') || has(deliverable_statuses, 'pending') || has(deliverable_statuses, 'approved')) {
      return { label: 'Waiting for creator to submit a draft', tab: 'deliverables', mine: false }
    }

    if (payment_status === 'marked_paid') {return { label: 'Waiting for creator to confirm payment', tab: 'payments', mine: false }}
    if (status === 'completed') {return null}
    return { label: 'Waiting for creator', tab: 'offer', mine: false }
  }

  // creator
  if (payment_status === 'marked_paid') {return { label: 'Confirm payment', tab: 'payments', mine: true }}
  if (payment_status === 'disputed') {return { label: 'Waiting for brand to resolve payment', tab: 'payments', mine: false }}

  if (pending_offer_from === 'brand') {return { label: 'Review offer', tab: 'offer', mine: true }}
  if (pending_offer_from === 'creator') {return { label: 'Waiting for brand to reply', tab: 'offer', mine: false }}
  if (['shortlisted', 'contacted'].includes(status)) {return { label: 'Waiting for brand', tab: 'offer', mine: false }}

  if (contract_status === 'sent') {return { label: 'Sign contract', tab: 'contract', mine: true }}
  if (contract_status === 'draft') {return { label: 'Waiting for brand to send the contract', tab: 'contract', mine: false }}
  if (contract_status === 'signed_by_creator') {return { label: 'Waiting for brand to countersign', tab: 'contract', mine: false }}

  if (has(deliverable_statuses, 'changes_requested')) {return { label: 'See feedback', tab: 'deliverables', mine: true }}
  if (has(deliverable_statuses, 'pending')) {return { label: 'Submit draft', tab: 'deliverables', mine: true }}
  if (has(deliverable_statuses, 'approved')) {return { label: 'Add posted link', tab: 'deliverables', mine: true }}
  if (has(deliverable_statuses, 'draft_submitted')) {return { label: 'Waiting for brand to review draft', tab: 'deliverables', mine: false }}
  if (has(deliverable_statuses, 'posted')) {return { label: 'Add results', tab: 'deliverables', mine: true }}

  if (payment_status === 'due' || payment_overdue) {return { label: 'Waiting for brand to pay', tab: 'payments', mine: false }}
  if (status === 'completed') {return null}
  return { label: 'Waiting for brand', tab: 'offer', mine: false }
}
