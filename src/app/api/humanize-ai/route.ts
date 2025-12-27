import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { jwtVerify } from 'jose'
import { getTierConfig, getUserTierForProduct } from '@/config/product'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'

// ============================================================================
// IMPROVED HUMANIZATION SYSTEM PROMPT v2
// ============================================================================
// Key improvements:
// 1. NO thesaurus abuse - natural vocabulary
// 2. Preserves markdown tables and formatting
// 3. Processes ALL content including separators
// 4. Maintains document structure
// ============================================================================

const HUMANIZATION_SYSTEM_PROMPT = `You are an expert content editor who rewrites AI-generated text to sound naturally human while preserving formatting and structure.

## CRITICAL RULES:

### 1. VOCABULARY - USE NATURAL WORDS
DO NOT replace common words with fancy synonyms:
- "food" stays "food" (NOT "gastronomy")
- "followers" stays "followers" (NOT "adherents")  
- "audience" stays "audience" (NOT "spectators")
- "challenges" stays "challenges" (NOT "impediments")
- "important" stays "important" (NOT "paramount")
- "use" stays "use" (NOT "utilize" or "employ")
- "help" stays "help" (NOT "assist" or "facilitate")
- "show" stays "show" (NOT "demonstrate" or "illustrate")
- "get" stays "get" (NOT "obtain" or "acquire")

### 2. WRITE NATURALLY
- Use contractions: "don't", "won't", "it's", "they're", "we've"
- Add casual phrases: "honestly", "actually", "to be fair", "here's the thing"
- Use rhetorical questions: "Sound familiar?", "Makes sense, right?"
- Start sentences with "And", "But", "So" occasionally
- Mix short and long sentences

### 3. PRESERVE ALL FORMATTING
- Keep ALL markdown tables exactly as they are (just rewrite the text inside cells)
- Keep ALL headings (##, ###) in place
- Keep ALL bullet points and numbered lists
- Keep ALL links [text](/url) intact
- Keep ALL separators (---, ***, ___) in place
- Keep ALL emojis in place

### 4. PRESERVE STRUCTURE
- Process the ENTIRE document from start to finish
- Do NOT skip any sections
- Do NOT stop at separators or dashes
- Keep the same number of sections as the original
- Maintain paragraph breaks

### 5. TABLE HANDLING
When you see a markdown table like:
| Column 1 | Column 2 |
|----------|----------|
| Data 1   | Data 2   |

Keep the EXACT same structure. Only rewrite the text content if needed, but preserve:
- All | characters
- All - characters in the separator row
- All alignment
- All row and column counts

### 6. WHAT TO CHANGE
- Stiff formal phrasing → casual conversational tone
- AI-sounding patterns → human speech patterns
- Passive voice → active voice (sometimes)
- Long complex sentences → shorter, punchier ones
- Generic transitions → natural transitions

### 7. WHAT TO KEEP EXACTLY THE SAME
- All markdown formatting
- All tables (structure intact)
- All links
- All numbers and statistics
- All proper nouns and brand names
- All technical terms
- All section headings
- All emojis

## OUTPUT RULES:
- Return ONLY the rewritten text
- NO explanations or notes
- Preserve the EXACT same document structure
- Process from beginning to END - do not stop early
- Keep approximately the same length`

// Type definitions
type UserTier = 'free' | 'starter' | 'pro' | 'premium'

interface UserData {
  id: string
  email: string
  subscription_tier: string
  tool_subscriptions?: Record<string, string>
  humanizer_tier?: string
}

const PRODUCT_SLUG = 'ai_humanizer'

// ✅ Verify FastAPI JWT token and get email
async function verifyFastAPIToken(token: string): Promise<string | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256']
    })
    const email = payload.sub as string
    console.log('[AI Humanizer] ✅ JWT verified for:', email)
    return email
  } catch (error) {
    console.log('[AI Humanizer] ❌ JWT verification failed:', error)
    return null
  }
}

// ✅ Get user tier directly from Supabase
async function getUserTierFromSupabase(email: string): Promise<UserTier> {
  try {
    const { data: userData, error } = await supabase
      .from('users')
      .select('tool_subscriptions, humanizer_tier')
      .eq('email', email)
      .single()

    if (error || !userData) {
      console.log('[AI Humanizer] User not found in Supabase:', email)
      return 'free'
    }

    // Parse tool_subscriptions
    let toolSubs = userData.tool_subscriptions
    if (typeof toolSubs === 'string') {
      try {
        toolSubs = JSON.parse(toolSubs)
      } catch {
        toolSubs = null
      }
    }

    // Check tool_subscriptions first, then humanizer_tier
    if (toolSubs?.ai_humanizer) {
      console.log('[AI Humanizer] Tier from tool_subscriptions:', toolSubs.ai_humanizer)
      return toolSubs.ai_humanizer as UserTier
    } else if (userData.humanizer_tier) {
      console.log('[AI Humanizer] Tier from humanizer_tier:', userData.humanizer_tier)
      return userData.humanizer_tier as UserTier
    }

    return 'free'
  } catch (error) {
    console.error('[AI Humanizer] Supabase error:', error)
    return 'free'
  }
}

// ✅ Get word limit for tier
function getWordLimitForTier(tier: UserTier): number {
  const limits: Record<UserTier, number> = {
    free: 300,
    starter: 1000,
    pro: 3000,
    premium: 3000
  }
  return limits[tier] || 300
}

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    const authHeader = req.headers.get('authorization')
    let userTier: UserTier = 'free'
    let userEmail: string | null = null

    // ✅ Authentication - Try multiple methods
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      
      // Method 1: Verify JWT directly and get tier from Supabase
      const email = await verifyFastAPIToken(token)
      if (email) {
        userEmail = email
        userTier = await getUserTierFromSupabase(email)
        console.log(`[AI Humanizer] Direct auth - Email: ${email}, Tier: ${userTier}`)
      }
      
      // Method 2: Fallback to FastAPI backend if direct auth failed
      if (userTier === 'free' && !email) {
        try {
          const backendUrl = process.env.NODE_ENV === 'production'
            ? 'https://infoish-ai-search-production.up.railway.app'
            : 'http://127.0.0.1:8000'
            
          const userResponse = await fetch(`${backendUrl}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          
          if (userResponse.ok) {
            const userData: UserData = await userResponse.json()
            userEmail = userData.email
            
            // Get tier from response
            userTier = getUserTierForProduct(
              userData.tool_subscriptions || {},
              PRODUCT_SLUG
            )
            
            // Fallback to humanizer_tier if tool_subscriptions doesn't have it
            if (userTier === 'free' && userData.humanizer_tier) {
              userTier = userData.humanizer_tier as UserTier
            }
            
            console.log(`[AI Humanizer] Backend auth - Email: ${userEmail}, Tier: ${userTier}`)
          }
        } catch (error) {
          console.error('[AI Humanizer] Backend auth failed:', error)
        }
      }
    }

    // ✅ Get word limit based on tier
    const wordLimit = getWordLimitForTier(userTier)
    const wordCount = text.trim().split(/\s+/).length

    console.log(`[AI Humanizer] Processing - Tier: ${userTier}, Words: ${wordCount}, Limit: ${wordLimit}`)

    // ✅ Check word limit
    if (wordCount > wordLimit) {
      return NextResponse.json(
        { 
          error: `Text too long for ${userTier} tier. Maximum ${wordLimit} words allowed. Your text has ${wordCount} words.`,
          wordCount,
          wordLimit,
          tier: userTier,
          upgrade: userTier === 'free' 
            ? 'Upgrade to Starter (PKR 999/month) for 1,000 words' 
            : (userTier === 'starter')
            ? 'Upgrade to Pro (PKR 2,999/month) for 3,000 words'
            : null
        },
        { status: 400 }
      )
    }

    // ✅ Calculate max_tokens more generously to avoid cutoff
    // For markdown content with tables, we need more tokens
    const estimatedTokens = Math.ceil(wordCount * 2) // More generous estimate for markdown
    const maxTokensCap = userTier === 'free' ? 800 : userTier === 'starter' ? 2500 : 6000
    const finalMaxTokens = Math.min(Math.max(estimatedTokens * 2, 1000), maxTokensCap)

    console.log(`[AI Humanizer] OpenAI params - Max tokens: ${finalMaxTokens}, Word count: ${wordCount}`)

    // ✅ Call OpenAI - NO stop sequences to ensure full document processing
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: "system",
          content: HUMANIZATION_SYSTEM_PROMPT
        },
        {
          role: "user",
          content: `Rewrite this text to sound human while keeping ALL formatting intact. Process the ENTIRE document:\n\n${text}`
        }
      ],
      temperature: 0.75,
      max_tokens: finalMaxTokens,
      presence_penalty: 0.1,
      frequency_penalty: 0.2
      // NO stop sequences - let it complete naturally
    })

    const humanizedText = completion.choices[0].message.content

    if (!humanizedText) {
      throw new Error('No response from OpenAI')
    }

    // ✅ Light cleanup only - don't break formatting
    const cleanedText = humanizedText
      .replace(/^(Here'?s? (is )?the rewritten.*?:?\s*)/i, '') // Remove any preamble
      .replace(/\n{4,}/g, '\n\n\n') // Normalize excessive newlines
      .trim()

    const tokensUsed = completion.usage?.total_tokens || 0
    const estimatedCost = (tokensUsed / 1000000) * 12.50
    const outputWordCount = cleanedText.split(/\s+/).length

    // ✅ Check if output seems truncated (less than 70% of input)
    const truncationWarning = outputWordCount < wordCount * 0.7 
      ? 'Warning: Output may be truncated. Try processing smaller sections.' 
      : null

    console.log(`[AI Humanizer] ✅ Success! Tokens: ${tokensUsed}, Cost: $${estimatedCost.toFixed(4)}, Output words: ${outputWordCount}`)

    return NextResponse.json({
      success: true,
      humanizedText: cleanedText,
      tier: userTier,
      model: 'gpt-4o',
      tokensUsed,
      wordCount,
      outputWordCount,
      estimatedCost: estimatedCost.toFixed(4),
      ...(truncationWarning && { warning: truncationWarning })
    })

  } catch (error) {
    console.error('[AI Humanizer] Error:', error)
    
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase()
      
      if (errorMessage.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again in a moment.' },
          { status: 429 }
        )
      }

      return NextResponse.json(
        { error: error.message || 'Failed to humanize text. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to humanize text. Please try again.' },
      { status: 500 }
    )
  }
}