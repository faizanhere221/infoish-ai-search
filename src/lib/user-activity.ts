// Browser-only: tracks when the visitor last moved the mouse, typed,
// scrolled or touched the page, so polling can stop for a tab that is
// visible but unattended (a dashboard left open on a second monitor).
// One set of listeners is installed for the whole page, however many
// polls use it.

export const IDLE_AFTER_MS = 5 * 60 * 1000

const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart', 'wheel'] as const

let lastActivityAt = Date.now()
let installed = false
const wakeListeners = new Set<() => void>()

// Also called when the tab is shown or the window gets focus: coming back
// to the tab counts as activity.
export function markUserActive(): void {
  install()
  onActivity()
}

function onActivity() {
  const wasIdle = isUserIdle()
  lastActivityAt = Date.now()
  if (wasIdle && wakeListeners.size > 0) {
    const listeners = Array.from(wakeListeners)
    wakeListeners.clear()
    for (const listener of listeners) {listener()}
  }
}

function install() {
  if (installed || typeof window === 'undefined') {return}
  installed = true
  for (const name of ACTIVITY_EVENTS) {
    window.addEventListener(name, onActivity, { passive: true, capture: true })
  }
}

export function isUserIdle(): boolean {
  install()
  return Date.now() - lastActivityAt >= IDLE_AFTER_MS
}

// Runs `listener` once, on the first activity after the visitor went idle.
// Returns an unsubscribe function.
export function onNextActivity(listener: () => void): () => void {
  install()
  wakeListeners.add(listener)
  return () => { wakeListeners.delete(listener) }
}
