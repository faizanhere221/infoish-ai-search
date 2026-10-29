import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPublicCreatorProfile } from '@/lib/creators/public-profile'
import { PersonJsonLd } from '@/components/seo/JsonLd'

type Props = {
  params: { username: string }
  children: React.ReactNode
}

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  const { username } = params
  const url = `https://infoishai.com/creators/${username}`

  try {
    // Same cached loader as the page: a missing, deleted, suspended, or
    // admin-hidden creator returns null, and notFound() turns the whole
    // route into a real 404 (not a "not found" message with a 200 status).
    const creator = await getPublicCreatorProfile(username)
    if (!creator) {
      notFound()
    }

    const niches = creator.niches.length > 0 ? creator.niches.join(', ') : 'tech'
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
  const creator = await getPublicCreatorProfile(params.username)

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
