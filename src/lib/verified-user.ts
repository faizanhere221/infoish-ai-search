import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// For routes on middleware's PUBLIC list (src/middleware.ts), where
// middleware never injects x-user-id and strips any client-supplied copy.
// Verifies the caller's JWT (Bearer header or auth_token cookie, same order
// as middleware) and returns its userId, or null if there is no valid token.
// Protected routes should keep reading the injected x-user-id header instead.
export async function getVerifiedUserId(request: NextRequest): Promise<string | null> {
  const secret = process.env.JWT_SECRET
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : request.cookies.get('auth_token')?.value
  if (!token || !secret) {return null}
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret))
    return payload.userId ? String(payload.userId) : null
  } catch {
    return null
  }
}
