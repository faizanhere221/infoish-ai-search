'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'

declare global {
  interface Window {
    google: any;
  }
}

interface User {
  id: string
  email: string
  full_name?: string
  profile_picture?: string
  subscription_tier: "free" | "premium"
  monthly_searches: number
  search_limit: number
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [backendStatus, setBackendStatus] = useState('checking')
  const [googleLoaded, setGoogleLoaded] = useState(false)
  const [isDevelopment, setIsDevelopment] = useState(false)
  const router = useRouter()

  // Use environment variables
  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  useEffect(() => {
    // Check if in development mode
    setIsDevelopment(process.env.NODE_ENV === 'development')
    
    checkBackendStatus()
    checkExistingAuth()
  }, [])

  const checkBackendStatus = async () => {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
    const response = await fetch(`${backendUrl}/health`)
    if (response.ok) {
      const data = await response.json()
      setBackendStatus(data.status === 'healthy' ? 'online' : 'offline')  // Changed 'backend' to 'status'
    } else {
      setBackendStatus('error')
    }
  } catch (error) {
    setBackendStatus('offline')
  }
}

  const checkExistingAuth = async () => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          router.push('/search')
          return
        } else {
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user_data')
        }
      } catch (error) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_data')
      }
    }
    setIsLoading(false)
  }

  const initializeGoogleSignIn = () => {
    if (window.google && GOOGLE_CLIENT_ID) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      })
      setGoogleLoaded(true)
    } else if (!GOOGLE_CLIENT_ID) {
      setError('Google OAuth not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in environment variables.')
    }
  }

  const handleGoogleResponse = async (response: any) => {
    setError('')
    setIsSigningIn(true)
    
    try {
      // Use frontend API route instead of direct backend call
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://infoish-ai-search-production.up.railway.app'
      const authResponse = await fetch(`${backendUrl}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          google_token: response.credential
        })
      })

      if (authResponse.ok) {
        const data = await authResponse.json()
        localStorage.setItem('auth_token', data.access_token)
        localStorage.setItem('user_data', JSON.stringify(data.user))
        
        router.push('/search')
      } else {
        const errorData = await authResponse.json().catch(() => ({ detail: 'Login failed' }))
        setError(errorData.detail || errorData.error || `Login failed (${authResponse.status})`)
      }
    } catch (error: any) {
      if (error.message.includes('fetch')) {
        setError('Cannot connect to authentication server. Please check your internet connection.')
      } else {
        setError(`Network error: ${error.message}`)
      }
    } finally {
      setIsSigningIn(false)
    }
  }

  const handleGoogleSignIn = () => {
    if (window.google && googleLoaded) {
      window.google.accounts.id.prompt()
    } else {
      setError('Google Sign-In not loaded. Please refresh the page.')
    }
  }

  // Enhanced developer testing with multiple test users
  const handleTestLogin = async (userType: 'free' | 'premium' = 'free') => {
    if (!isDevelopment) {
      setError('Test login only available in development mode')
      return
    }

    setError('')
    setIsSigningIn(true)
    
    const testTokens = {
      free: "test_development_token_free",
      premium: "test_development_token_premium"
    }
    
    try {
      // Use frontend API route for test login too
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://infoish-ai-search-production.up.railway.app'
      const response = await fetch(`${backendUrl}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          google_token: testTokens[userType]
        })
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('auth_token', data.access_token)
        localStorage.setItem('user_data', JSON.stringify(data.user))
        router.push('/search')
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Login failed' }))
        setError(errorData.detail || errorData.error || `Test login failed (${response.status})`)
      }
    } catch (error: any) {
      setError(`Network error: ${error.message}`)
    } finally {
      setIsSigningIn(false)
    }
  }

  const testBackendConnection = async () => {
    setError('')
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://infoish-ai-search-production.up.railway.app'
      const response = await fetch(`${backendUrl}/health`)
      if (response.ok) {
        const data = await response.json()
        setBackendStatus(data.backend === 'healthy' ? 'online' : 'offline')
        setError('')
        
        const message = `
Frontend: ${data.frontend}
Backend: ${data.backend}
${data.backend_data ? `
Database Info:
- Influencers: ${data.backend_data.influencer_count || 'N/A'}
- Users: ${data.backend_data.user_count || 'N/A'}
- Auth System: ${data.backend_data.auth_system || 'N/A'}` : ''}
Timestamp: ${data.timestamp}
        `.trim()
        
        alert(message)
      } else {
        setBackendStatus('error')
        setError(`Health check failed: ${response.status}`)
      }
    } catch (error: any) {
      setBackendStatus('offline')
      setError('Cannot connect to API. Please ensure both frontend and backend are running.')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Load Google Sign-In Script */}
      {GOOGLE_CLIENT_ID && (
        <Script
          src="https://accounts.google.com/gsi/client"
          onLoad={initializeGoogleSignIn}
          strategy="afterInteractive"
        />
      )}

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-2xl">🇵🇰</span>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                Pakistani Influencer Search
              </h1>
              <p className="text-gray-600">
                Sign in to access our database of 1,800+ Pakistani content creators
              </p>
            </div>

            {/* Backend Status */}
            <div className={`mb-6 p-4 rounded-lg border ${
              backendStatus === 'online' ? 'bg-green-50 border-green-200' :
              backendStatus === 'offline' ? 'bg-red-50 border-red-200' :
              backendStatus === 'error' ? 'bg-yellow-50 border-yellow-200' :
              'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    backendStatus === 'online' ? 'bg-green-500' :
                    backendStatus === 'offline' ? 'bg-red-500' :
                    backendStatus === 'error' ? 'bg-yellow-500' :
                    'bg-gray-400 animate-pulse'
                  }`}></div>
                  <span className={`text-sm font-medium ${
                    backendStatus === 'online' ? 'text-green-700' :
                    backendStatus === 'offline' ? 'text-red-700' :
                    backendStatus === 'error' ? 'text-yellow-700' :
                    'text-gray-700'
                  }`}>
                    API: {backendStatus === 'online' ? 'Connected' : 
                         backendStatus === 'offline' ? 'Offline' :
                         backendStatus === 'error' ? 'Error' : 'Checking...'}
                  </span>
                </div>
                {backendStatus !== 'online' && (
                  <button
                    onClick={testBackendConnection}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Test API
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {/* Google Sign In Button */}
              {backendStatus === 'online' && GOOGLE_CLIENT_ID ? (
                <div className="space-y-3">
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={isSigningIn || !googleLoaded}
                    className="w-full bg-white hover:bg-gray-50 text-gray-700 py-3 px-6 rounded-lg font-medium flex items-center justify-center gap-3 transition-colors border border-gray-300 disabled:opacity-50"
                  >
                    {isSigningIn ? (
                      <>
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continue with Google
                      </>
                    )}
                  </button>

                  {/* Developer Test Login - Multiple Options */}
                  {isDevelopment && (
                    <div className="space-y-2">
                      <div className="text-xs text-gray-500 text-center">Development Mode - Test Users:</div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleTestLogin('free')}
                          disabled={isSigningIn}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm transition-colors border-2 border-dashed border-gray-300"
                        >
                          Test Free User
                        </button>
                        <button
                          onClick={() => handleTestLogin('premium')}
                          disabled={isSigningIn}
                          className="bg-green-100 hover:bg-green-200 text-green-700 py-2 px-3 rounded-lg text-sm transition-colors border-2 border-dashed border-green-300"
                        >
                          Test Premium User
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500">
                  {!GOOGLE_CLIENT_ID ? 'Google OAuth not configured' : 'Login unavailable (API offline)'}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  <div className="font-medium mb-1">Authentication Error:</div>
                  <div>{error}</div>
                  {!GOOGLE_CLIENT_ID && (
                    <div className="mt-2 text-xs">
                      Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to your .env.local file
                    </div>
                  )}
                </div>
              )}

              {/* Backend Instructions */}
              {backendStatus === 'offline' && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
                  <div className="font-medium mb-2">Setup Required</div>
                  <div className="space-y-1">
                    <div>To use this app, run these commands:</div>
                    <div className="space-y-1 text-xs">
                      <div className="font-mono bg-blue-100 px-2 py-1 rounded">cd vector-backend</div>
                      <div className="font-mono bg-blue-100 px-2 py-1 rounded">python setup_auth_database.py</div>
                      <div className="font-mono bg-blue-100 px-2 py-1 rounded">python main.py</div>
                      <div className="font-mono bg-blue-100 px-2 py-1 rounded">npm run dev (in another terminal)</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Configuration Help */}
              {backendStatus === 'online' && !GOOGLE_CLIENT_ID && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg text-sm">
                  <div className="font-medium mb-2">Google OAuth Setup Required</div>
                  <div className="space-y-1 text-xs">
                    <div>1. Get Google OAuth credentials from console.cloud.google.com</div>
                    <div>2. Add to .env.local: NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-id</div>
                    <div>3. Restart the development server</div>
                    <div className="mt-2">
                      <strong>For now:</strong> Use "Test Free User" button to try the platform
                    </div>
                  </div>
                </div>
              )}

              {/* Features Preview */}
              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">What you'll get:</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-gray-600">15 free searches/month</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-gray-600">1,800+ verified creators</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-gray-600">Advanced filters</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-gray-600">YouTube analytics</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-gray-600">Save favorites</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-gray-600">Export data</span>
                  </div>
                </div>
              </div>

              {/* Upgrade CTA */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                <div className="text-center">
                  <div className="font-semibold text-green-800 mb-1">Ready for more?</div>
                  <div className="text-sm text-green-700 mb-2">
                    Upgrade to Premium for unlimited searches
                  </div>
                  <div className="text-lg font-bold text-green-600">
                    Only PKR 2,999/month
                  </div>
                  <button
                    onClick={() => router.push('/pricing')}
                    className="mt-2 text-green-600 hover:text-green-700 text-sm font-medium hover:underline"
                  >
                    View Pricing →
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-6 text-sm text-gray-500">
            By signing in, you agree to our{' '}
            <a href="/terms" className="text-green-600 hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" className="text-green-600 hover:underline">Privacy Policy</a>
          </div>
        </div>
      </div>
    </>
  )
}