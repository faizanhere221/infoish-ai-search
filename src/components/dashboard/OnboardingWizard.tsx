'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X, ArrowRight, ArrowLeft, Check, Loader2 } from 'lucide-react'
import AvatarUpload from '@/components/AvatarUpload'
import { PLATFORMS } from '@/utils/constants'

interface OnboardingWizardProps {
  creatorId: string
  username: string
  displayName: string
  currentAvatarUrl: string | null
  currentBio: string | null
  onComplete: () => void
  onDismiss: () => void
}

type Step = 1 | 2 | 3 | 4 | 5

const BIO_TIPS = [
  'Mention the topics or niches you cover',
  'Note your typical audience (developers, founders, etc.)',
  'Keep it to 2-3 sentences — brands skim, they don\'t read essays',
]

export default function OnboardingWizard({
  creatorId,
  username,
  displayName,
  currentAvatarUrl,
  currentBio,
  onComplete,
  onDismiss,
}: OnboardingWizardProps) {
  const [step, setStep] = useState<Step>(1)
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl)
  const [bio, setBio] = useState(currentBio || '')
  const [savingBio, setSavingBio] = useState(false)

  const [platformChoice, setPlatformChoice] = useState<string>(PLATFORMS[0]?.id || '')
  const [platformUsername, setPlatformUsername] = useState('')
  const [platformFollowers, setPlatformFollowers] = useState('')
  const [addedPlatforms, setAddedPlatforms] = useState<{ platform: string; platform_username: string; followers: number }[]>([])
  const [savingPlatforms, setSavingPlatforms] = useState(false)

  const [rateTitle, setRateTitle] = useState('')
  const [ratePrice, setRatePrice] = useState('')
  const [savingRate, setSavingRate] = useState(false)

  const authHeaders = () => {
    const token = localStorage.getItem('auth_token')
    return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  }

  const saveBio = async () => {
    setSavingBio(true)
    try {
      await fetch(`/api/creators/${creatorId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ bio }),
      })
    } catch (err) {
      console.error('Error saving bio:', err)
    } finally {
      setSavingBio(false)
      setStep(3)
    }
  }

  const addPlatform = () => {
    if (!platformChoice || !platformUsername.trim()) {return}
    setAddedPlatforms((prev) => [
      ...prev.filter((p) => p.platform !== platformChoice),
      { platform: platformChoice, platform_username: platformUsername.trim(), followers: parseInt(platformFollowers) || 0 },
    ])
    setPlatformUsername('')
    setPlatformFollowers('')
  }

  const savePlatforms = async () => {
    if (addedPlatforms.length === 0) {
      setStep(4)
      return
    }
    setSavingPlatforms(true)
    try {
      await fetch(`/api/creators/${creatorId}/platforms`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          platforms: addedPlatforms.map((p) => ({ ...p, platform_url: null })),
        }),
      })
    } catch (err) {
      console.error('Error saving platforms:', err)
    } finally {
      setSavingPlatforms(false)
      setStep(4)
    }
  }

  const saveRate = async () => {
    if (!rateTitle.trim() || !ratePrice) {
      setStep(5)
      return
    }
    setSavingRate(true)
    try {
      await fetch(`/api/creators/${creatorId}/services`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          services: [{
            title: rateTitle.trim(),
            description: null,
            content_type: 'post',
            platform: addedPlatforms[0]?.platform || PLATFORMS[0]?.id || 'other',
            price: parseFloat(ratePrice) || 0,
            delivery_days: 7,
            revisions_included: 1,
            is_active: true,
          }],
        }),
      })
    } catch (err) {
      console.error('Error saving rate:', err)
    } finally {
      setSavingRate(false)
      setStep(5)
    }
  }

  const stepLabel = ['', 'Profile Picture', 'Bio', 'Platforms', 'Rates', 'Done'][step]

  return (
    <div className="bg-white rounded-xl border border-violet-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 pt-5">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className={`h-1.5 w-8 rounded-full ${s <= step ? 'bg-violet-600' : 'bg-gray-200'}`} />
          ))}
        </div>
        <button onClick={onDismiss} className="p-1 rounded hover:bg-gray-100" title="Skip setup">
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="p-6">
        {step === 1 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Add a profile picture</h3>
            <p className="text-sm text-gray-500 mt-1 mb-5">Creators with photos get far more inquiries from brands.</p>
            <AvatarUpload
              currentUrl={avatarUrl}
              fallbackLetter={displayName.charAt(0) || 'U'}
              uploadUrl={`/api/creators/${creatorId}/avatar`}
              size={88}
              onUploaded={(url) => { setAvatarUrl(url); setStep(2) }}
            />
          </div>
        )}

        {step === 2 && (
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
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-400">{bio.length}/2000</span>
            </div>
            <ul className="mt-3 space-y-1">
              {BIO_TIPS.map((tip) => (
                <li key={tip} className="text-xs text-gray-500 flex items-start gap-1.5">
                  <span className="text-violet-400 mt-0.5">&bull;</span> {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Add your platforms</h3>
            <p className="text-sm text-gray-500 mt-1 mb-4">Where do you create content? Add at least one to get started.</p>

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
                type="number"
                min="0"
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
                    {PLATFORMS.find((pl) => pl.id === p.platform)?.name || p.platform}: @{p.platform_username}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Set your rates</h3>
            <p className="text-sm text-gray-500 mt-1 mb-4">Optional — let brands know your starting price. You can add more later.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={rateTitle}
                onChange={(e) => setRateTitle(e.target.value)}
                placeholder="e.g. Dedicated review video"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500"
              />
              <input
                type="number"
                min="0"
                value={ratePrice}
                onChange={(e) => setRatePrice(e.target.value)}
                placeholder="Price ($)"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">You&apos;re all set!</h3>
            <p className="text-sm text-gray-500 mt-1 mb-6">Your profile is ready. Keep it fresh — the more complete it is, the more brands will find you.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/creators/${username}`}
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

      {step < 5 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={() => (step > 1 ? setStep((step - 1) as Step) : onDismiss())}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4" /> {step > 1 ? 'Back' : 'Skip for now'}
          </button>
          <div className="flex items-center gap-3">
            <button onClick={onDismiss} className="text-sm text-gray-400 hover:text-gray-600">
              Skip for now
            </button>
            <button
              onClick={() => {
                if (step === 2) {saveBio()}
                else if (step === 3) {savePlatforms()}
                else if (step === 4) {saveRate()}
                else {setStep((step + 1) as Step)}
              }}
              disabled={savingBio || savingPlatforms || savingRate}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
            >
              {(savingBio || savingPlatforms || savingRate) && <Loader2 className="w-4 h-4 animate-spin" />}
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 5 && <div className="pb-1" />}
      {step !== 5 && <div className="px-6 pb-2 text-center text-xs text-gray-400">{stepLabel} &middot; Step {step} of 5</div>}
    </div>
  )
}
