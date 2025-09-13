import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'
  
  const response = await fetch(`${backendUrl}/api-keys`, {
    headers: {
      'Authorization': authHeader!,
      'Content-Type': 'application/json'
    }
  })
  
  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const body = await request.json()
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'
  
  const response = await fetch(`${backendUrl}/api-keys`, {
    method: 'POST',
    headers: {
      'Authorization': authHeader!,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
  
  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}