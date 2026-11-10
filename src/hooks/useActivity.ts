'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePolling } from './usePolling'

export interface ActivitySummary {
  messages: { unread: number; version: string }
  notifications: { unread: number; version: string }
}

// One shared poll of GET /api/dashboard/activity for the whole page. The
// header badges, the notification bell and the inbox list all read it, so
// a logged-in tab sends one small request a minute in total (none while
// the tab is hidden or idle, see usePolling), and each component fetches
// its full list only when the matching `version` changes.
const POLL_INTERVAL_MS = 60_000
// A component mounting within this window reuses the last answer, so
// moving between dashboard pages doesn't refetch on every navigation.
const FRESH_MS = 20_000
// The nav count (published campaigns / applications) changes rarely.
const BADGE_FRESH_MS = 5 * 60_000

let currentToken: string | null = null
let summary: ActivitySummary | null = null
let fetchedAt = 0
let campaignBadge: number | null = null
let badgeFetchedAt = 0
let inflight: Promise<void> | null = null
const listeners = new Set<() => void>()

function resetFor(token: string | null) {
  if (token === currentToken) {return}
  currentToken = token
  summary = null
  fetchedAt = 0
  campaignBadge = null
  badgeFetchedAt = 0
}

function notify() {
  for (const listener of Array.from(listeners)) {listener()}
}

async function load(token: string, options: { force?: boolean; badges?: boolean; maxAgeMs?: number }): Promise<void> {
  resetFor(token)
  const wantBadges = Boolean(options.badges) && Date.now() - badgeFetchedAt > BADGE_FRESH_MS
  if (!options.force && !wantBadges && summary && Date.now() - fetchedAt < (options.maxAgeMs ?? FRESH_MS)) {return}
  if (inflight) {
    // Wait for the request already on its way, then check again (it might
    // not have asked for the badge count this caller wants).
    await inflight
    return load(token, { badges: options.badges })
  }

  inflight = (async () => {
    try {
      const res = await fetch(`/api/dashboard/activity${wantBadges ? '?badges=1' : ''}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok || token !== currentToken) {return}
      const data = await res.json()
      const activity = data.activity as ActivitySummary & { campaign_badge?: number }
      summary = { messages: activity.messages, notifications: activity.notifications }
      fetchedAt = Date.now()
      if (typeof activity.campaign_badge === 'number') {
        campaignBadge = activity.campaign_badge
        badgeFetchedAt = Date.now()
      }
      notify()
    } catch {
      // Network blip: the next tick retries.
    } finally {
      inflight = null
    }
  })()
  return inflight
}

export function useActivity(token: string | null, options?: { badges?: boolean }) {
  const badges = Boolean(options?.badges)
  const [, setTick] = useState(0)

  useEffect(() => {
    const listener = () => setTick((t) => t + 1)
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  }, [])

  useEffect(() => {
    if (token) {void load(token, { badges })}
  }, [token, badges])

  const poll = useCallback(() => {
    // Several components poll; whichever ticks first fetches, the rest reuse it.
    if (token) {void load(token, { badges, maxAgeMs: POLL_INTERVAL_MS - 5_000 })}
  }, [token, badges])
  usePolling(poll, POLL_INTERVAL_MS, { enabled: Boolean(token) })

  const refresh = useCallback(() => (token ? load(token, { force: true, badges }) : Promise.resolve()), [token, badges])

  const sameUser = token !== null && token === currentToken
  return {
    activity: sameUser ? summary : null,
    campaignBadge: sameUser ? campaignBadge : null,
    refresh,
  }
}
