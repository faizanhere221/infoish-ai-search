import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'
    
    // Determine endpoint based on platform filter
    const platform = searchParams.get('platform')
    const endpoint = platform === 'youtube' ? '/search/youtube' : '/search/influencers'
    
    console.log(`Calling: ${backendUrl}${endpoint}?${searchParams.toString()}`)
    
    const response = await fetch(`${backendUrl}${endpoint}?${searchParams.toString()}`, {
      headers: {
        'Authorization': authHeader,
        'X-API-Key': 'test_key_123',
        'Content-Type': 'application/json'
      }
    })
    
    const data = await response.json()
    
    if (response.ok) {
      return NextResponse.json(data)
    } else {
      return NextResponse.json(data, { status: response.status })
    }
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Search failed' }, 
      { status: 500 }
    )
  }
}