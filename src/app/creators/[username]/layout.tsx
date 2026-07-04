import { Metadata } from 'next'
import { createServerSupabase } from '@/lib/db'

type Props = {
  params: { username: string }
  children: React.ReactNode
}

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  const { username } = params
  const url = `https://infoishai.com/creators/${username}`

  try {
    const supabase = createServerSupabase()
    const { data: creator } = await supabase
      .from('creators')
      .select('display_name, username, bio, niches, total_followers, country')
      .eq('username', username)
      .single()

    if (!creator) {
      return {
        title: 'Creator Not Found | Infoishai',
        robots: { index: false, follow: true },
      }
    }

    const niches = Array.isArray(creator.niches) && creator.niches.length > 0
      ? creator.niches.join(', ')
      : 'tech'
    const title = `${creator.display_name} (@${creator.username}) | ${niches} Creator | Infoishai`
    const description = creator.bio
      ? creator.bio.slice(0, 155)
      : `View ${creator.display_name}'s creator profile on Infoishai. ${niches} content creator${creator.country ? ` based in ${creator.country}` : ''}. Connect for brand sponsorships.`

    return {
      title,
      description,
      robots: { index: true, follow: true },
      openGraph: {
        title,
        description,
        url,
        siteName: 'Infoishai',
        type: 'profile',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
      },
      alternates: {
        canonical: url,
      },
    }
  } catch {
    return {
      title: 'Tech Creator Profile | Infoishai',
      description: 'View this tech creator profile on Infoishai, the B2B tech influencer marketplace.',
      alternates: { canonical: url },
    }
  }
}

export default function CreatorProfileLayout({ children }: Props) {
  return children
}
