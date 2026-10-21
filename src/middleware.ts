import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

function isPublicApiRoute(pathname: string, method: string): boolean {
  if (pathname.startsWith('/api/auth/')) {return true}
  if (pathname.startsWith('/api/admin/auth/')) {return true}
  if (method === 'GET' && (pathname.startsWith('/api/creators') || pathname.startsWith('/api/brands'))) {return true}
  if (method === 'POST' && pathname === '/api/newsletter/subscribe') {return true}
  if (method === 'POST' && pathname === '/api/contact') {return true}
  if (method === 'GET' && pathname === '/api/referral/lookup') {return true}
  if (method === 'POST' && pathname === '/api/referral/track') {return true}
  if (method === 'POST' && /^\/api\/creators\/[^/]+\/view$/.test(pathname)) {return true}
  if (method === 'GET' && /^\/api\/share\/[^/]+$/.test(pathname)) {return true}
  // Cron routes carry their own bearer secret (CRON_SECRET, checked in the
  // route itself via src/lib/cron-auth.ts) — not a JWT, so letting the JWT
  // branch below see it would just fail verification and 401 before the
  // route's own check ever runs.
  if (pathname.startsWith('/api/cron/')) {return true}
  // Unsubscribe links are designed to work without being logged in — the
  // signed token in the query string (verified inside the route itself,
  // see src/lib/email/unsubscribeToken.ts) is the credential, not a JWT.
  if (pathname === '/api/email/unsubscribe') {return true}
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
  if (method !== 'GET') {return false}
  if (pathname === '/api/campaigns') {return true}
  if (/^\/api\/campaigns\/[^/]+$/.test(pathname)) {return true}
  return false
}

const AUTH_HEADER_NAMES = ['x-user-id', 'x-user-type', 'x-profile-id', 'x-user-role']

function stripAuthHeaders(request: NextRequest): Headers {
  const headers = new Headers(request.headers)
  for (const name of AUTH_HEADER_NAMES) {headers.delete(name)}
  return headers
}

// Applied to every response the middleware returns, for every matched route
// (see config.matcher below — now all page routes, not just /api and /admin).
const CSP = [
  "default-src 'self'",
  // blob:: GA4's gtag.js bundle spins up a web worker from a blob: URL.
  // worker-src isn't set explicitly below (it used to just fall back to
  // script-src), so script-src itself needs blob: too or that worker
  // creation is a CSP violation that throws and halts page JS — including
  // CookieConsent mounting, which is how GA4 was failing to load at all.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://www.googletagmanager.com https://www.google-analytics.com",
  "style-src 'self' 'unsafe-inline'",
  // Explicit worker-src so worker permissions don't rely on the script-src
  // fallback above.
  "worker-src 'self' blob:",
  // https://www.website.show: the homepage footer's "Featured on
  // website.show" directory badge — an external, unoptimized SVG served
  // straight from their domain (next/image's `unoptimized` skips our own
  // image optimizer, so the browser fetches it directly).
  // https://www.google-analytics.com / googletagmanager.com: GA4's no-JS
  // pixel-tracking fallback (an <img> beacon) — script-src/connect-src
  // already allow the normal fetch-based hit, but without these here too
  // a browser that falls back to the pixel path gets silently blocked.
  "img-src 'self' data: blob: https://lh3.googleusercontent.com https://ypdspiwxsojwjzbagaip.supabase.co https://www.website.show https://www.google-analytics.com https://www.googletagmanager.com",
  "font-src 'self'",
  // *.google-analytics.com / *.analytics.google.com: GA4 can send to
  // numbered regional subdomains (region1.* etc., already explicitly
  // allowed below) and to collect/debug subdomains that vary by property
  // — wildcarding the two base domains covers all of them instead of
  // chasing each one by name. stats.g.doubleclick.net: GA4's
  // conversion-linking/ads-attribution beacon, hit even without a
  // separate Google Ads integration wired up. www.googletagmanager.com:
  // once gtag.js loads (allowed via script-src), it fetches its container
  // config back from googletagmanager.com — without it here that fetch is
  // blocked and GA4 never initializes, so zero collect requests go out.
  "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://analytics.google.com https://*.analytics.google.com https://region1.google-analytics.com https://stats.g.doubleclick.net https://www.googletagmanager.com https://ypdspiwxsojwjzbagaip.supabase.co",
  "frame-ancestors 'none'",
].join('; ')

function withSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  response.headers.set('Content-Security-Policy', CSP)
  return response
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const method = request.method
  const secret = process.env.JWT_SECRET

  // ── Admin page routes ───────────────────────────────────────────────────────
  if (pathname.startsWith('/admin/')) {
    if (pathname === '/admin/login') {return withSecurityHeaders(NextResponse.next())}

    if (!secret) {return withSecurityHeaders(NextResponse.redirect(new URL('/admin/login', request.url)))}

    const cookieToken = request.cookies.get('auth_token')?.value
    if (!cookieToken) {return withSecurityHeaders(NextResponse.redirect(new URL('/admin/login', request.url)))}

    try {
      const { payload } = await jwtVerify(cookieToken, new TextEncoder().encode(secret))
      const role = String(payload.role ?? '')
      if (role !== 'admin' && role !== 'super_admin') {
        return withSecurityHeaders(NextResponse.redirect(new URL('/admin/login', request.url)))
      }
      return withSecurityHeaders(NextResponse.next())
    } catch {
      return withSecurityHeaders(NextResponse.redirect(new URL('/admin/login', request.url)))
    }
  }

  // ── API routes ──────────────────────────────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    if (isPublicApiRoute(pathname, method)) {return withSecurityHeaders(NextResponse.next())}

    const optionalAuth = isOptionalAuthApiRoute(pathname, method)

    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('auth_token')?.value
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : cookieToken

    if (!token || !secret) {
      if (optionalAuth) {
        return withSecurityHeaders(NextResponse.next({ request: { headers: stripAuthHeaders(request) } }))
      }
      if (!token) {return withSecurityHeaders(NextResponse.json({ error: 'Authentication required' }, { status: 401 }))}
      return withSecurityHeaders(NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 }))
    }

    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(secret))

      // Admin-only API routes require admin or super_admin role
      if (pathname.startsWith('/api/admin/')) {
        const role = String(payload.role ?? '')
        if (role !== 'admin' && role !== 'super_admin') {
          return withSecurityHeaders(NextResponse.json({ error: 'Admin access required' }, { status: 403 }))
        }
      }

      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-user-id', String(payload.userId ?? ''))
      requestHeaders.set('x-user-type', String(payload.userType ?? ''))
      requestHeaders.set('x-profile-id', String(payload.profileId ?? ''))
      requestHeaders.set('x-user-role', String(payload.role ?? 'user'))

      return withSecurityHeaders(NextResponse.next({ request: { headers: requestHeaders } }))
    } catch {
      if (optionalAuth) {
        return withSecurityHeaders(NextResponse.next({ request: { headers: stripAuthHeaders(request) } }))
      }
      return withSecurityHeaders(NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 }))
    }
  }

  // ── Everything else (pages) ─────────────────────────────────────────────────
  return withSecurityHeaders(NextResponse.next())
}

export const config = {
  // Previously only /api and /admin — widened so every page response also
  // gets the security headers below. Static assets are excluded since they
  // don't need these headers and this keeps the middleware off the hot path
  // for every image/font/js chunk request.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico|woff2?)$).*)'],
}
