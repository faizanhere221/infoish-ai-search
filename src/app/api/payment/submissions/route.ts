import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Get token from header OR query parameter
    const authHeader = request.headers.get('authorization')
    const { searchParams } = new URL(request.url)
    const queryToken = searchParams.get('token')
    
    const adminToken = process.env.ADMIN_TOKEN || 'infoishai-admin-secret-2025-change-this-in-production'
    
    // Check both authorization methods
    const providedToken = authHeader?.replace('Bearer ', '') || queryToken
    
    if (providedToken !== adminToken) {
      return NextResponse.json(
        { error: 'Unauthorized', hint: 'Invalid admin token' },
        { status: 401 }
      )
    }

    // Get all submissions from database ✅
    const { data: submissions, error } = await supabase
      .from('payment_submissions')
      .select('*')
      .order('submitted_at', { ascending: false })

    if (error) {
      console.error('Database query error:', error)
      throw error
    }

    // Calculate stats
    const stats = {
      total: submissions?.length || 0,
      pending: submissions?.filter(s => s.status === 'pending_verification').length || 0,
      verified: submissions?.filter(s => s.status === 'verified').length || 0,
      rejected: submissions?.filter(s => s.status === 'rejected').length || 0
    }

    console.log(`📊 Admin Panel: Fetched ${stats.total} submissions (${stats.pending} pending)`)

    return NextResponse.json({
      success: true,
      submissions: submissions || [],
      ...stats
    })

  } catch (error) {
    console.error('Error fetching submissions:', error)
    
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