import type { Metadata } from 'next'
import { NoAccess } from '@/components/admin/NoAccess'

export const metadata: Metadata = {
  title: 'No access',
  description: 'This account no longer has access to the Infoishai admin.',
  robots: { index: false, follow: false },
}

// Where middleware.ts sends an /admin/* page request when the live staff
// check fails (removed, demoted, suspended; ?retry=1 when the check itself
// failed). Exempt from the admin gate so it never loops.
export default function AdminNoAccessPage({ searchParams }: { searchParams: { retry?: string } }) {
  return <NoAccess retry={searchParams.retry === '1'} />
}
