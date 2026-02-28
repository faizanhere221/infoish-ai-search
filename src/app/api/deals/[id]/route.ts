import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'

interface RouteParams {
  params: { id: string }
}

// GET /api/deals/[id] - Get single deal
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params
    const supabase = createServerSupabase()
    
    const { data: deal, error } = await supabase
      .from('deals')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error || !deal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      )
    }
    
    // Fetch related profiles
    const [{ data: creator }, { data: brand }, { data: review }] = await Promise.all([
      supabase.from('creator_profiles').select('*').eq('id', deal.creator_id).single(),
      supabase.from('brand_profiles').select('*').eq('id', deal.brand_id).single(),
      supabase.from('reviews').select('*').eq('deal_id', deal.id).single(),
    ])
    
    return NextResponse.json({
      deal: {
        ...deal,
        creator,
        brand,
        review,
      },
    })
    
  } catch (error) {
    console.error('Error fetching deal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/deals/[id] - Update deal
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params
    const body = await request.json()
    
    const supabase = createServerSupabase()
    
    // Get current deal
    const { data: currentDeal } = await supabase
      .from('deals')
      .select('*')
      .eq('id', id)
      .single()
    
    if (!currentDeal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      )
    }
    
    // Build update object
    interface DeliverableItem {
      id: string
      description: string
      is_completed: boolean
      completed_at?: string
    }
    
    type UpdatesType = {
      title?: string
      description?: string | null
      deliverables?: DeliverableItem[]
      deadline?: string | null
      updated_at: string
    }
    
    const updates: UpdatesType = {
      updated_at: new Date().toISOString(),
    }
    
    // Safely assign allowed fields
    if (body.title !== undefined) updates.title = body.title
    if (body.description !== undefined) updates.description = body.description
    if (body.deliverables !== undefined) updates.deliverables = body.deliverables
    if (body.deadline !== undefined) updates.deadline = body.deadline
    
    const { data: deal, error } = await supabase
      .from('deals')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating deal:', error)
      return NextResponse.json(
        { error: 'Failed to update deal' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      message: 'Deal updated successfully',
      deal,
    })
    
  } catch (error) {
    console.error('Error updating deal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}