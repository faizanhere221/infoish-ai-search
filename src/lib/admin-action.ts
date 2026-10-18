import type { NextRequest } from 'next/server'
import { logActivity } from '@/lib/activity'

export interface AdminActionParams {
  request: NextRequest
  adminId: string | null
  action: string
  targetType: string
  targetId: string
  reason: string
  before?: Record<string, unknown> | null
  after?: Record<string, unknown> | null
}

// The one place every admin mutation logs through — so "admin id, action,
// target, before/after, reason" (what Phase 7A asked every admin action to
// record) has exactly one shape instead of each route inventing its own.
// Fire-and-forget: logActivity() itself already never throws, this is just
// the consistent `details` shape on top of it.
export function logAdminAction(params: AdminActionParams): void {
  void logActivity({
    userId: params.adminId,
    action: params.action,
    entityType: params.targetType,
    entityId: params.targetId,
    details: {
      reason: params.reason,
      before: params.before ?? null,
      after: params.after ?? null,
    },
    ipAddress: params.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined,
    userAgent: params.request.headers.get('user-agent') ?? undefined,
  })
}

// Every admin route that mutates data requires a short reason string in the
// body — shared validation so the error message/shape is consistent.
export function requireReason(body: unknown): { ok: true; reason: string } | { ok: false; error: string } {
  const reason = (body as { reason?: unknown } | null)?.reason
  if (typeof reason !== 'string' || reason.trim().length < 3) {
    return { ok: false, error: 'A reason (at least 3 characters) is required for this action' }
  }
  if (reason.length > 500) {
    return { ok: false, error: 'Reason must be 500 characters or fewer' }
  }
  return { ok: true, reason: reason.trim() }
}
