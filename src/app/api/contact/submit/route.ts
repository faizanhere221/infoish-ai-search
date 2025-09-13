// src/app/api/contact/submit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

interface ContactFormData {
  name: string;
  email: string;
  company: string;
  subject: string;
  message: string;
  submitted_at: string;
  id: string;
  status: 'new' | 'read' | 'replied';
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json()
    const { name, email, company, subject, message } = formData

    // Validate required fields
    if (!name || !email || !message || !subject) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Create contact submission record
    const contactSubmission: ContactFormData = {
      id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      email,
      company: company || '',
      subject,
      message,
      submitted_at: new Date().toISOString(),
      status: 'new'
    }

    // Save to JSON file (simple storage)
    await saveContactSubmission(contactSubmission)

    // Log to console for immediate notification
    console.log('📧 NEW CONTACT FORM SUBMISSION!')
    console.log('='.repeat(50))
    console.log(`📅 Time: ${new Date().toLocaleString()}`)
    console.log(`👤 Name: ${name}`)
    console.log(`📧 Email: ${email}`)
    console.log(`🏢 Company: ${company || 'Not provided'}`)
    console.log(`📝 Subject: ${subject}`)
    console.log(`💬 Message: ${message}`)
    console.log('='.repeat(50))

    // Send email notification (you can implement this)
    await sendEmailNotification(contactSubmission)

    return NextResponse.json({
      success: true,
      message: 'Contact form submitted successfully',
      id: contactSubmission.id
    })

  } catch (error: any) {
    console.error('Contact form submission error:', error)
    return NextResponse.json(
      {
        error: 'Failed to submit contact form',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}

async function saveContactSubmission(submission: ContactFormData) {
  try {
    const dataDir = join(process.cwd(), 'data')
    const contactsFile = join(dataDir, 'contact-submissions.json')
    
    // Create data directory if it doesn't exist
    try {
      await mkdir(dataDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    // Read existing submissions
    let submissions: ContactFormData[] = []
    try {
      const existingData = await require('fs/promises').readFile(contactsFile, 'utf8')
      submissions = JSON.parse(existingData)
    } catch (error) {
      // File doesn't exist yet, start with empty array
    }

    // Add new submission at the beginning (newest first)
    submissions.unshift(submission)

    // Keep only last 1000 submissions to prevent file from getting too large
    if (submissions.length > 1000) {
      submissions = submissions.slice(0, 1000)
    }

    // Save updated submissions
    await writeFile(contactsFile, JSON.stringify(submissions, null, 2))
    
    console.log(`💾 Contact submission saved: ${submission.id}`)
  } catch (error) {
    console.error('Error saving contact submission:', error)
    throw error
  }
}

async function sendEmailNotification(submission: ContactFormData) {
  try {
    // This is where you would integrate with an email service
    // For now, we'll just log the email content
    
    const emailContent = `
      📧 NEW CONTACT FORM SUBMISSION
      
      From: ${submission.name} <${submission.email}>
      Company: ${submission.company || 'Not provided'}
      Subject: ${submission.subject}
      
      Message:
      ${submission.message}
      
      ---
      Submitted: ${new Date(submission.submitted_at).toLocaleString()}
      ID: ${submission.id}
    `

    console.log('📧 EMAIL NOTIFICATION CONTENT:')
    console.log(emailContent)

    // TODO: Implement actual email sending
    // You could use services like:
    // - Nodemailer with Gmail
    // - SendGrid
    // - AWS SES
    // - Resend
    // - EmailJS
    
    /*
    // Example with Nodemailer (you'd need to install and configure):
    const nodemailer = require('nodemailer')
    
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    })

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: 'infoishfounder@gmail.com',
      subject: `New Contact Form: ${submission.subject}`,
      text: emailContent,
      html: emailContent.replace(/\n/g, '<br>')
    })
    */

  } catch (error) {
    console.error('Error sending email notification:', error)
    // Don't throw error - we don't want to fail the form submission if email fails
  }
}