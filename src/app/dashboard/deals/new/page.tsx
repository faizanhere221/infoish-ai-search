'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, DollarSign, Calendar, FileText, Plus, Trash2 } from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'

interface Deliverable {
  id: string
  description: string
  is_completed: boolean
}

export default function NewDealPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    }>
      <NewDealPageContent />
    </Suspense>
  )
}

function NewDealPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefilledCreatorId = searchParams.get('creator_id') ?? ''

  const [token, setToken] = useState<string | null>(null)
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null)
  const [userType, setUserType] = useState<'brand' | 'creator' | null>(null)

  const [creator, setCreator] = useState<{ id: string; display_name: string; username: string } | null>(null)
  const [creatorLoading, setCreatorLoading] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [platform, setPlatform] = useState('instagram')
  const [contentType, setContentType] = useState('instagram_post')
  const [deadline, setDeadline] = useState('')
  const [deliveryDays, setDeliveryDays] = useState('7')
  const [revisionsAllowed, setRevisionsAllowed] = useState('1')
  const [deliverables, setDeliverables] = useState<Deliverable[]>([
    { id: crypto.randomUUID(), description: '', is_completed: false },
  ])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const userStr = localStorage.getItem('auth_user')
    const profileStr = localStorage.getItem('auth_profile')
    const storedToken = localStorage.getItem('auth_token')

    if (!userStr || !storedToken) { router.push('/login'); return }

    const user = JSON.parse(userStr)
    if (user.user_type !== 'brand') { router.push('/dashboard/creator'); return }

    setToken(storedToken)
    setUserType('brand')
    setProfile(profileStr ? JSON.parse(profileStr) : null)
  }, [router])

  useEffect(() => {
    if (!prefilledCreatorId || !token) return
    setCreatorLoading(true)
    fetch(`/api/creators/${prefilledCreatorId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.creator) setCreator(data.creator) })
      .finally(() => setCreatorLoading(false))
  }, [prefilledCreatorId, token])

  function addDeliverable() {
    setDeliverables(prev => [...prev, { id: crypto.randomUUID(), description: '', is_completed: false }])
  }

  function updateDeliverable(id: string, description: string) {
    setDeliverables(prev => prev.map(d => d.id === id ? { ...d, description } : d))
  }

  function removeDeliverable(id: string) {
    setDeliverables(prev => prev.filter(d => d.id !== id))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !profile) return

    const brandId = profile.id as string
    const creatorId = prefilledCreatorId || creator?.id

    if (!creatorId) { setError('Creator is required'); return }
    if (!title.trim()) { setError('Title is required'); return }

    const amountNum = parseFloat(amount)
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount')
      return
    }

    const filledDeliverables = deliverables.filter(d => d.description.trim())

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          creator_id: creatorId,
          brand_id: brandId,
          title: title.trim(),
          description: description.trim() || null,
          platform,
          content_type: contentType,
          amount: Math.round(amountNum * 100), // stored in cents
          deadline: deadline || null,
          delivery_days: parseInt(deliveryDays) || 7,
          revisions_allowed: parseInt(revisionsAllowed) || 1,
          deliverables: filledDeliverables,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create deal')
        return
      }

      router.push(`/dashboard/deals/${data.deal.id}`)
    } catch {
      setError('Network error — please try again')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (userType === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader userType={userType} profile={profile} />

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-14">
            <Link href="/dashboard/deals" className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <h1 className="font-semibold text-gray-900">Create Deal</h1>
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Creator */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Creator</h2>
            {creatorLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            ) : creator ? (
              <div className="flex items-center gap-3 p-3 bg-violet-50 rounded-xl">
                <div className="w-10 h-10 bg-violet-200 rounded-full flex items-center justify-center text-violet-700 font-semibold">
                  {creator.display_name[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{creator.display_name}</p>
                  <p className="text-sm text-gray-500">@{creator.username}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-amber-600">No creator selected. Go back and click "Create Deal" from a message thread.</p>
            )}
          </div>

          {/* Deal Details */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Deal Details</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Instagram post + story for product launch"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                maxLength={200}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe what you need, target audience, tone, etc."
                rows={4}
                maxLength={2000}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Platform *</label>
                <select value={platform} onChange={e => setPlatform(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500">
                  {['instagram','tiktok','youtube','twitter','facebook','linkedin','blog','podcast','other'].map(p => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content Type *</label>
                <select value={contentType} onChange={e => setContentType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500">
                  {[
                    ['instagram_post','Instagram Post'],['instagram_story','Instagram Story'],
                    ['instagram_reel','Instagram Reel'],['youtube_video','YouTube Video'],
                    ['tiktok_video','TikTok Video'],['twitter_post','Twitter Post'],
                    ['facebook_post','Facebook Post'],['linkedin_post','LinkedIn Post'],
                    ['blog_post','Blog Post'],['podcast','Podcast'],['other','Other'],
                  ].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="inline w-4 h-4 mr-1" />Amount (USD) *
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="1"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />Deadline
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Days</label>
                <select
                  value={deliveryDays}
                  onChange={e => setDeliveryDays(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {[3, 5, 7, 10, 14, 21, 30].map(d => (
                    <option key={d} value={d}>{d} days</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Revisions Allowed</label>
                <select
                  value={revisionsAllowed}
                  onChange={e => setRevisionsAllowed(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {[0, 1, 2, 3, 5].map(n => (
                    <option key={n} value={n}>{n} revision{n !== 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Deliverables */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">
                <FileText className="inline w-4 h-4 mr-2" />Deliverables
              </h2>
              <button type="button" onClick={addDeliverable} className="text-sm text-violet-600 hover:text-violet-700 flex items-center gap-1">
                <Plus className="w-4 h-4" />Add
              </button>
            </div>
            <div className="space-y-3">
              {deliverables.map((d, i) => (
                <div key={d.id} className="flex items-center gap-3">
                  <span className="text-sm text-gray-400 w-5 text-right flex-shrink-0">{i + 1}.</span>
                  <input
                    type="text"
                    value={d.description}
                    onChange={e => updateDeliverable(d.id, e.target.value)}
                    placeholder="e.g. 1 Instagram reel (60s)"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  {deliverables.length > 1 && (
                    <button type="button" onClick={() => removeDeliverable(d.id)} className="text-gray-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <Link
              href="/dashboard/deals"
              className="flex-1 text-center px-4 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || !creator}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <DollarSign className="w-5 h-5" />}
              {isSubmitting ? 'Creating...' : 'Send Deal Proposal'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
