import { createServerSupabase } from '@/lib/db'

export interface ActivityPayload {
  userId?: string | null
  action: string
  entityType?: string
  entityId?: string
  details?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

export async function logActivity(payload: ActivityPayload): Promise<void> {
  try {
    const supabase = createServerSupabase()
    await supabase.from('activity_logs').insert({
      user_id:     payload.userId ?? null,
      action:      payload.action,
      entity_type: payload.entityType ?? null,
      entity_id:   payload.entityId ?? null,
      details:     payload.details ?? {},
      ip_address:  payload.ipAddress ?? null,
      user_agent:  payload.userAgent ?? null,
    })
  } catch {
    // Never throw — logging must not break primary flows
  }
}
