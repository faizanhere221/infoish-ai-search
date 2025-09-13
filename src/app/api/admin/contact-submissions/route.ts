import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET() {
  try {
    const contactsFile = join(process.cwd(), 'data', 'contact-submissions.json')
    
    let submissions = []
    try {
      const data = await readFile(contactsFile, 'utf8')
      submissions = JSON.parse(data)
    } catch (error) {
      // File doesn't exist yet
    }

    return NextResponse.json({ submissions })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load submissions' }, { status: 500 })
  }
}