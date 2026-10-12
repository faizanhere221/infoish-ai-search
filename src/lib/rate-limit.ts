import { createServerSupabase } from '@/lib/db'

interface RateLimitResult {
  allowed: boolean
  retryAfterMs: number
}

// Database-backed (see supabase/rate_limiting_migration.sql) so limits hold
// across Vercel's serverless instances — an in-memory Map resets on every
// cold start and can't be trusted for this. `key` should already encode
// both the caller (e.g. IP) and the endpoint, e.g. `login:${ip}`.
export async function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  try {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .rpc('check_rate_limit', {
        p_ip: key,
        p_endpoint: key,
        p_max_requests: maxRequests,
        p_window_ms: windowMs,
      })
      .single<{ allowed: boolean; retry_after_ms: number }>()

    if (error || !data) {
      // Fail open: a transient DB/RPC issue (or the migration not having
      // been applied yet) should not lock every user out of login/signup.
      console.error('Rate limit check failed, allowing request:', error)
      return { allowed: true, retryAfterMs: 0 }
    }

    return { allowed: data.allowed, retryAfterMs: Number(data.retry_after_ms) }
  } catch (err) {
    console.error('Rate limit check threw, allowing request:', err)
    return { allowed: true, retryAfterMs: 0 }
  }
}
