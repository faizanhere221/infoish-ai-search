import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logAdminAction, requireReason } from '@/lib/admin-action'
import { editLead } from '@/lib/outreach/edit'
import {
  adminOnly, getOutreachCaller, leadTable, leadTypeFromSegment, unauthorized, withDncFlags,
} from '@/lib/outreach/server'
import type { OutreachLead } from '@/lib/outreach/types'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

type Params = { params: { type: string; leadId: string } }

// GET: one lead with its DNC flag and last 50 activity rows.
export async function GET(request: NextRequest, { params }: Params) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}
  const leadType = leadTypeFromSegment(params.type)
  if (!leadType) {return NextResponse.json({ error: 'Not found' }, { status: 404 })}

  try {
    const supabase = createServerSupabase()
    const { data, error } = await supabase.from(leadTable(leadType)).select('*').eq('lead_id', params.leadId).maybeSingle()
    if (error) {
      captureError(error, { route: 'GET /api/admin/outreach/leads/[leadId]' })
      return NextResponse.json({ error: 'Failed to load lead' }, { status: 500 })
    }
    if (!data) {return NextResponse.json({ error: 'Lead not found' }, { status: 404 })}

    const [lead] = await withDncFlags(supabase, [data as OutreachLead])
    const { data: activity } = await supabase
      .from('outreach_activity')
      .select('id, user_id, action, mailbox_id, channel, changes, undone_at, created_at')
      .eq('lead_type', leadType)
      .eq('lead_id', params.leadId)
      .order('created_at', { ascending: false })
      .limit(50)

    return NextResponse.json({ lead, activity: activity ?? [] })
  } catch (err) {
    captureError(err, { route: 'GET /api/admin/outreach/leads/[leadId]' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH: edit lead fields from an inline cell or the edit panel. Status
// moves through actions (or the admin bulk change), never here. Members
// edit everything except the owner (admins only). See editLead() for the
// validation, duplicate and DNC rules; every change is logged as 'edited'.
export async function PATCH(request: NextRequest, { params }: Params) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}
  const leadType = leadTypeFromSegment(params.type)
  if (!leadType) {return NextResponse.json({ error: 'Not found' }, { status: 404 })}

  try {
    const body = await request.json().catch(() => null)
    const supabase = createServerSupabase()
    const outcome = await editLead(supabase, caller, leadType, params.leadId, body)
    return NextResponse.json(outcome.body, { status: outcome.status })
  } catch (err) {
    captureError(err, { route: 'PATCH /api/admin/outreach/leads/[leadId]' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE (admin): removes the lead. Its DNC entries and activity stay.
export async function DELETE(request: NextRequest, { params }: Params) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}
  if (!caller.isAdmin) {return adminOnly()}
  const leadType = leadTypeFromSegment(params.type)
  if (!leadType) {return NextResponse.json({ error: 'Not found' }, { status: 404 })}

  try {
    const body = await request.json().catch(() => null)
    const reasonCheck = requireReason(body)
    if (!reasonCheck.ok) {return NextResponse.json({ error: reasonCheck.error }, { status: 400 })}

    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from(leadTable(leadType))
      .delete()
      .eq('lead_id', params.leadId)
      .select('lead_id, status, owner_user_id')
      .maybeSingle()
    if (error) {
      captureError(error, { route: 'DELETE /api/admin/outreach/leads/[leadId]' })
      return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 })
    }
    if (!data) {return NextResponse.json({ error: 'Lead not found' }, { status: 404 })}

    logAdminAction({
      request, adminId: caller.userId, action: 'outreach_lead_deleted', targetType: `outreach_${leadType}`,
      targetId: params.leadId, reason: reasonCheck.reason, before: data, after: null,
    })
    return NextResponse.json({ message: 'Lead deleted' })
  } catch (err) {
    captureError(err, { route: 'DELETE /api/admin/outreach/leads/[leadId]' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
