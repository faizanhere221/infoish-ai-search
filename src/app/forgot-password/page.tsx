'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address')
      return
    }
    setError('')
    setIsLoading(true)
    // Simulate a short delay so it feels real
    setTimeout(() => {
      setIsLoading(false)
      setSubmitted(true)
    }, 800)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-blue-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Infoishai</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {submitted ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Check your inbox</h2>
              <p className="text-gray-500 mb-2">
                Password reset link sent to
              </p>
              <p className="font-medium text-gray-900 mb-6">{email}</p>
              <p className="text-sm text-gray-400 mb-6">
                Didn&apos;t receive it? Check your spam folder or{' '}
                <button
                  onClick={() => { setSubmitted(false); setEmail('') }}
                  className="text-violet-600 hover:text-violet-700 font-medium"
                >
                  try again
                </button>
                .
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Forgot your password?</h2>
                <p className="text-gray-500 mt-1 text-sm">
                  Enter your email and we&apos;ll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError('') }}
                      placeholder="you@example.com"
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                      autoFocus
                    />
                  </div>
                  {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
