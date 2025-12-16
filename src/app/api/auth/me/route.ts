import { NextRequest, NextResponse } from 'next/server'

interface BackendUserData {
  id: string
  email: string
  full_name?: string  // Your backend uses full_name
  name?: string       // Keep for compatibility
  profile_picture?: string
  subscription_tier: string
  tool_subscriptions?: Record<string, string>
  created_at: string
  updated_at: string
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    const backendUrl = process.env.BACKEND_URL || 
                      process.env.NEXT_PUBLIC_BACKEND_URL || 
                      'https://infoish-ai-search-production.up.railway.app'
    
    console.log(`[Auth API] Fetching user from: ${backendUrl}/auth/me`)
    
    // Add timeout controller ✅
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
    
    try {
      const response = await fetch(`${backendUrl}/auth/me`, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        cache: 'no-store'
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        console.error(`[Auth API] Backend returned ${response.status}`)
        const errorData = await response.json().catch(() => ({ error: 'Auth failed' }))
        return NextResponse.json(errorData, { status: response.status })
      }

      const data: BackendUserData = await response.json()

      // Ensure tool_subscriptions exists (backward compatibility) ✅
      if (!data.tool_subscriptions) {
        console.log('[Auth API] tool_subscriptions missing, creating default')
        
        // Map backend tier names to frontend tier names ✅
        const tierMap: Record<string, string> = {
          'developer': 'premium',
          'premium': 'premium',
          'pro': 'pro',
          'starter': 'starter',
          'free': 'free'
        }
        
        const normalizedTier = tierMap[data.subscription_tier?.toLowerCase() || 'free'] || 'free'
        
        data.tool_subscriptions = {
          infoishai_search: normalizedTier,
          ai_humanizer: 'free'
        }
      }

      // Log for debugging
      console.log(`[Auth API] ✅ User: ${data.email}`)
      console.log(`[Auth API] Backend tier: ${data.subscription_tier}`)
      console.log(`[Auth API] Tool subscriptions:`, data.tool_subscriptions)

      return NextResponse.json(data)
      
    } catch (fetchError) {
      clearTimeout(timeoutId)
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('[Auth API] Request timeout after 10s')
        return NextResponse.json(
          { 
            error: 'Backend timeout',
            message: 'Authentication server is taking too long to respond. Please try again.'
          },
          { status: 504 }
        )
      }
      
      throw fetchError
    }
   
  } catch (error) {
    console.error('[Auth API] Connection error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'Cannot connect to authentication server',
          details: error.message 
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Cannot connect to authentication server' },
      { status: 503 }
    )
  }
}