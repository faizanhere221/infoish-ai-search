// src/app/api/newsletter/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

interface NewsletterSubscription {
  id: string;
  email: string;
  date: string;
  source: string;
  ip_address: string;
  user_agent: string;
  status: 'active' | 'unsubscribed';
}

export async function POST(request: NextRequest) {
  try {
    const { email, source = 'footer' } = await request.json()

    // Validate email
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Get client info
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Create subscription record
    const subscription: NewsletterSubscription = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: email.toLowerCase().trim(),
      date: new Date().toISOString(),
      source,
      ip_address: ip,
      user_agent: userAgent,
      status: 'active'
    }

    // Check if email already exists
    const existingSubscriptions = await loadSubscriptions()
    const existingSubscription = existingSubscriptions.find(
      sub => sub.email === subscription.email && sub.status === 'active'
    )

    if (existingSubscription) {
      return NextResponse.json({ 
        success: false, 
        message: 'You are already subscribed to our newsletter!' 
      })
    }

    // Save subscription
    await saveSubscription(subscription)

    // Log to console for immediate notification
    console.log('📧 NEW NEWSLETTER SUBSCRIPTION!')
    console.log('='.repeat(50))
    console.log(`📅 Date: ${new Date().toLocaleString()}`)
    console.log(`📧 Email: ${subscription.email}`)
    console.log(`📍 Source: ${subscription.source}`)
    console.log(`🌐 IP: ${subscription.ip_address}`)
    console.log(`🖥️ User Agent: ${subscription.user_agent}`)
    console.log('='.repeat(50))

    // Send confirmation (optional)
    await sendConfirmationNotification(subscription)

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed! Thank you for joining our newsletter.'
    })

  } catch (error: any) {
    console.error('Newsletter subscription error:', error)
    return NextResponse.json(
      {
        error: 'Failed to subscribe to newsletter',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}

async function loadSubscriptions(): Promise<NewsletterSubscription[]> {
  try {
    const dataDir = join(process.cwd(), 'data')
    const subscriptionsFile = join(dataDir, 'newsletter-subscriptions.json')
    
    const data = await require('fs/promises').readFile(subscriptionsFile, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    // File doesn't exist yet, return empty array
    return []
  }
}

async function saveSubscription(subscription: NewsletterSubscription) {
  try {
    const dataDir = join(process.cwd(), 'data')
    const subscriptionsFile = join(dataDir, 'newsletter-subscriptions.json')
    
    // Create data directory if it doesn't exist
    try {
      await mkdir(dataDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    // Load existing subscriptions
    const subscriptions = await loadSubscriptions()

    // Add new subscription at the beginning (newest first)
    subscriptions.unshift(subscription)

    // Keep only last 10,000 subscriptions to prevent file from getting too large
    if (subscriptions.length > 10000) {
      subscriptions.splice(10000)
    }

    // Save updated subscriptions
    await writeFile(subscriptionsFile, JSON.stringify(subscriptions, null, 2))
    
    console.log(`💾 Newsletter subscription saved: ${subscription.email}`)
  } catch (error) {
    console.error('Error saving newsletter subscription:', error)
    throw error
  }
}

async function sendConfirmationNotification(subscription: NewsletterSubscription) {
  try {
    // Log confirmation email content
    const emailContent = `
      📧 NEW NEWSLETTER SUBSCRIPTION
      
      Email: ${subscription.email}
      Source: ${subscription.source}
      Date: ${new Date(subscription.date).toLocaleString()}
      IP: ${subscription.ip_address}
      
      Total subscribers: ${(await loadSubscriptions()).length}
      
      ---
      You can send newsletters to this email address.
      To unsubscribe users, you'll need to implement an unsubscribe system.
    `

    console.log('📧 NEWSLETTER CONFIRMATION:')
    console.log(emailContent)

    // TODO: Send actual email notification to admin
    // You could use the same email service as contact forms
    
  } catch (error) {
    console.error('Error sending confirmation notification:', error)
    // Don't throw error - we don't want to fail the subscription if notification fails
  }
}