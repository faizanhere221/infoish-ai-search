'use client'

import { useEffect, useRef } from 'react'

// Generic visibility-aware polling: runs `callback` every `intervalMs` while
// the tab is visible, pauses entirely when it's hidden (no wasted requests
// in a background tab), and fires immediately on refocus so the view is
// never stale when the user comes back. Always cleaned up on unmount.
export function usePolling(
  callback: () => void | Promise<void>,
  intervalMs: number,
  options?: { enabled?: boolean }
): void {
  const enabled = options?.enabled ?? true
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (!enabled) {return}

    let timer: ReturnType<typeof setInterval> | null = null

    const stop = () => {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
    }

    const start = () => {
      stop()
      timer = setInterval(() => { callbackRef.current() }, intervalMs)
    }

    const handleWake = () => {
      if (document.visibilityState === 'visible') {
        callbackRef.current()
        start()
      } else {
        stop()
      }
    }

    if (document.visibilityState === 'visible') {start()}
    document.addEventListener('visibilitychange', handleWake)
    window.addEventListener('focus', handleWake)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', handleWake)
      window.removeEventListener('focus', handleWake)
    }
  }, [intervalMs, enabled])
}
