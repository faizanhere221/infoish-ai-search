import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

interface PaymentSubmission {
  payment_reference: string
  user_email: string
  transaction_id: string | null
  notes: string | null
  filename: string
  file_path: string
  file_size: number
  file_type: string
  submitted_at: string
  status: string
  verified_at: string | null
  verified_by: string | null
}

export async function GET(request: NextRequest) {
  try {
    // Get token from header OR query parameter
    const authHeader = request.headers.get('authorization')
    const { searchParams } = new URL(request.url)
    const queryToken = searchParams.get('token')
    
    // Get expected token from environment
    const adminToken = process.env.ADMIN_TOKEN || 'infoishai-admin-secret-2025-change-this-in-production'
    
    // Get provided token
    const providedToken = authHeader?.replace('Bearer ', '') || queryToken
    
    // DEBUG LOGGING ✅
    console.log('=====================================')
    console.log('🔐 Admin Token Check:')
    console.log('=====================================')
    console.log('Expected token:', adminToken)
    console.log('Expected length:', adminToken.length)
    console.log('-------------------------------------')
    console.log('Provided token:', providedToken)
    console.log('Provided length:', providedToken?.length || 0)
    console.log('-------------------------------------')
    console.log('Tokens match:', providedToken === adminToken)
    console.log('From query param:', !!queryToken)
    console.log('From auth header:', !!authHeader)
    console.log('=====================================')
    
    // Check if tokens match
    if (providedToken !== adminToken) {
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          hint: 'Token mismatch',
          debug: process.env.NODE_ENV === 'development' ? {
            expected_token_start: adminToken.substring(0, 10) + '...',
            provided_token_start: providedToken?.substring(0, 10) + '...',
            expected_length: adminToken.length,
            provided_length: providedToken?.length || 0,
            tokens_match: providedToken === adminToken
          } : undefined
        },
        { status: 401 }
      )
    }

    const dataDir = join(process.cwd(), 'data')
    const submissionsFile = join(dataDir, 'payment-submissions.json')
    
    if (!existsSync(submissionsFile)) {
      return NextResponse.json({
        success: true,
        submissions: [],
        total: 0,
        pending: 0,
        verified: 0,
        rejected: 0,
        message: 'No submissions yet'
      })
    }

    const data = await readFile(submissionsFile, 'utf8')
    const submissions = JSON.parse(data) as PaymentSubmission[]
    
    // Sort by most recent first
    submissions.sort((a, b) => 
      new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
    )

    console.log('✅ Auth successful! Returning', submissions.length, 'submissions')

    return NextResponse.json({
      success: true,
      submissions,
      total: submissions.length,
      pending: submissions.filter(s => s.status === 'pending_verification').length,
      verified: submissions.filter(s => s.status === 'verified').length,
      rejected: submissions.filter(s => s.status === 'rejected').length
    })

  } catch (error) {
    console.error('❌ Error in submissions API:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch submissions',
        details: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error'
      },
      { status: 500 }
    )
  }
}