import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const PUBLIC_API_PREFIXES = [
  '/api/auth/',
  '/api/creators',  // public read
  '/api/brands',    // public read
]

function isPublicRoute(pathname: string, method: string): boolean {
  if (pathname.startsWith('/api/auth/')) return true
  // Allow GET on creators and brands (public search)
  if (method === 'GET' && (pathname.startsWith('/api/creators') || pathname.startsWith('/api/brands'))) return true
  return false
}

function isProtectedApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/')
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const method = request.method

  if (!isProtectedApiRoute(pathname)) return NextResponse.next()
  if (isPublicRoute(pathname, method)) return NextResponse.next()

  const secret = process.env.JWT_SECRET
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

    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', String(payload.userId ?? ''))
    requestHeaders.set('x-user-type', String(payload.userType ?? ''))
    requestHeaders.set('x-profile-id', String(payload.profileId ?? ''))

    return NextResponse.next({ request: { headers: requestHeaders } })
  } catch {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
  }
}

export const config = {
  matcher: '/api/:path*',
}
