import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'

interface RouteParams {
  params: { id: string }
}

// POST /api/deals/[id]/approve - Brand approves delivery and releases payment
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params
    const supabase = createServerSupabase()

    // Get authenticated brand's profile ID from middleware-injected header
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    if (!callerProfileId || callerUserType !== 'brand') {
      return NextResponse.json(
        { error: 'Only brands can approve deals' },
        { status: 403 }
      )
    }

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

    // Verify the authenticated user is the brand on this deal
    if (deal.brand_id !== callerProfileId) {
      return NextResponse.json(
        { error: 'You are not authorized to approve this deal' },
        { status: 403 }
      )
    }

    // Verify deal is in delivered status
    if (deal.status !== 'delivered') {
      return NextResponse.json(
        { error: `Cannot approve deal with status: ${deal.status}` },
        { status: 400 }
      )
    }
    
    // TODO: Process Stripe payout to creator
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    // await stripe.transfers.create({
    //   amount: deal.creator_payout_cents,
    //   currency: 'usd',
    //   destination: creator.stripe_account_id,
    //   transfer_group: deal.id,
    // })
    
    // Update deal status
    const { data: updatedDeal, error } = await supabase
      .from('deals')
      .update({
        status: 'completed',
        approved_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error approving deal:', error)
      return NextResponse.json(
        { error: 'Failed to approve deal' },
        { status: 500 }
      )
    }
    
    // Update creator stats
    const { data: creator } = await supabase
      .from('creators')
      .select('total_deals_completed, total_earnings')
      .eq('id', deal.creator_id)
      .single()
    
    if (creator) {
      await supabase
        .from('creators')
        .update({
          total_deals_completed: (creator.total_deals_completed || 0) + 1,
          total_earnings: (creator.total_earnings || 0) + deal.creator_payout_cents,
        })
        .eq('id', deal.creator_id)
    }
    
    // Update brand stats
    const { data: brand } = await supabase
      .from('brands')
      .select('total_deals, total_spent')
      .eq('id', deal.brand_id)
      .single()
    
    if (brand) {
      await supabase
        .from('brands')
        .update({
          total_deals: (brand.total_deals || 0) + 1,
          total_spent: (brand.total_spent || 0) + deal.amount_cents,
        })
        .eq('id', deal.brand_id)
    }
    
    // Create system message in conversation
    if (deal.conversation_id) {
      await supabase
        .from('messages')
        .insert({
          conversation_id: deal.conversation_id,
          sender_id: deal.brand_id,
          sender_type: 'brand',
          content: `✅ Deal completed! Payment of ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(deal.creator_payout_cents / 100)} has been released.`,
          is_system_message: true,
          attachments: [],
        })
    }
    
    // TODO: Send email notifications
    
    return NextResponse.json({
      message: 'Deal approved and payment released',
      deal: updatedDeal,
    })
    
  } catch (error) {
    console.error('Error approving deal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}