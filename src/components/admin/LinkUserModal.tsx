'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Loader2, Search } from 'lucide-react'

interface UserOption {
  id: string
  email: string
  user_type: string
}

interface LinkUserModalProps {
  partnerId: string
  onClose: () => void
  onSuccess: () => void
}

export default function LinkUserModal({ partnerId, onClose, onSuccess }: LinkUserModalProps) {
  const [userQuery, setUserQuery] = useState('')
  const [userResults, setUserResults] = useState<UserOption[]>([])
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const userSearchTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    clearTimeout(userSearchTimer.current)
    if (userQuery.length < 2) {
      setUserResults([])
      return
    }
    userSearchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(userQuery)}&types=users&limit=8`)
        const data = await res.json()
        setUserResults(data.results?.users ?? [])
      } catch (err) {
        console.error('User search failed:', err)
      }
    }, 300)
    return () => clearTimeout(userSearchTimer.current)
  }, [userQuery])

  const handleSubmit = async () => {
    if (!selectedUser) {
      setError('Select a user to link')
      return
    }
    setError(null)
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/admin/partners/${partnerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: selectedUser.id }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to link user')
        setIsSubmitting(false)
        return
      }
      onSuccess()
    } catch (err) {
      console.error('Link user error:', err)
      setError('Network error. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Link User Account</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Connect this partner record to an existing Infoishai account so they can log in and see their own dashboard.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        )}

        <label className="block text-sm font-medium text-gray-700 mb-1.5">User</label>
        {selectedUser ? (
          <div className="flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 mb-5">
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
          <div className="relative mb-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Search by email..."
                autoFocus
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            {userResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {userResults.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setSelectedUser(u)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
                  >
                    <span className="truncate">{u.email}</span>
                    <span className="text-xs text-gray-400 capitalize flex-shrink-0 ml-2">{u.user_type}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedUser}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? 'Linking...' : 'Link User'}
          </button>
        </div>
      </div>
    </div>
  )
}
