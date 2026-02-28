import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, user_type } = body

    // Validate required fields
    if (!email || !password || !user_type) {
      return NextResponse.json(
        { error: 'Email, password, and user_type are required' },
        { status: 400 }
      )
    }

    // Validate user_type
    if (!['creator', 'brand'].includes(user_type)) {
      return NextResponse.json(
        { error: 'Invalid user_type. Must be "creator" or "brand"' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12)

    // Create user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash,
        user_type,
        email_verified: false,
        is_active: true,
      })
      .select()
      .single()

    if (userError) {
      console.error('Error creating user:', userError)
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Return user without sensitive data
    const { password_hash: _, ...safeUser } = user

    return NextResponse.json({
      message: 'User registered successfully',
      user: safeUser,
    }, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}