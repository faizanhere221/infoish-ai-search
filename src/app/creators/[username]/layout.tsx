import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServerSupabase } from '@/lib/db'
import { isCreatorPublic } from '@/lib/creators/visibility'
import { PersonJsonLd } from '@/components/seo/JsonLd'

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
      .select('user_id, display_name, username, bio, niches, total_followers, country, hidden_from_marketplace, profile_photo_url')
      .eq('username', username)
      .single()

    if (!creator) {
      return {
        title: 'Creator Not Found',
        robots: { index: false, follow: true },
      }
    }

    // A deleted, suspended, or admin-hidden creator's profile 404s for
    // real (not just a "not found" message with a 200 status) —
    // notFound() here triggers that for the whole route, since this runs
    // as part of the same render pass as the page itself.
    const { data: ownerUser } = await supabase
      .from('users')
      .select('deleted_at, is_active')
      .eq('id', creator.user_id)
      .single()
    if (!isCreatorPublic(ownerUser, creator)) {
      notFound()
    }

    const niches = Array.isArray(creator.niches) && creator.niches.length > 0
      ? creator.niches.join(', ')
      : 'tech'
    const title = `${creator.display_name} (@${creator.username}) | ${niches} Creator`
    const description = creator.bio
      ? creator.bio.slice(0, 155)
      : `View ${creator.display_name}'s creator profile on Infoishai. ${niches} content creator${creator.country ? ` based in ${creator.country}` : ''}. Connect for brand sponsorships.`

    return {
      title,
      description,
      robots: { index: true, follow: true },
      openGraph: {
        title: `${title} | Infoishai`,
        description,
        url,
        siteName: 'Infoishai',
        type: 'profile',
        images: [
          {
            url: creator.profile_photo_url || 'https://infoishai.com/og-image.jpg',
            width: 1200,
            height: 630,
            alt: creator.display_name,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${title} | Infoishai`,
        description,
      },
      alternates: {
        canonical: url,
      },
    }
  } catch (error) {
    // Never swallow notFound()'s own signal — see captureError's identical
    // guard in src/lib/error-tracking.ts for why.
    if ((error as { digest?: unknown } | null)?.digest === 'NEXT_NOT_FOUND') {throw error}
    return {
      title: 'Tech Creator Profile',
      description: 'View this tech creator profile on Infoishai, the B2B tech influencer marketplace.',
      alternates: { canonical: url },
    }
  }
}

export default async function CreatorProfileLayout({ children, params }: Props) {
  const supabase = createServerSupabase()
  const { data: creator } = await supabase
    .from('creators')
    .select('display_name, username, bio, profile_photo_url')
    .eq('username', params.username)
    .single()

  return (
    <>
      {creator && (
        <PersonJsonLd
          name={creator.display_name}
          username={creator.username}
          description={creator.bio || undefined}
          image={creator.profile_photo_url || undefined}
        />
      )}
      {children}
    </>
  )
}
