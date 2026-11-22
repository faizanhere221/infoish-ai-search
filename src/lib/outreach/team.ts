import { createServerSupabase } from '@/lib/db'

type Supabase = ReturnType<typeof createServerSupabase>

// Team page: who can join the outreach team. Nobody's account or password
// is ever created here: people sign up at /signup themselves, stop before
// completing a profile, and a super admin promotes them.

export const SIGN_UP_FIRST =
  'Ask them to sign up at /signup and stop before completing their profile, then promote them here.'

export type AccountCheck =
  | { ok: false; status: number; error: string; account?: AccountSummary }
  | { ok: true; account: AccountSummary; promote: boolean }

export interface AccountSummary {
  user_id: string
  email: string
  role: string
  user_type: string
  is_active: boolean
  has_creator_profile: boolean
  has_brand_profile: boolean
  on_team: boolean
  team_active: boolean
}

const STAFF_ROLES = ['admin', 'super_admin', 'outreach']

// promote: true = a plain account that becomes role 'outreach' (user_type
// 'admin'); false = an admin / outreach account that joins as it is.
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

  const role = (user.role as string | null) ?? 'user'
  const account: AccountSummary = {
    user_id: user.id as string,
    email: user.email as string,
    role,
    user_type: String(user.user_type ?? ''),
    is_active: user.is_active !== false,
    has_creator_profile: (creator.data ?? []).length > 0,
    has_brand_profile: (brand.data ?? []).length > 0,
    on_team: !!member.data,
    team_active: member.data?.is_active === true,
  }

  if (account.team_active) {return { ok: false, status: 409, error: 'Already on the team.', account }}
  if (STAFF_ROLES.includes(role)) {return { ok: true, account, promote: false }}
  if (account.has_creator_profile || account.has_brand_profile) {
    return {
      ok: false,
      status: 409,
      error: `This account has a ${account.has_creator_profile ? 'creator' : 'brand'} profile, so it can't become a team account. ${SIGN_UP_FIRST}`,
      account,
    }
  }
  return { ok: true, account, promote: true }
}
