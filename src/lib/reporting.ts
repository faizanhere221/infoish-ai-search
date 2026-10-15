// Shared aggregation helpers for the campaign report, share-link results
// view, brand analytics page, roster performance history, and creator
// stats widget — one definition so "engagement," "CPM," and "on-time" mean
// the same thing everywhere they're shown.

export interface ResultRow {
  deliverable_id: string
  captured_at: string
  views: number
  likes: number
  comments: number
  shares: number
  clicks: number
  saves: number
}

export interface DeliverableForReport {
  id: string
  status: string
  posted_at: string | null
  publish_due: string | null
}

export interface EngagementTotals {
  views: number
  likes: number
  comments: number
  shares: number
  clicks: number
  saves: number
  engagements: number // likes + comments + shares + saves (clicks excluded — a CTA metric, not an engagement)
}

// Results are check-ins over time, not independent events — take each
// deliverable's most recent entry as its current total rather than summing
// every check-in (which would double-count).
export function latestResultByDeliverable(results: ResultRow[]): Map<string, ResultRow> {
  const latest = new Map<string, ResultRow>()
  for (const r of results) {
    const current = latest.get(r.deliverable_id)
    if (!current || new Date(r.captured_at) > new Date(current.captured_at)) {
      latest.set(r.deliverable_id, r)
    }
  }
  return latest
}

export function sumEngagementTotals(rows: ResultRow[]): EngagementTotals {
  const totals: EngagementTotals = { views: 0, likes: 0, comments: 0, shares: 0, clicks: 0, saves: 0, engagements: 0 }
  for (const r of rows) {
    totals.views += r.views
    totals.likes += r.likes
    totals.comments += r.comments
    totals.shares += r.shares
    totals.clicks += r.clicks
    totals.saves += r.saves
  }
  totals.engagements = totals.likes + totals.comments + totals.shares + totals.saves
  return totals
}

export function engagementRate(totals: Pick<EngagementTotals, 'views' | 'engagements'>): number | null {
  if (totals.views <= 0) {return null}
  return (totals.engagements / totals.views) * 100
}

// Cost per 1,000 views.
export function cpm(cost: number | null, views: number): number | null {
  if (!cost || views <= 0) {return null}
  return (cost / views) * 1000
}

export function costPerEngagement(cost: number | null, engagements: number): number | null {
  if (!cost || engagements <= 0) {return null}
  return cost / engagements
}

// Percent of posted deliverables that went out on or before publish_due.
// Only counts deliverables that have both a publish_due and were actually
// posted — nothing to judge "on time" against otherwise.
export function onTimeRate(deliverables: DeliverableForReport[]): number | null {
  const judged = deliverables.filter((d) => d.publish_due && (d.status === 'posted' || d.status === 'completed') && d.posted_at)
  if (judged.length === 0) {return null}
  const onTime = judged.filter((d) => new Date(d.posted_at as string) <= new Date(d.publish_due as string))
  return (onTime.length / judged.length) * 100
}

export function postedCount(deliverables: DeliverableForReport[]): number {
  return deliverables.filter((d) => d.status === 'posted' || d.status === 'completed').length
}
