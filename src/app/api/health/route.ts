import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'
    
    const response = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    return NextResponse.json({
      frontend: 'healthy',
      backend: response.ok ? 'healthy' : 'unhealthy',
      backend_data: data,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json({
      frontend: 'healthy',
      backend: 'offline',
      backend_data: null,
      timestamp: new Date().toISOString(),
      error: 'Cannot connect to backend'
    }, { status: 503 })
  }
}