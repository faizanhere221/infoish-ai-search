'use client'

import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { CreatorEntry } from '@/components/admin/outreach/database/CreatorEntry'

export default function OutreachCreatorEntryPage({ params }: { params: { leadId: string } }) {
  const leadId = decodeURIComponent(params.leadId)
  useDocumentTitle(`${leadId} · Creator Database`)
  return (
    <div>
      <h1 className="sr-only">Creator Database: {leadId}</h1>
      <CreatorEntry leadId={leadId} />
    </div>
  )
}
