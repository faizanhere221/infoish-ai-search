// Reports to Sentry (initialized in sentry.server.config.ts,
// sentry.edge.config.ts and src/instrumentation-client.ts) and keeps the
// console log so Vercel function logs still show every error.
import * as Sentry from '@sentry/nextjs'

type ErrorContext = Record<string, unknown>

// `route` (API routes) and `context` (client components) become searchable
// Sentry tags; everything else in the context object goes in as extra data.
const TAG_KEYS = ['route', 'context', 'step'] as const

function toScopeContext(context?: ErrorContext) {
  if (!context) {return undefined}
  const tags: Record<string, string> = {}
  const extra: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(context)) {
    if ((TAG_KEYS as readonly string[]).includes(key) && typeof value === 'string') {
      tags[key] = value
    } else {
      extra[key] = value
    }
  }
  return { tags, extra }
}

// Supabase/PostgREST errors are plain objects ({ message, code, details,
// hint }), not Error instances. Sentry groups those as an unreadable
// "Object captured as exception", so wrap them in an Error that keeps the
// message, and attach the original fields as extra data.
function normalizeError(error: unknown): { err: unknown; extra?: Record<string, unknown> } {
  if (error instanceof Error) {return { err: error }}
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    const code = 'code' in error && typeof error.code === 'string' ? ` (${error.code})` : ''
    return { err: new Error(`${error.message}${code}`), extra: { original_error: error } }
  }
  return { err: error }
}

// Next throws these as plain Errors with a special `digest` to signal
// internal control flow, not an application failure: DYNAMIC_SERVER_USAGE
// bails a route to dynamic rendering, NEXT_REDIRECT carries a redirect(),
// NEXT_NOT_FOUND carries a notFound(). Every route in this codebase already
// funnels its catch block through captureError(), so every one of those
// catch blocks is an equally good place to accidentally swallow one of
// these — reporting it to Sentry and returning a generic 500 instead of
// letting Next's own machinery see it breaks the redirect/notFound/dynamic
// bailout entirely. Checking here protects every call site at once instead
// of auditing ~160 individual try/catch blocks.
function isNextInternalSignal(error: unknown): boolean {
  const digest = (error as { digest?: unknown } | null)?.digest
  return typeof digest === 'string' && (digest === 'DYNAMIC_SERVER_USAGE' || digest === 'NEXT_NOT_FOUND' || digest.startsWith('NEXT_REDIRECT'))
}

export function captureError(error: unknown, context?: ErrorContext): void {
  if (isNextInternalSignal(error)) {throw error}
  if (context) {
    console.error('[error-tracking]', error, context)
  } else {
    console.error('[error-tracking]', error)
  }

  try {
    const { err, extra } = normalizeError(error)
    const scope = toScopeContext(context)
    Sentry.captureException(err, {
      tags: scope?.tags,
      extra: { ...scope?.extra, ...extra },
    })
  } catch {
    // Reporting must never break the caller's own error handling.
  }
}

export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: ErrorContext
): void {
  const log = level === 'error' ? console.error : console.warn
  log(`[error-tracking:${level}]`, message)

  try {
    const scope = toScopeContext(context)
    Sentry.captureMessage(message, { level, tags: scope?.tags, extra: scope?.extra })
  } catch {
    // Reporting must never break the caller.
  }
}

// Wraps an API route handler so unhandled throws are captured and still
// returned as a clean 500 instead of leaking a stack trace / crashing the
// function. Usage: export const POST = withErrorTracking(async (req) => { ... })
export function withErrorTracking<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>
): (...args: Args) => Promise<Response> {
  return async (...args: Args) => {
    try {
      return await handler(...args)
    } catch (error) {
      captureError(error, { args: args.map((a) => (a instanceof Request ? a.url : '[non-request-arg]')) })
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }
}
