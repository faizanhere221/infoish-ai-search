import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { DB_ITEM_SQL_KIND, isDbItemKind, validateDbItem, type DbItemKind } from '@/lib/outreach/database'
import { getOutreachCaller, leadTypeFromSegment, mapDbError, unauthorized } from '@/lib/outreach/server'

// Shared handler for rate / campaign rows:
//   POST   /api/admin/outreach/database/[type]/[leadId]/[kind]           add
//   PATCH  /api/admin/outreach/database/[type]/[leadId]/[kind]/[itemId]  edit
//   DELETE /api/admin/outreach/database/[type]/[leadId]/[kind]/[itemId]  delete
// kinds: creators → rates; brands → campaigns (contacts have their own routes). Members and admins
// both add, edit and delete rows (deleting the whole entry is admin only).
// The write is outreach_db_item(): one transaction, logged as 'db_edited'.

export interface ItemParams {
  type: string
  leadId: string
  kind: string
  itemId?: string
}

export async function handleDbItem(request: NextRequest, params: ItemParams, op: 'add' | 'edit' | 'delete'): Promise<NextResponse> {
  const route = `${request.method} /api/admin/outreach/database/[leadId]/[kind]`
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}
  const leadType = leadTypeFromSegment(params.type)
  if (!leadType || !isDbItemKind(leadType, params.kind)) {return NextResponse.json({ error: 'Not found' }, { status: 404 })}
  const kind: DbItemKind = params.kind

  try {
    const supabase = createServerSupabase()
    let row: Record<string, unknown> | null = null

    if (op !== 'delete') {
      const body = await request.json().catch(() => null)
      if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length === 0) {
        return NextResponse.json({ error: 'Send the fields' }, { status: 400 })
      }
      const { values, errors } = validateDbItem(kind, body as Record<string, unknown>, op === 'edit')
      const errorFields = Object.keys(errors)
      if (errorFields.length > 0) {
        return NextResponse.json(
          { error: errors[errorFields[0]], fields: Object.fromEntries(errorFields.map((f) => [f, [errors[f]]])) },
          { status: 400 },
        )
      }
      row = values
    }

    const { data, error } = await supabase.rpc('outreach_db_item', {
      p_lead_type: leadType,
      p_lead_id: params.leadId,
      p_user_id: caller.userId,
      p_kind: DB_ITEM_SQL_KIND[kind],
      p_item_id: params.itemId ?? null,
      p_row: row,
    })
    if (error) {
      const mapped = mapDbError(error)
      if (mapped) {return NextResponse.json({ error: mapped.message }, { status: mapped.status })}
      captureError(error, { route })
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
    }

    const message = op === 'add' ? 'Added' : op === 'edit' ? 'Saved' : 'Deleted'
    return NextResponse.json({ message, item: data }, { status: op === 'add' ? 201 : 200 })
  } catch (err) {
    captureError(err, { route })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
