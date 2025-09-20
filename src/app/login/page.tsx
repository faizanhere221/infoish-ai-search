'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'

declare global {
  interface Window {
    google: any;
    PasswordCredential?: any;
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
  const [isDevelopment, setIsDevelopment] = useState(false)
  const [googleLoaded, setGoogleLoaded] = useState(false)
  const router = useRouter()

  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  useEffect(() => {
    setIsDevelopment(process.env.NODE_ENV === 'development')
    
    // Check for error in URL params
    const urlParams = new URLSearchParams(window.location.search)
    const urlError = urlParams.get('error')
    if (urlError) {
      setError(decodeURIComponent(urlError))
      window.history.replaceState({}, '', '/login')
    }
    
    // Force complete reset on page load
    forceGoogleReset()
    
    checkBackendStatus()
    checkExistingAuth()
    
    // Force Google script reload after cleanup
    setTimeout(() => {
      if (!window.google) {
        console.log('Google not loaded after reset, forcing reload...')
        const existingScript = document.querySelector('script[src*="accounts.google.com"]')
        if (existingScript) {
          existingScript.remove()
        }
        
        // Reload the Google script
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.onload = () => {
          console.log('Google script reloaded')
          initializeGoogleAuth()
        }
        script.onerror = () => {
          setError('Failed to load Google Sign-In')
          setGoogleLoaded(true)
        }
        document.head.appendChild(script)
      }
    }, 1000)
    
  }, [])

  const forceGoogleReset = () => {
    try {
      // Nuclear option: completely reset Google state
      if (window.google) {
        delete window.google
      }
      
      // Remove any existing Google scripts
      const existingScripts = document.querySelectorAll('script[src*="accounts.google.com"]')
      existingScripts.forEach(script => script.remove())
      
      // Clear all possible Google storage
      clearGoogleAuthState()
      
      // Reset our state
      setGoogleLoaded(false)
      setError('')
      
      console.log('Force reset completed')
      
    } catch (error) {
      console.log('Error in force reset:', error)
    }
  }

  const checkBackendStatus = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://infoish-ai-search-production.up.railway.app'
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
    
    // If no token, skip auth check and go straight to login
    if (!token) {
      console.log('No auth token found, proceeding to login')
      setIsLoading(false)
      return
    }
    
    try {
      console.log('Checking existing auth token...')
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://infoish-ai-search-production.up.railway.app'
      
      // Set a timeout for the auth check to prevent hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout
      
      const response = await fetch(`${backendUrl}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        console.log('Valid token found, redirecting to search')
        router.push('/search')
        return
      } else {
        console.log('Invalid token, clearing auth data')
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_data')
      }
    } catch (error: any) {
      console.log('Auth check failed:', error.message)
      // Clear potentially corrupted auth data
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
    }
    
    setIsLoading(false)
  }

  const clearGoogleAuthState = () => {
    try {
      // Clear Google auth state completely
      if (window.google && window.google.accounts && window.google.accounts.id) {
        window.google.accounts.id.disableAutoSelect()
        
        // Cancel any pending prompts
        window.google.accounts.id.cancel()
      }
      
      // Clear all Google-related storage and cookies
      if (navigator.credentials && navigator.credentials.preventSilentAccess) {
        navigator.credentials.preventSilentAccess()
      }
      
      // Clear Google cookies more aggressively
      const googleCookies = [
        'g_state', 'g_csrf_token', 'gsi_state', 'gsi_replay', 
        'g_authuser', 'g_enabled_idps', '__Host-1PLSID', '__Host-3PLSID',
        'NID', 'HSID', 'SSID', 'APISID', 'SAPISID'
      ]
      
      googleCookies.forEach(cookieName => {
        // Multiple domain attempts for thorough cleanup
        const domains = ['', `.${window.location.hostname}`, '.google.com', '.accounts.google.com']
        const paths = ['/', '/auth', '/oauth']
        
        domains.forEach(domain => {
          paths.forEach(path => {
            const domainPart = domain ? `; domain=${domain}` : ''
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}${domainPart}`
          })
        })
      })
      
      // Clear session storage
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes('google') || key.includes('gsi') || key.includes('oauth')) {
          sessionStorage.removeItem(key)
        }
      })
      
      console.log('Google auth state cleared completely')
      
    } catch (error) {
      console.log('Error clearing Google auth state:', error)
    }
  }

  const initializeGoogleAuth = () => {
    console.log('Initializing Google Auth...', { 
      hasGoogle: !!window.google, 
      hasClientId: !!GOOGLE_CLIENT_ID 
    })

    if (!GOOGLE_CLIENT_ID) {
      setError('Google Client ID not configured')
      setGoogleLoaded(true)
      return
    }

    if (!window.google) {
      console.log('Google SDK not loaded yet, waiting...')
      return
    }

    try {
      console.log('Google SDK available, clearing previous state...')
      
      // Force complete cleanup first
      clearGoogleAuthState()
      
      // Wait a moment for cleanup to complete
      setTimeout(() => {
        try {
          console.log('Reinitializing Google with fresh state...')
          
          // Initialize Google One Tap with completely fresh state
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleResponse,
            auto_select: false,
            cancel_on_tap_outside: false,
            use_fedcm_for_prompt: false,
            // Force new initialization
            context: 'signin',
            ux_mode: 'popup',
            itp_support: true,
          })

          console.log('Google reinitialized, waiting for DOM and rendering button...')
          
          // Wait for DOM to be ready and try multiple times if needed
          const tryRenderButton = (attempts = 0) => {
            const buttonDiv = document.getElementById('google-signin-button')
            
            if (buttonDiv) {
              console.log(`Button div found on attempt ${attempts + 1}, rendering...`)
              renderGoogleButton()
              setGoogleLoaded(true)
            } else if (attempts < 10) {
              console.log(`Button div not found, attempt ${attempts + 1}, retrying...`)
              setTimeout(() => tryRenderButton(attempts + 1), 200)
            } else {
              console.error('Failed to find button div after 10 attempts')
              setError('Failed to initialize Google Sign-In button')
              setGoogleLoaded(true)
            }
          }
          
          // Start trying to render the button
          tryRenderButton()
          
        } catch (innerError) {
          console.error('Error in delayed initialization:', innerError)
          setError('Google Sign-In initialization failed. Please refresh the page.')
          setGoogleLoaded(true)
        }
      }, 300) // Give cleanup time to complete

    } catch (error) {
      console.error('Google auth initialization error:', error)
      setError('Google Sign-In initialization failed. Please refresh the page.')
      setGoogleLoaded(true)
    }
  }

  const renderGoogleButton = () => {
    const buttonDiv = document.getElementById('google-signin-button')
    
    if (!buttonDiv) {
      console.error('google-signin-button div not found')
      return false
    }

    // Clear any existing content
    buttonDiv.innerHTML = ''
    
    try {
      console.log('Rendering Google button...')
      window.google.accounts.id.renderButton(buttonDiv, {
        theme: 'outline',
        size: 'large',
        width: 400, // Use pixel value instead of percentage
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left'
      })
      
      console.log('Google button rendered successfully')
      
      // Verify the button actually rendered
      setTimeout(() => {
        if (buttonDiv.innerHTML.length > 0) {
          console.log('✅ Google button confirmed in DOM')
        } else {
          console.error('❌ Google button failed to render')
          setError('Google button failed to appear')
        }
      }, 300)
      
      return true
      
    } catch (error) {
      console.error('Error rendering Google button:', error)
      setError('Failed to load Google Sign-In button: ' + error.message)
      return false
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

  const handleManualGoogleSignIn = () => {
    if (!googleLoaded || !window.google) {
      // Fallback to redirect method if Google SDK fails
      handleRedirectSignIn()
      return
    }

    setIsSigningIn(true)
    setError('')

    try {
      // Try to trigger Google One Tap again
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log('One Tap failed, falling back to redirect')
          handleRedirectSignIn()
        }
      })
    } catch (error) {
      console.error('Manual Google sign-in error:', error)
      handleRedirectSignIn()
    }
    
    setTimeout(() => {
      setIsSigningIn(false)
    }, 3000)
  }

  // Fallback redirect method (your original approach)
  const handleRedirectSignIn = () => {
    if (!GOOGLE_CLIENT_ID) {
      setError('Google Sign-In not configured. Please refresh the page.')
      return
    }

    setIsSigningIn(true)
    setError('')

    // Build redirect URL (fallback method)
    const redirectUri = `${window.location.origin}/auth/callback`
    const scope = 'email profile'
    const responseType = 'code'
    
    const googleAuthUrl = `https://accounts.google.com/oauth/authorize?` +
      `client_id=${GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `response_type=${responseType}&` +
      `access_type=online&` +
      `prompt=select_account&` +
      `state=${Math.random().toString(36).substring(2)}`

    console.log('Falling back to redirect method:', googleAuthUrl)
    window.location.href = googleAuthUrl
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
      {/* Load Google Sign-In Script */}
      <Script
        src="https://accounts.google.com/gsi/client"
        onLoad={() => {
          console.log('Google script loaded')
          initializeGoogleAuth()
        }}
        onError={() => {
          console.error('Failed to load Google script')
          setGoogleLoaded(true)
        }}
        strategy="afterInteractive"
      />

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
                  {/* Google button container */}
                  <div id="google-signin-button" className="w-full flex justify-center min-h-[50px]"></div>
                  
                  {/* Loading state with timeout */}
                  {!googleLoaded && !error && (
                    <div className="w-full bg-white/50 text-black/50 py-4 px-6 rounded-2xl font-medium flex items-center justify-center gap-3 border-2 border-black/10">
                      <div className="w-6 h-6 border-2 border-black/30 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading Google Sign-In...</span>
                    </div>
                  )}

                  {/* Show refresh and test options when Google is slow */}
                  {(error || !googleLoaded) && (
                    <div className="space-y-3">
                      <div className="text-sm text-black/60 text-center">
                        Google authentication is loading slowly. Choose an option:
                      </div>
                      
                      {/* Simple page refresh */}
                      <button
                        onClick={() => window.location.reload()}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-xl font-medium transition-all duration-300"
                      >
                        Refresh Page
                      </button>

                      {/* Or redirect method as fallback */}
                      <button
                        onClick={() => {
                          const redirectUri = `${window.location.origin}/auth/callback`
                          const googleAuthUrl = `https://accounts.google.com/oauth/authorize?` +
                            `client_id=${GOOGLE_CLIENT_ID}&` +
                            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
                            `scope=email%20profile&` +
                            `response_type=code&` +
                            `access_type=online&` +
                            `prompt=select_account`
                          
                          window.location.href = googleAuthUrl
                        }}
                        className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white py-3 px-6 rounded-xl font-medium transition-all duration-300"
                      >
                        Continue with Google (Direct)
                      </button>
                    </div>
                  )}

                  {/* Developer Test Login - Always show as backup */}
                  {isDevelopment && (
                    <div className="space-y-3">
                      <div className="text-xs text-black/60 text-center font-medium">Development Mode - Quick Test</div>
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