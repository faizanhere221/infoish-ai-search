'use client'

import { Suspense } from 'react'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { CreatorDatabase } from '@/components/admin/outreach/database/CreatorDatabase'

export default function OutreachCreatorDatabasePage() {
  useDocumentTitle('Creator Database')
  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-white">Creator Database</h1>
      <p className="mb-4 text-sm text-slate-400">Creators who replied, with rates, availability and notes. Internal only.</p>
      <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
        <CreatorDatabase />
      </Suspense>
    </div>
  )
}
