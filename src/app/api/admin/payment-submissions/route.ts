import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(request: NextRequest) {
  try {
    const submissionsFile = join(process.cwd(), 'data', 'payment-submissions.json')
    
    let submissions = []
    try {
      const data = await readFile(submissionsFile, 'utf8')
      submissions = JSON.parse(data)
    } catch (error) {
      // File doesn't exist yet, return empty array
    }

    // Sort by submitted date (newest first)
    submissions.sort((a: any, b: any) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())

    return NextResponse.json({ submissions })
  } catch (error) {
    console.error('Error loading submissions:', error)
    return NextResponse.json({ error: 'Failed to load submissions' }, { status: 500 })
  }
}