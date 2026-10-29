'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X, ArrowRight, Check, Loader2, AlertCircle } from 'lucide-react'
import AvatarUpload from '@/components/AvatarUpload'
import { PLATFORMS } from '@/utils/constants'
import { getProfileCompleteness, hasText } from '@/lib/profile-completion'
import { parseFollowerCount, parsePrice } from '@/lib/creators/platform-input'

interface WizardPlatform {
  platform: string
  platform_username: string | null
  platform_url: string | null
  followers: number
}

interface WizardService {
  title: string
  description?: string | null
  content_type?: string | null
  platform?: string | null
  price: number
  delivery_days?: number
  revisions_included?: number
  is_active: boolean
}

interface WizardCreator {
  id: string
  username: string
  display_name: string
  profile_photo_url: string | null
  bio: string | null
  niches: string[]
  creator_platforms: WizardPlatform[]
  creator_services: WizardService[]
}

interface OnboardingWizardProps {
  creator: WizardCreator
  /** Called after any step saves successfully so the dashboard can refetch fresh data. */
  onSaved: () => void
  onComplete: () => void
  onDismiss: () => void
}

type StepId = 'avatar' | 'bio' | 'platforms' | 'rates'

const BIO_TIPS = [
  'Mention the topics or niches you cover',
  'Note your typical audience (developers, founders, etc.)',
  "Keep it to 2-3 sentences — brands skim, they don't read essays",
]

export default function OnboardingWizard({ creator, onSaved, onComplete, onDismiss }: OnboardingWizardProps) {
  // Only walk the creator through what's actually missing — computed once
  // from the data we were given, so steps don't vanish mid-flow as data saves.
  const [steps] = useState<StepId[]>(() => {
    const missingIds = new Set(getProfileCompleteness(creator).missing.map((i) => i.id))
    const missing: Record<StepId, boolean> = {
      avatar: !hasText(creator.profile_photo_url),
      bio: missingIds.has('bio'),
      platforms: missingIds.has('platform_handle'),
      rates: missingIds.has('services'),
    }
    return (['avatar', 'bio', 'platforms', 'rates'] as StepId[]).filter((s) => missing[s])
  })
  const [index, setIndex] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [bio, setBio] = useState(creator.bio || '')

  const [platformChoice, setPlatformChoice] = useState<string>(PLATFORMS[0]?.id || '')
  const [platformUsername, setPlatformUsername] = useState('')
  const [platformFollowers, setPlatformFollowers] = useState('')
  const [addedPlatforms, setAddedPlatforms] = useState<WizardPlatform[]>([])

  const [rateTitle, setRateTitle] = useState('')
  const [ratePrice, setRatePrice] = useState('')

  const currentStep: StepId | 'done' = index < steps.length ? steps[index] : 'done'
  const totalSteps = steps.length + 1

  const authHeaders = () => {
    const token = localStorage.getItem('auth_token')
    return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  }

  const advance = () => {
    setError(null)
    setIndex((i) => i + 1)
    onSaved()
  }

  /** PUTs and only advances on a real success — otherwise shows the server's error. */
  const save = async (url: string, body: unknown, failMessage: string) => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(url, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(body) })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || failMessage)
        return false
      }
      return true
    } catch (err) {
      console.error(failMessage, err)
      setError('Network error. Please try again.')
      return false
    } finally {
      setSaving(false)
    }
  }

  // The platforms/services APIs replace the whole list, so merging into the
  // `creator` prop could overwrite edits made since it was loaded (e.g. in
  // /settings in another tab) with stale values. Re-read the current lists first.
  const fetchCurrentLists = async (): Promise<Pick<WizardCreator, 'creator_platforms' | 'creator_services'> | null> => {
    try {
      // include_inactive (owner only): the services PUT replaces the whole
      // list, so merging without paused services would delete them.
      const res = await fetch(`/api/creators/${creator.id}?include_inactive=1`, {
        cache: 'no-store',
        headers: authHeaders(),
      })
      if (!res.ok) {return null}
      const data = await res.json()
      return {
        creator_platforms: data.creator?.creator_platforms || [],
        creator_services: data.creator?.creator_services || [],
      }
    } catch {
      return null
    }
  }

  const handleContinue = async () => {
    if (currentStep === 'avatar') {
      // Avatar uploads immediately on selection; Continue only makes sense once one exists.
      setError('Upload a photo to continue, or skip for now.')
      return
    }

    if (currentStep === 'bio') {
      if (bio.trim().length <= 20) {
        setError('Write a little more — at least 21 characters.')
        return
      }
      if (await save(`/api/creators/${creator.id}`, { bio: bio.trim() }, 'Failed to save your bio')) {advance()}
      return
    }

    if (currentStep === 'platforms') {
      // Include a handle typed but not yet "Add"-ed — it used to be dropped silently.
      const pending = pendingPlatform()
      if (typeof pending === 'string') {
        setError(pending)
        return
      }
      const toSave = pending
        ? [...addedPlatforms.filter((p) => p.platform !== pending.platform), pending]
        : addedPlatforms
      if (toSave.length === 0) {
        setError('Add at least one platform, or skip for now.')
        return
      }
      const current = await fetchCurrentLists()
      if (!current) {
        setError('Could not load your current platforms. Please try again.')
        return
      }
      const newIds = new Set(toSave.map((p) => p.platform))
      // The API replaces the whole list, so send existing platforms too.
      const merged = [
        ...current.creator_platforms.filter((p) => !newIds.has(p.platform)),
        ...toSave,
      ].map((p) => ({
        platform: p.platform,
        platform_username: p.platform_username || null,
        platform_url: p.platform_url || null,
        followers: p.followers || 0,
      }))
      if (await save(`/api/creators/${creator.id}/platforms`, { platforms: merged }, 'Failed to save platforms')) {advance()}
      return
    }

    if (currentStep === 'rates') {
      // parseFloat("1,000") is 1 — use the shared parser so "$1,000" saves as 1000.
      const price = parsePrice(ratePrice)
      if (!rateTitle.trim() || !price || price <= 0) {
        setError('Enter a service name and a price above $0, or skip for now.')
        return
      }
      const current = await fetchCurrentLists()
      if (!current) {
        setError('Could not load your current services. Please try again.')
        return
      }
      // The API replaces the whole list, so send existing services too.
      const merged = [
        ...current.creator_services.map((s) => ({
          title: s.title,
          description: s.description ?? null,
          content_type: s.content_type ?? null,
          platform: s.platform ?? null,
          price: s.price,
          delivery_days: s.delivery_days ?? 7,
          revisions_included: s.revisions_included ?? 1,
          is_active: s.is_active,
        })),
        {
          title: rateTitle.trim(),
          description: null,
          content_type: null,
          platform: current.creator_platforms[0]?.platform || addedPlatforms[0]?.platform || null,
          price,
          delivery_days: 7,
          revisions_included: 1,
          is_active: true,
        },
      ]
      if (await save(`/api/creators/${creator.id}/services`, { services: merged }, 'Failed to save your rate')) {advance()}
    }
  }

  /** The entry typed into the inputs, or an error message. Null when the inputs are empty. */
  const pendingPlatform = (): WizardPlatform | string | null => {
    if (!platformUsername.trim() && !platformFollowers.trim()) {return null}
    if (!platformChoice || !platformUsername.trim()) {return 'Enter your handle for this platform.'}
    // parseInt("5,076") is 5 and a number input reports "" for "5k", so both
    // used to save the wrong count silently.
    const followers = parseFollowerCount(platformFollowers)
    if (followers === null) {return `"${platformFollowers}" is not a follower count. Use a number like 5076, 5,076, or 5k.`}
    return { platform: platformChoice, platform_username: platformUsername.trim(), platform_url: null, followers }
  }

  const addPlatform = () => {
    const pending = pendingPlatform()
    if (pending === null) {
      setError('Enter your handle for this platform.')
      return
    }
    if (typeof pending === 'string') {
      setError(pending)
      return
    }
    setError(null)
    setAddedPlatforms((prev) => [...prev.filter((p) => p.platform !== pending.platform), pending])
    setPlatformUsername('')
    setPlatformFollowers('')
  }

  const skip = () => {
    setError(null)
    setIndex((i) => i + 1)
  }

  return (
    <div className="bg-white rounded-xl border border-violet-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 pt-5">
        <div className="flex items-center gap-2">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div key={i} className={`h-1.5 w-8 rounded-full ${i <= index ? 'bg-violet-600' : 'bg-gray-200'}`} />
          ))}
        </div>
        <button onClick={onDismiss} className="p-1 rounded hover:bg-gray-100" title="Close setup guide">
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {currentStep === 'avatar' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Add a profile picture</h3>
            <p className="text-sm text-gray-500 mt-1 mb-5">Creators with photos get far more inquiries from brands.</p>
            <AvatarUpload
              currentUrl={creator.profile_photo_url}
              fallbackLetter={creator.display_name.charAt(0) || 'U'}
              uploadUrl={`/api/creators/${creator.id}/avatar`}
              size={88}
              onUploaded={() => advance()}
            />
          </div>
        )}

        {currentStep === 'bio' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Write your bio</h3>
            <p className="text-sm text-gray-500 mt-1 mb-4">Tell brands about yourself and the content you create.</p>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="I'm a tech creator covering AI tools and developer productivity for an audience of 50K engineers..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none"
            />
            <span className="text-xs text-gray-400">{bio.trim().length}/2000 (min 21)</span>
            <ul className="mt-3 space-y-1">
              {BIO_TIPS.map((tip) => (
                <li key={tip} className="text-xs text-gray-500 flex items-start gap-1.5">
                  <span className="text-violet-400 mt-0.5">&bull;</span> {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {currentStep === 'platforms' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Add your platforms</h3>
            <p className="text-sm text-gray-500 mt-1 mb-4">Where do you create content? Add a platform, then continue.</p>
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <select
                value={platformChoice}
                onChange={(e) => setPlatformChoice(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-violet-500"
              >
                {PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input
                type="text"
                value={platformUsername}
                onChange={(e) => setPlatformUsername(e.target.value)}
                placeholder="@yourhandle"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500"
              />
              <input
                type="text"
                inputMode="numeric"
                value={platformFollowers}
                onChange={(e) => setPlatformFollowers(e.target.value)}
                placeholder="Followers"
                className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500"
              />
              <button
                type="button"
                onClick={addPlatform}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700"
              >
                Add
              </button>
            </div>
            {addedPlatforms.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {addedPlatforms.map((p) => (
                  <span key={p.platform} className="px-3 py-1 bg-violet-50 text-violet-700 rounded-full text-xs font-medium">
                    {PLATFORMS.find((pl) => pl.id === p.platform)?.name || p.platform}: {p.platform_username}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {currentStep === 'rates' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Set your rates</h3>
            <p className="text-sm text-gray-500 mt-1 mb-4">Let brands know your starting price. You can add more services later.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={rateTitle}
                onChange={(e) => setRateTitle(e.target.value)}
                placeholder="e.g. Dedicated review video"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500"
              />
              <input
                type="text"
                inputMode="decimal"
                value={ratePrice}
                onChange={(e) => setRatePrice(e.target.value)}
                placeholder="Price ($)"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>
        )}

        {currentStep === 'done' && (
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {steps.length === 0 ? 'Nothing left to set up!' : "You're all set!"}
            </h3>
            <p className="text-sm text-gray-500 mt-1 mb-6">
              Anything you skipped will stay in your profile checklist below.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/creators/${creator.username}`}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                View My Profile
              </Link>
              <Link
                href="/campaigns"
                onClick={onComplete}
                className="px-5 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700"
              >
                Browse Campaigns
              </Link>
            </div>
          </div>
        )}
      </div>

      {currentStep !== 'done' && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
          <span className="text-xs text-gray-400">Step {index + 1} of {steps.length}</span>
          <div className="flex items-center gap-3">
            <button onClick={skip} className="text-sm text-gray-500 hover:text-gray-700">
              Skip for now
            </button>
            {currentStep !== 'avatar' && (
              <button
                onClick={handleContinue}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save &amp; Continue <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
