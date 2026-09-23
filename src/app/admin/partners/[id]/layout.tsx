import { Metadata } from 'next'
import { createServerSupabase } from '@/lib/db'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const supabase = createServerSupabase()
    const { data: partner } = await supabase
      .from('referral_partners')
      .select('name')
      .eq('id', params.id)
      .single()

    // The root layout's '%s | Infoishai' title template is still active
    // here (see admin/partners/layout.tsx), so it appends the suffix —
    // don't include it in this string or it duplicates.
    return {
      title: partner ? `${partner.name} | Admin` : 'Partner Not Found | Admin',
      robots: { index: false, follow: false },
    }
  } catch {
    return {
      title: 'Partner | Admin',
      robots: { index: false, follow: false },
    }
  }
}

export default function AdminPartnerDetailLayout({ children }: { children: React.ReactNode }) {
  return children
}
