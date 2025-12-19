import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ContactFormData {
  name: string
  email: string
  company?: string
  subject: string
  message: string
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json() as ContactFormData
    const { name, email, company, subject, message } = formData

    // Validate required fields
    if (!name || !email || !message || !subject) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate message length
    if (message.length < 10) {
      return NextResponse.json(
        { error: 'Message must be at least 10 characters' },
        { status: 400 }
      )
    }

    if (message.length > 5000) {
      return NextResponse.json(
        { error: 'Message too long (max 5000 characters)' },
        { status: 400 }
      )
    }

    // Save to Supabase ✅
    const { data, error } = await supabase
      .from('contact_submissions')
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        company: company?.trim() || null,
        subject: subject.trim(),
        message: message.trim(),
        status: 'new',
        submitted_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Supabase insert error:', error)
      throw new Error(`Database error: ${error.message}`)
    }

    // Log to console for immediate notification
    console.log('')
    console.log('📧 [NEW CONTACT FORM SUBMISSION]')
    console.log('='.repeat(50))
    console.log(`📅 Time: ${new Date().toLocaleString()}`)
    console.log(`👤 Name: ${name}`)
    console.log(`📧 Email: ${email}`)
    console.log(`🏢 Company: ${company || 'Not provided'}`)
    console.log(`📝 Subject: ${subject}`)
    console.log(`💬 Message: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`)
    console.log(`🆔 ID: ${data.id}`)
    console.log('='.repeat(50))
    console.log('')

    // Optional: Send email notification
    // await sendEmailNotification(data)

    return NextResponse.json({
      success: true,
      message: 'Contact form submitted successfully',
      id: data.id
    })

  } catch (error) {
    console.error('❌ Contact form submission error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      {
        error: 'Failed to submit contact form',
        details: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error'
      },
      { status: 500 }
    )
  }
}