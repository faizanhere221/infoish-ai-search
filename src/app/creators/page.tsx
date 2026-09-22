import { createServerSupabase } from '@/lib/db'
import CreatorsClient, { type Creator } from './CreatorsClient'

// Revalidate every 30 minutes so Google always sees fresh, server-rendered
// creator content in the initial HTML instead of an empty client-hydrated shell.
export const revalidate = 1800

async function getCreators(): Promise<Creator[]> {
  try {
    const supabase = createServerSupabase()

    const { data: creators, error } = await supabase
      .from('creators')
      .select('*')
      .order('created_at', { ascending: false })
      .range(0, 99)

    if (error || !creators || creators.length === 0) {
      return []
    }

    const creatorIds = creators.map((c) => c.id)

    const [{ data: platforms }, { data: services }] = await Promise.all([
      supabase.from('creator_platforms').select('*').in('creator_id', creatorIds),
      supabase.from('creator_services').select('*').in('creator_id', creatorIds).eq('is_active', true),
    ])

    return creators.map((creator) => ({
      ...creator,
      creator_platforms: platforms?.filter((p) => p.creator_id === creator.id) || [],
      creator_services: services?.filter((s) => s.creator_id === creator.id) || [],
    }))
  } catch (error) {
    console.error('Error fetching creators for SSR:', error)
    return []
  }
}

export default async function CreatorsPage() {
  const creators = await getCreators()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Search Tech Influencers',
    description: 'Browse verified tech influencers and content creators across YouTube, Twitter/X, and LinkedIn.',
    url: 'https://infoishai.com/creators',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: creators.length,
      itemListElement: creators.slice(0, 20).map((creator, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `https://infoishai.com/creators/${creator.username}`,
        name: creator.display_name,
      })),
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CreatorsClient initialCreators={creators} />
    </>
  )
}
