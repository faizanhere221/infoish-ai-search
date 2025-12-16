import { NextRequest, NextResponse } from 'next/server'

interface BackendUserData {
  id: string
  email: string
  name: string
  subscription_tier: string
  tool_subscriptions?: Record<string, string>  // NEW: Added type ✅
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

    // Use server-side environment variable first
    const backendUrl = process.env.BACKEND_URL || 
                      process.env.NEXT_PUBLIC_BACKEND_URL || 
                      'https://infoish-ai-search-production.up.railway.app'
    
    console.log(`[Auth API] Fetching user from: ${backendUrl}/auth/me`)
        
    const response = await fetch(`${backendUrl}/auth/me`, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      // Add cache control for production
      cache: 'no-store'
    })

    const data: BackendUserData = await response.json()

    if (response.ok) {
      // Ensure tool_subscriptions exists (backward compatibility) ✅
      if (!data.tool_subscriptions) {
        console.log('[Auth API] tool_subscriptions missing, creating default')
        data.tool_subscriptions = {
          infoishai_search: data.subscription_tier || 'free',
          ai_humanizer: 'free'
        }
      }

      // Log for debugging
      console.log(`[Auth API] User: ${data.email}, Tiers:`, data.tool_subscriptions)

      return NextResponse.json(data)
    } else {
      console.error('[Auth API] Backend error:', data)
      return NextResponse.json(data, { status: response.status })
    }
   
  } catch (error) {
    console.error('[Auth API] Connection error:', error)
    
    // More detailed error for debugging
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