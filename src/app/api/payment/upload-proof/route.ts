import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client for storage
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface PaymentSubmission {
  payment_reference: string
  user_email: string
  transaction_id?: string
  notes?: string
  filename: string
  file_url: string
  file_size: number
  file_type: string
  product?: string
  plan?: string
  amount?: number
  status: string
  submitted_at: string
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

    // Convert File to ArrayBuffer for Supabase
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

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('payment-proofs')
      .getPublicUrl(filename)

    const fileUrl = urlData.publicUrl

    console.log(`✅ Uploaded to Supabase Storage: ${fileUrl}`)

    // Extract product info from payment reference
    const product = paymentReference.startsWith('HUM-') ? 'AI Humanizer' : 'InfoIshai Search'
    
    // Save to database ✅
    const { data: dbData, error: dbError } = await supabase
      .from('payment_submissions')
      .insert({
        payment_reference: paymentReference,
        user_email: userEmail,
        transaction_id: transactionId,
        notes: notes,
        filename: filename,
        file_url: fileUrl,
        file_size: file.size,
        file_type: file.type,
        product: product,
        status: 'pending_verification',
        submitted_at: new Date().toISOString()
      })
      .select()
      .single()

    if (dbError) {
      console.error('❌ Database insert error:', dbError)
      // Don't fail - file was uploaded successfully
      console.warn('File uploaded but database insert failed')
    } else {
      console.log('✅ Saved to database:', dbData)
    }

    // Log for admin notification
    console.log('')
    console.log('📧 [NEW PAYMENT PROOF SUBMITTED]')
    console.log('================================')
    console.log(`Reference: ${paymentReference}`)
    console.log(`Product: ${product}`)
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
      file_url: fileUrl,
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