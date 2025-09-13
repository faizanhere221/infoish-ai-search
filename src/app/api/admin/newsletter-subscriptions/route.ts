import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET() {
  try {
    const subscriptionsFile = join(process.cwd(), 'data', 'newsletter-subscriptions.json')
    
    let subscriptions = []
    try {
      const data = await readFile(subscriptionsFile, 'utf8')
      subscriptions = JSON.parse(data)
    } catch (error) {
      // File doesn't exist yet
    }

    return NextResponse.json({ subscriptions })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load subscriptions' }, { status: 500 })
  }
}