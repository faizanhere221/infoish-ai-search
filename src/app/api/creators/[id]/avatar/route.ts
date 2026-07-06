import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE = 2 * 1024 * 1024 // 2MB

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const callerUserId = request.headers.get('x-user-id')
    const supabase = createServerSupabase()

    const { data: creator } = await supabase
      .from('creators')
      .select('user_id, profile_photo_url')
      .eq('id', id)
      .single()

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    if (creator.user_id !== callerUserId) {
      return NextResponse.json({ error: 'You are not authorized to update this profile' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'File must be a JPG, PNG, GIF, or WEBP image' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File must be 2MB or smaller' }, { status: 400 })
    }

    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${id}/${Date.now()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, buffer, { contentType: file.type, upsert: true })

    if (uploadError) {
      console.error('Avatar upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
    }

    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(path)
    const avatarUrl = publicUrlData.publicUrl

    const { error: updateError } = await supabase
      .from('creators')
      .update({ profile_photo_url: avatarUrl })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating profile_photo_url:', updateError)
      return NextResponse.json({ error: 'Failed to save avatar URL' }, { status: 500 })
    }

    return NextResponse.json({ profile_photo_url: avatarUrl })
  } catch (error) {
    console.error('Avatar upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
