// utils/auth.ts - Create this file in your src/utils/ directory

export const logoutUser = () => {
  try {
    // Clear local storage
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    localStorage.removeItem('user_type')
    
    // Clear session storage
    sessionStorage.clear()
    
    // Clear Google auth state
    if (window.google && window.google.accounts) {
      window.google.accounts.id.disableAutoSelect()
      
      // Revoke Google session
      window.google.accounts.id.revoke('', () => {
        console.log('Google session revoked')
      })
    }
    
    // Clear credentials API
    if (navigator.credentials && navigator.credentials.preventSilentAccess) {
      navigator.credentials.preventSilentAccess()
    }
    
    // Clear Google-related cookies
    const cookiesToClear = [
      'g_state', 'g_csrf_token', 'gsi_state', 'gsi_replay',
      'NID', 'HSID', 'SSID', 'APISID', 'SAPISID'
    ]
    
    cookiesToClear.forEach(cookieName => {
      // Clear for current domain
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
      // Clear for parent domain
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname}`
      // Clear for Google domains
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.google.com`
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.accounts.google.com`
    })
    
    console.log('User logged out successfully')
    return true
    
  } catch (error) {
    console.error('Logout error:', error)
    return false
  }
}

// Enhanced logout with backend notification
export const logoutUserWithBackend = async (authToken?: string) => {
  try {
    // Notify backend of logout (optional)
    if (authToken) {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://infoish-ai-search-production.up.railway.app'
      
      try {
        await fetch(`${backendUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        })
      } catch (error) {
        console.log('Backend logout notification failed (non-critical):', error)
      }
    }
    
    // Perform local logout
    return logoutUser()
    
  } catch (error) {
    console.error('Enhanced logout error:', error)
    // Still perform local logout even if backend fails
    return logoutUser()
  }
}


export const setUserType = (type: 'brand' | 'influencer') => {
  try {
    localStorage.setItem('user_type', type)
    return true
  } catch (error) {
    console.error('Error setting user type:', error)
    return false
  }
}

export const getUserType = (): 'brand' | 'influencer' | null => {
  try {
    const type = localStorage.getItem('user_type')
    return type as 'brand' | 'influencer' | null
  } catch (error) {
    console.error('Error getting user type:', error)
    return null
  }
}

