import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'

interface RouteParams {
  params: { id: string }
}

// POST /api/deals/[id]/deliver - Creator submits delivery
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params
    const body = await request.json()
    const { message } = body // Optional delivery message
    
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
    
    // Verify deal is in correct status
    if (!['in_progress', 'revision'].includes(deal.status)) {
      return NextResponse.json(
        { error: `Cannot deliver deal with status: ${deal.status}` },
        { status: 400 }
      )
    }
    
    // TODO: Verify the requester is the creator of this deal
    
    // Define deliverable type
    interface DeliverableItem {
      id: string
      description: string
      is_completed: boolean
      completed_at?: string
    }
    
    // Check all deliverables are marked complete
    const deliverables = (deal.deliverables || []) as DeliverableItem[]
    const incompleteDeliverables = deliverables.filter((d: DeliverableItem) => !d.is_completed)
    
    if (incompleteDeliverables.length > 0) {
      return NextResponse.json(
        { error: 'All deliverables must be marked as complete before submitting' },
        { status: 400 }
      )
    }
    
    // Update deal status
    const { data: updatedDeal, error } = await supabase
      .from('deals')
      .update({
        status: 'delivered',
        delivered_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error delivering deal:', error)
      return NextResponse.json(
        { error: 'Failed to submit delivery' },
        { status: 500 }
      )
    }
    
    // Create system message in conversation
    if (deal.conversation_id) {
      const deliveryMessage = message 
        ? `📦 Delivery submitted for "${deal.title}"\n\nMessage: ${message}`
        : `📦 Delivery submitted for "${deal.title}". Please review and approve.`
      
      await supabase
        .from('messages')
        .insert({
          conversation_id: deal.conversation_id,
          sender_id: deal.creator_id,
          sender_type: 'creator',
          content: deliveryMessage,
          is_system_message: true,
          attachments: [],
        })
    }
    
    // TODO: Send email notification to brand
    
    return NextResponse.json({
      message: 'Delivery submitted successfully',
      deal: updatedDeal,
    })
    
  } catch (error) {
    console.error('Error delivering deal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}