import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'

interface RouteParams {
  params: { id: string }
}

// POST /api/deals/[id]/accept - Creator accepts deal
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params
    const supabase = createServerSupabase()
    
    // Get the deal
    const { data: deal } = await supabase
      .from('deals')
      .select('*')
      .eq('id', id)
      .single()
    
    if (!deal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      )
    }
    
    // Verify deal is in pending status
    if (deal.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot accept deal with status: ${deal.status}` },
        { status: 400 }
      )
    }
    
    // TODO: Verify the requester is the creator of this deal
    
    // Update deal status
    const { data: updatedDeal, error } = await supabase
      .from('deals')
      .update({
        status: 'in_progress',
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error accepting deal:', error)
      return NextResponse.json(
        { error: 'Failed to accept deal' },
        { status: 500 }
      )
    }
    
    // Create system message in conversation
    if (deal.conversation_id) {
      await supabase
        .from('messages')
        .insert({
          conversation_id: deal.conversation_id,
          sender_id: deal.creator_id,
          sender_type: 'creator',
          content: `✅ Deal accepted! Work has begun on: ${deal.title}`,
          is_system_message: true,
          attachments: [],
        })
    }
    
    // TODO: Trigger payment processing (create Stripe PaymentIntent)
    
    return NextResponse.json({
      message: 'Deal accepted successfully',
      deal: updatedDeal,
    })
    
  } catch (error) {
    console.error('Error accepting deal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}