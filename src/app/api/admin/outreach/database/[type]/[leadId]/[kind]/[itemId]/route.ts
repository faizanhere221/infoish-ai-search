import { NextRequest } from 'next/server'
import { handleDbItem } from '@/lib/outreach/database-items'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

type Params = { params: { type: string; leadId: string; kind: string; itemId: string } }

// PATCH: edit a rate / contact / campaign (only the keys sent). See handleDbItem().
export async function PATCH(request: NextRequest, { params }: Params) {
  return handleDbItem(request, params, 'edit')
}

// DELETE: delete a rate / contact / campaign row.
export async function DELETE(request: NextRequest, { params }: Params) {
  return handleDbItem(request, params, 'delete')
}
