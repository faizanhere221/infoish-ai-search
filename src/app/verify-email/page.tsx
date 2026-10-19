'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, Loader2, Sparkles } from 'lucide-react'

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-blue-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setErrorMessage('This verification link is missing its token.')
      return
    }

    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json()
        if (res.ok) {
          setStatus('success')
          const userStr = localStorage.getItem('auth_user')
          if (userStr) {
            const user = JSON.parse(userStr)
            localStorage.setItem('auth_user', JSON.stringify({ ...user, email_verified: true }))
          }
        } else {
          setStatus('error')
          setErrorMessage(data.error || 'This verification link is invalid.')
        }
      })
      .catch(() => {
        setStatus('error')
        setErrorMessage('Something went wrong. Please try again.')
      })
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-blue-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Infoishai</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {status === 'checking' && (
            <>
              <Loader2 className="w-10 h-10 text-violet-600 animate-spin mx-auto mb-4" />
              <h1 className="text-xl font-bold text-gray-900">Verifying your email</h1>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Email verified</h1>
              <p className="text-gray-500 mb-6">Your email address is confirmed.</p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full py-3 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700"
              >
                Continue to sign in
              </Link>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Verification failed</h1>
              <p className="text-gray-500 mb-6">{errorMessage}</p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full py-3 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700"
              >
                Back to sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
