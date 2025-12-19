import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { email, source = 'footer' } = await request.json()

    // Validate email
    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Get client info
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Check if already subscribed
    const { data: existing, error: checkError } = await supabase
      .from('newsletter_subscriptions')
      .select('id, email, status')
      .eq('email', normalizedEmail)
      .single()

    if (existing) {
      if (existing.status === 'active') {
        return NextResponse.json({
          success: true,
          message: 'You are already subscribed to our newsletter!'
        })
      } else {
        // Reactivate subscription
        const { error: updateError } = await supabase
          .from('newsletter_subscriptions')
          .update({
            status: 'active',
            unsubscribed_at: null,
            updated_at: new Date().toISOString()
          })
          .eq('email', normalizedEmail)

        if (updateError) throw updateError

        console.log(`✅ Reactivated newsletter subscription: ${normalizedEmail}`)

        return NextResponse.json({
          success: true,
          message: 'Welcome back! Your subscription has been reactivated.'
        })
      }
    }

    // Create new subscription
    const { data, error } = await supabase
      .from('newsletter_subscriptions')
      .insert({
        email: normalizedEmail,
        source: source,
        ip_address: ipAddress,
        user_agent: userAgent,
        status: 'active',
        subscribed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Newsletter subscription error:', error)
      throw error
    }

    // Log success
    console.log('')
    console.log('📧 [NEW NEWSLETTER SUBSCRIPTION]')
    console.log('='.repeat(50))
    console.log(`📧 Email: ${normalizedEmail}`)
    console.log(`📍 Source: ${source}`)
    console.log(`🌐 IP: ${ipAddress}`)
    console.log(`📅 Time: ${new Date().toLocaleString()}`)
    console.log(`🆔 ID: ${data.id}`)
    console.log('='.repeat(50))
    console.log('')

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed! Thank you for joining our newsletter.'
    })

  } catch (error) {
    console.error('Newsletter subscription error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to subscribe. Please try again.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}