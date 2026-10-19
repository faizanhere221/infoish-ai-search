'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  AlertCircle, ArrowLeft, Loader2, Plus, Trash2, Pencil, MessageSquare,
  ExternalLink, Download, RotateCcw, DollarSign, TrendingUp, Users, BarChart3,
  FileClock, AlertTriangle, Info, Receipt,
} from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'
import { AddCreatorToTrackerModal } from '@/components/campaigns/AddCreatorToTrackerModal'
import { EditCampaignCreatorModal } from '@/components/campaigns/EditCampaignCreatorModal'
import { ShareLinkPanel } from '@/components/campaigns/ShareLinkPanel'
import { CampaignCreatorDrawer, type DrawerTab } from '@/components/campaigns/CampaignCreatorDrawer'
import { getNextStep } from '@/lib/campaign-creator-next-step'
import { formatMoney, formatDate, CAMPAIGN_CREATOR_STATUS_BADGE } from '@/components/campaigns/utils'
import {
  CAMPAIGN_CREATOR_STATUSES,
  CAMPAIGN_CREATOR_STATUS_LABELS,
  type Campaign,
  type CampaignCreator,
  type CampaignCreatorStatus,
  type RosterEntry,
} from '@/types/campaigns'

interface Profile { id: string; [key: string]: unknown }

type SortBy = 'created' | 'planned_date' | 'profit'

const CONTRACT_STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Contract: draft' },
  sent: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Contract: sent' },
  signed_by_creator: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Contract: 1/2 signed' },
  signed_by_brand: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Contract: 1/2 signed' },
  fully_signed: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Contract: signed' },
}

const PAYMENT_STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  scheduled: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Scheduled' },
  due: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Due' },
  marked_paid: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Marked paid' },
  confirmed: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Paid' },
  disputed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Disputed' },
}

export default function CampaignTrackerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    }>
      <CampaignTrackerPageContent />
    </Suspense>
  )
}

function CampaignTrackerPageContent() {
  const params = useParams<{ id: string }>()
  const campaignId = params.id
  const router = useRouter()
  const searchParams = useSearchParams()

  const [token, setToken] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [rows, setRows] = useState<CampaignCreator[]>([])
  const [roster, setRoster] = useState<RosterEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const [statusFilter, setStatusFilter] = useState<CampaignCreatorStatus | 'all'>('all')
  const [sortBy, setSortBy] = useState<SortBy>('created')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState<CampaignCreatorStatus | ''>('')

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingRow, setEditingRow] = useState<CampaignCreator | null>(null)
  const [drawerRow, setDrawerRow] = useState<CampaignCreator | null>(null)
  const [drawerTab, setDrawerTab] = useState<DrawerTab | undefined>(undefined)
  const [pendingReviewCount, setPendingReviewCount] = useState(0)
  const [overduePaymentsCount, setOverduePaymentsCount] = useState(0)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  function showToast(message: string) {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  const authHeader = useCallback((): Record<string, string> => (token ? { Authorization: `Bearer ${token}` } : {}), [token])

  const load = useCallback(async () => {
    const userStr = localStorage.getItem('auth_user')
    const profileStr = localStorage.getItem('auth_profile')
    const authToken = localStorage.getItem('auth_token')

    if (!userStr || !authToken) {
      router.push('/login')
      return
    }

    const user = JSON.parse(userStr)
    if (user.user_type !== 'brand') {
      router.push('/dashboard/campaigns')
      return
    }

    setToken(authToken)
    const userProfile = profileStr ? JSON.parse(profileStr) : null
    setProfile(userProfile)
    setLoading(true)
    setLoadError(false)

    const header = { Authorization: `Bearer ${authToken}` }

    try {
      const [campaignRes, rowsRes, rosterRes] = await Promise.all([
        fetch(`/api/campaigns/${campaignId}`, { headers: header }),
        fetch(`/api/campaigns/${campaignId}/creators`, { headers: header }),
        fetch(`/api/roster?limit=100`, { headers: header }),
      ])

      if (!campaignRes.ok) {
        router.push('/dashboard/campaigns')
        return
      }
      const campaignData = await campaignRes.json()
      if (userProfile?.id !== campaignData.campaign.brand_id) {
        router.push('/dashboard/campaigns')
        return
      }
      setCampaign(campaignData.campaign)

      if (rowsRes.ok) {
        const rowsData = await rowsRes.json()
        setRows(rowsData.campaign_creators || [])
        setPendingReviewCount(rowsData.pending_review_count || 0)
        setOverduePaymentsCount(rowsData.overdue_payments_count || 0)
      } else {
        setLoadError(true)
      }

      if (rosterRes.ok) {
        const rosterData = await rosterRes.json()
        setRoster(rosterData.roster || [])
      }
    } catch (err) {
      console.error('Error loading tracker:', err)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [campaignId, router])

  useEffect(() => { load() }, [load])

  // Deep link from a chat message card or notification: ?row=<id>&tab=<tab>
  // opens that row's drawer straight to the right tab, same as clicking it
  // manually would.
  useEffect(() => {
    if (rows.length === 0) {return}
    const rowId = searchParams.get('row')
    if (!rowId) {return}
    const match = rows.find((r) => r.id === rowId)
    if (match) {
      setDrawerRow(match)
      const tab = searchParams.get('tab')
      if (tab) {setDrawerTab(tab as DrawerTab)}
    }
  }, [rows, searchParams])

  const draftContractRows = useMemo(() => rows.filter((r) => r.contract_status === 'draft'), [rows])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const s of CAMPAIGN_CREATOR_STATUSES) {counts[s] = 0}
    for (const r of rows) {counts[r.status] = (counts[r.status] || 0) + 1}
    return counts
  }, [rows])

  const totals = useMemo(() => {
    const totalPayout = rows.reduce((sum, r) => sum + (r.payout_amount || 0), 0)
    const totalCharge = rows.reduce((sum, r) => sum + (r.charge_amount || 0), 0)
    return { totalPayout, totalCharge, profit: totalCharge - totalPayout }
  }, [rows])

  const visibleRows = useMemo(() => {
    let list = statusFilter === 'all' ? rows : rows.filter((r) => r.status === statusFilter)
    list = [...list].sort((a, b) => {
      if (sortBy === 'planned_date') {
        return (a.planned_date || '').localeCompare(b.planned_date || '')
      }
      if (sortBy === 'profit') {
        const profitA = (a.charge_amount || 0) - (a.payout_amount || 0)
        const profitB = (b.charge_amount || 0) - (b.payout_amount || 0)
        return profitB - profitA
      }
      return a.created_at.localeCompare(b.created_at)
    })
    return list
  }, [rows, statusFilter, sortBy])

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {next.delete(id)} else {next.add(id)}
      return next
    })
  }

  function toggleSelectAll() {
    setSelected((prev) => (prev.size === visibleRows.length ? new Set() : new Set(visibleRows.map((r) => r.id))))
  }

  async function updateRow(id: string, updates: Record<string, unknown>) {
    setPendingId(id)
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/creators/${id}`, {
        method: 'PUT',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (res.ok) {
        const data = await res.json()
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...data.campaign_creator } : r)))
      }
    } finally {
      setPendingId(null)
    }
  }

  async function removeRow(id: string) {
    if (!confirm('Remove this creator from the tracker?')) {return}
    setPendingId(id)
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/creators/${id}`, {
        method: 'DELETE',
        headers: authHeader(),
      })
      if (res.ok) {
        setRows((prev) => prev.filter((r) => r.id !== id))
        showToast('Creator removed')
      }
    } finally {
      setPendingId(null)
    }
  }

  async function messageCreator(creatorId: string) {
    setPendingId(creatorId)
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ creator_id: creatorId, brand_id: profile?.id }),
      })
      if (res.ok) {
        const data = await res.json()
        router.push(`/messages/${data.conversation.id}`)
      }
    } finally {
      setPendingId(null)
    }
  }

  async function applyBulkStatus() {
    if (!bulkStatus || selected.size === 0) {return}
    const ids = [...selected]
    const res = await fetch(`/api/campaigns/${campaignId}/creators/bulk-status`, {
      method: 'PUT',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, status: bulkStatus }),
    })
    if (res.ok) {
      setRows((prev) => prev.map((r) => (ids.includes(r.id) ? { ...r, status: bulkStatus } : r)))
      setSelected(new Set())
      setBulkStatus('')
      showToast(`${ids.length} creator${ids.length === 1 ? '' : 's'} updated`)
    }
  }

  async function handleAddCreator(params: {
    creator_id: string
    planned_date: string | null
    payout_amount: number | null
    charge_amount: number | null
    currency: string
  }) {
    const res = await fetch(`/api/campaigns/${campaignId}/creators`, {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    if (res.ok) {
      await load()
      setShowAddModal(false)
      showToast('Creator added to campaign')
    } else {
      const err = await res.json().catch(() => ({}))
      showToast(err.error || 'Failed to add creator')
    }
  }

  function exportCsv() {
    const header = ['Creator', 'Handle', 'Status', 'Planned date', 'Posted', 'Payout', 'Charge', 'Profit', 'Currency']
    const lines = [header.join(',')]
    for (const r of visibleRows) {
      const profit = (r.charge_amount || 0) - (r.payout_amount || 0)
      const fields = [
        r.creator?.display_name || '',
        r.creator?.username || '',
        CAMPAIGN_CREATOR_STATUS_LABELS[r.status],
        r.planned_date || '',
        r.posted_url || '',
        r.payout_amount ?? '',
        r.charge_amount ?? '',
        profit,
        r.currency,
      ]
      lines.push(fields.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(','))
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${campaign?.title || 'campaign'}-tracker.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-purple" />
      </div>
    )
  }

  if (!campaign) {return null}

  const existingCreatorIds = rows.map((r) => r.creator_id)

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader userType="brand" profile={profile} />

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-14">
            <Link href={`/campaigns/${campaignId}`} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="min-w-0">
              <h1 className="font-semibold text-gray-900 truncate">{campaign.title} — Tracker</h1>
              {campaign.client_name && <p className="text-xs text-gray-500">Client: {campaign.client_name}</p>}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {draftContractRows.length > 0 && (
          <button
            onClick={() => { setDrawerRow(draftContractRows[0]); setDrawerTab('contract') }}
            className="flex items-center gap-2 p-3 mb-6 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 hover:bg-blue-100 w-full text-left"
          >
            <FileClock className="w-4 h-4 flex-shrink-0" />
            Offer accepted for {draftContractRows.length} creator{draftContractRows.length === 1 ? '' : 's'}. Review and send the contract.
          </button>
        )}

        {pendingReviewCount > 0 && (
          <div className="flex items-center gap-2 p-3 mb-6 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <FileClock className="w-4 h-4 flex-shrink-0" />
            {pendingReviewCount} draft{pendingReviewCount === 1 ? '' : 's'} waiting for review
          </div>
        )}

        {overduePaymentsCount > 0 && (
          <Link
            href="/dashboard/payments"
            className="flex items-center gap-2 p-3 mb-6 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 hover:bg-red-100"
          >
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {overduePaymentsCount} overdue payment{overduePaymentsCount === 1 ? '' : 's'}
          </Link>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1"><DollarSign className="w-4 h-4" /> Total payout</div>
            <p className="text-2xl font-bold text-gray-900">{formatMoney(totals.totalPayout, campaign.currency)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1"><DollarSign className="w-4 h-4" /> Total charge</div>
            <p className="text-2xl font-bold text-gray-900">{formatMoney(totals.totalCharge, campaign.currency)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1"><TrendingUp className="w-4 h-4" /> Profit</div>
            <p className={`text-2xl font-bold ${totals.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatMoney(totals.profit, campaign.currency)}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1"><Users className="w-4 h-4" /> Creators</div>
            <p className="text-2xl font-bold text-gray-900">{rows.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-brand-pink to-brand-purple text-white rounded-lg text-sm font-medium hover:shadow-lg"
              >
                <Plus className="w-4 h-4" /> Add creator
              </button>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as CampaignCreatorStatus | 'all')}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink"
                aria-label="Filter by status"
              >
                <option value="all">All statuses ({rows.length})</option>
                {CAMPAIGN_CREATOR_STATUSES.map((s) => (
                  <option key={s} value={s}>{CAMPAIGN_CREATOR_STATUS_LABELS[s]} ({statusCounts[s]})</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink"
                aria-label="Sort by"
              >
                <option value="created">Sort: Newest added</option>
                <option value="planned_date">Sort: Planned date</option>
                <option value="profit">Sort: Profit</option>
              </select>

              <Link
                href={`/dashboard/campaigns/${campaignId}/report`}
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 ml-auto"
              >
                <BarChart3 className="w-4 h-4" /> Report
              </Link>

              {campaign.client_name && (
                <Link
                  href={`/invoices/${campaignId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  <Receipt className="w-4 h-4" /> Invoice
                </Link>
              )}

              <button
                onClick={exportCsv}
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>

            {selected.size > 0 && (
              <div className="flex items-center gap-3 p-3 bg-brand-pink/5 border border-brand-pink/20 rounded-lg">
                <span className="text-sm text-gray-700">{selected.size} selected</span>
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value as CampaignCreatorStatus | '')}
                  className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="">Change status to…</option>
                  {CAMPAIGN_CREATOR_STATUSES.map((s) => (
                    <option key={s} value={s}>{CAMPAIGN_CREATOR_STATUS_LABELS[s]}</option>
                  ))}
                </select>
                <button
                  onClick={applyBulkStatus}
                  disabled={!bulkStatus}
                  className="px-3 py-1.5 bg-brand-purple text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  Apply
                </button>
                <button onClick={() => setSelected(new Set())} className="text-sm text-gray-500 hover:underline ml-auto">
                  Clear
                </button>
              </div>
            )}

            {loadError ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                <AlertCircle className="w-12 h-12 text-red-300 mx-auto" />
                <h3 className="mt-4 font-semibold text-gray-900">Couldn&apos;t load the tracker</h3>
                <button
                  onClick={load}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-purple text-white rounded-lg font-medium hover:shadow-lg"
                >
                  <RotateCcw className="w-4 h-4" /> Retry
                </button>
              </div>
            ) : visibleRows.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                <Users className="w-12 h-12 text-gray-300 mx-auto" />
                <h3 className="mt-4 font-semibold text-gray-900">{rows.length === 0 ? 'No creators yet' : 'No creators match this filter'}</h3>
                <p className="text-gray-500 mt-1">{rows.length === 0 ? 'Add a creator to start tracking this campaign.' : 'Try a different status filter.'}</p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-left text-gray-500">
                        <th className="p-3 w-8">
                          <input
                            type="checkbox"
                            checked={selected.size > 0 && selected.size === visibleRows.length}
                            onChange={toggleSelectAll}
                            aria-label="Select all"
                            className="rounded border-gray-300 text-brand-purple focus:ring-brand-pink"
                          />
                        </th>
                        <th className="p-3">Creator</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Planned date</th>
                        <th className="p-3">Posted</th>
                        <th className="p-3 text-right">Payout</th>
                        <th className="p-3 text-right">Charge</th>
                        <th className="p-3 text-right">Profit</th>
                        <th className="p-3">Payment</th>
                        <th className="p-3">Next step</th>
                        <th className="p-3 w-28">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRows.map((row) => {
                        const badge = CAMPAIGN_CREATOR_STATUS_BADGE[row.status]
                        const profit = (row.charge_amount || 0) - (row.payout_amount || 0)
                        const isPending = pendingId === row.id
                        return (
                          <tr
                            key={row.id}
                            onClick={() => setDrawerRow(row)}
                            className="border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50"
                          >
                            <td className="p-3 align-top" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selected.has(row.id)}
                                onChange={() => toggleSelect(row.id)}
                                aria-label={`Select ${row.creator?.display_name}`}
                                className="rounded border-gray-300 text-brand-purple focus:ring-brand-pink"
                              />
                            </td>
                            <td className="p-3 align-top">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-brand-purple/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                  {row.creator?.profile_photo_url ? (
                                    <Image src={row.creator.profile_photo_url} alt="" width={32} height={32} className="object-cover w-full h-full" />
                                  ) : (
                                    <span className="text-xs font-semibold text-brand-purple-dark">{row.creator?.display_name?.charAt(0) || '?'}</span>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-gray-900 truncate flex items-center gap-1.5">
                                    {row.creator?.display_name}
                                    {!!row.deliverables_overdue && (
                                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-semibold" title="Overdue deliverable">
                                        <AlertTriangle className="w-2.5 h-2.5" /> {row.deliverables_overdue}
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">@{row.creator?.username} {row.creator?.primary_platform ? `· ${row.creator.primary_platform}` : ''}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 align-top" onClick={(e) => e.stopPropagation()}>
                              <select
                                value={row.status}
                                disabled={isPending}
                                onChange={(e) => updateRow(row.id, { status: e.target.value })}
                                className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${badge.bg} ${badge.text} focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink`}
                              >
                                {CAMPAIGN_CREATOR_STATUSES.map((s) => (
                                  <option key={s} value={s}>{CAMPAIGN_CREATOR_STATUS_LABELS[s]}</option>
                                ))}
                              </select>
                              {row.status_locked && (
                                <div className="mt-1 flex items-center gap-1.5">
                                  <span
                                    className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-semibold"
                                    title="This status was set by hand and will not auto-update from deliverable progress"
                                  >
                                    Manual
                                  </span>
                                  <button
                                    onClick={() => updateRow(row.id, { status_locked: false })}
                                    disabled={isPending}
                                    className="text-[10px] text-brand-purple-dark hover:underline"
                                  >
                                    Resume auto-sync
                                  </button>
                                </div>
                              )}
                              {row.contract_status && CONTRACT_STATUS_BADGE[row.contract_status] && (
                                <span className={`mt-1 inline-block px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${CONTRACT_STATUS_BADGE[row.contract_status].bg} ${CONTRACT_STATUS_BADGE[row.contract_status].text}`}>
                                  {CONTRACT_STATUS_BADGE[row.contract_status].label}
                                </span>
                              )}
                            </td>
                            <td className="p-3 align-top" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="date"
                                value={row.planned_date || ''}
                                disabled={isPending}
                                onChange={(e) => updateRow(row.id, { planned_date: e.target.value || null })}
                                className="px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-pink"
                              />
                            </td>
                            <td className="p-3 align-top" onClick={(e) => e.stopPropagation()}>
                              {row.posted_url ? (
                                <a href={row.posted_url} target="_blank" rel="noopener noreferrer" className="text-brand-purple-dark hover:underline inline-flex items-center gap-1" aria-label="View posted content">
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              ) : (
                                <span className="text-gray-300">—</span>
                              )}
                            </td>
                            <td className="p-3 align-top text-right text-gray-900">{row.payout_amount !== null ? formatMoney(row.payout_amount, row.currency) : '—'}</td>
                            <td className="p-3 align-top text-right text-gray-900">{row.charge_amount !== null ? formatMoney(row.charge_amount, row.currency) : '—'}</td>
                            <td className={`p-3 align-top text-right font-medium ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {formatMoney(profit, row.currency)}
                            </td>
                            <td className="p-3 align-top">
                              {row.payment_status && PAYMENT_STATUS_BADGE[row.payment_status] ? (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${PAYMENT_STATUS_BADGE[row.payment_status].bg} ${PAYMENT_STATUS_BADGE[row.payment_status].text}`}>
                                  {row.payment_overdue && <AlertTriangle className="w-3 h-3" />}
                                  {row.payment_overdue ? 'Overdue' : PAYMENT_STATUS_BADGE[row.payment_status].label}
                                </span>
                              ) : (
                                <span className="text-gray-300">—</span>
                              )}
                            </td>
                            <td className="p-3 align-top" onClick={(e) => e.stopPropagation()}>
                              {(() => {
                                const step = getNextStep(row, 'brand')
                                if (!step) {return <span className="text-gray-300">—</span>}
                                return (
                                  <button
                                    onClick={() => { setDrawerRow(row); setDrawerTab(step.tab) }}
                                    className={`text-left text-xs hover:underline ${step.mine ? 'text-brand-purple-dark font-medium' : 'text-gray-500'}`}
                                  >
                                    {step.label}
                                  </button>
                                )
                              })()}
                            </td>
                            <td className="p-3 align-top" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setDrawerRow(row)}
                                  className="relative inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-brand-purple-dark hover:bg-brand-pink/10 rounded-lg"
                                  aria-label="Open details"
                                >
                                  Open
                                  {!!row.deliverables_pending_review && (
                                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                                      {row.deliverables_pending_review}
                                    </span>
                                  )}
                                </button>
                                <button onClick={() => messageCreator(row.creator_id)} disabled={isPending} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg" aria-label="Message creator" title="Message">
                                  <MessageSquare className="w-4 h-4" />
                                </button>
                                <button onClick={() => setEditingRow(row)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg" aria-label="Edit row" title="Edit">
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button onClick={() => removeRow(row.id)} disabled={isPending} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" aria-label="Remove from campaign" title="Remove">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile stacked cards */}
                <div className="md:hidden space-y-3">
                  {visibleRows.map((row) => {
                    const badge = CAMPAIGN_CREATOR_STATUS_BADGE[row.status]
                    const profit = (row.charge_amount || 0) - (row.payout_amount || 0)
                    const step = getNextStep(row, 'brand')
                    return (
                      <div key={row.id} className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={selected.has(row.id)}
                              onChange={() => toggleSelect(row.id)}
                              aria-label={`Select ${row.creator?.display_name}`}
                              className="rounded border-gray-300 text-brand-purple focus:ring-brand-pink flex-shrink-0"
                            />
                            <div className="w-8 h-8 rounded-full bg-brand-purple/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {row.creator?.profile_photo_url ? (
                                <Image src={row.creator.profile_photo_url} alt="" width={32} height={32} className="object-cover w-full h-full" />
                              ) : (
                                <span className="text-xs font-semibold text-brand-purple-dark">{row.creator?.display_name?.charAt(0) || '?'}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate">{row.creator?.display_name}</p>
                              <p className="text-xs text-gray-500 truncate">@{row.creator?.username}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>{badge.label}</span>
                            {row.status_locked && (
                              <button
                                onClick={() => updateRow(row.id, { status_locked: false })}
                                className="text-[10px] text-brand-purple-dark hover:underline"
                              >
                                Manual · Resume auto-sync
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-center mb-3">
                          <div>
                            <p className="text-gray-400">Payout</p>
                            <p className="font-medium text-gray-900">{row.payout_amount !== null ? formatMoney(row.payout_amount, row.currency) : '—'}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Charge</p>
                            <p className="font-medium text-gray-900">{row.charge_amount !== null ? formatMoney(row.charge_amount, row.currency) : '—'}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Profit</p>
                            <p className={`font-medium ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatMoney(profit, row.currency)}</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">Planned: {formatDate(row.planned_date)}</p>
                        {step && (
                          <button
                            onClick={() => { setDrawerRow(row); setDrawerTab(step.tab) }}
                            className={`block w-full text-left text-xs mb-3 ${step.mine ? 'text-brand-purple-dark font-medium' : 'text-gray-500'}`}
                          >
                            {step.label}
                          </button>
                        )}
                        <div className="flex items-center gap-2">
                          <button onClick={() => setDrawerRow(row)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600">
                            <Info className="w-3.5 h-3.5" /> Offer
                          </button>
                          <button onClick={() => messageCreator(row.creator_id)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600">
                            <MessageSquare className="w-3.5 h-3.5" /> Message
                          </button>
                          <button onClick={() => setEditingRow(row)} className="p-1.5 border border-gray-200 rounded-lg text-gray-600">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => removeRow(row.id)} className="p-1.5 text-red-500 border border-gray-200 rounded-lg">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          <div className="space-y-6">
            <ShareLinkPanel campaignId={campaignId} token={token} />
          </div>
        </div>
      </main>

      {showAddModal && (
        <AddCreatorToTrackerModal
          roster={roster}
          existingCreatorIds={existingCreatorIds}
          token={token}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddCreator}
        />
      )}

      {editingRow && (
        <EditCampaignCreatorModal
          row={editingRow}
          onClose={() => setEditingRow(null)}
          onSave={async (updates) => {
            await updateRow(editingRow.id, updates)
            setEditingRow(null)
          }}
        />
      )}

      {drawerRow && (
        <CampaignCreatorDrawer
          campaignCreatorId={drawerRow.id}
          creatorId={drawerRow.creator_id}
          creatorName={drawerRow.creator?.display_name || 'Creator'}
          currency={drawerRow.currency}
          rowStatus={drawerRow.status}
          initialTab={drawerTab}
          token={token}
          onClose={() => { setDrawerRow(null); setDrawerTab(undefined) }}
          onChanged={load}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 px-4 py-3 bg-gray-900 text-white rounded-xl shadow-lg text-sm z-50">
          {toast}
        </div>
      )}
    </div>
  )
}
