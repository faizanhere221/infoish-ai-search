import { NextRequest, NextResponse } from 'next/server'

// Define proper types ✅
type PlanType = 'starter' | 'pro'
type BillingCycle = 'monthly' | 'yearly'
type ProductType = 'infoishai' | 'ai_humanizer'

interface PlanDetails {
  name: string
  description: string
  monthly_price: number
  yearly_price: number
}

interface CreateOrderRequest {
  plan: PlanType
  billing_cycle: BillingCycle
  product: ProductType
  user_email: string
  user_name: string
}

interface BankDetails {
  account_title: string
  account_number: string
  bank_name: string
  iban: string
  branch_code: string
}

interface PaymentOrderResponse {
  success: boolean
  payment_reference: string
  amount: number
  currency: string
  product: string
  plan_details: {
    name: string
    description: string
    billing_cycle: BillingCycle
  }
  bank_details: BankDetails
  instructions: string[]
  expires_in_days: number
}

// Plans for each product
const INFOISHAI_PLANS: Record<PlanType, PlanDetails> = {
  starter: {
    name: 'InfoIshai Starter',
    description: '30 Searches Per Month, Unlimited Results, Advanced Filters',
    monthly_price: 2999,
    yearly_price: 29990,
  },
  pro: {
    name: 'InfoIshai Pro', 
    description: 'Unlimited Searches, Unlimited Results, Advanced Filters, Priority Support',
    monthly_price: 6999,
    yearly_price: 69990,
  }
}

const HUMANIZER_PLANS: Record<PlanType, PlanDetails> = {
  starter: {
    name: 'AI Humanizer Starter',
    description: '50 Humanizations/Month, 1,000 Words, GPT-4o Model',
    monthly_price: 999,
    yearly_price: 9990,
  },
  pro: {
    name: 'AI Humanizer Pro', 
    description: '150 Humanizations/Month, 3,000 Words, API Access',
    monthly_price: 2999,
    yearly_price: 29990,
  }
}

function generatePaymentReference(product: ProductType): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  const productPrefix = product === 'ai_humanizer' ? 'HUM' : 'INF'
  return `${productPrefix}-${timestamp}-${random}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CreateOrderRequest
    const { plan, billing_cycle, product, user_email, user_name } = body

    // Validation
    if (!plan || !billing_cycle || !product || !user_email) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        required: ['plan', 'billing_cycle', 'product', 'user_email']
      }, { status: 400 })
    }

    // Get the right plan set based on product
    const PLANS = product === 'ai_humanizer' ? HUMANIZER_PLANS : INFOISHAI_PLANS

    if (!PLANS[plan]) {
      return NextResponse.json({ 
        error: 'Invalid plan selected',
        available_plans: Object.keys(PLANS)
      }, { status: 400 })
    }

    const selectedPlan = PLANS[plan]
    const isYearly = billing_cycle === 'yearly'
    const amount = isYearly ? selectedPlan.yearly_price : selectedPlan.monthly_price
    const paymentReference = generatePaymentReference(product)

    // Get bank details from env
    const bankDetails: BankDetails = {
      account_title: process.env.BANK_ACCOUNT_TITLE || "Faizan Islam",
      account_number: process.env.BANK_ACCOUNT_NUMBER || "14860010141071090013",
      bank_name: process.env.BANK_NAME || "Allied Bank",
      iban: process.env.BANK_IBAN || "PK69ABPA0010141071090013",
      branch_code: process.env.BANK_BRANCH_CODE || "1486"
    }

    const response: PaymentOrderResponse = {
      success: true,
      payment_reference: paymentReference,
      amount,
      currency: 'PKR',
      product: product === 'ai_humanizer' ? 'AI Humanizer' : 'InfoIshai Search',
      plan_details: {
        name: selectedPlan.name,
        description: selectedPlan.description,
        billing_cycle
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

    // Log for admin tracking
    console.log('💰 [Payment Order Created]')
    console.log('========================')
    console.log(`Reference: ${paymentReference}`)
    console.log(`Product: ${product}`)
    console.log(`Plan: ${plan} (${billing_cycle})`)
    console.log(`Amount: PKR ${amount}`)
    console.log(`User: ${user_name} (${user_email})`)
    console.log(`Created: ${new Date().toISOString()}`)
    console.log('========================')

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ [Payment Order Error]:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      {
        error: 'Payment order creation failed',
        details: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error'
      },
      { status: 500 }
    )
  }
}