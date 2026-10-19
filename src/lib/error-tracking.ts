// TODO: Replace console logging with Sentry. Install @sentry/nextjs and
// configure DSN (NEXT_PUBLIC_SENTRY_DSN), then swap the bodies below for
// Sentry.captureException / Sentry.captureMessage.

type ErrorContext = Record<string, unknown>

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
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  const log = level === 'error' ? console.error : console.warn
  log(`[error-tracking:${level}]`, message)
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
