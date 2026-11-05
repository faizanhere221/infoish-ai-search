import { NextRequest } from 'next/server'
import { handleDbItem } from '@/lib/outreach/database-items'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

type Params = { params: { type: string; leadId: string; kind: string } }

// POST: add a rate (creators), contact or campaign (brands). See handleDbItem().
export async function POST(request: NextRequest, { params }: Params) {
  return handleDbItem(request, params, 'add')
}
