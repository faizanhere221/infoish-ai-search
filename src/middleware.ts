import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

function isPublicApiRoute(pathname: string, method: string): boolean {
  if (pathname.startsWith('/api/auth/')) return true
  if (pathname.startsWith('/api/admin/auth/')) return true
  if (method === 'GET' && (pathname.startsWith('/api/creators') || pathname.startsWith('/api/brands'))) return true
  if (method === 'POST' && pathname === '/api/newsletter/subscribe') return true
  if (method === 'POST' && pathname === '/api/contact') return true
  return false
}

// Campaign browsing (list + single detail) is publicly viewable, but unlike
// the fully-public routes above, these handlers still branch on
// x-profile-id/x-user-type to decide ownership (e.g. a brand seeing its own
// drafts). So auth here must stay *optional*, not bypassed: a present token
// is still verified and its claims trusted, while a missing/invalid one
// always falls through as anonymous — the raw client request headers are
// never trusted directly, or a caller could just spoof x-profile-id.
function isOptionalAuthApiRoute(pathname: string, method: string): boolean {
  if (method !== 'GET') return false
  if (pathname === '/api/campaigns') return true
  if (/^\/api\/campaigns\/[^/]+$/.test(pathname)) return true
  return false
}

const AUTH_HEADER_NAMES = ['x-user-id', 'x-user-type', 'x-profile-id', 'x-user-role']

function stripAuthHeaders(request: NextRequest): Headers {
  const headers = new Headers(request.headers)
  for (const name of AUTH_HEADER_NAMES) headers.delete(name)
  return headers
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const method = request.method
  const secret = process.env.JWT_SECRET

  // ── Admin page routes ───────────────────────────────────────────────────────
  if (pathname.startsWith('/admin/')) {
    if (pathname === '/admin/login') return NextResponse.next()

    if (!secret) return NextResponse.redirect(new URL('/admin/login', request.url))

    const cookieToken = request.cookies.get('auth_token')?.value
    if (!cookieToken) return NextResponse.redirect(new URL('/admin/login', request.url))

    try {
      const { payload } = await jwtVerify(cookieToken, new TextEncoder().encode(secret))
      const role = String(payload.role ?? '')
      if (role !== 'admin' && role !== 'super_admin') {
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }
      return NextResponse.next()
    } catch {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // ── API routes ──────────────────────────────────────────────────────────────
  if (!pathname.startsWith('/api/')) return NextResponse.next()
  if (isPublicApiRoute(pathname, method)) return NextResponse.next()

  const optionalAuth = isOptionalAuthApiRoute(pathname, method)

  const authHeader = request.headers.get('authorization')
  const cookieToken = request.cookies.get('auth_token')?.value
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : cookieToken

  if (!token || !secret) {
    if (optionalAuth) {
      return NextResponse.next({ request: { headers: stripAuthHeaders(request) } })
    }
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret))

    // Admin-only API routes require admin or super_admin role
    if (pathname.startsWith('/api/admin/')) {
      const role = String(payload.role ?? '')
      if (role !== 'admin' && role !== 'super_admin') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
    }

    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', String(payload.userId ?? ''))
    requestHeaders.set('x-user-type', String(payload.userType ?? ''))
    requestHeaders.set('x-profile-id', String(payload.profileId ?? ''))
    requestHeaders.set('x-user-role', String(payload.role ?? 'user'))

    return NextResponse.next({ request: { headers: requestHeaders } })
  } catch {
    if (optionalAuth) {
      return NextResponse.next({ request: { headers: stripAuthHeaders(request) } })
    }
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
  }
}

export const config = {
  matcher: ['/api/:path*', '/admin/:path*'],
}
