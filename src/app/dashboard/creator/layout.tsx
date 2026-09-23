'use client'

import { useEffect, useState } from 'react'
import DashboardHeader from '@/components/DashboardHeader'

export default function CreatorDashboardLayout({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<{ id?: string; username?: string; profile_photo_url?: string | null } | null>(null)

  useEffect(() => {
    try {
      const cached = localStorage.getItem('auth_profile')
      if (cached) {setProfile(JSON.parse(cached))}
    } catch (err) {
      console.error('Error reading cached profile:', err)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader userType="creator" profile={profile} />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  )
}
