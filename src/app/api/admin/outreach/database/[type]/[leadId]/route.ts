import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { validateDbFields } from '@/lib/outreach/database'
import { forCaller, infoishaiProfiles, loadDbEntry } from '@/lib/outreach/database-server'
import {
  adminOnly, getOutreachCaller, leadTypeFromSegment, mapDbError, unauthorized, withDncFlags,
} from '@/lib/outreach/server'
import type { OutreachLead } from '@/lib/outreach/types'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

type Params = { params: { type: string; leadId: string } }

// GET: one Database entry: the lead (with its DNC flag), the Database
// fields, rates (creators) or contacts + campaigns (brands), the "On
// Infoishai" profile match and the lead's last 100 activity rows.
// 404 { in_db: false, removed } when the lead isn't in the Database.
export async function GET(request: NextRequest, { params }: Params) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}
  const leadType = leadTypeFromSegment(params.type)
  if (!leadType) {return NextResponse.json({ error: 'Not found' }, { status: 404 })}

  try {
    const supabase = createServerSupabase()
    const found = await loadDbEntry(supabase, leadType, params.leadId)
    if (!found) {return NextResponse.json({ error: 'Lead not found' }, { status: 404 })}
    if (!found.entry) {
      return NextResponse.json({ error: 'This lead is not in the Database.', in_db: false, removed: found.removed }, { status: 404 })
    }

    const [lead] = await withDncFlags(supabase, [found.lead as unknown as OutreachLead])
    const items = leadType === 'creator'
      ? await supabase.from('outreach_creator_rates').select('*').eq('lead_id', params.leadId).order('platform').order('format').order('price')
      : null
    const [contacts, campaigns] = leadType === 'brand'
      ? await Promise.all([
        supabase.from('outreach_brand_contacts').select('*').eq('lead_id', params.leadId).order('created_at'),
        supabase.from('outreach_brand_campaigns').select('*').eq('lead_id', params.leadId).order('run_date', { ascending: false, nullsFirst: false }),
      ])
      : [null, null]
    for (const r of [items, contacts, campaigns]) {if (r?.error) {throw r.error}}

    const { data: activity, error: aErr } = await supabase
      .from('outreach_activity')
      .select('id, user_id, action, mailbox_id, channel, changes, undone_at, created_at')
      .eq('lead_type', leadType)
      .eq('lead_id', params.leadId)
      .order('created_at', { ascending: false })
      .limit(100)
    if (aErr) {throw aErr}

    const emailNorm = (found.lead.email_norm as string | null) ?? null
    const onInfoishai = leadType === 'creator' && emailNorm
      ? (await infoishaiProfiles(supabase, [emailNorm])).get(emailNorm) ?? null
      : null

    // A member never sees the rating, not even in the edit history.
    const visibleActivity = (activity ?? []).flatMap((a) => {
      if (caller.isAdmin || !a.changes || !('quality_rating' in a.changes)) {return [a]}
      const changes = { ...(a.changes as Record<string, unknown>) }
      delete changes.quality_rating
      return Object.keys(changes).length > 0 ? [{ ...a, changes }] : []
    })

    return NextResponse.json({
      lead,
      entry: forCaller(found.entry as { quality_rating?: number | null }, caller),
      rates: items?.data ?? [],
      contacts: contacts?.data ?? [],
      campaigns: campaigns?.data ?? [],
      on_infoishai: onInfoishai,
      activity: visibleActivity,
    })
  } catch (err) {
    captureError(err, { route: 'GET /api/admin/outreach/database/[leadId]' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH: Database fields (not the lead's own fields: those go through
// PATCH /api/admin/outreach/leads/[type]/[leadId] with its duplicate rules).
// Members edit everything but the quality rating (admins only). Only
// changed fields are written, logged as one 'db_edited' activity row.
export async function PATCH(request: NextRequest, { params }: Params) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}
  const leadType = leadTypeFromSegment(params.type)
  if (!leadType) {return NextResponse.json({ error: 'Not found' }, { status: 404 })}

  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length === 0) {
      return NextResponse.json({ error: 'Send the fields to change' }, { status: 400 })
    }
    const { values, errors } = validateDbFields(leadType, body as Record<string, unknown>, { isAdmin: caller.isAdmin })
    const errorFields = Object.keys(errors)
    if (errorFields.length > 0) {
      const status = errors.quality_rating && !caller.isAdmin && errorFields.length === 1 ? 403 : 400
      return NextResponse.json(
        { error: errors[errorFields[0]], fields: Object.fromEntries(errorFields.map((f) => [f, [errors[f]]])) },
        { status },
      )
    }

    const supabase = createServerSupabase()
    const { data, error } = await supabase.rpc('outreach_db_update', {
      p_lead_type: leadType, p_lead_id: params.leadId, p_user_id: caller.userId, p_fields: values,
    })
    if (error) {
      const mapped = mapDbError(error)
      if (mapped) {return NextResponse.json({ error: mapped.message }, { status: mapped.status })}
      captureError(error, { route: 'PATCH /api/admin/outreach/database/[leadId]' })
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
    }
    const changes = (data ?? {}) as Record<string, unknown>
    return NextResponse.json({ message: Object.keys(changes).length > 0 ? 'Saved' : 'No changes', changes })
  } catch (err) {
    captureError(err, { route: 'PATCH /api/admin/outreach/database/[leadId]' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE (admins): removes the entry from the Database. The lead stays in
// the leads table; the Database data is kept, so "Add to DB" restores it.
export async function DELETE(request: NextRequest, { params }: Params) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}
  if (!caller.isAdmin) {return adminOnly()}
  const leadType = leadTypeFromSegment(params.type)
  if (!leadType) {return NextResponse.json({ error: 'Not found' }, { status: 404 })}

  try {
    const supabase = createServerSupabase()
    const { data, error } = await supabase.rpc('outreach_db_remove', {
      p_lead_type: leadType, p_lead_ids: [params.leadId], p_user_id: caller.userId,
    })
    if (error) {
      const mapped = mapDbError(error)
      if (mapped) {return NextResponse.json({ error: mapped.message }, { status: mapped.status })}
      captureError(error, { route: 'DELETE /api/admin/outreach/database/[leadId]' })
      return NextResponse.json({ error: 'Failed to remove' }, { status: 500 })
    }
    const removed = Number(data ?? 0)
    return NextResponse.json({ message: removed ? `${params.leadId} removed from the Database` : 'Not in the Database', removed })
  } catch (err) {
    captureError(err, { route: 'DELETE /api/admin/outreach/database/[leadId]' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
