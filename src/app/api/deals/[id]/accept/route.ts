import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { createNotification, getUserIdFromBrand } from '@/lib/notifications'

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

    // Get authenticated creator's profile ID from middleware-injected header
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    if (!callerProfileId || callerUserType !== 'creator') {
      return NextResponse.json(
        { error: 'Only creators can accept deals' },
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

    // Verify the authenticated user is the creator on this deal
    if (deal.creator_id !== callerProfileId) {
      return NextResponse.json(
        { error: 'You are not authorized to accept this deal' },
        { status: 403 }
      )
    }

    // Verify deal is in pending status
    if (deal.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot accept deal with status: ${deal.status}` },
        { status: 400 }
      )
    }

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

    // Notify the brand that the creator accepted
    const brandUserId = await getUserIdFromBrand(supabase, deal.brand_id)
    if (brandUserId) {
      await createNotification(supabase, {
        userId: brandUserId,
        type: 'deal_accepted',
        title: 'Deal accepted',
        message: `Your deal "${deal.title}" has been accepted. Work is now in progress.`,
        link: `/dashboard/deals/${id}`,
      })
    }

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
