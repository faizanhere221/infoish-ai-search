import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

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

CRITICAL: Make text sound like someone translated it from another language or wrote quickly without perfect editing - grammatically acceptable but imperfect, with intentional awkwardness.`

type UserTier = 'free' | 'starter' | 'pro'

interface TierLimits {
  daily?: number
  monthly?: number
  wordLimit: number
  model: string
}

const USAGE_LIMITS: Record<UserTier, TierLimits> = {
  free: { 
    daily: 2,
    wordLimit: 300,
    model: 'gpt-4o'
  },
  starter: { 
    monthly: 50,
    wordLimit: 1000,
    model: 'gpt-4o'
  },
  pro: { 
    monthly: 150,
    wordLimit: 3000,
    model: 'gpt-4o'
  }
}

interface UserData {
  id: string
  email: string
  subscription_tier: UserTier
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
    let userId: string | null = null
    let userEmail: string | null = null

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
          userEmail = userData.email
        }
      } catch (error) {
        console.error('Auth verification failed:', error)
      }
    }

    const tierLimits = USAGE_LIMITS[userTier]
    const wordCount = text.trim().split(/\s+/).length

    if (wordCount > tierLimits.wordLimit) {
      return NextResponse.json(
        { 
          error: `Text too long for ${userTier} tier. Maximum ${tierLimits.wordLimit} words. You have ${wordCount} words.`,
          wordCount,
          wordLimit: tierLimits.wordLimit,
          upgrade: userTier === 'free' 
            ? 'Upgrade to Starter (PKR 999/month) for 1,000 words' 
            : userTier === 'starter'
            ? 'Upgrade to Pro (PKR 2,499/month) for 2,500 words'
            : null
        },
        { status: 400 }
      )
    }

    console.log(`[AI Humanizer] Processing ${wordCount} words for ${userTier} user (${userEmail || 'anonymous'})`)

    const completion = await openai.chat.completions.create({
      model: tierLimits.model,
      messages: [
        {
          role: "system",
          content: HUMANIZATION_SYSTEM_PROMPT
        },
        {
          role: "user",
          content: `Rewrite this text following ALL the rules above:\n\n${text}`
        }
      ],
      temperature: 0.9, // Higher creativity for more human-like output
      max_tokens: Math.ceil(wordCount * 2.5),
      presence_penalty: 0.6,
      frequency_penalty: 0.3,
    })

    const humanizedText = completion.choices[0].message.content

    if (!humanizedText) {
      throw new Error('No response from OpenAI')
    }

    const tokensUsed = completion.usage?.total_tokens || 0
    const estimatedCost = (tokensUsed / 1000000) * 12.50 // gpt-4o average cost

    console.log(`[AI Humanizer] Success! Tokens: ${tokensUsed}, Cost: $${estimatedCost.toFixed(4)}`)

    return NextResponse.json({
      success: true,
      humanizedText,
      tier: userTier,
      model: tierLimits.model,
      tokensUsed,
      wordCount,
      estimatedCost: estimatedCost.toFixed(4)
    })

  } catch (error) {
    console.error('AI humanization error:', error)
    
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase()
      
      if (errorMessage.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again in a moment.' },
          { status: 429 }
        )
      }

      if (errorMessage.includes('authentication') || errorMessage.includes('api key')) {
        return NextResponse.json(
          { error: 'API authentication failed. Please contact support.' },
          { status: 500 }
        )
      }

      if (errorMessage.includes('quota') || errorMessage.includes('insufficient')) {
        return NextResponse.json(
          { error: 'API quota exceeded. Please try again later or contact support.' },
          { status: 503 }
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