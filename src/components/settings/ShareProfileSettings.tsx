'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Check, Copy } from 'lucide-react'
import ProfileCompletionCard from '@/components/dashboard/ProfileCompletionCard'
import type { ProfileCompleteness } from '@/lib/profile-completion'
import {
  BADGE_HEIGHT,
  BADGE_WIDTH,
  badgeHtmlSnippet,
  bioLine,
  profileShareUrl,
  type BadgeTheme,
} from '@/lib/creators/badge'

interface ShareProfileSettingsProps {
  username: string
  completeness: ProfileCompleteness
  hasUnsavedChanges: boolean
}

function CopyField({ label, hint, value }: { label: string; hint: string; value: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked (insecure context or permissions): the text is
      // still selectable in the box below.
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <div>
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <p className="text-xs text-gray-500">{hint}</p>
        </div>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex-shrink-0"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 whitespace-pre-wrap break-all select-all">{value}</pre>
    </div>
  )
}

// Badge and share links for a creator's public profile. Locked behind a
// complete profile (the same rule the sitemap uses): until then this shows
// the checklist of what's missing instead.
export function ShareProfileSettings({ username, completeness, hasUnsavedChanges }: ShareProfileSettingsProps) {
  const [theme, setTheme] = useState<BadgeTheme>('light')

  if (!completeness.isComplete) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Share your profile</h2>
          <p className="text-sm text-gray-500 mt-1">Your badge unlocks once the required items below are done.</p>
        </div>
        <ProfileCompletionCard completeness={completeness} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Share your profile</h2>
        <p className="text-sm text-gray-500 mt-1">
          Add the badge to your website, newsletter, or GitHub README so brands find your Infoishai profile. Every link below is tracked, so you know it works.
        </p>
      </div>

      {hasUnsavedChanges && (
        <p className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          You have unsaved changes. Save them first so your public profile matches what you share.
        </p>
      )}

      <div>
        <div className="flex items-center gap-2 mb-3">
          {(['light', 'dark'] as BadgeTheme[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTheme(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                theme === t ? 'border-violet-600 bg-violet-50 text-violet-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t === 'light' ? 'Light' : 'Dark'}
            </button>
          ))}
        </div>
        <div className={`inline-flex p-4 rounded-xl border ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
          {/* unoptimized: the badge is already a tiny SVG served from our own route. */}
          <Image
            src={`/badge/${encodeURIComponent(username)}.svg${theme === 'dark' ? '?theme=dark' : ''}`}
            alt="Find me on Infoishai"
            width={BADGE_WIDTH}
            height={BADGE_HEIGHT}
            unoptimized
          />
        </div>
      </div>

      <CopyField
        label="Badge for your website"
        hint="Paste this HTML wherever your site or README accepts HTML."
        value={badgeHtmlSnippet(username, theme)}
      />
      <CopyField
        label="Profile link"
        hint="For Linktree and other link-in-bio tools."
        value={profileShareUrl(username)}
      />
      <CopyField
        label="Bio line"
        hint="A short line for your YouTube, X, or LinkedIn bio."
        value={bioLine(username)}
      />
    </div>
  )
}
