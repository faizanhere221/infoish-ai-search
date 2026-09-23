'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Loader2, Check, AlertCircle, Search, Copy, PartyPopper } from 'lucide-react'
import { isValidReferralCode } from '@/lib/referral'

interface UserOption {
  id: string
  email: string
  user_type: string
}

interface AddPartnerModalProps {
  onClose: () => void
  onSuccess: () => void
}

const BASE_URL = 'https://infoishai.com'

type CodeStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30)
}

export default function AddPartnerModal({ onClose, onSuccess }: AddPartnerModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [codeTouched, setCodeTouched] = useState(false)
  const [codeStatus, setCodeStatus] = useState<CodeStatus>('idle')
  const [commissionRate, setCommissionRate] = useState('20')
  const [userQuery, setUserQuery] = useState('')
  const [userResults, setUserResults] = useState<UserOption[]>([])
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null)
  const [showUserResults, setShowUserResults] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdCode, setCreatedCode] = useState<string | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)

  const codeCheckTimer = useRef<ReturnType<typeof setTimeout>>()
  const userSearchTimer = useRef<ReturnType<typeof setTimeout>>()

  // Auto-suggest a referral code from the name, until the admin edits it directly
  useEffect(() => {
    if (!codeTouched) {
      setReferralCode(slugifyName(name))
    }
  }, [name, codeTouched])

  // Debounced uniqueness check against the public lookup endpoint
  useEffect(() => {
    clearTimeout(codeCheckTimer.current)
    if (!referralCode) {
      setCodeStatus('idle')
      return
    }
    if (!isValidReferralCode(referralCode)) {
      setCodeStatus('invalid')
      return
    }

    setCodeStatus('checking')
    codeCheckTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/referral/lookup?code=${encodeURIComponent(referralCode)}`)
        setCodeStatus(res.ok ? 'taken' : 'available')
      } catch (err) {
        console.error('Referral code check failed:', err)
        setCodeStatus('idle')
      }
    }, 400)

    return () => clearTimeout(codeCheckTimer.current)
  }, [referralCode])

  // Debounced user search
  useEffect(() => {
    clearTimeout(userSearchTimer.current)
    if (userQuery.length < 2) {
      setUserResults([])
      return
    }
    userSearchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(userQuery)}&types=users&limit=6`)
        const data = await res.json()
        setUserResults(data.results?.users ?? [])
      } catch (err) {
        console.error('User search failed:', err)
      }
    }, 300)
    return () => clearTimeout(userSearchTimer.current)
  }, [userQuery])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim() || !email.trim() || !referralCode.trim()) {
      setError('Name, email, and referral code are required')
      return
    }
    if (codeStatus === 'taken') {
      setError('That referral code is already taken')
      return
    }
    if (codeStatus === 'invalid') {
      setError('Referral code must be 5-30 lowercase letters, numbers, or hyphens')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/admin/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          referral_code: referralCode.trim(),
          commission_rate: parseFloat(commissionRate) || 20,
          user_id: selectedUser?.id || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to create partner')
        setIsSubmitting(false)
        return
      }

      const data = await res.json()
      // Stay open and show the referral link — the admin needs to copy it
      // before doing anything else. onSuccess() (which refreshes the list)
      // fires when they close this success view, not before.
      setCreatedCode(data.partner.referral_code)
      setIsSubmitting(false)
    } catch (err) {
      console.error('Create partner error:', err)
      setError('Network error. Please try again.')
      setIsSubmitting(false)
    }
  }

  const referralLink = createdCode ? `${BASE_URL}/signup/creator?ref=${createdCode}` : ''

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  if (createdCode) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
        <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
          <div className="text-center mb-5">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <PartyPopper className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Partner created!</h3>
            <p className="text-sm text-gray-500 mt-1">Share this referral link with them to start tracking signups.</p>
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-1.5">Referral link</label>
          <div className="flex items-center gap-2 mb-5">
            <div className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 min-w-0">
              <input
                type="text"
                readOnly
                value={referralLink}
                onFocus={(e) => e.target.select()}
                className="w-full bg-transparent text-sm text-gray-700 outline-none truncate"
              />
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors"
            >
              {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {linkCopied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <button
            onClick={() => { setCreatedCode(null); onSuccess() }}
            className="w-full px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800"
          >
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Add Referral Partner</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Partner name"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="partner@example.com"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Referral Code *</label>
            <div className="relative">
              <input
                type="text"
                value={referralCode}
                onChange={(e) => {
                  setCodeTouched(true)
                  setReferralCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                }}
                placeholder="e.g. jane-doe"
                className="w-full px-3 py-2 pr-9 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {codeStatus === 'checking' && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
                {codeStatus === 'available' && <Check className="w-4 h-4 text-emerald-500" />}
                {(codeStatus === 'taken' || codeStatus === 'invalid') && <AlertCircle className="w-4 h-4 text-red-500" />}
              </div>
            </div>
            {codeStatus === 'taken' && <p className="mt-1 text-xs text-red-600">This code is already taken</p>}
            {codeStatus === 'invalid' && <p className="mt-1 text-xs text-red-600">5-30 lowercase letters, numbers, or hyphens</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Commission Rate (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Link to User (optional)</label>
            {selectedUser ? (
              <div className="flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg bg-gray-50">
                <span className="text-sm text-gray-700 truncate">
                  {selectedUser.email} <span className="text-gray-400">({selectedUser.user_type})</span>
                </span>
                <button
                  type="button"
                  onClick={() => { setSelectedUser(null); setUserQuery('') }}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={userQuery}
                    onChange={(e) => { setUserQuery(e.target.value); setShowUserResults(true) }}
                    onFocus={() => setShowUserResults(true)}
                    placeholder="Search by email..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                {showUserResults && userResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {userResults.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => { setSelectedUser(u); setShowUserResults(false) }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
                      >
                        <span className="truncate">{u.email}</span>
                        <span className="text-xs text-gray-400 capitalize flex-shrink-0 ml-2">{u.user_type}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || codeStatus === 'checking'}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Creating...' : 'Create Partner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
