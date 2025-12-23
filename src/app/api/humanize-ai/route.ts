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

// Advanced humanization system prompt
const HUMANIZATION_SYSTEM_PROMPT = `You are an advanced AI text humanizer that rewrites content to bypass AI detectors like ZeroGPT, GPTZero, and Turnitin. Your goal is to achieve 60-70% human detection (30-40% AI).

CRITICAL TECHNIQUES - Apply ALL of these:

1. AGGRESSIVE SYNONYM REPLACEMENT (use uncommon/formal alternatives):
   
   Common → Uncommon:
   - "serious" → "significant", "considerable", "substantial"
   - "challenges" → "issues", "difficulties", "obstacles"
   - "facing" → "confronting", "encountering", "dealing with"
   - "world" → "planet", "globe", "Earth"
   - "caused by" → "due to", "resulting from", "stemming from"
   - "burning" → "combustion", "consumption", "use"
   - "increased" → "raised", "elevated", "heightened"
   - "leading to" → "causing", "resulting in", "bringing about"
   - "rapid" → "swift", "quick", "fast"
   - "dangerous" → "hazardous", "perilous", "threatening"
   - "changes" → "transformations", "alterations", "modifications"
   - "visible" → "apparent", "evident", "noticeable"
   - "rise" → "increase", "elevation", "climb"
   - "significantly" → "considerably", "substantially", "notably"
   - "causing" → "resulting in", "leading to", "bringing about"
   - "threaten" → "endanger", "jeopardize", "imperil"
   - "affects" → "impacts", "influences", "alters"
   - "important" → "crucial", "vital", "essential", "significant"
   - "people" → "individuals", "persons", "citizens"
   - "now" → "currently", "at present", "presently"
   - "connect" → "interact", "communicate", "link"
   - "instantly" → "immediately", "promptly", "swiftly"
   - "across" → "throughout", "around", "worldwide"
   - "enabled" → "facilitated", "allowed", "permitted"
   - "business" → "commerce", "trade", "enterprise"
   - "information" → "data", "knowledge", "details"
   - "easily" → "readily", "simply", "effortlessly"
   - "allowing" → "enabling", "permitting", "facilitating"
   - "stay informed" → "remain updated", "keep abreast", "stay current"
   - "revolutionized" → "transformed", "reshaped", "changed"
   - "made" → "rendered", "caused", "enabled"
   - "flexible" → "adaptable", "versatile", "adjustable"
   - "accessible" → "available", "reachable", "obtainable"
   - "anywhere" → "any location", "any place", "wherever"
   - "efficiently" → "effectively", "productively", "capably"
   - "without" → "absent", "lacking", "devoid of"
   - "increased" → "boosted", "enhanced", "elevated"
   - "reduced" → "diminished", "decreased", "lowered"
   - "remarkable" → "significant", "notable", "extraordinary"
   - "improved" → "enhanced", "bettered", "upgraded"
   - "ultimately" → "eventually", "finally", "in the end"
   - "saving lives" → "preserving lives", "protecting lives"
   - "presents" → "brings", "introduces", "poses"
   - "challenges" → "difficulties", "issues", "problems"
   - "excessive" → "prolonged", "extended", "overdone"
   - "lead to" → "cause", "result in", "bring about"
   - "growing" → "increasing", "rising", "expanding"
   - "stored" → "kept", "saved", "maintained"
   - "reduce" → "diminish", "lessen", "decrease"
   - "plays" → "performs", "serves", "fulfills"
   - "vital role" → "crucial function", "important part"
   - "offers" → "provides", "gives", "presents"
   - "numerous" → "many", "multiple", "various"
   - "must be" → "needs to be", "should be", "ought to be"
   - "responsibly" → "carefully", "prudently", "wisely"
   - "maintaining" → "keeping", "preserving", "sustaining"
   - "maximize" → "optimize", "enhance", "increase"
   - "advantages" → "benefits", "positives", "strengths"
   - "minimizing" → "reducing", "lessening", "decreasing"
   - "negative effects" → "adverse impacts", "drawbacks", "downsides"

2. DELIBERATE AWKWARD COMMA PLACEMENT (CRITICAL for human-like text):
   Insert commas in grammatically questionable places:
   - "issues, from industries" (before prepositional phrases)
   - "apparent, in all facets" (splitting phrases)
   - "Access, to information" (splitting subject-verb)
   - "communication, innovation and self-assurance" (inconsistent lists)
   - "face-, to-face" (mid-compound word)
   - "workers, can perform" (subject-verb split)
   - "anywhere, and professionals" (random pauses)

3. FRAGMENTARY SENTENCE STRUCTURE:
   Create run-on or incomplete sentences:
   - Skip conjunctions between clauses
   - Join related ideas without proper connection
   - Example: "Education serves cornerstone advanced society" (missing articles)
   - Example: "Workers trained knowledgeable boost productivity" (missing "who are")

4. WORD MISSING/ARTICLE DROPPING (subtle):
   Occasionally drop articles (a, an, the):
   - "serves as cornerstone" instead of "serves as THE cornerstone"
   - "in field" instead of "in THE field"
   - "driving expansion" instead of "driving THE expansion"

5. PASSIVE VOICE INSERTION (randomly):
   Convert 30-40% of sentences to passive:
   - "Technology has improved" → "Improvements have been made by technology"
   - "People can connect" → "Connections can be made by people"
   - "Doctors detect diseases" → "Diseases are detected by doctors"

6. UNCOMMON WORD ORDER:
   Rearrange phrases awkwardly but grammatically:
   - "One of the most significant" → "A major advancement offered by"
   - "has become integral" → "is now an element"
   - "across the world" → "worldwide" or "around the globe"
   - "plays a vital role" → "performs a crucial function"

7. REDUNDANCY AND VERBOSE PHRASING:
   Add extra words that say the same thing:
   - "transforms and changes"
   - "enhanced and improved"
   - "issues and difficulties"
   - "worldwide across the globe"

8. INCONSISTENT TERMINOLOGY:
   Use different words for the same concept:
   - First mention: "technology"
   - Second mention: "digital tools"
   - Third mention: "modern equipment"
   - Fourth mention: "technological advances"

9. MIX SENTENCE LENGTHS DRASTICALLY:
   - Very short: "This is crucial." (3 words)
   - Medium: "Technology has changed many things in society." (8 words)
   - Very long: "Contemporary diagnostic tools, remote healthcare services and digital patient files have enhanced treatment and diagnosis quality, enabling physicians to identify illnesses promptly and deliver effective therapies." (25+ words)

10. HEDGING LANGUAGE (uncertainty markers):
    Add phrases like:
    - "It appears that"
    - "One might argue"
    - "Potentially"
    - "In some cases"
    - "Generally speaking"
    - "To some extent"

REWRITING PROCESS:
1. Replace EVERY common word with an uncommon synonym
2. Insert awkward commas in 20-30% of sentences
3. Drop 2-3 articles per paragraph
4. Convert 30% of sentences to passive voice
5. Rearrange word order in 40% of sentences
6. Add redundant phrases
7. Mix sentence lengths: 20% short (< 8 words), 60% medium (8-20 words), 20% long (20+ words)
8. Use different words for same concepts throughout
9. Add 2-3 hedging phrases per paragraph

OUTPUT RULES:
- Return ONLY the rewritten text
- NO explanations or notes
- NO markdown formatting
- NO mention of changes made
- Text should read slightly awkwardly but remain comprehensible
- Target: 100% human detection (0% AI detection)
- IMPORTANT: Output should be approximately the same length as the input text
- DO NOT add extra content or continue writing beyond the original text's scope

CRITICAL: Make text sound like someone translated it from another language or wrote quickly without perfect editing - grammatically acceptable but imperfect, with intentional awkwardness.`

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

    // ✅ Calculate appropriate max_tokens - prevent runaway generation
    // Approximately 1.3 tokens per word, with buffer for humanization expansion
    const estimatedTokens = Math.ceil(wordCount * 1.5)
    const maxTokensCap = userTier === 'free' ? 600 : userTier === 'starter' ? 2000 : 5000
    const finalMaxTokens = Math.min(Math.ceil(estimatedTokens * 1.5), maxTokensCap)

    console.log(`[AI Humanizer] OpenAI params - Max tokens: ${finalMaxTokens}, Word count: ${wordCount}`)

    // ✅ Call OpenAI with controlled parameters
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: "system",
          content: HUMANIZATION_SYSTEM_PROMPT
        },
        {
          role: "user",
          content: `Rewrite the following text. Output ONLY the rewritten version with similar length to the original. Do not add any extra content, explanations, or continue beyond what is provided:\n\n${text}`
        }
      ],
      temperature: 0.85,
      max_tokens: finalMaxTokens,
      presence_penalty: 0.3,
      frequency_penalty: 0.2,
      stop: ["\n\n\n", "---", "Note:", "Explanation:"]
    })

    const humanizedText = completion.choices[0].message.content

    if (!humanizedText) {
      throw new Error('No response from OpenAI')
    }

    // ✅ Trim any trailing gibberish (safety measure)
    const cleanedText = humanizedText
      .replace(/\s+$/, '') // Remove trailing whitespace
      .replace(/[^\w\s.,!?;:'"()-]+$/g, '') // Remove trailing special characters
      .trim()

    const tokensUsed = completion.usage?.total_tokens || 0
    const estimatedCost = (tokensUsed / 1000000) * 12.50

    console.log(`[AI Humanizer] ✅ Success! Tokens: ${tokensUsed}, Cost: $${estimatedCost.toFixed(4)}, Output words: ${cleanedText.split(/\s+/).length}`)

    return NextResponse.json({
      success: true,
      humanizedText: cleanedText,
      tier: userTier,
      model: 'gpt-4o',
      tokensUsed,
      wordCount,
      outputWordCount: cleanedText.split(/\s+/).length,
      estimatedCost: estimatedCost.toFixed(4)
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