'use client'
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function AuthCallback() {
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
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p>Completing authentication...</p>
      </div>
    </div>
  )
}