import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const sp    = new URL(request.url).searchParams
  const key   = process.env.MARKETCHECK_API_KEY || ''
  const make  = sp.get('make')  || 'ford'
  const model = sp.get('model') || 'mustang'
  const zip   = sp.get('zip')   || ''
  const rad   = sp.get('radius') || '250'

  if (!key) return NextResponse.json({ error: 'MARKETCHECK_API_KEY not set' })

  // Test 1: with zip+radius
  const withGeo = new URLSearchParams({ api_key: key, rows: '5', start: '0', make, model })
  if (zip) { withGeo.set('zip', zip); withGeo.set('radius', rad) }
  const url1 = `https://mc-api.marketcheck.com/v2/search/car/active?${withGeo}`

  // Test 2: without zip+radius
  const noGeo = new URLSearchParams({ api_key: key, rows: '5', start: '0', make, model })
  const url2 = `https://mc-api.marketcheck.com/v2/search/car/active?${noGeo}`

  const [r1, r2] = await Promise.all([
    fetch(url1, { cache: 'no-store' }).then(async r => ({
      status: r.status,
      body: await r.text().then(t => { try { return JSON.parse(t) } catch { return t } })
    })).catch(e => ({ status: 'EXCEPTION', body: String(e) })),
    fetch(url2, { cache: 'no-store' }).then(async r => ({
      status: r.status,
      body: await r.text().then(t => { try { return JSON.parse(t) } catch { return t } })
    })).catch(e => ({ status: 'EXCEPTION', body: String(e) })),
  ])

  return NextResponse.json({
    keySet: !!key,
    keyPrefix: key.slice(0, 8),
    make, model, zip, radius: rad,
    withGeo: {
      url: url1.replace(key, 'KEY'),
      status: r1.status,
      num_found: (r1.body as any)?.num_found ?? 'N/A',
      listingsCount: Array.isArray((r1.body as any)?.listings) ? (r1.body as any).listings.length : 0,
      rawPreview: typeof r1.body === 'string' ? r1.body.slice(0, 400) : JSON.stringify(r1.body).slice(0, 400),
    },
    noGeo: {
      url: url2.replace(key, 'KEY'),
      status: r2.status,
      num_found: (r2.body as any)?.num_found ?? 'N/A',
      listingsCount: Array.isArray((r2.body as any)?.listings) ? (r2.body as any).listings.length : 0,
      rawPreview: typeof r2.body === 'string' ? r2.body.slice(0, 400) : JSON.stringify(r2.body).slice(0, 400),
    },
  })
}
