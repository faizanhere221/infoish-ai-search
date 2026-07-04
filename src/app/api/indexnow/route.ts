import { NextRequest, NextResponse } from 'next/server'

const INDEXNOW_KEY = 'd94ec912c9a1166b2d955b8cd7f61f63'
const HOST = 'infoishai.com'
const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'

// POST { urls: string[] } - submit one or more absolute or relative URLs to IndexNow
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const input: string[] = Array.isArray(body?.urls) ? body.urls : []

    if (input.length === 0) {
      return NextResponse.json({ error: 'No URLs provided' }, { status: 400 })
    }

    const urlList = input
      .slice(0, 10000)
      .map((u) => (u.startsWith('http') ? u : `https://${HOST}${u.startsWith('/') ? u : `/${u}`}`))

    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: HOST,
        key: INDEXNOW_KEY,
        keyLocation: KEY_LOCATION,
        urlList,
      }),
    })

    return NextResponse.json(
      { success: res.ok, status: res.status, submitted: urlList.length },
      { status: res.ok ? 200 : 502 }
    )
  } catch (error) {
    console.error('IndexNow submission error:', error)
    return NextResponse.json({ error: 'Failed to submit to IndexNow' }, { status: 500 })
  }
}
