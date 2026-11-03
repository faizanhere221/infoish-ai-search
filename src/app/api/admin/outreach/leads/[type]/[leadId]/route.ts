import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logAdminAction, requireReason } from '@/lib/admin-action'
import { leadKeys } from '@/lib/outreach/rules'
import { brandFieldsSchema, creatorFieldsSchema } from '@/lib/outreach/schemas'
import {
  adminOnly, findDuplicates, getOutreachCaller, leadTable, leadTypeFromSegment, loadTeam,
  mapDbError, unauthorized, withDncFlags,
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
      .select('id, user_id, action, mailbox_id, channel, undone_at, created_at')
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

// PATCH: edit lead fields (not status: statuses move through actions, or
// the admin bulk change). Anyone on the team edits any lead.
export async function PATCH(request: NextRequest, { params }: Params) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}
  const leadType = leadTypeFromSegment(params.type)
  if (!leadType) {return NextResponse.json({ error: 'Not found' }, { status: 404 })}

  try {
    const body = await request.json().catch(() => null)
    const schema = (leadType === 'creator' ? creatorFieldsSchema : brandFieldsSchema).partial()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', fields: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const updates = Object.fromEntries(Object.entries(parsed.data).filter(([, v]) => v !== undefined))
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const supabase = createServerSupabase()
    const table = leadTable(leadType)
    const { data: existing } = await supabase.from(table).select('*').eq('lead_id', params.leadId).maybeSingle()
    if (!existing) {return NextResponse.json({ error: 'Lead not found' }, { status: 404 })}

    if (updates.owner_user_id) {
      const team = await loadTeam(supabase)
      if (!team.some((t) => t.user_id === updates.owner_user_id)) {
        return NextResponse.json({ error: 'Owner must be a team member' }, { status: 400 })
      }
    }

    const merged = { ...existing, ...updates }
    const keys = leadKeys(leadType, merged)
    const duplicates = [...(await findDuplicates(supabase, keys)).values()].filter((d) => d.lead_id !== params.leadId)
    if (duplicates.length > 0) {
      return NextResponse.json({ error: 'Already exists', duplicates }, { status: 409 })
    }

    const { data, error } = await supabase.from(table).update(updates).eq('lead_id', params.leadId).select('*').single()
    if (error) {
      const mapped = mapDbError(error)
      if (mapped) {return NextResponse.json({ error: mapped.message }, { status: mapped.status })}
      captureError(error, { route: 'PATCH /api/admin/outreach/leads/[leadId]' })
      return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
    }

    if (updates.owner_user_id !== undefined && updates.owner_user_id !== existing.owner_user_id) {
      await supabase.from('outreach_activity').insert({
        lead_type: leadType, lead_id: params.leadId, user_id: caller.userId, action: 'owner_changed',
      })
    }

    const [lead] = await withDncFlags(supabase, [data as OutreachLead])
    return NextResponse.json({ lead })
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
