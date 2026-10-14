'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, AlertTriangle, CalendarDays, ChevronLeft, ChevronRight, Clock, Download, List, Loader2, RotateCcw } from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'
import { CampaignCreatorDrawer } from '@/components/campaigns/CampaignCreatorDrawer'
import { CAMPAIGN_CREATOR_STATUS_BADGE } from '@/components/campaigns/utils'
import { generateIcsEvent, downloadIcsFile } from '@/lib/ics'
import type { CampaignCreatorStatus } from '@/types/campaigns'

interface Profile { id: string; [key: string]: unknown }

interface CalendarItem {
  deliverable_id: string
  campaign_creator_id: string
  campaign_id: string
  campaign_title: string | null
  client_name?: string | null
  creator_id?: string
  currency?: string
  creator_name: string | null
  title: string
  kind: 'draft_due' | 'publish_due'
  date: string
  status: CampaignCreatorStatus
  overdue: boolean
  dueSoon: boolean
}

type ViewMode = 'list' | 'month'

function formatDay(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function CalendarPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [userType, setUserType] = useState<'brand' | 'creator' | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [items, setItems] = useState<CalendarItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [view, setView] = useState<ViewMode>('list')
  const [campaignFilter, setCampaignFilter] = useState('')
  const [clientFilter, setClientFilter] = useState('')
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [drawerItem, setDrawerItem] = useState<CalendarItem | null>(null)

  const load = useCallback(async () => {
    const userStr = localStorage.getItem('auth_user')
    const profileStr = localStorage.getItem('auth_profile')
    const authToken = localStorage.getItem('auth_token')

    if (!userStr || !authToken) {
      router.push('/login')
      return
    }
    const user = JSON.parse(userStr)
    setUserType(user.user_type)
    setProfile(profileStr ? JSON.parse(profileStr) : null)
    setToken(authToken)
    setLoading(true)
    setLoadError(false)

    try {
      const params = new URLSearchParams()
      if (user.user_type === 'brand') {
        if (campaignFilter) {params.set('campaign_id', campaignFilter)}
        if (clientFilter) {params.set('client_name', clientFilter)}
      }
      const res = await fetch(`/api/calendar?${params.toString()}`, { headers: { Authorization: `Bearer ${authToken}` } })
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
      } else {
        setLoadError(true)
      }
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [router, campaignFilter, clientFilter])

  useEffect(() => { load() }, [load])

  const sortedItems = useMemo(() => [...items].sort((a, b) => a.date.localeCompare(b.date)), [items])
  const overdueCount = items.filter((i) => i.overdue).length

  const itemsByDay = useMemo(() => {
    const map: Record<string, CalendarItem[]> = {}
    for (const item of sortedItems) {
      map[item.date] = map[item.date] || []
      map[item.date].push(item)
    }
    return map
  }, [sortedItems])

  const monthDays = useMemo(() => {
    const year = monthCursor.getFullYear()
    const month = monthCursor.getMonth()
    const firstDay = new Date(year, month, 1)
    const startOffset = firstDay.getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days: (string | null)[] = Array(startOffset).fill(null)
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
    }
    return days
  }, [monthCursor])

  const visibleItems = view === 'month' && selectedDay
    ? sortedItems.filter((i) => i.date === selectedDay)
    : sortedItems

  function openItem(item: CalendarItem) {
    if (userType === 'brand') {
      setDrawerItem(item)
    } else {
      router.push(`/dashboard/my-campaigns/${item.campaign_creator_id}`)
    }
  }

  function addToCalendar(item: CalendarItem) {
    const ics = generateIcsEvent({
      uid: `${item.deliverable_id}-${item.kind}`,
      title: `${item.kind === 'draft_due' ? 'Draft due' : 'Publish due'}: ${item.title}`,
      description: item.campaign_title ? `Campaign: ${item.campaign_title}` : undefined,
      date: item.date,
    })
    downloadIcsFile(`${item.title.replace(/[^a-z0-9]/gi, '-')}.ics`, ics)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-purple" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader userType={userType || 'brand'} profile={profile} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Calendar
              {overdueCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" /> {overdueCount} overdue
                </span>
              )}
            </h1>
            <p className="text-gray-500 mt-1">Draft and publish due dates across {userType === 'brand' ? 'your campaigns' : 'your campaigns'}.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setView('list')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium ${view === 'list' ? 'bg-gradient-to-r from-brand-pink to-brand-purple text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
            >
              <List className="w-4 h-4" /> List
            </button>
            <button
              onClick={() => setView('month')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium ${view === 'month' ? 'bg-gradient-to-r from-brand-pink to-brand-purple text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
            >
              <CalendarDays className="w-4 h-4" /> Month
            </button>
          </div>
        </div>

        {userType === 'brand' && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <input
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value)}
              placeholder="Filter by campaign id…"
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink"
            />
            <input
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              placeholder="Filter by client name…"
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink"
            />
          </div>
        )}

        {loadError ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <AlertCircle className="w-12 h-12 text-red-300 mx-auto" />
            <h3 className="mt-4 font-semibold text-gray-900">Couldn&apos;t load the calendar</h3>
            <button onClick={load} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-purple text-white rounded-lg font-medium">
              <RotateCcw className="w-4 h-4" /> Retry
            </button>
          </div>
        ) : (
          <>
            {view === 'month' && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))} className="p-1.5 hover:bg-gray-100 rounded-lg" aria-label="Previous month">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-medium text-gray-900">{monthCursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                  <button onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))} className="p-1.5 hover:bg-gray-100 rounded-lg" aria-label="Next month">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-1">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {monthDays.map((day, i) => {
                    const dayItems = day ? itemsByDay[day] || [] : []
                    const hasOverdue = dayItems.some((it) => it.overdue)
                    return (
                      <button
                        key={i}
                        disabled={!day}
                        onClick={() => day && setSelectedDay(day === selectedDay ? null : day)}
                        className={`aspect-square rounded-lg text-xs flex flex-col items-center justify-center gap-0.5 ${
                          !day ? 'invisible' : selectedDay === day ? 'bg-brand-pink/10 border border-brand-pink' : 'hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        <span className="text-gray-700">{day?.split('-')[2]}</span>
                        {dayItems.length > 0 && (
                          <span className={`w-1.5 h-1.5 rounded-full ${hasOverdue ? 'bg-red-500' : 'bg-brand-purple'}`} />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {visibleItems.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                <CalendarDays className="w-12 h-12 text-gray-300 mx-auto" />
                <h3 className="mt-4 font-semibold text-gray-900">Nothing due</h3>
                <p className="text-gray-500 mt-1">{selectedDay ? 'No due dates on this day.' : 'Deliverable due dates will show up here.'}</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                {visibleItems.map((item) => {
                  const badge = CAMPAIGN_CREATOR_STATUS_BADGE[item.status] || null
                  return (
                    <div key={`${item.deliverable_id}-${item.kind}`} className="flex items-center gap-4 p-4">
                      <button onClick={() => openItem(item)} className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm font-medium ${item.overdue ? 'text-red-600' : item.dueSoon ? 'text-amber-600' : 'text-gray-900'}`}>
                            {formatDay(item.date)}
                          </span>
                          {item.overdue && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                          {item.dueSoon && !item.overdue && <Clock className="w-3.5 h-3.5 text-amber-500" />}
                          <span className="text-xs text-gray-400">{item.kind === 'draft_due' ? 'Draft due' : 'Publish due'}</span>
                        </div>
                        <p className="text-sm text-gray-700 mt-0.5">{item.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {item.campaign_title}
                          {item.client_name ? ` · ${item.client_name}` : ''}
                          {item.creator_name ? ` · ${item.creator_name}` : ''}
                        </p>
                      </button>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {badge && <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>{badge.label}</span>}
                        <button onClick={() => addToCalendar(item)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg" aria-label="Add to calendar" title="Add to calendar (.ics)">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </main>

      {drawerItem && drawerItem.creator_id && (
        <CampaignCreatorDrawer
          campaignCreatorId={drawerItem.campaign_creator_id}
          creatorId={drawerItem.creator_id}
          creatorName={drawerItem.creator_name || 'Creator'}
          currency={drawerItem.currency || 'USD'}
          token={token}
          onClose={() => setDrawerItem(null)}
          onChanged={load}
        />
      )}
    </div>
  )
}
