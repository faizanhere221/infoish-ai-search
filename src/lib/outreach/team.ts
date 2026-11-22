import { createServerSupabase } from '@/lib/db'

type Supabase = ReturnType<typeof createServerSupabase>

// Team page: who can join the outreach team. Team membership is only
// users.role + the outreach_team row. It never depends on, creates or
// changes a brand / creator account or profile, never changes user_type,
// and never creates an account or a password: people sign up at /signup
// themselves and a super admin promotes them here.

export const SIGN_UP_FIRST = 'Ask them to sign up at /signup, then promote them here.'

export type AccountCheck =
  | { ok: false; status: number; error: string; account?: AccountSummary }
  | { ok: true; account: AccountSummary; promote: boolean; reactivate: boolean }

export interface AccountSummary {
  user_id: string
  email: string
  role: string
  user_type: string
  is_active: boolean
  has_creator_profile: boolean
  has_brand_profile: boolean
  // "brand account, profile complete", "creator account, no profile yet",
  // "admin-only account": shown as information only
  account_label: string
  on_team: boolean
  team_active: boolean
}

const STAFF_ROLES = ['admin', 'super_admin', 'outreach']

export function hasProfile(a: Pick<AccountSummary, 'has_creator_profile' | 'has_brand_profile'>): boolean {
  return a.has_creator_profile || a.has_brand_profile
}

function accountLabel(userType: string, hasCreator: boolean, hasBrand: boolean): string {
  if (userType === 'brand' || userType === 'creator') {
    const complete = userType === 'brand' ? hasBrand : hasCreator
    return `${userType} account, ${complete ? 'profile complete' : 'no profile yet'}`
  }
  if (hasBrand || hasCreator) {return `${userType || 'other'} account with a ${hasBrand ? 'brand' : 'creator'} profile`}
  return `${userType === 'admin' ? 'admin-only' : userType || 'other'} account`
}

// promote: true = role 'user' becomes 'outreach'; false = an admin /
// super_admin / outreach account joins with its role unchanged.
// reactivate: a deactivated account with role 'user' and NO brand /
// creator profile, i.e. one this page deactivated when it was removed from
// the team. Any other
// deactivated account (a suspended brand or creator) is refused: reactivate
// it on the Users page first.
export async function checkAccount(supabase: Supabase, email: string): Promise<AccountCheck> {
  const { data: user, error } = await supabase
    .from('users').select('id, email, role, user_type, is_active, deleted_at').eq('email', email.trim().toLowerCase()).maybeSingle()
  if (error) {throw error}
  if (!user || user.deleted_at) {return { ok: false, status: 404, error: `No account with this email. ${SIGN_UP_FIRST}` }}

  const [creator, brand, member] = await Promise.all([
    supabase.from('creators').select('id').eq('user_id', user.id).limit(1),
    supabase.from('brands').select('id').eq('user_id', user.id).limit(1),
    supabase.from('outreach_team').select('is_active').eq('user_id', user.id).maybeSingle(),
  ])
  for (const r of [creator, brand, member]) {if (r.error) {throw r.error}}

  const hasCreator = (creator.data ?? []).length > 0
  const hasBrand = (brand.data ?? []).length > 0
  const userType = String(user.user_type ?? '')
  const account: AccountSummary = {
    user_id: user.id as string,
    email: user.email as string,
    role: (user.role as string | null) ?? 'user',
    user_type: userType,
    is_active: user.is_active !== false,
    has_creator_profile: hasCreator,
    has_brand_profile: hasBrand,
    account_label: accountLabel(userType, hasCreator, hasBrand),
    on_team: !!member.data,
    team_active: member.data?.is_active === true,
  }

  if (account.team_active) {return { ok: false, status: 409, error: 'Already on the team.', account }}
  const reactivate = !account.is_active
  if (reactivate && (hasProfile(account) || account.role !== 'user')) {
    return { ok: false, status: 409, error: 'This account is suspended. Reactivate it on the Users page first, then add it here.', account }
  }
  return { ok: true, account, promote: !STAFF_ROLES.includes(account.role), reactivate }
}
