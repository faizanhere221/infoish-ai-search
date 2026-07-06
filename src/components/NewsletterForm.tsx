'use client'

import { useState } from 'react'
import { validateEmail } from '@/utils/validateEmail'

export default function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [emailWarning, setEmailWarning] = useState<string | null>(null)

  const handleBlur = () => {
    if (!email) {
      setEmailWarning(null)
      return
    }
    setEmailWarning(validateEmail(email).warning ?? null)
  }

  const applySuggestion = (suggestion: string) => {
    setEmail(suggestion)
    setEmailWarning(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      setStatus('error')
      setMessage('Please enter your email')
      return
    }

    const emailCheck = validateEmail(email)
    if (!emailCheck.valid) {
      setStatus('error')
      setMessage('Please enter a valid email address')
      return
    }

    setStatus('loading')

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'footer' }),
      })

      const data = await response.json()

      if (!response.ok) {
        setStatus('error')
        setMessage(data.error || 'Something went wrong. Please try again.')
        return
      }

      setStatus('success')
      setMessage(data.message || 'Successfully subscribed! Thank you for joining us.')
      setEmail('')
      setEmailWarning(null)

      setTimeout(() => {
        setStatus('idle')
        setMessage('')
      }, 3000)
    } catch (error) {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setEmailWarning(null) }}
          onBlur={handleBlur}
          placeholder="Enter your email"
          className="flex-1 px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
          disabled={status === 'loading'}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
        </button>
      </div>

      {emailWarning && status !== 'success' && (
        <div className="text-sm text-amber-400">
          {emailWarning}{' '}
          {(() => {
            const suggestion = validateEmail(email).suggestion
            return suggestion ? (
              <button
                type="button"
                onClick={() => applySuggestion(suggestion)}
                className="underline font-medium hover:text-amber-300"
              >
                Use {suggestion}
              </button>
            ) : null
          })()}
        </div>
      )}

      {message && (
        <div className={`text-sm ${status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
          {message}
        </div>
      )}
    </form>
  )
}
