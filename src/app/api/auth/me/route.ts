import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    // Use server-side environment variable first
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'https://infoish-ai-search-production.up.railway.app'
        
    const response = await fetch(`${backendUrl}/auth/me`, {
      headers: {
        'Authorization': authHeader || '',
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (response.ok) {
      return NextResponse.json(data)
    } else {
      return NextResponse.json(data, { status: response.status })
    }
   
  } catch (error) {
    console.error('Auth API error:', error) // Add logging
    return NextResponse.json(
      { error: 'Cannot connect to authentication server' },
      { status: 503 }
    )
  }
}