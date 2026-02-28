import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'

// PUT - Update creator platforms
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { platforms } = await request.json()
    
    const supabase = createServerSupabase()

    // Delete existing platforms
    await supabase
      .from('creator_platforms')
      .delete()
      .eq('creator_id', id)

    // Insert new platforms
    if (platforms && platforms.length > 0) {
      const platformRecords = platforms.map((p: any) => ({
        creator_id: id,
        platform: p.platform,
        platform_username: p.platform_username || null,
        platform_url: p.platform_url || null,
        followers: p.followers || 0,
      }))

      const { error } = await supabase
        .from('creator_platforms')
        .insert(platformRecords)

      if (error) {
        console.error('Error updating platforms:', error)
        return NextResponse.json(
          { error: 'Failed to update platforms' },
          { status: 500 }
        )
      }
    }

    // Update total followers on creator profile
    const totalFollowers = platforms?.reduce((sum: number, p: any) => sum + (p.followers || 0), 0) || 0
    await supabase
      .from('creators')
      .update({ total_followers: totalFollowers })
      .eq('id', id)

    return NextResponse.json({
      message: 'Platforms updated successfully',
    })

  } catch (error) {
    console.error('Error updating platforms:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}