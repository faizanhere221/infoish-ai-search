import { NextRequest, NextResponse } from 'next/server'

// IndexNow key verification file lives at public/{key}.txt — see
// https://www.indexnow.org/. Submitting URLs here tells Bing, Yandex, and
// other participating search engines to re-crawl them right away instead
// of waiting for their next scheduled pass.
const INDEXNOW_KEY = '3bd5616de61c4aa694ca4c2708a83c69'
const HOST = 'infoishai.com'
const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`

// POST /api/indexnow - submit one or more of this site's URLs to IndexNow
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const urls: string[] = Array.isArray(body?.urls)
      ? body.urls
      : typeof body?.url === 'string'
        ? [body.url]
        : []

    if (urls.length === 0) {
      return NextResponse.json(
        { error: 'Provide a "url" string or "urls" array of absolute URLs' },
        { status: 400 }
      )
    }

    if (urls.length > 10000) {
      return NextResponse.json(
        { error: 'IndexNow accepts a maximum of 10,000 URLs per submission' },
        { status: 400 }
      )
    }

    const invalid = urls.filter((u) => {
      try {
        return new URL(u).host !== HOST
      } catch {
        return true
      }
    })
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: `All URLs must be absolute and belong to ${HOST}`, invalid },
        { status: 400 }
      )
    }

    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: HOST,
        key: INDEXNOW_KEY,
        keyLocation: KEY_LOCATION,
        urlList: urls,
      }),
    })

    // IndexNow returns 200 or 202 on success
    if (!response.ok && response.status !== 202) {
      const text = await response.text().catch(() => '')
      console.error('IndexNow submission failed:', response.status, text)
      return NextResponse.json(
        { error: 'IndexNow submission failed', status: response.status },
        { status: 502 }
      )
    }

    return NextResponse.json({ message: 'Submitted to IndexNow', count: urls.length })
  } catch (error) {
    console.error('IndexNow route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
