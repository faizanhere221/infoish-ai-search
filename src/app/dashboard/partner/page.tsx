'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Users, UserCheck, DollarSign, Wallet, AlertCircle, RefreshCw } from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'
import type { ProfileDropdownProfile } from '@/components/ProfileDropdown'
import PartnerStatsCard from '@/components/partner/PartnerStatsCard'
import CopyReferralLink from '@/components/partner/CopyReferralLink'
import ReferralTable from '@/components/partner/ReferralTable'
import CommissionTable from '@/components/partner/CommissionTable'
import PayoutTable from '@/components/partner/PayoutTable'
import { usePartner } from '@/hooks/usePartner'
import { formatCents } from '@/lib/referral'
import type { PartnerStats, ReferralSignup, ReferralCommission, ReferralPayout } from '@/types/referral'

type Tab = 'referrals' | 'commissions' | 'payouts'

const TABS: { id: Tab; label: string }[] = [
  { id: 'referrals', label: 'Referrals' },
  { id: 'commissions', label: 'Commissions' },
  { id: 'payouts', label: 'Payouts' },
]

interface DashboardUser {
  id: string
  email: string
  user_type: 'creator' | 'brand'
}

export default function PartnerDashboardPage() {
  const { partner, isPartner, isLoading: partnerLoading } = usePartner()
  const [authUser, setAuthUser] = useState<DashboardUser | null>(null)
  const [authProfile, setAuthProfile] = useState<ProfileDropdownProfile | null>(null)
  const [checkedAuth, setCheckedAuth] = useState(false)

  const [activeTab, setActiveTab] = useState<Tab>('referrals')
  const [stats, setStats] = useState<PartnerStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState(false)
  const [referrals, setReferrals] = useState<ReferralSignup[]>([])
  const [referralsLoading, setReferralsLoading] = useState(true)
  const [referralsError, setReferralsError] = useState(false)
  const [commissions, setCommissions] = useState<ReferralCommission[]>([])
  const [commissionsLoading, setCommissionsLoading] = useState(true)
  const [commissionsError, setCommissionsError] = useState(false)
  const [payouts, setPayouts] = useState<ReferralPayout[]>([])
  const [payoutsLoading, setPayoutsLoading] = useState(true)
  const [payoutsError, setPayoutsError] = useState(false)

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('auth_user')
      const profileStr = localStorage.getItem('auth_profile')
      if (userStr) {setAuthUser(JSON.parse(userStr))}
      if (profileStr) {setAuthProfile(JSON.parse(profileStr))}
    } catch (err) {
      console.error('Error reading auth state:', err)
    } finally {
      setCheckedAuth(true)
    }
  }, [])

  const authHeaders = () => {
    const token = localStorage.getItem('auth_token')
    return token ? { Authorization: `Bearer ${token}` } : null
  }

  const fetchStats = useCallback(async () => {
    const headers = authHeaders()
    if (!headers) {return}
    setStatsLoading(true)
    setStatsError(false)
    try {
      const res = await fetch('/api/referral/stats', { headers })
      if (!res.ok) {throw new Error('Failed to load stats')}
      const data = await res.json()
      setStats(data.stats)
    } catch (err) {
      console.error('Error fetching partner stats:', err)
      setStatsError(true)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  const fetchReferrals = useCallback(async () => {
    const headers = authHeaders()
    if (!headers) {return}
    setReferralsLoading(true)
    setReferralsError(false)
    try {
      const res = await fetch('/api/referral/referrals', { headers })
      if (!res.ok) {throw new Error('Failed to load referrals')}
      const data = await res.json()
      setReferrals(data.referrals ?? [])
    } catch (err) {
      console.error('Error fetching referrals:', err)
      setReferralsError(true)
    } finally {
      setReferralsLoading(false)
    }
  }, [])

  const fetchCommissions = useCallback(async () => {
    const headers = authHeaders()
    if (!headers) {return}
    setCommissionsLoading(true)
    setCommissionsError(false)
    try {
      const res = await fetch('/api/referral/commissions', { headers })
      if (!res.ok) {throw new Error('Failed to load commissions')}
      const data = await res.json()
      setCommissions(data.commissions ?? [])
    } catch (err) {
      console.error('Error fetching commissions:', err)
      setCommissionsError(true)
    } finally {
      setCommissionsLoading(false)
    }
  }, [])

  const fetchPayouts = useCallback(async () => {
    const headers = authHeaders()
    if (!headers) {return}
    setPayoutsLoading(true)
    setPayoutsError(false)
    try {
      const res = await fetch('/api/referral/payouts', { headers })
      if (!res.ok) {throw new Error('Failed to load payouts')}
      const data = await res.json()
      setPayouts(data.payouts ?? [])
    } catch (err) {
      console.error('Error fetching payouts:', err)
      setPayoutsError(true)
    } finally {
      setPayoutsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isPartner) {return}
    fetchStats()
    fetchReferrals()
    fetchCommissions()
    fetchPayouts()
  }, [isPartner, fetchStats, fetchReferrals, fetchCommissions, fetchPayouts])

  const isLoading = !checkedAuth || partnerLoading

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="h-16 bg-white border-b border-gray-200" />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-32 bg-gray-200 rounded-xl w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 bg-gray-200 rounded-xl" />
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded-xl" />
          </div>
        </main>
      </div>
    )
  }

  if (!authUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Please log in to view your dashboard</h2>
          <Link href="/login" className="mt-4 inline-block px-6 py-2 bg-violet-600 text-white rounded-lg">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  if (!isPartner || !partner) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader userType={authUser.user_type} profile={authProfile} />
        <div className="flex items-center justify-center py-24 px-4">
          <div className="text-center max-w-md">
            <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7 text-amber-600" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">Partner access required</h2>
            <p className="mt-2 text-gray-500">
              This dashboard is only available to Infoishai referral partners. If you&apos;d like to become one,
              reach out and we&apos;ll get you set up.
            </p>
            <Link
              href="/contact"
              className="mt-6 inline-block px-6 py-2.5 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const statusStyles: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    paused: 'bg-amber-100 text-amber-700',
    deactivated: 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader userType={authUser.user_type} profile={authProfile} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{partner.name}</h1>
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusStyles[partner.status] || statusStyles.deactivated}`}>
                  {partner.status}
                </span>
              </div>
              <p className="text-gray-500 mt-1">Partner dashboard &middot; {Number(partner.commission_rate)}% commission rate</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Your referral link</label>
            <CopyReferralLink code={partner.referral_code} />
          </div>
        </div>

        {/* Stats Cards */}
        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : statsError ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center mb-8">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-gray-700 font-medium mb-1">Couldn&apos;t load your stats</p>
            <button
              onClick={fetchStats}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <PartnerStatsCard
              icon={Users}
              label="Total Referrals"
              value={(stats?.total_referrals ?? 0).toString()}
              subtext="Creators signed up via your link"
              color="violet"
            />
            <PartnerStatsCard
              icon={UserCheck}
              label="Active Creators"
              value={(stats?.active_creators ?? 0).toString()}
              subtext="Completed their profile or more"
              color="blue"
            />
            <PartnerStatsCard
              icon={DollarSign}
              label="Total Earnings"
              value={formatCents(stats?.total_earnings_cents ?? 0)}
              subtext="Approved & paid commissions"
              color="emerald"
            />
            <PartnerStatsCard
              icon={Wallet}
              label="Pending Payout"
              value={formatCents(stats?.pending_payout_cents ?? 0)}
              subtext="Earned, not yet paid out"
              color="amber"
            />
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-6 -mb-px overflow-x-auto">
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
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'referrals' && (
          referralsError ? (
            <DashboardTabError onRetry={fetchReferrals} />
          ) : (
            <ReferralTable referrals={referrals} isLoading={referralsLoading} />
          )
        )}
        {activeTab === 'commissions' && (
          commissionsError ? (
            <DashboardTabError onRetry={fetchCommissions} />
          ) : (
            <CommissionTable commissions={commissions} isLoading={commissionsLoading} />
          )
        )}
        {activeTab === 'payouts' && (
          payoutsError ? (
            <DashboardTabError onRetry={fetchPayouts} />
          ) : (
            <PayoutTable payouts={payouts} isLoading={payoutsLoading} />
          )
        )}
      </main>
    </div>
  )
}

function DashboardTabError({ onRetry }: { onRetry: () => void }) {
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
