'use client'

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

// Types
interface User {
  id: string
  email: string
  user_type: 'creator' | 'brand'
  email_verified: boolean
  is_active: boolean
  last_login_at?: string
  created_at: string
}

interface CreatorProfile {
  id: string
  user_id: string
  username: string
  display_name: string
  email: string
  profile_photo_url?: string
  status: string
  stripe_onboarded: boolean
  bio?: string | null
  country?: string
  city?: string | null
  timezone?: string | null
  languages?: string[]
  niches?: string[]
  social_accounts?: Record<string, unknown>
  services?: unknown[]
  portfolio_items?: unknown[]
  is_verified?: boolean
  is_featured?: boolean
  avg_rating?: number
  total_reviews?: number
  total_deals_completed?: number
}

interface BrandProfile {
  id: string
  user_id: string
  company_name: string
  email: string
  logo_url?: string
  website?: string | null
  description?: string | null
  industry?: string | null
  company_size?: string | null
  country?: string
  contact_name?: string | null
  contact_role?: string | null
  total_spent?: number
  total_deals?: number
}

interface AuthState {
  user: User | null
  profile: CreatorProfile | BrandProfile | null
  isLoading: boolean
  isAuthenticated: boolean
  userType: 'creator' | 'brand' | null
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (email: string, password: string, userType: 'creator' | 'brand') => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateProfile: (data: Partial<CreatorProfile | BrandProfile>) => Promise<{ success: boolean; error?: string }>
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    isLoading: true,
    isAuthenticated: false,
    userType: null,
  })

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      // Get token from localStorage
      const token = localStorage.getItem('auth_token')
      
      if (!token) {
        setState(prev => ({ ...prev, isLoading: false }))
        return
      }

      // Verify token and get user data
      // In production, you'd validate with the server
      const savedUser = localStorage.getItem('auth_user')
      const savedProfile = localStorage.getItem('auth_profile')

      if (savedUser) {
        const user = JSON.parse(savedUser)
        const profile = savedProfile ? JSON.parse(savedProfile) : null

        setState({
          user,
          profile,
          isLoading: false,
          isAuthenticated: true,
          userType: user.user_type,
        })
      } else {
        setState(prev => ({ ...prev, isLoading: false }))
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const login = useCallback(async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }))

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setState(prev => ({ ...prev, isLoading: false }))
        return { success: false, error: data.error || 'Login failed' }
      }

      // Save to localStorage
      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('auth_user', JSON.stringify(data.user))
      if (data.profile) {
        localStorage.setItem('auth_profile', JSON.stringify(data.profile))
      }

      setState({
        user: data.user,
        profile: data.profile,
        isLoading: false,
        isAuthenticated: true,
        userType: data.user.user_type,
      })

      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      setState(prev => ({ ...prev, isLoading: false }))
      return { success: false, error: 'Network error. Please try again.' }
    }
  }, [])

  const register = useCallback(async (email: string, password: string, userType: 'creator' | 'brand') => {
    try {
      setState(prev => ({ ...prev, isLoading: true }))

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, user_type: userType }),
      })

      const data = await response.json()

      if (!response.ok) {
        setState(prev => ({ ...prev, isLoading: false }))
        return { success: false, error: data.error || 'Registration failed' }
      }

      setState(prev => ({ ...prev, isLoading: false }))
      return { success: true }
    } catch (error) {
      console.error('Registration error:', error)
      setState(prev => ({ ...prev, isLoading: false }))
      return { success: false, error: 'Network error. Please try again.' }
    }
  }, [])

  const logout = useCallback(async () => {
    // Clear localStorage
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_profile')

    // Reset state
    setState({
      user: null,
      profile: null,
      isLoading: false,
      isAuthenticated: false,
      userType: null,
    })

    // Redirect to home
    router.push('/')
  }, [router])

  const refreshProfile = useCallback(async () => {
    if (!state.user) return

    try {
      const endpoint = state.userType === 'creator' 
        ? `/api/creators?user_id=${state.user.id}`
        : `/api/brands?user_id=${state.user.id}`

      const response = await fetch(endpoint)
      const data = await response.json()

      if (response.ok) {
        const profile = state.userType === 'creator' ? data.creator : data.brand
        localStorage.setItem('auth_profile', JSON.stringify(profile))
        setState(prev => ({ ...prev, profile }))
      }
    } catch (error) {
      console.error('Error refreshing profile:', error)
    }
  }, [state.user, state.userType])

  const updateProfile = useCallback(async (data: Partial<CreatorProfile | BrandProfile>) => {
    if (!state.profile) {
      return { success: false, error: 'No profile found' }
    }

    try {
      const endpoint = state.userType === 'creator'
        ? `/api/creators/${state.profile.id}`
        : `/api/brands`

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: state.profile.id, ...data }),
      })

      const result = await response.json()

      if (!response.ok) {
        return { success: false, error: result.error || 'Update failed' }
      }

      const updatedProfile = state.userType === 'creator' ? result.creator : result.brand
      localStorage.setItem('auth_profile', JSON.stringify(updatedProfile))
      setState(prev => ({ ...prev, profile: updatedProfile }))

      return { success: true }
    } catch (error) {
      console.error('Error updating profile:', error)
      return { success: false, error: 'Network error. Please try again.' }
    }
  }, [state.profile, state.userType])

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshProfile,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook to require authentication
export function useRequireAuth(redirectTo = '/login') {
  const auth = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      router.push(redirectTo)
    }
  }, [auth.isLoading, auth.isAuthenticated, router, redirectTo])

  return auth
}

// Hook to require specific user type
export function useRequireUserType(requiredType: 'creator' | 'brand', redirectTo = '/dashboard') {
  const auth = useRequireAuth()
  const router = useRouter()

  useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated && auth.userType !== requiredType) {
      router.push(redirectTo)
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.userType, router, redirectTo, requiredType])

  return auth
}

export default useAuth