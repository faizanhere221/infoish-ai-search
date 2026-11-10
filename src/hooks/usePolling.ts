'use client'

import { useEffect, useRef } from 'react'
import { isUserIdle, markUserActive, onNextActivity } from '@/lib/user-activity'

// Polling that only runs while someone is looking: `callback` fires every
// `intervalMs` while the tab is visible AND the visitor was active in the
// last 5 minutes (see src/lib/user-activity.ts). A hidden or idle tab sends
// nothing. On return (tab shown, window focused, or first mouse/key event
// after idling) it fires once right away so the view is never stale, then
// resumes the interval. Always cleaned up on unmount.
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
    let unsubscribeWake: (() => void) | null = null

    const stop = () => {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
    }

    const sleepUntilActive = () => {
      stop()
      if (!unsubscribeWake) {
        unsubscribeWake = onNextActivity(() => {
          unsubscribeWake = null
          wake()
        })
      }
    }

    const tick = () => {
      if (document.visibilityState !== 'visible') {
        stop()
        return
      }
      if (isUserIdle()) {
        sleepUntilActive()
        return
      }
      void callbackRef.current()
    }

    const start = () => {
      stop()
      timer = setInterval(tick, intervalMs)
    }

    function wake() {
      if (document.visibilityState !== 'visible') {
        stop()
        return
      }
      markUserActive()
      if (timer) {return} // already running, nothing missed
      void callbackRef.current()
      start()
    }

    if (document.visibilityState === 'visible') {start()}
    document.addEventListener('visibilitychange', wake)
    window.addEventListener('focus', wake)

    return () => {
      stop()
      unsubscribeWake?.()
      document.removeEventListener('visibilitychange', wake)
      window.removeEventListener('focus', wake)
    }
  }, [intervalMs, enabled])
}
