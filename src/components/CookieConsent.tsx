'use client'

import { useEffect, useState } from 'react'

const COOKIE_NAME = 'cookie_consent'
const GA_MEASUREMENT_ID = 'G-Y97NRDZSBB'

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function setCookie(name: string, value: string) {
  const oneYear = 60 * 60 * 24 * 365
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${oneYear}; SameSite=Lax`
}

function loadAnalytics() {
  if (document.getElementById('google-analytics-script')) {return}

  const script = document.createElement('script')
  script.id = 'google-analytics-script'
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  script.async = true
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  function gtag(...args: unknown[]) { window.dataLayer!.push(args) }
  window.gtag = gtag
  gtag('js', new Date())
  gtag('config', GA_MEASUREMENT_ID)
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false)

  useEffect(() => {
    const existing = getCookie(COOKIE_NAME)
    if (existing === 'all') {
      loadAnalytics()
      return
    }
    if (existing === 'necessary') {
      return
    }
    setVisible(true)
  }, [])

  const acceptAll = () => {
    setCookie(COOKIE_NAME, 'all')
    loadAnalytics()
    setVisible(false)
  }

  const saveNecessaryOnly = () => {
    setCookie(COOKIE_NAME, 'necessary')
    setVisible(false)
  }

  const savePreferences = () => {
    if (analyticsEnabled) {
      setCookie(COOKIE_NAME, 'all')
      loadAnalytics()
    } else {
      setCookie(COOKIE_NAME, 'necessary')
    }
    setVisible(false)
  }

  if (!visible) {return null}

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        {!showPreferences ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <p className="text-sm text-gray-700 flex-1">
              We use necessary cookies to keep you signed in, and optional analytics cookies to
              understand how Infoishai is used. See our{' '}
              <a href="/privacy" className="text-brand-purple hover:text-brand-purple-dark underline">
                Privacy Policy
              </a>{' '}
              for details.
            </p>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => setShowPreferences(true)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Manage Preferences
              </button>
              <button
                onClick={saveNecessaryOnly}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Necessary Only
              </button>
              <button
                onClick={acceptAll}
                className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-brand-pink to-brand-purple rounded-lg hover:opacity-90 transition-opacity"
              >
                Accept All
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Cookie Preferences</h3>
            <div className="flex items-center justify-between gap-4 p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Necessary</p>
                <p className="text-xs text-gray-500">Required to keep you signed in. Always on.</p>
              </div>
              <span className="text-xs font-medium text-gray-400">Always on</span>
            </div>
            <div className="flex items-center justify-between gap-4 p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Analytics</p>
                <p className="text-xs text-gray-500">Helps us understand how the site is used (Google Analytics).</p>
              </div>
              <button
                role="switch"
                aria-checked={analyticsEnabled}
                onClick={() => setAnalyticsEnabled((v) => !v)}
                className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 relative ${
                  analyticsEnabled ? 'bg-brand-purple' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    analyticsEnabled ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={savePreferences}
                className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-brand-pink to-brand-purple rounded-lg hover:opacity-90 transition-opacity"
              >
                Save Preferences
              </button>
              <button
                onClick={() => setShowPreferences(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
