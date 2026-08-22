'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, RotateCcw, Users } from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'
import ApplicantCard from '@/components/applications/ApplicantCard'
import { STATUS_BADGE, formatDate, getDeadlineInfo } from '@/components/campaigns/utils'
import type { ApplicationStatus, Campaign, CampaignApplication } from '@/types/campaigns'

type Tab = 'all' | ApplicationStatus

const TABS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'submitted', label: 'Submitted' },
  { id: 'viewed', label: 'Viewed' },
  { id: 'shortlisted', label: 'Shortlisted' },
  { id: 'hired', label: 'Hired' },
  { id: 'rejected', label: 'Rejected' },
]

interface Profile {
  id: string
  [key: string]: unknown
}

export default function CampaignApplicationsPage() {
  const params = useParams<{ id: string }>()
  const campaignId = params.id
  const router = useRouter()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [applications, setApplications] = useState<CampaignApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [tab, setTab] = useState<Tab>('all')

  const [pendingId, setPendingId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  function showToast(message: string) {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  const load = useCallback(async () => {
    const userStr = localStorage.getItem('auth_user')
    const profileStr = localStorage.getItem('auth_profile')
    const token = localStorage.getItem('auth_token')

    if (!userStr || !token) {
      router.push('/login')
      return
    }

    const user = JSON.parse(userStr)
    const userProfile = profileStr ? JSON.parse(profileStr) : null

    if (user.user_type !== 'brand') {
      router.push('/campaigns')
      return
    }
    setProfile(userProfile)
    setLoading(true)
    setLoadError(false)

    try {
      const campaignRes = await fetch(`/api/campaigns/${campaignId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!campaignRes.ok) {
        router.push('/campaigns')
        return
      }
      const campaignData = await campaignRes.json()
      const loadedCampaign: Campaign = campaignData.campaign

      if (userProfile?.id !== loadedCampaign.brand_id) {
        router.push('/campaigns')
        return
      }
      setCampaign(loadedCampaign)

      const appsRes = await fetch(`/api/campaigns/${campaignId}/applications`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (appsRes.ok) {
        const appsData = await appsRes.json()
        setApplications(appsData.applications || [])
      } else {
        setLoadError(true)
      }
    } catch (err) {
      console.error('Error loading applications:', err)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [campaignId, router])

  useEffect(() => {
    load()
  }, [load])

  const statusCounts = useMemo(
    () => ({
      all: applications.length,
      submitted: applications.filter((a) => a.status === 'submitted').length,
      viewed: applications.filter((a) => a.status === 'viewed').length,
      shortlisted: applications.filter((a) => a.status === 'shortlisted').length,
      hired: applications.filter((a) => a.status === 'hired').length,
      rejected: applications.filter((a) => a.status === 'rejected').length,
    }),
    [applications]
  )

  const filteredApplications = useMemo(
    () => (tab === 'all' ? applications : applications.filter((a) => a.status === tab)),
    [applications, tab]
  )

  async function updateStatus(applicationId: string, status: ApplicationStatus) {
    setPendingId(applicationId)
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`/api/campaigns/${campaignId}/applications/${applicationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        const data = await res.json()
        setApplications((prev) => prev.map((a) => (a.id === applicationId ? data.application : a)))
        showToast(`Application ${STATUS_BADGE_LABEL[status]}`)
      }
    } catch (err) {
      console.error('Error updating application status:', err)
    } finally {
      setPendingId(null)
    }
  }

  async function messageApplicant(applicationId: string) {
    setPendingId(applicationId)
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`/api/campaigns/${campaignId}/applications/${applicationId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (res.ok) {
        router.push(`/messages/${data.conversation_id}`)
      }
    } catch (err) {
      console.error('Error starting conversation:', err)
    } finally {
      setPendingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (!campaign) return null

  const status = STATUS_BADGE[campaign.status]
  const deadline = getDeadlineInfo(campaign.application_deadline)

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader userType="brand" profile={profile} />

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-14">
            <Link href={`/campaigns/${campaignId}`} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-gray-900 truncate">{campaign.title}</h1>
                <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                  {status.label}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Deadline: {formatDate(campaign.application_deadline)} · {deadline.label}
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
            <p className="text-sm text-gray-500 mt-1">Total Applications</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <p className="text-2xl font-bold text-amber-600">{statusCounts.shortlisted}</p>
            <p className="text-sm text-gray-500 mt-1">Shortlisted</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <p className="text-2xl font-bold text-emerald-600">{statusCounts.hired}</p>
            <p className="text-sm text-gray-500 mt-1">Hired</p>
          </div>
        </div>

        {/* Tabs */}
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

        {/* Applications */}
        {loadError ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <AlertCircle className="w-12 h-12 text-red-300 mx-auto" />
            <h3 className="mt-4 font-semibold text-gray-900">Couldn't load applications</h3>
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
              <ApplicantCard
                key={application.id}
                application={application}
                campaignId={campaignId}
                actionPending={pendingId === application.id}
                onStatusChange={updateStatus}
                onMessage={messageApplicant}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Users className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="mt-4 font-semibold text-gray-900">
              {applications.length === 0 ? 'No applications yet' : 'No applications in this view'}
            </h3>
            <p className="text-gray-500 mt-1">
              {applications.length === 0
                ? 'Share your campaign to attract creators.'
                : 'Try a different tab.'}
            </p>
          </div>
        )}
      </main>

      {toast && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-xl shadow-lg text-sm z-50">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {toast}
        </div>
      )}
    </div>
  )
}

const STATUS_BADGE_LABEL: Record<ApplicationStatus, string> = {
  submitted: 'marked as submitted',
  viewed: 'marked as viewed',
  shortlisted: 'shortlisted',
  rejected: 'rejected',
  hired: 'hired',
}
