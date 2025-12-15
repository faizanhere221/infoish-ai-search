import { NextRequest, NextResponse } from 'next/server'

type UserTier = 'free' | 'starter' | 'pro'

interface UsageData {
  count: number
  lastReset: Date
  tier: UserTier
}

interface UserData {
  id: string
  email: string
  subscription_tier: UserTier
}

// Simple in-memory usage store (for MVP)
const usageStore = new Map<string, UsageData>()

function getUsageKey(ip: string, userId?: string): string {
  return userId || ip
}

function shouldResetUsage(lastReset: Date, tier: UserTier): boolean {
  const now = new Date()
  const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60)
  
  // Free tier: reset daily (24 hours)
  // Paid tiers: reset monthly (30 days = 720 hours)
  const resetHours = tier === 'free' ? 24 : 720
  
  return hoursSinceReset >= resetHours
}

function getResetTimeRemaining(lastReset: Date, tier: UserTier): string {
  const now = new Date()
  const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60)
  const resetHours = tier === 'free' ? 24 : 720
  const hoursRemaining = Math.ceil(resetHours - hoursSinceReset)
  
  if (tier === 'free') {
    return `${hoursRemaining} hours`
  } else {
    const daysRemaining = Math.ceil(hoursRemaining / 24)
    return `${daysRemaining} days`
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous'
    
    let userTier: UserTier = 'free'
    let userId: string | null = null
    let limit = 3

    // Check if user is authenticated
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      
      try {
        const backendUrl = process.env.NODE_ENV === 'production'
          ? 'https://infoish-ai-search-production.up.railway.app'
          : 'http://127.0.0.1:8000'
          
        const userResponse = await fetch(`${backendUrl}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (userResponse.ok) {
          const userData: UserData = await userResponse.json()
          userTier = userData.subscription_tier || 'free'
          userId = userData.id
          
          // Set limits based on tier
          limit = userTier === 'free' ? 3 : userTier === 'starter' ? 30 : 200
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      }
    }

    const usageKey = getUsageKey(ip, userId || undefined)
    const storedUsage = usageStore.get(usageKey)
    
    let usage: UsageData = storedUsage || { 
      count: 0, 
      lastReset: new Date(),
      tier: userTier
    }

    // Reset if needed
    if (shouldResetUsage(usage.lastReset, userTier)) {
      usage = {
        count: 0,
        lastReset: new Date(),
        tier: userTier
      }
      usageStore.set(usageKey, usage)
    }

    const remaining = Math.max(0, limit - usage.count)
    const resetIn = getResetTimeRemaining(usage.lastReset, userTier)

    return NextResponse.json({
      tier: userTier,
      used: usage.count,
      limit,
      remaining,
      resetIn,
      isAuthenticated: !!userId
    })

  } catch (error) {
    console.error('Usage check error:', error)
    return NextResponse.json(
      { 
        tier: 'free' as UserTier,
        used: 0,
        limit: 3,
        remaining: 3,
        resetIn: '24 hours',
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
    
    let userTier: UserTier = 'free'
    let userId: string | null = null

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      
      try {
        const backendUrl = process.env.NODE_ENV === 'production'
          ? 'https://infoish-ai-search-production.up.railway.app'
          : 'http://127.0.0.1:8000'
          
        const userResponse = await fetch(`${backendUrl}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (userResponse.ok) {
          const userData: UserData = await userResponse.json()
          userTier = userData.subscription_tier || 'free'
          userId = userData.id
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      }
    }

    const usageKey = getUsageKey(ip, userId || undefined)
    const storedUsage = usageStore.get(usageKey)
    
    const usage: UsageData = storedUsage || { 
      count: 0, 
      lastReset: new Date(),
      tier: userTier
    }

    // Increment usage
    usage.count++
    usage.tier = userTier
    usageStore.set(usageKey, usage)

    console.log(`[Usage Tracking] ${usageKey} (${userTier}): ${usage.count} uses`)

    return NextResponse.json({ 
      success: true,
      used: usage.count
    })

  } catch (error) {
    console.error('Usage tracking error:', error)
    return NextResponse.json(
      { error: 'Failed to track usage' },
      { status: 500 }
    )
  }
}