'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, Briefcase, CheckCircle2, Loader2, RotateCcw, Search } from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'
import ApplicationCard from '@/components/applications/ApplicationCard'
import type { ApplicationStatus, CampaignApplication } from '@/types/campaigns'

type Tab = 'all' | ApplicationStatus

const TABS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'submitted', label: 'Submitted' },
  { id: 'viewed', label: 'Viewed' },
  { id: 'shortlisted', label: 'Shortlisted' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'hired', label: 'Hired' },
]

interface Profile {
  id: string
  [key: string]: unknown
}

export default function MyApplicationsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      }
    >
      <MyApplicationsPageContent />
    </Suspense>
  )
}

function MyApplicationsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [applications, setApplications] = useState<CampaignApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [tab, setTab] = useState<Tab>('all')
  const [showWithdrawnToast, setShowWithdrawnToast] = useState(searchParams.get('withdrawn') === '1')

  useEffect(() => {
    if (!showWithdrawnToast) {return}
    const timer = setTimeout(() => setShowWithdrawnToast(false), 3000)
    return () => clearTimeout(timer)
  }, [showWithdrawnToast])

  const load = useCallback(async () => {
    const userStr = localStorage.getItem('auth_user')
    const profileStr = localStorage.getItem('auth_profile')
    const token = localStorage.getItem('auth_token')

    if (!userStr || !token) {
      router.push('/login')
      return
    }

    const user = JSON.parse(userStr)
    if (user.user_type !== 'creator') {
      router.push('/dashboard/brand')
      return
    }

    setProfile(profileStr ? JSON.parse(profileStr) : null)
    setLoading(true)
    setLoadError(false)

    try {
      const res = await fetch('/api/applications', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setApplications(data.applications || [])
      } else {
        setLoadError(true)
      }
    } catch (err) {
      console.error('Error fetching applications:', err)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    load()
  }, [load])

  const statusCounts = useMemo(
    () => ({
      all: applications.length,
      submitted: applications.filter((a) => a.status === 'submitted').length,
      viewed: applications.filter((a) => a.status === 'viewed').length,
      shortlisted: applications.filter((a) => a.status === 'shortlisted').length,
      rejected: applications.filter((a) => a.status === 'rejected').length,
      hired: applications.filter((a) => a.status === 'hired').length,
    }),
    [applications]
  )

  const filteredApplications = useMemo(
    () => (tab === 'all' ? applications : applications.filter((a) => a.status === tab)),
    [applications, tab]
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader userType="creator" profile={profile} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
          <p className="text-gray-500 mt-1">Track the campaigns you've applied to</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                tab === t.id
                  ? 'bg-violet-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {t.label}
              <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${tab === t.id ? 'bg-violet-500' : 'bg-gray-100'}`}>
                {statusCounts[t.id]}
              </span>
            </button>
          ))}
        </div>

        {loadError ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <AlertCircle className="w-12 h-12 text-red-300 mx-auto" />
            <h3 className="mt-4 font-semibold text-gray-900">Couldn't load your applications</h3>
            <p className="text-gray-500 mt-1">Something went wrong. Please try again.</p>
            <button
              onClick={load}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700"
            >
              <RotateCcw className="w-4 h-4" />
              Retry
            </button>
          </div>
        ) : filteredApplications.length > 0 ? (
          <div className="space-y-4">
            {filteredApplications.map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="mt-4 font-semibold text-gray-900">
              {applications.length === 0 ? 'No applications yet' : 'No applications in this view'}
            </h3>
            <p className="text-gray-500 mt-1">
              {applications.length === 0
                ? 'Browse campaigns and apply to get started.'
                : 'Try a different tab.'}
            </p>
            {applications.length === 0 && (
              <Link
                href="/campaigns"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700"
              >
                <Search className="w-4 h-4" />
                Browse Campaigns
              </Link>
            )}
          </div>
        )}
      </main>

      {showWithdrawnToast && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-xl shadow-lg text-sm z-50">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Application withdrawn
        </div>
      )}
    </div>
  )
}
