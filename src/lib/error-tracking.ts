// TODO: Replace console logging with Sentry. Install @sentry/nextjs and
// configure DSN (NEXT_PUBLIC_SENTRY_DSN), then swap the bodies below for
// Sentry.captureException / Sentry.captureMessage.

type ErrorContext = Record<string, unknown>

export function captureError(error: unknown, context?: ErrorContext): void {
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
