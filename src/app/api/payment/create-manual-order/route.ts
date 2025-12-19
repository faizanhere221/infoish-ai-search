import { NextRequest, NextResponse } from 'next/server'

type ProductType = 'infoishai' | 'humanizer'
type PlanType = 'starter' | 'pro'
type BillingCycleType = 'monthly' | 'yearly'

interface PlanPrice {
  monthly: number
  yearly: number
}

interface ProductPricing {
  starter: PlanPrice
  pro: PlanPrice
}

interface RequestBody {
  plan: string
  billing_cycle: string
  product: string
  user_email: string
  user_name?: string
}

// Complete pricing structure
const PRICING: Record<ProductType, ProductPricing> = {
  infoishai: {
    starter: {
      monthly: 2999,
      yearly: 29990
    },
    pro: {
      monthly: 6999,
      yearly: 69990
    }
  },
  humanizer: {
    starter: {
      monthly: 999,
      yearly: 9990
    },
    pro: {
      monthly: 2499,
      yearly: 24990
    }
  }
}

// Plan descriptions
const PLAN_DESCRIPTIONS: Record<ProductType, Record<PlanType, string>> = {
  infoishai: {
    starter: '30 Searches Per Month, Unlimited Results, Advanced Filters',
    pro: 'Unlimited Searches, Complete Database Access, Priority Support'
  },
  humanizer: {
    starter: '50 AI Humanizations Per Month, 1000 Words Per Use, GPT-4o Model',
    pro: '150 AI Humanizations Per Month, 2500 Words Per Use, API Access'
  }
}

// Plan names
const PLAN_NAMES: Record<ProductType, Record<PlanType, string>> = {
  infoishai: {
    starter: 'InfoIshai Starter',
    pro: 'InfoIshai Pro'
  },
  humanizer: {
    starter: 'AI Humanizer Starter',
    pro: 'AI Humanizer Pro'
  }
}

// Product display names
const PRODUCT_NAMES: Record<ProductType, string> = {
  infoishai: 'InfoIshai Search',
  humanizer: 'AI Humanizer'
}

function isValidProduct(product: string): product is ProductType {
  return product === 'infoishai' || product === 'humanizer'
}

function isValidPlan(plan: string): plan is PlanType {
  return plan === 'starter' || plan === 'pro'
}

function isValidBillingCycle(cycle: string): cycle is BillingCycleType {
  return cycle === 'monthly' || cycle === 'yearly'
}

function generatePaymentReference(product: ProductType): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
  const productPrefix = product === 'humanizer' ? 'HUM' : 'INF'
  return `${productPrefix}-${timestamp}-${random}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as RequestBody
    const { plan, billing_cycle, product, user_email, user_name } = body

    console.log('📝 Payment order request:', {
      plan,
      billing_cycle,
      product,
      user_email
    })

    // Validation
    if (!plan || !billing_cycle || !product || !user_email) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          required: ['plan', 'billing_cycle', 'product', 'user_email']
        },
        { status: 400 }
      )
    }

    // Validate and type-guard product
    if (!isValidProduct(product)) {
      return NextResponse.json(
        { error: 'Invalid product. Must be "infoishai" or "humanizer"' },
        { status: 400 }
      )
    }

    // Validate and type-guard plan
    if (!isValidPlan(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be "starter" or "pro"' },
        { status: 400 }
      )
    }

    // Validate and type-guard billing cycle
    if (!isValidBillingCycle(billing_cycle)) {
      return NextResponse.json(
        { error: 'Invalid billing cycle. Must be "monthly" or "yearly"' },
        { status: 400 }
      )
    }

    // Now TypeScript knows these are the correct types
    const amount = PRICING[product][plan][billing_cycle]
    const planName = PLAN_NAMES[product][plan]
    const planDescription = PLAN_DESCRIPTIONS[product][plan]
    const productName = PRODUCT_NAMES[product]

    // Generate payment reference
    const paymentReference = generatePaymentReference(product)

    // Bank details
    const bankDetails = {
      account_title: process.env.BANK_ACCOUNT_TITLE || 'Faizan Islam',
      account_number: process.env.BANK_ACCOUNT_NUMBER || '14860010141071090013',
      bank_name: process.env.BANK_NAME || 'Allied Bank',
      iban: process.env.BANK_IBAN || 'PK69ABPA0010141071090013',
      branch_code: process.env.BANK_BRANCH_CODE || '1486'
    }

    const paymentData = {
      success: true,
      payment_reference: paymentReference,
      amount: amount,
      currency: 'PKR',
      product: productName,
      product_slug: product,
      plan: plan,
      plan_details: {
        name: planName,
        description: planDescription,
        billing_cycle: billing_cycle
      },
      bank_details: bankDetails,
      instructions: [
        `Transfer PKR ${amount.toLocaleString()} to the above account`,
        `IMPORTANT: Include reference "${paymentReference}" in transfer notes`,
        `Take a screenshot of successful transfer`,
        `Upload payment proof on next screen`,
        `Subscription activates within 2-4 hours after verification`
      ],
      expires_in_days: 7
    }

    console.log('✅ Payment order created:', {
      reference: paymentReference,
      product: productName,
      plan: planName,
      amount: amount,
      billing_cycle: billing_cycle
    })

    return NextResponse.json(paymentData)

  } catch (error) {
    console.error('❌ Payment order error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        error: 'Failed to create payment order',
        details: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error'
      },
      { status: 500 }
    )
  }
}