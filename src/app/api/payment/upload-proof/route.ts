import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// Initialize Supabase client for storage
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface PaymentSubmission {
  payment_reference: string
  user_email: string
  transaction_id: string | null
  notes: string | null
  filename: string
  file_url: string
  file_size: number
  file_type: string
  submitted_at: string
  status: 'pending_verification' | 'verified' | 'rejected'
  verified_at: string | null
  verified_by: string | null
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('proof') as File | null
    const paymentReference = formData.get('payment_reference') as string | null
    const userEmail = formData.get('user_email') as string | null
    const transactionId = formData.get('transaction_id') as string | null
    const notes = formData.get('notes') as string | null

    // Validation
    if (!file || !paymentReference || !userEmail) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        required: ['proof (file)', 'payment_reference', 'user_email']
      }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload JPG, PNG, WEBP, or PDF files only.',
        received_type: file.type
      }, { status: 400 })
    }

    // Validate file size (4MB max)
    const maxSize = 4 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 4MB.',
        file_size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        max_size: '4MB',
        hint: 'Please compress your image or take a smaller screenshot'
      }, { status: 413 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop() || 'jpg'
    const filename = `${paymentReference}-${timestamp}.${extension}`

    console.log(`📤 Uploading: ${filename} (${(file.size / 1024).toFixed(2)} KB)`)

    // Convert File to ArrayBuffer for Supabase ✅
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Upload to Supabase Storage ✅
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('payment-proofs')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('❌ Supabase upload error:', uploadError)
      throw new Error(`Storage upload failed: ${uploadError.message}`)
    }

    // Get public URL ✅
    const { data: urlData } = supabase.storage
      .from('payment-proofs')
      .getPublicUrl(filename)

    const fileUrl = urlData.publicUrl

    console.log(`✅ Uploaded to Supabase Storage: ${fileUrl}`)

    // Create submission record
    const submissionData: PaymentSubmission = {
      payment_reference: paymentReference,
      user_email: userEmail,
      transaction_id: transactionId,
      notes: notes,
      filename: filename,
      file_url: fileUrl,  // ✅ Supabase public URL
      file_size: file.size,
      file_type: file.type,
      submitted_at: new Date().toISOString(),
      status: 'pending_verification',
      verified_at: null,
      verified_by: null
    }

    // Save to JSON file (for tracking)
    await saveSubmissionToFile(submissionData)

    // Log for admin notification
    console.log('')
    console.log('📧 [NEW PAYMENT PROOF SUBMITTED]')
    console.log('================================')
    console.log(`Reference: ${paymentReference}`)
    console.log(`User: ${userEmail}`)
    console.log(`Transaction ID: ${transactionId || 'Not provided'}`)
    console.log(`File: ${filename}`)
    console.log(`File Size: ${(file.size / 1024).toFixed(2)} KB`)
    console.log(`Notes: ${notes || 'None'}`)
    console.log(`Time: ${new Date().toLocaleString()}`)
    console.log(`View file: ${fileUrl}`)
    console.log('================================')
    console.log('')

    return NextResponse.json({
      success: true,
      message: 'Payment proof uploaded successfully',
      reference: paymentReference,
      filename: filename,
      file_url: fileUrl,  // ✅ Return Supabase URL
      next_steps: [
        '✅ Your payment proof has been submitted',
        '⏳ We will verify your payment within 2-4 hours',
        '📧 You will receive an email confirmation once verified',
        '🎉 Your subscription will be activated automatically'
      ]
    })

  } catch (error) {
    console.error('❌ [Proof Upload Error]:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      {
        error: 'Upload failed',
        details: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error',
        hint: 'Please try again or contact support if the issue persists'
      },
      { status: 500 }
    )
  }
}

async function saveSubmissionToFile(submissionData: PaymentSubmission): Promise<void> {
  try {
    // In production (Vercel), use /tmp directory
    const isProduction = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production'
    const dataDir = isProduction ? '/tmp' : join(process.cwd(), 'data')
    const submissionsFile = join(dataDir, 'payment-submissions.json')
    
    // Create data directory if it doesn't exist (only works locally)
    if (!isProduction && !existsSync(dataDir)) {
      await mkdir(dataDir, { recursive: true })
    }

    // Read existing submissions
    let submissions: PaymentSubmission[] = []
    
    if (existsSync(submissionsFile)) {
      try {
        const existingData = await readFile(submissionsFile, 'utf8')
        submissions = JSON.parse(existingData) as PaymentSubmission[]
      } catch (parseError) {
        console.warn('⚠️ Could not parse existing submissions, starting fresh')
        submissions = []
      }
    }

    // Add new submission
    submissions.push(submissionData)

    // Save updated submissions
    await writeFile(submissionsFile, JSON.stringify(submissions, null, 2), 'utf8')
    
    console.log(`💾 Submission saved to: ${submissionsFile}`)
    console.log(`📊 Total submissions: ${submissions.length}`)
  } catch (error) {
    console.error('❌ Error saving submission to file:', error)
    // Don't throw - upload succeeded even if JSON logging failed
  }
}