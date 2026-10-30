import { Globe, Instagram, Linkedin, Music2, Twitter, Youtube, type LucideIcon } from 'lucide-react'
import { isSupportedPlatform, type PlatformId } from '@/utils/constants'

const PLATFORM_ICONS: Record<PlatformId, LucideIcon> = {
  youtube: Youtube,
  linkedin: Linkedin,
  twitter: Twitter,
  tiktok: Music2,
  instagram: Instagram,
}

// Icon for a platform id. A platform we no longer support (on an old deal
// or campaign) gets a neutral globe.
export function platformIcon(id: string | null | undefined): LucideIcon {
  return isSupportedPlatform(id) ? PLATFORM_ICONS[id] : Globe
}
