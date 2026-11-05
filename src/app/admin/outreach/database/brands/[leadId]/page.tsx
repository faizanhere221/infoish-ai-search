'use client'

import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { BrandEntry } from '@/components/admin/outreach/database/BrandEntry'

export default function OutreachBrandEntryPage({ params }: { params: { leadId: string } }) {
  const leadId = decodeURIComponent(params.leadId)
  useDocumentTitle(`${leadId} · Client Database`)
  return (
    <div>
      <h1 className="sr-only">Client Database: {leadId}</h1>
      <BrandEntry leadId={leadId} />
    </div>
  )
}
