import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { createNotification, getUserIdFromBrand } from '@/lib/notifications'

interface RouteParams {
  params: { id: string }
}

// POST /api/deals/[id]/decline - Creator declines deal
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params
    const supabase = createServerSupabase()

    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    if (!callerProfileId || callerUserType !== 'creator') {
      return NextResponse.json(
        { error: 'Only creators can decline deals' },
        { status: 403 }
      )
    }

    const { data: deal } = await supabase
      .from('deals')
      .select('*')
      .eq('id', id)
      .single()

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    if (deal.creator_id !== callerProfileId) {
      return NextResponse.json(
        { error: 'You are not authorized to decline this deal' },
        { status: 403 }
      )
    }

    if (deal.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot decline deal with status: ${deal.status}` },
        { status: 400 }
      )
    }

    const { data: updatedDeal, error } = await supabase
      .from('deals')
      .update({
        status: 'declined',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error declining deal:', error)
      return NextResponse.json({ error: 'Failed to decline deal' }, { status: 500 })
    }

    if (deal.conversation_id) {
      await supabase.from('messages').insert({
        conversation_id: deal.conversation_id,
        sender_id: deal.creator_id,
        sender_type: 'creator',
        content: `❌ Deal declined: "${deal.title}"`,
        is_system_message: true,
        attachments: [],
      })
    }

    const brandUserId = await getUserIdFromBrand(supabase, deal.brand_id)
    if (brandUserId) {
      await createNotification(supabase, {
        userId: brandUserId,
        type: 'deal_declined',
        title: 'Deal declined',
        message: `Your deal "${deal.title}" was declined by the creator.`,
        link: `/dashboard/deals/${id}`,
      })
    }

    return NextResponse.json({ message: 'Deal declined', deal: updatedDeal })

  } catch (error) {
    console.error('Error declining deal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
