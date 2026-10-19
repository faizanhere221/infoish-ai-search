'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, Loader2, Sparkles } from 'lucide-react'

const CATEGORY_LABELS: Record<string, string> = {
  messages: 'message',
  offers: 'offer',
  contracts: 'contract',
  work: 'work update',
  payments: 'payment',
  daily_summary: 'daily summary',
  all: 'all',
}

export default function EmailUnsubscribedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-blue-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    }>
      <EmailUnsubscribedContent />
    </Suspense>
  )
}

function EmailUnsubscribedContent() {
  const searchParams = useSearchParams()
  const category = searchParams.get('category')
  const error = searchParams.get('error')

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
          {error ? (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Link expired</h1>
              <p className="text-gray-500 mb-6">
                This unsubscribe link is no longer valid. Manage your email preferences from your account settings instead.
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Unsubscribed</h1>
              <p className="text-gray-500 mb-6">
                You will no longer receive {CATEGORY_LABELS[category || 'all'] || 'that type of'} email updates.
                Account and security emails still reach you.
              </p>
            </>
          )}
          <Link href="/settings" className="inline-flex items-center justify-center w-full py-3 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700">
            Manage email settings
          </Link>
        </div>
      </div>
    </div>
  )
}
