import { createHash } from 'crypto'
import { formatMoney, formatDate } from '@/components/campaigns/utils'

export interface ContractDeliverableInput {
  title: string
  platform: string | null
  format: string | null
  draft_due: string | null
  publish_due: string | null
  revisions_allowed: number
}

export interface RenderContractParams {
  brandCompanyName: string
  creatorDisplayName: string
  creatorHandle: string
  campaignTitle: string
  deliverables: ContractDeliverableInput[]
  feeAmount: number | null
  currency: string
  paymentTermsDays: number
  killFeePercent: number
  usageRights: string | null
  specialTerms: string | null
}

// Plain-English contract template, generated from the accepted offer's
// terms. Never includes client_name, charge_amount, or brand_notes — the
// brand's internal fields never belong in a document the creator reads and
// signs. Kept in code (not the DB) so the wording can change without
// invalidating contracts already sent — only the rendered output of a given
// version is stored, in campaign_contracts.body_snapshot.
export function renderContractBody(params: RenderContractParams): string {
  const {
    brandCompanyName, creatorDisplayName, creatorHandle, campaignTitle,
    deliverables, feeAmount, currency, paymentTermsDays, killFeePercent,
    usageRights, specialTerms,
  } = params

  const deliverableLines = deliverables.length > 0
    ? deliverables.map((d, i) => {
        const parts = [`${i + 1}. ${d.title}`]
        if (d.platform) {parts.push(`Platform: ${d.platform}.`)}
        if (d.format) {parts.push(`Format: ${d.format}.`)}
        if (d.draft_due) {parts.push(`Draft due: ${formatDate(d.draft_due)}.`)}
        if (d.publish_due) {parts.push(`Publish due: ${formatDate(d.publish_due)}.`)}
        parts.push(`Revisions included: ${d.revisions_allowed}.`)
        return parts.join(' ')
      }).join('\n')
    : 'No deliverables are listed yet.'

  return `CREATOR CONTENT AGREEMENT

This agreement is between ${brandCompanyName} ("the brand") and ${creatorDisplayName} (@${creatorHandle}) ("the creator"), for the campaign "${campaignTitle}".

1. DELIVERABLES
${deliverableLines}

2. FEE AND PAYMENT TERMS
The brand pays the creator a fee of ${formatMoney(feeAmount, currency)}. The brand pays this directly to the creator within ${paymentTermsDays} days of completion. Infoishai does not hold or move any money for this agreement.

3. USAGE RIGHTS
${usageRights || 'The creator owns the content. The creator grants the brand a license to share and promote the posted content on the brand\'s own channels.'}

4. CANCELLATION TERMS
If the brand cancels this agreement after the creator submits a draft, the brand pays a kill fee of ${killFeePercent}% of the agreed fee.

5. CONTENT APPROVAL PROCESS
The creator submits a draft before the publish date. The brand reviews the draft and either approves it or requests changes. The creator revises the draft up to the number of included revisions listed above. Once the brand approves the draft, the creator posts it.

6. DISCLOSURE
The creator labels the content as a paid partnership or ad, following the rules of the platform it's posted on and the creator's local advertising laws.

7. CONFIDENTIALITY
Both parties keep the other's non-public business information private. Neither party shares deal terms with other brands or creators without consent.

8. CONTENT OWNERSHIP
The creator owns the content. The creator grants the brand the usage license described above. The brand does not own the creator's account or underlying footage beyond that license.
${specialTerms ? `\n9. SPECIAL TERMS\n${specialTerms}` : ''}
`
}

export function hashContractBody(body: string): string {
  return createHash('sha256').update(body, 'utf8').digest('hex')
}
