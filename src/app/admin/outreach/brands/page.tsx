'use client'

import { Suspense } from 'react'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { LeadsTable } from '@/components/admin/outreach/LeadsTable'

export default function OutreachBrandsPage() {
  useDocumentTitle('Outreach brands')
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-white">Brand leads</h1>
      <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
        <LeadsTable leadType="brand" />
      </Suspense>
    </div>
  )
}
