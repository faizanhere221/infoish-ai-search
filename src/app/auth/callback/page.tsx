'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function AuthCallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code')
      const error = searchParams.get('error')

      console.log('Callback received:', { code: !!code, error })

      if (error) {
        console.error('OAuth error:', error)
        router.push(`/login?error=${encodeURIComponent(error)}`)
        return
      }

      if (!code) {
        console.error('No authorization code received')
        router.push('/login?error=no_code')
        return
      }

      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://infoish-ai-search-production.up.railway.app'
        const redirectUri = `${window.location.origin}/auth/callback`
        
        console.log('Exchanging code with backend...')
        
        const response = await fetch(`${backendUrl}/auth/google/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            redirect_uri: redirectUri
          })
        })

        const data = await response.json()
        console.log('Backend response:', { status: response.status, success: response.ok })

        if (response.ok && data.access_token) {
          localStorage.setItem('auth_token', data.access_token)
          localStorage.setItem('user_data', JSON.stringify(data.user))
          
          console.log('Authentication successful, redirecting to search...')
          router.push('/search')
        } else {
          console.error('Backend auth error:', data)
          router.push(`/login?error=${encodeURIComponent(data.detail || data.error || 'Authentication failed')}`)
        }
      } catch (error: any) {
        console.error('Callback processing error:', error)
        router.push(`/login?error=${encodeURIComponent('Network error during authentication')}`)
      }
    }

    handleCallback()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-green-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <span className="text-white font-bold text-3xl">I</span>
        </div>
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-black/70 text-lg font-medium">Completing authentication...</p>
        <p className="text-black/50 text-sm mt-2">Please wait while we sign you in</p>
      </div>
    </div>
  )
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-green-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-white font-bold text-3xl">I</span>
          </div>
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-black/70">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}