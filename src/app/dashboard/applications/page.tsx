'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Briefcase, Loader2, Search } from 'lucide-react'
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
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [applications, setApplications] = useState<CampaignApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('all')

  useEffect(() => {
    async function load() {
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

      try {
        const res = await fetch('/api/applications', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setApplications(data.applications || [])
        }
      } catch (err) {
        console.error('Error fetching applications:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [router])

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

        {filteredApplications.length > 0 ? (
          <div className="space-y-4">
            {filteredApplications.map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="mt-4 font-semibold text-gray-900">
              {applications.length === 0 ? "You haven't applied to any campaigns yet" : 'No applications in this view'}
            </h3>
            <p className="text-gray-500 mt-1">
              {applications.length === 0
                ? 'Browse campaigns and apply to ones that match your niche.'
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
    </div>
  )
}
