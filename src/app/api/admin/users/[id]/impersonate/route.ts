import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import jwt from 'jsonwebtoken'

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is required')
  return secret
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const callerRole = request.headers.get('x-user-role') ?? ''
    const callerId = request.headers.get('x-user-id') ?? ''

    if (callerRole !== 'super_admin') {
      return NextResponse.json({ error: 'Only super admins can impersonate users' }, { status: 403 })
    }

    const supabase = createServerSupabase()
    const { data: target, error } = await supabase
      .from('users')
      .select('id, email, user_type, role, is_active')
      .eq('id', params.id)
      .single()

    if (error || !target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!target.is_active) {
      return NextResponse.json({ error: 'Cannot impersonate a suspended user' }, { status: 400 })
    }

    // Prevent impersonating other admins
    const targetRole = (target.role ?? 'user') as string
    if (targetRole === 'admin' || targetRole === 'super_admin') {
      return NextResponse.json({ error: 'Cannot impersonate admin accounts' }, { status: 400 })
    }

    // Get profile ID
    let profileId: string | null = null
    if (target.user_type === 'creator') {
      const { data } = await supabase.from('creators').select('id').eq('user_id', target.id).single()
      profileId = data?.id ?? null
    } else if (target.user_type === 'brand') {
      const { data } = await supabase.from('brands').select('id').eq('user_id', target.id).single()
      profileId = data?.id ?? null
    }

    const token = jwt.sign(
      {
        userId: target.id,
        email: target.email,
        userType: target.user_type,
        role: target.role ?? 'user',
        profileId,
        impersonatedBy: callerId,
      },
      getJwtSecret(),
      { expiresIn: '2h' }
    )

    const dashboardPath = target.user_type === 'creator' ? '/dashboard/creator' : '/dashboard/brand'

    return NextResponse.json({
      token,
      targetUser: { id: target.id, email: target.email, user_type: target.user_type },
      dashboardPath,
    })
  } catch (err) {
    console.error('Impersonation error:', err)
    return NextResponse.json({ error: 'Failed to generate impersonation token' }, { status: 500 })
  }
}
