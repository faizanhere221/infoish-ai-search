import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { logActivity } from '@/lib/activity'

const createSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(8),
  role:     z.enum(['admin', 'super_admin']).default('admin'),
})

function isSuperAdmin(request: NextRequest) {
  return request.headers.get('x-user-role') === 'super_admin'
}

export async function GET(request: NextRequest) {
  if (!isSuperAdmin(request)) {
    return NextResponse.json({ error: 'Super admin only' }, { status: 403 })
  }

  try {
    const supabase = createServerSupabase()
    const { data: admins, error } = await supabase
      .from('users')
      .select('id, email, role, is_active, created_at, last_login_at')
      .in('role', ['admin', 'super_admin'])
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ admins: admins ?? [] })
  } catch (err) {
    console.error('List admins error:', err)
    return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!isSuperAdmin(request)) {
    return NextResponse.json({ error: 'Super admin only' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 })
    }

    const { email, password, role } = parsed.data
    const adminId = request.headers.get('x-user-id') ?? undefined
    const supabase = createServerSupabase()

    // Check if user already exists
    const { data: existing } = await supabase
      .from('users').select('id').eq('email', email.toLowerCase()).single()
    if (existing) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 })
    }

    const password_hash = await bcrypt.hash(password, 12)

    const { data: newAdmin, error } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash,
        user_type: 'admin',
        role,
        is_active: true,
        email_verified: true,
      })
      .select('id, email, role, created_at')
      .single()

    if (error) throw error

    void logActivity({
      userId: adminId,
      action: 'admin_created',
      entityType: 'user',
      entityId: newAdmin?.id,
      details: { email, role },
    })

    return NextResponse.json({ admin: newAdmin }, { status: 201 })
  } catch (err) {
    console.error('Create admin error:', err)
    return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 })
  }
}
