import { notFound } from 'next/navigation'
import { getPublicCreatorProfile } from '@/lib/creators/public-profile'
import CreatorProfileClient from './CreatorProfileClient'

// ISR: each profile renders on its first request, is cached for an hour,
// and is purged immediately by revalidateCreatorPublicSurfaces() whenever
// the creator edits their profile or an admin hides/suspends/deletes them.
export const revalidate = 3600

// No profiles are prebuilt at build time; returning [] opts this dynamic
// segment into on-demand ISR instead of a fresh render on every request.
export async function generateStaticParams() {
  return []
}

export default async function CreatorProfilePage({ params }: { params: { username: string } }) {
  // Missing, deleted, suspended, and admin-hidden creators all 404 here.
  const creator = await getPublicCreatorProfile(params.username)
  if (!creator) {notFound()}

  return <CreatorProfileClient creator={creator} />
}
