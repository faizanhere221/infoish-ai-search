'use client'

import { Suspense } from 'react'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { BrandDatabase } from '@/components/admin/outreach/database/BrandDatabase'

export default function OutreachBrandDatabasePage() {
  useDocumentTitle('Client Database')
  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-white">Client Database</h1>
      <p className="mb-4 text-sm text-slate-400">Brands we work with: contacts, budgets, campaigns. Internal only.</p>
      <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
        <BrandDatabase />
      </Suspense>
    </div>
  )
}
