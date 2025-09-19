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
        setBackendStatus(data.status === 'healthy' ? 'online' : 'offline')
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
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://infoish-ai-search-production.up.railway.app'
        const response = await fetch(`${backendUrl}/auth/me`, {
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
    if (GOOGLE_CLIENT_ID) {
      setGoogleLoaded(true)
    } else {
      setError('Google OAuth not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in environment variables.')
    }
  }

  const handleGoogleResponse = async (response: any) => {
    setError('')
    setIsSigningIn(true)
    
    try {
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
    if (!GOOGLE_CLIENT_ID || !googleLoaded) {
      setError('Google Sign-In not configured. Please refresh the page.')
      return
    }

    setIsSigningIn(true)
    setError('')

    // Build OAuth URL with proper parameters
    const redirectUri = window.location.origin
    const scope = 'email profile'
    const responseType = 'code'
    const accessType = 'online'
    const prompt = 'select_account' // Forces account selection screen

    const googleAuthUrl = `https://accounts.google.com/oauth/authorize?` +
      `client_id=${GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `response_type=${responseType}&` +
      `access_type=${accessType}&` +
      `prompt=${prompt}&` +
      `state=${Math.random().toString(36).substring(2)}`

    // Open popup window
    const popup = window.open(
      googleAuthUrl,
      'googleAuth',
      'width=500,height=600,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no'
    )

    if (!popup) {
      setError('Popup blocked. Please allow popups for this site and try again.')
      setIsSigningIn(false)
      return
    }

    // Listen for popup messages
    const handleMessage = async (event: MessageEvent) => {
      // Security: Check origin
      if (event.origin !== window.location.origin) return

      if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        const { code } = event.data
        try {
          // Exchange code for user data via your backend
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://infoish-ai-search-production.up.railway.app'
          const response = await fetch(`${backendUrl}/auth/google/callback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, redirect_uri: redirectUri })
          })

          if (response.ok) {
            const data = await response.json()
            localStorage.setItem('auth_token', data.access_token)
            localStorage.setItem('user_data', JSON.stringify(data.user))
            router.push('/search')
          } else {
            const errorData = await response.json().catch(() => ({ detail: 'Login failed' }))
            setError(errorData.detail || errorData.error || 'Authentication failed')
          }
        } catch (error: any) {
          setError(`Authentication error: ${error.message}`)
        }
        popup.close()
        setIsSigningIn(false)
      } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
        setError(event.data.error || 'Authentication failed')
        popup.close()
        setIsSigningIn(false)
      }
    }

    window.addEventListener('message', handleMessage)

    // Check if popup is closed manually
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed)
        window.removeEventListener('message', handleMessage)
        setIsSigningIn(false)
      }
    }, 1000)

    // Cleanup function
    setTimeout(() => {
      if (!popup.closed) {
        popup.close()
        setIsSigningIn(false)
        setError('Authentication timeout. Please try again.')
      }
      clearInterval(checkClosed)
      window.removeEventListener('message', handleMessage)
    }, 300000) // 5 minute timeout
  }

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
        setBackendStatus(data.status === 'healthy' ? 'online' : 'offline')
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-black/70">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Load Google Sign-In Script - Not needed for popup method */}
      {/* We're using direct OAuth popup instead of Google's SDK */}

      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="max-w-md w-full">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-black/10 p-8">
            
            {/* Header Section */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-green-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-white font-bold text-3xl">I</span>
              </div>
              <h1 className="text-3xl font-bold text-black mb-2">
                Welcome to Infoish
              </h1>
              <p className="text-black/70">
                Sign in to access our database of 1,800+ Pakistani content creators
              </p>
            </div>

            {/* Backend Status */}
            <div className={`mb-6 p-4 rounded-2xl border ${
              backendStatus === 'online' ? 'bg-green-500/10 border-green-500/20' :
              backendStatus === 'offline' ? 'bg-red-500/10 border-red-500/20' :
              backendStatus === 'error' ? 'bg-yellow-500/10 border-yellow-500/20' :
              'bg-black/5 border-black/10'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    backendStatus === 'online' ? 'bg-green-500' :
                    backendStatus === 'offline' ? 'bg-red-500' :
                    backendStatus === 'error' ? 'bg-yellow-500' :
                    'bg-black/50 animate-pulse'
                  }`}></div>
                  <span className={`text-sm font-medium ${
                    backendStatus === 'online' ? 'text-green-600' :
                    backendStatus === 'offline' ? 'text-red-600' :
                    backendStatus === 'error' ? 'text-yellow-600' :
                    'text-black/70'
                  }`}>
                    API: {backendStatus === 'online' ? 'Connected' : 
                         backendStatus === 'offline' ? 'Offline' :
                         backendStatus === 'error' ? 'Error' : 'Checking...'}
                  </span>
                </div>
                {backendStatus !== 'online' && (
                  <button
                    onClick={testBackendConnection}
                    className="text-blue-500 hover:text-green-500 text-sm font-medium transition-colors"
                  >
                    Test API
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {/* Google Sign In Section */}
              {backendStatus === 'online' && GOOGLE_CLIENT_ID ? (
                <div className="space-y-4">
                  {/* Single Google Sign-In Button */}
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={isSigningIn || !googleLoaded}
                    className="w-full bg-white hover:bg-black/5 text-black py-4 px-6 rounded-2xl font-medium flex items-center justify-center gap-3 transition-all duration-300 border-2 border-black/10 hover:border-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isSigningIn ? (
                      <>
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span>Signing in...</span>
                      </>
                    ) : !googleLoaded ? (
                      <>
                        <div className="w-6 h-6 border-2 border-black/30 border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading Google...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <span className="text-lg">Continue with Google</span>
                      </>
                    )}
                  </button>

                  {/* Developer Test Login */}
                  {isDevelopment && (
                    <div className="space-y-3">
                      <div className="text-xs text-black/60 text-center font-medium">Development Mode</div>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleTestLogin('free')}
                          disabled={isSigningIn}
                          className="bg-black/5 hover:bg-black/10 text-black py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 border-2 border-dashed border-black/20"
                        >
                          Test Free User
                        </button>
                        <button
                          onClick={() => handleTestLogin('premium')}
                          disabled={isSigningIn}
                          className="bg-green-500/10 hover:bg-green-500/20 text-green-600 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 border-2 border-dashed border-green-500/30"
                        >
                          Test Premium
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full p-6 border-2 border-dashed border-black/20 rounded-2xl text-center text-black/60 bg-black/5">
                  {!GOOGLE_CLIENT_ID ? 'Google OAuth not configured' : 'Login unavailable (API offline)'}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-600 px-6 py-4 rounded-2xl text-sm">
                  <div className="font-semibold mb-2">Authentication Error:</div>
                  <div>{error}</div>
                  {!GOOGLE_CLIENT_ID && (
                    <div className="mt-3 text-xs text-red-500">
                      Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to your .env.local file
                    </div>
                  )}
                </div>
              )}

              {/* Setup Instructions */}
              {backendStatus === 'offline' && (
                <div className="bg-blue-500/10 border border-blue-500/20 text-blue-600 px-6 py-4 rounded-2xl text-sm">
                  <div className="font-semibold mb-3">Setup Required</div>
                  <div className="space-y-2 text-xs">
                    <div className="font-mono bg-blue-500/10 px-3 py-2 rounded-lg">cd vector-backend && python main.py</div>
                    <div className="font-mono bg-blue-500/10 px-3 py-2 rounded-lg">npm run dev</div>
                  </div>
                </div>
              )}

              {/* Features Preview */}
              <div className="bg-gradient-to-r from-blue-500/5 to-green-500/5 rounded-2xl p-6 border border-blue-500/10">
                <h3 className="font-bold text-black text-lg mb-4 text-center">What's included:</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-black/80">15 free searches</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-black/80">1,800+ creators</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-black/80">Advanced filters</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-black/80">Export data</span>
                  </div>
                </div>
              </div>

              {/* Upgrade CTA */}
              <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl p-6 text-white text-center">
                <div className="font-bold text-lg mb-2">Ready for unlimited access?</div>
                <div className="text-white/90 mb-4">Only PKR 2,999/month</div>
                <button
                  onClick={() => router.push('/pricing')}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-lg text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 border border-white/20 hover:scale-105 active:scale-95"
                >
                  View Pricing Plans
                </button>
              </div>
            </div>
          </div>

          {/* Terms Footer */}
          <div className="text-center mt-8 text-sm text-black/60">
            By signing in, you agree to our{' '}
            <a href="/terms" className="text-blue-500 hover:text-green-500 transition-colors">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" className="text-blue-500 hover:text-green-500 transition-colors">Privacy Policy</a>
          </div>
        </div>
      </div>
    </>
  )
}