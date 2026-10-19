import { createServerSupabase } from '@/lib/db'

type Supabase = ReturnType<typeof createServerSupabase>

export interface BlockingCheck {
  blocked: boolean
  reasons: string[]
}

// "Unsettled payment" / "active contract" for a creator or brand profile —
// shared by the two branches below. An active contract is any non-void
// contract whose campaign_creators row hasn't reached a terminal state
// (completed/dropped); an unsettled payment is any creator_payments row
// that hasn't reached confirmed or cancelled. Legacy `deals` still open
// (not completed/cancelled/declined) count too — those are real
// commitments regardless of which flow created them. This BLOCKS deletion
// outright (either mode) until resolved — it is not the hard-vs-soft
// decision, see checkLinkedRecords for that.
export async function checkDeletionBlockers(
  supabase: Supabase,
  profileType: 'creator' | 'brand',
  profileId: string
): Promise<BlockingCheck> {
  const reasons: string[] = []

  let campaignCreatorRows: { id: string; status: string }[] = []
  if (profileType === 'creator') {
    const { data } = await supabase.from('campaign_creators').select('id, status').eq('creator_id', profileId)
    campaignCreatorRows = data ?? []
  } else {
    const { data: brandCampaigns } = await supabase.from('campaigns').select('id').eq('brand_id', profileId)
    const campaignIds = (brandCampaigns ?? []).map((c) => c.id)
    if (campaignIds.length > 0) {
      const { data } = await supabase.from('campaign_creators').select('id, status').in('campaign_id', campaignIds)
      campaignCreatorRows = data ?? []
    }
  }

  const rowIds = (campaignCreatorRows ?? []).map((r) => r.id as string)
  const activeRowIds = (campaignCreatorRows ?? [])
    .filter((r) => !['completed', 'dropped'].includes(r.status as string))
    .map((r) => r.id as string)

  if (rowIds.length > 0) {
    const { count: unsettledPayments } = await supabase
      .from('creator_payments')
      .select('id', { count: 'exact', head: true })
      .in('campaign_creator_id', rowIds)
      .not('status', 'in', '(confirmed,cancelled)')
    if ((unsettledPayments ?? 0) > 0) {
      reasons.push(`${unsettledPayments} unsettled payment(s) on the campaign workflow`)
    }
  }

  if (activeRowIds.length > 0) {
    const { count: activeContracts } = await supabase
      .from('campaign_contracts')
      .select('id', { count: 'exact', head: true })
      .in('campaign_creator_id', activeRowIds)
      .neq('status', 'void')
    if ((activeContracts ?? 0) > 0) {
      reasons.push(`${activeContracts} active contract(s) on an engagement that hasn't concluded`)
    }
  }

  const dealField = profileType === 'creator' ? 'creator_id' : 'brand_id'
  const { count: activeDeals } = await supabase
    .from('deals')
    .select('id', { count: 'exact', head: true })
    .eq(dealField, profileId)
    .not('status', 'in', '(completed,cancelled,declined)')
  if ((activeDeals ?? 0) > 0) {
    reasons.push(`${activeDeals} active legacy deal(s)`)
  }

  return { blocked: reasons.length > 0, reasons }
}

export interface LinkedRecordsCheck {
  hasAny: boolean
  details: string[]
}

// Any record at all — regardless of status, unlike checkDeletionBlockers
// above — across every table that represents real history for this
// person: conversations, messages (+ legacy deal_messages), the campaign
// workflow (campaign_creators/offers/contracts/payments/deliverables),
// campaign applications, legacy deals, reviews, referral involvement
// (as a partner or as someone referred), and reports (as reporter or
// reported). Used to decide deletion MODE, not to block it —
// checkDeletionBlockers already covers "can't delete yet." An account
// with zero hits here never did anything on the platform worth
// preserving, so it's eligible for a real hard delete instead of
// soft-delete + anonymization.
//
// `profile` is null for a user with no creator/brand row at all (an
// incomplete signup, or an admin account) — in that case only the checks
// keyed by userId directly (messages, reviews, reports, referral) run;
// the ones that need a profile id (conversations, the campaign workflow,
// applications, legacy deals) are skipped since there's nothing for them
// to match against.
export async function checkLinkedRecords(
  supabase: Supabase,
  userId: string,
  profile: { type: 'creator' | 'brand'; id: string } | null
): Promise<LinkedRecordsCheck> {
  const details: string[] = []

  if (profile) {
    const profileType = profile.type
    const profileId = profile.id

    let rowIds: string[] = []
    if (profileType === 'creator') {
      const { data } = await supabase.from('campaign_creators').select('id').eq('creator_id', profileId)
      rowIds = (data ?? []).map((r) => r.id)
    } else {
      const { data: campaigns } = await supabase.from('campaigns').select('id').eq('brand_id', profileId)
      const campaignIds = (campaigns ?? []).map((c) => c.id)
      if (campaignIds.length > 0) {
        const { data } = await supabase.from('campaign_creators').select('id').in('campaign_id', campaignIds)
        rowIds = (data ?? []).map((r) => r.id)
      }
    }
    if (rowIds.length > 0) {details.push(`${rowIds.length} campaign tracker row(s)`)}

    if (rowIds.length > 0) {
      const [{ count: offers }, { count: contracts }, { count: payments }, { count: deliverables }] = await Promise.all([
        supabase.from('campaign_offers').select('id', { count: 'exact', head: true }).in('campaign_creator_id', rowIds),
        supabase.from('campaign_contracts').select('id', { count: 'exact', head: true }).in('campaign_creator_id', rowIds),
        supabase.from('creator_payments').select('id', { count: 'exact', head: true }).in('campaign_creator_id', rowIds),
        supabase.from('creator_deliverables').select('id', { count: 'exact', head: true }).in('campaign_creator_id', rowIds),
      ])
      if ((offers ?? 0) > 0) {details.push(`${offers} offer(s)`)}
      if ((contracts ?? 0) > 0) {details.push(`${contracts} contract(s)`)}
      if ((payments ?? 0) > 0) {details.push(`${payments} payment(s)`)}
      if ((deliverables ?? 0) > 0) {details.push(`${deliverables} deliverable(s)`)}
    }

    const convField = profileType === 'creator' ? 'creator_id' : 'brand_id'
    const { count: conversations } = await supabase.from('conversations').select('id', { count: 'exact', head: true }).eq(convField, profileId)
    if ((conversations ?? 0) > 0) {details.push(`${conversations} conversation(s)`)}

    if (profileType === 'creator') {
      const { count: applications } = await supabase.from('campaign_applications').select('id', { count: 'exact', head: true }).eq('creator_id', profileId)
      if ((applications ?? 0) > 0) {details.push(`${applications} campaign application(s)`)}
    }

    const dealField = profileType === 'creator' ? 'creator_id' : 'brand_id'
    const { count: deals } = await supabase.from('deals').select('id', { count: 'exact', head: true }).eq(dealField, profileId)
    if ((deals ?? 0) > 0) {details.push(`${deals} legacy deal(s)`)}

    const { count: wasReferred } = await supabase
      .from('referral_signups')
      .select('id', { count: 'exact', head: true })
      .or(profileType === 'creator' ? `referred_user_id.eq.${userId},referred_creator_id.eq.${profileId}` : `referred_user_id.eq.${userId}`)
    if ((wasReferred ?? 0) > 0) {details.push('a referral signup record')}
  }

  const [{ count: messages }, { count: dealMessages }] = await Promise.all([
    supabase.from('messages').select('id', { count: 'exact', head: true }).eq('sender_id', userId),
    supabase.from('deal_messages').select('id', { count: 'exact', head: true }).eq('sender_id', userId),
  ])
  if ((messages ?? 0) > 0) {details.push(`${messages} message(s)`)}
  if ((dealMessages ?? 0) > 0) {details.push(`${dealMessages} legacy deal message(s)`)}

  const { count: reviews } = await supabase.from('reviews').select('id', { count: 'exact', head: true }).or(`reviewer_id.eq.${userId},reviewee_id.eq.${userId}`)
  if ((reviews ?? 0) > 0) {details.push(`${reviews} review(s)`)}

  const { count: reports } = await supabase.from('reports').select('id', { count: 'exact', head: true }).or(`reporter_user_id.eq.${userId},reported_user_id.eq.${userId}`)
  if ((reports ?? 0) > 0) {details.push(`${reports} report(s)`)}

  const { data: partner } = await supabase.from('referral_partners').select('id').eq('user_id', userId).maybeSingle()
  if (partner) {details.push('a referral partner account')}

  if (!profile) {
    const { count: wasReferred } = await supabase.from('referral_signups').select('id', { count: 'exact', head: true }).eq('referred_user_id', userId)
    if ((wasReferred ?? 0) > 0) {details.push('a referral signup record')}
  }

  return { hasAny: details.length > 0, details }
}

// Permanently removes a user with zero linked records (see
// checkLinkedRecords) — the creator/brand profile row first (its
// platforms/portfolio/services/payout_methods cascade automatically, FK
// ON DELETE CASCADE), then the users row itself. Order matters:
// creators.user_id/brands.user_id reference users(id) with no ON DELETE
// clause (default RESTRICT) — deleting the users row first would fail
// while the profile row still references it. Avatar files in Storage
// don't cascade from a DB delete, so those are removed explicitly first.
export async function hardDeleteUser(
  supabase: Supabase,
  userId: string,
  profile: { type: 'creator' | 'brand'; id: string } | null
): Promise<void> {
  if (profile?.type === 'creator') {
    const { data: avatarFiles } = await supabase.storage.from('avatars').list(profile.id)
    if (avatarFiles && avatarFiles.length > 0) {
      await supabase.storage.from('avatars').remove(avatarFiles.map((f) => `${profile.id}/${f.name}`))
    }
    await supabase.from('creators').delete().eq('id', profile.id)
  } else if (profile?.type === 'brand') {
    await supabase.from('brands').delete().eq('id', profile.id)
  }
  await supabase.from('users').delete().eq('id', userId)
}
