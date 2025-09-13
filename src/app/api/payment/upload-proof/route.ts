// src/app/api/payment/upload-proof/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('proof') as File
    const paymentReference = formData.get('payment_reference') as string
    const userEmail = formData.get('user_email') as string
    const transactionId = formData.get('transaction_id') as string
    const notes = formData.get('notes') as string

    if (!file || !paymentReference || !userEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload JPG, PNG, WEBP, or PDF files only.' 
      }, { status: 400 })
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 5MB.' 
      }, { status: 400 })
    }

    // Create upload directory
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'payment-proofs')
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const filename = `${paymentReference}-${timestamp}.${extension}`
    const filepath = join(uploadDir, filename)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Create submission record (save to JSON file for now)
    const submissionData = {
      payment_reference: paymentReference,
      user_email: userEmail,
      transaction_id: transactionId || null,
      notes: notes || null,
      filename: filename,
      file_path: filepath,
      file_size: file.size,
      file_type: file.type,
      submitted_at: new Date().toISOString(),
      status: 'pending_verification',
      verified_at: null,
      verified_by: null
    }

    // Save to JSON file (simple storage for now)
    await saveSubmissionToFile(submissionData)

    // Send email notification to admin
    console.log('📧 EMAIL NOTIFICATION:')
    console.log('=================================')
    console.log(`New payment proof submitted!`)
    console.log(`Reference: ${paymentReference}`)
    console.log(`User: ${userEmail}`)
    console.log(`Transaction ID: ${transactionId || 'Not provided'}`)
    console.log(`File: ${filename}`)
    console.log(`Notes: ${notes || 'None'}`)
    console.log(`Check: public/uploads/payment-proofs/${filename}`)
    console.log('=================================')

    return NextResponse.json({
      success: true,
      message: 'Payment proof uploaded successfully',
      reference: paymentReference,
      filename: filename,
      file_url: `/uploads/payment-proofs/${filename}`,
      next_steps: [
        'Your payment proof has been submitted',
        'We will verify your payment within 24 hours',
        'You will receive an email confirmation once verified',
        'Your subscription will be activated automatically'
      ]
    })

  } catch (error: any) {
    console.error('Proof upload error:', error)
    return NextResponse.json(
      {
        error: 'Upload failed',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}

async function saveSubmissionToFile(submissionData: any) {
  try {
    const submissionsDir = join(process.cwd(), 'data')
    const submissionsFile = join(submissionsDir, 'payment-submissions.json')
    
    // Create data directory
    try {
      await mkdir(submissionsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    // Read existing submissions
    let submissions = []
    try {
      const existingData = await require('fs/promises').readFile(submissionsFile, 'utf8')
      submissions = JSON.parse(existingData)
    } catch (error) {
      // File doesn't exist yet, start with empty array
    }

    // Add new submission
    submissions.push(submissionData)

    // Save updated submissions
    await writeFile(submissionsFile, JSON.stringify(submissions, null, 2))
    
    console.log(`💾 Submission saved to: ${submissionsFile}`)
  } catch (error) {
    console.error('Error saving submission:', error)
  }
}