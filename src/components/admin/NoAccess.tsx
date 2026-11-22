'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ShieldOff } from 'lucide-react'

// Shown when the live staff check fails (src/lib/staff-access.ts): the
// account was removed from the team, demoted or suspended, or (retry) the
// check itself couldn't run. The link goes to the person's own dashboard
// when they have one (brand / creator account), else the home page.
export function NoAccess({ retry = false }: { retry?: boolean }) {
  const [home, setHome] = useState<{ href: string; label: string }>({ href: '/', label: 'Go to the home page' })

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('auth_user') ?? 'null') as { user_type?: string } | null
      if (user?.user_type === 'brand') {setHome({ href: '/dashboard/brand', label: 'Go to your brand dashboard' })}
      else if (user?.user_type === 'creator') {setHome({ href: '/dashboard/creator', label: 'Go to your creator dashboard' })}
    } catch {
      // storage blocked or bad JSON: keep the home page link
    }
  }, [])

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-slate-950 px-4 py-16">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 text-center">
        <ShieldOff className="mx-auto h-10 w-10 text-amber-400" />
        <h1 className="mt-4 text-xl font-semibold text-white">
          {retry ? 'We could not check your access' : 'You no longer have access'}
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          {retry
            ? 'Something went wrong while checking your account. Try again in a moment.'
            : 'Your account is no longer on the Infoishai team, or its access changed. Ask a super admin if you think this is a mistake.'}
        </p>
        <div className="mt-6 flex flex-col items-center gap-3">
          <Link href={home.href} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700">
            {home.label}
          </Link>
          {retry && (
            <Link href="/admin" className="text-sm text-violet-300 hover:text-violet-200">Try again</Link>
          )}
        </div>
      </div>
    </div>
  )
}
