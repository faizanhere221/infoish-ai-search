'use client'

import { Suspense, useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { trackPageView } from '@/lib/analytics'

// Next.js App Router client-side navigation never reloads the page, so the
// one-time gtag('config', ...) call (from the layout's GA bootstrap or from
// CookieConsent.tsx on accept) only ever records the very first page a visitor lands on. Every
// later in-app navigation (Link clicks, router.push, etc.) was invisible to
// GA4 until this tracked each pathname change explicitly.
function NavigationTrackerContent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const lastTracked = useRef<string | null>(null)

  useEffect(() => {
    const query = searchParams.toString()
    const fullPath = query ? `${pathname}?${query}` : pathname
    const isFirstRun = lastTracked.current === null
    if (lastTracked.current === fullPath) {return}
    lastTracked.current = fullPath
    // The landing page view is already recorded by the initial
    // gtag('config', GA_MEASUREMENT_ID) call (fired on page load for a
    // visitor who already consented, or on the Accept click). Firing again
    // here for that same first path would double-count it in GA4 — this
    // component's job starts at the next route change.
    if (isFirstRun) {return}
    trackPageView(fullPath)
  }, [pathname, searchParams])

  return null
}

// useSearchParams() requires a Suspense boundary (next build fails otherwise,
// per the project's search-params convention) — contained here so layout.tsx
// just mounts <NavigationTracker /> without needing to know about it.
export function NavigationTracker() {
  return (
    <Suspense fallback={null}>
      <NavigationTrackerContent />
    </Suspense>
  )
}
