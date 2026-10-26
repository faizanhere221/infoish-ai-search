import type { createServerSupabase } from '@/lib/db'

type Supabase = ReturnType<typeof createServerSupabase>

export interface CreatorEarnings {
  /** Total received per currency, in whole currency units (e.g. 150.5 = $150.50). */
  byCurrency: Record<string, number>
  confirmedPayments: number
  completedDeals: number
}

// A creator's lifetime earnings, computed from the records every time
// instead of read from a counter. creators.total_earnings never existed on
// the live table (the deal-approve route wrote to it, and nothing landed),
// and a running counter drifts the moment one write is missed.
//
// Two sources, both "money the creator has received":
// - campaign workflow: creator_payments with status 'confirmed' (the
//   creator confirmed they received it). amount is in whole currency units.
// - legacy 1:1 deals: deals with status 'completed'. amount is stored in
//   cents (POST /api/deals, and the deal UI divides by 100). The full deal
//   amount counts: Infoishai never collected the old 10% fee, so
//   creator_payout on historical rows doesn't reflect what was paid.
//
// Grouped by currency, because a sum across currencies is meaningless.
export async function getCreatorEarnings(supabase: Supabase, creatorId: string): Promise<CreatorEarnings> {
  const byCurrency: Record<string, number> = {}
  const add = (currency: string | null, amount: number) => {
    const key = currency || 'USD'
    byCurrency[key] = Math.round(((byCurrency[key] || 0) + amount) * 100) / 100
  }

  const { data: rows, error: rowsError } = await supabase
    .from('campaign_creators')
    .select('id')
    .eq('creator_id', creatorId)
  if (rowsError) {throw rowsError}

  const rowIds = (rows || []).map((r) => r.id as string)
  let confirmedPayments = 0
  if (rowIds.length > 0) {
    const { data: payments, error } = await supabase
      .from('creator_payments')
      .select('amount, currency')
      .in('campaign_creator_id', rowIds)
      .eq('status', 'confirmed')
    if (error) {throw error}
    for (const p of payments || []) {add(p.currency, Number(p.amount) || 0)}
    confirmedPayments = (payments || []).length
  }

  const { data: deals, error: dealsError } = await supabase
    .from('deals')
    .select('amount, currency')
    .eq('creator_id', creatorId)
    .eq('status', 'completed')
  if (dealsError) {throw dealsError}
  for (const d of deals || []) {add(d.currency, (Number(d.amount) || 0) / 100)}

  return { byCurrency, confirmedPayments, completedDeals: (deals || []).length }
}
