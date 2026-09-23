'use client'

import { useEffect, useState } from 'react'
import DashboardHeader from '@/components/DashboardHeader'
import CreatorSidebar from '@/components/dashboard/CreatorSidebar'
import MobileNav from '@/components/dashboard/MobileNav'
import { calculateProfileCompletion, type CompletionCreator, type ProfileCompletionItem } from '@/lib/profile-completion'

export default function CreatorDashboardLayout({ children }: { children: React.ReactNode }) {
  const [completionItems, setCompletionItems] = useState<ProfileCompletionItem[]>([])
  const [profile, setProfile] = useState<{ id?: string; username?: string; profile_photo_url?: string | null } | null>(null)

  useEffect(() => {
    const userStr = localStorage.getItem('auth_user')
    if (!userStr) {return}
    const user = JSON.parse(userStr)

    fetch(`/api/creators/${user.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.creator) {return}
        setProfile(data.creator)
        const completion = calculateProfileCompletion(data.creator as CompletionCreator)
        setCompletionItems(completion.items)
      })
      .catch((err) => console.error('Error loading sidebar completion state:', err))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader userType="creator" profile={profile} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <CreatorSidebar completionItems={completionItems} />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </main>

      <MobileNav />
    </div>
  )
}
