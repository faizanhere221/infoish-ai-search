import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { jwtVerify } from 'jose'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ✅ Use same secret as FastAPI backend
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'

type UserTier = 'free' | 'starter' | 'pro' | 'premium'

interface UsageData {
  count: number
  lastReset: Date
  tier: UserTier
}

interface UserData {
  id: string
  email: string
  subscription_tier: string
  humanizer_tier?: string
  tool_subscriptions?: Record<string, string>
}

const usageStore = new Map<string, UsageData>()

// Helper functions
function getUsageKey(ip: string, visitorId?: string, userId?: string): string {
  // Priority: userId > visitorId > ip
  return userId || visitorId || ip
}

function shouldResetUsage(lastReset: Date, limitType: 'daily' | 'monthly'): boolean {
  const now = new Date()
  const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60)
  const resetHours = limitType === 'daily' ? 24 : 720
  return hoursSinceReset >= resetHours
}

function getResetTimeRemaining(lastReset: Date, limitType: 'daily' | 'monthly'): string {
  const now = new Date()
  const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60)
  const resetHours = limitType === 'daily' ? 24 : 720
  const hoursRemaining = Math.ceil(resetHours - hoursSinceReset)
  
  if (limitType === 'daily') {
    return `${hoursRemaining} hours`
  } else {
    const daysRemaining = Math.ceil(hoursRemaining / 24)
    return `${daysRemaining} days`
  }
}

function getTierConfig(tier: UserTier): { limit: number; limitType: 'daily' | 'monthly' } {
  const configs = {
    free: { limit: 3, limitType: 'daily' as const },
    starter: { limit: 50, limitType: 'monthly' as const },
    pro: { limit: 150, limitType: 'monthly' as const },
    premium: { limit: 150, limitType: 'monthly' as const }
  }
  return configs[tier]
}

// ✅ Verify FastAPI JWT token and get email
async function verifyFastAPIToken(token: string): Promise<string | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256']
    })
    
    // FastAPI stores email in 'sub' claim
    const email = payload.sub as string
    console.log('[Usage API] ✅ FastAPI token verified for:', email)
    return email
  } catch (error) {
    console.log('[Usage API] ❌ FastAPI token verification failed:', error)
    return null
  }
}

// ✅ Try Supabase Auth token
async function verifySupabaseToken(token: string): Promise<string | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) {
      return null
    }
    console.log('[Usage API] ✅ Supabase token verified for:', user.email)
    return user.email || null
  } catch (error) {
    return null
  }
}

// ✅ Get user from database by email
async function getUserByEmail(email: string): Promise<{ userData: UserData | null, tier: UserTier }> {
  try {
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('id, email, subscription_tier, humanizer_tier, tool_subscriptions')
      .eq('email', email)
      .single()

    if (dbError || !userData) {
      console.error('[Usage API] Database error:', dbError?.message)
      return { userData: null, tier: 'free' }
    }

    console.log('[Usage API] ✅ User data loaded:', {
      email: userData.email,
      humanizer_tier: userData.humanizer_tier,
      tool_subscriptions: userData.tool_subscriptions
    })

    // ✅ Check BOTH tool_subscriptions AND legacy column
    let tier: UserTier = 'free'
    
    // Parse tool_subscriptions if it's a string
    let toolSubs = userData.tool_subscriptions
    if (typeof toolSubs === 'string') {
      try {
        toolSubs = JSON.parse(toolSubs)
      } catch {
        toolSubs = null
      }
    }
    
    if (toolSubs?.ai_humanizer) {
      tier = toolSubs.ai_humanizer as UserTier
      console.log('[Usage API] Tier from tool_subscriptions:', tier)
    } else if (userData.humanizer_tier) {
      tier = userData.humanizer_tier as UserTier
      console.log('[Usage API] Tier from humanizer_tier:', tier)
    }

    console.log('[Usage API] Final tier:', tier)

    return { userData: userData as UserData, tier }

  } catch (error) {
    console.error('[Usage API] Database error:', error)
    return { userData: null, tier: 'free' }
  }
}

// ✅ Main authentication function - tries both token types
async function authenticateUser(authHeader: string | null): Promise<{ email: string | null, userData: UserData | null, tier: UserTier }> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { email: null, userData: null, tier: 'free' }
  }

  const token = authHeader.substring(7)
  
  // Try FastAPI token first (most common in your setup)
  let email = await verifyFastAPIToken(token)
  
  // If FastAPI fails, try Supabase token
  if (!email) {
    email = await verifySupabaseToken(token)
  }
  
  if (!email) {
    console.log('[Usage API] ⚠️ Both token verifications failed')
    return { email: null, userData: null, tier: 'free' }
  }
  
  // Get user data from database
  const { userData, tier } = await getUserByEmail(email)
  
  return { email, userData, tier }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous'
    
    // ✅ Authenticate user (supports both FastAPI and Supabase tokens)
    const { email, userData, tier: userTier } = await authenticateUser(authHeader)
    const isAuthenticated = !!userData
    const userId = userData?.id || null

    if (isAuthenticated) {
      console.log('[Usage API] ✅ Authenticated user:', {
        email,
        tier: userTier,
        userId
      })
    } else {
      console.log('[Usage API] ⚠️ No valid authentication, using free tier')
    }

    // Get tier configuration based on FRESH tier from database
    const tierConfig = getTierConfig(userTier)
    const limit = tierConfig.limit
    const limitType = tierConfig.limitType

    // Get or create usage data
    const usageKey = getUsageKey(ip, undefined, userId || undefined)
    const storedUsage = usageStore.get(usageKey)
    
    let usage: UsageData

    // ✅ Always check if tier changed and handle accordingly
    if (storedUsage) {
      if (storedUsage.tier !== userTier) {
        console.log(`[Usage API] 🔄 Tier changed from ${storedUsage.tier} to ${userTier}`)
        
        const oldTierConfig = getTierConfig(storedUsage.tier)
        
        if (oldTierConfig.limitType !== limitType) {
          console.log(`[Usage API] 🔄 Limit type changed, resetting count`)
          usage = {
            count: 0,
            lastReset: new Date(),
            tier: userTier
          }
        } else {
          usage = {
            ...storedUsage,
            tier: userTier
          }
        }
        
        usageStore.set(usageKey, usage)
      } else {
        usage = storedUsage
      }
      
      if (shouldResetUsage(usage.lastReset, limitType)) {
        console.log('[Usage API] ⏰ Time-based reset for:', usageKey)
        usage = {
          count: 0,
          lastReset: new Date(),
          tier: userTier
        }
        usageStore.set(usageKey, usage)
      }
    } else {
      console.log('[Usage API] 🆕 Creating new usage record for:', usageKey)
      usage = { 
        count: 0, 
        lastReset: new Date(),
        tier: userTier
      }
      usageStore.set(usageKey, usage)
    }

    const remaining = Math.max(0, limit - usage.count)
    const resetIn = getResetTimeRemaining(usage.lastReset, limitType)

    const response = {
      tier: userTier,
      used: usage.count,
      limit,
      remaining,
      resetIn,
      isAuthenticated
    }

    console.log('[Usage API] ✅ Returning:', response)

    return NextResponse.json(response)

  } catch (error) {
    console.error('[Usage API] Error:', error)
    return NextResponse.json(
      { 
        tier: 'free' as UserTier,
        used: 0,
        limit: 3,
        remaining: 3,
        resetIn: '24 hours',
        isAuthenticated: false,
        error: 'Failed to check usage'
      },
      { status: 200 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous'
    
    // ✅ Authenticate user
    const { userData, tier: userTier } = await authenticateUser(authHeader)
    const userId = userData?.id || null

    const usageKey = getUsageKey(ip, undefined, userId || undefined)
    const storedUsage = usageStore.get(usageKey)
    
    let usage: UsageData
    
    if (storedUsage) {
      if (storedUsage.tier !== userTier) {
        const oldTierConfig = getTierConfig(storedUsage.tier)
        const newTierConfig = getTierConfig(userTier)
        
        if (oldTierConfig.limitType !== newTierConfig.limitType) {
          usage = {
            count: 1,
            lastReset: new Date(),
            tier: userTier
          }
        } else {
          usage = {
            count: storedUsage.count + 1,
            lastReset: storedUsage.lastReset,
            tier: userTier
          }
        }
      } else {
        usage = {
          ...storedUsage,
          count: storedUsage.count + 1
        }
      }
    } else {
      usage = { 
        count: 1, 
        lastReset: new Date(),
        tier: userTier
      }
    }
    
    usageStore.set(usageKey, usage)

    console.log(`[Usage API] ✅ Incremented: ${usageKey} (${userTier}): ${usage.count} uses`)

    return NextResponse.json({ 
      success: true,
      used: usage.count
    })

  } catch (error) {
    console.error('[Usage API] Tracking error:', error)
    return NextResponse.json(
      { error: 'Failed to track usage' },
      { status: 500 }
    )
  }
}