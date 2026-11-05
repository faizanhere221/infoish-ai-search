'use client'

import { Suspense } from 'react'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { LeadsTable } from '@/components/admin/outreach/LeadsTable'

export default function OutreachCreatorsPage() {
  useDocumentTitle('Outreach creators')
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-white">Creator leads</h1>
      <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
        <LeadsTable leadType="creator" />
      </Suspense>
    </div>
  )
}
