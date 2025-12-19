import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Verify admin token
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const adminToken = process.env.ADMIN_TOKEN
    
    if (token !== adminToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all submissions from database
    const { data: submissions, error } = await supabase
      .from('contact_submissions')
      .select('*')
      .order('submitted_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      submissions: submissions || [],
      total: submissions?.length || 0
    })

  } catch (error) {
    console.error('Error fetching contact submissions:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { error: 'Failed to fetch submissions', details: errorMessage },
      { status: 500 }
    )
  }
}