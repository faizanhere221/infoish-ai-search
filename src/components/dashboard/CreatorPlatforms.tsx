import Link from 'next/link'
import { Globe, Github, Instagram, Linkedin, Mail, Mic, Music2, Twitch, Twitter, Youtube, MessageSquare, Plus, type LucideIcon } from 'lucide-react'
import { PLATFORMS } from '@/utils/constants'

interface PlatformItem {
  platform: string
  platform_username: string | null
  followers: number
}

const ICONS: Record<string, LucideIcon> = {
  youtube: Youtube,
  twitter: Twitter,
  linkedin: Linkedin,
  instagram: Instagram,
  tiktok: Music2,
  twitch: Twitch,
  blog: Globe,
  newsletter: Mail,
  podcast: Mic,
  github: Github,
  discord: MessageSquare,
}

const NAMES = Object.fromEntries(PLATFORMS.map((p) => [p.id, p.name])) as Record<string, string>

export default function CreatorPlatforms({ platforms }: { platforms: PlatformItem[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">My Platforms</h2>
        <Link href="/settings?tab=platforms" className="text-sm font-medium text-violet-600 hover:text-violet-700">
          Edit
        </Link>
      </div>

      {platforms.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {platforms.map((p) => {
            const Icon = ICONS[p.platform] || Globe
            return (
              <div key={p.platform} className="p-4 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
                    <Icon className="w-4 h-4 text-violet-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 truncate">{NAMES[p.platform] || p.platform}</span>
                </div>
                <p className="text-xl font-bold text-gray-900">{(p.followers || 0).toLocaleString()}</p>
                <p className="text-xs text-gray-500 truncate">
                  {p.platform_username ? `${p.platform_username} · followers` : 'followers'}
                </p>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <Globe className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="mt-2 text-gray-500">No platforms added yet</p>
          <Link
            href="/settings?tab=platforms"
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700"
          >
            <Plus className="w-4 h-4" />
            Add Platforms
          </Link>
        </div>
      )}
    </div>
  )
}
