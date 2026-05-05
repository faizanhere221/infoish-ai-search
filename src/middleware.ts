import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

function isPublicApiRoute(pathname: string, method: string): boolean {
  if (pathname.startsWith('/api/auth/')) return true
  if (pathname.startsWith('/api/admin/auth/')) return true
  if (method === 'GET' && (pathname.startsWith('/api/creators') || pathname.startsWith('/api/brands'))) return true
  return false
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

  if (!secret) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization')
  const cookieToken = request.cookies.get('auth_token')?.value
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : cookieToken

  if (!token) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
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
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
  }
}

export const config = {
  matcher: ['/api/:path*', '/admin/:path*'],
}
