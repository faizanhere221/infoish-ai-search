'use client'
import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function AuthCallbackContent() {
  const searchParams = useSearchParams()
  
  useEffect(() => {
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    
    if (window.opener) {
      if (code) {
        window.opener.postMessage({ 
          type: 'GOOGLE_AUTH_SUCCESS', 
          code 
        }, window.location.origin)
      } else {
        window.opener.postMessage({ 
          type: 'GOOGLE_AUTH_ERROR', 
          error: error || 'Authentication failed' 
        }, window.location.origin)
      }
      window.close()
    }
  }, [searchParams])
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-black/70">Completing authentication...</p>
      </div>
    </div>
  )
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-black/70">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}