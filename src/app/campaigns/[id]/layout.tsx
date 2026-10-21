import { Metadata } from 'next'
import { createServerSupabase } from '@/lib/db'

export const revalidate = 3600

type Props = {
  params: { id: string }
  children: React.ReactNode
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { id } = params
  const url = `https://infoishai.com/campaigns/${id}`

  try {
    const supabase = createServerSupabase()
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('title, description, status, visibility')
      .eq('id', id)
      .single()

    if (!campaign || campaign.status !== 'published' || campaign.visibility !== 'public') {
      return {
        title: { absolute: 'Campaign | Infoishai' },
        robots: { index: false, follow: true },
      }
    }

    const title = `${campaign.title} | Infoishai`
    const description = campaign.description
      ? campaign.description.slice(0, 155)
      : `View this tech creator sponsorship campaign on Infoishai and apply directly.`

    return {
      title: { absolute: title },
      description,
      robots: { index: true, follow: true },
      openGraph: {
        title,
        description,
        url,
        siteName: 'Infoishai',
        type: 'website',
        images: [{ url: 'https://infoishai.com/og-image.jpg', width: 1200, height: 630, alt: campaign.title }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: ['https://infoishai.com/twitter-image.jpg'],
      },
      alternates: {
        canonical: url,
      },
    }
  } catch {
    return {
      title: { absolute: 'Campaign | Infoishai' },
      description: 'View this tech creator sponsorship campaign on Infoishai.',
      alternates: { canonical: url },
    }
  }
}

export default function CampaignDetailLayout({ children }: Props) {
  return children
}
