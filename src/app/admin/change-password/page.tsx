'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound } from 'lucide-react'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

// Team accounts created with a temporary password land here after their
// first login. Middleware keeps them here until the new password is saved.
export default function ChangePasswordPage() {
  useDocumentTitle('Set a new password')
  const router = useRouter()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (next !== confirm) {
      setError('The two new passwords do not match.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: current, new_password: next }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.fields?.new_password?.[0] ?? data.error ?? 'Failed to update password.')
        return
      }
      router.push(data.role === 'outreach' ? '/admin/outreach' : '/admin/dashboard')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full px-3.5 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition'

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-600 mb-4 shadow-lg shadow-violet-900/40">
            <KeyRound className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Set a new password</h1>
          <p className="text-gray-400 text-sm mt-1">Replace your temporary password to continue.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-2xl p-6 space-y-4 shadow-xl">
          {error && (
            <div className="bg-red-950/60 border border-red-800 text-red-300 text-sm px-4 py-3 rounded-lg">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Temporary password</label>
            <input type="password" value={current} onChange={e => setCurrent(e.target.value)} required
              autoComplete="current-password" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">New password</label>
            <input type="password" value={next} onChange={e => setNext(e.target.value)} required minLength={10}
              autoComplete="new-password" className={inputClass} placeholder="At least 10 characters" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirm new password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={10}
              autoComplete="new-password" className={inputClass} />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-sm transition-colors mt-2">
            {loading ? 'Saving…' : 'Save and continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
