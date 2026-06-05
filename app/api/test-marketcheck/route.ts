import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const mcKey = process.env.MARKETCHECK_API_KEY
  const ebayId = process.env.EBAY_APP_ID

  const result: Record<string, any> = {
    env: {
      MARKETCHECK_API_KEY: mcKey
        ? `SET — first 8 chars: "${mcKey.slice(0, 8)}..." (total length: ${mcKey.length})`
        : 'MISSING — env var not found in Vercel',
      EBAY_APP_ID: ebayId
        ? `SET — first 8 chars: "${ebayId.slice(0, 8)}..." (total length: ${ebayId.length})`
        : 'MISSING',
    },
    v2_bare: null,
    v2_with_make: null,
    v1_bare: null,
  }

  if (!mcKey) {
    result.diagnosis = 'MARKETCHECK_API_KEY is not set in Vercel env vars. Go to Vercel → Project → Settings → Environment Variables and add it.'
    return NextResponse.json(result, { status: 200 })
  }

  // ── Test 1: v2 bare — rows=5 no other filters ──────────────
  const v2Url = `https://mc-api.marketcheck.com/v2/search/car/active?api_key=${mcKey}&rows=5&start=0`
  result.v2_url_called = v2Url.replace(mcKey, '[KEY_HIDDEN]')

  try {
    const v2Res = await fetch(v2Url, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })
    const v2Text = await v2Res.text()
    let v2Json: any = null
    try { v2Json = JSON.parse(v2Text) } catch { /* not JSON */ }

    result.v2_bare = {
      status: v2Res.status,
      statusText: v2Res.statusText,
      headers: {
        'content-type': v2Res.headers.get('content-type'),
        'x-ratelimit-limit': v2Res.headers.get('x-ratelimit-limit'),
        'x-ratelimit-remaining': v2Res.headers.get('x-ratelimit-remaining'),
      },
      body_json: v2Json,
      body_raw_if_not_json: v2Json ? null : v2Text.slice(0, 500),
      num_found: v2Json?.num_found ?? null,
      listings_returned: v2Json?.listings?.length ?? null,
    }
  } catch (e: any) {
    result.v2_bare = { error: e?.message ?? String(e) }
  }

  // ── Test 2: v2 with make=Ford ───────────────────────────────
  const v2FordUrl = `https://mc-api.marketcheck.com/v2/search/car/active?api_key=${mcKey}&make=Ford&rows=5&start=0`
  result.v2_ford_url_called = v2FordUrl.replace(mcKey, '[KEY_HIDDEN]')

  try {
    const v2Ford = await fetch(v2FordUrl, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })
    const body = await v2Ford.json().catch(() => null)
    result.v2_with_make = {
      status: v2Ford.status,
      num_found: body?.num_found ?? null,
      listings_returned: body?.listings?.length ?? null,
      error: body?.error ?? body?.message ?? body?.errors ?? null,
      first_listing_sample: body?.listings?.[0]
        ? {
            id: body.listings[0].id,
            year: body.listings[0].build?.year,
            make: body.listings[0].build?.make,
            model: body.listings[0].build?.model,
            price: body.listings[0].price,
            dealer: body.listings[0].dealer?.name,
          }
        : null,
    }
  } catch (e: any) {
    result.v2_with_make = { error: e?.message ?? String(e) }
  }

  // ── Test 3: v1 alternative endpoint ────────────────────────
  const v1Url = `https://marketcheck-prod.apigee.net/v1/search?api_key=${mcKey}&rows=5`
  result.v1_url_called = v1Url.replace(mcKey, '[KEY_HIDDEN]')

  try {
    const v1Res = await fetch(v1Url, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })
    const v1Text = await v1Res.text()
    let v1Json: any = null
    try { v1Json = JSON.parse(v1Text) } catch { /* not JSON */ }

    result.v1_bare = {
      status: v1Res.status,
      statusText: v1Res.statusText,
      body_json: v1Json,
      body_raw_if_not_json: v1Json ? null : v1Text.slice(0, 500),
      num_found: v1Json?.num_found ?? null,
      listings_returned: v1Json?.listings?.length ?? null,
    }
  } catch (e: any) {
    result.v1_bare = { error: e?.message ?? String(e) }
  }

  // ── Diagnosis ───────────────────────────────────────────────
  const v2Status = result.v2_bare?.status
  const numFound = result.v2_bare?.num_found
  if (v2Status === 200 && numFound > 0) {
    result.diagnosis = `API key works. v2 bare call found ${numFound} total listings, returned ${result.v2_bare.listings_returned}. The car-search route filters may still be too narrow.`
  } else if (v2Status === 401 || v2Status === 403) {
    result.diagnosis = 'API key is INVALID or UNAUTHORIZED. Check the key value in Vercel env vars.'
  } else if (v2Status === 429) {
    result.diagnosis = 'RATE LIMITED / QUOTA EXCEEDED. The Marketcheck plan quota is used up.'
  } else if (v2Status === 200 && numFound === 0) {
    result.diagnosis = 'API responded OK but found 0 listings with no filters. Likely a plan restriction — the free/trial plan may not include the active listings endpoint.'
  } else {
    result.diagnosis = `Unexpected response: status=${v2Status}. Check v2_bare.body_json for the error message.`
  }

  return NextResponse.json(result, {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
