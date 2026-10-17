import { NextRequest } from 'next/server'

// Cron routes carry their own secret (CRON_SECRET) rather than relying on
// the normal JWT auth — there's no user to issue a token as, and
// middleware.ts doesn't need to know about them either way: they verify
// this themselves, same as /admin/* verifies its own JWT.
export function isAuthorizedCronRequest(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) {return false}
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${secret}`
}
