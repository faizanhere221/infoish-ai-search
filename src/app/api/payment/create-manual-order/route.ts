import { NextRequest, NextResponse } from 'next/server'

const PLANS = {
  starter: {
    name: 'Starter Plan',
    description: '30 Searches Per Month, Unlimited Results, Advanced Filters',
    monthly_price: 2999,
    yearly_price: 29990,
  },
  pro: {
    name: 'Pro Plan', 
    description: 'Unlimited Searches, Unilimited Results, Advanced Filters, Priority Support',
    monthly_price: 6999,
    yearly_price: 69990,
  }
}

function generatePaymentReference(): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
  return `AI-INF-${timestamp}-${random}`
}

export async function POST(request: NextRequest) {
  try {
    const { plan, billing_cycle, user_email, user_name } = await request.json()

    if (!plan || !PLANS[plan as keyof typeof PLANS]) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 })
    }

    if (plan === 'free') {
      return NextResponse.json({ error: 'Free plan does not require payment' }, { status: 400 })
    }

    const selectedPlan = PLANS[plan as keyof typeof PLANS]
    const isYearly = billing_cycle === 'yearly'
    const amount = isYearly ? selectedPlan.yearly_price : selectedPlan.monthly_price
    const paymentReference = generatePaymentReference()

    return NextResponse.json({
      success: true,
      payment_reference: paymentReference,
      amount: amount,
      currency: 'PKR',
      plan_details: {
        name: selectedPlan.name,
        description: selectedPlan.description,
        billing_cycle: billing_cycle
      },
      bank_details: {
        account_title: process.env.BANK_ACCOUNT_TITLE || "Faizan Islam",
        account_number: process.env.BANK_ACCOUNT_NUMBER || "14860010141071090013",
        bank_name: process.env.BANK_NAME || "Allied Bank",
        iban: process.env.BANK_IBAN || "PK69ABPA0010141071090013",
        branch_code: process.env.BANK_BRANCH_CODE || "1486"
      },
      instructions: [
        `Transfer PKR ${amount.toLocaleString()} to the above account`,
        `Use reference: ${paymentReference}`,
        `Upload payment proof below`,
        `Your subscription will be activated within 24 hours after verification`
      ],
      expires_in_days: 7
    })

  } catch (error: any) {
    console.error('Manual payment creation error:', error)
    return NextResponse.json(
      {
        error: 'Payment order creation failed',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}