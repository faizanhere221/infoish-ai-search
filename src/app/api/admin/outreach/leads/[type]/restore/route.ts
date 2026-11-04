import { NextRequest } from 'next/server'
import { setLeadsDeleted } from '@/lib/outreach/delete'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// POST /api/admin/outreach/leads/creators|brands/restore (admin):
// { lead_ids } (up to 500). Brings soft-deleted leads back.
export async function POST(request: NextRequest, { params }: { params: { type: string } }) {
  return setLeadsDeleted(request, params.type, false)
}
