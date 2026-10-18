'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Pencil, Pause, Play, Ban, AlertCircle, Loader2,
  Users, UserCheck, DollarSign, Wallet, Wallet2, Plus, RefreshCw, UserPlus,
} from 'lucide-react'
import PartnerStatsCard from '@/components/partner/PartnerStatsCard'
import CopyReferralLink from '@/components/partner/CopyReferralLink'
import ReferralTable from '@/components/partner/ReferralTable'
import CommissionTable from '@/components/partner/CommissionTable'
import PayoutTable from '@/components/partner/PayoutTable'
import RecordPayoutModal from '@/components/admin/RecordPayoutModal'
import LinkUserModal from '@/components/admin/LinkUserModal'
import { ReasonDialog } from '@/components/admin/ReasonDialog'
import { formatCents } from '@/lib/referral'
import type { PartnerStats, PartnerStatus, ReferralCommission, ReferralPartner, ReferralPayout, ReferralSignup } from '@/types/referral'

type Tab = 'referrals' | 'commissions' | 'payouts'

const TABS: { id: Tab; label: string }[] = [
  { id: 'referrals', label: 'Referrals' },
  { id: 'commissions', label: 'Commissions' },
  { id: 'payouts', label: 'Payouts' },
]

const STATUS_STYLES: Record<PartnerStatus, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  paused: 'bg-amber-100 text-amber-700',
  deactivated: 'bg-gray-100 text-gray-600',
}

export default function AdminPartnerDetailPage({ params }: { params: { id: string } }) {
  const partnerId = params.id
  const router = useRouter()

  const [partner, setPartner] = useState<ReferralPartner | null>(null)
  const [stats, setStats] = useState<PartnerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [loadError, setLoadError] = useState(false)

  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editRate, setEditRate] = useState('')
  const [editStatus, setEditStatus] = useState<PartnerStatus>('active')
  const [editReason, setEditReason] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const [statusActionLoading, setStatusActionLoading] = useState(false)
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)
  const [pendingStatusAction, setPendingStatusAction] = useState<PartnerStatus | null>(null)
  const [showLinkUserModal, setShowLinkUserModal] = useState(false)

  const [activeTab, setActiveTab] = useState<Tab>('referrals')
  const [referrals, setReferrals] = useState<ReferralSignup[]>([])
  const [referralsLoading, setReferralsLoading] = useState(true)
  const [referralsError, setReferralsError] = useState(false)
  const [commissions, setCommissions] = useState<ReferralCommission[]>([])
  const [commissionsLoading, setCommissionsLoading] = useState(true)
  const [commissionsError, setCommissionsError] = useState(false)
  const [commissionActionId, setCommissionActionId] = useState<string | null>(null)
  const [confirmApproveCommissionId, setConfirmApproveCommissionId] = useState<string | null>(null)
  const [confirmCancelCommissionId, setConfirmCancelCommissionId] = useState<string | null>(null)
  const [payouts, setPayouts] = useState<ReferralPayout[]>([])
  const [payoutsLoading, setPayoutsLoading] = useState(true)
  const [payoutsError, setPayoutsError] = useState(false)
  const [showPayoutModal, setShowPayoutModal] = useState(false)

  const fetchDetail = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const res = await fetch(`/api/admin/partners/${partnerId}`)
      if (res.status === 401 || res.status === 403) {
        router.push('/admin/login')
        return
      }
      if (res.status === 404) {
        setNotFound(true)
        setLoading(false)
        return
      }
      if (!res.ok) {throw new Error('Failed to load partner')}
      const data = await res.json()
      setPartner(data.partner)
      setStats(data.stats)
      setEditName(data.partner.name)
      setEditEmail(data.partner.email)
      setEditRate(String(data.partner.commission_rate))
      setEditStatus(data.partner.status)
    } catch (err) {
      console.error('Error fetching partner detail:', err)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [partnerId, router])

  const fetchPayouts = useCallback(async () => {
    setPayoutsLoading(true)
    setPayoutsError(false)
    try {
      const res = await fetch(`/api/admin/partners/${partnerId}/payouts`)
      if (!res.ok) {throw new Error('Failed to load payouts')}
      const data = await res.json()
      setPayouts(data.payouts ?? [])
    } catch (err) {
      console.error('Error fetching payouts:', err)
      setPayoutsError(true)
    } finally {
      setPayoutsLoading(false)
    }
  }, [partnerId])

  const fetchCommissions = useCallback(async () => {
    setCommissionsLoading(true)
    setCommissionsError(false)
    try {
      const res = await fetch(`/api/admin/partners/${partnerId}/commissions`)
      if (!res.ok) {throw new Error('Failed to load commissions')}
      const data = await res.json()
      setCommissions(data.commissions ?? [])
    } catch (err) {
      console.error('Error fetching commissions:', err)
      setCommissionsError(true)
    } finally {
      setCommissionsLoading(false)
    }
  }, [partnerId])

  const fetchReferrals = useCallback(async () => {
    setReferralsLoading(true)
    setReferralsError(false)
    try {
      const res = await fetch(`/api/admin/partners/${partnerId}/referrals`)
      if (!res.ok) {throw new Error('Failed to load referrals')}
      const data = await res.json()
      setReferrals(data.referrals ?? [])
    } catch (err) {
      console.error('Error fetching referrals:', err)
      setReferralsError(true)
    } finally {
      setReferralsLoading(false)
    }
  }, [partnerId])

  useEffect(() => { fetchDetail() }, [fetchDetail])

  useEffect(() => {
    fetchReferrals()
    fetchCommissions()
    fetchPayouts()
  }, [fetchReferrals, fetchCommissions, fetchPayouts])

  const handleApproveCommission = async (reason: string) => {
    if (!confirmApproveCommissionId) {return}
    setCommissionActionId(confirmApproveCommissionId)
    try {
      const res = await fetch(`/api/admin/partners/${partnerId}/commissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commissionId: confirmApproveCommissionId, status: 'approved', reason }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Failed to approve commission')
      }
      await Promise.all([fetchCommissions(), fetchDetail()])
      setConfirmApproveCommissionId(null)
    } finally {
      setCommissionActionId(null)
    }
  }

  const handleConfirmCancelCommission = async (reason: string) => {
    if (!confirmCancelCommissionId) {return}
    setCommissionActionId(confirmCancelCommissionId)
    try {
      const res = await fetch(`/api/admin/partners/${partnerId}/commissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commissionId: confirmCancelCommissionId, status: 'cancelled', reason }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Failed to cancel commission')
      }
      await Promise.all([fetchCommissions(), fetchDetail()])
      setConfirmCancelCommissionId(null)
    } finally {
      setCommissionActionId(null)
    }
  }

  const updatePartner = async (updates: Record<string, unknown>, reason: string) => {
    const res = await fetch(`/api/admin/partners/${partnerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...updates, reason }),
    })
    const data = await res.json()
    if (!res.ok) {throw new Error(data.error || 'Failed to update partner')}
    setPartner(data.partner)
    return data.partner
  }

  const handleSaveEdit = async () => {
    setEditError(null)
    if (editReason.trim().length < 3) {
      setEditError('Enter a reason (at least 3 characters)')
      return
    }
    setSavingEdit(true)
    try {
      await updatePartner({
        name: editName.trim(),
        email: editEmail.trim(),
        commission_rate: parseFloat(editRate) || 0,
        status: editStatus,
      }, editReason.trim())
      setIsEditing(false)
      setEditReason('')
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update partner')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleConfirmStatusAction = async (reason: string) => {
    if (!pendingStatusAction) {return}
    setStatusActionLoading(true)
    try {
      await updatePartner({ status: pendingStatusAction }, reason)
      setPendingStatusAction(null)
    } finally {
      setStatusActionLoading(false)
    }
  }

  const handleDeactivate = async (reason: string) => {
    const res = await fetch(`/api/admin/partners/${partnerId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {throw new Error(data?.error || 'Failed to deactivate partner')}
    setPartner(data.partner)
    setConfirmDeactivate(false)
  }

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm text-gray-400">Loading partner…</p>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-500 font-medium">Partner not found</p>
        <Link href="/admin/partners" className="mt-4 inline-block text-sm text-violet-600 hover:text-violet-700">
          Back to Partners
        </Link>
      </div>
    )
  }

  if (loadError || !partner) {
    return (
      <div className="py-20 text-center">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-gray-700 font-medium mb-1">Couldn&apos;t load this partner</p>
        <p className="text-sm text-gray-400 mb-4">Something went wrong fetching this data.</p>
        <button
          onClick={() => fetchDetail()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/partners" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to Partners
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{partner.name}</h1>
              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[partner.status]}`}>
                {partner.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">{partner.email}</p>
            {!partner.user_id && (
              <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
                No linked user account — they can&apos;t log in to their own dashboard yet
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!partner.user_id && (
              <button
                onClick={() => setShowLinkUserModal(true)}
                className="flex items-center gap-2 px-3 py-2 border border-violet-200 bg-violet-50 text-violet-700 rounded-lg text-sm font-medium hover:bg-violet-100"
              >
                <UserPlus className="w-4 h-4" /> Link User Account
              </button>
            )}
            {partner.status === 'active' && (
              <button
                onClick={() => setPendingStatusAction('paused')}
                disabled={statusActionLoading}
                className="flex items-center gap-2 px-3 py-2 border border-amber-200 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-100 disabled:opacity-50"
              >
                <Pause className="w-4 h-4" /> Pause
              </button>
            )}
            {partner.status !== 'active' && (
              <button
                onClick={() => setPendingStatusAction('active')}
                disabled={statusActionLoading}
                className="flex items-center gap-2 px-3 py-2 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100 disabled:opacity-50"
              >
                <Play className="w-4 h-4" /> Activate
              </button>
            )}
            {partner.status !== 'deactivated' && (
              <button
                onClick={() => setConfirmDeactivate(true)}
                disabled={statusActionLoading}
                className="flex items-center gap-2 px-3 py-2 border border-red-200 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-50"
              >
                <Ban className="w-4 h-4" /> Deactivate
              </button>
            )}
            <button
              onClick={() => setIsEditing((v) => !v)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-200 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              <Pencil className="w-4 h-4" /> {isEditing ? 'Cancel Edit' : 'Edit'}
            </button>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">Referral link</label>
          <CopyReferralLink code={partner.referral_code} />
        </div>

        {/* Inline Edit Form */}
        {isEditing && (
          <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
            {editError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{editError}</div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Commission Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={editRate}
                  onChange={(e) => setEditRate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as PartnerStatus)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="deactivated">Deactivated</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason *</label>
              <textarea
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                rows={2}
                placeholder="Why are you making this change?"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
              >
                {savingEdit && <Loader2 className="w-4 h-4 animate-spin" />}
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <PartnerStatsCard icon={Users} label="Total Referrals" value={(stats?.total_referrals ?? 0).toString()} color="violet" />
        <PartnerStatsCard icon={UserCheck} label="Active Creators" value={(stats?.active_creators ?? 0).toString()} color="blue" />
        <PartnerStatsCard icon={DollarSign} label="Total Earnings" value={formatCents(stats?.total_earnings_cents ?? 0)} color="emerald" />
        <PartnerStatsCard icon={Wallet2} label="Total Paid" value={formatCents(partner.total_paid_cents)} color="blue" />
        <PartnerStatsCard icon={Wallet} label="Pending Balance" value={formatCents(stats?.pending_payout_cents ?? 0)} color="amber" />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex items-center justify-between">
          <div className="flex gap-6 -mb-px overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-violet-600 text-violet-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {activeTab === 'payouts' && (
            <button
              onClick={() => setShowPayoutModal(true)}
              disabled={(stats?.pending_payout_cents ?? 0) <= 0}
              className="mb-2 flex items-center gap-2 px-3 py-1.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> Record Payout
            </button>
          )}
        </nav>
      </div>

      {activeTab === 'referrals' && (
        referralsError ? (
          <TabError onRetry={fetchReferrals} />
        ) : (
          <ReferralTable referrals={referrals} isLoading={referralsLoading} />
        )
      )}
      {activeTab === 'commissions' && (
        commissionsError ? (
          <TabError onRetry={fetchCommissions} />
        ) : (
          <CommissionTable
            commissions={commissions}
            isLoading={commissionsLoading}
            onApprove={(id) => setConfirmApproveCommissionId(id)}
            onCancel={(id) => setConfirmCancelCommissionId(id)}
            actionLoadingId={commissionActionId}
          />
        )
      )}
      {activeTab === 'payouts' && (
        payoutsError ? (
          <TabError onRetry={fetchPayouts} />
        ) : (
          <PayoutTable payouts={payouts} isLoading={payoutsLoading} />
        )
      )}

      {/* Deactivate confirmation */}
      {confirmDeactivate && (
        <ReasonDialog
          title="Deactivate Partner"
          description="Their referral link will stop working. History is kept."
          danger
          confirmLabel="Deactivate"
          onConfirm={handleDeactivate}
          onClose={() => setConfirmDeactivate(false)}
        />
      )}

      {/* Pause/activate confirmation */}
      {pendingStatusAction && (
        <ReasonDialog
          title={pendingStatusAction === 'paused' ? 'Pause Partner' : 'Activate Partner'}
          description={pendingStatusAction === 'paused' ? 'Their referral link will stop working until reactivated.' : undefined}
          danger={pendingStatusAction === 'paused'}
          confirmLabel="Confirm"
          onConfirm={handleConfirmStatusAction}
          onClose={() => setPendingStatusAction(null)}
        />
      )}

      {/* Approve commission confirmation */}
      {confirmApproveCommissionId && (
        <ReasonDialog
          title="Approve Commission"
          description="This marks the commission as owed to the partner."
          confirmLabel="Approve"
          onConfirm={handleApproveCommission}
          onClose={() => setConfirmApproveCommissionId(null)}
        />
      )}

      {/* Cancel commission confirmation */}
      {confirmCancelCommissionId && (
        <ReasonDialog
          title="Cancel Commission"
          description="The partner will not be paid for this deal. This can't be undone."
          danger
          confirmLabel="Cancel Commission"
          onConfirm={handleConfirmCancelCommission}
          onClose={() => setConfirmCancelCommissionId(null)}
        />
      )}

      {showPayoutModal && (
        <RecordPayoutModal
          partnerId={partnerId}
          pendingBalanceCents={stats?.pending_payout_cents ?? 0}
          onClose={() => setShowPayoutModal(false)}
          onSuccess={() => {
            setShowPayoutModal(false)
            fetchPayouts()
            fetchDetail()
          }}
        />
      )}

      {showLinkUserModal && (
        <LinkUserModal
          partnerId={partnerId}
          onClose={() => setShowLinkUserModal(false)}
          onSuccess={() => {
            setShowLinkUserModal(false)
            fetchDetail()
          }}
        />
      )}
    </div>
  )
}

function TabError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
      <p className="text-gray-700 font-medium mb-1">Couldn&apos;t load this data</p>
      <p className="text-sm text-gray-400 mb-4">Something went wrong. Please try again.</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700"
      >
        <RefreshCw className="w-4 h-4" /> Retry
      </button>
    </div>
  )
}
