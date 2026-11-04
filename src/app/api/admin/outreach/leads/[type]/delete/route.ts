import { NextRequest } from 'next/server'
import { setLeadsDeleted } from '@/lib/outreach/delete'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// POST /api/admin/outreach/leads/creators|brands/delete (admin):
// { lead_ids } (up to 500). Soft delete; see src/lib/outreach/delete.ts.
export async function POST(request: NextRequest, { params }: { params: { type: string } }) {
  return setLeadsDeleted(request, params.type, true)
}
