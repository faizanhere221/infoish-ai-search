export type UserTier = 'free' | 'starter' | 'pro' | 'premium'

export interface TierConfig {
  limit: number
  limitType: 'daily' | 'monthly'
  wordLimit?: number
  price?: { monthly: number; yearly: number }
  features: string[]
}

export interface ProductConfig {
  slug: string
  name: string
  tiers: {
    free: TierConfig
    starter: TierConfig
    pro: TierConfig
    premium?: TierConfig  // Make premium optional ✅
  }
}

export const PRODUCTS: Record<string, ProductConfig> = {
  infoishai_search: {
    slug: 'infoishai_search',
    name: 'InfoIshai Search',
    tiers: {
      free: {
        limit: 10,
        limitType: 'monthly',
        features: ['10 searches/month', '5 results per search', 'Basic filters']
      },
      starter: {
        limit: 30,
        limitType: 'monthly',
        price: { monthly: 2999, yearly: 29990 },
        features: ['30 searches/month', 'Unlimited results', 'Export CSV']
      },
      pro: {
        limit: -1, // Unlimited
        limitType: 'monthly',
        price: { monthly: 6999, yearly: 69990 },
        features: ['Unlimited searches', 'Advanced analytics', 'API access']
      },
      premium: {  // Add premium tier ✅
        limit: -1,
        limitType: 'monthly',
        price: { monthly: 6999, yearly: 69990 },
        features: ['Unlimited searches', 'Advanced analytics', 'API access']
      }
    }
  },
  
  ai_humanizer: {
    slug: 'ai_humanizer',
    name: 'AI Humanizer',
    tiers: {
      free: {
        limit: 2,
        limitType: 'daily',
        wordLimit: 300,
        features: ['2 humanizations/day', '300 words', 'GPT-4o']
      },
      starter: {
        limit: 50,
        limitType: 'monthly',
        wordLimit: 1000,
        price: { monthly: 999, yearly: 9990 },
        features: ['50 humanizations/month', '1,000 words', 'GPT-4o']
      },
      pro: {
        limit: 150,
        limitType: 'monthly',
        wordLimit: 3000,
        price: { monthly: 2999, yearly: 29990 },
        features: ['150 humanizations/month', '3,000 words', 'API access']
      },
      premium: {  // Add premium tier (same as pro) ✅
        limit: 150,
        limitType: 'monthly',
        wordLimit: 3000,
        price: { monthly: 2999, yearly: 29990 },
        features: ['150 humanizations/month', '3,000 words', 'API access']
      }
    }
  },

  // FUTURE TOOL EXAMPLE
  bio_generator: {
    slug: 'bio_generator',
    name: 'Instagram Bio Generator',
    tiers: {
      free: {
        limit: 5,
        limitType: 'daily',
        features: ['5 generations/day', 'Basic templates']
      },
      starter: {
        limit: 100,
        limitType: 'monthly',
        price: { monthly: 499, yearly: 4990 },
        features: ['100 generations/month', 'Premium templates', 'Emoji support']
      },
      pro: {
        limit: 500,
        limitType: 'monthly',
        price: { monthly: 999, yearly: 9990 },
        features: ['500 generations/month', 'Custom AI training', 'API access']
      },
      premium: {  // Add premium tier ✅
        limit: 500,
        limitType: 'monthly',
        price: { monthly: 999, yearly: 9990 },
        features: ['500 generations/month', 'Custom AI training', 'API access']
      }
    }
  }
}

// Helper function with proper typing ✅
export function getProductConfig(productSlug: string): ProductConfig | null {
  return PRODUCTS[productSlug] || null
}

// Helper function with tier fallback ✅
export function getUserTierForProduct(
  toolSubscriptions: Record<string, string>, 
  productSlug: string
): UserTier {
  const tier = (toolSubscriptions[productSlug] || 'free').toLowerCase()
  
  // Validate tier
  const validTiers: UserTier[] = ['free', 'starter', 'pro', 'premium']
  if (validTiers.includes(tier as UserTier)) {
    return tier as UserTier
  }
  
  return 'free'
}

// NEW: Safe tier config getter ✅
export function getTierConfig(
  productSlug: string, 
  tier: UserTier
): TierConfig | null {
  const product = PRODUCTS[productSlug]
  if (!product) return null
  
  // Fallback premium to pro if premium doesn't exist
  if (tier === 'premium' && !product.tiers.premium) {
    return product.tiers.pro
  }
  
  return product.tiers[tier] || null
}